const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  bug: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bug',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  isSolution: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
