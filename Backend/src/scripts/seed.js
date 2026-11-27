/**
 * Fills the database with demo data for the admin panel and the driver app.
 * Running it again replaces the demo records only.
 *
 *   npm run seed:demo
 */
require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Driver } = require('../models/Driver');
const { Job } = require('../models/Job');
const { Incentive } = require('../models/Incentive');
const { Session } = require('../models/Session');
const { Otp } = require('../models/Otp');
const { Customer } = require('../models/Customer');
const { Order } = require('../models/Order');
const { Service, Offer } = require('../models/Catalog');
const { getSettings } = require('../models/Settings');
const { WalletTransaction, Withdrawal, Commission, Refund } = require('../models/Finance');
const { daysAgo, atTime } = require('./seed/common');
const { buildCustomers } = require('./seed/customers');
const { buildDrivers, writeDocuments, PHONES } = require('./seed/drivers');
const { buildOrders } = require('./seed/orders');
const { buildJobs } = require('./seed/jobs');
const { buildMoney } = require('./seed/money');

const service = (category, name, price, pricingModel = 'piece', available = true) => ({
  category,
  name,
  price,
  pricingModel,
  available,
});

const SERVICES = [
  service('wash-iron', 'Shirt', 25),
  service('wash-iron', 'Trousers', 30),
  service('wash-iron', 'Bedsheet (double)', 80),
  service('wash-iron', 'Kurta', 35, 'piece', false),
  service('by-weight', 'Wash & fold', 70, 'kg'),
  service('by-weight', 'Wash & press', 110, 'kg'),
  service('dry-clean', 'Blazer', 250),
  service('dry-clean', 'Saree', 180),
  service('dry-clean', 'Sweater', 140),
  service('packages', 'Family pack', 599, 'pack'),
  service('packages', 'Solo pack', 329, 'pack'),
];

const OFFERS = [
  { code: 'FRESH40', type: 'flat', value: 40, minimum: 200, active: true },
  { code: 'FIRSTWASH', type: 'percent', value: 20, firstOrderOnly: true, active: false },
];

/** Removes what an earlier run created, including changes made to it since. */
async function clearDemoData() {
  const [customers, drivers, orderCodes] = await Promise.all([
    Customer.find({ demo: true }).distinct('_id'),
    Driver.find({ phone: { $in: PHONES } }).distinct('_id'),
    Order.find({ demo: true }).distinct('code'),
  ]);
  const ofCustomers = { $in: customers };

  await Promise.all([
    Job.deleteMany({ $or: [{ driver: { $in: drivers } }, { orderId: { $in: orderCodes } }] }),
    Incentive.deleteMany({ driver: { $in: drivers } }),
    Session.deleteMany({ driver: { $in: drivers } }),
    Otp.deleteMany({ phone: { $in: PHONES } }),
    WalletTransaction.deleteMany({ customer: ofCustomers }),
    Withdrawal.deleteMany({ customer: ofCustomers }),
    Commission.deleteMany({ earner: ofCustomers }),
    Refund.deleteMany({ customer: ofCustomers }),
    Service.deleteMany({ demo: true }),
    Offer.deleteMany({ demo: true }),
  ]);
  await Order.deleteMany({ demo: true });
  await Customer.deleteMany({ demo: true });
  await Driver.deleteMany({ _id: { $in: drivers } });
}

/** Adds a catalogue entry unless one with the same key already exists. */
const addMissing = (Model, rows, keys) =>
  Model.bulkWrite(
    rows.map((row) => ({
      updateOne: {
        filter: Object.fromEntries(keys.map((key) => [key, row[key]])),
        update: { $setOnInsert: { ...row, demo: true } },
        upsert: true,
      },
    })),
  );

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to write demo data in production');
  }

  await connectDB();
  // Replaces indexes left by earlier versions.
  await Job.syncIndexes();
  await Promise.all(
    [Driver, Customer, Order, Service, Offer, Commission].map((Model) => Model.init()),
  );
  await clearDemoData();

  const people = buildCustomers();
  const { drivers, byKey } = buildDrivers();
  const { todayOrders, pastOrders, earlierOrders } = buildOrders(people);
  const jobs = buildJobs({ todayOrders, byKey });
  const money = buildMoney({ ...people, pastOrders });

  await writeDocuments();
  await Customer.insertMany(people.customers);
  await Driver.insertMany(drivers, { timestamps: false });
  await Order.insertMany([...todayOrders, ...pastOrders, ...earlierOrders]);
  await Job.insertMany(jobs);
  await Promise.all([
    Withdrawal.insertMany(money.withdrawals),
    Commission.insertMany(money.commissions),
    WalletTransaction.insertMany(money.transactions),
    Refund.insertMany(money.refunds),
    Incentive.create({
      driver: byKey.get('ravi')._id,
      title: 'Weekly incentive',
      amount: 300,
      awardedAt: atTime(daysAgo(1), '20:00'),
    }),
    addMissing(Service, SERVICES, ['category', 'name']),
    addMissing(Offer, OFFERS, ['code']),
    getSettings(),
  ]);

  console.log(`
Demo data is ready.

Admin panel
  Create your login with:  npm run admin:create -- you@example.com

Driver app (login OTP 1234 with "npm run dev")
  9988776655  Ravi Kumar, approved, has jobs
  9988776656  Mohit Sharma, one document left
  Customer OTPs: delivery FF-1042 is 7305, all other trips 1234
`);
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
