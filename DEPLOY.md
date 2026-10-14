# Guia de Publicação — Render e Vercel

Instruções para publicar o projeto **NEXO** online:
- **Backend (API + WebSockets + SQLite)** no [Render](https://render.com)
- **Frontend (React + Vite + Tailwind)** na [Vercel](https://vercel.com)

---

## Pré-requisitos
1. Conta no [GitHub](https://github.com)
2. Conta no [Render](https://render.com)
3. Conta na [Vercel](https://vercel.com)

---

## Passo 1: Enviar o projeto para o GitHub

Caso o repositório Git ainda não esteja criado na pasta raiz do projeto:

```bash
git init
git add .
git commit -m "Versao final do projeto NEXO"
git branch -M main
git remote add origin https://github.com/SEU_UTILIZADOR/SEU_REPOSITORIO.git
git push -u origin main
```

O ficheiro `.gitignore` já ignora as pastas `node_modules`, `dist`, ficheiros `.db` locais e ficheiros `.env`.

---

## Passo 2: Publicar o Backend no Render

O projeto inclui um ficheiro `render.yaml` na raiz para facilitar a configuração.

### Opção A — Usando o ficheiro `render.yaml` (Blueprint)
1. Entrar no painel do [Render](https://dashboard.render.com).
2. Clicar em **New +** e escolher **Blueprint**.
3. Ligar o repositório do GitHub.
4. O Render lê o ficheiro `render.yaml` e preenche os campos automaticamente.
5. Clicar em **Apply** para iniciar o deploy.

### Opção B — Configuração manual (Web Service)
1. No Render, clicar em **New +** > **Web Service** e escolher o repositório.
2. Configurar os seguintes valores:
   - **Name**: `nexo-backend`
   - **Region**: Frankfurt
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
3. Em **Environment Variables**, definir:

   | Variável | Valor |
   | :--- | :--- |
   | `NODE_VERSION` | `22.12.0` |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `JWT_SECRET` | *(string aleatória com pelo menos 32 caracteres)* |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | *(preencher no Passo 4 com o URL da Vercel)* |
   | `DATABASE_PATH` | `./data/nexo.db` |

4. Em **Health Check Path**, colocar `/api/health`.
5. Clicar em **Create Web Service** e guardar o URL gerado (ex.: `https://nexo-backend.onrender.com`).

---

## Passo 3: Publicar o Frontend na Vercel

1. Entrar no painel da [Vercel](https://vercel.com/dashboard).
2. Clicar em **Add New...** > **Project** e importar o repositório do GitHub.
3. Na configuração do projeto:
   - **Framework Preset**: `Vite`
   - **Root Directory**: selecionar a pasta `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Em **Environment Variables**, adicionar:

   | Variável | Valor |
   | :--- | :--- |
   | `VITE_API_URL` | `https://nexo-backend.onrender.com` *(URL do serviço criado no Render, sem barra no fim)* |
   | `VITE_SOCKET_URL` | `https://nexo-backend.onrender.com` *(mesmo URL do Render)* |

5. Clicar em **Deploy**.

---

## Passo 4: Configurar o CORS no Render

1. Voltar ao serviço do backend no **Render** > separador **Environment**.
2. Atualizar a variável `CLIENT_URL` com o domínio gerado pela Vercel (ex.: `https://nexo-projeto.vercel.app`).
3. Guardar as alterações para o serviço reiniciar com a origem correta.

---

## Contas de Teste (Seed Inicial)

Quando a base de dados é criada pela primeira vez, ficam disponíveis as seguintes contas principais (palavra-passe: `password123`):

| Nome | Email | Perfil |
| :--- | :--- | :--- |
| **Pedro Silva** | `aluno@nexo.pt` | Aluno (`STUDENT`) |
| **Mariana Costa** | `mariana@nexo.pt` | Formadora (`CREATOR`) |
| **Rui Oliveira** | `admin@nexo.pt` | Administrador (`ADMIN`) |
| **Tiago Ramos** | `tiago@nexo.pt` | Aluno (com candidatura a formador) |
