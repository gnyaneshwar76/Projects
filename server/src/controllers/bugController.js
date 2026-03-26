const Bug = require('../models/Bug');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { findSimilarBugs, textToVector, preprocessText } = require('../utils/similarity');
const { kMeansClustering, suggestRootCauses } = require('../utils/clustering');

/**
 * Create a new bug report
 */
async function createBug(req, res) {
  try {
    const { title, description, stepsToReproduce, severity, tags, visibility = 'public' } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    const newBug = new Bug({
      title,
      description,
      stepsToReproduce: stepsToReproduce || [],
      severity: severity || 'medium',
      tags: tags || [],
      userId: req.user.id,
      visibility,
      createdBy: req.user.name,
    });
    
    const savedBug = await newBug.save();
    
    // Find similar bugs
    const existingBugs = await Bug.find({ _id: { $ne: savedBug._id } }).lean();
    const similarBugs = findSimilarBugs(description, existingBugs, 3);
    const improvementSuggestions = await buildSubmissionInsights({
      title,
      description,
      tags: tags || [],
    });
    
    res.status(201).json({
      bug: savedBug,
      similarBugs,
      aiAssistance: improvementSuggestions,
      message: 'Bug created successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get all bugs with optional filtering and authorization
 */
async function getAllBugs(req, res) {
  try {
    const { status, severity, sortBy = 'latest', order = 'desc', q, tag, solved } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    // Live search
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$and = [{ $or: [{ title: regex }, { description: regex }, { tags: regex }] }];
    }

    // Tag filter
    if (tag && tag.trim()) {
      const tagRegex = new RegExp(`^${tag.trim()}$`, 'i');
      if (filter.$and) filter.$and.push({ tags: tagRegex });
      else filter.tags = tagRegex;
    }

    // Solved check
    if (solved === 'true') filter.isSolved = true;
    if (solved === 'false') filter.isSolved = { $ne: true };

    // Auth check
    const authClause = { $or: [{ userId: req.user.id }, { visibility: 'public' }] };
    if (filter.$and) filter.$and.push(authClause);
    else Object.assign(filter, authClause);

    // If simple sort
    let sortObj = { createdAt: -1 };
    
    // Convert to Aggregation for Trending Score
    // trending_score = votes + (comments * 2) + recency factor (e.g. 1 / hours_since_creation)
    const pipeline = [
      { $match: filter },
      // Lookup comments to get count for trending math
      { $lookup: { from: 'comments', localField: '_id', foreignField: 'bug', as: 'allComments' } },
      { $addFields: { 
          commentCount: { $size: '$allComments' },
          hoursAlive: { $divide: [{ $subtract: [new Date(), '$createdAt'] }, 3600000] }
      }},
      { $addFields: {
          trendingScore: {
            $add: [
              '$score', 
              { $multiply: ['$commentCount', 2] },
              { $divide: [100, { $add: ['$hoursAlive', 1] }] } // Recency boost factor
            ]
          }
      }},
      { $project: { allComments: 0, hoursAlive: 0 } } // Clean up payload
    ];

    if (sortBy === 'trending') sortObj = { trendingScore: -1 };
    else if (sortBy === 'most-solved') sortObj = { isSolved: -1, score: -1 };
    else if (sortBy === 'latest' || sortBy === 'new') sortObj = { createdAt: -1 };
    else sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };

    pipeline.push({ $sort: sortObj });

    const bugs = await Bug.aggregate(pipeline);

    // Note: Bug.aggregate doesn't auto-populate objectIds easily without further lookups, 
    // but the frontend primarily needs the base bug details here.

    res.json({ total: bugs.length, bugs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get a single bug by ID with authorization
 */
async function getBugById(req, res) {
  try {
    const { bugId } = req.params;
    const bug = await Bug.findById(bugId)
      .populate('relatedBugs', 'title severity status createdAt');
    
    if (!bug) {
      return res.status(404).json({ error: 'Bug not found' });
    }
    
    // Authorization check: user can view if they own it or it's public
    if (bug.visibility === 'private' && bug.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this bug' });
    }
    
    res.json(bug);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update a bug with authorization
 */
async function updateBug(req, res) {
  try {
    const { bugId } = req.params;
    
    const bug = await Bug.findById(bugId);
    if (!bug) {
      return res.status(404).json({ error: 'Bug not found' });
    }
    
    // Authorization check: user can update if they own it
    if (bug.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }
    
    const updateData = req.body;
    updateData.updatedAt = new Date();
    
    const updatedBug = await Bug.findByIdAndUpdate(
      bugId,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      bug: updatedBug,
      message: 'Bug updated successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Delete a bug with authorization
 */
async function deleteBug(req, res) {
  try {
    const { bugId } = req.params;
    
    const bug = await Bug.findById(bugId);
    if (!bug) {
      return res.status(404).json({ error: 'Bug not found' });
    }
    
    // Authorization check: user can delete if they own it
    if (bug.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    
    const deletedBug = await Bug.findByIdAndDelete(bugId);
    
    res.json({
      message: 'Bug deleted successfully',
      bugId: deletedBug._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Find similar bugs
 */
async function findSimilar(req, res) {
  try {
    const { bugId } = req.params;
    const { topN = 3 } = req.query;
    
    const bug = await Bug.findById(bugId).lean();
    if (!bug) {
      return res.status(404).json({ error: 'Bug not found' });
    }
    
    const allBugs = await Bug.find({ _id: { $ne: bugId } }).lean();
    const similarBugs = findSimilarBugs(bug.description, allBugs, parseInt(topN));
    
    res.json({
      originalBugId: bugId,
      originalBugTitle: bug.title,
      similarBugs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Perform clustering analysis
 */
async function analyzeWithClustering(req, res) {
  try {
    const { numClusters = 3 } = req.query;
    
    const bugs = await Bug.find().lean();
    
    if (bugs.length < 2) {
      return res.json({
        message: 'Not enough bugs for clustering analysis',
        clusters: {},
      });
    }
    
    // Create vectors for all bugs
    const allDescriptions = bugs.map(b => b.description);
    const allTokenizedDocs = allDescriptions.map(preprocessText);
    
    const vectors = bugs.map(bug => 
      textToVector(bug.description, allTokenizedDocs)
    );
    
    // Perform clustering
    const clustering = kMeansClustering(vectors, Math.min(parseInt(numClusters), bugs.length));
    
    // Generate root cause suggestions
    const rootCauses = suggestRootCauses(bugs, clustering);
    
    // Build response with clustered bugs
    const clusteredBugs = {};
    bugs.forEach((bug, idx) => {
      const clusterIdx = clustering.clusters[idx];
      
      if (!clusteredBugs[clusterIdx]) {
        clusteredBugs[clusterIdx] = {
          clusterIndex: clusterIdx,
          rootCauseSuggestion: rootCauses[clusterIdx],
          bugs: [],
        };
      }
      
      clusteredBugs[clusterIdx].bugs.push({
        _id: bug._id,
        title: bug.title,
        severity: bug.severity,
        status: bug.status,
        tags: bug.tags,
      });
    });
    
    res.json({
      totalBugs: bugs.length,
      numClusters: parseInt(numClusters),
      clusters: clusteredBugs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get dashboard statistics
 */
async function getDashboardStats(req, res) {
  try {
    const totalBugs = await Bug.countDocuments();
    const bugsByStatus = await Bug.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    
    const bugsBySeverity = await Bug.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);
    
    const recentBugs = await Bug.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title severity status createdAt');
    
    res.json({
      totalBugs,
      bugsByStatus,
      bugsBySeverity,
      recentBugs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get all unique tags with usage counts
 */
async function getTags(req, res) {
  try {
    const tags = await Bug.aggregate([
      { $match: { visibility: 'public' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);
    res.json({ tags: tags.map(t => ({ name: t._id, count: t.count })) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Search bugs by keyword
 */
async function searchBugs(req, res) {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const bugs = await Bug.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
    
    res.json({
      query,
      results: bugs,
      count: bugs.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Add a comment to a bug
 */
async function addComment(req, res) {
  try {
    const { bugId } = req.params;
    const { text, parentId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const bug = await Bug.findById(bugId);
    if (!bug) {
      return res.status(404).json({ error: 'Bug not found' });
    }
    
    const comment = new Comment({
      bug: bugId,
      text,
      createdBy: req.user.id,
      authorName: req.user.name,
      parentId: parentId || null
    });
    
    await comment.save();

    // Notify the bug author that someone commented (unless it's their own comment)
    if (bug.userId.toString() !== req.user.id) {
      createNotification({
        userId: bug.userId,
        type: 'comment',
        message: `${req.user.name} commented on your bug "${bug.title}"`,
        bugId: bugId
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get comments for a bug
 */
async function getComments(req, res) {
  try {
    const { bugId } = req.params;
    const comments = await Comment.find({ bug: bugId }).sort({ isSolution: -1, score: -1, createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Vote on a bug (up or down)
 */
async function voteOnBug(req, res) {
  try {
    const { bugId } = req.params;
    const { type } = req.body; // 'up' or 'down'
    const userId = req.user.id;

    const bug = await Bug.findById(bugId);
    if (!bug) return res.status(404).json({ error: 'Post not found' });

    const hasUpvoted = bug.upvotedBy.includes(userId);
    const hasDownvoted = bug.downvotedBy.includes(userId);

    // Remove old votes
    if (hasUpvoted) {
      bug.upvotedBy.pull(userId);
      bug.score -= 1;
    }
    if (hasDownvoted) {
      bug.downvotedBy.pull(userId);
      bug.score += 1;
    }

    // Apply new vote if they are toggling to a new state
    if (type === 'up' && !hasUpvoted) {
      bug.upvotedBy.push(userId);
      bug.score += 1;
      // +5 reputation to bug author for receiving an upvote
      if (bug.userId.toString() !== userId) {
        await User.findByIdAndUpdate(bug.userId, { $inc: { reputation: 5 } });
      }
    } else if (type === 'down' && !hasDownvoted) {
      bug.downvotedBy.push(userId);
      bug.score -= 1;
    }

    // Reverse reputation when removing an upvote
    if (hasUpvoted && bug.userId.toString() !== userId) {
      await User.findByIdAndUpdate(bug.userId, { $inc: { reputation: -5 } });
    }

    await bug.save();
    res.json({ score: bug.score, upvotedBy: bug.upvotedBy, downvotedBy: bug.downvotedBy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Mark a bug as solved and assign the accepted answer
 */
async function markAsSolved(req, res) {
  try {
    const { bugId } = req.params;
    const { commentId } = req.body;
    const Comment = require('../models/Comment');

    const bug = await Bug.findById(bugId);
    if (!bug) return res.status(404).json({ error: 'Post not found' });

    if (bug.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the author can accept an answer' });
    }

    // Clear any previously accepted comment's isSolution flag
    if (bug.acceptedAnswerId) {
      await Comment.findByIdAndUpdate(bug.acceptedAnswerId, { isSolution: false });
    }

    // Toggle logic: clicking the same accepted answer un-solves it
    if (bug.isSolved && bug.acceptedAnswerId && bug.acceptedAnswerId.toString() === commentId) {
      // Un-solving: remove +10 from comment author
      const oldComment = await Comment.findById(commentId);
      if (oldComment) await User.findByIdAndUpdate(oldComment.createdBy, { $inc: { reputation: -10 } });
      bug.isSolved = false;
      bug.acceptedAnswerId = null;
    } else {
      bug.isSolved = true;
      bug.acceptedAnswerId = commentId;
      // Stamp the comment as the solution and +10 reputation to its author
      const solComment = await Comment.findByIdAndUpdate(commentId, { isSolution: true });
      if (solComment) await User.findByIdAndUpdate(solComment.createdBy, { $inc: { reputation: 10 } });
    }

    await bug.save();

    // Send notifications
    if (bug.isSolved) {
      // Notify comment author that their solution was accepted
      const solComment = await Comment.findById(commentId);
      if (solComment && solComment.createdBy.toString() !== req.user.id) {
        createNotification({
          userId: solComment.createdBy,
          type: 'solution_accepted',
          message: `Your comment was accepted as the solution for "${bug.title}" 🎉`,
          bugId: bugId
        });
      }
    }

    res.json({ message: bug.isSolved ? 'Marked as solved' : 'Unmarked as solved', bug });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Vote on a comment/solution (upvote only)
 */
async function voteOnComment(req, res) {
  try {
    const { bugId, commentId } = req.params;
    const userId = req.user.id;

    const bug = await Bug.findById(bugId);
    if (!bug) return res.status(404).json({ error: 'Post not found' });

    const comment = await Comment.findOne({ _id: commentId, bug: bugId });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const hasUpvoted = comment.upvotedBy.some((id) => id.toString() === userId.toString());
    if (hasUpvoted) {
      comment.upvotedBy.pull(userId);
      comment.score -= 1;
    } else {
      comment.upvotedBy.push(userId);
      comment.score += 1;
    }

    await comment.save();
    return res.json({ commentId: comment._id, score: comment.score });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Classify a message into a debug category based on keywords
 */
function classifyQuery(msg) {
  const m = msg.toLowerCase();
  if (/login|logout|auth|password|token|jwt|session|register|sign.?in|unauthorized|403|401/.test(m)) return 'auth';
  if (/click|button|ui|dropdown|modal|render|display|visible|layout|css|style|screen|form/.test(m)) return 'ui';
  if (/api|endpoint|request|response|fetch|axios|404|500|cors|http|rest|network|timeout/.test(m)) return 'api';
  if (/slow|perf|lag|memory|load|cpu|latency|speed|freeze|hang/.test(m)) return 'performance';
  if (/database|mongo|query|schema|save|insert|model|collection|db|sql/.test(m)) return 'database';
  if (/crash|null|undefined|exception|error|throw|stack|traceback|cannot read/.test(m)) return 'runtime';
  if (/install|npm|node|package|dependency|import|module|webpack|build|compile/.test(m)) return 'build';
  return 'general';
}

/**
 * Build a contextual deep-analysis of a specific bug using the new AI engine
 */
function analyzeContext(bugContext) {
  const { extractKeywords, buildAdviceFromKeywords, pickFollowUp } = require('../utils/aiEngine');
  const { title = '', description = '', tags = [] } = bugContext;
  const combined = `${title} ${description} ${tags.join(' ')}`;
  const keywords = extractKeywords(combined);
  const category = classifyQuery(combined);
  const advice = buildAdviceFromKeywords(keywords);

  // Fallback: if no keyword matches, use the old category-based system
  if (advice.causes.length === 0) {
    const base = generateDebugAdviceFallback(category);
    advice.causes = base.causes;
    advice.fixes = base.fixes;
  }

  return {
    category,
    keywords,
    causes: advice.causes.slice(0, 5),
    fixes: advice.fixes.slice(0, 5),
    debugSteps: [
      `Open browser DevTools (F12) and check the Console for errors`,
      `Open the Network tab and reproduce the issue — look for failed (red) requests`,
      `Add a breakpoint or \`console.log\` at the first line of the related function`,
      `Check that all environment variables (.env) are correctly set and loaded`,
      `Search TraceStack for similar reports using keywords: ${keywords.slice(0,4).join(', ')}`,
    ],
    followUp: pickFollowUp(keywords),
  };
}

/**
 * Fallback category-based advice (used when no keyword matches)
 */
function generateDebugAdviceFallback(category) {
  const advice = {
    auth:        { causes: ['JWT token expired or invalid', 'Missing Authorization header', 'Password hashing mismatch'], fixes: ['Check token expiry', 'Verify Bearer header is sent', 'Inspect bcrypt comparison'] },
    ui:          { causes: ['Event handler not attached', 'Component not re-rendering', 'CSS conflict'], fixes: ['Console.log inside handler', 'Check useState triggers', 'Inspect Computed styles'] },
    api:         { causes: ['Wrong API URL', 'CORS policy blocking', 'Server not running'], fixes: ['Check Network tab URL', 'Enable CORS on server', 'Log req.body on backend'] },
    performance: { causes: ['Too many re-renders', 'N+1 DB queries', 'Blocking main thread'], fixes: ['React Profiler tab', 'Add DB indexes', 'Use Web Worker'] },
    database:    { causes: ['Schema validation failing', 'Wrong ObjectId format', 'Connection not established'], fixes: ['Add .catch() to queries', 'Check mongoose readyState', 'Verify MONGO_URI'] },
    runtime:     { causes: ['Accessing null/undefined', 'Async not awaited', 'Wrong variable scope'], fixes: ['Use optional chaining ?.', 'Add await + try/catch', 'Log full API response'] },
    build:       { causes: ['Missing npm package', 'Node version mismatch', 'Circular import'], fixes: ['Run npm install', 'Check node --version', 'Delete node_modules and reinstall'] },
    general:     { causes: ['Unexpected data flow', 'Race condition', 'Browser caching stale bundle'], fixes: ['Add console.log to trace', 'Hard refresh Ctrl+Shift+R', 'Check .env variables'] },
  };
  return advice[category] || advice.general;
}

/**
 * AI Chatbot endpoint — keyword extraction + DB search + rule-based + free HuggingFace
 */
async function chatWithAI(req, res) {
  try {
    const { message, bugContext } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const { extractKeywords, buildAdviceFromKeywords, searchBugsByKeywords, pickFollowUp, tryHuggingFace } = require('../utils/aiEngine');

    // ── MODE 1: Context-aware (user is on a specific bug page) ──────────
    if (bugContext && (bugContext.title || bugContext.description)) {
      const analysis = analyzeContext(bugContext);

      // Also keyword-search for similar bugs
      const combinedKw = extractKeywords(`${bugContext.title} ${bugContext.description} ${message}`);
      const similarBugs = await searchBugsByKeywords(Bug, combinedKw, 3);
      const formattedSimilar = similarBugs.map(b => ({
        id: b._id, title: b.title, severity: b.severity, tags: b.tags, score: b.score,
      }));

      return res.json({
        type: 'contextual',
        bugTitle: bugContext.title,
        category: analysis.category,
        keywords: analysis.keywords,
        causes: analysis.causes,
        fixes: analysis.fixes,
        debugSteps: analysis.debugSteps,
        followUp: analysis.followUp,
        similarBugs: formattedSimilar,
        reply: `Based on your bug **"${bugContext.title}"**, here's my analysis:`
      });
    }

    // ── MODE 2: Generic chat ─────────────────────────────────────────────
    const keywords = extractKeywords(message);
    const category = classifyQuery(message);

    // Step 1: Search DB by keywords
    const dbResults = await searchBugsByKeywords(Bug, keywords, 3);

    if (dbResults.length > 0) {
      // Also build some advice to show alongside
      const advice = buildAdviceFromKeywords(keywords);

      return res.json({
        type: 'matches',
        keywords,
        reply: `🔍 Found ${dbResults.length} similar issue${dbResults.length > 1 ? 's' : ''}:`,
        recommendations: dbResults.map(b => ({
          id: b._id, title: b.title, severity: b.severity, status: b.status,
          tags: b.tags, score: b.score, isSolved: b.isSolved,
        })),
        // Bonus: include advice if we have keyword matches
        causes: advice.causes.length > 0 ? advice.causes.slice(0, 3) : undefined,
        fixes: advice.fixes.length > 0 ? advice.fixes.slice(0, 3) : undefined,
        followUp: pickFollowUp(keywords),
      });
    }

    // Step 2: No DB results — generate rule-based advice
    const advice = buildAdviceFromKeywords(keywords);

    if (advice.causes.length > 0) {
      return res.json({
        type: 'advice',
        keywords,
        category,
        causes: advice.causes,
        fixes: advice.fixes,
        followUp: pickFollowUp(keywords),
      });
    }

    // Step 3: No keyword matches either — try category fallback
    const fallback = generateDebugAdviceFallback(category);
    if (category !== 'general') {
      return res.json({
        type: 'advice',
        keywords,
        category,
        causes: fallback.causes,
        fixes: fallback.fixes,
        followUp: pickFollowUp(keywords),
      });
    }

    // Step 4: Truly unknown — try free HuggingFace as last resort
    const hfResponse = await tryHuggingFace(message);
    if (hfResponse) {
      return res.json({
        type: 'ai_generated',
        keywords,
        reply: hfResponse,
        followUp: pickFollowUp(keywords),
      });
    }

    // Final fallback — smart prompt
    return res.json({
      type: 'advice',
      keywords,
      category: 'general',
      causes: fallback.causes,
      fixes: fallback.fixes,
      followUp: 'Could you describe the exact symptoms — what did you expect vs what happened?',
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Failed to process AI chat request' });
  }
}


/**
 * Suggest improvements for a draft bug report (used on CreateBugPage)
 */
async function suggestBugImprovements(req, res) {
  try {
    const { title = '', description = '', tags = [] } = req.body;
    if (!title && !description) return res.status(400).json({ error: 'Title or description is required' });

    const { suggestions, suggestedTags, possibleFixes } = await buildSubmissionInsights({ title, description, tags });

    // Duplicate check via TF-IDF
    const allBugs = await Bug.find({ visibility: 'public' }).select('title description _id');
    const { findSimilarBugs } = require('../utils/similarity');
    const query = `${title} ${description}`;
    const matches = findSimilarBugs(query, allBugs, 3);
    const possibleDuplicates = matches.filter(m => m.similarity > 0.1).map(m => {
      const bug = allBugs[m.index];
      return { id: bug._id, title: bug.title, similarity: Math.round(m.similarity * 100) };
    });

    res.json({ suggestions, suggestedTags, possibleFixes, possibleDuplicates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Toggle Bookmark on a Bug
 */
async function toggleBookmark(req, res) {
  try {
    const { bugId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const index = user.bookmarks.indexOf(bugId);
    let isBookmarked = false;
    
    if (index > -1) {
      user.bookmarks.splice(index, 1);
    } else {
      user.bookmarks.push(bugId);
      isBookmarked = true;
    }
    
    await user.save();
    res.json({ message: isBookmarked ? 'Added to bookmarks' : 'Removed from bookmarks', isBookmarked });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createBug,
  getAllBugs,
  getBugById,
  updateBug,
  deleteBug,
  findSimilar,
  analyzeWithClustering,
  getDashboardStats,
  getTags,
  searchBugs,
  addComment,
  getComments,
  voteOnBug,
  markAsSolved,
  voteOnComment,
  toggleBookmark,
  chatWithAI,
  suggestBugImprovements,
};

async function buildSubmissionInsights({ title = '', description = '', tags = [] }) {
  const suggestions = [];
  const words = title.trim().split(/\s+/).filter(Boolean);

  if (words.length < 4) {
    suggestions.push({ type: 'title', text: 'Your title is very short. Include where the bug happens, e.g. "Login button unresponsive on mobile Safari"' });
  }
  if (!/\b(on|in|when|after|during|with|error|fail|not|unable|cannot|broken)\b/i.test(title)) {
    suggestions.push({ type: 'title', text: 'Try adding context words like "when", "on", "after", or "not working" to make the title more specific' });
  }
  if (description.length < 50) {
    suggestions.push({ type: 'description', text: 'Add more detail — what did you expect to happen, and what actually happened?' });
  }
  if (!/expected|expect|should|supposed/i.test(description)) {
    suggestions.push({ type: 'description', text: 'Include the expected behavior: "Expected: X, Actual: Y"' });
  }
  if (!/step|click|open|navigate|tap|press|go to/i.test(description)) {
    suggestions.push({ type: 'steps', text: 'Missing reproduction steps — add numbered steps like "1. Open app, 2. Click login, 3. Error appears"' });
  }

  const combined = `${title} ${description}`.toLowerCase();
  const suggestedTags = [];
  if (/mobile|ios|android|safari|touch/i.test(combined) && !tags.includes('mobile')) suggestedTags.push('mobile');
  if (/login|auth|password|jwt|session/i.test(combined) && !tags.includes('auth')) suggestedTags.push('auth');
  if (/api|endpoint|fetch|axios|cors|http/i.test(combined) && !tags.includes('api')) suggestedTags.push('api');
  if (/button|click|form|ui|layout|css/i.test(combined) && !tags.includes('ui')) suggestedTags.push('ui');
  if (/database|mongo|query|save/i.test(combined) && !tags.includes('database')) suggestedTags.push('database');
  if (/slow|performance|lag|memory/i.test(combined) && !tags.includes('performance')) suggestedTags.push('performance');
  if (/crash|error|null|undefined/i.test(combined) && !tags.includes('error')) suggestedTags.push('error');

  const aiAnalysis = analyzeContext({ title, description, tags });
  const possibleFixes = aiAnalysis.fixes.slice(0, 3);

  return { suggestions, suggestedTags, possibleFixes };
}

