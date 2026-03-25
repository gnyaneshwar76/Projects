import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bugAPI } from '../utils/api';
import '../App.css';

function CommentThread({ comment, allComments, onReply, onVoteComment, isDark, updating, bugAuthorId, isSolved, acceptedAnswerId, onMarkSolved }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const children = allComments.filter(c => c.parentId === comment._id);
  const isAccepted = acceptedAnswerId && acceptedAnswerId.toString() === comment._id.toString();

  const timeAgo = (dateStr) => {
    const elapsed = Date.now() - new Date(dateStr).getTime();
    if (elapsed < 60000) return 'Just now';
    const mins = Math.floor(elapsed / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(comment._id, replyText);
    setReplyText('');
    setIsReplying(false);
  };

  return (
    <div className="mt-3 first:mt-0">
      <div
        className="p-4 rounded-xl transition-all"
        style={{
          backgroundColor: isAccepted
            ? (isDark ? '#052e16' : '#f0fdf4')
            : (isDark ? '#111827' : '#f9fafb'),
          border: isAccepted
            ? `2px solid ${isDark ? '#16a34a' : '#22c55e'}`
            : `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
          borderLeft: isAccepted
            ? `4px solid #22c55e`
            : `4px solid ${isDark ? '#3b82f6' : '#2563eb'}`,
        }}
      >
        {/* Accepted Answer badge */}
        {isAccepted && (
          <div className="flex items-center gap-2 mb-2 text-green-500 font-bold text-sm">
            <span>✅</span>
            <span>Accepted Solution</span>
          </div>
        )}

        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
              {(comment.authorName || 'U')[0].toUpperCase()}
            </div>
            <span className="font-semibold text-sm" style={{color: isDark ? '#f3f4f6' : '#111827'}}>
              {comment.authorName}
            </span>
          </div>
          <span className="text-xs" style={{color: isDark ? '#9ca3af' : '#6b7280'}}>
            {timeAgo(comment.createdAt)}
          </span>
        </div>
        
        {!collapsed ? (
          <>
            <p style={{color: isDark ? '#d1d5db' : '#374151', whiteSpace: 'pre-wrap', marginBottom: '12px', fontSize: '14px', lineHeight: '1.6'}}>
              {comment.text}
            </p>
            <div className="flex gap-4 text-xs font-semibold flex-wrap">
              <button onClick={() => setIsReplying(!isReplying)} style={{color: isDark ? '#60a5fa' : '#2563eb'}} className="hover:underline">
                💬 Reply
              </button>
              <button
                onClick={() => onVoteComment(comment._id)}
                style={{color: isDark ? '#9ca3af' : '#6b7280'}}
                className="hover:text-indigo-500 hover:underline"
              >
                ⬆ Useful ({comment.score || 0})
              </button>
              {children.length > 0 && (
                <button onClick={() => setCollapsed(true)} style={{color: isDark ? '#9ca3af' : '#6b7280'}} className="hover:underline">
                  [−] Collapse thread
                </button>
              )}
              {bugAuthorId && onMarkSolved && (
                <button
                  onClick={() => onMarkSolved(comment._id)}
                  style={{color: isAccepted ? '#22c55e' : (isDark ? '#9ca3af' : '#6b7280')}}
                  className="hover:text-green-500 hover:underline font-bold ml-auto"
                >
                  {isAccepted ? '★ Accepted Solution' : '✓ Mark as Solution'}
                </button>
              )}
            </div>

            {isReplying && (
              <form onSubmit={handleSubmit} className="mt-3">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="w-full p-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  style={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    color: isDark ? '#f3f4f6' : '#111827',
                    borderColor: isDark ? '#374151' : '#d1d5db'
                  }}
                />
                <button 
                  type="submit" 
                  disabled={updating || !replyText.trim()}
                  className="px-3 py-1 rounded text-white text-sm"
                  style={{ backgroundColor: isDark ? '#2563eb' : '#3b82f6' }}
                >
                  Submit Reply
                </button>
              </form>
            )}

            {children.length > 0 && (
              <div className="mt-4 pl-4 border-l-2" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                {children.map(child => (
                  <CommentThread 
                    key={child._id} 
                    comment={child} 
                    allComments={allComments} 
                    onReply={onReply} 
                    onVoteComment={onVoteComment}
                    isDark={isDark} 
                    updating={updating}
                    bugAuthorId={bugAuthorId}
                    isSolved={isSolved}
                    acceptedAnswerId={acceptedAnswerId}
                    onMarkSolved={onMarkSolved}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <button onClick={() => setCollapsed(false)} className="text-sm italic hover:underline" style={{color: isDark ? '#60a5fa' : '#2563eb'}}>
            [+] Expand {children.length} nested {children.length === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>
    </div>
  );
}

function BugDetailPage({ isDark = false }) {
  const { bugId } = useParams();
  const navigate = useNavigate();
  const [bug, setBug] = useState(null);
  const [similarBugs, setSimilarBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Derive current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const isOwner = bug && currentUser && (bug.userId?.toString() === currentUser._id?.toString() || bug.userId?.toString() === currentUser.id?.toString());

  useEffect(() => {
    fetchBugDetails();
    fetchSimilarBugs();
    fetchComments();
  }, [bugId]);

  // Broadcast bug context to the global AIChat widget
  useEffect(() => {
    if (!bug) return;
    window.dispatchEvent(new CustomEvent('bugContextChange', {
      detail: { title: bug.title, description: bug.description, tags: bug.tags || [] }
    }));
    return () => window.dispatchEvent(new CustomEvent('bugContextChange', { detail: null }));
  }, [bug]);

  const fetchComments = async () => {
    try {
      const response = await bugAPI.getComments(bugId);
      setComments(response.data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setUpdating(true);
      await bugAPI.addComment(bugId, newComment);
      setNewComment('');
      fetchComments(); // refresh
      setMessage({ type: 'success', text: 'Comment added!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUpdating(false);
    }
  };

  const handlePostReply = async (parentId, text) => {
    try {
      setUpdating(true);
      await bugAPI.addComment(bugId, text, parentId);
      fetchComments();
      setMessage({ type: 'success', text: 'Reply added!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUpdating(false);
    }
  };

  const handleVoteComment = async (commentId) => {
    try {
      const response = await bugAPI.voteOnComment(bugId, commentId);
      const nextScore = response.data.score;
      setComments((prev) => prev.map((comment) => (
        comment._id === commentId ? { ...comment, score: nextScore } : comment
      )));
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  const handleMarkSolved = async (commentId) => {
    try {
      setUpdating(true);
      const res = await bugAPI.markAsSolved(bugId, commentId);
      setBug({ ...bug, isSolved: res.data.bug.isSolved, acceptedAnswerId: res.data.bug.acceptedAnswerId });
      setMessage({ type: 'success', text: res.data.message });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setUpdating(false);
    }
  };

  const handleVote = async (type) => {
    try {
      const res = await bugAPI.voteOnBug(bugId, type);
      setBug({ ...bug, score: res.data.score });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  const rootComments = comments.filter(c => !c.parentId);

  const fetchBugDetails = async () => {
    try {
      setLoading(true);
      const response = await bugAPI.getBugById(bugId);
      setBug(response.data);
      setEditData(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching bug:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarBugs = async () => {
    try {
      const response = await bugAPI.findSimilarBugs(bugId, 3);
      setSimilarBugs(response.data.similarBugs || []);
    } catch (err) {
      console.error('Error fetching similar bugs:', err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      const response = await bugAPI.updateBug(bugId, { status: newStatus });
      setBug(response.data.bug);
      setMessage({ type: 'success', text: 'Status updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this bug?')) {
      try {
        await bugAPI.deleteBug(bugId);
        navigate('/bugs');
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.error || 'You are not allowed to modify this bug' });
      }
    }
  };

  const handleSave = async () => {
    try {
      setUpdating(true);
      const response = await bugAPI.updateBug(bugId, editData);
      setBug(response.data.bug);
      setEditMode(false);
      setMessage({ type: 'success', text: 'Bug updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'You are not allowed to modify this bug' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading bug details...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Error: {error}</div>
        <Link to="/bugs" className="btn-secondary btn-base mt-4">
          ← Back to Bugs
        </Link>
      </div>
    );
  }

  if (!bug) {
    return (
      <div className="container">
        <div className="error">Bug not found</div>
        <Link to="/bugs" className="btn-secondary btn-base mt-4">
          ← Back to Bugs
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/bugs" style={{
        color: isDark ? '#60a5fa' : '#2563eb',
        textDecoration: 'none',
        marginBottom: '24px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: '500'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = isDark ? '#93c5fd' : '#1d4ed8';
        e.currentTarget.style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = isDark ? '#60a5fa' : '#2563eb';
        e.currentTarget.style.textDecoration = 'none';
      }}
      >
        ← Back to Bugs
      </Link>

      <div className="grid-3 gap-8">
        {/* Main Bug Info */}
        <div className="col-span-2">
          <div className="card p-8" style={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            border: isDark ? '1px solid #374151' : 'none'
          }}>
            {message && (
              <div className={message.type === 'success' ? 'success' : 'error'}>
                {message.text}
              </div>
            )}

            {/* Header with Votes */}
            <div className="flex items-start mb-6">
              
              {/* Vote Column */}
              <div className={`flex flex-col items-center mr-6 p-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border`}>
                <button onClick={() => handleVote('up')} className={`p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <svg className="w-8 h-8 hover:text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 5l-5 5h3v6h4v-6h3l-5-5z"/></svg>
                </button>
                <span className={`font-bold text-xl my-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{bug.score || 0}</span>
                <button onClick={() => handleVote('down')} className={`p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                   <svg className="w-8 h-8 hover:text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l5-5h-3V4H8v6H5l5 5z"/></svg>
                </button>
              </div>

              <div className="flex-1 flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold" style={{color: isDark ? '#f3f4f6' : '#111827', marginBottom: '8px'}}>{bug.title}</h1>
                  <div className="flex gap-2 flex-wrap items-center">
                    <span className={`badge badge-${bug.severity}`}>
                      {bug.severity.charAt(0).toUpperCase() + bug.severity.slice(1)}
                    </span>
                    {bug.isSolved && (
                      <span className="px-3 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full font-bold text-sm">
                        ✓ Solved
                      </span>
                    )}
                  </div>
                </div>
                {/* Ask AI button — visible to all users */}
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('aiChatOpen'))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}
                >
                  🤖 Ask AI
                </button>

                {/* Edit & Delete: only visible to the post owner */}
                {isOwner && (
                  <div className="flex gap-2">
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="btn-secondary btn-base"
                  >
                    {editMode ? '✕ Cancel' : '✏️ Edit'}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="btn-danger btn-base"
                  >
                    🗑️ Delete
                  </button>
                </div>
                )}
              </div>
            </div>

          {/* Status Updates: only visible to post owner */}
            {isOwner && (
            <div className="my-6 p-4 rounded-lg" style={{
              backgroundColor: isDark ? '#111827' : '#eff6ff',
              border: isDark ? '1px solid #374151' : 'none'
            }}>
              <label className="form-label" style={{color: isDark ? '#f3f4f6' : 'inherit'}}>Change Status</label>
              <div className="flex gap-2 flex-wrap mt-2">
                {['open', 'in-progress', 'resolved', 'closed'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={updating || bug.status === status}
                    className={`btn-base capitalize ${
                      bug.status === status
                        ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                        : 'btn-secondary'
                    }`}
                  >
                    {status.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2" style={{color: isDark ? '#f3f4f6' : '#111827'}}>Description</h2>
              {editMode ? (
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="form-textarea"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    color: isDark ? '#f3f4f6' : '#111827',
                    borderColor: isDark ? '#374151' : '#d1d5db'
                  }}
                />
              ) : (
                <p style={{color: isDark ? '#d1d5db' : '#374151', whiteSpace: 'pre-wrap'}}>{bug.description}</p>
              )}
            </div>

            {/* Steps to Reproduce */}
            {bug.stepsToReproduce && bug.stepsToReproduce.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-2" style={{color: isDark ? '#f3f4f6' : '#111827'}}>Steps to Reproduce</h2>
                <ol className="list-decimal list-inside space-y-2" style={{color: isDark ? '#d1d5db' : '#374151'}}>
                  {bug.stepsToReproduce.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Tags */}
            {bug.tags && bug.tags.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-2" style={{color: isDark ? '#f3f4f6' : '#111827'}}>Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {bug.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: '14px',
                      backgroundColor: isDark ? '#1e40af' : '#dbeafe',
                      color: isDark ? '#93c5fd' : '#0369a1',
                      padding: '4px 12px',
                      borderRadius: '9999px'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Meta Information */}
            <div className="border-t pt-6 grid-2 gap-4" style={{borderTopColor: isDark ? '#374151' : '#e5e7eb'}}>
              <div>
                <span style={{color: isDark ? '#9ca3af' : '#6b7280', fontSize: '14px'}}>Created By</span>
                <p style={{fontWeight: '600', color: isDark ? '#f3f4f6' : '#111827'}}>{bug.createdBy || 'Anonymous'}</p>
              </div>
              <div>
                <span style={{color: isDark ? '#9ca3af' : '#6b7280', fontSize: '14px'}}>Created At</span>
                <p style={{fontWeight: '600', color: isDark ? '#f3f4f6' : '#111827'}}>
                  {new Date(bug.createdAt).toLocaleString()}
                </p>
              </div>
              {bug.assignedTo && (
                <div>
                  <span style={{color: isDark ? '#9ca3af' : '#6b7280', fontSize: '14px'}}>Assigned To</span>
                  <p style={{fontWeight: '600', color: isDark ? '#f3f4f6' : '#111827'}}>{bug.assignedTo}</p>
                </div>
              )}
              <div>
                <span style={{color: isDark ? '#9ca3af' : '#6b7280', fontSize: '14px'}}>Last Updated</span>
                <p style={{fontWeight: '600', color: isDark ? '#f3f4f6' : '#111827'}}>
                  {new Date(bug.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {editMode && (
              <div className="mt-6 flex gap-2">
                <button onClick={handleSave} disabled={updating} className="btn-primary btn-base">
                  💾 Save Changes
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="btn-secondary btn-base"
                >
                  ✕ Cancel
                </button>
              </div>
            )}
            
            {/* Comments Section */}
            <div className="mt-8 border-t pt-6" style={{borderTopColor: isDark ? '#374151' : '#e5e7eb'}}>
              
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-bold" style={{color: isDark ? '#f3f4f6' : '#111827'}}>
                  💬 Comments
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-sm font-bold ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  {comments.length}
                </span>
                {bug.isSolved && (
                  <span className="ml-auto px-3 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 text-sm font-bold">
                    ✅ Solved
                  </span>
                )}
              </div>

              {/* Write Comment */}
              <form onSubmit={handlePostComment} className={`mb-8 p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>WRITE A COMMENT</p>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts, solution, or ask a follow-up question..."
                  className="w-full p-3 rounded-lg border mb-3 focus:ring-2 focus:outline-none resize-none"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    color: isDark ? '#f3f4f6' : '#111827',
                    borderColor: isDark ? '#374151' : '#d1d5db',
                    minHeight: '90px',
                    focusRingColor: '#3b82f6'
                  }}
                />
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {bug.userId === (JSON.parse(localStorage.getItem('user') || 'null') || {})._id ? 'You can mark a comment as the solution below.' : 'Tip: Be specific and helpful!'}
                  </p>
                  <button 
                    type="submit" 
                    disabled={updating || !newComment.trim()} 
                    className="px-5 py-2 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#3b82f6' }}
                  >
                    Post Comment
                  </button>
                </div>
              </form>
              
              {/* Comment List */}
              {comments.length === 0 ? (
                <div className={`text-center py-10 rounded-xl border-dashed border-2 ${isDark ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                  <p className="text-4xl mb-2">💬</p>
                  <p className="font-medium">No comments yet.</p>
                  <p className="text-sm mt-1">Be the first to share a solution or ask a follow-up!</p>
                </div>
              ) : (
                <div className="space-y-3">

                  {/* ── Pinned Accepted Solution ── */}
                  {bug.isSolved && bug.acceptedAnswerId && (() => {
                    const accepted = comments.find(
                      c => c._id?.toString() === bug.acceptedAnswerId?.toString()
                    );
                    if (!accepted) return null;
                    const timeAgo = (d) => {
                      const e = Date.now() - new Date(d).getTime();
                      if (e < 60000) return 'Just now';
                      const m = Math.floor(e / 60000);
                      if (m < 60) return `${m}m ago`;
                      const h = Math.floor(m / 60);
                      if (h < 24) return `${h}h ago`;
                      return `${Math.floor(h / 24)}d ago`;
                    };
                    return (
                      <div
                        key={`accepted-${accepted._id}`}
                        className="rounded-xl overflow-hidden shadow-sm"
                        style={{ border: `2px solid ${isDark ? '#16a34a' : '#22c55e'}` }}
                      >
                        {/* Green header bar */}
                        <div className="flex items-center gap-2 px-4 py-2 font-bold text-sm"
                          style={{ background: isDark ? '#052e16' : '#dcfce7', color: isDark ? '#4ade80' : '#15803d' }}>
                          <span className="text-lg">✅</span>
                          <span>Accepted Solution</span>
                          <span className="ml-auto text-xs font-normal opacity-70">by {accepted.authorName}</span>
                        </div>
                        {/* Comment body */}
                        <div className="p-4" style={{ background: isDark ? '#071a0e' : '#f0fdf4' }}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                              {(accepted.authorName || 'U')[0].toUpperCase()}
                            </div>
                            <span className="font-semibold text-sm" style={{ color: isDark ? '#f3f4f6' : '#111827' }}>
                              {accepted.authorName}
                            </span>
                            <span className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                              {timeAgo(accepted.createdAt)}
                            </span>
                          </div>
                          <p style={{ color: isDark ? '#d1d5db' : '#374151', whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.6' }}>
                            {accepted.text}
                          </p>
                          {/* Bug author can un-mark */}
                          {isOwner && (
                            <button
                              onClick={() => handleMarkSolved(accepted._id)}
                              className="mt-3 text-xs font-semibold hover:underline"
                              style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                            >
                              ✕ Un-mark as solution
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Rest of root comments (excluding pinned) ── */}
                  {rootComments
                    .filter(c => !bug.acceptedAnswerId || c._id?.toString() !== bug.acceptedAnswerId?.toString())
                    .map(comment => (
                      <CommentThread
                        key={comment._id}
                        comment={comment}
                        allComments={comments}
                        onReply={handlePostReply}
                        onVoteComment={handleVoteComment}
                        isDark={isDark}
                        updating={updating}
                        bugAuthorId={isOwner ? bug.userId : null}
                        isSolved={bug.isSolved}
                        acceptedAnswerId={bug.acceptedAnswerId}
                        onMarkSolved={handleMarkSolved}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Similar Bugs */}
          <div className="card p-6" style={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            border: isDark ? '1px solid #374151' : 'none'
          }}>
            <h2 className="text-lg font-bold mb-4" style={{color: isDark ? '#f3f4f6' : '#111827'}}>🔗 Related Discussions</h2>
            {similarBugs.length > 0 ? (
              <div className="space-y-3">
                {similarBugs.map(similarBug => (
                  <Link
                    key={similarBug.bugId}
                    to={`/bugs/${similarBug.bugId}`}
                    style={{
                      display: 'block',
                      padding: '12px',
                      border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = isDark ? '#60a5fa' : '#3b82f6';
                      e.currentTarget.style.backgroundColor = isDark ? '#111827' : '#eff6ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isDark ? '#374151' : '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{fontWeight: '600', color: isDark ? '#60a5fa' : '#3b82f6', fontSize: '14px', textDecoration: 'none'}}>
                      {similarBug.title}
                    </div>
                    <div style={{fontSize: '12px', color: isDark ? '#9ca3af' : '#6b7280', marginTop: '4px'}}>
                      Similarity: {(similarBug.similarity * 100).toFixed(1)}%
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{color: isDark ? '#9ca3af' : '#9ca3af', fontSize: '14px'}}>No similar bugs found</div>
            )}
          </div>

          {/* Root Cause (if available) */}
          {bug.rootCauseSuggestion && (
            <div className="card p-6" style={{
              backgroundColor: isDark ? '#1f2937' : '#fffbeb',
              border: isDark ? '1px solid #374151' : '1px solid #fcd34d'
            }}>
              <h2 className="text-lg font-bold mb-2" style={{color: isDark ? '#f3f4f6' : '#111827'}}>💡 Root Cause Suggestion</h2>
              <p style={{color: isDark ? '#d1d5db' : '#374151'}}>{bug.rootCauseSuggestion}</p>
            </div>
          )}

          {/* Cluster Info */}
          {bug.clusterLabel !== -1 && (
            <div className="card p-6" style={{
              backgroundColor: isDark ? '#1f2937' : '#f3e8ff',
              border: isDark ? '1px solid #374151' : '1px solid #e9d5ff'
            }}>
              <h2 className="text-lg font-bold mb-2" style={{color: isDark ? '#f3f4f6' : '#111827'}}>📊 Cluster Info</h2>
              <p style={{color: isDark ? '#d1d5db' : '#374151'}}>
                Part of cluster {bug.clusterLabel} in system analysis
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BugDetailPage;
