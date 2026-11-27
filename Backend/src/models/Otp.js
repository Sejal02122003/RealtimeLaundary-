const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  sentAt: { type: Date, required: true },
  // Sends are counted per window to limit guessing across resends.
  sends: { type: Number, default: 1 },
  windowStart: { type: Date, required: true },
  purgeAt: { type: Date, required: true, expires: 0 },
});

module.exports = { Otp: mongoose.model('DriverOtp', otpSchema) };
