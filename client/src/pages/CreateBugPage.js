import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bugAPI } from '../utils/api';
import '../App.css';

// ─── Tooltip component ───────────────────────────────────────────────────────
function InfoTooltip({ text }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-block ml-1.5 align-middle">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Help"
        style={{ lineHeight: 1 }}
      >
        i
      </button>
      {visible && (
        <div
          className="absolute left-6 top-0 z-50 w-56 px-3 py-2 rounded-lg text-xs leading-snug shadow-lg pointer-events-none"
          style={{
            background: 'linear-gradient(135deg,#1e3a5f,#1e40af)',
            color: '#e0f2fe',
            minWidth: '200px',
          }}
        >
          <div className="absolute -left-1.5 top-2 w-3 h-3 rotate-45"
            style={{ background: '#1e3a5f' }} />
          {text}
        </div>
      )}
    </span>
  );
}

// ─── Field label with tooltip ─────────────────────────────────────────────────
function FieldLabel({ label, required, tip, isDark }) {
  return (
    <label className="form-label flex items-center" style={{ color: isDark ? '#f3f4f6' : undefined }}>
      {label} {required && <span className="text-red-500 ml-0.5">*</span>}
      <InfoTooltip text={tip} />
    </label>
  );
}

// ─── Collapsible example box ──────────────────────────────────────────────────
function ExampleBox({ isDark }) {
  const [open, setOpen] = useState(false);
  const bg = isDark ? '#0f172a' : '#eff6ff';
  const border = isDark ? '#1e3a5f' : '#bfdbfe';
  const text = isDark ? '#93c5fd' : '#1d4ed8';
  const muted = isDark ? '#94a3b8' : '#4b5563';
  const codeBg = isDark ? '#1e293b' : '#dbeafe';

  return (
    <div className="mb-6 rounded-xl overflow-hidden border" style={{ background: bg, borderColor: border }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 font-semibold text-sm transition-colors hover:opacity-90 focus:outline-none"
        style={{ color: text }}
      >
        <span className="flex items-center gap-2">
          <span>💡</span>
          <span>How to write a good bug report</span>
          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: border, color: text }}>
            Example
          </span>
        </span>
        <span className="text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4" style={{ color: muted, fontSize: '13px' }}>
          <div className="border-t pt-4" style={{ borderColor: border }}>

            {/* Title example */}
            <div className="mb-3">
              <p className="font-semibold mb-1" style={{ color: text }}>📌 Good Title</p>
              <div className="rounded-lg px-3 py-2 font-mono text-xs" style={{ background: codeBg, color: muted }}>
                "Login button doesn't respond on iPhone Safari"
              </div>
              <p className="text-xs mt-1">❌ Avoid: <span className="italic">"Bug in login"</span> — too vague</p>
            </div>

            {/* Description example */}
            <div className="mb-3">
              <p className="font-semibold mb-1" style={{ color: text }}>📝 Good Description</p>
              <div className="rounded-lg px-3 py-2 font-mono text-xs leading-relaxed" style={{ background: codeBg, color: muted }}>
                "When I tap the Login button on my iPhone (iOS 17, Safari),
                nothing happens. The page doesn't navigate and no error appears.
                It works fine on desktop Chrome."
              </div>
            </div>

            {/* Steps example */}
            <div>
              <p className="font-semibold mb-1" style={{ color: text }}>🔢 Steps to Reproduce</p>
              <div className="rounded-lg px-3 py-2 font-mono text-xs leading-relaxed space-y-0.5" style={{ background: codeBg, color: muted }}>
                <p>1. Open the app on iPhone Safari</p>
                <p>2. Enter valid email and password</p>
                <p>3. Tap the "Login" button</p>
                <p className="text-yellow-500 font-semibold">→ Expected: Navigate to dashboard</p>
                <p className="text-red-400 font-semibold">→ Actual: Nothing happens</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Severity info ────────────────────────────────────────────────────────────
const SEVERITY_INFO = {
  low: { emoji: '🟢', label: 'Low', desc: 'Minor issue, cosmetic or non-blocking' },
  medium: { emoji: '🟡', label: 'Medium', desc: 'Affects functionality but has a workaround' },
  high: { emoji: '🟠', label: 'High', desc: 'Major impact, no easy workaround' },
  critical: { emoji: '🔴', label: 'Critical', desc: 'App crash, data loss, or security issue' },
};

// ─── Main component ───────────────────────────────────────────────────────────
function CreateBugPage({ isDark = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyzingDraft, setAnalyzingDraft] = useState(false);
  const [message, setMessage] = useState(null);
  const [similarBugs, setSimilarBugs] = useState([]);
  const [draftSuggestions, setDraftSuggestions] = useState([]);
  const [aiSuggestedTags, setAiSuggestedTags] = useState([]);
  const [aiSuggestedFixes, setAiSuggestedFixes] = useState([]);
  const [possibleDuplicates, setPossibleDuplicates] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stepsToReproduce: [''],
    severity: 'medium',
    tags: '',
    createdBy: '',
    visibility: 'public',
  });

  const inputStyle = {
    backgroundColor: isDark ? '#111827' : '#ffffff',
    color: isDark ? '#f3f4f6' : '#111827',
    borderColor: isDark ? '#374151' : '#d1d5db',
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStepChange = (index, value) => {
    const newSteps = [...formData.stepsToReproduce];
    newSteps[index] = value;
    setFormData(prev => ({ ...prev, stepsToReproduce: newSteps }));
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      stepsToReproduce: [...prev.stepsToReproduce, ''],
    }));
  };

  const removeStep = (index) => {
    setFormData(prev => ({
      ...prev,
      stepsToReproduce: prev.stepsToReproduce.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      setMessage({ type: 'error', text: 'Title and description are required' });
      return;
    }

    try {
      setLoading(true);
      const bugData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        stepsToReproduce: formData.stepsToReproduce.filter(step => step.trim()),
      };

      const response = await bugAPI.createBug(bugData);
      setSimilarBugs(response.data.similarBugs || []);
      setAiSuggestedFixes(response.data?.aiAssistance?.possibleFixes || []);
      setMessage({ type: 'success', text: '✅ Bug reported successfully! Redirecting...' });

      setFormData({
        title: '', description: '', stepsToReproduce: [''],
        severity: 'medium', tags: '', createdBy: '', visibility: 'public',
      });

      setTimeout(() => navigate(`/bugs/${response.data.bug._id}`), 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  const sev = SEVERITY_INFO[formData.severity];
  const parsedTags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);

  useEffect(() => {
    const title = formData.title.trim();
    const description = formData.description.trim();
    if (!title && !description) {
      setDraftSuggestions([]);
      setAiSuggestedTags([]);
      setAiSuggestedFixes([]);
      setPossibleDuplicates([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setAnalyzingDraft(true);
        const response = await bugAPI.suggestBugImprovements(title, description, parsedTags);
        setDraftSuggestions(response.data?.suggestions || []);
        setAiSuggestedTags(response.data?.suggestedTags || []);
        setAiSuggestedFixes(response.data?.possibleFixes || []);
        setPossibleDuplicates(response.data?.possibleDuplicates || []);
      } catch (error) {
        // Keep UX resilient when AI analysis endpoint fails.
      } finally {
        setAnalyzingDraft(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.title, formData.description, formData.tags]);

  const addSuggestedTag = (tag) => {
    if (parsedTags.includes(tag)) return;
    const nextTags = [...parsedTags, tag];
    setFormData((prev) => ({ ...prev, tags: nextTags.join(', ') }));
  };

  return (
    <div className="container max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="section-title" style={{ color: isDark ? '#f3f4f6' : undefined }}>
          📝 Report a Bug
        </h1>
        <p className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
          Help the community by describing your issue clearly. The more detail, the faster it gets resolved.
        </p>
      </div>

      <div className="grid-2 gap-8">
        {/* ── Left: Form ── */}
        <div className="card p-6" style={{ backgroundColor: isDark ? '#1f2937' : undefined, border: isDark ? '1px solid #374151' : undefined }}>

          {/* Example Box */}
          <ExampleBox isDark={isDark} />

          <form onSubmit={handleSubmit} className="space-y-5">
            {message && (
              <div className={message.type === 'success' ? 'success' : 'error'}>
                {message.text}
              </div>
            )}

            {/* Title */}
            <div className="form-group">
              <FieldLabel
                label="Bug Title"
                required
                isDark={isDark}
                tip="Write a short, specific summary of the issue. Mention where it happens. Example: 'Crash on checkout page when cart is empty'"
              />
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="E.g., Login button not responding on mobile Safari"
                className="form-input"
                style={inputStyle}
                required
              />
              {formData.title.length > 0 && formData.title.length < 10 && (
                <p className="text-xs mt-1 text-yellow-500">⚠️ Title seems short — try to be more descriptive.</p>
              )}
            </div>

            {/* Description */}
            <div className="form-group">
              <FieldLabel
                label="Description"
                required
                isDark={isDark}
                tip="Explain what is happening, what you expected to happen, and any error messages you saw. Include browser or OS if relevant."
              />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the bug in detail — what happened, what you expected, any error messages..."
                className="form-textarea"
                style={{ ...inputStyle, minHeight: '110px' }}
                required
              />
              <p className="text-xs mt-1" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
                {formData.description.length} characters — aim for at least 50 for a useful report.
              </p>
            </div>

            {/* Steps to Reproduce */}
            <div className="form-group">
              <FieldLabel
                label="Steps to Reproduce"
                isDark={isDark}
                tip="List the exact steps someone else needs to follow to see this bug. Be numbered and specific — this is the most important part!"
              />
              <p className="text-xs mb-2" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                Add each step separately. Example: "1. Open app", "2. Click login", "3. Error appears"
              </p>
              {formData.stepsToReproduce.map((step, index) => (
                <div key={index} className="flex gap-2 mb-2 items-center">
                  <span className="text-xs font-bold w-5 shrink-0 text-center" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => handleStepChange(index, e.target.value)}
                    placeholder={
                      index === 0 ? 'E.g., Open the app on mobile' :
                        index === 1 ? 'E.g., Tap the Login button' :
                          index === 2 ? 'E.g., Observe the error message' :
                            `Step ${index + 1}`
                    }
                    className="form-input flex-1"
                    style={inputStyle}
                  />
                  {formData.stepsToReproduce.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="btn-danger btn-base shrink-0 text-xs px-2 py-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addStep}
                className="btn-secondary btn-base mt-1 text-sm"
              >
                ➕ Add Step
              </button>
            </div>

            {/* Severity */}
            <div className="form-group">
              <FieldLabel
                label="Severity Level"
                isDark={isDark}
                tip="How badly does this affect users? Critical = app breaks or data lost. Low = minor cosmetic glitch."
              />
              <select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                className="form-input"
                style={inputStyle}
              >
                {Object.entries(SEVERITY_INFO).map(([val, info]) => (
                  <option key={val} value={val}>{info.emoji} {info.label}</option>
                ))}
              </select>
              {sev && (
                <p className="text-xs mt-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  {sev.emoji} <strong>{sev.label}:</strong> {sev.desc}
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="form-group">
              <FieldLabel
                label="Tags"
                isDark={isDark}
                tip="Add comma-separated keywords to help others find this bug. Examples: ui, mobile, login, performance"
              />
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="E.g., ui, mobile, login"
                className="form-input"
                style={inputStyle}
              />
              {formData.tags && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.tags.split(',').map(t => t.trim()).filter(Boolean).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: isDark ? '#1e3a5f' : '#dbeafe', color: isDark ? '#93c5fd' : '#1d4ed8' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Visibility */}
            <div className="form-group">
              <FieldLabel
                label="Visibility"
                isDark={isDark}
                tip="Public bugs are visible to all users and can receive community help. Private bugs are only visible to you."
              />
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                {[
                  { val: 'public', label: '🌍 Public', sub: 'Community can help' },
                  { val: 'private', label: '🔒 Private', sub: 'Only you' }
                ].map(opt => (
                  <label key={opt.val} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value={opt.val}
                      checked={formData.visibility === opt.val}
                      onChange={handleInputChange}
                      className="mt-0.5 cursor-pointer"
                    />
                    <span>
                      <span className="text-sm font-medium" style={{ color: isDark ? '#f3f4f6' : '#111827' }}>{opt.label}</span>
                      <br />
                      <span className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{opt.sub}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-base w-full justify-center text-base font-bold py-3"
            >
              {loading ? '⏳ Submitting...' : '🚀 Submit Bug Report'}
            </button>
          </form>
        </div>

        {/* ── Right: Tips + Similar Bugs ── */}
        <div className="space-y-4">
          <div className="card p-5" style={{ backgroundColor: isDark ? '#1f2937' : undefined, border: isDark ? '1px solid #374151' : undefined }}>
            <h2 className="font-bold text-base mb-3" style={{ color: isDark ? '#f3f4f6' : '#111827' }}>
              🤖 AI Draft Assistant {analyzingDraft ? '• analyzing...' : ''}
            </h2>
            {draftSuggestions.length === 0 && aiSuggestedTags.length === 0 && aiSuggestedFixes.length === 0 && possibleDuplicates.length === 0 ? (
              <p className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                Start typing title/description to get live quality checks, tag suggestions, likely fixes, and duplicate detection.
              </p>
            ) : (
              <div className="space-y-4 text-sm">
                {draftSuggestions.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2" style={{ color: isDark ? '#f3f4f6' : '#111827' }}>Improve your report</p>
                    <ul className="space-y-1" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                      {draftSuggestions.map((item, idx) => <li key={`${item.type}-${idx}`}>- {item.text}</li>)}
                    </ul>
                  </div>
                )}
                {aiSuggestedTags.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2" style={{ color: isDark ? '#f3f4f6' : '#111827' }}>Suggested tags</p>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestedTags.map((tag) => (
                        <button key={tag} type="button" onClick={() => addSuggestedTag(tag)} className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{ background: isDark ? '#1e3a5f' : '#dbeafe', color: isDark ? '#93c5fd' : '#1d4ed8' }}>
                          + #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {aiSuggestedFixes.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2" style={{ color: isDark ? '#f3f4f6' : '#111827' }}>Possible fixes</p>
                    <ul className="space-y-1" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                      {aiSuggestedFixes.map((fix, idx) => <li key={`fix-${idx}`}>- {fix}</li>)}
                    </ul>
                  </div>
                )}
                {possibleDuplicates.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2" style={{ color: isDark ? '#f3f4f6' : '#111827' }}>Possible duplicates</p>
                    <div className="space-y-2">
                      {possibleDuplicates.map((dup) => (
                        <div key={dup.id} className="rounded-lg px-3 py-2" style={{ borderLeft: '4px solid #f59e0b', background: isDark ? '#111827' : '#fffbeb' }}>
                          <p style={{ color: isDark ? '#f3f4f6' : '#111827', fontWeight: 600 }}>{dup.title}</p>
                          <p style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '12px' }}>{dup.similarity}% similar</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Severity guide card */}
          <div className="card p-5" style={{ backgroundColor: isDark ? '#1f2937' : undefined, border: isDark ? '1px solid #374151' : undefined }}>
            <h2 className="font-bold text-base mb-3" style={{ color: isDark ? '#f3f4f6' : '#111827' }}>
              🎯 Severity Guide
            </h2>
            <div className="space-y-2">
              {Object.entries(SEVERITY_INFO).map(([, info]) => (
                <div key={info.label} className="flex items-start gap-2 text-sm">
                  <span>{info.emoji}</span>
                  <div>
                    <span className="font-semibold" style={{ color: isDark ? '#f3f4f6' : '#111827' }}>{info.label}:</span>
                    <span className="ml-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{info.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Similar bugs after submit */}
          {similarBugs.length > 0 && (
            <div className="card p-5" style={{ backgroundColor: isDark ? '#1f2937' : undefined, border: isDark ? '1px solid #374151' : undefined }}>
              <h2 className="font-bold text-base mb-3" style={{ color: isDark ? '#f3f4f6' : '#111827' }}>
                🔍 Similar Bugs Found
              </h2>
              <p className="text-xs mb-3" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                These existing reports might describe the same issue:
              </p>
              <div className="space-y-2">
                {similarBugs.map(bug => (
                  <div key={bug.bugId} className="rounded-lg px-3 py-2" style={{ borderLeft: '4px solid #f59e0b', background: isDark ? '#111827' : '#fffbeb' }}>
                    <div className="font-semibold text-sm" style={{ color: isDark ? '#f3f4f6' : '#111827' }}>{bug.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                      {(bug.similarity * 100).toFixed(0)}% similar
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateBugPage;
