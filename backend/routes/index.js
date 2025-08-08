const express = require('express');
const userRoutes = require('./userRoutes');
const videoRoutes = require('./videoRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const playlistRoutes = require('./playlistRoutes');
const historyRoutes = require('./historyRoutes');
const settingsRoutes = require('./settingsRoutes');
const notificationRoutes = require('./notificationRoutes');
const commentRoutes = require('./commentRoutes');
const searchRoutes = require('./searchRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const liveRoutes = require('./liveRoutes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/videos', videoRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/playlists', playlistRoutes);
router.use('/history', historyRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/comments', commentRoutes);
router.use('/search', searchRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/live', liveRoutes);

module.exports = router;
