const mongoose = require('mongoose');
const { dayKey, atTime, addDays } = require('./time');
const { HttpError, text } = require('./http');

/** A case-insensitive "contains" search with the user's text taken literally. */
const contains = (value) => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

const pageLimit = (value, fallback = 25) => Math.min(Math.max(Number(value) || fallback, 1), 200);

function requireId(value, label = 'Record') {
  if (!mongoose.isValidObjectId(value)) throw new HttpError(404, `${label} not found`);
  return value;
}

/** Start instants of today, the last seven days and this month. */
function periodStarts() {
  const today = dayKey();
  return {
    today,
    todayStart: atTime(today),
    weekStart: atTime(addDays(today, -6)),
    monthStart: atTime(`${today.slice(0, 7)}-01`),
  };
}

/** Reads ?from=YYYY-MM-DD&to=YYYY-MM-DD, both inclusive; defaults to this month. */
function dateRange(query) {
  const { today } = periodStarts();
  const read = (value, fallback) => {
    const day = text(value) || fallback;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(atTime(day).getTime())) {
      throw new HttpError(400, 'Choose a valid date');
    }
    return day;
  };
  const from = read(query.from, `${today.slice(0, 7)}-01`);
  const to = read(query.to, today);
  if (from > to) throw new HttpError(400, 'The "From" date must not be after the "To" date');
  return { from, to, range: { $gte: atTime(from), $lt: atTime(addDays(to, 1)) } };
}

module.exports = { contains, pageLimit, requireId, periodStarts, dateRange };
