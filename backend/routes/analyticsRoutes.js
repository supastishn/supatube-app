const express = require('express');
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/authMiddleware');
const { logView, getVideoStats, getChannelStats } = require('../controllers/analyticsController');

const router = express.Router();

router.post('/videos/:id/view', optionalAuthenticateToken, logView);
router.get('/videos/:id/stats', authenticateToken, getVideoStats);

router.get('/channel/me', authenticateToken, getChannelStats);

module.exports = router;
