const express = require('express');
const { Customer } = require('../../models/Customer');
const { Driver } = require('../../models/Driver');
const { Order, STAGE } = require('../../models/Order');
const { Broadcast } = require('../../models/Finance');
const { getSettings, AUTO_NOTIFICATIONS } = require('../../models/Settings');
const { HttpError, text } = require('../../utils/http');

const AUDIENCES = {
  all_customers: {
    label: 'All customers',
    count: () => Customer.countDocuments({ status: 'active' }),
  },
  active_orders: {
    label: 'Customers with an open order',
    count: async () =>
      (await Order.distinct('customer', { cancelled: false, stage: { $lt: STAGE.DELIVERED } })).length,
  },
  referrers: {
    label: 'Customers who referred someone',
    count: async () => (await Customer.distinct('sponsor', { sponsor: { $ne: null } })).length,
  },
  all_drivers: {
    label: 'All drivers',
    count: () => Driver.countDocuments({ status: 'approved' }),
  },
};

const router = express.Router();

router.get('/', async (_req, res) => {
  const [settings, sent] = await Promise.all([
    getSettings(),
    Broadcast.find().sort({ at: -1 }).limit(5),
  ]);
  res.json({
    audiences: Object.entries(AUDIENCES).map(([id, { label }]) => ({ id, label })),
    automatic: Object.entries(AUTO_NOTIFICATIONS).map(([id, label]) => ({
      id,
      label,
      enabled: settings.autoNotifications[id],
    })),
    recent: sent.map(({ id, audience, recipients, title, message, at }) => ({
      id,
      audience: AUDIENCES[audience]?.label ?? audience,
      recipients,
      title,
      message,
      at,
    })),
  });
});

router.post('/', async (req, res) => {
  const audience = text(req.body?.audience);
  const title = text(req.body?.title);
  const message = text(req.body?.message);
  if (!Object.hasOwn(AUDIENCES, audience)) throw new HttpError(400, 'Choose who to send to');
  if (!title || title.length > 60) throw new HttpError(400, 'Enter a title (up to 60 characters)');
  if (!message || message.length > 180) {
    throw new HttpError(400, 'Enter a message (up to 180 characters)');
  }

  const recipients = await AUDIENCES[audience].count();
  if (!recipients) throw new HttpError(409, 'Nobody is in this group yet');

  // Saved only. Connect a push provider here to deliver it to phones.
  await Broadcast.create({ audience, recipients, title, message, at: new Date() });
  res.status(201).json({ recipients, delivered: false });
});

router.patch('/automatic/:id', async (req, res) => {
  const { id } = req.params;
  if (!Object.hasOwn(AUTO_NOTIFICATIONS, id)) throw new HttpError(404, 'Unknown notification');
  if (typeof req.body?.enabled !== 'boolean') throw new HttpError(400, 'Invalid request');
  const settings = await getSettings();
  settings.autoNotifications[id] = req.body.enabled;
  await settings.save();
  res.json({ ok: true });
});

module.exports = router;
