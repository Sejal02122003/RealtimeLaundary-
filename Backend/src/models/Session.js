const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  // Only a hash is stored, so a database leak does not expose usable tokens.
  tokenHash: { type: String, required: true, unique: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

module.exports = { Session: mongoose.model('DriverSession', sessionSchema) };
