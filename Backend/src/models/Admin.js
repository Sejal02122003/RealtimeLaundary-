const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
  failedAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
});

const sessionSchema = new mongoose.Schema({
  // Only a hash is stored, so a database leak does not expose usable tokens.
  tokenHash: { type: String, required: true, unique: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

module.exports = {
  Admin: mongoose.model('Admin', adminSchema),
  AdminSession: mongoose.model('AdminSession', sessionSchema),
};
