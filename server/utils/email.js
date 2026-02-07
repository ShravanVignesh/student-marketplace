const nodemailer = require("nodemailer");

function smtpConfigured() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // treat placeholders as "not configured"
  if (!host || !user || !pass) return false;
  if (host.includes("your_smtp_") || user.includes("your_smtp_") || pass.includes("your_smtp_")) return false;

  return true;
}

function makeTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendVerificationEmail({ to, name, verifyUrl }) {
  // MVP mode: if SMTP not configured, don't crash registration
  if (!smtpConfigured()) {
    console.log(" SMTP not configured. Skipping email send.");
    console.log(" Verification URL (manual):", verifyUrl);
    return;
  }

  const transporter = makeTransport();
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: "Verify your student marketplace account",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Hi ${name},</h2>
        <p>Please verify your email to activate your account.</p>
        <p><a href="${verifyUrl}">Verify my account</a></p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };
