const express = require('express');
const { Order } = require('../../models/Order');
const { Driver } = require('../../models/Driver');
const { Withdrawal, Commission, Refund } = require('../../models/Finance');
const { driverStats } = require('../../services/driverStats');
const { moveMoney } = require('../../services/wallet');
const { periodStarts, requireId } = require('../../utils/query');
const { HttpError } = require('../../utils/http');

const LIST_LIMIT = 100;

const router = express.Router();

async function sum(Model, match, field) {
  const [row] = await Model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);
  return row?.total ?? 0;
}

const withdrawalRow = (w) => ({
  id: w.id,
  memberName: w.customer?.name ?? 'Removed member',
  amount: w.amount,
  walletBalance: w.customer?.walletBalance ?? 0,
  payTo: { method: w.payTo.method, account: w.payTo.account },
  status: w.status,
  requestedAt: w.requestedAt,
  decidedAt: w.decidedAt ?? null,
});

router.get('/', async (_req, res) => {
  const { monthStart } = periodStarts();
  const [online, refunds, pendingTotal, pending, payouts, payments, commissions, drivers, statsFor] =
    await Promise.all([
      sum(
        Order,
        { 'payment.method': { $ne: 'cod' }, 'payment.paid': true, placedAt: { $gte: monthStart } },
        'total',
      ),
      sum(Refund, { at: { $gte: monthStart } }, 'amount'),
      sum(Withdrawal, { status: 'pending' }, 'amount'),
      Withdrawal.find({ status: 'pending' })
        .sort({ requestedAt: -1 })
        .limit(LIST_LIMIT)
        .populate('customer', 'name walletBalance'),
      Withdrawal.find({ status: { $ne: 'pending' } })
        .sort({ decidedAt: -1 })
        .limit(LIST_LIMIT)
        .populate('customer', 'name walletBalance'),
      Order.find().sort({ placedAt: -1 }).limit(LIST_LIMIT),
      Commission.find().sort({ createdAt: -1 }).limit(LIST_LIMIT).populate('earner source', 'name'),
      Driver.find().sort({ name: 1 }),
      driverStats(),
    ]);

  const cashHolders = drivers
    .map((driver) => {
      const stats = statsFor(driver._id);
      return { id: driver.id, name: driver.name, amount: stats.cashHeld, orders: stats.cashOrders };
    })
    .filter((driver) => driver.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  res.json({
    stats: {
      online,
      codWithDrivers: cashHolders.reduce((total, d) => total + d.amount, 0),
      refunds,
      pendingWithdrawals: pendingTotal,
    },
    withdrawals: pending.map(withdrawalRow),
    payouts: payouts.map(withdrawalRow),
    cashHolders,
    payments: payments.map((o) => ({
      code: o.code,
      customerName: o.customerName,
      method: o.payment.method,
      amount: o.total,
      paid: o.payment.paid,
      refunded: o.refunded,
      cancelled: o.cancelled,
      placedAt: o.placedAt,
    })),
    commissions: commissions.map((c) => ({
      id: c.id,
      earnerName: c.earner?.name ?? 'Removed member',
      sourceName: c.source?.name ?? 'Removed member',
      level: c.level,
      orderCode: c.orderCode,
      amount: c.amount,
      status: c.status,
      createdAt: c.createdAt,
    })),
  });
});

/** Moves a pending request to its decision, so it can only be decided once. */
async function decide(id, status) {
  const withdrawal = await Withdrawal.findOneAndUpdate(
    { _id: requireId(id, 'Request'), status: 'pending' },
    { status, decidedAt: new Date() },
    { returnDocument: 'after' },
  );
  if (!withdrawal) throw new HttpError(409, 'This request has already been decided');
  return withdrawal;
}

router.post('/withdrawals/:id/approve', async (req, res) => {
  const withdrawal = await decide(req.params.id, 'approved');
  try {
    await moveMoney(withdrawal.customer, {
      type: 'spent',
      title: 'Withdrawal paid',
      detail: `To ${withdrawal.payTo.method === 'upi' ? 'UPI' : 'bank'}`,
      amount: -withdrawal.amount,
    });
  } catch (err) {
    await Withdrawal.updateOne({ _id: withdrawal._id }, { status: 'pending', $unset: { decidedAt: 1 } });
    throw err;
  }
  res.json({ ok: true });
});

router.post('/withdrawals/:id/reject', async (req, res) => {
  await decide(req.params.id, 'rejected');
  res.json({ ok: true });
});

module.exports = router;
