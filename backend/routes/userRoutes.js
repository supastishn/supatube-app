const express = require('express');
const { registerUser, loginUser, getUserProfile } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authenticateToken, getUserProfile);

module.exports = router;
