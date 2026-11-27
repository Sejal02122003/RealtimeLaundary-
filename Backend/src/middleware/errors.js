const multer = require('multer');
const { HttpError } = require('../utils/http');

function notFound(_req, _res, next) {
  next(new HttpError(404, 'Not found'));
}

// Express recognises error handlers by their four arguments.
function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof multer.MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    return res
      .status(tooLarge ? 413 : 400)
      .json({ error: tooLarge ? 'The file must be smaller than 10 MB' : 'Could not read the upload' });
  }
  // Errors raised by the body parser carry a 4xx status.
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: 'Invalid request' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Something went wrong. Try again.' });
}

module.exports = { notFound, errorHandler };
