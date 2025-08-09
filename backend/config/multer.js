const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${unique}-${safeBase}`);
  },
});

const allowedVideo = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const allowedAvatar = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const fileFilter = (req, files, cb) => {
  // Multer field upload uses this per file; implementing as a wrapper
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB per file limit; tune as needed
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      if (!allowedVideo.includes(file.mimetype)) {
        return cb(new Error('Unsupported video format'));
      }
    }
    if (file.fieldname === 'thumbnail') {
      if (!allowedImage.includes(file.mimetype)) {
        return cb(new Error('Unsupported image format'));
      }
    }
    cb(null, true);
  }
});

module.exports = upload;
