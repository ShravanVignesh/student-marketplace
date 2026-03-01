const Conversation = require("../models/conversation");
const Message = require("../models/message");
const Listing = require("../models/listing");

// POST / — Start or get existing conversation
exports.startConversation = async (req, res) => {
    try {
        const { listingId, sellerId } = req.body;
        const buyerId = req.user.id;

        if (!listingId || !sellerId) {
            return res.status(400).json({ message: "listingId and sellerId are required" });
        }

        if (buyerId === sellerId) {
            return res.status(400).json({ message: "Cannot start a conversation with yourself" });
        }

        // Verify listing exists
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        // Sort participant IDs for consistent lookup
        const participants = [buyerId, sellerId].sort();

        // Find existing or create new
        let conversation = await Conversation.findOne({
            participants: { $all: participants, $size: 2 },
            listing: listingId,
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants,
                listing: listingId,
            });
        }

        // Populate for response
        conversation = await Conversation.findById(conversation._id)
            .populate("participants", "name email")
            .populate("listing", "title images price");

        return res.status(200).json({ conversation });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GET / — List user's conversations
exports.listConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate("participants", "name email")
            .populate("listing", "title images price")
            .sort({ updatedAt: -1 });

        return res.json({ conversations });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GET /:conversationId/messages — Get messages
exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        // Verify user is a participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const isParticipant = conversation.participants.some(
            (p) => p.toString() === userId
        );
        if (!isParticipant) {
            return res.status(403).json({ message: "Not a participant" });
        }

        const messages = await Message.find({ conversation: conversationId })
            .populate("sender", "name")
            .sort({ createdAt: 1 });

        return res.json({ messages });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
