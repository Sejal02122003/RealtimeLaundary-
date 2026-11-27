const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    type: { type: String, enum: ['pickup', 'delivery'], required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    // offered -> assigned -> done | missed, or offered -> declined
    status: {
      type: String,
      enum: ['offered', 'assigned', 'done', 'missed', 'declined'],
      default: 'offered',
    },
    day: { type: String, required: true }, // "YYYY-MM-DD"
    slotLabel: { type: String, default: '' }, // pickups, e.g. "10 AM – 12 PM"
    dueAt: { type: Date, required: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      area: { type: String, required: true },
      note: { type: String, default: '' },
    },
    distanceKm: Number,
    service: { type: String, default: '' },

    // Estimated at booking; replaced by the driver's count at pickup.
    bags: { type: Number, default: 1 },
    pieces: { type: Number, default: 1 },
    weightKg: { type: Number, default: 0 },

    otp: { type: String, required: true },
    otpAttempts: { type: Number, default: 0 },
    otpLockedUntil: { type: Date, default: null },

    payment: {
      method: { type: String, enum: ['cod', 'online', 'wallet'], default: 'online' },
      amount: { type: Number, default: 0 },
      cashStatus: { type: String, enum: ['collected', 'partial', 'not_paid', null], default: null },
      collected: { type: Number, default: 0 },
      depositedAt: { type: Date, default: null },
    },

    photo: String,
    earning: { type: Number, default: 0 },
    acceptedAt: Date,
    closedAt: Date, // set when the job becomes done, missed or declined
    onTime: Boolean,
    missedReason: String,
  },
  { timestamps: true },
);

jobSchema.index({ orderId: 1, type: 1 }, { unique: true });
jobSchema.index({ driver: 1, status: 1, closedAt: -1 });

/** The job as the app sees it. The customer's OTP is never included. */
jobSchema.methods.toClient = function toClient() {
  const { name, phone, address, area, note } = this.customer;
  return {
    id: this.id,
    orderId: this.orderId,
    type: this.type,
    status: this.status,
    day: this.day,
    slotLabel: this.slotLabel,
    dueAt: this.dueAt,
    customer: { name, phone, address, area, note },
    distanceKm: this.distanceKm,
    service: this.service,
    bags: this.bags,
    pieces: this.pieces,
    weightKg: this.weightKg,
    payment: {
      method: this.payment.method,
      amount: this.payment.amount,
      cashStatus: this.payment.cashStatus,
      collected: this.payment.collected,
    },
    closedAt: this.closedAt ?? null,
    missedReason: this.missedReason ?? null,
  };
};

module.exports = { Job: mongoose.model('Job', jobSchema) };
