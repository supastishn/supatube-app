const express = require('express');
const userRoutes = require('./userRoutes');
const videoRoutes = require('./videoRoutes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/videos', videoRoutes);

module.exports = router;
