const crypto = require('node:crypto');
const express = require('express');
const { Admin, AdminSession } = require('../../models/Admin');
const { requireAdmin } = require('../../middleware/adminAuth');
const { hashPassword, checkPassword } = require('../../utils/password');
const { sha256 } = require('../../utils/otp');
const { HttpError, text } = require('../../utils/http');

const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;

const router = express.Router();

// Compared against when the email is unknown, so both cases take the same time.
const decoy = hashPassword(crypto.randomBytes(16).toString('hex'));

router.post('/login', async (req, res) => {
  const email = text(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password || password.length > 200) {
    throw new HttpError(400, 'Enter your email and password');
  }

  const wrong = new HttpError(401, 'The email or password is not correct');
  const locked = new HttpError(429, 'Too many attempts. Try again in 15 minutes.');

  // Count the attempt first, so parallel guesses cannot get past the limit.
  const admin = await Admin.findOneAndUpdate(
    { email, $or: [{ lockedUntil: null }, { lockedUntil: { $lte: new Date() } }] },
    { $inc: { failedAttempts: 1 } },
    { returnDocument: 'after' },
  );
  if (!admin) {
    if (await Admin.exists({ email })) throw locked;
    await checkPassword(password, await decoy);
    throw wrong;
  }

  const valid = admin.failedAttempts <= MAX_FAILURES && (await checkPassword(password, admin));
  if (!valid) {
    if (admin.failedAttempts >= MAX_FAILURES) {
      await Admin.updateOne(
        { _id: admin._id },
        { failedAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_MS) },
      );
      throw locked;
    }
    throw wrong;
  }

  await Admin.updateOne({ _id: admin._id }, { failedAttempts: 0, lockedUntil: null });
  const token = crypto.randomBytes(32).toString('base64url');
  await AdminSession.create({
    tokenHash: sha256(token),
    admin: admin._id,
    expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS),
  });
  res.json({ token, email: admin.email });
});

router.post('/logout', requireAdmin, async (req, res) => {
  await req.session.deleteOne();
  res.status(204).end();
});

module.exports = router;
