const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getNotifications, markNotificationsRead } = require('../controllers/notificationController');

const router = express.Router();

router.get('/', authenticateToken, getNotifications);
router.post('/read', authenticateToken, markNotificationsRead);

module.exports = router;
