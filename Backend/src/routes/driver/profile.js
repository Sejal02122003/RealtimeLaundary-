const express = require('express');
const { DOCUMENT_TYPES, VEHICLE_TYPES } = require('../../models/Driver');
const { requireApproved } = require('../../middleware/auth');
const { upload } = require('../../middleware/upload');
const { saveFile, removeFile } = require('../../utils/files');
const { HttpError, text } = require('../../utils/http');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ driver: req.driver.toClient() });
});

router.patch('/vehicle', async (req, res) => {
  // A new vehicle would need new paperwork, so approved details are locked.
  if (req.driver.status === 'approved') {
    throw new HttpError(409, 'Contact support to change an approved vehicle');
  }

  const type = text(req.body?.type);
  const plate = text(req.body?.plate).toUpperCase().replace(/\s+/g, ' ');
  if (!VEHICLE_TYPES.includes(type)) throw new HttpError(400, 'Choose a vehicle type');
  if (!/^[A-Z]{2} ?\d{1,2} ?[A-Z]{0,3} ?\d{4}$/.test(plate)) {
    throw new HttpError(400, 'Enter a valid number plate, like MP09 AB 4521');
  }

  req.driver.vehicle = { type, plate };
  await req.driver.save();
  res.json({ driver: req.driver.toClient() });
});

router.post('/documents/:type', upload.single('file'), async (req, res) => {
  const { type } = req.params;
  if (!Object.hasOwn(DOCUMENT_TYPES, type)) throw new HttpError(404, 'Unknown document');

  const previous = req.driver.documents?.[type];
  if (previous?.status === 'verified') {
    throw new HttpError(409, 'This document is already verified');
  }

  const file = await saveFile(req.file, `documents/${req.driver.id}`, { allowPdf: true });
  req.driver.set(`documents.${type}`, {
    file,
    originalName: req.file.originalname.slice(0, 120),
    uploadedAt: new Date(),
    status: 'pending',
  });

  try {
    await req.driver.save();
  } catch (err) {
    await removeFile(file);
    throw err;
  }
  await removeFile(previous?.file);
  res.json({ driver: req.driver.toClient() });
});

router.patch('/online', requireApproved, async (req, res) => {
  if (typeof req.body?.online !== 'boolean') throw new HttpError(400, 'Invalid request');
  req.driver.online = req.body.online;
  await req.driver.save();
  res.json({ driver: req.driver.toClient() });
});

module.exports = router;
