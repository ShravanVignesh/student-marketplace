const mongoose = require('mongoose');
const User = require('./server/models/user');
const VerificationToken = require('./server/models/verificationToken');
const { makeToken, hashToken } = require('./server/utils/crypto');
const axios = require('axios');
require('dotenv').config({ path: './server/.env' });

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Find or create test user
    let user = await User.findOne({ email: 'test_verify@test.ac.uk' });
    if (!user) {
        console.log('Registering test user via API');
        await axios.post('http://localhost:3000/api/auth/register', {
            name: 'Verify Test',
            email: 'test_verify@test.ac.uk',
            password: 'password123'
        });
        user = await User.findOne({ email: 'test_verify@test.ac.uk' });
    }

    // Force unverified
    user.isVerified = false;
    await user.save();
    await VerificationToken.deleteMany({ userId: user._id });

    // Generate new token
    const token = makeToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await VerificationToken.create({ userId: user._id, tokenHash, expiresAt });

    console.log(`Generated Token: ${token}`);
    console.log(`User ID: ${user._id}`);

    // Now simulate React 18 Strict Mode double-fetch
    console.log('--- Double Fetch ---');
    const p1 = axios.get(`http://localhost:3000/api/auth/verify?id=${user._id}&token=${token}`);
    await new Promise(r => setTimeout(r, 50));
    const p2 = axios.get(`http://localhost:3000/api/auth/verify?id=${user._id}&token=${token}`);

    try {
        const r1 = await p1;
        console.log('R1 status:', r1.status, 'data:', r1.data);
    } catch (e) {
        console.log('R1 error:', e.response?.status, e.response?.data);
    }

    try {
        const r2 = await p2;
        console.log('R2 status:', r2.status, 'data:', r2.data);
    } catch (e) {
        console.log('R2 error:', e.response?.status, e.response?.data);
    }

    process.exit(0);
}

run().catch(console.error);
