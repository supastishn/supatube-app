const express = require('express');
const { 
    uploadVideo,
    getAllVideos,
    getVideoById,
    getCommentsForVideo,
    postComment,
    likeVideo
} = require('../controllers/videoController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

const router = express.Router();

router.route('/')
    .post(authenticateToken, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), uploadVideo)
    .get(getAllVideos);

router.route('/:id')
    .get(getVideoById);

router.route('/:id/comments')
    .get(getCommentsForVideo)
    .post(authenticateToken, postComment);

router.route('/:id/like')
    .post(authenticateToken, likeVideo);

module.exports = router;
