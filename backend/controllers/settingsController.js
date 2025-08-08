const pool = require('../config/db');

const getSettings = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT record_watch_history, default_upload_visibility
       FROM user_settings WHERE user_id = $1`,
      [userId]
    );
    const settings = result.rowCount ? result.rows[0] : { record_watch_history: true, default_upload_visibility: 'public' };
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching settings' });
  }
};

const updateSettings = async (req, res) => {
  const userId = req.user.userId;
  const { record_watch_history, default_upload_visibility } = req.body;
  if (default_upload_visibility && !['public','unlisted','private'].includes(default_upload_visibility)) return res.status(400).json({ error: 'Invalid default_upload_visibility' });
  try {
    await pool.query(
      `INSERT INTO user_settings (user_id, record_watch_history, default_upload_visibility)
       VALUES ($1, COALESCE($2, TRUE), COALESCE($3, 'public'))
       ON CONFLICT (user_id)
       DO UPDATE SET record_watch_history = COALESCE($2, user_settings.record_watch_history),
                     default_upload_visibility = COALESCE($3, user_settings.default_upload_visibility)`,
      [userId, record_watch_history, default_upload_visibility]
    );
    const result = await pool.query('SELECT record_watch_history, default_upload_visibility FROM user_settings WHERE user_id = $1', [userId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating settings' });
  }
};

module.exports = { getSettings, updateSettings };
