const crypto = require('node:crypto');
const express = require('express');
const { Driver } = require('../../models/Driver');
const { Session } = require('../../models/Session');
const { requireDriver } = require('../../middleware/auth');
const { sendOtp, verifyOtp, sha256 } = require('../../utils/otp');
const { HttpError, text, parsePhone } = require('../../utils/http');

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

const router = express.Router();

async function startSession(driver) {
  const token = crypto.randomBytes(32).toString('base64url');
  await Session.create({
    tokenHash: sha256(token),
    driver: driver._id,
    expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS),
  });
  return { token, driver: driver.toClient() };
}

const parseOtp = (value) => {
  const otp = text(value);
  if (!/^\d{4}$/.test(otp)) throw new HttpError(400, 'Enter the 4-digit OTP');
  return otp;
};

router.post('/otp', async (req, res) => {
  const phone = parsePhone(req.body?.phone);
  res.json({ sent: true, ...(await sendOtp(phone)) });
});

router.post('/login', async (req, res) => {
  const phone = parsePhone(req.body?.phone);
  await verifyOtp(phone, parseOtp(req.body?.otp));

  const driver = await Driver.findOne({ phone });
  if (!driver) {
    throw new HttpError(404, 'This number is not registered. Register as a new driver.');
  }
  if (driver.status === 'blocked') {
    throw new HttpError(403, 'This account is blocked. Contact support.');
  }
  res.json(await startSession(driver));
});

router.post('/register', async (req, res) => {
  const phone = parsePhone(req.body?.phone);
  const name = text(req.body?.name);
  if (name.length < 2 || name.length > 60) throw new HttpError(400, 'Enter your full name');
  const otp = parseOtp(req.body?.otp);

  await verifyOtp(phone, otp);

  try {
    const driver = await Driver.create({ name, phone });
    res.status(201).json(await startSession(driver));
  } catch (err) {
    if (err.code === 11000) {
      throw new HttpError(409, 'This number is already registered. Log in instead.');
    }
    throw err;
  }
});

router.post('/logout', requireDriver, async (req, res) => {
  await req.session.deleteOne();
  res.status(204).end();
});

module.exports = router;
