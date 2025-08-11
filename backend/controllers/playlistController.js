const pool = require('../config/db');

const createPlaylist = async (req, res) => {
  const userId = req.user.userId;
  const { title, description, visibility = 'public' } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  if (!['public','unlisted','private'].includes(visibility)) return res.status(400).json({ error: 'Invalid visibility' });
  try {
    const result = await pool.query(
      'INSERT INTO playlists (user_id, title, description, visibility) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, title, description || null, visibility]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating playlist' });
  }
};

const updatePlaylist = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const { title, description, visibility } = req.body;
  if (visibility && !['public','unlisted','private'].includes(visibility)) return res.status(400).json({ error: 'Invalid visibility' });

  try {
    const pl = await pool.query('SELECT user_id FROM playlists WHERE id = $1', [id]);
    if (pl.rowCount === 0) return res.status(404).json({ error: 'Playlist not found' });
    if (pl.rows[0].user_id !== userId) return res.status(403).json({ error: 'Not authorized' });

    const fields = [];
    const values = [];
    let i = 1;
    if (title !== undefined) { fields.push(`title = $${i++}`); values.push(title); }
    if (description !== undefined) { fields.push(`description = $${i++}`); values.push(description); }
    if (visibility !== undefined) { fields.push(`visibility = $${i++}`); values.push(visibility); }
    fields.push(`updated_at = NOW()`);
    values.push(id);

    const q = `UPDATE playlists SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;
    const updated = await pool.query(q, values);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating playlist' });
  }
};

const deletePlaylist = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    const pl = await pool.query('SELECT user_id FROM playlists WHERE id = $1', [id]);
    if (pl.rowCount === 0) return res.status(404).json({ error: 'Playlist not found' });
    if (pl.rows[0].user_id !== userId) return res.status(403).json({ error: 'Not authorized' });

    await pool.query('DELETE FROM playlists WHERE id = $1', [id]);
    res.json({ message: 'Playlist deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting playlist' });
  }
};

const addVideoToPlaylist = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params; // playlist id
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: 'videoId required' });
  try {
    const pl = await pool.query('SELECT user_id FROM playlists WHERE id = $1', [id]);
    if (pl.rowCount === 0) return res.status(404).json({ error: 'Playlist not found' });
    if (pl.rows[0].user_id !== userId) return res.status(403).json({ error: 'Not authorized' });

    // determine next position
    const posRes = await pool.query('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM playlist_videos WHERE playlist_id = $1', [id]);
    const position = posRes.rows[0].next;
    await pool.query('INSERT INTO playlist_videos (playlist_id, video_id, position) VALUES ($1, $2, $3) ON CONFLICT (playlist_id, video_id) DO NOTHING', [id, videoId, position]);
    res.status(201).json({ message: 'Added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding video to playlist' });
  }
};

const removeVideoFromPlaylist = async (req, res) => {
  const userId = req.user.userId;
  const { id, videoId } = req.params;
  try {
    const pl = await pool.query('SELECT user_id FROM playlists WHERE id = $1', [id]);
    if (pl.rowCount === 0) return res.status(404).json({ error: 'Playlist not found' });
    if (pl.rows[0].user_id !== userId) return res.status(403).json({ error: 'Not authorized' });

    await pool.query('DELETE FROM playlist_videos WHERE playlist_id = $1 AND video_id = $2', [id, videoId]);
    res.json({ message: 'Removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error removing video from playlist' });
  }
};

const getPlaylist = async (req, res) => {
  const { id } = req.params;
  const requesterId = req.user ? req.user.userId : null;
  try {
    const pl = await pool.query('SELECT * FROM playlists WHERE id = $1', [id]);
    if (pl.rowCount === 0) return res.status(404).json({ error: 'Playlist not found' });
    const playlist = pl.rows[0];

    if (playlist.visibility === 'private' && playlist.user_id !== requesterId) return res.status(403).json({ error: 'Playlist is private' });

    const vids = await pool.query(
      `SELECT v.*, json_build_object('id', u.id, 'name', u.name, 'avatar_url', u.avatar_url) as channel
       FROM playlist_videos pv
       JOIN videos v ON v.id = pv.video_id
       JOIN users u ON v.user_id = u.id
       WHERE pv.playlist_id = $1 AND v.visibility IN ('public','unlisted')
       ORDER BY pv.position ASC`,
      [id]
    );
    res.json({ ...playlist, videos: vids.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching playlist' });
  }
};

const getUserPlaylists = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT p.*, COUNT(pv.video_id)::int AS video_count
       FROM playlists p
       LEFT JOIN playlist_videos pv ON p.id = pv.playlist_id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.updated_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching user playlists' });
  }
};

module.exports = { createPlaylist, updatePlaylist, deletePlaylist, addVideoToPlaylist, removeVideoFromPlaylist, getPlaylist, getUserPlaylists };
