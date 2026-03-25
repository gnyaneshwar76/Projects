const mongoose = require('mongoose');

const bugSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  stepsToReproduce: {
    type: [String],
    default: [],
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
  },
  tags: {
    type: [String],
    default: [],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
  createdBy: {
    type: String,
    default: 'anonymous',
  },
  assignedTo: {
    type: String,
    default: null,
  },
  vectorEmbedding: {
    type: [Number],
    default: [],
  },
  relatedBugs: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Bug',
    default: [],
  },
  rootCauseSuggestion: {
    type: String,
    default: null,
  },
  clusterLabel: {
    type: Number,
    default: -1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  score: {
    type: Number,
    default: 0,
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  downvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isSolved: {
    type: Boolean,
    default: false,
  },
  acceptedAnswerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  }
});

// Index for text search
bugSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Bug', bugSchema);
