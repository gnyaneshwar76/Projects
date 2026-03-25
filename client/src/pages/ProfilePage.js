import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authAPI, bugAPI } from '../utils/api';

const BADGE_STYLES = {
  Beginner:     { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30', icon: '🌱' },
  Contributor:  { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', icon: '⭐' },
  Expert:       { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', icon: '🏆' },
};

function ProfilePage({ isDark }) {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const isOwnProfile = currentUser && (currentUser._id === userId || currentUser.id === userId);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await authAPI.getUserProfile(userId);
        setProfile(res.data);
        setBioInput(res.data.bio || '');
        // Fetch this user's bugs
        const bugsRes = await bugAPI.getAllBugs({});
        const userBugs = (bugsRes.data.bugs || []).filter(
          b => b.userId === userId || b.userId?._id === userId
        );
        setBugs(userBugs);
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleBioSave = async () => {
    try {
      await authAPI.updateProfile({ bio: bioInput });
      setProfile(prev => ({ ...prev, bio: bioInput }));
      setEditingBio(false);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className={`text-lg font-semibold animate-pulse ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-24">
        <p className="text-4xl mb-3">😕</p>
        <p className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>User not found</p>
      </div>
    );
  }

  const badge = BADGE_STYLES[profile.badge] || BADGE_STYLES.Beginner;
  const cardBg = isDark ? 'bg-[#1a1a1b] border-[#343536]' : 'bg-white border-gray-200';
  const muted = isDark ? 'text-gray-500' : 'text-gray-400';

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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>

      {/* ── Profile Card ── */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden mb-6 ${cardBg}`}>
        {/* Banner */}
        <div className="h-28" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }} />

        <div className="px-6 pb-6 -mt-12">
          {/* Avatar */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold border-4 shadow-lg ${isDark ? 'bg-[#1a1a1b] border-[#1a1a1b] text-indigo-400' : 'bg-white border-white text-indigo-600'}`}>
            {profile.name[0].toUpperCase()}
          </div>

          <div className="mt-3 flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {profile.name}
              </h1>
              <p className={`text-sm ${muted}`}>
                Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Badge */}
            <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${badge.bg} ${badge.text} ${badge.border}`}>
              {badge.icon} {profile.badge}
            </span>
          </div>

          {/* Bio */}
          <div className="mt-3">
            {editingBio && isOwnProfile ? (
              <div className="flex gap-2">
                <input
                  value={bioInput}
                  onChange={e => setBioInput(e.target.value)}
                  maxLength={200}
                  placeholder="Tell us about yourself..."
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-[#272729] border-[#343536] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
                <button onClick={handleBioSave} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">Save</button>
                <button onClick={() => setEditingBio(false)} className={`px-3 py-2 rounded-lg text-sm font-bold ${isDark ? 'text-gray-400 hover:bg-[#272729]' : 'text-gray-500 hover:bg-gray-100'}`}>Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {profile.bio || (isOwnProfile ? 'No bio yet. Click edit to add one!' : 'This user hasn\'t added a bio yet.')}
                </p>
                {isOwnProfile && (
                  <button onClick={() => setEditingBio(true)} className={`text-xs font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'} hover:underline`}>Edit</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Reputation', value: profile.reputation, icon: '⚡', color: 'text-amber-500' },
          { label: 'Bugs Posted', value: profile.totalBugs, icon: '🐛', color: 'text-red-400' },
          { label: 'Bugs Solved', value: profile.bugsSolved, icon: '✅', color: 'text-green-400' },
          { label: 'Badge', value: profile.badge, icon: badge.icon, color: badge.text },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl border p-4 text-center ${cardBg}`}>
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${muted}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Recent Bugs ── */}
      <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        <div className={`px-5 py-3 border-b font-bold text-sm ${isDark ? 'border-[#343536] text-gray-300' : 'border-gray-200 text-gray-700'}`}>
          🐛 Recent Posts by {profile.name}
        </div>

        {bugs.length === 0 ? (
          <div className={`p-8 text-center ${muted}`}>
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">No posts yet</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: isDark ? '#343536' : '#e5e7eb' }}>
            {bugs.slice(0, 10).map(bug => (
              <Link key={bug._id} to={`/bugs/${bug._id}`} className={`flex items-center gap-3 px-5 py-3 transition-colors ${isDark ? 'hover:bg-[#272729]' : 'hover:bg-gray-50'}`} style={{ textDecoration: 'none' }}>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{bug.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs ${muted}`}>{timeAgo(bug.createdAt)}</span>
                    {bug.isSolved && <span className="text-[10px] font-bold text-green-500">✓ Solved</span>}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
                      bug.severity === 'critical' ? 'text-red-500 border-red-500/20' :
                      bug.severity === 'high' ? 'text-orange-500 border-orange-500/20' :
                      bug.severity === 'medium' ? 'text-yellow-500 border-yellow-500/20' :
                      'text-green-500 border-green-500/20'
                    }`}>{bug.severity}</span>
                  </div>
                </div>
                <span className={`text-sm font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>⬆ {bug.score || 0}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Reputation Guide ── */}
      <div className={`rounded-xl border p-4 mt-6 ${cardBg}`}>
        <p className={`font-bold text-xs uppercase tracking-wider mb-2 ${muted}`}>How Reputation Works</p>
        <div className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>⚡ <strong>+10</strong> when your solution is accepted</p>
          <p>⬆ <strong>+5</strong> when someone upvotes your bug</p>
          <p>🌱 <strong>0–29</strong> → Beginner &nbsp;| &nbsp;⭐ <strong>30–99</strong> → Contributor &nbsp;| &nbsp;🏆 <strong>100+</strong> → Expert</p>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
