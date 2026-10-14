# NEXO — Plataforma de E-Learning e Comunidade

Aplicação web desenvolvida no âmbito da unidade curricular de **Programação Web** do **CTeSP em Tecnologias e Programação de Sistemas de Informação (TPSI)** — **IPVC**.

- **Ano Letivo:** 2025/2026
- **Instituição:** Instituto Politécnico de Viana do Castelo (IPVC)
- **Curso:** CTeSP em Tecnologias e Programação de Sistemas de Informação (TPSI)
- **Unidade Curricular:** Programação Web
- **Realizado por:**
  - Pedro Queirós

Para instruções detalhadas sobre a utilização da aplicação em cada perfil, consultar o [Manual de Utilizador](MANUAL_UTILIZADOR.md) e o [Relatório Técnico](RELATORIO_COMPLETO.md).

---

## Sobre o Projeto

O **NEXO** é uma plataforma web que junta cursos online (vídeo, artigos e quizzes) com uma componente de comunidade em tempo real (canais de texto, salas de voz/vídeo via WebRTC e mensagens diretas). O objetivo do trabalho foi criar uma aplicação full-stack completa com controlo de acessos por perfil (Aluno, Formador e Administrador), acompanhamento de progresso e emissão de certificados no final dos cursos.

### Funcionalidades Principais

#### Aluno (`STUDENT`)
- Exploração e pesquisa de cursos por categoria e nível de dificuldade
- Inscrição em cursos gratuitos ou pagos
- Visualização de aulas em vídeo e texto, marcação de aulas concluídas e caderno de apontamentos por aula
- Resolução de questionários (quizzes) com correção automática
- Participação em espaços da comunidade (chat em tempo real e chamadas de voz/vídeo com partilha de ecrã)
- Sistema de mensagens privadas e lista de amigos
- Registo de dias seguidos de estudo (streak) e medalhas de conclusão
- Geração de certificado quando o curso chega aos 100%

#### Formador (`CREATOR`)
- Painel com estatísticas dos seus cursos e alunos inscritos
- Construtor de cursos dividido por etapas (informação geral, módulos, aulas e quizzes)
- Criação, edição e publicação direta de cursos com autonomia total
- Gestão de colaboradores e estudantes do curso
- Formulário de candidatura a formador para alunos que queiram lecionar

#### Administrador (`ADMIN` / `SUBADMIN`)
- Painel de administração com métricas gerais da plataforma
- Gestão de utilizadores (alteração de cargos e suspensão de contas)
- Gestão e supervisão do catálogo global de cursos
- Avaliação de candidaturas a formador e subadministrador
- Resposta a pedidos de suporte (tickets)

---

## Tecnologias Utilizadas

### Backend
- **Node.js (ES Modules) + Express** — servidor e API REST
- **SQLite (`node:sqlite`)** — base de dados local (criada automaticamente no arranque)
- **PostgreSQL (`pg`)** — suporte opcional para ambiente de produção
- **Socket.IO** — eventos em tempo real (chat, estado online e sinalização WebRTC)
- **JSON Web Tokens (`jsonwebtoken`) + `bcryptjs`** — autenticação e encriptação de palavras-passe
- **`express-validator`, `helmet`, `express-rate-limit`** — validação de dados e segurança das rotas

### Frontend
- **React 18 + Vite** — interface e bundler de desenvolvimento
- **React Router DOM v6** — navegação entre páginas e proteção de rotas
- **Tailwind CSS** — estilização e modo escuro
- **Axios** — comunicação com a API REST
- **Socket.IO Client + WebRTC** — chat e chamadas de voz/vídeo
- **Lucide React & Recharts** — ícones e gráficos dos painéis

---

## Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js v22+** (necessário para o módulo nativo `node:sqlite`)

Não é preciso configurar nenhum servidor de base de dados externo para correr o projeto localmente, pois o backend cria o ficheiro SQLite (`backend/data/nexo.db`) e insere os dados iniciais automaticamente.

### 1. Instalar dependências

```bash
# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
```

*(Em alternativa, no Windows, pode executar diretamente o ficheiro `start.bat` na raiz do projeto depois de fazer `npm install` nas duas pastas.)*

### 2. Iniciar o Backend

```bash
cd backend
npm run dev
```

O servidor fica a correr em `http://localhost:5000`.

### 3. Iniciar o Frontend

```bash
cd frontend
npm run dev
```

O cliente React fica acessível em `http://localhost:5173`.

---

## Contas de Teste (Seed)

Na primeira execução em ambiente de desenvolvimento, a base de dados é preenchida com contas de teste para facilitar a avaliação do projeto:

### Contas principais (palavra-passe: `password123`)

| Email | Utilizador | Nome | Perfil |
|-------|------------|------|--------|
| `aluno@nexo.pt` | `aluno` | Pedro Silva | Aluno (`STUDENT`) |
| `mariana@nexo.pt` | `mariana_costa` | Mariana Costa | Formadora (`CREATOR`) |
| `admin@nexo.pt` | `rui_admin` | Rui Oliveira | Administrador (`ADMIN`) |
| `tiago@nexo.pt` | `tiago_sec` | Tiago Ramos | Aluno (com candidatura a formador pendente) |

### Contas adicionais de demonstração (palavra-passe: `nexoDemo2026!`)

| Email | Perfil |
|-------|--------|
| `sofia.almeida@nexo.pt` | Formadora |
| `miguel.ferreira@nexo.pt` | Formador |
| `marta.lopes@nexo.pt` | Aluna |
| `diogo.costa@nexo.pt` | Aluno |
| `beatriz.martins@nexo.pt` | Aluna |
| `joao.neves@nexo.pt` | Aluno |
| `ines.carvalho@nexo.pt` | Aluna |
| `rafael.moreira@nexo.pt` | Aluno |

---

## Estrutura de Pastas

```text
ProjetoFinal/
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.js            # Arranque do servidor HTTP e Socket.IO
│       ├── app.js               # Configuração do Express e rotas da API
│       ├── database/
│       │   ├── connection.js    # Ligação ao SQLite / PostgreSQL
│       │   ├── init.js          # Criação das tabelas, views e seed inicial
│       │   ├── demoSeed.js      # Dados extra para testes locais
│       │   ├── migrate.js       # Script de migração para PostgreSQL
│       │   └── seed.js          # Script manual de seed
│       ├── middleware/          # Autenticação JWT, permissões e segurança
│       ├── models/              # Modelos User e Course
│       ├── controllers/         # Controladores das rotas principais
│       ├── routes/              # Definição das rotas da API REST
│       └── sockets/             # Eventos Socket.IO (chat e chamadas)
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx              # Rotas da aplicação
│       ├── services/            # Configuração do Axios (api.js) e sons
│       ├── context/             # Contextos React (Auth, Theme, Socket, Call)
│       ├── components/          # Componentes reutilizáveis (Navbar, Sidebar, UI)
│       ├── features/            # Componentes específicos de cursos, chat e mensagens
│       └── pages/               # Páginas da aplicação
│
├── README.md
├── MANUAL_UTILIZADOR.md
├── RELATORIO_COMPLETO.md
├── DEPLOY.md
└── start.bat
```

---

## Scripts Disponíveis

### Pasta `backend`
- `npm run dev` — inicia o servidor em modo de desenvolvimento (`node --watch`)
- `npm start` — inicia o servidor em modo de produção
- `npm run migrate` — corre as migrações da base de dados
- `npm run seed` — volta a executar o seed de dados iniciais

### Pasta `frontend`
- `npm run dev` — inicia o servidor de desenvolvimento Vite
- `npm run build` — gera a versão de produção na pasta `dist`
- `npm run preview` — testa localmente a build de produção
- `npm run lint` — corre o ESLint nos ficheiros do frontend
