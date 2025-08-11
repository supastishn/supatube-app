const { ensureUserStreamKey, resetUserStreamKey } = require('../services/liveStreamServer');
const pool = require('../config/db');

const getStreamKey = async (req, res) => {
  try {
    const row = await ensureUserStreamKey(req.user.userId);
    res.json({ stream_key: row.stream_key });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error getting stream key' });
  }
};

const resetStreamKey = async (req, res) => {
  try {
    const row = await resetUserStreamKey(req.user.userId);
    res.json({ stream_key: row.stream_key });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error resetting stream key' });
  }
};

const listActiveStreams = async (req, res) => {
  try {
    const q = await pool.query(
      `SELECT l.*, json_build_object('id', u.id, 'name', u.name, 'avatar_url', u.avatar_url) as channel
         FROM live_streams l JOIN users u ON l.user_id = u.id
        WHERE l.status = 'live'
        ORDER BY l.updated_at DESC`
    );
    res.json(q.rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error fetching live streams' }); }
};

const getMyLiveInfo = async (req, res) => {
  try {
    const row = await ensureUserStreamKey(req.user.userId);
    res.json(row);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error fetching live info' }); }
};

const updateMyLiveInfo = async (req, res) => {
  const userId = req.user.userId;
  const { title } = req.body;
  try {
    const q = await pool.query(
      `UPDATE live_streams SET title = COALESCE($1, title), updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 RETURNING *`,
      [title || null, userId]
    );
    if (q.rowCount === 0) {
      const row = await ensureUserStreamKey(userId);
      return res.json(row);
    }
    res.json(q.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error updating live info' }); }
};

module.exports = { getStreamKey, resetStreamKey, listActiveStreams, getMyLiveInfo, updateMyLiveInfo };
