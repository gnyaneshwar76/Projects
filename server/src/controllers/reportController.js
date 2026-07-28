const Report = require('../models/Report');
const Bug = require('../models/Bug');
const Comment = require('../models/Comment');

/**
 * Submit a new report for a bug or comment
 */
async function submitReport(req, res) {
  try {
    const { targetType, targetId, reason } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ error: 'targetType, targetId, and reason are required' });
    }

    // Verify the target actually exists before creating a report
    if (targetType === 'bug') {
      const bug = await Bug.findById(targetId);
      if (!bug) return res.status(404).json({ error: 'Target bug not found' });
    } else if (targetType === 'comment') {
      const comment = await Comment.findById(targetId);
      if (!comment) return res.status(404).json({ error: 'Target comment not found' });
    } else {
      return res.status(400).json({ error: 'Invalid target type' });
    }

    // Prevent duplicate reports from the same user on the same item, if it is still pending
    const existing = await Report.findOne({ reportedBy: req.user.id, targetId, status: 'pending' });
    if (existing) {
      return res.status(400).json({ error: 'You already have a pending report for this item.' });
    }

    const report = new Report({
      reportedBy: req.user.id,
      targetType,
      targetId,
      reason
    });

    await report.save();
    res.status(201).json({ message: 'Content reported successfully. Thank you for keeping the community safe!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { submitReport };
