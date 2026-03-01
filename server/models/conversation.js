const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        ],
        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing",
            required: true,
        },
        lastMessage: { type: String, default: "" },
        deletedBy: [
            { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        ],
        clearedAt: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                time: { type: Date, default: Date.now }
            },
        ],
    },
    { timestamps: true }
);

// Prevent duplicate conversations for the same buyer-seller-listing combo
conversationSchema.index(
    { participants: 1, listing: 1 },
    { unique: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
