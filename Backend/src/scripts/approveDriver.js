/**
 * Admin step until there is an admin panel: verifies a driver's uploaded
 * documents and approves the account. Check the files before running this.
 *
 *   npm run driver:approve -- 9988776656
 */
require('dotenv').config({ quiet: true });

const path = require('node:path');
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Driver, DOCUMENT_TYPES } = require('../models/Driver');
const { UPLOAD_ROOT } = require('../utils/files');
const { parsePhone } = require('../utils/http');

async function approve() {
  const phone = parsePhone(process.argv[2]);
  await connectDB();

  const driver = await Driver.findOne({ phone });
  if (!driver) throw new Error(`No driver is registered with ${phone}`);

  const types = Object.keys(DOCUMENT_TYPES);
  const missing = types.filter((type) => !driver.documents?.[type]);
  if (missing.length) {
    throw new Error(`Documents still missing: ${missing.map((type) => DOCUMENT_TYPES[type]).join(', ')}`);
  }
  if (!driver.vehicle.plate) throw new Error('The number plate has not been saved yet');

  for (const type of types) {
    console.log(`${DOCUMENT_TYPES[type]}: ${path.join(UPLOAD_ROOT, driver.documents[type].file)}`);
    driver.documents[type].status = 'verified';
  }
  driver.status = 'approved';
  await driver.save();
  console.log(`${driver.name} is approved.`);
}

approve()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
