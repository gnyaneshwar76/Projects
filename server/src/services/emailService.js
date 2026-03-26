const nodemailer = require('nodemailer');

// Configure Nodemailer with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"BugRadar Security" <${process.env.EMAIL_USER || 'noreply@bugradar.com'}>`,
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
