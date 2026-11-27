/**
 * Creates an admin login, or resets its password.
 *
 *   npm run admin:create -- you@example.com
 *
 * The password is asked for, or read from ADMIN_PASSWORD.
 */
require('dotenv').config({ quiet: true });

const readline = require('node:readline');
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Admin, AdminSession } = require('../models/Admin');
const { hashPassword } = require('../utils/password');

const MIN_LENGTH = 10;

/** Asks a question without echoing what is typed. */
function askHidden(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  return new Promise((resolve) => {
    process.stdout.write(question);
    rl._writeToOutput = () => {};
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function create() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Usage: npm run admin:create -- you@example.com');
  }
  const password = process.env.ADMIN_PASSWORD || (await askHidden(`Password for ${email}: `));
  if (password.length < MIN_LENGTH) {
    throw new Error(`The password needs at least ${MIN_LENGTH} characters`);
  }

  await connectDB();
  await Admin.init();
  const admin = await Admin.findOneAndUpdate(
    { email },
    { ...(await hashPassword(password)), failedAttempts: 0, lockedUntil: null },
    { upsert: true, returnDocument: 'after' },
  );
  // A new password signs out any existing session.
  await AdminSession.deleteMany({ admin: admin._id });
  console.log(`Admin ${email} is ready.`);
}

create()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
