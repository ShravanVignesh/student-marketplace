const mongoose = require('mongoose');
const User = require('./server/models/user');
const VerificationToken = require('./server/models/verificationToken');
const { makeToken, hashToken } = require('./server/utils/crypto');
require('dotenv').config({ path: './server/.env' });

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    let user = await User.findOne({ email: 'test_verify@test.ac.uk' });

    user.isVerified = false;
    await user.save();
    await VerificationToken.deleteMany({ userId: user._id });

    const token = makeToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await VerificationToken.create({ userId: user._id, tokenHash, expiresAt });

    console.log(`URL: http://localhost:5173/verify?id=${user._id}&token=${token}`);
    process.exit(0);
}

run().catch(console.error);
