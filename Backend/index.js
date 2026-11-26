require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectDB } = require('./src/config/db');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    dbConnected: mongoose.connection.readyState === 1,
  });
});

async function startServer() {
  try {
    await connectDB();
  } catch (err) {
    // Log the error without crashing so local API routes can still be tested if DB is unreachable.
    console.error('MongoDB connection failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
