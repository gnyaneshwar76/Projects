import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../utils/api';

const TYPE_ICONS = {
  comment: '💬',
  solved: '✅',
  solution_accepted: '🎉',
  upvote: '⬆️',
};

function NotificationBell({ isDark }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationAPI.getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  }, []);

  // Poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleClickNotif = async (notif) => {
    if (!notif.read) {
      try {
        await notificationAPI.markAsRead(notif._id);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {}
    }
    setIsOpen(false);
  };

  const timeAgo = (d) => {
    const e = Date.now() - new Date(d).getTime();
    if (e < 60000) return 'Just now';
    const m = Math.floor(e / 60000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition-colors"
        style={{
          color: isDark ? '#9ca3af' : '#6b7280',
          backgroundColor: isOpen ? (isDark ? '#334155' : '#f3f4f6') : 'transparent',
        }}
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            width: '16px', height: '16px', borderRadius: '50%',
            backgroundColor: '#ef4444', color: '#fff',
            fontSize: '9px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute', right: 0, top: '100%', marginTop: '8px',
            width: '340px', maxHeight: '420px',
            borderRadius: '12px', overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            border: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            zIndex: 100,
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
          }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: isDark ? '#f1f5f9' : '#111827' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  color: '#6366f1', background: 'none', border: 'none', padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', maxHeight: '360px' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '32px 16px', textAlign: 'center',
                color: isDark ? '#64748b' : '#9ca3af',
              }}>
                <p style={{ fontSize: '28px', marginBottom: '8px' }}>🔔</p>
                <p style={{ fontSize: '13px' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => (
                <Link
                  key={notif._id}
                  to={notif.bugId ? `/bugs/${notif.bugId}` : '#'}
                  onClick={() => handleClickNotif(notif)}
                  style={{
                    display: 'flex', gap: '10px', padding: '10px 16px',
                    textDecoration: 'none',
                    backgroundColor: notif.read
                      ? 'transparent'
                      : isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)',
                    borderBottom: isDark ? '1px solid #1e293b' : '1px solid #f9fafb',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notif.read
                      ? 'transparent'
                      : isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)';
                  }}
                >
                  {/* Icon */}
                  <span style={{ fontSize: '18px', marginTop: '2px', flexShrink: 0 }}>
                    {TYPE_ICONS[notif.type] || '🔔'}
                  </span>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '12px', lineHeight: '1.4', margin: 0,
                      color: isDark ? '#e2e8f0' : '#374151',
                      fontWeight: notif.read ? 400 : 600,
                    }}>
                      {notif.message}
                    </p>
                    <p style={{
                      fontSize: '10px', margin: '2px 0 0',
                      color: isDark ? '#64748b' : '#9ca3af',
                    }}>
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: '#6366f1', flexShrink: 0, marginTop: '6px',
                    }} />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
