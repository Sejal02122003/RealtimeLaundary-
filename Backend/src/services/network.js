const { Customer } = require('../models/Customer');

const MAX_MEMBERS = 500;

/** Everyone below a member in the referral tree, level by level. */
async function downline(rootId, depth) {
  const members = [];
  const seen = new Set([String(rootId)]);
  let parents = [rootId];

  for (let level = 1; level <= depth && parents.length && members.length < MAX_MEMBERS; level += 1) {
    const rows = await Customer.find({ sponsor: { $in: parents } })
      .sort({ joinedAt: 1 })
      .limit(MAX_MEMBERS - members.length)
      .select('name sponsor status joinedAt')
      .lean();

    const fresh = rows.filter((row) => !seen.has(String(row._id)));
    fresh.forEach((row) => {
      seen.add(String(row._id));
      members.push({ ...row, level });
    });
    parents = fresh.map((row) => row._id);
  }
  return members;
}

module.exports = { downline };
