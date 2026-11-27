const mongoose = require('mongoose');

const COMMISSION_TRIGGERS = {
  delivered_paid: 'Order is delivered and paid',
  delivered: 'Order is delivered',
};

const AUTO_NOTIFICATIONS = {
  orderStatus: 'Order status updates',
  driverAssignment: 'Driver assignment',
  referralJoined: 'Referral joined',
  commissionCredited: 'Commission credited',
};

const slotSchema = new mongoose.Schema(
  { id: String, label: String, start: String, end: String, open: Boolean },
  { _id: false },
);

const slot = (id, label, start, end, open = true) => ({ id, label, start, end, open });

const defaultSlots = () => [
  slot('8-10', '8 – 10 AM', '08:00', '10:00'),
  slot('10-12', '10 AM – 12 PM', '10:00', '12:00'),
  slot('14-16', '2 – 4 PM', '14:00', '16:00'),
  slot('17-19', '5 – 7 PM', '17:00', '19:00', false),
  slot('19-21', '7 – 9 PM', '19:00', '21:00'),
];

const settingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  orderRules: {
    minOrder: { type: Number, default: 150 },
    taxRate: { type: Number, default: 18 },
    codEnabled: { type: Boolean, default: true },
  },
  slots: { type: [slotSchema], default: defaultSlots },
  // Nothing is paid out until an admin saves a complete set of rules.
  referral: {
    confirmed: { type: Boolean, default: false },
    levels: { type: [Number], default: () => [null, null, null] },
    trigger: { type: String, enum: Object.keys(COMMISSION_TRIGGERS), default: 'delivered_paid' },
    minOwnOrders: { type: Number, default: null },
    minWithdrawal: { type: Number, default: null },
  },
  autoNotifications: {
    orderStatus: { type: Boolean, default: true },
    driverAssignment: { type: Boolean, default: true },
    referralJoined: { type: Boolean, default: true },
    commissionCredited: { type: Boolean, default: true },
  },
});

const Settings = mongoose.model('Settings', settingsSchema);

/** The single settings document, created with defaults on first use. */
async function getSettings() {
  const existing = await Settings.findOne({ key: 'main' });
  if (existing) return existing;
  try {
    return await Settings.create({ key: 'main' });
  } catch (err) {
    // Another request created it first.
    if (err.code === 11000) return Settings.findOne({ key: 'main' });
    throw err;
  }
}

module.exports = { Settings, getSettings, COMMISSION_TRIGGERS, AUTO_NOTIFICATIONS };
