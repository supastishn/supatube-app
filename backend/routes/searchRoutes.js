const express = require('express');
const { optionalAuthenticateToken } = require('../middleware/authMiddleware');
const { searchVideos } = require('../controllers/searchController');

const router = express.Router();

router.get('/', optionalAuthenticateToken, searchVideos);

module.exports = router;
