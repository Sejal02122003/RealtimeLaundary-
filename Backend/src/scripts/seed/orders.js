const mongoose = require('mongoose');
const {
  today,
  daysAgo,
  monthStart,
  earlierDaysThisMonth,
  atTime,
  addDays,
  pad,
  orderCode,
  range,
  split,
} = require('./common');

const TODAY_ONLINE = 11300;
const TODAY_COD = 7120;
const MONTH_ONLINE = 284300;
// Orders per day for the six days before today, oldest first.
const PAST_DAYS = [39, 55, 61, 34, 41, 42];
// Today's orders at each of the seven stages.
const TODAY_STAGES = [5, 7, 6, 14, 5, 4, 7];

const AREAS = ['Vijay Nagar', 'Palasia', 'Scheme 54', 'AB Road', 'Bhawarkua', 'Rau', 'Sudama Nagar'];
const SERVICES = ['Wash & iron', 'Dry clean', 'Wash by weight', 'Ironing'];

// The orders that appear by name in the designs. `rank` sets the list order.
const NAMED = [
  { n: 1055, customer: 'Kavya Nair', total: 310, method: 'online', stage: 0, pieces: 11, rank: 60 },
  { n: 1054, customer: 'Imran Ali', total: 540, method: 'cod', stage: 0, pieces: 14, rank: 59 },
  { n: 1051, customer: 'Meera Joshi', total: 260, method: 'cod', stage: 1, pieces: 8, rank: 58, driver: 'ravi',
    area: 'Sector C, Scheme 78', address: '18, Sector C, Scheme 78', instructions: 'Ring the bell twice', pickupSlot: '10-12' },
  { n: 1047, customer: 'Anita Singh', total: 430, method: 'online', stage: 3, pieces: 2, rank: 57, driver: 'sameer', service: 'Dry clean' },
  { n: 1042, customer: 'Anita Singh', total: 236, method: 'cod', stage: 5, pieces: 7, rank: 56, driver: 'ravi', deliveryOtp: '7305' },
  { n: 1038, customer: 'Rohit Sen', total: 420, method: 'cod', stage: 6, pieces: 9, rank: 55, driver: 'ravi' },
  { n: 1031, customer: 'Sneha Rao', total: 350, method: 'online', stage: 6, pieces: 8, rank: 54, driver: 'vikas' },
  { n: 1053, customer: 'Rahul Dubey', total: 380, method: 'cod', stage: 1, pieces: 3, rank: 53, driver: 'ravi',
    area: 'Palasia', address: '42, MG Road, Palasia', service: 'Dry clean' },
  { n: 1052, customer: 'Nisha Verma', total: 210, method: 'online', stage: 1, pieces: 6, rank: 52, driver: 'ravi',
    area: 'Scheme 54', address: '9, Scheme 54' },
  { n: 1049, total: 360, method: 'online', stage: 2, pieces: 12, rank: 51, driver: 'ravi' },
  { n: 1036, total: 190, method: 'online', stage: 3, pieces: 6, rank: 50, driver: 'ravi' },
];

// These two numbers belong to Ravi's older jobs in the driver history.
const SKIPPED = [1029, 1030];
// Referral commissions point at these two of today's orders.
const ASSIGNED_CUSTOMERS = { 1039: 'Sunil Mehta', 1044: 'Ritu Patel' };

function buildOrders({ byName, others, orderCounts }) {
  let next = 0;
  const generic = () => others[next++ % others.length];
  const used = new Map();

  const make = (n, customer, fields) => {
    used.set(customer.name, (used.get(customer.name) ?? 0) + 1);
    const area = fields.area ?? (customer.name === 'Anita Singh' || customer.name === 'Kavya Nair'
      ? 'Vijay Nagar'
      : AREAS[n % AREAS.length]);
    const address =
      fields.address ??
      (customer.name === 'Anita Singh' ? '204, Shanti Residency, Vijay Nagar' : `${(n % 90) + 1}, ${area}`);
    const tax = Math.round((fields.total * 18) / 118);
    return {
      _id: new mongoose.Types.ObjectId(),
      code: orderCode(n),
      customer: customer._id,
      customerName: customer.name,
      phone: customer.phone,
      area,
      address,
      service: fields.service ?? 'Wash & iron',
      pieces: fields.pieces,
      subtotal: fields.total - tax,
      tax,
      total: fields.total,
      payment: {
        method: fields.method,
        paid: fields.method !== 'cod' || fields.stage === 6,
      },
      instructions: fields.instructions ?? '',
      pickupSlot: fields.pickupSlot ?? '14-16',
      pickupOtp: '1234',
      deliveryOtp: fields.deliveryOtp ?? '1234',
      stage: fields.stage,
      driver: fields.driver ?? null,
      driverName: fields.driverName ?? '',
      placedAt: fields.placedAt,
      deliveredAt: fields.stage === 6 ? fields.placedAt : undefined,
      demo: true,
    };
  };

  /* Today */
  const remaining = TODAY_STAGES.slice();
  NAMED.forEach((o) => (remaining[o.stage] -= 1));
  const stages = remaining.flatMap((count, stage) => Array(count).fill(stage));
  const codes = range(1055 - 1006 + 1)
    .map((i) => 1055 - i)
    .filter((n) => !SKIPPED.includes(n) && !NAMED.some((o) => o.n === n));

  const online = TODAY_ONLINE - sum(NAMED.filter((o) => o.method !== 'cod'));
  const cod = TODAY_COD - sum(NAMED.filter((o) => o.method === 'cod'));
  const isCod = (i) => i % 3 === 2;
  const onlineAmounts = split(online, stages.filter((_, i) => !isCod(i)).length);
  const codAmounts = split(cod, stages.filter((_, i) => isCod(i)).length);

  const todayOrders = [
    ...NAMED.map(({ n, customer, rank, driver, ...fields }) =>
      make(n, customer ? byName.get(customer) : generic(), {
        ...fields,
        placedAt: atTime(today, `01:${pad(rank - 10)}`),
      }),
    ),
    ...stages.map((stage, i) => {
      const n = codes[i];
      const customer = ASSIGNED_CUSTOMERS[n] ? byName.get(ASSIGNED_CUSTOMERS[n]) : generic();
      return make(n, customer, {
        stage,
        method: isCod(i) ? 'cod' : 'online',
        total: isCod(i) ? codAmounts.shift() : onlineAmounts.shift(),
        pieces: 3 + (i % 10),
        service: SERVICES[i % SERVICES.length],
        placedAt: atTime(today, `00:${pad(i + 1)}`),
      });
    }),
  ];

  /* The six days before today */
  // Family members' orders are placed first, spread through these days.
  const queue = orderCounts.flatMap(([name, count]) =>
    Array(Math.max(count - (used.get(name) ?? 0), 0)).fill(byName.get(name)),
  );
  const pastTotal = PAST_DAYS.reduce((a, b) => a + b, 0);
  let n = 1006 - pastTotal;
  let index = 0;
  const pastOrders = PAST_DAYS.flatMap((count, d) =>
    range(count).map((i) => {
      const isFamily = index % 2 === 0 && queue.length > 0;
      index += 1;
      return make(n++, isFamily ? queue.shift() : generic(), {
        stage: 6,
        method: index % 5 < 2 ? 'cod' : 'online',
        total: 260 + ((index * 17) % 24) * 10,
        pieces: 3 + (i % 10),
        service: SERVICES[i % SERVICES.length],
        placedAt: atTime(daysAgo(6 - d), `${pad(8 + (i % 12))}:${pad((i * 7) % 60)}`),
      });
    }),
  );

  /* Earlier this month, to bring online payments to the figure in the design */
  const earlierDays = Math.max(earlierDaysThisMonth - 6, 0);
  const onlineSoFar = sum(
    [...todayOrders, ...pastOrders].filter(
      (o) => o.payment.method !== 'cod' && o.placedAt >= atTime(monthStart),
    ),
  );
  const missing = MONTH_ONLINE - onlineSoFar;
  let earlierOrders = [];
  if (earlierDays > 0 && missing > 0) {
    const count = Math.min(Math.ceil(missing / 420), 600);
    const amounts = split(missing, count);
    earlierOrders = range(count).map((i) =>
      make(i + 1, generic(), {
        stage: 6,
        method: 'online',
        total: amounts[i],
        pieces: 3 + (i % 10),
        placedAt: atTime(addDays(monthStart, i % earlierDays), '11:30'),
      }),
    );
  }

  return { todayOrders, pastOrders, earlierOrders };
}

function sum(orders) {
  return orders.reduce((total, o) => total + o.total, 0);
}

module.exports = { buildOrders };
