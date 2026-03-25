# BugRadar - Setup & Installation Guide

## Quick Start (5 minutes)

### 1. Prerequisites Check
```bash
# Check Node.js version (need v16+)
node --version

# Check npm version
npm --version

# MongoDB should be running (local or Atlas)
# Local: mongod --dbpath /path/to/data
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env - update MONGO_URI if needed
npm run dev
```

**Expected output:**
```
MongoDB connected
Server running on port 5000
```

### 3. Frontend Setup (new terminal)
```bash
cd client
npm install
npm start
```

**Browser opens automatically at:** `http://localhost:3000`

---

## Detailed Installation

### Option A: Local MongoDB

1. **Install MongoDB:**
   - macOS: `brew install mongodb-community`
   - Windows: Download from https://www.mongodb.com/try/download/community
   - Linux: `sudo apt-get install mongodb`

2. **Start MongoDB:**
   ```bash
   # macOS/Linux
   mongod --dbpath ~/mongodb_data

   # Windows
   "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" --dbpath "C:\MongoDB\data"
   ```

### Option B: MongoDB Atlas (Cloud)

1. Create account at: https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string: `mongodb+srv://user:password@cluster.mongodb.net/bugradar`
4. Update `.env`:
   ```
   MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/bugradar
   ```

---

## API Testing

### Using curl or Postman

**1. Create a bug:**
```bash
curl -X POST http://localhost:5000/api/bugs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Login button broken",
    "description": "The login button does not respond to clicks on mobile devices",
    "stepsToReproduce": [
      "Open website on mobile",
      "Navigate to login page",
      "Click login button"
    ],
    "severity": "high",
    "tags": ["mobile", "ui", "auth"],
    "createdBy": "developer@example.com"
  }'
```

**2. Get all bugs:**
```bash
curl http://localhost:5000/api/bugs
```

**3. Get specific bug:**
```bash
curl http://localhost:5000/api/bugs/{bugId}
```

**4. Find similar bugs:**
```bash
curl http://localhost:5000/api/bugs/{bugId}/similar?topN=3
```

**5. Get clustering analysis:**
```bash
curl http://localhost:5000/api/bugs/analysis/cluster?numClusters=3
```

**6. Get dashboard stats:**
```bash
curl http://localhost:5000/api/bugs/stats/dashboard
```

**7. Search bugs:**
```bash
curl "http://localhost:5000/api/bugs/search?query=login"
```

**8. Update bug status:**
```bash
curl -X PUT http://localhost:5000/api/bugs/{bugId} \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}'
```

**9. Delete bug:**
```bash
curl -X DELETE http://localhost:5000/api/bugs/{bugId}
```

---

## Directory Structure Breakdown

### Server Structure
```
server/
├── src/
│   ├── index.js                 # Express app & MongoDB connection
│   ├── models/
│   │   └── Bug.js              # MongoDB schema definition
│   ├── controllers/
│   │   └── bugController.js    # Business logic
│   ├── routes/
│   │   └── bugRoutes.js        # API endpoint definitions
│   └── utils/
│       ├── similarity.js       # TF-IDF & cosine similarity
│       └── clustering.js       # K-means clustering
├── package.json
├── .env.example
└── .env                         # Local config (create from example)
```

### Client Structure
```
client/
├── public/
│   └── index.html              # HTML template
├── src/
│   ├── pages/
│   │   ├── Dashboard.js        # Main dashboard
│   │   ├── BugListPage.js      # Bug list view
│   │   ├── CreateBugPage.js    # Bug creation form
│   │   ├── BugDetailPage.js    # Bug details & edit
│   │   └── ClusterAnalysisPage.js  # Clustering visualization
│   ├── utils/
│   │   └── api.js              # API client
│   ├── App.js                  # Main component
│   ├── App.css                 # Styles
│   ├── index.css               # Global styles
│   └── index.js                # React entry point
├── package.json
└── public/                      # Static files
```

---

## Development Workflow

### Making Code Changes

**Backend:**
1. Edit files in `server/src/`
2. Server auto-reloads (using nodemon)
3. Test with curl or Postman

**Frontend:**
1. Edit React components
2. Browser auto-reloads
3. Check browser console for errors

### Debugging

**Backend:**
```bash
# View logs
npm run dev

# Debug with Node inspector
node --inspect src/index.js
# Open chrome://inspect in Chrome
```

**Frontend:**
```bash
# Open Developer Tools: F12
# Check Console tab for errors
# Use React Developer Tools extension
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
kill -9 <PID>

# Or change PORT in .env
PORT=5001
```

### MongoDB Connection Error
```bash
# Check MongoDB is running
ps aux | grep mongod

# Or start it
mongod --dbpath ~/mongodb_data
```

### npm install fails
```bash
# Clear cache and try again
npm cache clean --force
rm node_modules package-lock.json
npm install
```

### CORS Errors
- Ensure backend runs on port 5000
- Ensure frontend proxy is set in package.json
- Check .env configuration

---

## Performance Tips

1. **Create multiple bugs first** (10+) before testing similarity
2. **Use clustering after** having ~20 bugs for meaningful insights
3. **Index frequently queried fields** in MongoDB for faster searches
4. **Cache API responses** in frontend for better UX

---

## Next Steps

After setting up:
1. ✅ Create 10+ sample bugs
2. ✅ Test similarity detection
3. ✅ Run clustering analysis
4. ✅ Check dashboard statistics
5. ✅ Explore API endpoints

---

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Natural.js Library](https://naturalnode.github.io/natural/)
- [ML.js Library](https://github.com/mljs/ml)

---

Need help? Check the main README.md for more details!
