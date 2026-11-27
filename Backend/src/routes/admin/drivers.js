const express = require('express');
const { Driver, DOCUMENT_TYPES, VEHICLE_TYPES } = require('../../models/Driver');
const { Job } = require('../../models/Job');
const { Session } = require('../../models/Session');
const { OPEN_JOB, syncFromJob } = require('../../services/orders');
const { driverStats, activity, UNDEPOSITED_CASH } = require('../../services/driverStats');
const { sendUpload } = require('../../utils/sendUpload');
const { requireId } = require('../../utils/query');
const { HttpError, text, parsePhone } = require('../../utils/http');

const TYPES = Object.keys(DOCUMENT_TYPES);

const router = express.Router();

/** A driver can be reviewed once every document is uploaded and none is rejected. */
const readyForReview = (driver) =>
  TYPES.every((type) => ['pending', 'verified'].includes(driver.documents?.[type]?.status));

router.get('/', async (_req, res) => {
  const [drivers, statsFor] = await Promise.all([Driver.find().sort({ createdAt: 1 }), driverStats()]);

  const pending = drivers.filter((d) => d.status === 'pending');
  const waiting = pending.filter(readyForReview).map((driver) => ({
    id: driver.id,
    name: driver.name,
    phone: driver.phone,
    vehicle: { type: driver.vehicle.type, plate: driver.vehicle.plate },
    appliedAt: driver.createdAt,
  }));

  const active = drivers
    .filter((d) => d.status !== 'pending')
    .map((driver) => {
      const stats = statsFor(driver._id);
      return {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        active: driver.status === 'approved',
        activity: activity(driver, stats),
        jobsToday: stats.jobsToday,
        completedMonth: stats.completedMonth,
        onTimePercent: stats.onTimePercent,
        cashHeld: stats.cashHeld,
      };
    })
    .sort((a, b) => b.completedMonth - a.completedMonth || a.name.localeCompare(b.name));

  res.json({
    waiting,
    incomplete: pending
      .filter((d) => !readyForReview(d))
      .map((d) => ({ id: d.id, name: d.name, phone: d.phone })),
    drivers: active,
  });
});

router.post('/', async (req, res) => {
  const name = text(req.body?.name);
  if (name.length < 2 || name.length > 60) throw new HttpError(400, "Enter the driver's full name");
  const phone = parsePhone(req.body?.phone);
  const type = text(req.body?.type);
  if (!VEHICLE_TYPES.includes(type)) throw new HttpError(400, 'Choose a vehicle type');
  const plate = text(req.body?.plate).toUpperCase().replace(/\s+/g, ' ');
  if (!/^[A-Z]{2} ?\d{1,2} ?[A-Z]{0,3} ?\d{4}$/.test(plate)) {
    throw new HttpError(400, 'Enter a valid number plate, like MP09 AB 4521');
  }

  try {
    await Driver.create({ name, phone, vehicle: { type, plate } });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'A driver already uses this mobile number');
    throw err;
  }
  res.status(201).json({ ok: true });
});

async function findDriver(id) {
  const driver = await Driver.findById(requireId(id, 'Driver'));
  if (!driver) throw new HttpError(404, 'Driver not found');
  return driver;
}

router.get('/:id/documents/:type', async (req, res) => {
  const driver = await findDriver(req.params.id);
  const { type } = req.params;
  const document = Object.hasOwn(DOCUMENT_TYPES, type) && driver.documents?.[type];
  if (!document) throw new HttpError(404, 'This document has not been uploaded');
  await sendUpload(res, document.file);
});

async function findApplicant(id) {
  const driver = await findDriver(id);
  if (driver.status !== 'pending' || !readyForReview(driver)) {
    throw new HttpError(409, 'This application is not waiting for approval');
  }
  return driver;
}

router.post('/:id/approve', async (req, res) => {
  const driver = await findApplicant(req.params.id);
  if (!driver.vehicle.plate) throw new HttpError(409, 'The driver has not saved a number plate yet');
  TYPES.forEach((type) => driver.set(`documents.${type}.status`, 'verified'));
  driver.status = 'approved';
  await driver.save();
  res.json({ ok: true });
});

router.post('/:id/reject', async (req, res) => {
  const driver = await findApplicant(req.params.id);
  // The driver app asks for rejected documents to be uploaded again.
  TYPES.forEach((type) => driver.set(`documents.${type}.status`, 'rejected'));
  await driver.save();
  res.json({ ok: true });
});

router.post('/:id/active', async (req, res) => {
  if (typeof req.body?.active !== 'boolean') throw new HttpError(400, 'Invalid request');
  const driver = await findDriver(req.params.id);
  if (driver.status === 'pending') throw new HttpError(409, 'Approve this driver first');

  driver.status = req.body.active ? 'approved' : 'blocked';
  driver.online = false;
  await driver.save();

  if (!req.body.active) {
    await Session.deleteMany({ driver: driver._id });
    // Return their open work to the unassigned queue.
    const open = await Job.find({ driver: driver._id, status: { $in: OPEN_JOB } });
    for (const job of open) {
      job.set({ status: 'cancelled', current: false, closedAt: new Date() });
      await job.save();
      await syncFromJob(job);
    }
  }
  res.json({ ok: true });
});

router.post('/:id/deposit', async (req, res) => {
  const driver = await findDriver(req.params.id);
  const result = await Job.updateMany(
    { ...UNDEPOSITED_CASH, driver: driver._id },
    { 'payment.depositedAt': new Date() },
  );
  if (!result.modifiedCount) throw new HttpError(409, 'This driver has no cash to deposit');
  res.json({ orders: result.modifiedCount });
});

module.exports = router;
