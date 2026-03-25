import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bugAPI } from '../utils/api';

// ─── Sub-components ───────────────────────────────────────────────

/** Bug match card */
function BugMatchCard({ rec, isDark, onClose }) {
  return (
    <Link to={`/bugs/${rec.id}`} onClick={onClose} style={{ textDecoration: 'none' }}
      className={`block rounded-lg border px-3 py-2 text-xs transition-colors ${isDark ? 'bg-gray-800/80 border-gray-700 hover:border-indigo-500' : 'bg-white border-gray-200 hover:border-indigo-400'}`}>
      <div className="flex items-start gap-2 mb-1">
        <span className={`font-semibold flex-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{rec.title}</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
          rec.severity === 'critical' ? 'bg-red-500/10 text-red-500' :
          rec.severity === 'high' ? 'bg-orange-500/10 text-orange-500' :
          'bg-yellow-500/10 text-yellow-500'
        }`}>{rec.severity}</span>
      </div>
      <div className={`flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <span className={`ml-auto ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>⭐ {rec.score ?? 0}</span>
        {rec.isSolved && <span className="text-green-500 font-bold">✓ Solved</span>}
      </div>
    </Link>
  );
}

/** Single message bubble */
function MessageBubble({ msg, isDark, onClose }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[80%] px-4 py-2.5 bg-indigo-600 text-white rounded-2xl rounded-br-sm text-sm shadow">{msg.text}</div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[95%] space-y-2">
        {/* Main AI reply */}
        {(msg.text || msg.reply) && (
          <div className={`px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm shadow-sm border whitespace-pre-wrap ${
            msg.type === 'nvidia_ai'
              ? isDark ? 'bg-gray-800 border-indigo-500/30 text-gray-100' : 'bg-indigo-50 border-indigo-200 text-gray-800'
              : isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'
          }`}>
            {msg.type === 'nvidia_ai' && <div className="text-[10px] font-bold uppercase text-indigo-500 mb-2 flex items-center gap-1"><span>⚡</span> NVIDIA AI Assistant</div>}
            {msg.text || msg.reply}
          </div>
        )}

        {/* Bug matches explicitly returned by backend */}
        {msg.relatedBugs?.length > 0 && msg.relatedBugs.map(r => <BugMatchCard key={r.id} rec={r} isDark={isDark} onClose={onClose} />)}

        {/* Keywords pills (showing DB search insights) */}
        {msg.keywords && msg.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {msg.keywords.slice(0, 6).map((kw, i) => (
              <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'}`}>
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Typing dots */
function TypingIndicator({ isDark }) {
  return (
    <div className="flex justify-start mb-3">
      <div className={`px-4 py-3 rounded-2xl rounded-bl-sm border shadow-sm flex gap-1.5 items-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {[0, 1, 2].map(i => (
          <span key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
        <span className={`ml-1.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Thinking...</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

function AIChat({ isDark, bugContext = null, autoOpen = false, onAutoOpenHandled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: bugContext
        ? `Hi! I'm your debugging assistant. I can see you're viewing a bug right now. How can I help?`
        : `Hi! I'm your debugging assistant. Describe the issue you're facing and I'll find similar solved bugs or try to help debug it with AI!`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-open when triggered from Ask AI button
  useEffect(() => {
    if (autoOpen && !isOpen) {
      setIsOpen(true);
      onAutoOpenHandled?.();
    }
  }, [autoOpen, isOpen, onAutoOpenHandled]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Send to NVIDIA AI endpoint with conversation history
      const historyForAPI = messages
        .filter(m => m.role === 'user' || m.role === 'ai')
        .slice(-6)
        .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', text: m.text || m.reply || '' }));

      // Calls POST /api/ai-chat
      const res = await bugAPI.aiChat(text, bugContext, historyForAPI);
      const d = res.data;

      setMessages(prev => [...prev, {
        role: 'ai',
        type: d.type,
        reply: d.reply,
        relatedBugs: d.relatedBugs,
        keywords: d.keywords
      }]);
    } catch (err) {
      console.error('AI Chat Error:', err);
      const errorMsg = err.response?.data?.details || err.response?.data?.error || 'Connection failed';
      setMessages(prev => [...prev, { role: 'ai', text: `⚠️ ${errorMsg}. Please try again.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const close = () => setIsOpen(false);
  const hasContext = !!bugContext?.title;

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 z-50"
          style={{ background: hasContext ? 'linear-gradient(135deg,#22c55e,#06b6d4)' : 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
          title={hasContext ? 'Ask AI about this bug' : 'Ask AI Assistant'}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col shadow-2xl rounded-2xl overflow-hidden"
          style={{ width: '380px', height: '560px', border: isDark ? '1px solid #334155' : '1px solid #e5e7eb' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ background: 'linear-gradient(135deg,#22c55e 0%,#06b6d4 50%,#6366f1 100%)' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">⚡</div>
              <div>
                <div className="text-white font-bold text-sm">BugRadar AI</div>
                <div className="text-white/70 text-[10px]">Debugging Assistant</div>
              </div>
            </div>
            <button onClick={close} className="text-white/80 hover:text-white text-xl font-bold leading-none p-1">✕</button>
          </div>

          {/* Context bar */}
          {hasContext && (
            <div className={`px-3 py-1.5 text-[10px] border-b flex items-center gap-1.5 ${isDark ? 'bg-gray-800 border-gray-700 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
              <span>📌</span>
              <span className="truncate font-semibold">Context: {bugContext.title}</span>
            </div>
          )}

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto px-3 py-3 space-y-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} isDark={isDark} onClose={close} />)}
            {isLoading && <TypingIndicator isDark={isDark} />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend}
            className={`flex items-center gap-2 px-3 py-2 border-t ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={hasContext ? 'Ask about this bug...' : 'Describe your issue...'}
              disabled={isLoading}
              className={`flex-1 px-3 py-2 rounded-xl text-sm outline-none border transition-colors ${
                isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' :
                'bg-gray-100 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-green-500'
              }`}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#22c55e,#06b6d4)' }}
            >
              ↑
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default AIChat;
