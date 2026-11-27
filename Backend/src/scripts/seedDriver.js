/**
 * Creates demo drivers and jobs. Only the two demo accounts and their own data
 * are replaced; nothing else in the database is touched.
 *
 *   npm run seed:driver
 */
require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Driver } = require('../models/Driver');
const { Job } = require('../models/Job');
const { Incentive } = require('../models/Incentive');
const { Session } = require('../models/Session');
const { Otp } = require('../models/Otp');
const { dayKey, atTime, addDays } = require('../utils/time');

const APPROVED_PHONE = '9988776655';
const PENDING_PHONE = '9988776656';
const PICKUP_EARNING = 63;

const today = dayKey();
const daysAgo = (days) => addDays(today, -days);

const customer = (name, address, area, note = '') => ({
  name,
  address,
  area,
  note,
  phone: '+919000000000', // placeholder number
});

const demoDocument = (status = 'verified') => ({
  file: 'demo/placeholder.pdf',
  originalName: 'demo.pdf',
  uploadedAt: atTime(daysAgo(2), '11:00'),
  status,
});

function openJob({ orderId, type, status = 'assigned', time, slotLabel = '', otp = '1234', ...rest }) {
  return {
    orderId,
    type,
    status,
    day: today,
    slotLabel,
    dueAt: atTime(today, time),
    otp,
    earning: PICKUP_EARNING,
    ...rest,
  };
}

function closedJob({ orderId, type, day, time, status = 'done', onTime = true, ...rest }) {
  const closedAt = atTime(day, time);
  return {
    orderId,
    type,
    status,
    day,
    dueAt: closedAt,
    closedAt,
    onTime: status === 'done' ? onTime : undefined,
    otp: '1234',
    customer: customer('Demo Customer', 'Vijay Nagar', 'Vijay Nagar'),
    earning: status === 'done' ? PICKUP_EARNING : 0,
    ...rest,
  };
}

const cod = (amount, { deposited = false } = {}) => ({
  method: 'cod',
  amount,
  cashStatus: 'collected',
  collected: amount,
  depositedAt: deposited ? new Date() : null,
});

function openJobs() {
  return [
    openJob({
      orderId: 'FF-1051',
      type: 'pickup',
      time: '12:00',
      slotLabel: '10 AM – 12 PM',
      customer: customer('Meera Joshi', '18, Sector C, Scheme 78', 'Sector C, Scheme 78', 'Ring the bell twice'),
      distanceKm: 1.2,
      service: 'Wash & iron',
      bags: 1,
      pieces: 8,
      weightKg: 3,
    }),
    openJob({
      orderId: 'FF-1053',
      type: 'pickup',
      time: '16:00',
      slotLabel: '2 – 4 PM',
      customer: customer('Rahul Dubey', '42, MG Road, Palasia', 'Palasia'),
      distanceKm: 3.1,
      service: 'Dry clean',
      bags: 1,
      pieces: 3,
      weightKg: 2,
    }),
    openJob({
      orderId: 'FF-1042',
      type: 'delivery',
      time: '18:30',
      otp: '7305', // matches the order shown in the customer app
      customer: customer('Anita Singh', '204, Shanti Residency, Vijay Nagar', 'Vijay Nagar'),
      distanceKm: 1.8,
      service: 'Wash & iron',
      bags: 1,
      pieces: 7,
      payment: { method: 'cod', amount: 236 },
    }),
    openJob({
      orderId: 'FF-1055',
      type: 'pickup',
      status: 'offered',
      time: '16:00',
      slotLabel: '2 – 4 PM',
      customer: customer('Nisha Verma', '9, Scheme 54', 'Scheme 54'),
      distanceKm: 2.4,
      service: 'Wash & iron',
      bags: 1,
      pieces: 6,
      weightKg: 2,
    }),
  ];
}

/**
 * Past work that produces the history screen: 34 jobs in the last seven days
 * earning ₹2,150, 96% on time over 30 days and ₹1,086 of cash to deposit.
 */
function pastJobs() {
  const jobs = [
    closedJob({ orderId: 'FF-1038', type: 'delivery', day: today, time: '09:40', payment: cod(420) }),
    closedJob({ orderId: 'FF-1049', type: 'pickup', day: today, time: '09:05', pieces: 12 }),
    closedJob({ orderId: 'FF-1036', type: 'pickup', day: today, time: '08:20', pieces: 6 }),
    closedJob({ orderId: 'FF-1031', type: 'delivery', day: daysAgo(1), time: '18:10' }),
    closedJob({
      orderId: 'FF-1029',
      type: 'pickup',
      day: daysAgo(1),
      time: '17:30',
      status: 'missed',
      missedReason: 'Customer unavailable',
    }),
  ];

  // 30 more completed jobs earlier in the week.
  for (let i = 0; i < 30; i += 1) {
    const type = i % 2 ? 'delivery' : 'pickup';
    let payment;
    if (i === 1) payment = cod(310);
    else if (i === 3) payment = cod(356);
    else if (type === 'delivery') payment = cod(180, { deposited: true });

    jobs.push(
      closedJob({
        orderId: `FF-${900 + i}`,
        type,
        day: daysAgo(1 + (i % 6)),
        time: `${String(9 + Math.floor(i / 6)).padStart(2, '0')}:15`,
        onTime: i !== 7,
        pieces: 5 + (i % 6),
        ...(payment && { payment }),
      }),
    );
  }

  // 16 older jobs that only count towards the 30-day on-time rate.
  for (let i = 0; i < 16; i += 1) {
    jobs.push(
      closedJob({
        orderId: `FF-${800 + i}`,
        type: 'pickup',
        day: daysAgo(8 + i),
        time: '11:00',
        onTime: i !== 0,
      }),
    );
  }

  // Bring this week's job earnings to exactly ₹2,150.
  jobs[5].earning = 2150 - PICKUP_EARNING * 33;

  for (const [orderId, days] of [['FF-860', 2], ['FF-861', 4]]) {
    jobs.push(closedJob({ orderId, type: 'pickup', day: daysAgo(days), time: '13:00', status: 'declined' }));
  }

  return jobs;
}

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to write demo data in production');
  }

  await connectDB();
  await Promise.all([Driver.init(), Job.init()]);

  const phones = [APPROVED_PHONE, PENDING_PHONE];
  const ids = await Driver.find({ phone: { $in: phones } }).distinct('_id');
  await Promise.all([
    Job.deleteMany({ driver: { $in: ids } }),
    Incentive.deleteMany({ driver: { $in: ids } }),
    Session.deleteMany({ driver: { $in: ids } }),
    Otp.deleteMany({ phone: { $in: phones } }),
  ]);
  await Driver.deleteMany({ _id: { $in: ids } });

  const [ravi] = await Driver.create([
    {
      name: 'Ravi Kumar',
      phone: APPROVED_PHONE,
      status: 'approved',
      online: true,
      vehicle: { type: 'two_wheeler', plate: 'MP09 AB 4521' },
      documents: {
        licence: demoDocument(),
        identity: demoDocument(),
        registration: demoDocument(),
      },
    },
    {
      name: 'Sameer Khan',
      phone: PENDING_PHONE,
      vehicle: { type: 'two_wheeler', plate: 'MP09 CD 7788' },
      documents: { licence: demoDocument(), identity: demoDocument() },
    },
  ]);

  await Job.create(
    [...openJobs(), ...pastJobs()].map((job) => ({ ...job, driver: ravi._id })),
  );
  await Incentive.create({
    driver: ravi._id,
    title: 'Weekly incentive',
    amount: 300,
    awardedAt: atTime(daysAgo(1), '20:00'),
  });

  console.log(`
Demo data is ready.
  Approved driver:  ${APPROVED_PHONE}  (Ravi Kumar)
  Pending driver:   ${PENDING_PHONE}  (Sameer Khan, 1 document left)
  Login OTP:        1234  (with "npm run dev")
  Customer OTPs:    FF-1042 delivery 7305, all pickups 1234
`);
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
