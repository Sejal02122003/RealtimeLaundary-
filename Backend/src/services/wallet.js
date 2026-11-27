const { Customer } = require('../models/Customer');
const { WalletTransaction } = require('../models/Finance');
const { HttpError } = require('../utils/http');

/** Adds (or, with a negative amount, removes) money. A balance never goes below zero. */
async function moveMoney(customerId, { type, title, detail = '', amount }) {
  const filter = { _id: customerId };
  if (amount < 0) filter.walletBalance = { $gte: -amount };

  const customer = await Customer.findOneAndUpdate(
    filter,
    { $inc: { walletBalance: amount } },
    { returnDocument: 'after' },
  );
  if (!customer) throw new HttpError(409, 'The wallet balance is too low');

  await WalletTransaction.create({ customer: customerId, type, title, detail, amount, at: new Date() });
  return customer;
}

module.exports = { moveMoney };
