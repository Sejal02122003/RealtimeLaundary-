const express = require('express');
const { Customer } = require('../../models/Customer');
const { Order } = require('../../models/Order');
const { Commission } = require('../../models/Finance');
const { getSettings, COMMISSION_TRIGGERS } = require('../../models/Settings');
const { downline } = require('../../services/network');
const { moveMoney } = require('../../services/wallet');
const { requireId } = require('../../utils/query');
const { HttpError, text, parseWholeNumber } = require('../../utils/http');

const MAX_LEVELS = 10;
const PENDING_LIMIT = 100;

const router = express.Router();

/** The member shown first: whoever has referred the most people directly. */
async function topReferrer() {
  const [top] = await Customer.aggregate([
    { $match: { sponsor: { $ne: null } } },
    { $group: { _id: '$sponsor', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 1 },
  ]);
  return top ? Customer.findById(top._id) : Customer.findOne().sort({ joinedAt: 1 });
}

async function network(memberId, depth) {
  const member = memberId
    ? await Customer.findById(requireId(memberId, 'Member'))
    : await topReferrer();
  if (!member) {
    if (memberId) throw new HttpError(404, 'Member not found');
    return null;
  }

  const [sponsor, team] = await Promise.all([
    member.sponsor ? Customer.findById(member.sponsor).select('name') : null,
    downline(member._id, depth),
  ]);
  // Members who have not ordered yet are marked in the tree.
  const buyers = await Order.distinct('customer', {
    customer: { $in: team.map((m) => m._id) },
    cancelled: false,
  });
  const ordered = new Set(buyers.map(String));

  return {
    id: member.id,
    name: member.name,
    sponsor: sponsor ? { id: sponsor.id, name: sponsor.name } : null,
    team: team.map((m) => ({
      id: String(m._id),
      parentId: String(m.sponsor),
      name: m.name,
      level: m.level,
      hasOrder: ordered.has(String(m._id)),
    })),
  };
}

router.get('/', async (req, res) => {
  const { referral } = await getSettings();
  const [member, pending, pendingCount] = await Promise.all([
    network(text(req.query.member), referral.levels.length),
    Commission.find({ status: 'pending' })
      .sort({ createdAt: -1, amount: -1 })
      .limit(PENDING_LIMIT)
      .populate('earner source', 'name'),
    Commission.countDocuments({ status: 'pending' }),
  ]);

  res.json({
    rules: {
      confirmed: referral.confirmed,
      levels: referral.levels,
      trigger: referral.trigger,
      minOwnOrders: referral.minOwnOrders,
      minWithdrawal: referral.minWithdrawal,
    },
    triggers: COMMISSION_TRIGGERS,
    member,
    pendingCount,
    pending: pending.map((c) => ({
      id: c.id,
      earnerName: c.earner?.name ?? 'Removed member',
      sourceName: c.source?.name ?? 'Removed member',
      level: c.level,
      orderCode: c.orderCode,
      amount: c.amount,
    })),
  });
});

router.put('/rules', async (req, res) => {
  const { levels, trigger } = req.body ?? {};
  if (!Array.isArray(levels) || levels.length < 1 || levels.length > MAX_LEVELS) {
    throw new HttpError(400, `Use between 1 and ${MAX_LEVELS} levels`);
  }
  const percents = levels.map((value, i) => {
    const raw = text(value);
    const percent = Number(raw);
    if (!raw || !Number.isFinite(percent) || percent < 0 || percent > 100) {
      throw new HttpError(400, `Set the commission for level ${i + 1} (0 to 100%)`);
    }
    return Math.round(percent * 100) / 100;
  });
  if (percents.reduce((a, b) => a + b, 0) > 100) {
    throw new HttpError(400, 'All levels together cannot be more than 100%');
  }
  if (!Object.hasOwn(COMMISSION_TRIGGERS, text(trigger))) {
    throw new HttpError(400, 'Choose when commission is earned');
  }

  const settings = await getSettings();
  settings.referral = {
    confirmed: true,
    levels: percents,
    trigger: text(trigger),
    minOwnOrders: parseWholeNumber(req.body.minOwnOrders, {
      label: 'Minimum own orders',
      min: 0,
      max: 100,
    }),
    minWithdrawal: parseWholeNumber(req.body.minWithdrawal, {
      label: 'Minimum withdrawal',
      min: 1,
      max: 100000,
    }),
  };
  await settings.save();
  res.json({ ok: true });
});

/** Marks a commission approved and pays it into the member's wallet, once. */
async function approve(id) {
  const commission = await Commission.findOneAndUpdate(
    { _id: id, status: 'pending' },
    { status: 'approved', approvedAt: new Date() },
    { returnDocument: 'after' },
  ).populate('source', 'name');
  if (!commission) return false;

  try {
    await moveMoney(commission.earner, {
      type: 'earning',
      title: `Level ${commission.level} commission`,
      detail: `${commission.source?.name ?? 'Member'} · Order #${commission.orderCode}`,
      amount: commission.amount,
    });
  } catch (err) {
    await Commission.updateOne({ _id: id }, { status: 'pending', $unset: { approvedAt: 1 } });
    throw err;
  }
  return true;
}

router.post('/commissions/approve-all', async (req, res) => {
  const ids = req.body?.ids;
  // Only what the admin was shown is approved, not rows added since.
  if (!Array.isArray(ids) || !ids.length || ids.length > PENDING_LIMIT) {
    throw new HttpError(400, 'Nothing to approve');
  }
  let approved = 0;
  for (const id of ids) {
    if (await approve(requireId(id, 'Commission'))) approved += 1;
  }
  res.json({ approved });
});

router.post('/commissions/:id/approve', async (req, res) => {
  if (!(await approve(requireId(req.params.id, 'Commission')))) {
    throw new HttpError(409, 'This commission is already approved');
  }
  res.json({ approved: 1 });
});

router.patch('/commissions/:id', async (req, res) => {
  const amount = parseWholeNumber(req.body?.amount, { label: 'Amount', min: 1, max: 100000 });
  const commission = await Commission.findOneAndUpdate(
    { _id: requireId(req.params.id, 'Commission'), status: 'pending' },
    { amount },
  );
  if (!commission) throw new HttpError(409, 'Only pending commissions can be changed');
  res.json({ ok: true });
});

module.exports = router;
