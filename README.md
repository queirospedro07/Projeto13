# NEXO

Plataforma de cursos e comunidades desenvolvida para Programação Web — CTeSP TPSI, IPVC.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, Vite 8, React Router, Axios, CSS nativo |
| Interface | CSS por componente, React Icons, Recharts, fonte NexoFont local |
| Backend | Node.js, Express, CommonJS, PostgreSQL e `pg` |
| Segurança | JWT, bcrypt, express-validator, Helmet, limites de pedidos e permissões verificadas no servidor |
| Tempo real | Socket.IO e WebRTC |
| Qualidade | ESLint, Prettier e testes de integração com PostgreSQL |

A organização segue o [projeto de referência](https://github.com/queirospedro07/PW-P-LAB-TRABALHO-PRATICO), mantendo as funcionalidades específicas da NEXO.

## Executar no Windows

Requer Node.js 22.16 ou superior, npm e Docker Desktop para a base de dados local.

```powershell
.\start.bat
```

O arranque instala dependências em falta com `npm ci`, prepara a configuração local, inicia o PostgreSQL num volume persistente, aplica migrações e verifica o frontend, a API e o proxy antes de abrir o navegador. A palavra-passe local do PostgreSQL é gerada aleatoriamente na primeira configuração e conservada em `backend/.env`. Os logs e os identificadores dos processos ficam em `.runtime/`, excluída do Git.

- Interface: http://localhost:5173
- Estado da API e do PostgreSQL: http://localhost:5000/api/health
- Verificar sem abrir o navegador: `start.bat -NoBrowser`.
- Encerrar a API e o frontend: `stop.bat`. O PostgreSQL continua disponível e os dados são conservados.

Para usar uma instalação PostgreSQL própria, configure `DATABASE_URL` e `LOCAL_POSTGRES_DOCKER=false` em `backend/.env`. Conserve as configurações e credenciais existentes.

## Execução manual

```powershell
npm --prefix backend ci
npm --prefix frontend ci
# Apenas se backend/.env ainda não existir:
Copy-Item backend/.env.example backend/.env
# Configure DATABASE_URL com a sua ligação PostgreSQL.
npm --prefix backend run migrate
```

Em terminais separados:

```powershell
npm --prefix backend run dev
npm --prefix frontend run dev
```

## Organização

```text
backend/
  src/
    server.js             arranque HTTP e Socket.IO
    app.js                Express, middleware e montagem das rotas
    routes/               endpoints e middleware por domínio
    controllers/          pedidos HTTP, validação de contexto e respostas
    models/               consultas PostgreSQL parametrizadas
    services/             avaliações, acesso, progresso e pagamentos
    middleware/           autenticação, permissões e tratamento assíncrono
    database/             pool, transações e migrações SQL versionadas
    config/               ambiente, sessão, email e armazenamento local
    sockets/              presença, chamadas e sinalização autenticada
    content/              perguntas frequentes
    utils/                funções de apoio
  scripts/                administração, importação, backup e restauro
  tests/                  integração em schemas PostgreSQL isolados
frontend/
  src/
    pages/NomePage/     JSX, CSS e index.js de cada página
    components/Nome/      JSX, CSS e index.js de cada componente
    context/              sessão, tema, sockets e chamadas
    services/api.js       instância Axios e interceptores
    constants/            constantes partilhadas
    utils/                pesquisa, formatação e validação de ligações
    index.css             reset, tipografia, temas e estilos comuns
scripts/                  arranque e encerramento no Windows
compose.yaml              PostgreSQL local com volume persistente
```

## Demonstração e permissões

A preparação de demonstração acrescenta cinco cursos e oito contas de teste, sem repor os dados existentes.

```powershell
npm --prefix backend run seed
npm --prefix backend run account:promote -- nome_utilizador
```

Em **Administração → Utilizadores**, é possível atribuir os cargos Aluno, Formador, Administrador ou Administrador e formador. Os administradores existentes conservam os dois acessos. A alteração de cargo conserva os dados e invalida as sessões da conta alterada, exigindo novo início de sessão. Não é possível alterar o próprio cargo. O comando `account:promote` concede os acessos de administrador e formador. O arranque normal não cria demos nem promove utilizadores automaticamente.

Os formadores têm a página **Avaliar trabalhos** em `/creator/reviews`, acessível pelo menu e pelo painel do criador. Podem pesquisar e filtrar por curso/tipo, atribuir notas a questionários e aprovar projetos ou pedir alterações com feedback. A lista inclui apenas os cursos que o utilizador pode gerir.

## Funcionalidades

### Criação e revisão de cursos

No editor, **Guardar rascunho** conserva o trabalho sem o enviar para publicação. **Enviar para revisão** valida o conteúdo e notifica a administração. O administrador pode rever todas as aulas e recursos, aprovar a publicação ou enviar um feedback com as alterações necessárias.

O formador consulta a decisão no sino de notificações, no painel do criador e no editor do curso. Depois de corrigir, pode voltar a submeter. A edição retira o curso do catálogo até nova aprovação; os alunos já inscritos conservam o acesso. Os pareceres anteriores continuam nas notificações. Alterações simultâneas são detetadas para evitar sobrescrever ou aprovar uma versão desatualizada.

Os cursos podem ter comunidade opcional, com chats e chamadas normais de voz/vídeo. O certificado é automático e verificável após a conclusão dos requisitos. As opções sem implementação de descontos, cupões, medalhas, certificados personalizados e modos especiais de chamada foram retiradas do editor.

Cursos gratuitos e pagos com simulação de pagamento, biblioteca, progresso, notas, avaliações corrigidas no servidor, projetos e certificados verificáveis. Inclui editor de cursos, revisão administrativa, colaboradores, comunidades, mensagens, amigos, chamadas, perfil com privacidade e centro de ajuda com 33 perguntas. Os tickets de suporte foram removidos.

Os pagamentos são demonstrações, sem cobrança real. Anexos diretos no chat não estão disponíveis; podem ser partilhadas ligações. Os vídeos externos exigem internet e algumas redes de chamadas exigem TURN.

## Verificação

Com o PostgreSQL disponível:

```powershell
npm --prefix backend run check
npm --prefix frontend run check
npm --prefix backend run format:check
npm --prefix frontend run format:check
```

Os testes usam schemas temporários e não alteram as contas da aplicação. Verificam também pedidos simultâneos, rollback, reinício, backup e restauro. O CSS é verificado para impedir `!important`.

## Backup e migração

```powershell
npm --prefix backend run backup
# Restauro apenas para uma base PostgreSQL vazia:
npm --prefix backend run restore -- caminho/do/backup.json
```

A configuração local já foi migrada para PostgreSQL. A cópia SQLite original foi conservada como arquivo e não é utilizada pela aplicação. Os backups contêm dados privados e devem ser guardados fora do servidor.

