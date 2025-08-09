const express = require('express');
const { registerUser, loginUser, getUserProfile } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authenticateToken, getUserProfile);
router.patch('/me', authenticateToken, updateUserProfile);
router.post('/me/avatar', authenticateToken, upload.single('avatar'), uploadAvatar);

module.exports = router;
