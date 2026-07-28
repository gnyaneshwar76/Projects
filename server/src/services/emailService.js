const nodemailer = require('nodemailer');

// Configure Nodemailer with Direct Gmail SMTP for reliability
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: (process.env.EMAIL_USER || "").trim(),
    pass: (process.env.EMAIL_PASS || "").trim()
  }
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection Error:", error.message);
  } else {
    console.log("✅ SMTP Ready: TraceStack is prepared to send emails.");
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"TraceStack Security" <${process.env.EMAIL_USER || 'noreply@tracestack.com'}>`,
      to,
      subject,
      html
    };

    // If no credentials, log the HTML instead of crashing immediately to allow dev testing
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️ MOCK EMAIL SENT (Missing EMAIL_USER/EMAIL_PASS in .env)");
      console.log(`To: ${to}\nSubject: ${subject}\nBody:\n${html.replace(/<[^>]*>?/gm, '')}`);
      return true;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.response}`);
    return info;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

module.exports = {
  sendEmail,
};
