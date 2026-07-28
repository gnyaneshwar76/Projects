# TraceStack - Developer Guide

## For Contributors & Maintainers

This guide covers development workflow, code standards, and extension points for TraceStack.

---

## 📂 Project Organization

### Backend Standards

**Controllers** (`src/controllers/`)
- Business logic isolated here
- Each endpoint function handles one responsibility
- Input validation before processing

```javascript
// Example: bugController.js
async function createBug(req, res) {
  // 1. Validate input
  // 2. Create document
  // 3. Perform analysis (similarity)
  // 4. Return response
}
```

**Routes** (`src/routes/`)
- Clean route definitions
- Specific routes before generic parameters
- RESTful naming conventions

```javascript
// Correct order (specific → generic)
router.get('/search', controller.search)         // /api/bugs/search
router.get('/stats/dashboard', controller.stats) // /api/bugs/stats/dashboard
router.get('/:bugId/similar', controller.similar)// /api/bugs/:bugId/similar
router.get('/:bugId', controller.getById)        // /api/bugs/:bugId
```

**Models** (`src/models/`)
- Schema definitions with validation
- Indexes for performance
- Document structure documentation

```javascript
const bugSchema = new Schema({
  title: { type: String, required: true },
  // ...
})

// Add indexes
bugSchema.index({ title: 'text', description: 'text' })
```

**Utils** (`src/utils/`)
- Pure functions - no side effects
- Well-documented algorithms
- Unit testable

```javascript
// Good: Pure function, easy to test
export function cosineSimilarity(vec1, vec2) {
  // ...
  return similarity
}

// Bad: Side effects, hard to test
function cosineSimilarity(vec1, vec2) {
  db.update(...)
  res.send(...)
}
```

### Frontend Standards

**Pages** (`src/pages/`)
- One page component per file
- Handle data fetching with useEffect
- Manage route-specific state

```javascript
function BugListPage() {
  const [bugs, setBugs] = useState([])
  const [filters, setFilters] = useState({})

  useEffect(() => {
    fetchBugs()
  }, [filters])

  return (...)
}
```

**Components** (`src/components/` - expandable)
- Reusable UI components
- Props for configuration
- No side effects except in hooks

```javascript
function BugCard({ bug, onSelect }) {
  return (
    <div onClick={() => onSelect(bug._id)}>
      {/* Render bug */}
    </div>
  )
}
```

**Utils** (`src/utils/api.js`)
- API wrapper with axios
- Centralized configuration
- Error handling consistency

---

## 🔄 Code Style Guide

### JavaScript/Node.js

**Naming Conventions:**
```javascript
// Functions: camelCase, descriptive
const calculateSimilarity = (vec1, vec2) => {}
const findSimilarBugs = (bugId) => {}

// Classes/Constructors: PascalCase
class BugModel {}
const Bug = require('./models/Bug')

// Constants: UPPER_SNAKE_CASE
const MAX_ITERATIONS = 20
const STOP_WORDS = new Set([...])

// Private variables: _leadingUnderscore
const _internalState = {}
```

**Arrow Functions vs Function Declarations:**
```javascript
// Prefer arrow functions for callbacks
bugs.forEach(bug => process(bug))

// Prefer declarations for async operations
async function fetchBugs() {
  return await Bug.find()
}
```

**Comments:**
```javascript
// Good: Explains WHY, not WHAT
// We limit to top 3 to avoid overwhelming users
const TOP_SIMILAR_BUGS = 3

// Bad: Obvious from code
// Loop through bugs
bugs.forEach(bug => {})

/* Good: Document complex algorithms */
/**
 * K-means clustering algorithm
 * @param {Array} vectors - Feature vectors
 * @param {number} k - Number of clusters
 * @returns {Object} Cluster assignments
 */
function kMeansClustering(vectors, k) {}
```

### React

**Component Structure:**
```javascript
function MyComponent({ prop1, prop2 }) {
  // 1. State declarations
  const [state, setState] = useState()

  // 2. Effects
  useEffect(() => {
    // ...
  }, []) // Dependencies

  // 3. Event handlers
  const handleClick = () => {}

  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

**Props Drilling Prevention:**
```javascript
// Prefer prop drilling for small projects
// For larger projects, consider Context API
const BugContext = createContext()

// Usage
<BugContext.Provider value={bugs}>
  <BugList />
</BugContext.Provider>
```

---

## 🧪 Testing Standards

### Backend Testing

```javascript
// test/similarity.test.js
const { cosineSimilarity } = require('../src/utils/similarity')

describe('TF-IDF Similarity', () => {
  test('identical vectors have similarity 1.0', () => {
    const v1 = { 'word': 1 }
    const v2 = { 'word': 1 }
    expect(cosineSimilarity(v1, v2)).toBe(1.0)
  })

  test('perpendicular vectors have similarity 0', () => {
    const v1 = { 'word1': 1 }
    const v2 = { 'word2': 1 }
    expect(cosineSimilarity(v1, v2)).toBe(0)
  })
})
```

### Frontend Testing

```javascript
// test/BugList.test.js
import { render, screen } from '@testing-library/react'
import BugListPage from '../pages/BugListPage'

describe('BugListPage', () => {
  test('displays bugs', async () => {
    render(<BugListPage />)
    await waitFor(() => {
      expect(screen.getByText(/bug title/i)).toBeInTheDocument()
    })
  })
})
```

---

## 🚀 Adding New Features

### Example: Add User Authentication

**Step 1: Backend Setup**
```javascript
// models/User.js
const userSchema = new Schema({
  email: String,
  password: String, // hashed
  role: String,
})

// controllers/authController.js
async function login(req, res) {
  // Validate credentials
  // Generate JWT
  // Return token
}

// routes/authRoutes.js
router.post('/login', authController.login)
```

**Step 2: Middleware**
```javascript
// middleware/auth.js
function requireAuth(req, res, next) {
  const token = req.headers.authorization
  if (!token) return res.status(401).json({ error: 'No token' })
  // Verify token
  next()
}

// Index.js - Use middleware
app.use('/api/bugs', requireAuth, bugRoutes)
```

**Step 3: Frontend Update**
```javascript
// utils/api.js
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// pages/LoginPage.js - New component
function LoginPage() {
  const [email, setEmail] = useState('')
  const handleLogin = async () => {
    const { token } = await api.post('/login', { email })
    localStorage.setItem('token', token)
  }
  return (...)
}
```

---

## 📊 Performance Optimization

### Backend Optimization

**1. Caching**
```javascript
// Add Redis for frequently accessed data
const redis = require('redis')
const client = redis.createClient()

// Cache dashboard stats
async function getDashboardStats(req, res) {
  const cached = await client.get('dashboard-stats')
  if (cached) return res.json(JSON.parse(cached))

  const stats = await calculateStats()
  await client.setEx('dashboard-stats', 3600, JSON.stringify(stats))
  res.json(stats)
}
```

**2. Query Optimization**
```javascript
// Add indexes
db.bugs.createIndex({ status: 1, severity: 1, createdAt: -1 })

// Use projection to fetch only needed fields
Bug.find({}, 'title severity status') // Don't fetch full description
```

**3. Pagination**
```javascript
async function getAllBugs(req, res) {
  const { page = 1, limit = 20 } = req.query
  const skip = (page - 1) * limit

  const bugs = await Bug.find()
    .skip(skip)
    .limit(limit)

  res.json({ bugs, total, page, pages: Math.ceil(total/limit) })
}
```

### Frontend Optimization

**1. Code Splitting**
```javascript
import { lazy, Suspense } from 'react'

const BugListPage = lazy(() => import('./pages/BugListPage'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BugListPage />
    </Suspense>
  )
}
```

**2. Memoization**
```javascript
const BugCard = memo(function BugCard({ bug, onSelect }) {
  return (...)
}, (prevProps, nextProps) => {
  // Only re-render if bug._id changes
  return prevProps.bug._id === nextProps.bug._id
})
```

---

## 🐛 Debugging Tips

### Backend Debugging

```bash
# Start with inspector
node --inspect src/index.js

# Open chrome://inspect in Chrome
# Set breakpoints and debug
```

### Frontend Debugging

```javascript
// Use React DevTools extension
// Check network requests (Network tab)
// Console errors and warnings

// Add debug logs
console.log('Bug data:', bug)
console.warn('Missing field:', field)
```

---

## 📝 Commit Message Standards

```bash
# Format: type(scope): subject
# Types: feat, fix, refactor, docs, test, style

git commit -m "feat(similarity): improve TF-IDF performance"
git commit -m "fix(clustering): handle empty clusters"
git commit -m "docs(api): add pagination examples"
```

---

## 🔒 Security Checklist

Before deploying:
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] HTTPS enabled
- [ ] MongoDB auth configured
- [ ] JWT secrets are strong
- [ ] No sensitive data in logs
- [ ] CORS properly configured
- [ ] SQL injection prevented
- [ ] XSS protection in place
- [ ] Error messages are generic

---

## 📦 Dependency Management

### Backend Dependencies Review

```javascript
// package.json - Keep minimal
{
  "express": "latest",          // Framework
  "mongoose": "latest",         // MongoDB ODM
  "natural": "latest",          // Text processing
  "ml": "latest",               // Clustering (optional)
  "dotenv": "latest"            // Config
}
```

**Update Process:**
```bash
npm outdated              # Check for updates
npm update               # Update within semver
npm audit                # Check for vulnerabilities
npm audit fix            # Fix security issues
```

---

## 🚢 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Secrets not in code
- [ ] Build output optimized
- [ ] Documentation updated

### Deployment Steps

```bash
# 1. Create production build
npm run build

# 2. Set environment variables
export MONGO_URI=...
export NODE_ENV=production

# 3. Run database migrations (if any)
npm run migrate

# 4. Start server
npm start

# 5. Verify health checks
curl https://api.tracestack.com/health
```

---

## 🤝 Contributing Guidelines

### Getting Started
1. Fork repository
2. Create feature branch: `git checkout -b feature/description`
3. Make changes and test locally
4. Commit with descriptive messages
5. Push to fork
6. Create pull request

### PR Review Checklist
- [ ] Code follows standards
- [ ] Changes are tested
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Commit messages clear

---

## 📚 Learning Resources

### For Algorithms
- [Natural Language Processing](https://nlp.stanford.edu/)
- [Machine Learning Basics](https://www.coursera.org/learn/machine-learning)
- [Data Structures](https://www.geeksforgeeks.org/data-structures/)

### For Web Development
- [Full Stack Development](https://fullstackopen.com/)
- [React Deep Dive](https://epicreact.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 🎯 Maintenance Schedule

**Daily:**
- Monitor error logs
- Check API health
- Review user feedback

**Weekly:**
- Update dependencies (security patches)
- Review analytics
- Check database performance

**Monthly:**
- Full security audit
- Performance optimization
- User feedback analysis
- Release planning

**Quarterly:**
- Feature planning
- Architecture review
- Technology evaluation

---

## 📞 Getting Help

- Check inline code comments
- Review architecture in [ARCHITECTURE.md](ARCHITECTURE.md)
- Look at test examples
- Review commit history for context

---

**Happy developing! 🚀**
