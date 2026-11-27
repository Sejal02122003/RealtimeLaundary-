const express = require('express');
const { Customer } = require('../../models/Customer');
const { Order } = require('../../models/Order');
const { Commission, WalletTransaction } = require('../../models/Finance');
const { getSettings } = require('../../models/Settings');
const { downline } = require('../../services/network');
const { contains, pageLimit, requireId } = require('../../utils/query');
const { HttpError, text } = require('../../utils/http');

const router = express.Router();

async function orderCounts(ids) {
  const rows = await Order.aggregate([
    { $match: { customer: { $in: ids }, cancelled: false } },
    { $group: { _id: '$customer', count: { $sum: 1 } } },
  ]);
  const map = new Map(rows.map((row) => [String(row._id), row.count]));
  return (id) => map.get(String(id)) ?? 0;
}

const summary = (customer, ordersFor) => ({
  id: customer.id,
  name: customer.name,
  phone: customer.phone,
  referralCode: customer.referralCode,
  sponsorName: customer.sponsor?.name ?? 'Company',
  orders: ordersFor(customer._id),
  walletBalance: customer.walletBalance,
  status: customer.status,
});

router.get('/', async (req, res) => {
  const filter = {};
  const q = text(req.query.q);
  if (q) {
    const match = contains(q);
    const digits = q.replace(/[\s+-]/g, '');
    filter.$or = [{ name: match }, { referralCode: match }];
    if (/^\d{4,}$/.test(digits)) filter.$or.push({ phone: contains(digits) });
  }

  const [customers, total] = await Promise.all([
    Customer.find(filter).sort({ joinedAt: 1 }).limit(pageLimit(req.query.limit)).populate('sponsor', 'name'),
    Customer.countDocuments(filter),
  ]);
  const ordersFor = await orderCounts(customers.map((c) => c._id));
  res.json({ customers: customers.map((c) => summary(c, ordersFor)), total });
});

async function findCustomer(id) {
  const customer = await Customer.findById(requireId(id, 'Customer')).populate('sponsor', 'name');
  if (!customer) throw new HttpError(404, 'Customer not found');
  return customer;
}

async function detail(customer) {
  const { referral } = await getSettings();
  const [ordersFor, team, earned] = await Promise.all([
    orderCounts([customer._id]),
    downline(customer._id, referral.levels.length),
    Commission.aggregate([
      { $match: { earner: customer._id, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);
  return {
    ...summary(customer, ordersFor),
    direct: team.filter((member) => member.level === 1).length,
    team: team.length,
    earned: earned[0]?.total ?? 0,
  };
}

router.get('/:id', async (req, res) => {
  res.json({ customer: await detail(await findCustomer(req.params.id)) });
});

router.get('/:id/transactions', async (req, res) => {
  const customer = await findCustomer(req.params.id);
  const rows = await WalletTransaction.find({ customer: customer._id }).sort({ at: -1 }).limit(50);
  res.json({
    transactions: rows.map(({ id, type, title, detail: note, amount, at }) => ({
      id,
      type,
      title,
      detail: note,
      amount,
      at,
    })),
  });
});

router.post('/:id/status', async (req, res) => {
  const status = text(req.body?.status);
  if (!['active', 'blocked'].includes(status)) throw new HttpError(400, 'Invalid status');
  const customer = await findCustomer(req.params.id);
  customer.status = status;
  await customer.save();
  res.json({ customer: await detail(customer) });
});

module.exports = router;
