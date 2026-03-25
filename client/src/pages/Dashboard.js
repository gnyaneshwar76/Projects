import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bugAPI } from '../utils/api';
import '../App.css';

// Component to fetch comment count individually since backend doesn't bundle it yet
function FeedPost({ bug, isDark, onVote }) {
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    bugAPI.getComments(bug._id)
      .then(res => setCommentCount(res.data.length))
      .catch(() => {});
  }, [bug._id]);

  const timeAgo = (dateStr) => {
    const elapsed = Date.now() - new Date(dateStr).getTime();
    if (elapsed < 60000) return 'Just now';
    const hours = Math.floor(elapsed / 3600000);
    if (hours < 1) return `${Math.floor(elapsed / 60000)}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={`flex rounded-xl overflow-hidden border shadow-sm transition-all mb-4 ${isDark ? 'bg-[#1a1a1b] border-[#343536] hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
      
      {/* Vote Column */}
      <div className={`flex flex-col items-center p-2 w-12 pt-3 ${isDark ? 'bg-[#1a1a1b] border-r border-[#343536]' : 'bg-gray-50 border-r border-gray-100'}`}>
        <button onClick={(e) => { e.preventDefault(); onVote(bug._id, 'up'); }} className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isDark ? 'text-[#818384]' : 'text-gray-400'}`}>
          <svg className="w-6 h-6 hover:text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 5l-5 5h3v6h4v-6h3l-5-5z"/></svg>
        </button>
        <span className={`font-bold text-sm my-1 ${isDark ? 'text-[#d7dadc]' : 'text-gray-800'}`}>{bug.score || 0}</span>
        <button onClick={(e) => { e.preventDefault(); onVote(bug._id, 'down'); }} className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isDark ? 'text-[#818384]' : 'text-gray-400'}`}>
          <svg className="w-6 h-6 hover:text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l5-5h-3V4H8v6H5l5 5z"/></svg>
        </button>
      </div>

      {/* Content Column */}
      <Link to={`/bugs/${bug._id}`} className="flex-1 p-3 block decoration-none group relative" style={{textDecoration: 'none'}}>
        
        {/* Meta Info */}
        <div className="flex items-center text-xs text-[#787c7e] mb-2 gap-2 flex-wrap">
          {bug.tags && bug.tags.length > 0 ? (
            <span className={`font-bold hover:underline ${isDark ? 'text-[#d7dadc]' : 'text-gray-900'}`}>
              c/{bug.tags[0]}
            </span>
          ) : (
            <span className={`font-bold hover:underline ${isDark ? 'text-[#d7dadc]' : 'text-gray-900'}`}>
              c/general
            </span>
          )}
          <span>•</span>
          <span>Posted by <span className="hover:underline text-[#787c7e]">u/{bug.createdBy || 'anonymous'}</span></span>
          <span className="text-[#787c7e]">{timeAgo(bug.createdAt)}</span>
          
          {bug.isSolved && (
            <span className="ml-2 px-2 py-0.5 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full font-bold">
              ✓ Solved
            </span>
          )}
          
          <span className={`ml-auto px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
            bug.severity === 'critical' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
            bug.severity === 'high' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
            bug.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
            'bg-green-500/10 text-green-600 border-green-500/20'
          }`}>
            {bug.severity}
          </span>
        </div>

        {/* Title & Description */}
        <h2 className={`text-lg font-semibold mb-1 group-hover:underline leading-snug ${isDark ? 'text-[#d7dadc]' : 'text-gray-900'}`}>{bug.title}</h2>
        <p className={`text-sm mb-3 line-clamp-3 overflow-hidden ${isDark ? 'text-[#d7dadc]' : 'text-gray-600'}`}>{bug.description}</p>
        
        {/* Footer Actions */}
        <div className="flex gap-2 text-xs font-bold text-[#818384]">
          <div className={`flex gap-1.5 items-center p-2 rounded transition-colors ${isDark ? 'hover:bg-[#272729]' : 'hover:bg-gray-100'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            {commentCount} Comments
          </div>
          <div className={`flex gap-1.5 items-center p-2 rounded transition-colors ${isDark ? 'hover:bg-[#272729]' : 'hover:bg-gray-100'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
            Share
          </div>
        </div>
      </Link>
    </div>
  );
}

function Dashboard({ isDark = false }) {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New Feed State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('trending'); // 'trending', 'new', 'unresolved'

  useEffect(() => {
    fetchFeed();
  }, [filterType]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      
      // Determine backend sort parameter based on selected filter
      let backendSort = 'hot';
      if (filterType === 'new') backendSort = 'new';
      // For unresolved, we just fetch 'new' and filter it out client-side for now
      // since the backend doesn't natively support an array of statuses without modification
      if (filterType === 'unresolved') backendSort = 'new';

      const response = await bugAPI.getAllBugs({ sortBy: backendSort });
      let feedBugs = response.data.bugs || [];

      // Client-side filtering for 'unresolved'
      if (filterType === 'unresolved') {
        feedBugs = feedBugs.filter(b => !b.isSolved && b.status !== 'resolved' && b.status !== 'closed');
      }

      setBugs(feedBugs);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (bugId, type) => {
    try {
      const res = await bugAPI.voteOnBug(bugId, type);
      setBugs(bugs.map(b => b._id === bugId ? { ...b, score: res.data.score } : b));
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  // Client-side search filtering
  const filteredBugs = bugs.filter(bug => 
    bug.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    bug.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      
      {/* Search and Filters Section */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <input 
            type="text"
            placeholder="Search bugs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-full outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 border ${isDark ? 'bg-[#272729] border-[#343536] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
          />
          <svg className={`w-5 h-5 absolute left-4 top-3.5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>

        <div className={`flex gap-2 p-2 rounded-xl border ${isDark ? 'bg-[#1a1a1b] border-[#343536]' : 'bg-white border-gray-200'}`}>
          <button 
            onClick={() => setFilterType('trending')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${filterType === 'trending' ? (isDark ? 'bg-[#272729] text-white' : 'bg-green-50 text-green-700') : (isDark ? 'text-[#818384] hover:bg-[#272729]' : 'text-gray-500 hover:bg-gray-50')}`}
          >
            🔥 Trending
          </button>
          <button 
            onClick={() => setFilterType('new')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${filterType === 'new' ? (isDark ? 'bg-[#272729] text-white' : 'bg-blue-50 text-blue-700') : (isDark ? 'text-[#818384] hover:bg-[#272729]' : 'text-gray-500 hover:bg-gray-50')}`}
          >
            ✨ New
          </button>
          <button 
            onClick={() => setFilterType('unresolved')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${filterType === 'unresolved' ? (isDark ? 'bg-[#272729] text-white' : 'bg-orange-50 text-orange-700') : (isDark ? 'text-[#818384] hover:bg-[#272729]' : 'text-gray-500 hover:bg-gray-50')}`}
          >
            ⚠️ Unresolved
          </button>
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`flex rounded-xl overflow-hidden border animate-fade-in ${isDark ? 'bg-[#1a1a1b] border-[#343536]' : 'bg-white border-gray-200'}`}>
              <div className={`w-12 p-3 ${isDark ? 'bg-[#1a1a1b]' : 'bg-gray-50'}`}>
                <div className={`skeleton skeleton-line w-6 h-6 mx-auto rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
              </div>
              <div className="flex-1 p-4 space-y-3">
                <div className={`skeleton skeleton-line skeleton-line-sm ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <div className={`skeleton skeleton-line skeleton-line-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <div className={`skeleton skeleton-line skeleton-line-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <div className={`skeleton skeleton-line skeleton-line-md ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="error">⚠️ {error}</div>
      ) : filteredBugs.length === 0 ? (
        <div className={`empty-state ${isDark ? 'bg-[#1a1a1b] border-[#343536]' : 'bg-white'}`}>
          <div className="empty-state-icon">🔍</div>
          <div className={`empty-state-title ${isDark ? 'text-gray-200' : ''}`}>No bugs found</div>
          <div className="empty-state-text">
            {searchQuery ? `No results for "${searchQuery}"` : 'There are no bugs in this view yet.'}
          </div>
          <Link to="/bugs/create" className="btn-primary" style={{ textDecoration: 'none' }}>📝 Report a Bug</Link>
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {filteredBugs.map(bug => (
            <div key={bug._id} className="animate-slide-up">
              <FeedPost bug={bug} isDark={isDark} onVote={handleVote} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
