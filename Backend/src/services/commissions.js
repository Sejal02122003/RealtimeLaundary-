const { Customer } = require('../models/Customer');
const { Order, STAGE } = require('../models/Order');
const { Commission } = require('../models/Finance');
const { getSettings } = require('../models/Settings');
const { dayKey, atTime } = require('../utils/time');

/**
 * Creates the pending commissions for a delivered order, walking up the sponsor
 * chain one level at a time. Does nothing until the rules are confirmed.
 */
async function createCommissions(order) {
  const { referral } = await getSettings();
  if (!referral.confirmed || order.stage !== STAGE.DELIVERED || order.cancelled) return;
  if (referral.trigger === 'delivered_paid' && !order.payment.paid) return;

  const base = order.total - order.refunded;
  const monthStart = atTime(`${dayKey().slice(0, 7)}-01`);
  const seen = new Set([String(order.customer)]);
  let member = await Customer.findById(order.customer);

  for (let level = 1; level <= referral.levels.length && member?.sponsor; level += 1) {
    member = await Customer.findById(member.sponsor);
    if (!member || seen.has(member.id)) break;
    seen.add(member.id);

    const amount = Math.floor((base * referral.levels[level - 1]) / 100);
    if (amount < 1 || member.status !== 'active') continue;

    if (referral.minOwnOrders > 0) {
      const own = await Order.countDocuments({
        customer: member._id,
        cancelled: false,
        placedAt: { $gte: monthStart },
      });
      if (own < referral.minOwnOrders) continue;
    }

    // The unique index makes a repeat call harmless.
    await Commission.updateOne(
      { orderCode: order.code, earner: member._id },
      {
        $setOnInsert: {
          source: order.customer,
          level,
          amount,
          status: 'pending',
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }
}

module.exports = { createCommissions };
