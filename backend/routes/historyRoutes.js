const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { recordWatch, getHistory, clearHistory } = require('../controllers/historyController');

const router = express.Router();

router.post('/record', authenticateToken, recordWatch);
router.get('/', authenticateToken, getHistory);
router.delete('/', authenticateToken, clearHistory);

module.exports = router;