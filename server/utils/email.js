const brevo = require('@getbrevo/brevo');

function emailConfigured() {
  return !!process.env.BREVO_API_KEY;
}

async function sendVerificationEmail({ to, name, verifyUrl }) {
  if (!emailConfigured()) {
    console.log(" Brevo not configured. Skipping email send.");
    console.log(" Verification URL (manual):", verifyUrl);
    return;
  }

  const defaultClient = brevo.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  const apiInstance = new brevo.TransactionalEmailsApi();
  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.subject = "Verify your student marketplace account";
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Hi ${name},</h2>
      <p>Please verify your email to activate your account.</p>
      <p><a href="${verifyUrl}">Verify my account</a></p>
      <p>If you did not create this account, you can ignore this email.</p>
    </div>
  `;
  sendSmtpEmail.sender = {
    name: "Student Marketplace",
    email: process.env.FROM_EMAIL || "no-reply@studentmarketplace.com"
  };
  sendSmtpEmail.to = [{ email: to, name }];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Brevo API email sent successfully to", to, "messageId:", data.messageId);
  } catch (error) {
    console.error("❌ Failed to send Brevo verification email to", to);
    // Log the actual response body from Brevo if available
    console.error("BREVO ERROR DETAILS:", error.response?.text || error.message);
  }
}

module.exports = { sendVerificationEmail };
