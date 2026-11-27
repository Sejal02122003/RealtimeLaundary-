require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectDB } = require('./src/config/db');
const { isOtpDemoMode, DEMO_OTP } = require('./src/config/env');
const { notFound, errorHandler } = require('./src/middleware/errors');
const driverRoutes = require('./src/routes/driver');
const adminRoutes = require('./src/routes/admin');
const { Job } = require('./src/models/Job');

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

app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use(notFound);
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
    // Replaces job indexes left by earlier versions.
    await Job.syncIndexes();
  } catch (err) {
    // Log the error without crashing so local API routes can still be tested if DB is unreachable.
    console.error('MongoDB connection failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    if (isOtpDemoMode()) {
      console.warn(`OTP demo mode is ON: every login OTP is ${DEMO_OTP}. Never use this in production.`);
    }
  });
}

startServer();
