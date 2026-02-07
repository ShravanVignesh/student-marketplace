const nodemailer = require('nodemailer');

async function createTestAccount() {
    try {
        const account = await nodemailer.createTestAccount();

        console.log('---------------------------------------------------');
        console.log('✅ Temporary SMTP Credentials Generated (Ethereal)');
        console.log('---------------------------------------------------');
        console.log(`SMTP_HOST=${account.smtp.host}`);
        console.log(`SMTP_PORT=${account.smtp.port}`);
        console.log(`SMTP_USER=${account.user}`);
        console.log(`SMTP_PASS=${account.pass}`);
        console.log('---------------------------------------------------');
        console.log('Copy these lines into your server/.env file to start testing immediately!');
        console.log('Emails sent with these credentials can be viewed at: https://ethereal.email/messages');
    } catch (err) {
        console.error('Failed to create test account:', err.message);
    }
}

createTestAccount();
