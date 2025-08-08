const pool = require('../config/db');

const toggleSubscription = async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user.userId;

  if (+channelId === subscriberId) {
    return res.status(400).json({ error: 'Cannot subscribe to yourself' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      'SELECT id FROM subscriptions WHERE subscriber_id = $1 AND channel_id = $2',
      [subscriberId, channelId]
    );

    if (existing.rowCount > 0) {
      await client.query('DELETE FROM subscriptions WHERE id = $1', [existing.rows[0].id]);
      await client.query('COMMIT');
      return res.status(200).json({ subscribed: false });
    } else {
      await client.query('INSERT INTO subscriptions (subscriber_id, channel_id) VALUES ($1, $2)', [subscriberId, channelId]);
      await client.query('COMMIT');
      return res.status(201).json({ subscribed: true });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error toggling subscription' });
  } finally {
    client.release();
  }
};

const listChannelSubscribers = async (req, res) => {
  const { channelId } = req.params;
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, s.created_at as subscribed_at
       FROM subscriptions s
       JOIN users u ON s.subscriber_id = u.id
       WHERE s.channel_id = $1
       ORDER BY s.created_at DESC`,
      [channelId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching subscribers' });
  }
};

const listSubscriptionsFeed = async (req, res) => {
  // latest videos from channels the user subscribed to
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT v.*, u.username as channel
       FROM videos v
       JOIN subscriptions s ON v.user_id = s.channel_id
       JOIN users u ON u.id = v.user_id
       WHERE s.subscriber_id = $1 AND v.visibility IN ('public','unlisted')
       ORDER BY v.created_at DESC
       LIMIT 100`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching subscription feed' });
  }
};

module.exports = { toggleSubscription, listChannelSubscribers, listSubscriptionsFeed };
