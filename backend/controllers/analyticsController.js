const pool = require('../config/db');

// Log a view event
const logView = async (req, res) => {
  const { id: videoId } = req.params;
  const { watchedSeconds } = req.body;
  const viewerId = req.user ? req.user.userId : null;
  try {
    await pool.query(
      `INSERT INTO video_views_log (video_id, viewer_id, watch_seconds)
       VALUES ($1, $2, $3)`,
      [videoId, viewerId, Math.max(0, Math.floor(+watchedSeconds || 0))]
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error logging view' });
  }
};

// Aggregated stats for creator's video
const getVideoStats = async (req, res) => {
  const { id: videoId } = req.params;
  const creatorId = req.user.userId;
  try {
    const owner = await pool.query('SELECT user_id FROM videos WHERE id = $1', [videoId]);
    if (owner.rowCount === 0) return res.status(404).json({ error: 'Video not found' });
    if (owner.rows[0].user_id !== creatorId) return res.status(403).json({ error: 'Forbidden' });

    const totals = await pool.query(
      `SELECT COUNT(*)::int AS views, COALESCE(SUM(watch_seconds),0)::int AS watch_seconds
         FROM video_views_log WHERE video_id = $1`,
      [videoId]
    );

    const byDay = await pool.query(
      `SELECT date_trunc('day', viewed_at) AS day,
              COUNT(*)::int AS views,
              COALESCE(SUM(watch_seconds),0)::int AS watch_seconds
         FROM video_views_log
        WHERE video_id = $1
        GROUP BY 1
        ORDER BY 1`,
      [videoId]
    );

    res.json({ totals: totals.rows[0], byDay: byDay.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error fetching stats' });
  }
};

// Channel-wide stats for the authenticated creator
const getChannelStats = async (req, res) => {
  const creatorId = req.user.userId;
  try {
    const totals = await pool.query(
      `SELECT COUNT(vvl.id)::int AS views,
              COALESCE(SUM(vvl.watch_seconds),0)::int AS watch_seconds
         FROM video_views_log vvl
         JOIN videos v ON v.id = vvl.video_id
        WHERE v.user_id = $1`, [creatorId]
    );

    const byDay = await pool.query(
      `SELECT date_trunc('day', vvl.viewed_at) AS day,
              COUNT(*)::int AS views,
              COALESCE(SUM(vvl.watch_seconds),0)::int AS watch_seconds
         FROM video_views_log vvl
         JOIN videos v ON v.id = vvl.video_id
        WHERE v.user_id = $1
        GROUP BY 1
        ORDER BY 1`, [creatorId]
    );

    const topVideos = await pool.query(
      `SELECT v.id, v.title,
              COUNT(vvl.id)::int AS views,
              COALESCE(SUM(vvl.watch_seconds),0)::int AS watch_seconds
         FROM videos v
         LEFT JOIN video_views_log vvl ON v.id = vvl.video_id
        WHERE v.user_id = $1
        GROUP BY v.id
        ORDER BY views DESC
        LIMIT 20`, [creatorId]
    );

    res.json({ totals: totals.rows[0] || { views: 0, watch_seconds: 0 }, byDay: byDay.rows, topVideos: topVideos.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error fetching channel stats' });
  }
};

module.exports = { logView, getVideoStats, getChannelStats };
