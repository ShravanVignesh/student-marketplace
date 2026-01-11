console.log("SERVER FILE LOADED:", __filename);

require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const listingRoutes = require("./routes/listingRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:5173",
    credentials: true,
  })
);

console.log("MONGO_URI:", process.env.MONGO_URI);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// Basic route
app.get("/", (req, res) => {
  res.send("Server & MongoDB are connected!");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
