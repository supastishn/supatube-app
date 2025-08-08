const express = require('express');
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/authMiddleware');
const { toggleCommentLike, getCommentReplies } = require('../controllers/commentController');

const router = express.Router();

router.post('/:id/like', authenticateToken, toggleCommentLike);

router.get('/:id/replies', optionalAuthenticateToken, getCommentReplies);

module.exports = router;
