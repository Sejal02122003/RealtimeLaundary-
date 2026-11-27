const { today, daysAgo, monthStart, earlierDaysThisMonth, atTime, addDays, split } = require('./common');

const MONTH_COMMISSIONS = 24610;
const ANITA_EARNED = 2160;
const REFUNDS = [420, 420, 420, 420, 400, 360, 350, 350]; // ₹3,140

/** A moment in this month, before now whenever the month has earlier days. */
const thisMonth = (i, time = '12:00') =>
  atTime(earlierDaysThisMonth ? addDays(monthStart, i % earlierDaysThisMonth) : today, time);

function buildMoney({ byName, others, referred, pastOrders }) {
  const id = (name) => byName.get(name)._id;

  /* Withdrawal requests: seven pending, ₹8,950 in all */
  const extra = [others[0], others[1]];
  extra[0].walletBalance = 2400;
  extra[1].walletBalance = 2150;
  const request = (customer, amount, method, account, days, time) => ({
    customer,
    amount,
    payTo: { method, account },
    requestedAt: atTime(daysAgo(days), time),
    demo: true,
  });
  const withdrawals = [
    request(id('Anita Singh'), 1000, 'upi', 'anita@upi', 0, '00:40'),
    request(id('Priya Sharma'), 3000, 'bank', '4021', 0, '00:30'),
    request(id('Sunil Mehta'), 500, 'upi', 'sunil@upi', 1, '15:00'),
    request(id('Neha Jain'), 400, 'upi', 'neha@upi', 2, '15:00'),
    request(id('Arjun Khanna'), 250, 'upi', 'arjun@upi', 3, '15:00'),
    request(extra[0]._id, 1800, 'upi', 'demo1@upi', 4, '15:00'),
    request(extra[1]._id, 2000, 'bank', '7730', 5, '15:00'),
    {
      ...request(id('Anita Singh'), 800, 'upi', 'anita@upi', 12, '10:00'),
      status: 'approved',
      decidedAt: atTime(daysAgo(11), '10:00'),
    },
  ];

  /* Commissions: three waiting for approval, the rest paid */
  const pending = (earner, source, level, orderCode, amount, time) => ({
    earner: id(earner),
    source: id(source),
    level,
    orderCode,
    amount,
    status: 'pending',
    createdAt: atTime(today, time),
    demo: true,
  });
  const commissions = [
    pending('Anita Singh', 'Sunil Mehta', 1, 'FF-1039', 120, '00:30'),
    pending('Priya Sharma', 'Sunil Mehta', 2, 'FF-1039', 30, '00:20'),
    pending('Neha Jain', 'Ritu Patel', 1, 'FF-1044', 45, '00:10'),
  ];
  const paid = (earner, source, orderCode, amount, i) => ({
    earner,
    source,
    level: 1,
    orderCode,
    amount,
    status: 'approved',
    createdAt: thisMonth(i),
    approvedAt: thisMonth(i, '13:00'),
    demo: true,
  });
  const team = ['Sunil Mehta', 'Neha Jain', 'Arjun Khanna', 'Rohit Verma', 'Ritu Patel'];
  split(ANITA_EARNED, 18).forEach((amount, i) =>
    commissions.push(paid(id('Anita Singh'), id(team[i % team.length]), pastOrders[i].code, amount, i)),
  );
  const rest = MONTH_COMMISSIONS - commissions.reduce((total, c) => total + c.amount, 0);
  split(rest, 150).forEach((amount, i) => {
    const source = referred[i % referred.length];
    commissions.push(paid(source.sponsor, source._id, pastOrders[i + 30].code, amount, i));
  });

  const transaction = (type, title, detail, amount, days) => ({
    customer: id('Anita Singh'),
    type,
    title,
    detail,
    amount,
    at: atTime(daysAgo(days), '14:00'),
    demo: true,
  });
  const transactions = [
    transaction('earning', 'Level 1 commission', 'Sunil Mehta', 120, 2),
    transaction('spent', 'Order payment', '#FF-1021', -310, 5),
    transaction('earning', 'Level 2 commission', 'Ritu Patel', 30, 7),
    transaction('spent', 'Withdrawal paid', 'To UPI', -800, 11),
  ];

  /* Refunds this month, plus one request waiting for a decision */
  const refundable = pastOrders.slice(40, -1).filter((o) => o.payment.paid && o.total >= 420);
  const refunds = REFUNDS.map((amount, i) => {
    const order = refundable[i];
    order.refunded = amount;
    return {
      orderCode: order.code,
      customer: order.customer,
      amount,
      reason: 'Damaged item',
      at: thisMonth(i, '16:00'),
      demo: true,
    };
  });

  const flagged = pastOrders.at(-1);
  flagged.refundRequest = { reason: 'One shirt came back with a stain', requestedAt: atTime(today, '00:15') };

  return { withdrawals, commissions, transactions, refunds };
}

module.exports = { buildMoney };
