const pool = require('../config/db');

async function notifyNewVideoToSubscribers(video) {
  // video: { id, user_id, title }
  try {
    const subs = await pool.query('SELECT subscriber_id FROM subscriptions WHERE channel_id = $1', [video.user_id]);
    if (subs.rowCount === 0) return;
    const values = [];
    const params = [];
    let idx = 1;
    for (const row of subs.rows) {
      values.push(`($${idx++}, 'new_video', $${idx++}, $${idx++}, NULL, $${idx++})`);
      // user_id, type, actor_user_id, video_id, data
      params.push(row.subscriber_id, video.user_id, video.id, JSON.stringify({ title: video.title }));
    }
    const sql = `INSERT INTO notifications (user_id, type, actor_user_id, video_id, comment_id, data)
                 VALUES ${values.join(',')}`;
    await pool.query(sql, params);
  } catch (e) {
    console.error('notifyNewVideoToSubscribers failed', e);
  }
}

async function notifyCommentReply(parentComment, replyComment) {
  try {
    if (!parentComment || !replyComment) return;
    if (parentComment.user_id === replyComment.user_id) return; // don't notify self
    await pool.query(
      `INSERT INTO notifications (user_id, type, actor_user_id, video_id, comment_id, data)
       VALUES ($1, 'comment_reply', $2, $3, $4, $5)`,
      [parentComment.user_id, replyComment.user_id, replyComment.video_id, replyComment.id,
       JSON.stringify({ reply: replyComment.comment })]
    );
  } catch (e) {
    console.error('notifyCommentReply failed', e);
  }
}

async function notifyCommentLike(comment, actorUserId) {
  try {
    if (!comment) return;
    if (comment.user_id === actorUserId) return;
    await pool.query(
      `INSERT INTO notifications (user_id, type, actor_user_id, video_id, comment_id, data)
       VALUES ($1, 'comment_like', $2, $3, $4, $5)`,
      [comment.user_id, actorUserId, comment.video_id, comment.id, JSON.stringify({ like: true })]
    );
  } catch (e) {
    console.error('notifyCommentLike failed', e);
  }
}

async function listNotifications(userId, { onlyUnread }) {
  const where = ['user_id = $1'];
  const params = [userId];
  if (onlyUnread) where.push('is_read = false');
  const sql = `SELECT n.*, u.name as actor_username
               FROM notifications n
               LEFT JOIN users u ON n.actor_user_id = u.id
               WHERE ${where.join(' AND ')}
               ORDER BY n.created_at DESC
               LIMIT 200`;
  const result = await pool.query(sql, params);
  return result.rows;
}

async function markAsRead(userId, notificationIds) {
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) return 0;
  const params = [userId];
  const idPlaceholders = notificationIds.map((_, i) => `$${i + 2}`).join(',');
  const sql = `UPDATE notifications SET is_read = true
               WHERE user_id = $1 AND id IN (${idPlaceholders})`;
  const result = await pool.query(sql, [...params, ...notificationIds]);
  return result.rowCount;
}

async function notifyNewCommentOnVideo(video, commenterId, commentId, commentText) {
  try {
    if (!video) return;
    if (video.user_id === commenterId) return;
    await pool.query(
      `INSERT INTO notifications (user_id, type, actor_user_id, video_id, comment_id, data)
       VALUES ($1, 'new_comment', $2, $3, $4, $5)`,
      [video.user_id, commenterId, video.id, commentId, JSON.stringify({ comment: commentText })]
    );
  } catch (e) {
    console.error('notifyNewCommentOnVideo failed', e);
  }
}

module.exports = {
  notifyNewVideoToSubscribers,
  notifyCommentReply,
  notifyCommentLike,
  notifyNewCommentOnVideo,
  listNotifications,
  markAsRead,
};
