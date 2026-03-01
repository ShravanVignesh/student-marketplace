const express = require("express");
const router = express.Router();
const chat = require("../controllers/chatController");
const requireAuth = require("../middleware/requireAuth");

// All chat routes require authentication
router.use(requireAuth);

// Start or get existing conversation
router.post("/", chat.startConversation);

// List user's conversations
router.get("/", chat.listConversations);

// Get messages for a conversation
router.get("/:conversationId/messages", chat.getMessages);

module.exports = router;
