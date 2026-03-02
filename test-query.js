const mongoose = require('mongoose');
const Conversation = require('./server/models/conversation');
require('dotenv').config({ path: './server/.env' });

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const c = await Conversation.findOne();
    if (!c) return console.log('no convos');
    const p1 = c.participants[0].toString();
    const p2 = c.participants[1].toString();
    const listingId = c.listing.toString();

    console.log('Testing query for:', p1, p2, listingId);
    const participants = [p1, p2].sort();
    const participantIds = participants.map(id => new mongoose.Types.ObjectId(id));

    // this is exactly how it is in chatController.js
    const found = await Conversation.findOne({
        participants: { $all: participantIds },
        listing: new mongoose.Types.ObjectId(listingId),
    });
    console.log('Result:', found ? 'FOUND' : 'NOT FOUND');
    process.exit(0);
});
