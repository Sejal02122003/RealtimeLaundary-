const multer = require('multer');

const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Files stay in memory until their content and the request have been checked.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 10, fieldSize: 1024 },
});

module.exports = { upload };
