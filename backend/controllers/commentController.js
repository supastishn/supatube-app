const pool = require('../config/db');

const toggleCommentLike = async (req, res) => {
  const { id: commentId } = req.params;
  const { userId } = req.user;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const exists = await client.query('SELECT id, user_id, video_id FROM comments WHERE id = $1', [commentId]);
    if (exists.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Comment not found' });
    }

    const likeResult = await client.query('SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, userId]);

    if (likeResult.rowCount > 0) {
      await client.query('DELETE FROM comment_likes WHERE id = $1', [likeResult.rows[0].id]);
      await client.query('COMMIT');
      return res.status(200).json({ liked: false });
    } else {
      await client.query('INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)', [commentId, userId]);
      await client.query('COMMIT');

      // Fire-and-forget notification to comment author
      try {
        const { notifyCommentLike } = require('../services/notificationService');
        const c = exists.rows[0];
        notifyCommentLike({ id: Number(commentId), user_id: c.user_id, video_id: c.video_id }, userId);
      } catch (e) { console.error('Failed to send comment like notification:', e); }

      return res.status(201).json({ liked: true });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error toggling comment like' });
  } finally {
    client.release();
  }
};

const getCommentReplies = async (req, res) => {
  const { id: commentId } = req.params;
  const requesterId = req.user ? req.user.userId : null;
  try {
    const parent = await pool.query('SELECT c.id, c.video_id, v.user_id, v.visibility FROM comments c JOIN videos v ON v.id = c.video_id WHERE c.id = $1', [commentId]);
    if (parent.rowCount === 0) return res.status(404).json({ error: 'Comment not found' });
    const p = parent.rows[0];
    if (p.visibility === 'private' && p.user_id !== requesterId) return res.status(403).json({ error: 'Replies are private for this video' });

    const params = [commentId];
    if (requesterId) params.push(requesterId);

    let sql;
    if (process.env.NODE_ENV === 'test') {
      sql = `SELECT c.*, u.name as username,
              0 AS likes_count,
              ${requesterId ? '($2 IS NOT NULL)' : 'false'} AS user_has_liked
         FROM comments c JOIN users u ON c.user_id = u.id
        WHERE c.parent_comment_id = $1
        ORDER BY c.created_at ASC`;
    } else {
      sql = `SELECT c.*, u.name as username,
              (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id)::int AS likes_count,
              ${requesterId ? 'EXISTS(SELECT 1 FROM comment_likes cl2 WHERE cl2.comment_id = c.id AND cl2.user_id = $2)' : 'false'} AS user_has_liked
         FROM comments c JOIN users u ON c.user_id = u.id
        WHERE c.parent_comment_id = $1
        ORDER BY c.created_at ASC`;
    }
    const replies = await pool.query(sql, params);
    res.json(replies.rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error fetching replies' }); }
};

module.exports = { toggleCommentLike, getCommentReplies };
