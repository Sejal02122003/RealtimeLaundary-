const { today, daysAgo, monthStart, earlierDaysThisMonth, atTime, addDays, pad, range } = require('./common');

const EARNING = 63;
const RAVI_WEEK_EARNINGS = 2150;

function buildJobs({ todayOrders, byKey }) {
  const jobs = [];
  let filler = 9000;
  const order = (n) => todayOrders.find((o) => o.code === `FF-${n}`);
  const driver = (key) => byKey.get(key);

  const base = (fields) => ({
    status: 'done',
    current: true,
    otp: '1234',
    earning: EARNING,
    customer: { name: 'Demo Customer', phone: '+919000000000', address: 'Vijay Nagar', area: 'Vijay Nagar' },
    ...fields,
  });

  /** A live job for one of today's orders. */
  function openJob(record, key, { status = 'assigned', time, distanceKm } = {}) {
    const isPickup = record.stage <= 1;
    const slot = record.pickupSlot === '10-12' ? ['12:00', '10 AM – 12 PM'] : ['16:00', '2 – 4 PM'];
    jobs.push(
      base({
        orderId: record.code,
        type: isPickup ? 'pickup' : 'delivery',
        driver: driver(key)._id,
        status,
        day: today,
        dueAt: atTime(today, time ?? (isPickup ? slot[0] : '18:30')),
        slotLabel: isPickup ? slot[1] : '',
        distanceKm,
        customer: {
          name: record.customerName,
          phone: '+919000000000', // placeholder number
          address: record.address,
          area: record.area,
          note: record.instructions,
        },
        service: record.service,
        pieces: record.pieces,
        weightKg: isPickup ? Math.max(1, Math.round(record.pieces / 3)) : 0,
        otp: isPickup ? record.pickupOtp : record.deliveryOtp,
        payment: isPickup
          ? undefined
          : { method: record.payment.method, amount: record.payment.method === 'cod' ? record.total : 0 },
      }),
    );
    record.driver = driver(key)._id;
    record.driverName = driver(key).name;
  }

  /** A finished (or missed or declined) job. */
  function closed(key, { day, time, type = 'pickup', status = 'done', orderId, ...rest }) {
    const closedAt = atTime(day, time);
    const job = base({
      orderId: orderId ?? `FF-${filler++}`,
      type,
      driver: driver(key)._id,
      status,
      current: status === 'done',
      day,
      dueAt: closedAt,
      closedAt,
      onTime: status === 'done' ? true : undefined,
      earning: status === 'done' ? EARNING : 0,
      ...rest,
    });
    jobs.push(job);
    return job;
  }

  const cod = (amount, deposited = false) => ({
    method: 'cod',
    amount,
    cashStatus: 'collected',
    collected: amount,
    depositedAt: deposited ? new Date() : null,
  });

  /* Today's named orders */
  openJob(order(1051), 'ravi', { distanceKm: 1.2 });
  openJob(order(1053), 'ravi', { distanceKm: 3.1 });
  openJob(order(1042), 'ravi', { distanceKm: 1.8 });
  openJob(order(1052), 'ravi', { status: 'offered', distanceKm: 2.4 });

  closed('ravi', { day: today, time: '09:40', type: 'delivery', orderId: 'FF-1038', payment: cod(420) });
  closed('ravi', { day: today, time: '09:05', orderId: 'FF-1049', pieces: 12 });
  closed('ravi', { day: today, time: '08:20', orderId: 'FF-1036', pieces: 6 });
  closed('sameer', { day: today, time: '08:45', orderId: 'FF-1047', pieces: 2 });
  closed('sameer', { day: today, time: '09:30', type: 'delivery', payment: cod(540) });
  closed('sameer', { day: today, time: '10:15' });
  closed('vikas', { day: today, time: '10:00', type: 'delivery', orderId: 'FF-1031' });
  closed('vikas', { day: today, time: '08:30' });
  closed('vikas', { day: today, time: '09:15' });
  for (const [n, key] of [[1047, 'sameer'], [1036, 'ravi'], [1049, 'ravi'], [1038, 'ravi'], [1031, 'vikas']]) {
    Object.assign(order(n), { driver: driver(key)._id, driverName: driver(key).name });
  }

  /* The rest of today's orders, shared among the other drivers */
  const named = new Set([1051, 1053, 1042, 1052].map((n) => `FF-${n}`));
  const busy = ['extra0', 'extra1', 'extra2', 'extra3'];
  // Separate turns, so every one of these drivers gets an accepted job.
  const rotate = () => {
    let turn = 0;
    return () => busy[turn++ % busy.length];
  };
  const nextBusy = rotate();
  const nextOther = rotate();
  let vikasHasPickup = false;

  todayOrders
    .filter((o) => !named.has(o.code))
    .forEach((record) => {
      if (record.stage === 1) {
        openJob(record, vikasHasPickup ? nextBusy() : 'vikas');
        vikasHasPickup = true;
      } else if (record.stage === 5) {
        openJob(record, nextBusy());
      } else if (record.stage === 4) {
        openJob(record, nextOther(), { status: 'offered' });
      } else if (record.stage > 1 && !record.driverName) {
        const who = driver(nextOther());
        Object.assign(record, { driver: who._id, driverName: who.name });
      }
    });

  /* Ravi's week: gives the earnings screen in the driver app */
  closed('ravi', { day: daysAgo(1), time: '18:10', type: 'delivery', orderId: 'FF-1030' });
  closed('ravi', {
    day: daysAgo(1),
    time: '17:30',
    orderId: 'FF-1029',
    status: 'missed',
    missedReason: 'Customer unavailable',
  });
  range(30).forEach((i) => {
    const type = i % 2 ? 'delivery' : 'pickup';
    let payment;
    if (i === 1) payment = cod(310);
    else if (i === 3) payment = cod(356);
    else if (type === 'delivery') payment = cod(180, true);
    closed('ravi', {
      day: daysAgo(1 + (i % 6)),
      time: `${pad(9 + Math.floor(i / 6))}:15`,
      type,
      pieces: 5 + (i % 6),
      ...(payment && { payment }),
    });
  });
  const raviJobs = () => jobs.filter((j) => j.driver === driver('ravi')._id && j.status === 'done');
  // Bring this week's job earnings to exactly ₹2,150.
  raviJobs().at(-1).earning = RAVI_WEEK_EARNINGS - EARNING * (raviJobs().length - 1);
  [2, 4].forEach((days) => closed('ravi', { day: daysAgo(days), time: '13:00', status: 'declined' }));

  /* Older work, for the month's totals and on-time rates */
  for (const info of byKey.values()) {
    const mine = () => jobs.filter((j) => j.driver === info._id && j.status === 'done');
    const inMonth = () => mine().filter((j) => j.closedAt >= atTime(monthStart)).length;

    // Ravi's last seven days are already complete.
    const newest = info.key === 'ravi' ? 7 : 1;
    const days = Math.max(earlierDaysThisMonth - newest + 1, 0);
    const wanted = Math.max(info.month - inMonth(), 0);
    if (days > 0) {
      range(wanted).forEach((i) => closed(info.key, { day: daysAgo(newest + (i % days)), time: '11:00' }));
    }
    // Early in the month, keep enough history for a meaningful on-time rate.
    range(Math.max(50 - mine().length, 0)).forEach((i) =>
      closed(info.key, { day: addDays(today, -(8 + (i % 20))), time: '11:00' }),
    );

    const lateCount = (total) => Math.round((total * (100 - info.onTime)) / 100);
    const percent = (total) => Math.round(((total - lateCount(total)) * 100) / total);
    // Some job counts cannot produce the exact rate. A few jobs from the end of
    // last month (outside the monthly count) make up the difference.
    for (let i = 0; i < 10 && percent(mine().length) !== info.onTime; i += 1) {
      closed(info.key, { day: addDays(monthStart, -1), time: '11:00' });
    }

    const done = mine().sort((a, b) => a.closedAt - b.closedAt);
    done.slice(0, lateCount(done.length)).forEach((job) => (job.onTime = false));
  }

  return jobs;
}

module.exports = { buildJobs };
