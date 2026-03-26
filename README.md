# TraceStack 📡
**A Community-Driven Bug Resolution Platform with AI-Assisted Debugging**

TraceStack is a modern, production-grade web application where developers and users come together to discuss, reproduce, and solve software bugs. It combines community features—like Reddit-style voting and threaded discussions—with real-time, privacy-first AI assistance.

## 🚀 Features

### 🔐 1. Advanced Authentication & Security
- **JWT-Based Sessions**: Secure authentication using `HTTPOnly` cookies (ready for deployment).
- **Email Verification**: Prevents spam accounts by enforcing OTP email verification during signup.
- **Two-Factor Authentication (2FA)**: Opt-in layer of extra security via email OTP.
- **Forgot/Reset Password**: Secure, expiring token-based password recovery flow.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `user` vs `admin` workflows.

### 🌐 2. Community-Driven Feeds
- **Trending Algorithm**: Dynamic bug ranking based on a combination of upvotes, comment volume, and recency (time-decay score).
- **Tabs Interface**: Instantly switch between **Trending**, **New**, and **Unresolved** bug feeds.
- **Bookmarking**: Save important bugs directly to your profile.
- **Reputation & Voting**: Upvote/downvote bugs and comments to surface the best solutions.
- **Accepted Solutions**: Bug authors can pin the definitively correct answer to the top of the discussion.

### 🤖 3. AI-Assisted Debugging
- **Smart Draft Assistant**: While typing a new bug report, TraceStack uses local TF-IDF processing to instantly suggest relevant tags, identify related duplicates, and offer common fixes—*before* the bug is even posted.
- **Context-Aware Global Chat Widget**: Powered by NVIDIA's `llama-3.3-nemotron`. The AI knows which page you are on, reads the metadata of the bug you're viewing, and provides contextual debugging help.

### 🛡️ 4. Moderation Tools (Backend)
- **Community Flagging**: Users can flag inappropriate bugs or comments directly answering to the Moderation queue.
- **Admin APIs**: Secure endpoints allowing appointed admins to process reports, delete offending content, or ban malicious users.

---

## 🏗️ Architecture

TraceStack is built as a Single Page Application (SPA) driven by a distinct RESTful API.

- **Frontend**: React (Create React App), React Router V6, Tailwind CSS mapping customized CSS variables, Axios.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose), utilizing complex Aggregation Pipelines for sorting.
- **AI Integration**: Custom lightweight keyword-extraction module combined with the remote NVIDIA LLM API.

---

## 🗄️ Database Schemas

### `User`
- `username`, `email`, `password` (bcrypt hashed)
- `role`: `'user'` | `'admin'`
- `isEmailVerified`: boolean
- `twoFactorSecret`: string (secret key/status)
- `bookmarks`: Array<ObjectId (Bug)>
- `isBanned`: boolean

### `Bug`
- `title`, `description`, `stepsToReproduce`, `severity`, `tags`
- `status`: `'open'` | `'in-progress'` | `'resolved'` | `'closed'`
- `score`: integer (net upvotes)
- `isSolved`: boolean
- `acceptedAnswerId`: ObjectId (Comment)
- `savedBy`: Array<ObjectId (User)>

### `Comment`
- `text`, `bugId`
- `parentId`: ObjectId (for threaded replies)
- `score`: integer

### `Token`
- Handles OTPs and URL hashes.
- `userId`, `token`, `type` (`'email_verification'`, `'password_reset'`, `'2fa'`)
- `expiresAt`: Date

### `Report` (Moderation)
- `reporterId`, `targetType` (`'bug'` | `'comment'`), `targetId`, `reason`
- `status`: `'pending'` | `'resolved'` | `'dismissed'`

---

## 🔌 API Documentation

### **Auth (`/api/auth`)**
- `POST /register`: Request OTP.
- `POST /verify-email`: Finalize registration with OTP.
- `POST /login`: Authenticate (handles 2FA challenges).
- `POST /2fa/verify`: Submit 2FA token to finish login.
- `POST /2fa/toggle`: Switch 2FA status for the active user.
- `POST /forgot-password` & `POST /reset-password`: Account recovery.

### **Bugs (`/api/bugs`)**
- `GET /`: Fetch feed (Supports `?sortBy=hot|new`).
- `POST /`: Create a new Bug.
- `POST /suggest`: Analyzes draft titles/descriptions in real-time.
- `POST /chat`: Communicates with the Context-Aware AI.
- `PUT /:id/vote`: Up/down vote a bug.
- `POST /:id/bookmark`: Toggle saved bug state.

### **Admin (`/api/admin`)** - *(Requires Admin Role)*
- `GET /reports`: View all user-generated flags.
- `DELETE /bugs/:id`: Forcibly remove a post.
- `POST /users/:id/ban`: Prevent user access.

---

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/tracestack.git
   ```

2. **Environment Setup (Server):**
   Navigate to `/server` and create a `.env` file:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/tracestack_prod
   JWT_SECRET=your_super_secret_jwt_key
   NVIDIA_API_KEY=your_nvidia_api_key
   ```
   Install dependencies and start backend:
   ```bash
   cd server
   npm install
   npm run dev
   ```

3. **Environment Setup (Client):**
   Navigate to `/client`. Ensure your API url points to `http://localhost:5000`.
   ```bash
   cd client
   npm install
   npm start
   ```

## 📜 License
MIT License. Openly accessible for community enhancements.
