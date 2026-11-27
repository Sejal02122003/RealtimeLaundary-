const express = require('express');
const { Order, STAGES } = require('../../models/Order');
const { Job } = require('../../models/Job');
const { Driver } = require('../../models/Driver');
const { Customer } = require('../../models/Customer');
const { Commission, Refund, Withdrawal } = require('../../models/Finance');
const { driverStats } = require('../../services/driverStats');
const { dateRange } = require('../../utils/query');
const { TIME_ZONE, dayKey } = require('../../utils/time');
const { toCsv } = require('../../utils/csv');
const { HttpError } = require('../../utils/http');

const router = express.Router();

const day = (date) => (date ? dayKey(date) : '');
const status = (order) => (order.cancelled ? 'Cancelled' : STAGES[order.stage]);

const REPORTS = {
  async users(range) {
    const rows = await Customer.find({ joinedAt: range }).sort({ joinedAt: 1 }).populate('sponsor', 'name');
    return [
      ['Joined', 'Name', 'Phone', 'Referral code', 'Sponsor', 'Account', 'Wallet'],
      ...rows.map((c) => [
        day(c.joinedAt),
        c.name,
        c.phone,
        c.referralCode,
        c.sponsor?.name ?? 'Company',
        c.status,
        c.walletBalance,
      ]),
    ];
  },

  async drivers(range) {
    const [drivers, jobs, statsFor] = await Promise.all([
      Driver.find().sort({ name: 1 }),
      Job.aggregate([
        { $match: { status: { $in: ['done', 'missed', 'declined'] }, closedAt: range } },
        {
          $group: {
            _id: { driver: '$driver', status: '$status' },
            count: { $sum: 1 },
            onTime: { $sum: { $cond: [{ $eq: ['$onTime', true] }, 1, 0] } },
          },
        },
      ]),
      driverStats(),
    ]);
    const find = (id, kind) =>
      jobs.find((row) => String(row._id.driver) === id && row._id.status === kind);

    return [
      ['Driver', 'Phone', 'Account', 'Jobs done', 'On time %', 'Missed', 'Declined', 'Cash held now'],
      ...drivers.map((driver) => {
        const done = find(driver.id, 'done');
        return [
          driver.name,
          driver.phone,
          driver.status,
          done?.count ?? 0,
          done ? Math.round((done.onTime / done.count) * 100) : '',
          find(driver.id, 'missed')?.count ?? 0,
          find(driver.id, 'declined')?.count ?? 0,
          statsFor(driver._id).cashHeld,
        ];
      }),
    ];
  },

  async orders(range) {
    const rows = await Order.find({ placedAt: range }).sort({ placedAt: 1 });
    return [
      ['Date', 'Order', 'Customer', 'Area', 'Service', 'Pieces', 'Total', 'Status', 'Driver'],
      ...rows.map((o) => [
        day(o.placedAt),
        o.code,
        o.customerName,
        o.area,
        o.service,
        o.pieces,
        o.total,
        status(o),
        o.driverName,
      ]),
    ];
  },

  async revenue(range) {
    const rows = await Order.aggregate([
      { $match: { placedAt: range, cancelled: false } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$placedAt', timezone: TIME_ZONE } },
          orders: { $sum: 1 },
          sales: { $sum: '$subtotal' },
          discount: { $sum: '$discount' },
          tax: { $sum: '$tax' },
          total: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return [
      ['Date', 'Orders', 'Sales', 'Discounts', 'Tax', 'Total'],
      ...rows.map((r) => [r._id, r.orders, r.sales, r.discount, r.tax, r.total]),
    ];
  },

  async payments(range) {
    const [orders, refunds] = await Promise.all([
      Order.find({ placedAt: range }).sort({ placedAt: 1 }),
      Refund.find({ at: range }).sort({ at: 1 }).populate('customer', 'name'),
    ]);
    return [
      ['Date', 'Type', 'Order', 'Customer', 'Method', 'Amount', 'Paid'],
      ...orders.map((o) => [
        day(o.placedAt),
        'Payment',
        o.code,
        o.customerName,
        o.payment.method,
        o.total,
        o.payment.paid ? 'Yes' : 'No',
      ]),
      ...refunds.map((r) => [
        day(r.at),
        'Refund',
        r.orderCode,
        r.customer?.name,
        'wallet',
        -r.amount,
        'Yes',
      ]),
    ];
  },

  async mlm(range) {
    const rows = await Commission.find({ createdAt: range })
      .sort({ createdAt: 1 })
      .populate('earner source', 'name');
    return [
      ['Date', 'Earner', 'From member', 'Level', 'Order', 'Commission', 'Status'],
      ...rows.map((c) => [
        day(c.createdAt),
        c.earner?.name,
        c.source?.name,
        c.level,
        c.orderCode,
        c.amount,
        c.status,
      ]),
    ];
  },

  async payouts(range) {
    const rows = await Withdrawal.find({ requestedAt: range })
      .sort({ requestedAt: 1 })
      .populate('customer', 'name');
    return [
      ['Requested', 'Decided', 'Member', 'Amount', 'Method', 'Account', 'Status'],
      ...rows.map((w) => [
        day(w.requestedAt),
        day(w.decidedAt),
        w.customer?.name,
        w.amount,
        w.payTo.method,
        w.payTo.account,
        w.status,
      ]),
    ];
  },
};

router.get('/:type', async (req, res) => {
  const { type } = req.params;
  if (!Object.hasOwn(REPORTS, type)) throw new HttpError(404, 'Unknown report');
  const { from, to, range } = dateRange(req.query);
  const rows = await REPORTS[type](range);

  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="freshfold-${type}-${from}-to-${to}.csv"`,
    'Cache-Control': 'private, no-store',
  });
  res.send(toCsv(rows));
});

module.exports = router;
