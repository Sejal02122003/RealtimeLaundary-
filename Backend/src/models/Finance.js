const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;
const customerRef = { type: ObjectId, ref: 'Customer', required: true, index: true };

const walletTransactionSchema = new mongoose.Schema({
  customer: customerRef,
  type: { type: String, enum: ['earning', 'spent', 'refund'], required: true },
  title: { type: String, required: true },
  detail: { type: String, default: '' },
  amount: { type: Number, required: true },
  at: { type: Date, required: true },
  demo: Boolean,
});

const withdrawalSchema = new mongoose.Schema({
  customer: customerRef,
  amount: { type: Number, required: true, min: 1 },
  payTo: {
    method: { type: String, enum: ['upi', 'bank'], required: true },
    account: { type: String, required: true }, // UPI id, or the last 4 digits of a bank account
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, required: true },
  decidedAt: Date,
  demo: Boolean,
});

const commissionSchema = new mongoose.Schema({
  earner: customerRef,
  source: { type: ObjectId, ref: 'Customer', required: true },
  level: { type: Number, required: true },
  orderCode: { type: String, required: true },
  amount: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  createdAt: { type: Date, required: true },
  approvedAt: Date,
  demo: Boolean,
});
// An order pays each member at most once.
commissionSchema.index({ orderCode: 1, earner: 1 }, { unique: true });

const refundSchema = new mongoose.Schema({
  orderCode: { type: String, required: true },
  customer: customerRef,
  amount: { type: Number, required: true, min: 1 },
  reason: { type: String, required: true },
  at: { type: Date, required: true },
  demo: Boolean,
});

const broadcastSchema = new mongoose.Schema({
  audience: { type: String, required: true },
  recipients: { type: Number, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  at: { type: Date, required: true },
  demo: Boolean,
});

module.exports = {
  WalletTransaction: mongoose.model('WalletTransaction', walletTransactionSchema),
  Withdrawal: mongoose.model('Withdrawal', withdrawalSchema),
  Commission: mongoose.model('Commission', commissionSchema),
  Refund: mongoose.model('Refund', refundSchema),
  Broadcast: mongoose.model('Broadcast', broadcastSchema),
};
