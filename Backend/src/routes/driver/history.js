const express = require('express');
const { Job } = require('../../models/Job');
const { Incentive } = require('../../models/Incentive');
const { dayKey, atTime, addDays } = require('../../utils/time');

const ON_TIME_DAYS = 30;
const LIST_LIMIT = 30;

const router = express.Router();

/** Sums a field over the matching documents and counts them. */
async function total(Model, match, field) {
  const [result] = await Model.aggregate([
    { $match: match },
    { $group: { _id: null, sum: { $sum: `$${field}` }, count: { $sum: 1 } } },
  ]);
  return { sum: result?.sum ?? 0, count: result?.count ?? 0 };
}

router.get('/', async (req, res) => {
  const driver = req.driver._id;
  const today = dayKey();
  // "This week" is the last seven days, including today.
  const weekStart = atTime(addDays(today, -6));
  const onTimeStart = atTime(addDays(today, -(ON_TIME_DAYS - 1)));
  const recent = { driver, status: 'done', closedAt: { $gte: onTimeStart } };

  const [week, incentives, recentCount, onTimeCount, declined, cash, jobs] = await Promise.all([
    total(Job, { driver, status: 'done', closedAt: { $gte: weekStart } }, 'earning'),
    total(Incentive, { driver, awardedAt: { $gte: weekStart } }, 'amount'),
    Job.countDocuments(recent),
    Job.countDocuments({ ...recent, onTime: true }),
    Job.countDocuments({ driver, status: 'declined', closedAt: { $gte: weekStart } }),
    total(
      Job,
      {
        driver,
        status: 'done',
        'payment.method': 'cod',
        'payment.collected': { $gt: 0 },
        'payment.depositedAt': null,
      },
      'payment.collected',
    ),
    Job.find({ driver, status: { $in: ['done', 'missed'] } })
      .sort({ closedAt: -1 })
      .limit(LIST_LIMIT),
  ]);

  res.json({
    today,
    earnings: { total: week.sum + incentives.sum, incentive: incentives.sum },
    jobsDone: week.count,
    onTimePercent: recentCount ? Math.round((onTimeCount / recentCount) * 100) : null,
    declined,
    cash: { amount: cash.sum, orders: cash.count },
    jobs: jobs.map((job) => job.toClient()),
  });
});

module.exports = router;
