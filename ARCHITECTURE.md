# TraceStack - Architecture & System Design

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│                    (React + Tailwind CSS)                       │
├──────────────────────────────────────────────────────────────────┤
│  Dashboard │ Bug List │ Create Bug │ Bug Detail │ Clustering    │
└────────────────────────────────────────────────────────────────┬─┘
                       HTTP/REST API
                     (Port 3000 -> 5000)
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER LAYER                               │
│                (Node.js ExpressJS API)                          │
├──────────────────────────────────────────────────────────────────┤
│  Routes │ Controllers │ Business Logic │ Utilities              │
├──────────────────────────────────────────────────────────────────┤
│           TF-IDF Similarity │ K-means Clustering                │
└──────────────────────────────────────────────────────────────────┤
                         Database Driver
                      (MongoDB Mongoose)
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                   │
│                      MongoDB                                    │
├──────────────────────────────────────────────────────────────────┤
│  Bugs Collection │ Indexes │ Text Search                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Architecture

### Client Architecture (React)

```
src/
├── pages/                 # Route-specific components
│   ├── Dashboard.js       # Main dashboard (stats & overview)
│   ├── BugListPage.js     # Bug list with filters
│   ├── CreateBugPage.js   # Bug creation form
│   ├── BugDetailPage.js   # Single bug view & edit
│   └── ClusterAnalysisPage.js  # Clustering visualization
│
├── components/            # Reusable components (future)
│   ├── BugCard.js
│   ├── BugForm.js
│   └── FilterBar.js
│
├── utils/
│   └── api.js             # API client wrapper
│
├── App.js                 # Main app component (routing)
├── App.css                # Global styles
├── index.js               # React entry point
└── index.css              # Tailwind CSS imports
```

**Component Hierarchy:**
```
App
├── Navigation
└── Router
    ├── Dashboard
    ├── BugListPage
    ├── CreateBugPage
    ├── BugDetailPage
    └── ClusterAnalysisPage
```

---

### Server Architecture (Express.js)

```
server/
├── src/
│   ├── index.js                    # Express app setup & MongoDB connection
│   │
│   ├── routes/
│   │   └── bugRoutes.js            # API route definitions
│   │       • POST   /bugs           (create)
│   │       • GET    /bugs           (list)
│   │       • GET    /bugs/:id       (detail)
│   │       • PUT    /bugs/:id       (update)
│   │       • DELETE /bugs/:id       (delete)
│   │       • GET    /bugs/:id/similar      (similarity)
│   │       • GET    /bugs/analysis/cluster (clustering)
│   │
│   ├── controllers/
│   │   └── bugController.js        # Business logic for each route
│   │       • createBug()           (create + similarity detection)
│   │       • getAllBugs()          (retrieve + filters)
│   │       • getBugById()          (retrieve single)
│   │       • updateBug()           (update)
│   │       • deleteBug()           (delete)
│   │       • findSimilar()         (TF-IDF similarity)
│   │       • analyzeWithClustering() (K-means)
│   │       • getDashboardStats()   (aggregation)
│   │       • searchBugs()          (text search)
│   │
│   ├── models/
│   │   └── Bug.js                  # MongoDB schema
│   │       • title, description
│   │       • severity, status
│   │       • tags, stepsToReproduce
│   │       • vectorEmbedding
│   │       • relatedBugs
│   │       • rootCauseSuggestion
│   │       • clusterLabel
│   │
│   └── utils/
│       ├── similarity.js           # TF-IDF & Cosine Similarity
│       │   • preprocessText()      (tokenization & cleaning)
│       │   • calculateTF()         (term frequency)
│       │   • calculateIDF()        (inverse document frequency)
│       │   • textToVector()        (TF-IDF vectorization)
│       │   • cosineSimilarity()    (similarity metric)
│       │   • findSimilarBugs()     (main similarity search)
│       │
│       └── clustering.js           # K-means Clustering
│           • initializeCenters()   (random initialization)
│           • calculateCentroid()   (centroid calculation)
│           • assignToClusters()    (assignment step)
│           • kMeansClustering()    (main algorithm)
│           • suggestRootCauses()   (analysis step)
```

---

## Data Flow

### Bug Creation Flow

```
User Form Submission
       ↓
validateInput()
       ↓
POST /api/bugs
       ↓
createBug() controller
       ↓
Create Bug Document
       ↓
Save to MongoDB
       ↓
Fetch all bugs
       ↓
findSimilarBugs()
├─ textToVector() for new bug
├─ textToVector() for existing bugs
└─ cosineSimilarity() calculations
       ↓
Return bug + similarBugs
       ↓
Display in UI
```

### Similarity Detection Flow

```
New Bug Description
       ↓
preprocessText()
├─ Tokenization
├─ Lowercase
└─ Stop word removal
       ↓
getAllBugs()
       ↓
Prepare all texts for IDF
       ↓
textToVector() for new bug
       ↓
For each existing bug:
├─ textToVector()
├─ cosineSimilarity()
└─ Store similarity score
       ↓
Sort by similarity score
       ↓
Return top N bugs
```

### Clustering Flow

```
GET /api/bugs/analysis/cluster
       ↓
Fetch all bugs
       ↓
Extract descriptions
       ↓
Preprocess all texts
       ↓
Create TF-IDF vectors for all
       ↓
kMeansClustering()
├─ Initialize K random centers
├─ Assign bugs to nearest center
├─ Recalculate centroids
└─ Iterate until convergence
       ↓
suggestRootCauses()
├─ Extract tags from each cluster
├─ Find common keywords
└─ Generate suggestions
       ↓
Format clusters with bugs
       ↓
Return clustered data
```

---

## Database Schema

### Bug Document (MongoDB)

```javascript
{
  _id: ObjectId,
  
  // Basic Info
  title: String,              // Required
  description: String,        // Required
  stepsToReproduce: [String], // Array
  
  // Categorization
  severity: String,           // Enum: low|medium|high|critical
  status: String,             // Enum: open|in-progress|resolved|closed
  tags: [String],             // Array for categorization
  
  // Tracking
  createdBy: String,          // Reporter name
  assignedTo: String,         // Developer assigned
  createdAt: Date,
  updatedAt: Date,
  
  // ML Features
  vectorEmbedding: [Number],  // TF-IDF vector (optional storage)
  relatedBugs: [ObjectId],    // References to similar bugs
  rootCauseSuggestion: String,// AI-generated suggestion
  clusterLabel: Number,       // Cluster ID from K-means
}
```

### Indexes
```javascript
// Text search index
db.bugs.createIndex({
  title: "text",
  description: "text",
  tags: "text"
})

// Performance indexes
db.bugs.createIndex({ status: 1 })
db.bugs.createIndex({ severity: 1 })
db.bugs.createIndex({ createdAt: -1 })
```

---

## Algorithm Complexity Analysis

### TF-IDF Vectorization

**Space Complexity:** O(n × v)
- n = number of bugs
- v = vocabulary size
- In practice: ~100KB for 1000 bugs

**Time Complexity:** O(n × w × s)
- n = number of bugs
- w = average words per document
- s = time to tokenize/stopword check

### Cosine Similarity

**Space Complexity:** O(v)
- v = vocabulary size

**Time Complexity:** O(v)
- Linear scan through vector dimensions

### K-means Clustering

**Space Complexity:** O(n × d + k × d)
- n = number of bugs
- d = dimensions (vocabulary size)
- k = number of clusters

**Time Complexity:** O(i × n × k × d)
- i = iterations (typically 10-30)
- n = number of bugs
- k = number of clusters
- d = dimensions

**Practical:** ~1-5 seconds for 100 bugs, 3 clusters

---

## Scalability Considerations

### Current Limitations
- In-memory similarity calculation
- Synchronous clustering
- No caching
- Limited to ~1000 bugs for realtime similarity

### Scaling Solutions

#### 1. Vector Caching
```javascript
// Store TF-IDF vectors in database
Bug.vectorEmbedding = vector
// Use cached vectors for future calculations
```

#### 2. Batch Processing
```javascript
// Make clustering async job
Bull Queue → clustering job → update bugs
```

#### 3. Approximate Nearest Neighbors
```javascript
// Use LSH (Locality Sensitive Hashing)
// Find similar bugs faster in large datasets
```

#### 4. Database Optimization
```javascript
// Add compound indexes
db.bugs.createIndex({ status: 1, severity: 1, createdAt: -1 })
```

#### 5. API Caching
```javascript
// Redis cache for frequently accessed data
// Cache clustering results (valid for day)
```

---

## Error Handling Strategy

### Client-Side
```javascript
try {
  const response = await api.createBug(data)
} catch (error) {
  // Handle network errors
  // Display user-friendly messages
  // Log to error service
}
```

### Server-Side
```javascript
try {
  // Create bug
  const bug = await new Bug(data).save()
  // Find similar bugs
  const similar = findSimilarBugs(...)
} catch (error) {
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: ... })
  }
  return res.status(500).json({ error: 'Server error' })
}
```

---

## Performance Optimization

### Implemented
✅ Text indexing for search
✅ Efficient TF-IDF calculation
✅ Stop word filtering
✅ Sparse vector representation

### Recommended for Future
- [ ] Redis caching layer
- [ ] Database query optimization
- [ ] Vector compression (PCA)
- [ ] Approximate clustering
- [ ] API rate limiting
- [ ] Request batching
- [ ] CDN for static assets

---

## Security Considerations

### Current Implementation
- Basic CORS enabled
- Input validation
- MongoDB injection prevention (Mongoose)

### Future Enhancements
- [ ] JWT authentication
- [ ] Role-based access control
- [ ] Rate limiting
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] HTTPS/TLS
- [ ] Data encryption at rest

---

## Testing Strategy

### Unit Tests
```javascript
// Test similarity calculation
// Test clustering algorithm
// Test preprocessing
```

### Integration Tests
```javascript
// Test API endpoints
// Test database operations
// Test data flow
```

### End-to-End Tests
```javascript
// Test full user workflows
// Test UI interactions
```

---

## Deployment Architecture

### Development
```
Client (3000) → Backend (5000) → MongoDB (27017)
```

### Production with Docker
```
nginx:80/443
  ↓
client:3000
backend:5000
  ↓
MongoDB Atlas Cloud
```

### Cloud Deployment (AWS Example)
```
CloudFront + S3 (Client)
      ↓
API Gateway + Lambda (Serverless Backend)
      ↓
MongoDB Atlas + ElastiCache (Redis)
```

---

## Monitoring & Logging

### Metrics to Track
- Response time per endpoint
- Clustering algorithm performance
- Similarity calculation time
- Database query times
- Error rates
- User activity patterns

### Logging
```javascript
console.log(`[${new Date()}] ${method} ${path} - ${status}`)
```

---

## API Versioning Strategy

For future versions:
```
/api/v1/bugs
/api/v2/bugs (with new features)
```

Keep v1 for backward compatibility.

---

## Technology Choices & Rationale

| Tech | Reason |
|------|--------|
| React | Reusable components, efficient rendering |
| Express | Lightweight, flexible, minimal overhead |
| MongoDB | Flexible schema, fast development |
| Natural.js | Text processing without external APIs |
| Tailwind | Utility-first CSS, rapid styling |

All choices prioritize **manual implementation** over external APIs, demonstrating **DSA and algorithm knowledge**.

