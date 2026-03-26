# TraceStack - Testing Guide

## Quick Testing Steps

### 1. Populate Sample Data

```bash
cd server
node scripts/seedData.js
```

This will insert 10 realistic sample bugs into the database.

### 2. Test Dashboard

Navigate to `http://localhost:3000`
- See bug statistics
- View recent bugs
- Check severity distribution

### 3. Test Bug List

Go to **Bugs** page
- Filter by status and severity
- Sort by different fields
- Click on bugs to view details

### 4. Test Bug Creation

Go to **Report Bug** page
- Fill in form with sample data:
  ```
  Title: Database connection fails intermittently
  Description: The app randomly loses database connection after 5 minutes
  Severity: High
  Tags: database, connectivity
  ```
- System will automatically find similar bugs
- Submit and check dashboard updates

### 5. Test Similarity Detection

Create a second bug with similar content:
```
Title: DB disconnection issue on production
Description: Production environment loses connection to database
```

- When creating, system shows similar bugs
- Check similarity scores
- Go to bug details and see "Similar Bugs" section

### 6. Test Clustering Analysis

Go to **Analysis** page
- Start with 3 clusters
- System groups bugs by similarity
- Review root cause suggestions
- Adjust cluster count and re-analyze

---

## API Testing Scripts

### Using curl

**Create multiple bugs:**
```bash
# Bug 1
curl -X POST http://localhost:5000/api/bugs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Database connection timeout",
    "description": "Connection to MongoDB times out after 5 minutes of inactivity",
    "severity": "high",
    "tags": ["database", "backend"],
    "createdBy": "test@example.com"
  }'

# Bug 2 (similar)
curl -X POST http://localhost:5000/api/bugs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "DB connection drops randomly",
    "description": "Unexpected disconnection from MongoDB occurring intermittently",
    "severity": "high",
    "tags": ["database", "backend"],
    "createdBy": "test@example.com"
  }'
```

**Get all bugs:**
```bash
curl http://localhost:5000/api/bugs
```

**Filter bugs:**
```bash
# By status
curl "http://localhost:5000/api/bugs?status=open"

# By severity
curl "http://localhost:5000/api/bugs?severity=critical"

# Both
curl "http://localhost:5000/api/bugs?status=open&severity=high"
```

**Get bug by ID:**
```bash
curl http://localhost:5000/api/bugs/{bugId}
```

**Find similar bugs:**
```bash
curl "http://localhost:5000/api/bugs/{bugId}/similar?topN=5"
```

**Update bug status:**
```bash
curl -X PUT http://localhost:5000/api/bugs/{bugId} \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}'
```

**Get clustering analysis:**
```bash
curl "http://localhost:5000/api/bugs/analysis/cluster?numClusters=3"
```

**Get dashboard stats:**
```bash
curl http://localhost:5000/api/bugs/stats/dashboard
```

**Search bugs:**
```bash
curl "http://localhost:5000/api/bugs/search?query=database"
```

---

## Performance Testing

### Load Test with Apache Bench

```bash
# Create 100 GET requests to dashboard
ab -n 100 -c 10 http://localhost:5000/api/bugs/stats/dashboard

# Create bugs
ab -n 50 -c 5 -T "application/json" -p bug_data.json \
   http://localhost:5000/api/bugs
```

### Measure Clustering Performance

```bash
# Small dataset (10 bugs)
time curl "http://localhost:5000/api/bugs/analysis/cluster?numClusters=2"

# Medium dataset (100+ bugs)
# Create 100+ bugs first, then:
time curl "http://localhost:5000/api/bugs/analysis/cluster?numClusters=5"
```

---

## Frontend Testing Checklist

### Dashboard
- [ ] All statistics display correctly
- [ ] Charts update after creating new bug
- [ ] Recent bugs list shows latest entries
- [ ] Page loads within 2 seconds

### Bug List Page
- [ ] Filters work (status, severity)
- [ ] Sorting works (date, severity, status)
- [ ] Pagination works for large datasets
- [ ] Search functionality responsive
- [ ] "Create Bug" button navigates correctly

### Create Bug Page
- [ ] Form validation works
- [ ] Can add/remove steps to reproduce
- [ ] Tags input accepts multiple values
- [ ] Similar bugs display after creation
- [ ] Success message shows

### Bug Detail Page
- [ ] All bug information displays
- [ ] Status change buttons work
- [ ] Similar bugs link correctly
- [ ] Edit mode functions properly
- [ ] Delete confirmation works

### Analysis Page
- [ ] Cluster count slider works
- [ ] Clusters display with bug lists
- [ ] Root cause suggestions show
- [ ] Links to individual bugs work

---

## Common Test Scenarios

### Scenario 1: Duplicate Bug Detection
1. Create bug: "Login page broken"
2. Create bug: "Sign-in page not working"
3. Check similarity score (should be high)

### Scenario 2: Severity Escalation
1. Create critical bug
2. Filter by severity=critical
3. Update to in-progress status
4. Check dashboard updates

### Scenario 3: Cluster Analysis
1. Create 15 bugs with varied topics
2. Run clustering with 3 clusters
3. Verify bugs grouped logically
4. Check generated suggestions

### Scenario 4: Search Functionality
1. Create bugs with diverse content
2. Search for "login"
3. Verify relevant results
4. Check multiple matches

---

## Expected Results

### Similarity Detection
- Bugs with similar descriptions: 70-90% similarity
- Unrelated bugs: 10-30% similarity
- Identical descriptions: 95%+ similarity

### Clustering
- 10-15 bugs → 2-3 clusters
- 50+ bugs → 4-6 clusters
- Clusters should have 2-10 bugs each

### Performance
- Dashboard load: < 500ms
- Bug creation: < 1s (including similarity check)
- Clustering analysis: < 30s (for 100 bugs)
- Search response: < 200ms

---

## Debugging Tips

### Check Server Logs
```bash
# Terminal 1 (server running)
npm run dev
# Watch console for errors
```

### Check Browser Console
- Press F12
- Look for API errors
- Check network requests (Network tab)

### Test Individual APIs
```bash
# Health check
curl http://localhost:5000/api/health

# Test connection
curl -i http://localhost:5000/api/bugs
```

### Reset Database
```bash
# Delete all bugs and start fresh
mongo tracestack
db.bugs.deleteMany({})
```

---

## Continuous Testing

Set up these regular checks:
- [ ] Weekly: Create 10+ bugs and run clustering
- [ ] Monthly: Perform full load testing
- [ ] Per release: Test all 5 main features
- [ ] Before deployment: Run entire test checklist

Happy testing! 🚀
