const nodemailer = require("nodemailer");
require("dotenv").config({ path: "./server/.env" });

async function testEmail() {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
    console.log(`Sending from: ${from}`);
    console.log(`Using SMTP Host: ${process.env.SMTP_HOST}`);

    try {
        const info = await transporter.sendMail({
            from,
            to: "test@example.com", // This doesn't actually need to deliver, just accepting by SMTP is enough to test auth
            subject: "Test Email",
            text: "This is a test email.",
        });
        console.log("Email sent successfully!");
        console.log(info);
    } catch (err) {
        console.error("Email sending failed:");
        console.error(err);
    }
}

testEmail();
