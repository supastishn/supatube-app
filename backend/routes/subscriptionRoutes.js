const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { toggleSubscription, listChannelSubscribers, listSubscriptionsFeed } = require('../controllers/subscriptionController');

const router = express.Router();

router.post('/:channelId/toggle', authenticateToken, toggleSubscription);
router.get('/:channelId/subscribers', listChannelSubscribers);
router.get('/feed/me', authenticateToken, listSubscriptionsFeed);

module.exports = router;