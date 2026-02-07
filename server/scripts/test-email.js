require("dotenv").config({ path: __dirname + "/../.env" });
const nodemailer = require("nodemailer");

async function testEmail() {
  console.log("Testing SMTP Configuration...");
  console.log("Host:", process.env.SMTP_HOST);
  console.log("User:", process.env.SMTP_USER);

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("ERROR: SMTP credentials missing in .env file");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to self for testing
      subject: "Test Email from Student Marketplace",
      text: "If you see this, your SMTP configuration is working correctly!",
    });

    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
  }
}

testEmail();
