console.log("SERVER FILE LOADED:", __filename);

require("dotenv").config({ path: __dirname + "/.env" });

const path = require("path");
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const listingRoutes = require("./routes/listingRoutes");
const chatRoutes = require("./routes/chatRoutes");

const Conversation = require("./models/conversation");
const Message = require("./models/message");

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:5173",
  process.env.APP_URL,
].filter(Boolean);

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Health check endpoint for UptimeRobot
app.get("/ping", (req, res) => res.status(200).send("pong"));

console.log("MONGO_URI:", process.env.MONGO_URI);

// Serve uploaded images publicly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection failed:", err));

// Basic route
app.get("/", (req, res) => {
  res.send("Server & MongoDB are connected!");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/chat", chatRoutes);

// ─── HTTP + Socket.IO ───
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Socket.IO JWT auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.userId || payload.sub || payload.id;
    if (!userId) return next(new Error("Invalid token payload"));
    socket.userId = userId;
    next();
  } catch (err) {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.userId}`);

  // Join all conversations this user is part of
  socket.on("join-conversations", async () => {
    try {
      const conversations = await Conversation.find({
        participants: socket.userId,
      });
      conversations.forEach((c) => {
        socket.join(c._id.toString());
      });
    } catch (err) {
      console.error("join-conversations error:", err.message);
    }
  });

  // Join a specific conversation room
  socket.on("join-room", (conversationId) => {
    socket.join(conversationId);
  });

  // Send a message
  socket.on("send-message", async (data, callback) => {
    try {
      const { conversationId, text } = data;
      if (!conversationId || !text?.trim()) {
        return callback?.({ error: "conversationId and text are required" });
      }

      // Verify user is a participant
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return callback?.({ error: "Conversation not found" });

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === socket.userId
      );
      if (!isParticipant) return callback?.({ error: "Not a participant" });

      // Save message
      const message = await Message.create({
        conversation: conversationId,
        sender: socket.userId,
        text: text.trim(),
      });

      // Update conversation lastMessage & updatedAt
      conversation.lastMessage = text.trim().slice(0, 100);
      conversation.updatedAt = new Date();
      await conversation.save();

      // Populate sender info
      const populated = await Message.findById(message._id).populate(
        "sender",
        "name"
      );

      // Emit to everyone in the conversation room
      io.to(conversationId).emit("new-message", populated);

      callback?.({ success: true, message: populated });
    } catch (err) {
      console.error("send-message error:", err.message);
      callback?.({ error: err.message });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.userId}`);
  });
});

httpServer.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
