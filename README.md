# LearnSpace — "Learn. Connect. Grow."

> **A next-generation Full Stack learning and community platform combining courses, Discord-inspired community spaces, real-time WebSockets chat, gamification, and creator monetization.**

---

## 🌟 Concept

LearnSpace brings together the best aspects of modern learning and community products into a cohesive, high-polish SaaS platform:
- **Courses & Learning Player**: HD video streaming, playback speeds (0.75x–2x), subtitles, personal notes auto-saved per lesson, downloadable resources, and lesson checkmarks.
- **Interactive Quizzes**: Instant automated grading, answer explanations, score tracking, repeat attempts, and XP awards.
- **Course Q&A**: Question and answer threads with upvotes and "Mark as Accepted Solution".
- **Discord-Style Community Spaces**: Spaces featuring channels (`#general`, `#announcements`, `#questions`, `#resources`, `#wins`, `#off-topic`), voice study rooms, active online member list with role hierarchy (Owner, Admin, Moderator, Member).
- **Real-Time Chat**: WebSockets (Socket.IO) messaging, live typing indicators, emoji reactions (`🔥`, `🚀`, `❤️`, `🙌`), pinned messages, and private 1-on-1 Direct Messages.
- **Gamification & Retention**: XP reward economy (+25 XP lesson, +50 XP quiz, +35 XP helping classmate, +500 XP graduating), level progression with visual confetti celebration, 20+ collectible badges across 4 rarity tiers (Bronze, Silver, Gold, Platinum), weekly/monthly/all-time leaderboards, and a 12-day study streak calendar.
- **Verified Certificates**: Verifiable completion certificates (`/certificates/verify/:id`) with unique IDs, instructor signature, and printable format.
- **Creator Studio**: Creator dashboard with revenue charts, student growth, community member moderation, and a 5-step interactive **Course Builder** wizard.
- **Administration & Moderation**: Admin overview metrics, user suspension toggles, and content moderation queue.
- **Command Palette & Global Search**: `Ctrl + K` or `Cmd + K` instant search across courses, spaces, creators, and quick navigation.
- **Dark / Light / System Mode**: First-class dark mode with high contrast and sleek zinc/indigo/cyan accents.

---

## 🚀 Quick Start

### 1. Launch with One Click (Windows)
Double click `start.bat` in the project root. It will:
1. Start the Node.js Express & Socket.IO backend on `http://localhost:5000`
2. Start the Vite React frontend on `http://localhost:5173`
3. Automatically open your browser to `http://localhost:5173`

### 2. Or Run from Terminal

#### Start Backend:
```bash
cd server
npm start
# Server listens on http://localhost:5000
```

#### Start Frontend:
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🌐 Publicação / Deploy (Render + Vercel)

Consulte o guia completo passo a passo em [DEPLOY.md](file:///c:/Users/pedro/Desktop/Projeto13/DEPLOY.md):
- **Backend no Render**: Suporte nativo ou via Blueprint (`render.yaml`), Node >= 18, SQLite com auto-seed, WebSockets e health check (`/api/health`).
- **Frontend na Vercel**: Vite React SPA com rewrites configurados (`vercel.json`), integração de rotas e variáveis de ambiente (`VITE_API_URL`, `VITE_SOCKET_URL`).

---

## 👤 1-Click Demo Accounts

The platform is pre-seeded with realistic courses, spaces, channels, messages, and progress. You can switch between personas with 1 click in the top navigation bar or login screens:

| Persona | Role | Email | Password | What to Experience |
| :--- | :--- | :--- | :--- | :--- |
| **Pedro Silva** | **Student** | `pedro@learnspace.io` | `password123` | Enrolled in *Full Stack Web Dev* (68% progress), 12-day streak, Level 4 (1,450 XP), 5 badges unlocked. |
| **Sarah Jenkins** | **Creator** | `sarah@learnspace.io` | `password123` | Author of *Frontend Masters*, access to Creator Studio, revenue analytics ($14,850), Course Builder wizard. |
| **Alex Vance** | **Admin** | `alex@learnspace.io` | `password123` | Platform Lead, Admin Panel (`/admin`), user suspension controls, moderation report queue. |

---

## 🏗️ Architecture & Tech Stack

### Frontend (`/client`)
- **Framework**: React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS with custom SaaS dark theme (`#090a0f` base, `#11131a` cards, `#232733` borders, indigo `#6366f1` accent, cyan `#06b6d4` highlight)
- **Icons**: Lucide React
- **Animations & Effects**: Canvas Confetti (celebration on XP gain and level up)
- **Data Visualizations**: Recharts (Study hours charts, Creator revenue area chart)
- **Real-time Client**: Socket.IO client for live channel chat, typing indicators, and presence

### Backend (`/server`)
- **Runtime**: Node.js + Express
- **Real-Time**: Socket.IO WebSockets server
- **Database Engine**: Direct SQL with `better-sqlite3` (WAL mode, prepared statements, zero ORM overhead)
- **Authentication**: JWT token authentication with bcrypt password hashing and role authorization
- **Database Tables**: `users`, `profiles`, `courses`, `course_modules`, `lessons`, `quizzes`, `quiz_questions`, `quiz_options`, `quiz_attempts`, `enrollments`, `lesson_progress`, `certificates`, `reviews`, `spaces`, `channels`, `messages`, `reactions`, `memberships`, `achievements`, `user_achievements`, `xp_transactions`, `notifications`, `events`, `event_participants`, `resources`, `notes`, `qa_questions`, `qa_answers`, `reports`, `categories`, `subscriptions`, `friendships`, `follows`, `direct_messages`.

---

## 🗺️ Key Routes

- `/` — Premium Landing Page
- `/dashboard` — Personalized User Dashboard with streak, progress, and continue learning
- `/explore` — Course Marketplace with category filters, difficulty, price, and search
- `/courses/:id` — Course details, curriculum accordion, instructor bio, reviews
- `/learn/:courseId` — Learning Player with custom controls, lesson drawer, personal notes, quizzes, Q&A
- `/library` — Enrolled courses, in-progress and completed filters
- `/community` — Discover Spaces catalog
- `/community/:id` — Space homepage with announcements, events, and top members
- `/community/:id/chat` — Discord-style real-time channel chat & voice rooms
- `/messages` — Direct Messages inbox
- `/progress` — Learning analytics and streak calendar
- `/achievements` — 20+ collectible badges with rarity tiers
- `/leaderboard` — Top learners podium and weekly/monthly/all-time rankings
- `/creator` — Creator Studio overview & revenue analytics
- `/creator/courses/new` — 5-step Course Builder wizard
- `/admin` — System metrics, user suspension, moderation reports
- `/certificates/verify/:id` — Digital verifiable certificate view with print/PDF support
- `/settings` — Dark/Light/System theme, notifications, profile settings
