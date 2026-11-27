const mongoose = require('mongoose');

const incentiveSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  awardedAt: { type: Date, required: true },
});

module.exports = { Incentive: mongoose.model('DriverIncentive', incentiveSchema) };
