/**
 * Demo mode uses a fixed OTP and sends no SMS. It must be switched on
 * explicitly (nodemon.json does this for `npm run dev`) and is always off in
 * production.
 */
const isOtpDemoMode = () =>
  process.env.OTP_DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';

const DEMO_OTP = '1234';

module.exports = { isOtpDemoMode, DEMO_OTP };
