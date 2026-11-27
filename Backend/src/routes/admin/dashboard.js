const express = require('express');
const { Order, STAGES, STAGE } = require('../../models/Order');
const { Job } = require('../../models/Job');
const { Driver, DOCUMENT_TYPES } = require('../../models/Driver');
const { Customer } = require('../../models/Customer');
const { Commission, Withdrawal } = require('../../models/Finance');
const { OPEN_JOB } = require('../../services/orders');
const { periodStarts } = require('../../utils/query');
const { TIME_ZONE, dayKey, atTime, addDays } = require('../../utils/time');

const PERIOD_DAYS = { today: 1, week: 7 };

const router = express.Router();

async function revenue(match) {
  const rows = await Order.aggregate([
    { $match: match },
    { $group: { _id: '$payment.method', amount: { $sum: '$total' }, count: { $sum: 1 } } },
  ]);
  const sum = (key, filter = () => true) => rows.filter(filter).reduce((t, row) => t + row[key], 0);
  const cod = sum('amount', (row) => row._id === 'cod');
  const total = sum('amount');
  return { orders: sum('count'), total, cod, online: total - cod };
}

/** Active orders that need a driver for their next trip and do not have one. */
async function ordersWithoutDriver() {
  const covered = await Job.distinct('orderId', { status: { $in: OPEN_JOB } });
  return Order.countDocuments({
    cancelled: false,
    stage: { $in: [STAGE.BOOKED, STAGE.READY] },
    code: { $nin: covered },
  });
}

router.get('/', async (req, res) => {
  const period = ['week', 'month'].includes(req.query.period) ? req.query.period : 'today';
  const { today, todayStart, weekStart, monthStart } = periodStarts();
  const start = { today: todayStart, week: weekStart, month: monthStart }[period];

  // The previous period of the same length, for the comparison under "Orders".
  const length = PERIOD_DAYS[period] ?? Number(today.slice(8));
  const previousStart =
    period === 'month'
      ? atTime(`${addDays(`${today.slice(0, 7)}-01`, -1).slice(0, 7)}-01`)
      : atTime(addDays(today, 1 - length * 2));
  const previousEnd = start;

  const active = { cancelled: false };
  const inPeriod = { ...active, placedAt: { $gte: start } };

  const [
    current,
    previous,
    customers,
    joined,
    drivers,
    online,
    busy,
    commissions,
    referrals,
    unassigned,
    pendingDrivers,
    withdrawals,
    refunds,
    byDay,
    byStage,
  ] = await Promise.all([
    revenue(inPeriod),
    Order.countDocuments({ ...active, placedAt: { $gte: previousStart, $lt: previousEnd } }),
    Customer.countDocuments(),
    Customer.countDocuments({ joinedAt: { $gte: start } }),
    Driver.countDocuments({ status: 'approved' }),
    Driver.find({ status: 'approved', online: true }).distinct('_id'),
    Job.distinct('driver', { status: 'assigned' }),
    Commission.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Customer.countDocuments({ joinedAt: { $gte: monthStart }, sponsor: { $ne: null } }),
    ordersWithoutDriver(),
    // Applicants who have uploaded everything and are waiting for a decision.
    Driver.countDocuments({
      status: 'pending',
      ...Object.fromEntries(
        Object.keys(DOCUMENT_TYPES).map((type) => [
          `documents.${type}.status`,
          { $in: ['pending', 'verified'] },
        ]),
      ),
    }),
    Withdrawal.countDocuments({ status: 'pending' }),
    Order.countDocuments({ refundRequest: { $ne: null } }),
    Order.aggregate([
      { $match: { ...active, placedAt: { $gte: weekStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$placedAt', timezone: TIME_ZONE } },
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([{ $match: inPeriod }, { $group: { _id: '$stage', count: { $sum: 1 } } }]),
  ]);

  const countFor = (rows, key) => rows.find((row) => row._id === key)?.count ?? 0;
  const busyIds = new Set(busy.map(String));

  res.json({
    period,
    today: dayKey(),
    orders: { count: current.orders, previous },
    revenue: { total: current.total, online: current.online, cod: current.cod },
    customers: { total: customers, joined },
    drivers: {
      total: drivers,
      online: online.length,
      free: online.filter((id) => !busyIds.has(String(id))).length,
    },
    commissions: { month: commissions[0]?.total ?? 0, referrals },
    attention: { unassigned, pendingDrivers, withdrawals, refunds },
    week: Array.from({ length: 7 }, (_, i) => {
      const day = addDays(today, i - 6);
      return { day, count: countFor(byDay, day) };
    }),
    stages: STAGES.map((label, stage) => ({ stage, label, count: countFor(byStage, stage) })),
  });
});

module.exports = router;
