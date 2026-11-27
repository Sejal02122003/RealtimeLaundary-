const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { HttpError } = require('./http');

// Uploads hold identity documents, so this folder is never served statically.
const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', '..', 'uploads');

const startsWith = (buffer, bytes, offset = 0) =>
  bytes.every((byte, i) => buffer[offset + i] === byte);

/** Detects the file type from its content; the client's mime type is not trusted. */
function detectExtension(buffer) {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'jpg';
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }
  if (buffer.toString('ascii', 0, 5) === '%PDF-') return 'pdf';
  return null;
}

function checkFile(file, { allowPdf = false } = {}) {
  if (!file) throw new HttpError(400, 'Attach a file');
  const extension = detectExtension(file.buffer);
  if (!extension || (extension === 'pdf' && !allowPdf)) {
    throw new HttpError(400, allowPdf ? 'Upload a JPG, PNG, WEBP or PDF file' : 'Upload a JPG, PNG or WEBP photo');
  }
  return extension;
}

/** Writes the file under a random name and returns its path relative to the upload folder. */
async function saveFile(file, folder, options) {
  const extension = checkFile(file, options);
  const relativePath = path.posix.join(folder, `${crypto.randomUUID()}.${extension}`);
  const target = path.join(UPLOAD_ROOT, relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, file.buffer);
  return relativePath;
}

async function removeFile(relativePath) {
  if (!relativePath) return;
  await fs.rm(path.join(UPLOAD_ROOT, relativePath), { force: true });
}

module.exports = { UPLOAD_ROOT, checkFile, saveFile, removeFile };
