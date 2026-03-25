/**
 * BugRadar AI Engine — FREE, no paid APIs
 * ─────────────────────────────────────────
 * 1. Keyword extraction (stopword removal)
 * 2. MongoDB keyword search
 * 3. Rule-based keyword→cause/fix mapping
 * 4. Response variation (randomised ordering)
 * 5. Optional free HuggingFace inference
 */

// ── STOPWORDS ────────────────────────────────────────────────────
const STOPWORDS = new Set([
  'a','an','the','is','it','in','on','at','to','for','of','and','or',
  'but','not','this','that','with','from','by','as','was','were','be',
  'been','being','have','has','had','do','does','did','will','would',
  'shall','should','may','might','can','could','i','my','me','we','us',
  'you','your','he','she','they','them','its','his','her','our',
  'what','which','who','whom','how','when','where','why','am','are',
  'if','so','just','also','about','very','really','too','up','out',
  'all','some','any','no','get','got','getting','im','ive','dont',
  'doesnt','cant','wont','isnt','arent','wasnt','werent','help',
  'please','thank','thanks','need','want','work','working','try','tried',
]);

/**
 * Extract meaningful keywords from a user message.
 */
function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, ' ')     // strip punctuation
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w));
}

// ── KEYWORD → CAUSE/FIX MAPPING ─────────────────────────────────
// Each keyword maps to an array of { cause, fix } pairs.
// Multiple keywords can match → we combine them for a richer response.
const KEYWORD_MAP = {
  // Auth
  login:      [{ cause: 'Authentication failure — invalid credentials or missing session', fix: 'Verify email/password in the login handler; check bcrypt comparison' },
               { cause: 'Login form not submitting due to missing event handler', fix: 'Ensure `onSubmit` calls `e.preventDefault()` and fires the API call' }],
  logout:     [{ cause: 'Session/token not cleared on logout', fix: 'Clear `localStorage` and reset auth state in your logout handler' }],
  auth:       [{ cause: 'Authorization middleware rejecting the request', fix: 'Check that the JWT token is sent in the `Authorization: Bearer <token>` header' }],
  password:   [{ cause: 'Password not hashed before comparison', fix: 'Ensure `bcrypt.compare(plain, hash)` — never compare plain strings' }],
  token:      [{ cause: 'JWT token expired or malformed', fix: 'Decode with jwt.io to check `exp` claim; refresh token if needed' }],
  jwt:        [{ cause: 'JWT signing/verification key mismatch', fix: 'Ensure `JWT_SECRET` is identical on sign and verify' }],
  session:    [{ cause: 'Session lost on page reload', fix: 'Persist token in `localStorage`; rehydrate auth state on app mount' }],
  register:   [{ cause: 'Registration failing silently — duplicate email or validation error', fix: 'Log `err.message` in the catch block and check MongoDB unique index' }],
  unauthorized:[{ cause: 'Missing or expired authentication token', fix: 'Add an Axios interceptor to attach the token to every request' }],
  forbidden:  [{ cause: 'User role lacks permission for this action', fix: 'Check the `role` field in the JWT payload vs your route guard' }],
  '401':      [{ cause: 'Server returned 401 Unauthorized', fix: 'Inspect the `Authorization` header in the Network tab — is it present?' }],
  '403':      [{ cause: 'Server returned 403 Forbidden', fix: 'Verify that the logged-in user has the correct role/permissions' }],

  // UI
  button:     [{ cause: 'Click handler not attached or event not reaching the element', fix: 'Add `console.log("clicked")` inside the handler to confirm it fires' },
               { cause: 'Button disabled by a stale condition', fix: 'Check the `disabled` prop — is it tied to a state that never resets?' }],
  click:      [{ cause: 'Element is overlapped by another element absorbing clicks', fix: 'Inspect with DevTools → check z-index and pointer-events' }],
  ui:         [{ cause: 'UI not reflecting state changes', fix: 'Ensure you are using `setState` / `useState` setter—mutating directly won\'t trigger re-render' }],
  dropdown:   [{ cause: 'Dropdown closes immediately on click', fix: 'Check if a parent `onClick` handler calls `stopPropagation`' }],
  modal:      [{ cause: 'Modal not showing or dismissing', fix: 'Toggle a boolean state for visibility; check the portal/root element' }],
  render:     [{ cause: 'Component re-renders excessively', fix: 'Wrap with `React.memo` or use `useMemo` / `useCallback`' }],
  display:    [{ cause: 'Element hidden by CSS (`display:none` or `visibility:hidden`)', fix: 'Inspect Computed Styles in DevTools to find the overriding rule' }],
  layout:     [{ cause: 'Layout broken — CSS conflict or missing responsive rule', fix: 'Use DevTools responsive mode and check flex/grid items' }],
  css:        [{ cause: 'CSS specificity war — your rule is being overridden', fix: 'Inspect the element and look at the Styles panel for crossed-out rules' }],
  form:       [{ cause: 'Form data not submitted or missing fields', fix: 'Log `formData` before sending; check `name` attributes on inputs' }],
  responsive: [{ cause: 'No media query applied for this breakpoint', fix: 'Add `@media (max-width: ...)` rules for the target screen size' }],

  // API
  api:        [{ cause: 'API endpoint not found or incorrect URL', fix: 'Compare the URL in your fetch/axios call with the server routes file' },
               { cause: 'Request body format mismatch', fix: 'Log `req.body` on the server; ensure `Content-Type: application/json`' }],
  endpoint:   [{ cause: 'Route not registered in Express', fix: 'Check `router.get/post(path)` in your routes file matches the client URL' }],
  fetch:      [{ cause: 'Fetch call not awaited or response not parsed', fix: 'Use `const data = await res.json()` and wrap in try/catch' }],
  axios:      [{ cause: 'Axios base URL misconfigured', fix: 'Check `REACT_APP_API_URL` in `.env` — it must include the port' }],
  cors:       [{ cause: 'CORS policy blocking the request', fix: 'Add `app.use(cors({ origin: "http://localhost:3000" }))` on the server' }],
  '404':      [{ cause: 'Server returned 404 — route doesn\'t exist', fix: 'Double-check the URL path and HTTP method (GET vs POST)' }],
  '500':      [{ cause: 'Server crashed with an unhandled error', fix: 'Check the server terminal for the error stack trace' }],
  network:    [{ cause: 'Network request failed — server may be down', fix: 'Verify the server is running (`npm run dev`) and accessible on the correct port' }],
  timeout:    [{ cause: 'Request timed out — server took too long to respond', fix: 'Check for slow DB queries or infinite loops in the handler' }],

  // Performance
  slow:       [{ cause: 'Expensive computation on every render', fix: 'Profile with DevTools Performance tab; move heavy work into `useMemo`' }],
  performance:[{ cause: 'Too many DOM nodes or excessive re-renders', fix: 'Virtualize long lists with `react-window`; use React Profiler' }],
  lag:        [{ cause: 'Main thread blocked by synchronous work', fix: 'Move heavy operations to a Web Worker or break into microtasks' }],
  memory:     [{ cause: 'Memory leak — event listener or subscription not cleaned up', fix: 'Return a cleanup function from `useEffect` to remove listeners' }],
  freeze:     [{ cause: 'Infinite loop or recursive call without base case', fix: 'Add breakpoints and step through the suspected function' }],

  // Database
  database:   [{ cause: 'Database connection not established', fix: 'Check `mongoose.connection.readyState` — should be 1 (connected)' }],
  mongo:      [{ cause: 'MongoDB query returning empty results', fix: 'Test the same query in MongoDB Compass or `mongosh` directly' }],
  query:      [{ cause: 'Query filter doesn\'t match any documents', fix: 'Log the filter object and verify field names match your schema' }],
  schema:     [{ cause: 'Mongoose schema validation error', fix: 'Check required fields, enums, and type definitions in your schema' }],
  save:       [{ cause: 'Document save failing — validation or duplicate key', fix: 'Wrap in try/catch and log `err.errors` for Mongoose validation details' }],

  // Runtime
  crash:      [{ cause: 'Uncaught exception crashing the process', fix: 'Add global error handler: `process.on("uncaughtException", ...)`' }],
  error:      [{ cause: 'Unhandled error in async code', fix: 'Wrap in try/catch and log the full error object' }],
  null:       [{ cause: 'Accessing property on null or undefined value', fix: 'Use optional chaining: `obj?.prop?.nested`' }],
  undefined:  [{ cause: 'Variable not initialised before use', fix: 'Add a console.log before the failing line to check the value' }],
  'cannot':   [{ cause: '"Cannot read properties of undefined" — upstream data missing', fix: 'Add a guard: `if (!data) return null;` before accessing properties' }],

  // Build / deps
  install:    [{ cause: 'npm install failing — version conflict', fix: 'Try `npm install --legacy-peer-deps` or delete `node_modules` first' }],
  npm:        [{ cause: 'npm registry unreachable or package doesn\'t exist', fix: 'Check npm status page; verify the exact package name' }],
  build:      [{ cause: 'Build fails — syntax error or missing dependency', fix: 'Read the FIRST error in the build output (often a missing import)' }],
  compile:    [{ cause: 'Compilation error in source code', fix: 'Fix the file and line mentioned in the error output' }],
  import:     [{ cause: 'Module not found — wrong path or missing package', fix: 'Check the import path is correct (case-sensitive on Linux!)' }],
  webpack:    [{ cause: 'Webpack config issue — loader not found', fix: 'Ensure required loaders (babel-loader, css-loader) are installed' }],

  // Mobile
  mobile:     [{ cause: 'Touch events differ from mouse events', fix: 'Test `touchstart` / `touchend` instead of `click` on mobile' },
               { cause: 'Viewport meta tag missing', fix: 'Add `<meta name="viewport" content="width=device-width, initial-scale=1">`' }],
  ios:        [{ cause: 'iOS Safari-specific rendering or event issue', fix: 'Test in Safari — add `-webkit-` prefixes for affected CSS' }],
  android:    [{ cause: 'Android WebView compatibility issue', fix: 'Check Chrome for Android DevTools via USB debugging' }],
  safari:     [{ cause: 'Safari doesn\'t support some modern APIs', fix: 'Check caniuse.com for the feature; add a polyfill if needed' }],
  touch:      [{ cause: 'Touch event not firing properly', fix: 'Use `touchstart`/`touchend` and prevent ghost click with a delay' }],
};

/**
 * Build causes/fixes from extracted keywords using the KEYWORD_MAP.
 * Deduplicates and randomises order for response variation.
 */
function buildAdviceFromKeywords(keywords) {
  const causesSet = new Set();
  const fixesSet = new Set();
  const causesArr = [];
  const fixesArr = [];

  for (const kw of keywords) {
    const entries = KEYWORD_MAP[kw];
    if (!entries) continue;
    for (const e of entries) {
      if (!causesSet.has(e.cause)) { causesSet.add(e.cause); causesArr.push(e.cause); }
      if (!fixesSet.has(e.fix))    { fixesSet.add(e.fix);    fixesArr.push(e.fix); }
    }
  }

  // Shuffle for variation when same keywords are sent repeatedly
  const shuffle = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  return {
    causes: shuffle(causesArr).slice(0, 4),
    fixes:  shuffle(fixesArr).slice(0, 4),
  };
}

/**
 * Search bugs by keywords using MongoDB regex (no text index required).
 * Sorts by score (votes) desc, then createdAt desc. Returns top N.
 */
async function searchBugsByKeywords(Bug, keywords, limit = 3) {
  if (keywords.length === 0) return [];

  const regexParts = keywords.slice(0, 6).map(k => new RegExp(k, 'i'));
  const orClauses = [];
  for (const rx of regexParts) {
    orClauses.push({ title: rx });
    orClauses.push({ description: rx });
    orClauses.push({ tags: rx });
  }

  const results = await Bug.find({
    visibility: 'public',
    $or: orClauses,
  })
    .select('title description tags severity status score isSolved createdAt')
    .sort({ score: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return results;
}

/**
 * Pick a varied follow-up question based on keywords.
 */
function pickFollowUp(keywords) {
  const pool = [
    'Can you share the exact error message from the console?',
    'What browser / device are you using?',
    'Does this happen every time, or only sometimes?',
    'When did this start — after a recent code change?',
    'Are there any related errors in the server terminal?',
    'Does the issue happen in incognito/private browsing too?',
    'Can you reproduce this with a fresh login?',
    'What steps trigger the issue?',
  ];

  // Add keyword-specific follow-ups
  if (keywords.some(k => ['login','auth','password','token'].includes(k)))
    pool.push('Are you seeing a 401 or 403 status code?', 'Is the token stored in localStorage after login?');
  if (keywords.some(k => ['api','fetch','axios','cors','network'].includes(k)))
    pool.push('What HTTP status code does the request return?', 'Can you try the same request in Postman or curl?');
  if (keywords.some(k => ['mobile','ios','android','safari','touch'].includes(k)))
    pool.push('Which device/OS version are you testing on?', 'Does it work on desktop browsers?');
  if (keywords.some(k => ['null','undefined','error','crash'].includes(k)))
    pool.push('Can you paste the full stack trace?', 'Which file/line does the error point to?');

  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Optional: Call free HuggingFace Inference API (google/flan-t5-small).
 * Only used when no DB results and no keyword matches. Timeout: 5s.
 */
async function tryHuggingFace(query) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-small', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: `The user has a software bug: "${query}". Give 3 short debugging suggestions.` }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = await res.json();
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text;
    }
    return null;
  } catch {
    return null; // silently fail — HuggingFace is optional
  }
}

module.exports = {
  extractKeywords,
  buildAdviceFromKeywords,
  searchBugsByKeywords,
  pickFollowUp,
  tryHuggingFace,
  KEYWORD_MAP,
};
