const express = require('express');
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/authMiddleware');
const { getStreamKey, resetStreamKey, listActiveStreams, getMyLiveInfo, updateMyLiveInfo } = require('../controllers/liveController');

const router = express.Router();

router.get('/key', authenticateToken, getStreamKey);
router.post('/key/reset', authenticateToken, resetStreamKey);
router.get('/active', optionalAuthenticateToken, listActiveStreams);

router.get('/me', authenticateToken, getMyLiveInfo);
router.patch('/me', authenticateToken, updateMyLiveInfo);

module.exports = router;
