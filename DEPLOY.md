# Publicação

A API utiliza PostgreSQL. Configure uma instância PostgreSQL e disponibilize a ligação em `DATABASE_URL`. O Compose incluído serve para desenvolvimento local; não expõe a base de dados fora de `127.0.0.1`.

## Configuração

Use `backend/.env.production.example` como referência. São necessários `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET` aleatório com pelo menos 32 caracteres e os domínios HTTPS em `CLIENT_URL` e `FRONTEND_URL`. Use `PGSSL=true` quando a ligação ao PostgreSQL exigir SSL; a verificação de certificados mantém-se ativa. Configure `TRUST_PROXY_HOPS` apenas de acordo com o proxy utilizado.

Os dados não dependem do sistema de ficheiros do serviço web. `DATA_DIRECTORY` serve para operações locais, incluindo exportação de backups. Transfira os backups para armazenamento privado durável. Conserve o segredo JWT entre publicações e limite as permissões das credenciais PostgreSQL.

O ficheiro `render.yaml` descreve a API e exige que a ligação PostgreSQL seja indicada no fornecedor. Não foi executada qualquer publicação.

## API

```powershell
npm --prefix backend ci
npm --prefix backend run migrate
npm --prefix backend start
```

O arranque verifica as migrações versionadas sem apagar dados. `/api/health` verifica também a ligação PostgreSQL e devolve HTTP 503 quando a base está indisponível. Para múltiplas instâncias, Socket.IO e as salas de chamadas necessitam de coordenação partilhada; a configuração atual utiliza um processo da API.

## Frontend

Configure `VITE_API_URL` com o URL da API terminado em `/api` e `VITE_SOCKET_URL` com a origem do Socket.IO. Execute `npm --prefix frontend ci` e `npm --prefix frontend run build`. Publique `frontend/dist` num serviço que encaminhe rotas SPA para `index.html`.

A política de conteúdo da compilação é gerada a partir das origens configuradas. Os vídeos externos e as chamadas exigem permissões apropriadas do navegador. Redes restritas podem exigir TURN.

## Backups e restauro

`npm --prefix backend run backup` exporta um snapshot consistente. O comando `npm --prefix backend run restore -- caminho/backup.json` restaura apenas para uma base vazia e recusa substituir dados existentes. Teste a recuperação num ambiente separado antes de depender do backup.

## Limites funcionais

Os pagamentos existentes são simulações, sem cobranças. Para vender cursos, substitua o fluxo de demonstração por uma integração com confirmação de pagamento no servidor. O envio de recuperação de conta requer SMTP. As contas demo com credenciais conhecidas não devem ser publicadas.
