const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logSecurityEvent, EVENTS } = require('../services/securityService');

const rpID = 'localhost';
const origin = `http://${rpID}:3000`;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ─── REGISTRATION CEREMONY ────────────────────────────────────────────────
const getRegistrationOptions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const options = await generateRegistrationOptions({
      rpName: 'TraceStack',
      rpID,
      userID: user._id.toString(),
      userName: user.email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Store challenge in session
    req.session.currentChallenge = options.challenge;
    res.json(options);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyRegistration = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const expectedChallenge = req.session.currentChallenge;

    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Challenge expired or not found' });
    }

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified) {
      const { registrationInfo } = verification;
      const { credentialPublicKey, credentialID, counter } = registrationInfo;

      user.passkeys.push({
        credentialID: Buffer.from(credentialID),
        publicKey: Buffer.from(credentialPublicKey),
        counter,
        deviceType: registrationInfo.credentialDeviceType,
        backedUp: registrationInfo.credentialBackedUp,
        transports: req.body.response.transports,
      });

      await user.save();
      req.session.currentChallenge = undefined; // Clear challenge
      logSecurityEvent(EVENTS.PASSKEY_REG_SUCCESS, { email: user.email, deviceType: registrationInfo.credentialDeviceType });
      res.json({ verified: true });
    } else {
      req.session.currentChallenge = undefined;
      logSecurityEvent(EVENTS.SUSPICIOUS_ACTIVITY, { userId: user._id, reason: 'Passkey registration failed verification' });
      res.status(400).json({ verified: false, error: 'Verification failed' });
    }
  } catch (error) {
    req.session.currentChallenge = undefined;
    res.status(500).json({ error: error.message });
  }
};

// ─── AUTHENTICATION CEREMONY ──────────────────────────────────────────────
const getAuthenticationOptions = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    
    if (!user || user.passkeys.length === 0) {
      return res.status(404).json({ error: 'No passkeys found for this user' });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.passkeys.map(key => ({
        id: key.credentialID,
        type: 'public-key',
        transports: key.transports,
      })),
      userVerification: 'preferred',
    });

    // Store challenge and email in session
    req.session.currentChallenge = options.challenge;
    req.session.authEmail = user.email;

    res.json(options);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyAuthentication = async (req, res) => {
  try {
    const email = req.session.authEmail;
    const expectedChallenge = req.session.currentChallenge;

    if (!email || !expectedChallenge) {
      return res.status(400).json({ error: 'Authentication session expired' });
    }

    const user = await User.findOne({ email });
    const dbPasskey = user.passkeys.find(key => 
      Buffer.from(req.body.id, 'base64').equals(key.credentialID) ||
      req.body.id === key.credentialID.toString('base64url')
    );

    if (!dbPasskey) return res.status(400).json({ error: 'Passkey not recognized' });

    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: dbPasskey.credentialID,
        credentialPublicKey: dbPasskey.publicKey,
        counter: dbPasskey.counter,
      },
    });

    if (verification.verified) {
      // Update counter for replay protection
      dbPasskey.counter = verification.authenticationInfo.newCounter;
      await user.save();

      // Clear session
      req.session.currentChallenge = undefined;
      req.session.authEmail = undefined;

      // Issue JWT DIRECTLY (Skip OTP)
      const token = jwt.sign(
        { id: user._id, version: user.tokenVersion || 0 },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logSecurityEvent(EVENTS.PASSKEY_AUTH_SUCCESS, { email: user.email });

      res.json({
        verified: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      req.session.currentChallenge = undefined;
      req.session.authEmail = undefined;
      logSecurityEvent(EVENTS.AUTH_FAIL, { email, reason: 'Passkey authentication failed verification' });
      res.status(400).json({ verified: false, error: 'Verification failed' });
    }
  } catch (error) {
    req.session.currentChallenge = undefined;
    req.session.authEmail = undefined;
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
};
