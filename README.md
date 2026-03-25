# BugRadar - Intelligent Bug Tracking System

An intelligent bug tracking system with root cause prediction using TF-IDF similarity detection and K-means clustering.

## 🎯 Project Overview

BugRadar is a full-stack application that helps teams:
- Report and track bugs efficiently
- Detect similar bugs using machine learning algorithms
- Identify root causes through clustering analysis
- Manage bug lifecycle with status tracking

**Tech Stack:**
- **Frontend:** React 18 + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** MongoDB
- **ML Libraries:** Natural.js (tokenization), ML.js (clustering)

## 📁 Project Structure

```
BugRadar/
├── client/                    # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── utils/           # API utilities
│   │   ├── App.js           # Main app component
│   │   ├── App.css          # Styling
│   │   └── index.js         # Entry point
│   └── package.json
└── server/                    # Node.js Backend
    ├── src/
    │   ├── models/          # MongoDB schemas
    │   ├── controllers/     # Business logic
    │   ├── routes/          # API routes
    │   ├── utils/           # Helper functions
    │   └── index.js         # Server entry
    ├── package.json
    └── .env.example
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to server directory:**
```bash
cd server
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env file:**
```bash
cp .env.example .env
# Edit .env with your MongoDB URI
```

4. **Start the backend:**
```bash
npm run dev    # Development with nodemon
npm start      # Production
```

The server runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to client directory:**
```bash
cd client
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the frontend:**
```bash
npm start
```

The app opens at `http://localhost:3000`

## 📚 Core Features

### 1. Bug Reporting System
- Create new bug reports with:
  - Title and description
  - Steps to reproduce
  - Severity levels (low, medium, high, critical)
  - Custom tags
  - Reporter name

### 2. Bug Tracking Dashboard
- View all bugs with filtering options
- Filter by status and severity
- Search by keywords
- Sort by creation date or priority
- See bug details and update status

### 3. Similarity Detection
**Algorithm: TF-IDF (Term Frequency-Inverse Document Frequency)**

Components:
- Tokenization: Splits text into words
- Stop word removal: Filters common words (the, is, etc.)
- TF calculation: Frequency of terms in each document
- IDF calculation: Importance of terms across all documents
- Cosine similarity: Measures semantic similarity between bugs

**Process:**
1. When a bug is created, its description is analyzed
2. Compared against all existing bug descriptions
3. Top 3 similar bugs are returned
4. Similarity scores displayed as percentages

Example:
```javascript
// Bug 1: "Login button not working on mobile"
// Bug 2: "Sign in fails on Android"
// Similarity Score: 78% (similar issues)
```

### 4. Root Cause Suggestion
**Algorithm: K-means Clustering**

Components:
- **Vector creation:** Converts text to TF-IDF vectors
- **Clustering:** Groups similar bugs into clusters
- **Analysis:** Finds common tags and keywords in each cluster
- **Suggestion:** Generates root cause insights

**Process:**
1. All bug descriptions are vectorized
2. K-means algorithm groups similar bugs
3. Common tags and keywords analyzed per cluster
4. Root cause suggestions generated

Example:
```
Cluster 1 (5 bugs):
- Common tags: ui, mobile, button
- Related to: animation, performance
- Root Cause: Mobile UI rendering issues
```

### 5. REST APIs

**Bug CRUD:**
```
POST   /api/bugs              # Create bug
GET    /api/bugs              # Get all bugs (with filters)
GET    /api/bugs/:bugId       # Get bug details
PUT    /api/bugs/:bugId       # Update bug
DELETE /api/bugs/:bugId       # Delete bug
```

**Analysis Endpoints:**
```
GET    /api/bugs/:bugId/similar           # Find similar bugs
GET    /api/bugs/analysis/cluster         # Clustering analysis
GET    /api/bugs/stats/dashboard          # Dashboard statistics
GET    /api/bugs/search                   # Search bugs
```

**Query Parameters:**
```
GET /api/bugs?status=open&severity=high   # Filter by status/severity
GET /api/bugs/:bugId/similar?topN=5       # Get top N similar bugs
GET /api/bugs/analysis/cluster?numClusters=4  # Specify cluster count
```

## 🧠 Machine Learning Implementation

### TF-IDF Vectorization
```javascript
// Example: Bug description vectorization
Description: "Login button not working on mobile devices"

Tokenized: ["login", "button", "working", "mobile", "devices"]
TF values: {login: 0.2, button: 0.2, working: 0.2, mobile: 0.2, devices: 0.2}
IDF values: {login: 2.1, button: 2.3, working: 1.8, mobile: 1.9, devices: 2.0}
TF-IDF: {login: 0.42, button: 0.46, working: 0.36, mobile: 0.38, devices: 0.40}
```

### Cosine Similarity
```
Similarity = (A · B) / (||A|| × ||B||)

where:
- A · B = sum of products of corresponding elements
- ||A|| = magnitude of vector A
- ||B|| = magnitude of vector B

Result: 0 (no similarity) to 1 (identical)
```

### K-means Clustering
```
Process:
1. Initialize K random centroids
2. Assign each bug to nearest centroid
3. Recalculate centroids as mean of assigned points
4. Repeat until convergence

Example with K=3:
Cluster 1: Auth-related bugs (5 issues)
Cluster 2: UI/UX bugs (8 issues)
Cluster 3: Performance bugs (3 issues)
```

## 🔒 Data Schema

### Bug Document
```javascript
{
  _id: ObjectId,
  title: String,                    // Bug title
  description: String,              // Detailed description
  stepsToReproduce: [String],       // Step-by-step reproduction
  severity: String,                 // low|medium|high|critical
  status: String,                   // open|in-progress|resolved|closed
  tags: [String],                   // Custom tags for categorization
  createdBy: String,                // Reporter name
  assignedTo: String,               // Assigned developer
  vectorEmbedding: [Number],        // TF-IDF vector (optional)
  relatedBugs: [ObjectId],          // Reference to similar bugs
  rootCauseSuggestion: String,      // AI-generated suggestion
  clusterLabel: Number,             // Cluster ID from K-means
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Configuration

### Environment Variables (.env)

**Backend:**
```
MONGO_URI=mongodb://localhost:27017/bugradar
PORT=5000
NODE_ENV=development
```

**Frontend:**
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 📊 Algorithm Performance

### TF-IDF Similarity
- **Time Complexity:** O(n×m×k) where n=bugs, m=avg tokens, k=unique tokens
- **Space Complexity:** O(n×k)
- **Suitable for:** Real-time similarity detection (< 1000 bugs)

### K-means Clustering
- **Time Complexity:** O(i×n×k×d) where i=iterations, n=docs, k=clusters, d=dimensions
- **Space Complexity:** O(n×d)
- **Suitable for:** Periodic analysis (recommended: weekly/monthly)

## 🚀 Scaling Improvements

For large datasets (10,000+ bugs):
1. **Implement caching:** Cache TF-IDF vectors
2. **Use approximate nearest neighbors:** LSH for similarity search
3. **Implement clustering as async job:** Use job queues (Bull, RabbitMQ)
4. **Database indexes:** Index tags, severity, status fields
5. **Frontend pagination:** Implement infinite scroll

## 🧪 Testing

### Sample API Requests

**Create a bug:**
```bash
curl -X POST http://localhost:5000/api/bugs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Login fails on Firefox",
    "description": "Users cannot log in using Firefox browser",
    "severity": "high",
    "tags": ["browser", "auth"],
    "createdBy": "john@example.com"
  }'
```

**Get similar bugs:**
```bash
curl http://localhost:5000/api/bugs/[bugId]/similar?topN=5
```

**Analyze clusters:**
```bash
curl http://localhost:5000/api/bugs/analysis/cluster?numClusters=4
```

## 📈 Optional Enhancements

- [ ] JWT Authentication & Role-based access
- [ ] GitHub issue import/sync
- [ ] WebSocket real-time updates
- [ ] Advanced reporting & analytics
- [ ] Email notifications
- [ ] Attachment support
- [ ] Comments & discussions
- [ ] SLA tracking

## 🛠️ Development

### Project Demonstrates:
✅ **Data Structures & Algorithms**
- Tokenization and text processing
- Vector space models
- Similarity metrics (cosine similarity)
- Clustering algorithms (K-means)
- Graph analysis (bug relationships)

✅ **Backend Architecture**
- REST API design
- MongoDB document modeling
- Controller-Route-Model pattern
- Business logic separation
- Error handling

✅ **Frontend Development**
- React hooks & state management
- Component composition
- Responsive design with Tailwind CSS
- API integration
- Form handling

## 📝 License

MIT License

## 👤 Author

Created as a demonstration of full-stack development with ML integration.

---

**Happy bug tracking! 🐛**
