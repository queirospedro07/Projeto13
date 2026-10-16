# Arquitetura

A estrutura foi alinhada com [PW-P-LAB-TRABALHO-PRATICO](https://github.com/queirospedro07/PW-P-LAB-TRABALHO-PRATICO), analisado no commit `8f4553f`.

## Backend

O backend usa CommonJS (`require` e `module.exports`), com `app.js` separado de `server.js`. Os modelos exportam objetos com métodos assíncronos. O fluxo HTTP é `routes → controllers → models → PostgreSQL`. As rotas registam endpoints e middleware; os controladores tratam o pedido e a resposta; os modelos contêm SQL parametrizado. As regras partilhadas de acesso, avaliação, progresso e simulação de pagamentos ficam em `services`.

`database/connection.js` gere o pool `pg`. As operações são assíncronas; as transações utilizam um cliente reservado e AsyncLocalStorage para que todas as consultas de uma operação usem o mesmo cliente. Transações aninhadas usam savepoints. Os bloqueios transacionais e os índices únicos impedem inscrições, aprovações de pagamento e certificados duplicados em pedidos simultâneos.

As tabelas em português foram conservadas para preservar os dados. As vistas de leitura apresentam os nomes de campos da API. Os modelos usam SQL PostgreSQL explícito, com parâmetros `$1`, `$2`, etc. Não existe tradutor SQL em tempo de execução, viewMappings.js ou dependência SQLite na aplicação.

`database/migrations` contém migrações SQL versionadas. O histórico guarda um checksum de cada ficheiro e recusa alterações a migrações já aplicadas. O arranque não limpa dados nem cria demonstrações.

A importação inicial foi verificada por contagens e checksums. O ficheiro SQLite original e a ferramenta de migração foram conservados como arquivo, fora do código de execução.

## Frontend

React 19 e Vite 8, com React Router e Axios. As páginas ficam em `pages/NomePage`, e os componentes em `components/NomeComponente`, com ficheiros JSX, CSS e `index.js` juntos. Os contextos tratam sessão, tema e comunicação; o acesso HTTP fica em `services/api.js`.

React Icons fornece os ícones e Recharts apresenta os gráficos administrativos com dados reais. Framer Motion, Lucide e clsx foram removidos. As animações simples usam CSS e React. Socket.IO e WebRTC suportam a comunidade e as chamadas. A fonte NexoFont mantém-se local.

`services/api.js` exporta uma instância Axios com interceptores. Páginas, componentes e contextos usam diretamente get, post, put e delete. Cada página segue a convenção NomePage, com exportação por omissão. O carregamento diferido usa React.lazy diretamente.

O design global fica em index.css; cada página e componente mantém o seu CSS na própria pasta. As camadas CSS são `reset, base, ui, components, pages, overrides`, declaradas em `index.css`. Não se utiliza `!important`. Os valores dinâmicos passam por variáveis CSS; os estilos visuais ficam nos ficheiros CSS. ESLint e Prettier estão configurados nos dois projetos.

## Operação

`start.bat` inicia o PostgreSQL local através do Compose, aplica migrações e verifica a API, o frontend e o proxy. O volume Docker `nexo-postgres-data` conserva os dados. Os ficheiros de `.runtime` são auxiliares de execução, não código da aplicação. `stop.bat` encerra apenas processos registados pelo arranque, conferindo o PID e a data de criação.

`DATA_DIRECTORY` guarda a chave local de sessão e os backups; a base de dados está no PostgreSQL definido por `DATABASE_URL`. Em produção, `JWT_SECRET` é obrigatório e deve manter-se entre publicações. `PGSSL=true` ativa SSL com verificação do certificado.

Os backups são snapshots JSON consistentes do PostgreSQL, obtidos numa transação de leitura repetível. O restauro verifica as tabelas e colunas permitidas, usa parâmetros SQL e exige uma base vazia. Os testes executam também um restauro real num schema separado.

## Verificações

A suite cobre autenticação, permissões, publicação, avaliações, projetos, certificados, mensagens, sockets, recuperação de conta, persistência e isolamento entre utilizadores. Os testes PostgreSQL adicionais verificam pedidos simultâneos, transações aninhadas e restauro. A compilação e a formatação do frontend são verificadas separadamente. Estes testes não substituem uma revisão visual manual da interface.

