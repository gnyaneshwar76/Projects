# TraceStack - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently no authentication. JWT can be added in future versions.

---

## Endpoints Overview

### Bug CRUD Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bugs` | Create a new bug |
| GET | `/bugs` | Get all bugs (with filters) |
| GET | `/bugs/:bugId` | Get specific bug |
| PUT | `/bugs/:bugId` | Update bug |
| DELETE | `/bugs/:bugId` | Delete bug |

### Analysis Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bugs/:bugId/similar` | Find similar bugs |
| GET | `/bugs/analysis/cluster` | Perform clustering |
| GET | `/bugs/stats/dashboard` | Get dashboard statistics |
| GET | `/bugs/search` | Search bugs by keyword |

---

## Detailed Endpoint Documentation

### 1. Create Bug
**POST** `/bugs`

Create a new bug report.

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "stepsToReproduce": ["string"],
  "severity": "string (low|medium|high|critical, default: medium)",
  "tags": ["string"],
  "createdBy": "string"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/bugs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Login button not working",
    "description": "The login button fails to respond on mobile devices",
    "stepsToReproduce": [
      "Open mobile browser",
      "Click login button"
    ],
    "severity": "critical",
    "tags": ["mobile", "auth"],
    "createdBy": "developer@example.com"
  }'
```

**Response (201 Created):**
```json
{
  "bug": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Login button not working",
    "description": "The login button fails to respond on mobile devices",
    "stepsToReproduce": [...],
    "severity": "critical",
    "status": "open",
    "tags": ["mobile", "auth"],
    "createdBy": "developer@example.com",
    "createdAt": "2024-03-19T10:30:00Z",
    "updatedAt": "2024-03-19T10:30:00Z"
  },
  "similarBugs": [
    {
      "bugId": "507f1f77bcf86cd799439012",
      "title": "Mobile login flow broken",
      "similarity": 0.8234
    }
  ],
  "message": "Bug created successfully"
}
```

**Error Response (400):**
```json
{
  "error": "Title and description are required"
}
```

---

### 2. Get All Bugs
**GET** `/bugs`

Retrieve all bugs with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (open, in-progress, resolved, closed) |
| severity | string | Filter by severity (low, medium, high, critical) |
| sortBy | string | Sort field (createdAt, severity, status, default: createdAt) |
| order | string | Sort order (asc, desc, default: desc) |

**Examples:**
```bash
# Get all bugs
curl http://localhost:5000/api/bugs

# Get open, high-severity bugs sorted by creation date
curl "http://localhost:5000/api/bugs?status=open&severity=high&sortBy=createdAt&order=desc"

# Get resolved bugs
curl "http://localhost:5000/api/bugs?status=resolved"
```

**Response (200 OK):**
```json
{
  "total": 10,
  "bugs": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Login button not working",
      "description": "...",
      "severity": "critical",
      "status": "open",
      "tags": ["mobile", "auth"],
      "createdAt": "2024-03-19T10:30:00Z",
      "relatedBugs": []
    }
  ]
}
```

---

### 3. Get Bug by ID
**GET** `/bugs/:bugId`

Retrieve detailed information about a specific bug.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| bugId | string | Bug MongoDB ObjectId |

**Example:**
```bash
curl http://localhost:5000/api/bugs/507f1f77bcf86cd799439011
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Login button not working",
  "description": "The login button fails to respond on mobile devices",
  "stepsToReproduce": ["Open mobile browser", "Click login button"],
  "severity": "critical",
  "status": "open",
  "tags": ["mobile", "auth"],
  "createdBy": "developer@example.com",
  "assignedTo": null,
  "rootCauseSuggestion": null,
  "clusterLabel": -1,
  "createdAt": "2024-03-19T10:30:00Z",
  "updatedAt": "2024-03-19T10:30:00Z",
  "relatedBugs": [...]
}
```

**Error Response (404):**
```json
{
  "error": "Bug not found"
}
```

---

### 4. Update Bug
**PUT** `/bugs/:bugId`

Update bug information.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| bugId | string | Bug MongoDB ObjectId |

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "severity": "string (optional)",
  "status": "string (optional)",
  "tags": ["string"] (optional)",
  "assignedTo": "string (optional)"
}
```

**Example:**
```bash
curl -X PUT http://localhost:5000/api/bugs/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in-progress",
    "assignedTo": "john@example.com"
  }'
```

**Response (200 OK):**
```json
{
  "bug": {...},
  "message": "Bug updated successfully"
}
```

---

### 5. Delete Bug
**DELETE** `/bugs/:bugId`

Remove a bug from the system.

**Example:**
```bash
curl -X DELETE http://localhost:5000/api/bugs/507f1f77bcf86cd799439011
```

**Response (200 OK):**
```json
{
  "message": "Bug deleted successfully",
  "bugId": "507f1f77bcf86cd799439011"
}
```

---

### 6. Find Similar Bugs
**GET** `/bugs/:bugId/similar`

Find bugs similar to a specific bug based on TF-IDF similarity.

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| bugId | string | - | Bug MongoDB ObjectId |
| topN | number | 3 | Number of results to return |

**Example:**
```bash
curl "http://localhost:5000/api/bugs/507f1f77bcf86cd799439011/similar?topN=5"
```

**Response (200 OK):**
```json
{
  "originalBugId": "507f1f77bcf86cd799439011",
  "originalBugTitle": "Login button not working",
  "similarBugs": [
    {
      "bugId": "507f1f77bcf86cd799439012",
      "title": "Mobile login flow broken",
      "similarity": 0.8234
    },
    {
      "bugId": "507f1f77bcf86cd799439013",
      "title": "Sign-in page crashes on mobile",
      "similarity": 0.7156
    }
  ]
}
```

**Similarity Score Interpretation:**
- 0.0 - 0.3: Unrelated
- 0.3 - 0.6: Somewhat similar
- 0.6 - 0.8: Very similar
- 0.8 - 1.0: Highly similar/Duplicate

---

### 7. Clustering Analysis
**GET** `/bugs/analysis/cluster`

Perform K-means clustering analysis on all bugs.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| numClusters | number | 3 | Number of clusters to create |

**Example:**
```bash
curl "http://localhost:5000/api/bugs/analysis/cluster?numClusters=4"
```

**Response (200 OK):**
```json
{
  "totalBugs": 15,
  "numClusters": 3,
  "clusters": {
    "0": {
      "clusterIndex": 0,
      "rootCauseSuggestion": "Common tags: ui, mobile | Related to: layout, responsive | Affects 5 issues",
      "bugs": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "title": "Login button not working",
          "severity": "critical",
          "status": "open",
          "tags": ["mobile", "ui"]
        }
      ]
    },
    "1": {
      "clusterIndex": 1,
      "rootCauseSuggestion": "Common tags: database, backend | Related to: connection, timeout | Affects 7 issues",
      "bugs": [...]
    }
  }
}
```

---

### 8. Dashboard Statistics
**GET** `/bugs/stats/dashboard`

Get aggregated statistics for the dashboard.

**Example:**
```bash
curl http://localhost:5000/api/bugs/stats/dashboard
```

**Response (200 OK):**
```json
{
  "totalBugs": 15,
  "bugsByStatus": [
    {
      "_id": "open",
      "count": 8
    },
    {
      "_id": "in-progress",
      "count": 4
    },
    {
      "_id": "resolved",
      "count": 3
    }
  ],
  "bugsBySeverity": [
    {
      "_id": "critical",
      "count": 2
    },
    {
      "_id": "high",
      "count": 5
    },
    {
      "_id": "medium",
      "count": 6
    },
    {
      "_id": "low",
      "count": 2
    }
  ],
  "recentBugs": [
    {
      "_id": "...",
      "title": "...",
      "severity": "high",
      "status": "open",
      "createdAt": "2024-03-19T10:30:00Z"
    }
  ]
}
```

---

### 9. Search Bugs
**GET** `/bugs/search`

Full-text search across bugs.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |

**Examples:**
```bash
# Search for login-related bugs
curl "http://localhost:5000/api/bugs/search?query=login"

# Search for database issues
curl "http://localhost:5000/api/bugs/search?query=database+connection"
```

**Response (200 OK):**
```json
{
  "query": "login",
  "count": 3,
  "results": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Login button not working",
      "description": "...",
      "severity": "critical",
      "status": "open"
    }
  ]
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Unexpected error |

---

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

---

## Rate Limiting

Currently no rate limiting. Implement in future versions as needed.

---

## Pagination

Not implemented. Add for large datasets:
```bash
GET /api/bugs?page=1&limit=20
```

---

## Testing with Different Tools

### Postman Collection

```json
{
  "info": {
    "name": "TraceStack API",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Get All Bugs",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/bugs"
      }
    },
    {
      "name": "Create Bug",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/bugs",
        "body": {
          "mode": "raw",
          "raw": "{\"title\": \"...\", \"description\": \"...\"}"
        }
      }
    }
  ],
  "variable": [
    {
      "name": "baseUrl",
      "value": "http://localhost:5000/api"
    }
  ]
}
```

### Using fetch in JavaScript

```javascript
// Fetch all bugs
const response = await fetch('http://localhost:5000/api/bugs');
const bugs = await response.json();

// Create new bug
const newBug = await fetch('http://localhost:5000/api/bugs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'New Bug',
    description: 'Description here',
    severity: 'high'
  })
});
```

---

## API Response Times

Expected performance:
- GET bugs: 50-200ms
- POST bug (with similarity analysis): 500-2000ms
- Clustering analysis: 5000-30000ms (depends on bug count)
- Search: 100-500ms

---

## Future API Enhancement Ideas

- [ ] Pagination for large result sets
- [ ] JWT authentication
- [ ] Role-based access control
- [ ] Rate limiting
- [ ] API key authentication
- [ ] Batch operations
- [ ] Export to CSV/JSON
- [ ] Advanced filtering syntax
- [ ] Sorting by similarity score
- [ ] Bug history/changelog

