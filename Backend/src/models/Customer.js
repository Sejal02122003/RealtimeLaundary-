const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true },
  referralCode: { type: String, required: true, unique: true },
  sponsor: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  walletBalance: { type: Number, default: 0 },
  joinedAt: { type: Date, required: true, index: true },
  demo: Boolean,
});

module.exports = { Customer: mongoose.model('Customer', customerSchema) };
