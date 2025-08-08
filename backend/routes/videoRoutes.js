const express = require('express');
const { 
    uploadVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    getCommentsForVideo,
    postComment,
    likeVideo,
    streamVideo,
    streamThumbnail,
    getRecommendedVideos
} = require('../controllers/videoController');
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

const router = express.Router();

// Limit upload size via multer and add simple mime filtering in config
router.route('/')
    .post(authenticateToken, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), uploadVideo)
    .get(optionalAuthenticateToken, getAllVideos);

router.route('/:id')
    .get(optionalAuthenticateToken, getVideoById)
    .patch(authenticateToken, updateVideo)
    .delete(authenticateToken, deleteVideo);

router.get('/:id/recommendations', optionalAuthenticateToken, getRecommendedVideos);

router.get('/:id/stream', optionalAuthenticateToken, streamVideo);
router.get('/:id/thumbnail', optionalAuthenticateToken, streamThumbnail);

router.route('/:id/comments')
    .get(optionalAuthenticateToken, getCommentsForVideo)
    .post(authenticateToken, postComment);

// Like toggle
router.route('/:id/like')
    .post(authenticateToken, likeVideo);

module.exports = router;
