const { AdminSession } = require('../models/Admin');
const { sha256 } = require('../utils/otp');
const { HttpError } = require('../utils/http');

/** Loads the signed-in admin from the "Authorization: Bearer" header. */
async function requireAdmin(req, _res, next) {
  const token = req.get('authorization')?.match(/^Bearer (\S+)$/)?.[1];
  const session =
    token &&
    (await AdminSession.findOne({
      tokenHash: sha256(token),
      expiresAt: { $gt: new Date() },
    }).populate('admin'));

  if (!session?.admin) throw new HttpError(401, 'Log in to continue');
  req.admin = session.admin;
  req.session = session;
  next();
}

module.exports = { requireAdmin };
