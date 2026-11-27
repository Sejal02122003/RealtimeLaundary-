// The business runs on India time, whatever timezone the server is in.
const TIME_ZONE = 'Asia/Kolkata';
const UTC_OFFSET = '+05:30';

const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** "YYYY-MM-DD" for the given instant. */
const dayKey = (date = new Date()) => dayFormat.format(date);

/** The instant at "HH:MM" on the given day. */
const atTime = (day, time = '00:00') => new Date(`${day}T${time}:00${UTC_OFFSET}`);

function addDays(day, days) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

module.exports = { TIME_ZONE, dayKey, atTime, addDays };
