/** An error whose message is safe to show to the client. */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Reads a request field as a trimmed string, rejecting objects and arrays. */
const text = (value) =>
  typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';

/** Accepts "99887 76655" or "+91 9988776655" and returns the 10 digits. */
function parsePhone(value) {
  const digits = text(value).replace(/[\s-]/g, '').replace(/^\+91/, '');
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new HttpError(400, 'Enter a valid 10-digit mobile number');
  }
  return digits;
}

function parseWholeNumber(value, { label, min, max }) {
  const raw = text(value);
  const number = Number(raw);
  if (!raw || !Number.isInteger(number) || number < min || number > max) {
    throw new HttpError(400, `${label} must be between ${min} and ${max}`);
  }
  return number;
}

module.exports = { HttpError, text, parsePhone, parseWholeNumber };
