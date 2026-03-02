const { BrevoClient } = require('@getbrevo/brevo');

function emailConfigured() {
  return !!process.env.BREVO_API_KEY;
}

async function sendVerificationEmail({ to, name, verifyUrl }) {
  if (!emailConfigured()) {
    console.log(" Brevo not configured. Skipping email send.");
    console.log(" Verification URL (manual):", verifyUrl);
    return;
  }

  const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

  const payload = {
    subject: "Verify your student marketplace account",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Hi ${name},</h2>
        <p>Please verify your email to activate your account.</p>
        <p><a href="${verifyUrl}">Verify my account</a></p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `,
    sender: {
      name: "Student Marketplace",
      email: process.env.FROM_EMAIL || "no-reply@studentmarketplace.com"
    },
    to: [{ email: to, name }]
  };

  try {
    const data = await client.transactionalEmails.sendTransacEmail(payload);
    console.log("✅ Brevo API email sent successfully to", to, "messageId:", data?._response?.messageId || data);
  } catch (error) {
    console.error("❌ Failed to send Brevo verification email to", to);
    console.error("BREVO ERROR DETAILS:", error.body || error.message || error);
  }
}

module.exports = { sendVerificationEmail };
