const pool = require('../config/db');

const recordWatch = async (req, res) => {
  const userId = req.user.userId;
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: 'videoId is required' });

  try {
    const settings = await pool.query('SELECT record_watch_history FROM user_settings WHERE user_id = $1', [userId]);
    if (settings.rowCount && settings.rows[0].record_watch_history === false) {
      return res.status(200).json({ recorded: false });
    }

    await pool.query(
      `INSERT INTO watch_history (user_id, video_id, watched_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, video_id)
       DO UPDATE SET watched_at = EXCLUDED.watched_at`,
      [userId, videoId]
    );
    res.status(201).json({ recorded: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error recording watch' });
  }
};

const getHistory = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT v.*, json_build_object('id', u.id, 'name', u.username, 'avatar_url', u.avatar_url) as channel, h.watched_at
       FROM watch_history h
       JOIN videos v ON v.id = h.video_id
       JOIN users u ON u.id = v.user_id
       WHERE h.user_id = $1
       ORDER BY h.watched_at DESC
       LIMIT 200`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching history' });
  }
};

const clearHistory = async (req, res) => {
  const userId = req.user.userId;
  try {
    await pool.query('DELETE FROM watch_history WHERE user_id = $1', [userId]);
    res.json({ message: 'History cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error clearing history' });
  }
};

module.exports = { recordWatch, getHistory, clearHistory };
