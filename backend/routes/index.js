const express = require('express');
const userRoutes = require('./userRoutes');
const videoRoutes = require('./videoRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const playlistRoutes = require('./playlistRoutes');
const historyRoutes = require('./historyRoutes');
const settingsRoutes = require('./settingsRoutes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/videos', videoRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/playlists', playlistRoutes);
router.use('/history', historyRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
