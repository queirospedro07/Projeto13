# NEXO — Vercel e Render

Carrega **o conteúdo desta pasta** para a raiz de um repositório GitHub. A estrutura necessária é:

- `frontend/`: interface para a Vercel, com `vercel.json`.
- `backend/`: API e Socket.IO para o Render, com migrações PostgreSQL.
- `render.yaml`: configuração da API no Render.

O código do backend está organizado em `backend/src/` por responsabilidade: `config`, `controllers`, `database`, `middleware`, `models`, `realtime`, `routes`, `services`, `utils` e `validation`. Os identificadores dos ficheiros SQL de migração mantêm-se para preservar o histórico das bases de dados existentes.

O frontend segue a mesma convenção em `frontend/src/`: `components`, `pages`, `contexts`, `services`, `utils`, `styles` e `constants`. Os caminhos das rotas e os textos apresentados aos utilizadores continuam em português.

## 1. Base de dados e API no Render

Criar uma base **PostgreSQL** e copiar a ligação interna fornecida pelo Render. A base deve estar na mesma região da API. A base de dados não é criada pelo `render.yaml`; escolhe o plano no painel do Render.

Criar um **Blueprint** a partir do repositório para utilizar `render.yaml`, ou um **Web Service** com estas definições:

| Campo             | Valor               |
| ----------------- | ------------------- |
| Runtime           | Node                |
| Root Directory    | `backend`           |
| Build Command     | `npm ci --omit=dev` |
| Start Command     | `npm start`         |
| Node              | `24`                |
| Health Check Path | `/api/estado`       |

O Blueprint define o serviço no plano gratuito. Podes mudar o plano antes de confirmar a criação. Não configura serviços pagos nem cria a base automaticamente.

Preencher as variáveis solicitadas:

| Variável                                                                       | Valor                                                                                                              |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                                                                 | Ligação interna do PostgreSQL                                                                                      |
| `CLIENT_URL`                                                                   | `https://O-TEU-SITE.vercel.app`                                                                                    |
| `FRONTEND_URL`                                                                 | O mesmo endereço público da Vercel                                                                                 |
| `JWT_SECRET`                                                                   | Gerado automaticamente pelo Blueprint; num serviço manual, gerar um segredo aleatório com pelo menos 32 caracteres |

As restantes variáveis estão em `render.yaml` e `backend/.env.example`. Num serviço manual, configurar também essas variáveis. Não definir `PORT`: o Render fornece a porta. A API escuta em `0.0.0.0` e aplica as migrações no arranque.

Em produção, a API não arranca sem um `JWT_SECRET` aleatório com pelo menos 32 caracteres e uma origem HTTPS válida em `CLIENT_URL` ou `FRONTEND_URL`. As origens CORS são comparadas exatamente; para previews da Vercel, configurar no Render o endereço específico que se pretende autorizar.

`PGSSL=false` destina-se à ligação interna do Render. Se usares PostgreSQL externo, configurar TLS conforme o fornecedor. Guardar os segredos apenas no painel do Render.

## 2. Frontend na Vercel

Importar o mesmo repositório:

| Campo            | Valor           |
| ---------------- | --------------- |
| Framework        | Vite            |
| Root Directory   | `frontend`      |
| Install Command  | `npm ci`        |
| Build Command    | `npm run build` |
| Output Directory | `dist`          |
| Node             | `24.x`          |

Configurar as três variáveis antes do build:

```dotenv
VITE_API_URL=https://A-TUA-API.onrender.com/api
VITE_SOCKET_URL=https://A-TUA-API.onrender.com
VITE_SITE_URL=https://O-TEU-SITE.vercel.app
```

Substituir pelos endereços reais. Estas variáveis são públicas: nunca colocar palavras-passe, JWT_SECRET ou DATABASE_URL em variáveis VITE_. A API é chamada diretamente no Render; o Socket.IO também se liga diretamente ao Render.

Depois de obter o domínio final da Vercel, atualizar `VITE_SITE_URL` na Vercel e confirmar `CLIENT_URL` e `FRONTEND_URL` no Render. Voltar a publicar ambos os serviços após essas alterações. Se mudares uma variável VITE_, voltar a executar o deploy da Vercel. Para previews, autorizar apenas os endereços exatos pretendidos no backend; não abrir CORS a todos os domínios.

O `vercel.json` permite abrir e atualizar rotas como `/explorar`, `/perfil` e `/cursos/...` sem erro 404. [Configuração oficial de Vite](https://vercel.com/docs/frameworks/frontend/vite).

## 3. Confirmar

Abrir `https://A-TUA-API.onrender.com/api/estado`, criar uma conta, iniciar sessão e testar cursos e mensagens. Os dados devem persistir no PostgreSQL. O sistema de ficheiros do Render gratuito é efémero; não guardar nele cópias de segurança como única cópia dos dados.

Os pagamentos reais não estão implementados; a simulação está bloqueada em produção. As chamadas usam STUN, sem TURN, e dependem da rede e do navegador.

Esta pasta não inclui Docker, Caddy, scripts locais, testes, evoluções, relatórios, builds, dependências instaladas ou configurações privadas. A configuração foi preparada e verificada localmente; o alojamento e a base têm de ser confirmados nas contas reais.
