# NEXO — "Learn. Connect. Grow."

> **A next-generation Full Stack learning and community platform combining courses, Discord-inspired community spaces, real-time WebSockets chat, gamification, and creator monetization.**

---

## 🌟 Concept

NEXO brings together the best aspects of modern learning and community products into a cohesive, high-polish SaaS platform:
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

## 🏗️ Tecnologias, Arquitetura & Segurança

Estrutura desenhada segundo as melhores práticas académicas e profissionais de **Programação Web (PW)**:

### Backend (`/server`)
| Tecnologia | Função |
|------------|--------|
| **Node.js + Express** | Servidor HTTP e API REST modular |
| **PostgreSQL + SQLite** | Base de dados relacional (suporte PostgreSQL nativo via `pg.Pool` e fallback inteligente para SQLite) |
| **jsonwebtoken (JWT)** | Autenticação stateless com expiração e verificação no middleware `protect` |
| **bcryptjs** | Hashing criptográfico de palavras-passe com 10 salt rounds |
| **express-validator** | Validação e sanitização estrita de dados em todas as rotas de entrada |
| **Socket.IO** | Comunicação bidirecional em tempo real para chat e sinalização WebRTC de chamadas |
| **Helmet & CORS** | Proteção de cabeçalhos HTTP e restrição de origens |

### Frontend (`/client`)
| Tecnologia | Função |
|------------|--------|
| **React + Vite** | Interface SPA modular, reativa e de alta performance |
| **react-router-dom** | Navegação cliente SPA com rotas protegidas |
| **Axios** | Cliente HTTP centralizado (`src/services/api.js`) com interceptors de autenticação Bearer e gestão de 401 |
| **Tailwind CSS** | Design system responsivo com suporte a modo claro/escuro e safe-areas móveis |
| **Lucide Icons** | Conjunto uniforme de ícones |
| **Recharts** | Gráficos interativos para progresso e estúdio de criadores |

---

## 🔒 Segurança Implementada
- **Hashing com bcrypt**: 10 salt rounds para todas as passwords, prevenindo ataques de força bruta e rainbow tables.
- **Autenticação Stateless com JWT**: Token com expiração de 24h, verificado no middleware central `protect` via header `Authorization: Bearer <token>`.
- **Queries SQL Parametrizadas**: Todas as consultas utilizam queries preparadas nativas (`$1, $2` / `?`), prevenindo 100% de vulnerabilidades SQL Injection.
- **Validação com `express-validator`**: Validação de comprimento, formatos de email (`normalizeEmail()`), e sanitização de inputs em todas as operações de escrita (`POST`, `PUT`).
- **Verificação de Permissões**: Middlewares `protect`, `requireAdmin` e `requireCreator` para controlo de acesso baseado em papéis (RBAC).
- **CORS Restrito**: Apenas a origem autorizada do frontend (`FRONTEND_URL`) pode consumir a API com credenciais.
- **Bloqueio de Contas Suspensas**: Utilizadores com `isSuspended = true` têm o login e pedidos bloqueados automaticamente.
- **Variáveis de Ambiente**: Gestão segura com `dotenv`, `.env` e ficheiros documentados `.env.example` tanto no cliente como no servidor.

---

## 📁 Estrutura de Ficheiros do Backend (Padrão MVC)
```
server/
├── .env.example                    (modelo de variáveis de ambiente)
├── package.json                    (dependências e scripts npm)
└── src/
    ├── server.js                   (ponto de entrada - inicia base de dados e servidor)
    ├── app.js                      (configuração Express, middlewares, cors e rotas)
    ├── database/
    │   ├── connection.js           (pool PostgreSQL / SQLite com queries parametrizadas)
    │   ├── migrate.js              (script npm run migrate para criação do esquema)
    │   └── seed.js                 (script npm run seed para dados de demonstração)
    ├── middleware/
    │   ├── auth.js                 (middleware protect e optionalAuth)
    │   ├── admin.js                (middleware requireAdmin e requireCreator)
    │   ├── validate.js             (tratamento de erros express-validator)
    │   └── security.js             (helmet, cors, sanitização e rate limiters)
    ├── models/
    │   ├── User.js                 (acesso a dados de utilizadores com queries SQL)
    │   └── Course.js               (acesso a dados de cursos)
    ├── controllers/
    │   └── auth.controller.js      (lógica de registo, login e perfil)
    ├── routes/
    │   ├── auth.routes.js          (rotas de autenticação com express-validator)
    │   └── ...                     (restantes rotas de cursos, espaços, chat, etc.)
    └── sockets/
        └── chatSocket.js           (WebSockets para chat e chamadas WebRTC)
```

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
