# SkillSupport 🧭
### AI-Assisted Personalized Skill Development and Learning Roadmap System
> **Plan. Learn. Grow.**

An engineering college web application designed to guide undergraduate students from open-ended career ambitions into structured, achievable, and trackable learning trajectories powered by genuine Google Gemini AI assistance and persistent local SQLite storage.

---

## 🎯 Table of Contents
1. [Core Features](#-core-features)
2. [Technology Stack](#-technology-stack)
3. [Project Architecture](#-project-architecture)
4. [Prerequisites](#-prerequisites)
5. [Quick Start (Local Setup)](#-quick-start-local-setup)
6. [Configuring the Google Gemini API Key](#-configuring-the-google-gemini-api-key)
7. [Running the Application](#-running-the-application)
8. [Database Schema & Persistence](#-database-schema--persistence)
9. [REST API Documentation](#-rest-api-documentation)
10. [Troubleshooting Guide](#-troubleshooting-guide)

---

## 🌟 Core Features

- **Natural-Language Goal Interpretation:** Students can enter goals naturally (e.g. *"Become a Data Analyst"*, *"Build Computer Vision Projects"*, *"Prepare for SDE Role"*). The AI diagnoses competencies and core development stages.
- **Objective Skill-Gap Analysis:** Identifies what the student already knows vs. what industry demands, mapping prerequisites and ranked learning priorities.
- **AI-Generated Learning Roadmap:** Synthesizes ordered milestones with concrete tasks, estimated hours, verifiable completion criteria, and practical exercises based on the student's available study time.
- **Curated Verified Resources:** Integrates verified real-world links from MDN Web Docs, Harvard CS50, freeCodeCamp, MIT OpenCourseWare, Fast.ai, Python.org, Kaggle, and Docker.
- **"Improve My Roadmap" (Refinement):** Allows natural language adaptations (e.g., *"I have an exam this month and less time"*, *"I already know Git"*). The AI updates the timeline while **strictly preserving all completed tasks**.
- **Context-Aware AI Learning Assistant:** Conversational engineering tutor with context on the student's active goal, current milestone, and specific task.
- **Persistent SQLite Tracking:** Progress percentages, milestone clearances, and real activity event logs stored locally in SQLite.

---

## 💻 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, React Router v6, Lucide React Icons, Recharts Analytics, Vite |
| **Backend** | Node.js, Express.js, RESTful API architecture |
| **Database** | SQLite (`node:sqlite` persistent file storage with foreign keys & transactions) |
| **AI Integration** | Google Gemini API (`@google/generative-ai` SDK, `gemini-2.0-flash` / `gemini-1.5-flash`) |
| **Security** | `bcryptjs` password hashing, JSON Web Tokens (JWT), server-side secret isolation |

---

## 📂 Project Architecture

```text
DT/
├── client/                     # React Frontend Application
│   ├── index.html              # HTML5 entry with Plus Jakarta Sans & Inter
│   ├── vite.config.js          # Vite config with API proxy to localhost:5000
│   ├── package.json
│   └── src/
│       ├── components/         # Navbar, Footer, AiStatusBanner, Modals
│       ├── context/            # AuthContext (JWT, session, AI health)
│       ├── pages/              # Landing, Login, Register, Onboarding,
│       │                       # Dashboard, Roadmap, SkillGap, Resources,
│       │                       # Progress, Assistant, ProfileSettings
│       ├── services/           # API fetch client wrapper
│       ├── styles/             # Modern, warm off-white CSS design system
│       ├── App.jsx             # React Router route definitions
│       └── main.jsx
├── server/                     # Express.js REST API Backend
│   ├── controllers/            # Auth, Profile, Goals, SkillGap, Roadmap,
│   │                           # Resources, Progress, Assistant, System
│   ├── database/
│   │   ├── db.js               # SQLite connection & helper methods
│   │   ├── schema.sql          # Structured relational database schema
│   │   └── seedResources.js    # Curated verified engineering educational catalogue
│   ├── middleware/             # JWT auth verification, error handling
│   ├── routes/                 # Express REST endpoint routers
│   ├── services/
│   │   └── aiService.js        # Google Gemini AI prompting & structured JSON parsing
│   ├── app.js                  # Express middleware & static production serving
│   ├── index.js                # Server entry point
│   ├── test-inprocess.js       # End-to-end controller & database verification
│   └── package.json
├── .env.example                # Template for environment configuration
├── .gitignore
├── README.md                   # Complete documentation
└── package.json                # Root orchestration scripts
```

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or later (v22+ recommended; tested and fully compatible with Node v26).
- **npm**: v9.0.0 or later.
- Standard web browser (Chrome, Edge, Firefox, Safari).

---

## 🚀 Quick Start (Local Setup)

### 1. Open the Project in VS Code
Open VS Code, select **File > Open Folder...**, and select the project folder.

### 2. Install Dependencies
Open a terminal in the project root and run:
```bash
npm run install:all
```
*(This installs dependencies for both `server` and `client` in one step).*

---

## 🔑 Configuring the Google Gemini API Key

SkillSupport uses genuine Google Gemini API calls for goal interpretation, skill-gap analysis, roadmap generation, and conversational mentoring.

1. Get a free API key from **Google AI Studio**:
   👉 [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Open the file `server/.env` (or copy `.env.example` to `server/.env`):
   ```bash
   cp server/.env.example server/.env
   ```
3. Edit `server/.env` and paste your API key:
   ```env
   PORT=5000
   JWT_SECRET=skillsupport_college_secret_key_2026
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   GEMINI_MODEL=gemini-2.0-flash
   ```

> **Note on Non-AI Mode:** If you do not provide an API key immediately, the application **will still run smoothly**. Non-AI features (dashboard, progress tracking, curated resources, profile editing) work fully, and a friendly setup notification will guide you whenever an AI feature is requested.

---

## 🏃 Running the Application

### Option A: Standard Development Mode (Recommended)
Run both backend and frontend concurrently from the root directory:
```bash
npm run dev
```
- **Frontend**: Available at [http://localhost:3000](http://localhost:3000)
- **Backend API**: Available at [http://localhost:5000](http://localhost:5000)

### Option B: Running in Two Separate Terminals
**Terminal 1 (Backend Server):**
```bash
npm run dev:server
```
**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
```

### Option C: Production Single-Port Mode
Build the frontend and run the entire unified application on port 5000:
```bash
npm run build
npm start
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 🧪 Running Verification Tests

Run the built-in end-to-end verification suite:
```bash
npm test
```
This script tests:
1. SQLite database initialization and resource seeding
2. Student registration with bcrypt password hashing
3. Login and JWT token issuance
4. Student profile and skills synchronization
5. Goal setting
6. Hydrated roadmap creation and retrieval
7. Task completion status toggle and percentage calculation
8. Real progress telemetry and activity log persistence

---

## 🗄 Database Schema & Persistence

The application uses local SQLite persistent storage (`server/database/skillsupport.sqlite`).

### Key Entities
- `users`: Student credentials, name, college branch, academic year.
- `profiles`: Available weekly hours (4–24 hrs), learning pace, past experience.
- `goals`: Target roles and career aspirations.
- `skills`: User's self-assessed skills and proficiency levels.
- `skill_gap_analyses`: AI diagnostic results, alignment notes, and priorities.
- `roadmaps`: Active and past roadmaps, total weeks, weekly target hours.
- `milestones`: Ordered phases, estimated durations, and prerequisites.
- `tasks`: Actionable tasks, estimated hours, completion criteria, practice exercises, and mini-projects.
- `resources`: Verified educational links mapped to tasks or skills.
- `ai_conversations`: Contextual chat history between student and AI assistant.
- `activity_logs`: Timestamped audit trail of completed tasks and student actions.

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create a new student account.
- `POST /api/auth/login` — Sign in and receive a JWT token.
- `GET /api/auth/me` — Retrieve active authenticated user session.

### Profile & Skills (`/api/profile`)
- `GET /api/profile` — Fetch student profile, preferences, and skills portfolio.
- `PUT /api/profile` — Update study hours, pace, and academic details.
- `PUT /api/profile/skills` — Sync current skills list and proficiency levels.

### Goals (`/api/goals`)
- `GET /api/goals` — Retrieve active and historical goals.
- `POST /api/goals` — Establish a new learning goal (optional AI interpretation).

### Skill-Gap Analysis (`/api/skill-gap`)
- `GET /api/skill-gap` — Retrieve latest diagnostic on record.
- `POST /api/skill-gap/generate` — Execute genuine Gemini AI skill-gap diagnosis.

### Roadmap (`/api/roadmaps`)
- `GET /api/roadmaps` — Retrieve current active hydrated roadmap.
- `POST /api/roadmaps/generate` — Generate a personalized AI roadmap.
- `PATCH /api/roadmaps/tasks/:taskId/status` — Toggle task complete/incomplete.
- `POST /api/roadmaps/:id/refine-preview` — Preview AI adjustments to roadmap.
- `POST /api/roadmaps/:id/refine-apply` — Apply adjustments while preserving completed work.

### Resources & Progress (`/api/resources`, `/api/progress`)
- `GET /api/resources` — Search and filter curated verified resources.
- `GET /api/progress` — Compute real progress metrics and chart telemetry.

### AI Assistant (`/api/assistant`)
- `GET /api/assistant/history` — Get chat messages for active user.
- `POST /api/assistant/chat` — Send query to context-aware AI mentor.
- `DELETE /api/assistant/history` — Clear conversation history.

### System (`/api/system`)
- `GET /api/system/status` — Health check, database readiness, and Gemini AI status.

---

## 🔧 Troubleshooting Guide

| Issue | Likely Cause | Solution |
|---|---|---|
| **Port 5000 in use** | Another local service (e.g. macOS AirPlay receiver) is on port 5000 | Change `PORT=5001` in `server/.env` and update `proxy` in `client/vite.config.js` |
| **"Gemini AI Configuration Notice"** | `GEMINI_API_KEY` is not set or empty in `server/.env` | Obtain a key at [Google AI Studio](https://aistudio.google.com/app/apikey) and add it to `server/.env` |
| **"AI_QUOTA_EXCEEDED"** | Free tier rate limit reached | Wait 1 minute or switch `GEMINI_MODEL=gemini-1.5-flash` in `server/.env` |
| **Node.js Module Errors** | Missing packages | Run `npm run install:all` from the root directory |
| **Database file missing** | First startup | The SQLite database and schema initialize automatically on the first server start |

---

## 🎓 Academic Project Information
- **Official Title:** AI-Assisted Personalized Skill Development and Learning Roadmap System
- **Product Name:** SkillSupport
- **Tagline:** Plan. Learn. Grow.
- **Target Audience:** Engineering Undergraduates
