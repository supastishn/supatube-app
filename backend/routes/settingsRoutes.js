const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getSettings, updateSettings } = require('../controllers/settingsController');

const router = express.Router();

router.get('/', authenticateToken, getSettings);
router.patch('/', authenticateToken, updateSettings);

module.exports = router;