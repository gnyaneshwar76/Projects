# BugRadar

A community-driven bug resolution platform with AI-assisted debugging.

## Problem Statement

Traditional bug trackers are good for logging issues, but weak for collaborative debugging. Teams need a public feed where developers can discuss, vote, and converge on proven solutions quickly.

## Solution

BugRadar combines Reddit-style issue discussions with structured bug reporting and AI assistance. Users can post bugs, vote, discuss fixes, and mark the best solution while AI helps with tags, likely fixes, and duplicate detection.

## Features

- Public bug feed with card-based UI
- Structured bug submission (title, description, tags, steps, severity, visibility)
- AI-assisted posting workflow:
  - auto tag suggestions
  - likely fix suggestions
  - possible duplicate bug detection
- Comments and threaded replies per bug
- Mark comment as best solution
- Voting:
  - upvote/downvote bugs
  - upvote useful solutions/comments
- Sorting options:
  - latest
  - most upvoted
  - most solved
- Profile, authentication, and notifications

## Tech Stack

- Frontend: React, React Router, Axios, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- AI/ML:
  - NVIDIA-hosted LLM endpoint for AI chat
  - keyword/rule-based debug assistance
  - TF-IDF similarity utilities for duplicate detection

## Project Structure

```bash
BugRadar/
├── client/                # Frontend (UI, pages, components, API client)
├── server/                # Backend (routes, controllers, models, middleware)
├── docs/                  # Screenshots and demo visuals
├── README.md
└── .gitignore
```

## Setup

### 1) Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Required `server/.env` keys:

```env
MONGO_URI=
PORT=5000
NODE_ENV=development
JWT_SECRET=
NVIDIA_API_KEY=
```

### 2) Frontend

```bash
cd client
npm install
npm start
```

Optional `client/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Screenshots

Add screenshots in `docs/` and reference them here:

- `docs/feed.png` - Public bug feed
- `docs/create-bug-ai-assist.png` - AI-assisted bug posting
- `docs/bug-detail-comments.png` - Solutions and best-answer flow

## API Highlights

- `GET /api/bugs` - bug feed with filtering/sorting
- `POST /api/bugs` - create bug with AI assistance in response
- `POST /api/bugs/suggest` - AI-guided bug draft suggestions
- `POST /api/bugs/:bugId/vote` - upvote/downvote bug
- `GET /api/bugs/:bugId/comments` - fetch comments
- `POST /api/bugs/:bugId/comments` - add comment/reply
- `POST /api/bugs/:bugId/comments/:commentId/vote` - upvote useful solution
- `PUT /api/bugs/:bugId/solve` - mark best solution

## Future Improvements

- Reputation leaderboard and badges
- Pagination/infinite scrolling for large feeds
- Real-time updates with websockets
- Rich markdown editor and attachments
- Better semantic duplicate detection with vector search
