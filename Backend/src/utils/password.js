const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return { passwordHash: hash.toString('hex'), salt };
}

async function checkPassword(password, { passwordHash, salt }) {
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return crypto.timingSafeEqual(hash, Buffer.from(passwordHash, 'hex'));
}

module.exports = { hashPassword, checkPassword };
