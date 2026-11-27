const mongoose = require('mongoose');

// An order's `stage` is an index into this list.
const STAGES = [
  'Booking confirmed',
  'Pickup assigned',
  'Picked up',
  'Processing / washing',
  'Ready for delivery',
  'Out for delivery',
  'Delivered',
];

const STAGE = {
  BOOKED: 0,
  PICKUP_ASSIGNED: 1,
  PICKED_UP: 2,
  PROCESSING: 3,
  READY: 4,
  OUT_FOR_DELIVERY: 5,
  DELIVERED: 6,
};

const orderSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  area: { type: String, required: true },
  service: { type: String, required: true },
  pieces: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  payment: {
    method: { type: String, enum: ['online', 'cod', 'wallet'], required: true },
    paid: { type: Boolean, default: false },
  },
  instructions: { type: String, default: '' },
  pickupSlot: { type: String, default: '14-16' }, // slot id from the settings
  pickupOtp: { type: String, required: true },
  deliveryOtp: { type: String, required: true },
  stage: { type: Number, min: 0, max: 6, default: 0 },
  cancelled: { type: Boolean, default: false },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  driverName: { type: String, default: '' },
  refunded: { type: Number, default: 0 },
  refundRequest: {
    type: new mongoose.Schema({ reason: String, requestedAt: Date }, { _id: false }),
    default: null,
  },
  placedAt: { type: Date, required: true, index: true },
  deliveredAt: Date,
  demo: Boolean,
});

module.exports = { Order: mongoose.model('Order', orderSchema), STAGES, STAGE };
