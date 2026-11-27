const { UPLOAD_ROOT } = require('./files');
const { HttpError } = require('./http');

/** Streams a stored upload to a signed-in admin. */
function sendUpload(res, relativePath) {
  return new Promise((resolve, reject) => {
    res.sendFile(
      relativePath,
      {
        // `root` keeps the path inside the upload folder.
        root: UPLOAD_ROOT,
        dotfiles: 'deny',
        cacheControl: false,
        headers: {
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      },
      (err) => {
        if (!err) return resolve();
        if (res.headersSent) return resolve();
        return reject(new HttpError(404, 'The file is not available'));
      },
    );
  });
}

module.exports = { sendUpload };
