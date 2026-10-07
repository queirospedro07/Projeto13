# 🚀 Guia de Publicação do LearnSpace: Render & Vercel

Este guia detalha passo a passo como colocar o **LearnSpace** online:
- **Backend (API + WebSockets + SQLite)** no **[Render](https://render.com)**
- **Frontend (React + Vite + Tailwind)** no **[Vercel](https://vercel.com)**

---

## 📋 Pré-requisitos
1. Uma conta no [GitHub](https://github.com)
2. Uma conta no [Render](https://render.com)
3. Uma conta na [Vercel](https://vercel.com)

> 🔒 Regras de acesso da aplicação: a barra de pesquisa global e a rota `/search` são restringidas a utilizadores autenticados. Visitantes sem sessão não podem realizar pesquisas nem aceder à página de resultados.

---

## Passo 1: Subir o Projeto para o GitHub

Se ainda não inicializou o repositório git no seu computador, execute no terminal da pasta raiz do projeto (`Projeto13`):

```bash
git init
git add .
git commit -m "feat: preparar projeto para publicação no Render e Vercel"
git branch -M main
git remote add origin https://github.com/SEU_UTILIZADOR/SEU_REPOSITORIO.git
git push -u origin main
```

> **Nota:** O ficheiro `.gitignore` já está configurado para ignorar pastas pesadas (`node_modules`), ficheiros de compilação (`dist`), bases de dados locais e variáveis secretas (`.env`).

---

## Passo 2: Publicar o Backend no Render

O projeto já inclui um ficheiro de infraestrutura **`render.yaml`** que automatiza a configuração.

### Opção A — Automática com Blueprint (Recomendado)
1. Aceda ao seu painel no [Render Dashboard](https://dashboard.render.com).
2. Clique no botão **New +** no canto superior direito e selecione **Blueprint**.
3. Conecte o repositório do GitHub que acabou de criar.
4. O Render irá detetar automaticamente o ficheiro `render.yaml` e pré-configurar todos os comandos e variáveis.
5. Clique em **Apply**. O Render iniciará a compilação e o deploy.

---

### Opção B — Manual como Web Service
Se preferir criar manualmente sem usar Blueprint:
1. No [Render Dashboard](https://dashboard.render.com), clique em **New +** > **Web Service**.
2. Escolha o seu repositório GitHub.
3. Preencha os seguintes campos:
   - **Name**: `learnspace-backend` (ou o nome que preferir)
   - **Region**: Frankfurt (ou a mais próxima)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Na secção **Environment Variables**, adicione:
   | Chave | Valor |
   | :--- | :--- |
   | `NODE_VERSION` | `22.12.0` |
   | `NODE_OPTIONS` | `--experimental-sqlite` |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `JWT_SECRET` | *(Gere uma chave segura aleatória ou use uma string longa com mais de 32 caracteres)* |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | *(Deixe em branco por agora; irá preencher com o link do Vercel no Passo 4)* |
   | `DATABASE_PATH` | `./data/learnspace.db` |
5. Na secção **Health Check Path**, configure: `/api/health`.
6. Clique em **Create Web Service**.

> ⏳ **Aguarde a conclusão do Deploy**: O Render fornecerá uma URL pública como `https://learnspace-backend.onrender.com`. Copie esta URL!

---

## Passo 3: Publicar o Frontend no Vercel

1. Aceda ao [Vercel Dashboard](https://vercel.com/dashboard).
2. Clique em **Add New...** > **Project**.
3. Importe o mesmo repositório do GitHub.
4. No ecrã de configuração do projeto (**Configure Project**):
   - **Framework Preset**: `Vite`
   - **Root Directory**: Clique em **Edit** e selecione a pasta `frontend`.
   - **Build and Output Settings**: Deixe os padrões (`npm run build` e `dist`).
5. Abra a secção **Environment Variables** e adicione:
   | Chave | Valor |
   | :--- | :--- |
   | `VITE_API_URL` | `https://nexo-backend.onrender.com` *(substitua pelo URL do seu serviço no Render sem barra final)* |
   | `VITE_SOCKET_URL` | `https://nexo-backend.onrender.com` *(mesmo URL do Render)* |
6. Clique em **Deploy**.

> 🚀 O Vercel compilará a aplicação React em segundos e fornecerá um URL como `https://nexo.vercel.app`.

---

## Passo 4: Ligar o Vercel ao Render (CORS)

Para que o backend autorize com total segurança as chamadas da sua aplicação Vercel:

1. Volte ao painel do seu serviço no **Render**.
2. Vá ao separador **Environment**.
3. Adicione ou edite a variável:
   - **`CLIENT_URL`**: `https://sua-aplicacao.vercel.app` *(o URL gerado pelo Vercel no Passo 3)*
4. Guarde as alterações. O Render fará um redeploy rápido automaticamente.

*(Nota: O backend foi configurado para aceitar automaticamente qualquer subdomínio `*.vercel.app` em produção, mas definir a `CLIENT_URL` explícita é uma boa prática de segurança.)*

### Recuperação da palavra-passe

Para enviar ligações reais de recuperação, configure no serviço do Render:

| Variável | Valor |
| :--- | :--- |
| `SMTP_HOST` | Host do seu fornecedor de email |
| `SMTP_PORT` | `587` (STARTTLS) ou `465` (TLS) |
| `SMTP_SECURE` | `false` para 587; `true` para 465 |
| `SMTP_USER` | Utilizador SMTP |
| `SMTP_PASS` | Palavra-passe ou token SMTP |
| `SMTP_FROM` | Endereço remetente (opcional; por omissão usa `SMTP_USER`) |

Mantenha `CLIENT_URL` definido com o domínio do frontend para construir as ligações. Em SQLite, a tabela de tokens é criada automaticamente. Se usar PostgreSQL, execute `npm run migrate` na pasta `backend` após atualizar o código. Sem SMTP, o backend só devolve a ligação de teste em ambiente local; em produção, a recuperação fica indisponível até configurar o serviço.

---

## 👥 Contas Demo Pré-Configuradas para Testes

O backend inicializa e popula automaticamente a base de dados SQLite no arranque com dados e contas de teste:

| Utilizador | E-mail | Palavra-passe | Função |
| :--- | :--- | :--- | :--- |
| **Pedro Silva** | `aluno@nexo.pt` | `password123` | Aluno / Estudante |
| **Sarah Jenkins** | `sarah@nexo.pt` | `password123` | Criador de Conteúdo / Instrutor |
| **Alex Vance** | `alex@nexo.pt` | `password123` | Administrador |

Também pode usar o botão de **Login Demo com 1 Clique** disponível no topo do site e na página de autenticação.

---

## 💾 Informação sobre a Base de Dados SQLite no Render

- **No Plano Gratuito do Render**: O disco é efémero. Se o serviço hibernar após inatividade ou for reiniciado, o backend executa automaticamente o script de seed (`initializeSchemaAndSeed`), garantindo que todos os cursos, salas comunitárias e contas de demonstração estejam sempre disponíveis e funcionais.
- **Para Dados Persistentes de Longo Prazo**: Se quiser que os registos de novos utilizadores nunca se percam entre reinícios no Render, pode:
  1. Adicionar um **Persistent Disk** no Render montado em `/var/data` e definir `DATABASE_PATH=/var/data/learnspace.db`; OU
  2. Apontar para uma base de dados SQLite na cloud como [Turso](https://turso.tech) ou PostgreSQL.
