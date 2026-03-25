const Notification = require('../models/Notification');

// Get notifications for current user
async function getNotifications(req, res) {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Mark one notification as read
async function markAsRead(req, res) {
  try {
    const { notifId } = req.params;
    await Notification.findOneAndUpdate(
      { _id: notifId, userId: req.user.id },
      { read: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Mark all notifications as read
async function markAllAsRead(req, res) {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Helper: create a notification (used internally by other controllers)
async function createNotification({ userId, type, message, bugId }) {
  try {
    if (!userId) return;
    const notif = new Notification({ userId, type, message, bugId });
    await notif.save();
    return notif;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead, createNotification };
