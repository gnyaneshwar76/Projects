const User = require('../models/User');
const Bug = require('../models/Bug');
const Comment = require('../models/Comment');
const Report = require('../models/Report');

/**
 * Delete a Bug Post (Moderation)
 */
async function deleteBug(req, res) {
  try {
    const { id } = req.params;
    const deletedBug = await Bug.findByIdAndDelete(id);
    if (!deletedBug) return res.status(404).json({ error: 'Bug not found' });

    // Cascade delete comments
    await Comment.deleteMany({ bug: id });

    res.json({ message: 'Bug post completely removed via moderation.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Delete an abusive comment
 */
async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const comment = await Comment.findByIdAndDelete(id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    res.json({ message: 'Abusive comment removed.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Ban or Unban a user
 */
async function toggleBanUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot ban other admins' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({ message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Review all reports
 */
async function getReports(req, res) {
  try {
    const { status = 'pending' } = req.query;
    const reports = await Report.find({ status })
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update report status (e.g. resolved)
 */
async function updateReportStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const report = await Report.findByIdAndUpdate(id, { status }, { new: true });
    if (!report) return res.status(404).json({ error: 'Report not found' });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  deleteBug,
  deleteComment,
  toggleBanUser,
  getReports,
  updateReportStatus
};
