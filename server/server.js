console.log("SERVER FILE LOADED:", __filename);

require("dotenv").config({ path: __dirname + "/.env" });

const path = require("path");
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
    origin: [
      "http://localhost:5173",
      process.env.APP_URL
    ].filter(Boolean),
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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
