require('dotenv').config({ path: __dirname + '/.env' });


const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
console.log('MONGO_URI:', process.env.MONGO_URI);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection failed:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('Server & MongoDB are connected!');
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
