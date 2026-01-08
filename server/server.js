console.log("SERVER FILE LOADED:", __filename);

require('dotenv').config({ path: __dirname + '/.env' });

const cors = require("cors");
const authRoutes = require("./routes/authRoutes");

console.log("✅ authRoutes loaded:", typeof authRoutes);


const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
console.log('MONGO_URI:', process.env.MONGO_URI);

app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:5173",
    credentials: true,
  })
);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection failed:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('Server & MongoDB are connected!');
});

console.log("✅ mounting /api/auth routes now");

app.use("/api/auth", authRoutes);

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
