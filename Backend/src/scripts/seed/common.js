const { dayKey, atTime, addDays } = require('../../utils/time');

const today = dayKey();
const monthStart = `${today.slice(0, 7)}-01`;

const daysAgo = (days) => addDays(today, -days);
/** How many days of this month came before today. */
const earlierDaysThisMonth = Number(today.slice(8)) - 1;

const pad = (n, size = 2) => String(n).padStart(size, '0');
const orderCode = (n) => `FF-${pad(n, 4)}`;
const range = (count) => Array.from({ length: count }, (_, i) => i);

/** Splits a total into `count` whole amounts with a little variety. */
function split(total, count) {
  const base = Math.floor(total / count / 10) * 10;
  const amounts = range(count).map((i) => base + ((i % 5) - 2) * 10);
  amounts[count - 1] += total - amounts.reduce((a, b) => a + b, 0);
  return amounts;
}

module.exports = {
  today,
  monthStart,
  daysAgo,
  earlierDaysThisMonth,
  atTime,
  addDays,
  pad,
  orderCode,
  range,
  split,
};
