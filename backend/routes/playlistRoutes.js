const express = require('express');
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/authMiddleware');
const { createPlaylist, updatePlaylist, deletePlaylist, addVideoToPlaylist, removeVideoFromPlaylist, getPlaylist, getUserPlaylists } = require('../controllers/playlistController');

const router = express.Router();

router.get('/me', authenticateToken, getUserPlaylists);
router.post('/', authenticateToken, createPlaylist);
router.patch('/:id', authenticateToken, updatePlaylist);
router.delete('/:id', authenticateToken, deletePlaylist);
router.post('/:id/videos', authenticateToken, addVideoToPlaylist);
router.delete('/:id/videos/:videoId', authenticateToken, removeVideoFromPlaylist);
router.get('/:id', optionalAuthenticateToken, getPlaylist);

module.exports = router;
