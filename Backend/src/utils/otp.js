const crypto = require('node:crypto');
const { Otp } = require('../models/Otp');
const { isOtpDemoMode, DEMO_OTP } = require('../config/env');
const { HttpError } = require('./http');

const CODE_LIFETIME_MS = 5 * 60 * 1000;
const RESEND_WAIT_MS = 20 * 1000;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const MAX_ATTEMPTS = 5;

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

async function deliverSms(_phone, _code) {
  // Connect an SMS provider here before going to production.
  throw new HttpError(503, 'SMS delivery is not configured on this server');
}

async function sendOtp(phone) {
  const now = Date.now();
  const existing = await Otp.findOne({ phone });
  const inWindow = existing && now - existing.windowStart < WINDOW_MS;

  if (existing && now - existing.sentAt < RESEND_WAIT_MS) {
    throw new HttpError(429, 'An OTP was just sent. Wait a few seconds before asking again.');
  }
  if (inWindow && existing.sends >= MAX_SENDS_PER_WINDOW) {
    throw new HttpError(429, 'Too many OTP requests. Try again in 15 minutes.');
  }

  const demo = isOtpDemoMode();
  const code = demo ? DEMO_OTP : String(crypto.randomInt(0, 10000)).padStart(4, '0');
  if (!demo) await deliverSms(phone, code);

  const windowStart = inWindow ? existing.windowStart : new Date(now);
  try {
    // Matching on the old sentAt stops parallel requests from both succeeding.
    await Otp.findOneAndUpdate(
      { phone, sentAt: existing ? existing.sentAt : { $exists: false } },
      {
        codeHash: sha256(code),
        expiresAt: new Date(now + CODE_LIFETIME_MS),
        attempts: 0,
        sentAt: new Date(now),
        sends: inWindow ? existing.sends + 1 : 1,
        windowStart,
        purgeAt: new Date(windowStart.getTime() + WINDOW_MS + CODE_LIFETIME_MS),
      },
      { upsert: true },
    );
  } catch (err) {
    if (err.code === 11000) {
      throw new HttpError(429, 'An OTP was just sent. Wait a few seconds before asking again.');
    }
    throw err;
  }

  return demo ? { demoOtp: code } : {};
}

/** Checks and consumes the code. Each code works once and allows a few attempts. */
async function verifyOtp(phone, code) {
  const record = await Otp.findOneAndUpdate(
    { phone, expiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { returnDocument: 'after' },
  );
  if (!record) throw new HttpError(400, 'That OTP has expired. Request a new one.');
  if (record.codeHash !== sha256(code)) throw new HttpError(400, 'That OTP is not correct');

  const used = await Otp.findOneAndDelete({ _id: record._id, codeHash: record.codeHash });
  if (!used) throw new HttpError(400, 'That OTP has already been used');
}

module.exports = { sendOtp, verifyOtp, sha256 };
