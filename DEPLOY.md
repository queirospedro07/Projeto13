# Publicação e operação

## Modelo suportado

Esta versão usa um único processo Node.js com SQLite num disco persistente. Não existe suporte funcional a PostgreSQL; `DATABASE_URL` configurado provoca um erro explícito em vez de uma mudança silenciosa de base de dados. Para múltiplas instâncias é necessária uma migração de persistência e coordenação de Socket.IO, que não está implementada.

O ficheiro `render.yaml` descreve um serviço com disco persistente. A sua aplicação no fornecedor pode ter custos; não foi executada qualquer publicação nesta revisão. O plano gratuito com sistema de ficheiros efémero não deve alojar esta base SQLite. Ver [discos persistentes do Render](https://render.com/docs/disks).

## Backend

- Node.js >=22.16, instalação `npm ci`, arranque `npm start` dentro de `backend`.
- `NODE_ENV=production`.
- `DATABASE_PATH=/var/data/nexo.db` no disco persistente; nunca numa pasta temporária do build.
- `JWT_SECRET` aleatório com pelo menos 32 caracteres. A aplicação recusa os valores de exemplo em produção.
- `CLIENT_URL` e `FRONTEND_URL`: domínio HTTPS exato da interface. Sem `*`. A recuperação de conta usa `FRONTEND_URL`.
- `TRUST_PROXY_HOPS`: número de proxies de confiança entre o cliente e o Node, apenas quando aplicável. O exemplo Render usa 1; confirme a topologia real.
- `ENABLE_DEMO_LOGIN=false` e `SEED_DEMO_DATA=false`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` para recuperação por email. Sem SMTP não existe envio de recuperação em produção.
- Verificação de disponibilidade em `/api/health`.

Crie o primeiro administrador com `npm run admin:create` e variáveis `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_NAME`, `ADMIN_PASSWORD` num terminal privado. Não há administrador automático nem reposição da suspensão no arranque.

## Frontend

Na Vercel, escolha `frontend` como diretório raiz; `npm ci` e `npm run build`; saída `dist`. Configure antes do build:

```text
VITE_API_URL=https://api.exemplo.pt/api
VITE_SOCKET_URL=https://api.exemplo.pt
```

Os valores `VITE_*` são públicos e nunca devem conter segredos. Se alterar os domínios, reconstrua a interface. O build injeta uma política de conteúdo com os destinos de comunicação configurados; `vercel.json` acrescenta cabeçalhos para impedir enquadramento, sniffing de conteúdo e acesso desnecessário à localização. Se usar outro alojamento, replique esses cabeçalhos e o encaminhamento das rotas para `index.html`.

As chamadas precisam de HTTPS, permissão de microfone/câmara concedida pelo utilizador e conectividade entre participantes. STUN está configurado. TURN autenticado deve ser integrado antes de prometer chamadas em redes empresariais ou móveis restritas. Não coloque credenciais TURN permanentes na interface.

## Atualizações, backup e recuperação

1. Execute os testes e gere o frontend antes de publicar.
2. Faça `npm run backup` no backend e transfira o ficheiro produzido para armazenamento externo protegido.
3. Pare o serviço antes de substituir a base numa restauração. Conserve a base anterior e os ficheiros WAL/SHM até confirmar que não há conexões abertas.
4. Restaure uma cópia num caminho separado, aponte `DATABASE_PATH` para ela e valide login, cursos, mensagens e avaliações antes de voltar a servir tráfego.
5. O arranque cria apenas objetos ausentes e acrescenta a versão de sessão; não elimina tabelas. Bases com tabelas inglesas legadas são recusadas e precisam de uma migração explícita com backup. Não existe migração automática de dados históricos de PostgreSQL.

Não se efetuou conversão nem limpeza da base de dados existente do utilizador. Contas de demonstração que já existissem devem ser identificadas e removidas pelo responsável antes de expor um serviço público.

## Serviços que exigem configuração própria

- Pagamentos e faturação: não integrados. Inscrições pagas diretas são bloqueadas; há concessão manual de acesso para acordos externos.
- Armazenamento de ficheiros: não há serviço de anexos no chat. Imagens de perfil são limitadas a JPG/PNG/WebP e redimensionadas pelo editor; recursos pedagógicos aceitam ligações e PDF/TXT/imagens limitados a 2 MB por ficheiro e 4 MB por curso.
- SMTP: configurar e testar com uma caixa de correio autorizada.
- TURN e monitorização: definir para o ambiente final; nunca foram ativados serviços externos nesta revisão.
