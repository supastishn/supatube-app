const { listNotifications, markAsRead } = require('../services/notificationService');

const getNotifications = async (req, res) => {
  const onlyUnread = (req.query.unread || '').toLowerCase() === 'true';
  try {
    const items = await listNotifications(req.user.userId, { onlyUnread });
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error fetching notifications' });
  }
};

const markNotificationsRead = async (req, res) => {
  const { ids } = req.body; // array of notification IDs
  try {
    const count = await markAsRead(req.user.userId, ids);
    res.json({ updated: count });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error updating notifications' });
  }
};

module.exports = { getNotifications, markNotificationsRead };
