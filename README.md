# NEXO — Plataforma de E-Learning e Comunidade

> Aplicação web full-stack de e-learning com cursos em vídeo, comunidades em tempo real, gamificação, quizzes e chamadas de voz/vídeo.

**Disciplina:** Programação Web | **Curso:** CTeSP TPSI - IPVC

---

## Funcionalidades

### Para Alunos

| Funcionalidade | Descrição |
|----------------|-----------|
| Catálogo de Cursos | Explorar, filtrar e inscrever-se em cursos por categoria e dificuldade |
| Sala de Aula | Reprodutor de vídeo, progresso por aula, quizzes e notas pessoais |
| Comunidade | Espaços com canais de texto, voz e partilha de ecrã em tempo real |
| Gamificação | XP, níveis, conquistas, streaks diários e leaderboard |
| Mensagens | Chat direto com outros utilizadores e gestão de amizades |
| Pesquisa Global | Pesquisa de cursos e utilizadores na barra de navegação, disponível apenas para utilizadores autenticados |
| Certificados | Certificado digital gerado automaticamente ao completar um curso |

### Para Criadores

| Funcionalidade | Descrição |
|----------------|-----------|
| Estúdio do Criador | Dashboard com estatísticas de alunos e cursos publicados |
| Construtor de Cursos | Criação de módulos, aulas (vídeo, texto, quiz, código), documentos |
| Candidatura | Submissão de inquérito de candidatura a formador para aprovação |

### Para Administradores

| Funcionalidade | Descrição |
|----------------|-----------|
| Painel Admin | Estatísticas globais da plataforma |
| Gestão de Utilizadores | Suspender/reativar contas, gerir roles |
| Moderação de Cursos | Aprovar/rejeitar cursos submetidos pelos criadores |
| Candidaturas | Avaliar candidaturas a formador e sub-administrador |

---

## Tecnologias

### Backend

| Tecnologia | Função |
|------------|--------|
| Node.js (ESM) + Express | API REST |
| PostgreSQL (produção) | Base de dados relacional |
| SQLite nativo (fallback) | Desenvolvimento local sem instalação |
| Socket.IO | Comunicação em tempo real |
| jsonwebtoken | Autenticação JWT |
| bcryptjs | Hash de palavras-passe |
| express-validator | Validação de dados |
| helmet + express-rate-limit | Segurança da API |

### Frontend

| Tecnologia | Função |
|------------|--------|
| React 18 + Vite | Interface reativa com build rápido |
| react-router-dom v6 | Navegação SPA |
| Axios | Pedidos HTTP com interceptors |
| socket.io-client | WebSockets em tempo real |
| Tailwind CSS | Estilos utilitários |
| framer-motion | Animações |
| lucide-react | Ícones |
| Recharts | Gráficos |

---

## Como Executar

### Pré-requisitos

- Node.js 22+

> O backend tem fallback automático para SQLite — não é necessário instalar PostgreSQL para desenvolvimento local.

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd Projeto

# Backend
cd backend
npm install
cp .env.example .env   # editar se necessário

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

### 2. Iniciar o Backend

```bash
cd backend
npm run dev
```

O backend inicia em `http://localhost:5000`.  
Na primeira execução, o esquema SQLite e os dados de seed são criados automaticamente.

### Contas e Cursos de Demonstração

Em desenvolvimento, o seed acrescenta oito perfis com fotografias, cinco cursos e dez aulas com vídeos diferentes do YouTube. As contas de demonstração partilham a palavra-passe `nexoDemo2026!`.

- Formadores: `sofia.almeida@nexo.pt` e `miguel.ferreira@nexo.pt`
- Alunos: `marta.lopes@nexo.pt`, `diogo.costa@nexo.pt`, `beatriz.martins@nexo.pt`, `joao.neves@nexo.pt`, `ines.carvalho@nexo.pt` e `rafael.moreira@nexo.pt`

Os dados de demonstração não são inseridos quando `NODE_ENV=production`.

### 3. Iniciar o Frontend

```bash
cd frontend
npm run dev
```

A aplicação fica disponível em `http://localhost:5173`.

> Segurança: a barra de pesquisa e a página `/search` só ficam disponíveis para utilizadores autenticados. Visitantes anónimos são redirecionados para o login.

---

## Estrutura de Ficheiros

```
Projeto/
├── .env.example                 # Variáveis de ambiente de exemplo
├── .gitignore
├── README.md
│
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js            # Ponto de entrada — HTTP + Socket.IO
│       ├── app.js               # Express — middleware e rotas
│       ├── database/
│       │   ├── connection.js    # Pool PostgreSQL + fallback SQLite
│       │   ├── init.js          # Schema SQLite + seed inicial
│       │   ├── migrate.js       # Script de migração
│       │   └── seed.js          # Script de seed
│       ├── middleware/
│       │   ├── auth.js          # protect, optionalAuth, signJwtToken
│       │   ├── admin.js         # requireAdmin, requireCreator
│       │   ├── security.js      # Helmet, CORS, rate limiter, sanitização
│       │   └── validate.js      # Helpers de validação
│       ├── models/
│       │   ├── User.js
│       │   └── Course.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── course.controller.js
│       │   ├── space.controller.js
│       │   ├── gamification.controller.js
│       │   ├── admin.controller.js
│       │   ├── creator.controller.js
│       │   └── notification.controller.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── course.routes.js
│       │   ├── quiz.routes.js
│       │   ├── space.routes.js
│       │   ├── chat.routes.js
│       │   ├── gamification.routes.js
│       │   ├── creator.routes.js
│       │   ├── admin.routes.js
│       │   ├── notes.routes.js
│       │   ├── qa.routes.js
│       │   ├── certificate.routes.js
│       │   ├── notification.routes.js
│       │   ├── social.routes.js
│       │   └── support.routes.js
│       └── sockets/
│           └── chatSocket.js    # Socket.IO — mensagens, voz, WebRTC
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── eslint.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx             # Ponto de entrada React
        ├── App.jsx              # BrowserRouter + Providers + Routes
        ├── index.css            # Design system global (Tailwind + variáveis)
        ├── services/
        │   ├── api.js           # Instância Axios com interceptors
        │   └── soundEffects.js  # Sons de notificação
        ├── context/
        │   ├── AuthContext.jsx
        │   ├── ThemeContext.jsx
        │   ├── SocketContext.jsx
        │   └── ActiveCallContext.jsx
        ├── constants/
        │   └── categories.js    # Categorias, dificuldades, roles, XP
        ├── utils/
        │   ├── analytics.js
        │   └── formatters.js
        ├── components/
        │   ├── auth/            # ProtectedRoute
        │   ├── call/            # ActiveCallBanner, CallRoomModal, ...
        │   ├── common/          # CookieConsent, SEO, SocialShareModal
        │   ├── course/          # CourseEnrollModal
        │   ├── layout/          # AppLayout, Navbar, Sidebar, Footer, ...
        │   └── ui/              # Avatar, Badge, Button, Card, Modal, Toast, ...
        ├── features/
        │   ├── community/       # SpaceChannelList, SpaceMessageStream, ...
        │   ├── learn/           # CourseServerSidebar, LessonVideoPlayer, ...
        │   └── messages/        # DirectChatPane, FriendsManager
        └── pages/
            ├── LandingPage/         # LandingPage.jsx + LandingPage.css + index.js
            ├── Dashboard/           # Dashboard.jsx + ...
            ├── CourseDetails/
            ├── ExploreCourses/
            ├── LibraryPage/
            ├── SettingsPage/
            ├── HelpSupportPage/
            ├── PrivacyPolicyPage/
            ├── TermsPage/
            ├── ProgressPage/
            ├── NotFoundPage/
            ├── auth/
            │   ├── Login/
            │   ├── Register/
            │   └── ForgotPassword/
            ├── community/
            │   ├── DiscoverSpaces/
            │   ├── SpaceChat/
            │   └── SpaceDetails/
            ├── creator/
            │   ├── CreatorDashboard/
            │   ├── CourseBuilder/
            │   ├── CreatorMembers/
            │   └── ApplyCreator/
            ├── admin/
            │   └── AdminDashboard/
            ├── learn/
            │   └── CoursePlayer/
            ├── messages/
            │   └── MessagesPage/
            ├── profile/
            │   └── ProfilePage/
            ├── certificates/
            │   └── CertificateView/
            └── gamification/
                ├── AchievementsPage/
                └── LeaderboardPage/
```

---

## Base de Dados

### Modo Automático (SQLite)

Sem configuração necessária. Na primeira execução, o servidor cria o ficheiro `backend/data/nexo.db` com todo o esquema e dados de demonstração.

Contas de demonstração criadas automaticamente:

| Utilizador | Email | Role |
|------------|-------|------|
| aluno | aluno@nexo.pt | STUDENT |
| sarah_dev | sarah@nexo.pt | CREATOR |
| alex_admin | alex@nexo.pt | ADMIN |

Palavra-passe de todas as contas: `password123`

### PostgreSQL (Produção)

```env
DATABASE_URL=postgresql://user:password@host:5432/nexo
```

```bash
npm run migrate   # criar tabelas
npm run seed      # popular dados iniciais
```

---

## Scripts

### Backend

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor com auto-restart |
| `npm start` | Produção |
| `npm run migrate` | Criar/atualizar tabelas PostgreSQL |
| `npm run seed` | Popular dados iniciais |

### Frontend

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build otimizado para produção |
| `npm run preview` | Pré-visualizar build |
| `npm run lint` | Verificar qualidade do código |

---

## Segurança

- Palavras-passe com bcrypt (10 salt rounds)
- Autenticação stateless JWT (expiração 24h)
- Queries SQL parametrizadas (prevenção de SQL Injection)
- Helmet (cabeçalhos de segurança HTTP)
- Rate limiting nas rotas de autenticação
- CORS restrito à origem do frontend
- Sanitização de inputs (prototype pollution)
- Contas suspensas bloqueadas no login
