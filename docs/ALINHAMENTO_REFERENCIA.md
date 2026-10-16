# Alinhamento com o projeto de referência

Referência: [PW-P-LAB-TRABALHO-PRATICO](https://github.com/queirospedro07/PW-P-LAB-TRABALHO-PRATICO), commit `8f4553fb24374f7a08401c44c0e2166883ec83d9`.

A comparação foi feita com os ficheiros do repositório. O README da referência menciona React 18, mas o seu package.json usa React 19 e Vite 8.

| Aspeto | Organização aplicada à NEXO |
| --- | --- |
| Divisão principal | backend e frontend, com package.json e lockfile próprios |
| Servidor | Node.js, Express, CommonJS, server.js e app.js separados |
| API | routes/*.routes.js → controllers/*.controller.js → models/*.js |
| Modelos | Objetos exportados com module.exports, operações assíncronas e parâmetros SQL |
| Base de dados | PostgreSQL com pg, connection.js, migrate.js e seed.js |
| Autenticação | JWT, bcryptjs, express-validator e middleware de permissões |
| Interface | React 19, Vite 8 e React Router |
| HTTP | Instância Axios central e chamadas diretas nos consumidores |
| Ícones e gráficos | React Icons e Recharts; gráfico administrativo com dados reais |
| Páginas | pages/NomePage/NomePage.jsx, CSS local e index.js |
| Componentes | components/Nome/Nome.jsx, CSS local e index.js |
| Organização partilhada | context, services, constants e utils |
| CSS | Design global em index.css e CSS por componente, sem framework nem !important |

## Extensões necessárias aos requisitos da NEXO

- Socket.IO e WebRTC para mensagens, presença e chamadas.
- Serviços para avaliações, progresso, certificados e pagamentos, cujas regras são reutilizadas fora dos controladores HTTP.
- Helmet, limites de pedidos, validação SSL e testes de integração para conservar as proteções existentes.
- Migrações SQL versionadas, transações e índices únicos para preservar dados e evitar duplicações.
- Scripts Windows e Compose para o arranque por start.bat com armazenamento persistente.
- Fonte NexoFont local, pedida para esta interface.

As tabelas e os campos mantêm os nomes do domínio da NEXO. As vistas PostgreSQL conservam o contrato da API, evitando alterar os dados existentes. Não há adaptação de sintaxe SQLite em tempo de execução.

O modo de desenvolvimento usa node --watch: a instalação do Nodemon da referência introduziu avisos de segurança em braces/chokidar, sem correção compatível indicada pelo npm audit. As versões das bibliotecas são mantidas atualizadas dentro das tecnologias escolhidas, em vez de copiar versões antigas com vulnerabilidades.
