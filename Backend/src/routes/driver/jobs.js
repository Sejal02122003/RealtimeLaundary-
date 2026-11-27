const express = require('express');
const mongoose = require('mongoose');
const { Job } = require('../../models/Job');
const { upload } = require('../../middleware/upload');
const { syncFromJob } = require('../../services/orders');
const { checkFile, saveFile, removeFile } = require('../../utils/files');
const { dayKey, atTime, addDays } = require('../../utils/time');
const { HttpError, text, parseWholeNumber } = require('../../utils/http');

const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCK_MS = 15 * 60 * 1000;
const MISSED_REASONS = ['Customer unavailable', 'Wrong address', 'Customer asked to reschedule'];

const router = express.Router();

router.param('id', (req, _res, next, id) => {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Job not found');
  next();
});

const ownJob = (req) => ({ _id: req.params.id, driver: req.driver._id });

async function findAssignedJob(req) {
  const job = await Job.findOne(ownJob(req));
  if (!job) throw new HttpError(404, 'Job not found');
  if (job.status !== 'assigned') throw new HttpError(409, 'This job is not open any more');
  return job;
}

router.get('/dashboard', async (req, res) => {
  const driver = req.driver._id;
  const today = dayKey();
  const closedToday = {
    $gte: atTime(today),
    $lt: atTime(addDays(today, 1)),
  };

  const [open, done, missed, offer] = await Promise.all([
    Job.find({ driver, status: 'assigned' }).sort({ dueAt: 1 }),
    Job.countDocuments({ driver, status: 'done', closedAt: closedToday }),
    Job.countDocuments({ driver, status: 'missed', closedAt: closedToday }),
    req.driver.online ? Job.findOne({ driver, status: 'offered' }).sort({ createdAt: 1 }) : null,
  ]);

  const ofType = (type) => open.filter((job) => job.type === type).map((job) => job.toClient());

  res.json({
    driver: req.driver.toClient(),
    today,
    stats: { assigned: open.length + done + missed, pending: open.length, done },
    offer: offer?.toClient() ?? null,
    pickups: ofType('pickup'),
    deliveries: ofType('delivery'),
  });
});

router.get('/:id', async (req, res) => {
  const job = await Job.findOne(ownJob(req));
  if (!job) throw new HttpError(404, 'Job not found');
  res.json({ job: job.toClient() });
});

async function answerOffer(req, update) {
  const job = await Job.findOneAndUpdate({ ...ownJob(req), status: 'offered' }, update, {
    returnDocument: 'after',
  });
  if (!job) throw new HttpError(409, 'This request is no longer available');
  await syncFromJob(job);
  return job;
}

router.post('/:id/accept', async (req, res) => {
  if (!req.driver.online) throw new HttpError(409, 'Go online to accept requests');
  const job = await answerOffer(req, { status: 'assigned', acceptedAt: new Date() });
  res.json({ job: job.toClient() });
});

router.post('/:id/decline', async (req, res) => {
  const job = await answerOffer(req, { status: 'declined', current: false, closedAt: new Date() });
  res.json({ job: job.toClient() });
});

/** Counts the attempt first, so parallel guesses cannot get past the limit. */
async function checkCustomerOtp(req, otp) {
  const job = await Job.findOneAndUpdate(
    {
      ...ownJob(req),
      status: 'assigned',
      otpAttempts: { $lt: MAX_OTP_ATTEMPTS },
      $or: [{ otpLockedUntil: null }, { otpLockedUntil: { $lte: new Date() } }],
    },
    { $inc: { otpAttempts: 1 } },
    { returnDocument: 'after' },
  );
  const locked = new HttpError(429, 'Too many wrong OTPs. Try again in 15 minutes.');
  if (!job) throw locked;
  if (job.otp === otp) return;

  if (job.otpAttempts >= MAX_OTP_ATTEMPTS) {
    await Job.updateOne(
      { _id: job._id },
      { otpAttempts: 0, otpLockedUntil: new Date(Date.now() + OTP_LOCK_MS) },
    );
    throw locked;
  }
  throw new HttpError(400, 'That OTP is not correct. Check with the customer.');
}

function readPickupCount(body) {
  return {
    bags: parseWholeNumber(body?.bags, { label: 'Bags', min: 1, max: 50 }),
    pieces: parseWholeNumber(body?.pieces, { label: 'Pieces', min: 1, max: 500 }),
    weightKg: parseWholeNumber(body?.weightKg, { label: 'Weight', min: 0, max: 200 }),
  };
}

function readCash(job, body) {
  const { method, amount } = job.payment;
  if (method !== 'cod') return {};

  const cashStatus = text(body?.cashStatus);
  if (cashStatus === 'collected') return cashUpdate(cashStatus, amount);
  if (cashStatus === 'not_paid') return cashUpdate(cashStatus, 0);
  if (cashStatus === 'partial') {
    const collected = parseWholeNumber(body?.collected, {
      label: 'Cash received',
      min: 1,
      max: amount - 1,
    });
    return cashUpdate(cashStatus, collected);
  }
  throw new HttpError(400, 'Say whether the cash was collected');
}

const cashUpdate = (cashStatus, collected) => ({
  'payment.cashStatus': cashStatus,
  'payment.collected': collected,
});

router.post('/:id/complete', upload.single('photo'), async (req, res) => {
  const job = await findAssignedJob(req);

  // Validate everything else first so a typo elsewhere does not use up an OTP attempt.
  const details = job.type === 'pickup' ? readPickupCount(req.body) : readCash(job, req.body);
  checkFile(req.file);
  const otp = text(req.body?.otp);
  if (!/^\d{4}$/.test(otp)) throw new HttpError(400, 'Enter the 4-digit OTP');

  await checkCustomerOtp(req, otp);

  const photo = await saveFile(req.file, `jobs/${job.id}`);
  const closedAt = new Date();
  const completed = await Job.findOneAndUpdate(
    { ...ownJob(req), status: 'assigned' },
    { ...details, photo, status: 'done', closedAt, onTime: closedAt <= job.dueAt },
    { returnDocument: 'after' },
  );
  if (!completed) {
    await removeFile(photo);
    throw new HttpError(409, 'This job is not open any more');
  }
  await syncFromJob(completed);
  res.json({ job: completed.toClient() });
});

router.post('/:id/missed', async (req, res) => {
  const reason = text(req.body?.reason);
  if (!MISSED_REASONS.includes(reason)) throw new HttpError(400, 'Choose a reason');

  const job = await Job.findOneAndUpdate(
    { ...ownJob(req), status: 'assigned' },
    { status: 'missed', current: false, missedReason: reason, closedAt: new Date() },
    { returnDocument: 'after' },
  );
  if (!job) throw new HttpError(409, 'This job is not open any more');
  await syncFromJob(job);
  res.json({ job: job.toClient() });
});

module.exports = router;
