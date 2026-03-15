const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/nexus-uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/gif','image/webp','video/mp4','audio/mpeg','audio/ogg','audio/wav','application/pdf','text/plain'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('File type not allowed'));
  }
});
async function uploadFile(buffer, mimeType, originalName) {
  const ext = path.extname(originalName) || '.bin';
  const fileName = uuidv4() + ext;
  fs.writeFileSync(path.join(UPLOAD_DIR, fileName), buffer);
  return { url: '/uploads/' + fileName, size: buffer.length, mimeType, fileName: originalName };
}
function serveUploads(app) {
  app.use('/uploads', require('express').static(UPLOAD_DIR));
}
module.exports = { upload, uploadFile, serveUploads };
