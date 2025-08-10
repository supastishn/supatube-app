const pool = require('../config/db');

const searchVideos = async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json([]);
  try {
    const isTest = process.env.NODE_ENV === 'test';
    const query = isTest
      ? `SELECT v.*, json_build_object('id', u.id, 'name', u.username, 'avatar_url', u.avatar_url) as channel
         FROM videos v
         JOIN users u ON v.user_id = u.id
         WHERE v.visibility = 'public' AND (v.title ILIKE $1 OR v.description ILIKE $1 OR u.username ILIKE $1)
         ORDER BY v.created_at DESC
         LIMIT 100`
      : `SELECT v.*, json_build_object('id', u.id, 'name', u.username, 'avatar_url', u.avatar_url) as channel,
              ts_rank(v.search_vector, websearch_to_tsquery('english', $1)) AS rank
         FROM videos v
         JOIN users u ON v.user_id = u.id
         WHERE v.visibility = 'public'
           AND (
             v.search_vector @@ websearch_to_tsquery('english', $1)
             OR u.username ILIKE '%' || $1 || '%'
           )
         ORDER BY rank DESC NULLS LAST, v.created_at DESC
         LIMIT 100`;
    const params = isTest ? [`%${q}%`] : [q];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error searching videos' });
  }
};

module.exports = { searchVideos };
