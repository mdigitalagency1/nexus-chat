const { upload, uploadFile } = require('../services/media.service');
const uploadMedia = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const result = await uploadFile(req.file.buffer, req.file.mimetype, req.file.originalname);
      res.json({ ...result, baseUrl: req.protocol + '://' + req.get('host') });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
];
module.exports = { uploadMedia };
