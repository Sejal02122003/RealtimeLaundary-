const { Session } = require('../models/Session');
const { sha256 } = require('../utils/otp');
const { HttpError } = require('../utils/http');

/** Loads the signed-in driver from the "Authorization: Bearer" header. */
async function requireDriver(req, _res, next) {
  const token = req.get('authorization')?.match(/^Bearer (\S+)$/)?.[1];
  const session =
    token &&
    (await Session.findOne({ tokenHash: sha256(token), expiresAt: { $gt: new Date() } }).populate(
      'driver',
    ));

  if (!session?.driver) throw new HttpError(401, 'Log in to continue');
  if (session.driver.status === 'blocked') {
    throw new HttpError(403, 'This account is blocked. Contact support.');
  }

  req.driver = session.driver;
  req.session = session;
  next();
}

/** Jobs and earnings are only open to drivers an admin has approved. */
function requireApproved(req, _res, next) {
  if (req.driver.status !== 'approved') {
    throw new HttpError(403, 'Jobs start after admin approval');
  }
  next();
}

module.exports = { requireDriver, requireApproved };
