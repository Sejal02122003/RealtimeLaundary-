const { Job } = require('../models/Job');
const { periodStarts } = require('../utils/query');
const { atTime, addDays } = require('../utils/time');

const group = (match, fields) => Job.aggregate([{ $match: match }, { $group: { _id: '$driver', ...fields } }]);

const byDriver = (rows) => new Map(rows.map((row) => [String(row._id), row]));

const countIf = (condition) => ({ $sum: { $cond: [condition, 1, 0] } });

const UNDEPOSITED_CASH = {
  status: 'done',
  'payment.method': 'cod',
  'payment.collected': { $gt: 0 },
  'payment.depositedAt': null,
};

/** Workload and performance figures for every driver, keyed by driver id. */
async function driverStats() {
  const { today, todayStart, monthStart } = periodStarts();
  const onTimeStart = atTime(addDays(today, -29));

  const [open, closedToday, month, recent, cash] = await Promise.all([
    group(
      { status: 'assigned' },
      {
        total: { $sum: 1 },
        deliveries: countIf({ $eq: ['$type', 'delivery'] }),
      },
    ),
    group({ status: { $in: ['done', 'missed'] }, closedAt: { $gte: todayStart } }, { total: { $sum: 1 } }),
    group({ status: 'done', closedAt: { $gte: monthStart } }, { total: { $sum: 1 } }),
    group(
      { status: 'done', closedAt: { $gte: onTimeStart } },
      { total: { $sum: 1 }, onTime: countIf({ $eq: ['$onTime', true] }) },
    ),
    group(UNDEPOSITED_CASH, { total: { $sum: '$payment.collected' }, orders: { $sum: 1 } }),
  ]);

  const maps = {
    open: byDriver(open),
    closedToday: byDriver(closedToday),
    month: byDriver(month),
    recent: byDriver(recent),
    cash: byDriver(cash),
  };

  return (driverId) => {
    const id = String(driverId);
    const openJobs = maps.open.get(id)?.total ?? 0;
    const done = maps.recent.get(id);
    return {
      openJobs,
      openDeliveries: maps.open.get(id)?.deliveries ?? 0,
      jobsToday: openJobs + (maps.closedToday.get(id)?.total ?? 0),
      completedMonth: maps.month.get(id)?.total ?? 0,
      onTimePercent: done ? Math.round((done.onTime / done.total) * 100) : null,
      cashHeld: maps.cash.get(id)?.total ?? 0,
      cashOrders: maps.cash.get(id)?.orders ?? 0,
    };
  };
}

/** What a driver is doing right now. */
function activity(driver, stats) {
  if (driver.status === 'blocked') return 'deactivated';
  if (!driver.online) return 'offline';
  if (stats.openDeliveries) return 'on_delivery';
  return stats.openJobs ? 'on_pickup' : 'free';
}

module.exports = { driverStats, activity, UNDEPOSITED_CASH };
