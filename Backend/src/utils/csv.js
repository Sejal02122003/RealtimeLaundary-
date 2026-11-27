function cell(value) {
  if (typeof value === 'number') return String(value);
  let text = String(value ?? '');
  // Stop spreadsheet apps from running a cell that starts like a formula.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Rows of values to CSV, with a byte order mark so Excel reads UTF-8. */
const toCsv = (rows) => `﻿${rows.map((row) => row.map(cell).join(',')).join('\r\n')}\r\n`;

module.exports = { toCsv };
