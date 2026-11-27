const mongoose = require('mongoose');
const { monthStart, earlierDaysThisMonth, today, atTime, addDays, pad, range } = require('./common');

const TOTAL_CUSTOMERS = 1284;
const REFERRED_THIS_MONTH = 214;
const JOINED_TODAY = 12;
const REFERRALS_PER_SPONSOR = 4; // fewer than Anita's five, so she is shown first

const FIRST = ['Aarav', 'Diya', 'Kabir', 'Isha', 'Vivaan', 'Anaya', 'Rudra', 'Tara', 'Yash', 'Zoya',
  'Nikhil', 'Pallavi', 'Sahil', 'Ritika', 'Aman', 'Shreya', 'Varun', 'Nandini', 'Faizan', 'Kritika'];
const LAST = ['Agrawal', 'Bhatt', 'Chauhan', 'Dixit', 'Gehlot', 'Jaiswal', 'Kothari', 'Mandloi',
  'Pandey', 'Rathi', 'Saxena', 'Trivedi', 'Vyas'];

// [name, sponsor, orders placed, wallet balance, referral code]
const FAMILY = [
  ['Priya Sharma', null, 41, 3880, 'PRIYA482'],
  ['Anita Singh', 'Priya Sharma', 14, 1240, 'ANITA219'],
  ['Sunil Mehta', 'Anita Singh', 8, 610, 'SUNIL730'],
  ['Neha Jain', 'Anita Singh', 6, 420, 'NEHA056'],
  ['Arjun Khanna', 'Anita Singh', 5, 260, 'ARJUN904'],
  ['Farah Shaikh', 'Anita Singh', 0, 0, 'FARAH118'],
  ['Rohit Verma', 'Anita Singh', 3, 180],
  ['Deepak Verma', 'Sunil Mehta', 2, 90],
  ['Karan Malhotra', 'Sunil Mehta', 2, 40],
  ['Meera Nair', 'Sunil Mehta', 1, 0],
  ['Ritu Patel', 'Neha Jain', 3, 120],
  ['Imran Ali', 'Neha Jain', 2, 60],
  ['Pooja Rao', 'Arjun Khanna', 2, 35],
  ['Dev Sinha', 'Arjun Khanna', 1, 0],
  ['Anjali Gupta', 'Rohit Verma', 1, 20],
  ['Kiran Soni', 'Deepak Verma', 1, 0],
  ['Sneha Kulkarni', 'Ritu Patel', 1, 10],
  ['Manoj Yadav', 'Pooja Rao', 1, 15],
  ['Tanya Bose', 'Pooja Rao', 1, 0],
  ['Harish Menon', 'Dev Sinha', 1, 5],
];

const WALK_INS = ['Kavya Nair', 'Meera Joshi', 'Rahul Dubey', 'Nisha Verma', 'Rohit Sen', 'Sneha Rao'];

function buildCustomers() {
  const byName = new Map();
  const customers = [];

  const add = (fields) => {
    const customer = {
      _id: new mongoose.Types.ObjectId(),
      sponsor: null,
      status: 'active',
      walletBalance: 0,
      demo: true,
      ...fields,
    };
    customers.push(customer);
    return customer;
  };

  FAMILY.forEach(([name, sponsor, , walletBalance, code], i) => {
    byName.set(
      name,
      add({
        name,
        phone: name === 'Anita Singh' ? '9876543210' : `90000000${pad(i + 1)}`,
        referralCode: code ?? `${name.split(' ')[0].toUpperCase()}${300 + i}`,
        sponsor: byName.get(sponsor)?._id ?? null,
        walletBalance,
        status: name === 'Farah Shaikh' ? 'blocked' : 'active',
        joinedAt: atTime(addDays(monthStart, -500 + i), '10:00'),
      }),
    );
  });

  WALK_INS.forEach((name, i) => {
    byName.set(
      name,
      add({
        name,
        phone: `90000001${pad(i)}`,
        referralCode: `${name.split(' ')[0].toUpperCase()}${600 + i}`,
        joinedAt: atTime(addDays(monthStart, -400 + i), '10:00'),
      }),
    );
  });

  const generic = TOTAL_CUSTOMERS - customers.length;
  const older = generic - REFERRED_THIS_MONTH;
  const others = range(generic).map((i) => {
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`;
    const customer = add({
      name,
      phone: String(9100000000 + i),
      referralCode: `${name.split(' ')[0].toUpperCase()}${1000 + i}`,
      joinedAt: atTime(addDays(monthStart, -1 - (i % 300)), '12:00'),
    });
    return customer;
  });

  // The newest customers were referred this month; twelve of them today.
  others.slice(older).forEach((customer, i) => {
    customer.sponsor = others[Math.floor(i / REFERRALS_PER_SPONSOR)]._id;
    const earlier = i >= JOINED_TODAY && earlierDaysThisMonth > 0;
    const day = earlier ? addDays(monthStart, i % earlierDaysThisMonth) : today;
    customer.joinedAt = atTime(day, '00:05');
  });

  return {
    customers,
    byName,
    others: others.slice(0, older),
    referred: others.slice(older),
    orderCounts: FAMILY.map(([name, , count]) => [name, count]),
  };
}

module.exports = { buildCustomers };
