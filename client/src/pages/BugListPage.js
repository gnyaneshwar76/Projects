import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { bugAPI } from '../utils/api';
import '../App.css';

// ─── Tag suggestion map ───────────────────────────────────────────────────────
const TAG_SUGGESTIONS = {
  log: ['login', 'logout', 'session'],
  auth: ['auth', 'authentication', 'jwt'],
  ui: ['ui', 'layout', 'style', 'css'],
  api: ['api', 'rest', 'endpoint', 'cors'],
  mob: ['mobile', 'ios', 'android', 'responsive'],
  per: ['performance', 'slow', 'memory'],
  dat: ['database', 'mongo', 'query'],
  cra: ['crash', 'error', 'exception'],
  but: ['button', 'click', 'form'],
};

function getSuggestions(query, allTags) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  // Match from live tags first
  const fromDB = allTags.filter(t => t.name.toLowerCase().startsWith(q)).slice(0, 5);
  // Add from static map
  const fromMap = [];
  Object.keys(TAG_SUGGESTIONS).forEach(k => {
    if (q.startsWith(k) || k.startsWith(q.slice(0, 3))) {
      TAG_SUGGESTIONS[k].forEach(s => {
        if (s.startsWith(q) && !fromDB.find(t => t.name === s)) fromMap.push({ name: s, count: 0 });
      });
    }
  });
  return [...fromDB, ...fromMap].slice(0, 6);
}

// ─── Severity badge ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const map = {
    critical: 'bg-red-500/10 text-red-600 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    low: 'bg-green-500/10 text-green-600 border-green-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${map[severity] || map.low}`}>
      {severity}
    </span>
  );
}

// ─── Tag pill ─────────────────────────────────────────────────────────────────
function TagPill({ tag, active, onClick, isDark }) {
  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); onClick(tag); }}
      className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : isDark
            ? 'bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/60'
            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
      }`}
    >
      #{tag}
    </button>
  );
}

// ─── Single feed card ─────────────────────────────────────────────────────────
function BugCard({ bug, isDark, onVote, activeTag, onTagClick }) {
  const [commentCount, setCommentCount] = useState(null);

  useEffect(() => {
    bugAPI.getComments(bug._id)
      .then(r => setCommentCount(r.data.length))
      .catch(() => {});
  }, [bug._id]);

  const timeAgo = d => {
    const e = Date.now() - new Date(d).getTime();
    if (e < 60000) return 'Just now';
    const m = Math.floor(e / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className={`flex rounded-xl overflow-hidden border shadow-sm transition-all mb-3 ${isDark ? 'bg-[#1a1a1b] border-[#343536] hover:border-gray-500' : 'bg-white border-gray-200 hover:border-indigo-300'}`}>

      {/* Vote Column */}
      <div className={`flex flex-col items-center p-2 w-11 pt-3 shrink-0 ${isDark ? 'bg-[#161617] border-r border-[#343536]' : 'bg-gray-50 border-r border-gray-100'}`}>
        <button onClick={e => { e.preventDefault(); onVote(bug._id, 'up'); }} className="p-0.5 rounded hover:text-orange-500 transition-colors" style={{ color: isDark ? '#818384' : '#9ca3af' }}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 5l-5 5h3v6h4v-6h3l-5-5z"/></svg>
        </button>
        <span className={`font-bold text-xs my-1 ${isDark ? 'text-[#d7dadc]' : 'text-gray-800'}`}>{bug.score ?? 0}</span>
        <button onClick={e => { e.preventDefault(); onVote(bug._id, 'down'); }} className="p-0.5 rounded hover:text-blue-500 transition-colors" style={{ color: isDark ? '#818384' : '#9ca3af' }}>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l5-5h-3V4H8v6H5l5 5z"/></svg>
        </button>
      </div>

      {/* Content */}
      <Link to={`/bugs/${bug._id}`} className="flex-1 p-3 block group" style={{ textDecoration: 'none' }}>
        {/* Meta row */}
        <div className="flex items-center gap-2 text-xs mb-1.5 flex-wrap" style={{ color: isDark ? '#818384' : '#6b7280' }}>
          {/* Primary tag as community */}
          {bug.tags?.[0] && (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onTagClick(bug.tags[0]); }}
              className={`font-bold hover:underline ${isDark ? 'text-[#d7dadc]' : 'text-gray-800'}`}
            >
              c/{bug.tags[0]}
            </button>
          )}
          {!bug.tags?.[0] && <span className={`font-bold ${isDark ? 'text-[#d7dadc]' : 'text-gray-800'}`}>c/general</span>}
          <span>•</span>
          <span>u/{bug.createdBy || 'anonymous'}</span>
          <span>{timeAgo(bug.createdAt)}</span>

          {/* Solved badge */}
          {bug.isSolved && (
            <span className="px-2 py-0.5 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full font-bold text-[10px] uppercase tracking-wide">
              ✓ Solved
            </span>
          )}

          <SeverityBadge severity={bug.severity} />
        </div>

        {/* Title */}
        <h2 className={`text-base font-semibold mb-1 group-hover:underline leading-snug ${isDark ? 'text-[#d7dadc]' : 'text-gray-900'}`}>
          {bug.title}
        </h2>

        {/* Description preview */}
        <p className={`text-xs mb-2 line-clamp-2 ${isDark ? 'text-[#818384]' : 'text-gray-500'}`}>
          {bug.description}
        </p>

        {/* Tags row */}
        {bug.tags && bug.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {bug.tags.slice(0, 5).map(tag => (
              <TagPill key={tag} tag={tag} active={activeTag === tag} onClick={onTagClick} isDark={isDark} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 text-xs font-bold" style={{ color: isDark ? '#818384' : '#9ca3af' }}>
          <span className={`flex gap-1 items-center p-1.5 rounded transition-colors ${isDark ? 'hover:bg-[#272729]' : 'hover:bg-gray-100'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            {commentCount !== null ? `${commentCount} Comments` : '…'}
          </span>
          <span className={`flex gap-1 items-center p-1.5 rounded transition-colors ${isDark ? 'hover:bg-[#272729]' : 'hover:bg-gray-100'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
            Share
          </span>
        </div>
      </Link>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function BugListPage({ isDark = false }) {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state — driven from URL params so they're shareable
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [activeTag, setActiveTag] = useState(searchParams.get('tag') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest');
  const [solvedFilter, setSolvedFilter] = useState(searchParams.get('solved') || '');

  // Tag suggestions dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Fetch tag cloud once on mount
  useEffect(() => {
    bugAPI.getTags()
      .then(r => setAllTags(r.data.tags || []))
      .catch(() => {});
  }, []);

  // Fetch bugs whenever filters change (debounced for search)
  const fetchBugs = useCallback(async (params) => {
    try {
      setLoading(true);
      const res = await bugAPI.getAllBugs(params);
      setBugs(res.data.bugs || []);
    } catch {
      setBugs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search input changes
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = { sortBy };
      if (searchInput.trim()) params.q = searchInput.trim();
      if (activeTag) params.tag = activeTag;
      if (solvedFilter) params.solved = solvedFilter;
      fetchBugs(params);
      // Sync to URL
      const sp = {};
      if (searchInput.trim()) sp.q = searchInput.trim();
      if (activeTag) sp.tag = activeTag;
      if (sortBy !== 'latest') sp.sort = sortBy;
      if (solvedFilter) sp.solved = solvedFilter;
      setSearchParams(sp, { replace: true });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput, activeTag, sortBy, solvedFilter, fetchBugs, setSearchParams]);

  const handleVote = async (bugId, type) => {
    try {
      const res = await bugAPI.voteOnBug(bugId, type);
      setBugs(prev => prev.map(b => b._id === bugId ? { ...b, score: res.data.score } : b));
    } catch {}
  };

  const handleTagClick = (tag) => {
    setActiveTag(prev => prev === tag ? '' : tag);
    setSearchInput('');
    setShowSuggestions(false);
  };

  const handleClearAll = () => {
    setSearchInput('');
    setActiveTag('');
    setSolvedFilter('');
    setSortBy('latest');
  };

  const suggestions = getSuggestions(searchInput, allTags);
  const hasFilters = searchInput || activeTag || solvedFilter;

  const cardBg = isDark ? 'bg-[#1a1a1b] border-[#343536]' : 'bg-white border-gray-200';
  const inputBg = isDark ? 'bg-[#272729] border-[#343536] text-[#d7dadc] placeholder-[#818384]' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Bug Feed</h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {bugs.length} post{bugs.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link to="/bugs/create" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-full transition-colors shadow">
          + New Post
        </Link>
      </div>

      {/* ── Search bar ── */}
      <div className="relative mb-4" ref={searchRef}>
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${inputBg} shadow-sm`}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: isDark ? '#818384' : '#9ca3af' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search bugs by title, description, or tag..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); setShowSuggestions(false); }} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          )}
        </div>

        {/* Tag suggestions dropdown */}
        {showSuggestions && searchInput.length >= 2 && suggestions.length > 0 && (
          <div className={`absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-xl z-30 overflow-hidden ${isDark ? 'bg-[#1a1a1b] border-[#343536]' : 'bg-white border-gray-200'}`}>
            <p className={`px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Suggested Tags
            </p>
            {suggestions.map(s => (
              <button
                key={s.name}
                onMouseDown={() => { handleTagClick(s.name); setSearchInput(''); }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${isDark ? 'hover:bg-[#272729] text-[#d7dadc]' : 'hover:bg-indigo-50 text-gray-800'}`}
              >
                <span className="text-indigo-500 font-mono">#{s.name}</span>
                {s.count > 0 && <span className={`ml-auto text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{s.count} posts</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className={`flex items-center gap-2 mb-5 p-3 rounded-xl border flex-wrap ${isDark ? 'bg-[#1a1a1b] border-[#343536]' : 'bg-white border-gray-200'} shadow-sm`}>
        {/* Sort */}
        <span className={`text-xs font-semibold mr-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Sort:</span>
        {[
          { id: 'latest', label: 'Latest' },
          { id: 'most-upvoted', label: 'Most upvoted' },
          { id: 'most-solved', label: 'Most solved' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setSortBy(opt.id)}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
              sortBy === opt.id
                ? (isDark ? 'bg-indigo-700 text-white' : 'bg-indigo-600 text-white')
                : (isDark ? 'text-gray-400 hover:bg-[#272729]' : 'text-gray-500 hover:bg-gray-100')
            }`}
          >
            {opt.label}
          </button>
        ))}

        <div className={`w-px h-5 mx-1 ${isDark ? 'bg-[#343536]' : 'bg-gray-200'}`} />

        {/* Solved filter */}
        <span className={`text-xs font-semibold mr-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Status:</span>
        {[
          { id: '', label: 'All' },
          { id: 'false', label: '🔓 Unsolved' },
          { id: 'true', label: '✅ Solved' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setSolvedFilter(opt.id)}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
              solvedFilter === opt.id
                ? (isDark ? 'bg-green-800 text-green-200' : 'bg-green-600 text-white')
                : (isDark ? 'text-gray-400 hover:bg-[#272729]' : 'text-gray-500 hover:bg-gray-100')
            }`}
          >
            {opt.label}
          </button>
        ))}

        {hasFilters && (
          <>
            <div className={`w-px h-5 mx-1 ${isDark ? 'bg-[#343536]' : 'bg-gray-200'}`} />
            <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-400 font-semibold">
              ✕ Clear filters
            </button>
          </>
        )}
      </div>

      {/* ── Active tag badge ── */}
      {activeTag && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Filtering by tag:</span>
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold">
            #{activeTag}
            <button onClick={() => setActiveTag('')} className="ml-1 opacity-80 hover:opacity-100">×</button>
          </span>
        </div>
      )}

      {/* ── Tag cloud ── */}
      {!activeTag && !searchInput && allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {allTags.slice(0, 15).map(t => (
            <TagPill key={t.name} tag={t.name} active={false} onClick={handleTagClick} isDark={isDark} />
          ))}
        </div>
      )}

      {/* ── Feed ── */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => (
            <div key={i} className={`flex rounded-xl border h-24 animate-pulse ${isDark ? 'bg-[#1a1a1b] border-[#343536]' : 'bg-white border-gray-200'}`}>
              <div className={`w-11 ${isDark ? 'bg-[#161617]' : 'bg-gray-100'} rounded-l-xl`} />
              <div className="flex-1 p-3 space-y-2">
                <div className={`h-3 w-48 rounded ${isDark ? 'bg-[#272729]' : 'bg-gray-100'}`} />
                <div className={`h-4 w-3/4 rounded ${isDark ? 'bg-[#272729]' : 'bg-gray-100'}`} />
                <div className={`h-3 w-1/2 rounded ${isDark ? 'bg-[#272729]' : 'bg-gray-100'}`} />
              </div>
            </div>
          ))}
        </div>
      ) : bugs.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${isDark ? 'border-[#343536] text-gray-500' : 'border-gray-200 text-gray-400'}`}>
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-base mb-1">No posts found</p>
          <p className="text-sm">Try different search terms or clear your filters</p>
          {hasFilters && (
            <button onClick={handleClearAll} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div>
          {bugs.map(bug => (
            <BugCard
              key={bug._id}
              bug={bug}
              isDark={isDark}
              onVote={handleVote}
              activeTag={activeTag}
              onTagClick={handleTagClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default BugListPage;
