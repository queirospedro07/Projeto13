# NEXO

Plataforma de cursos e comunidades desenvolvida por Pedro Queirós no âmbito de Programação Web, CTeSP TPSI, IPVC (2025/2026).

## Executar localmente

Requer Node.js 22.16 ou superior e npm. A aplicação usa SQLite nativo; não necessita de PostgreSQL. Os comandos seguintes partem da raiz do projeto.

```powershell
npm --prefix backend ci
npm --prefix frontend ci
Copy-Item backend/.env.example backend/.env
```

Se já existir `backend/.env`, conserve-o. Configure um `JWT_SECRET` aleatório (por exemplo, com `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`). Não utilize o valor de exemplo em produção.

Em dois terminais:

```powershell
npm --prefix backend run dev
npm --prefix frontend run dev
```

Interface: `http://localhost:5173`. API: `http://localhost:5000/api`. O Vite encaminha `/api` e `/socket.io` para o backend. Se definir `VITE_API_URL`, inclua `/api` no fim.

A base de dados é criada sem contas predefinidas. Registe a sua conta de aluno na interface. Para criar o primeiro administrador, defina temporariamente `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_NAME` e `ADMIN_PASSWORD` no terminal do backend e execute `npm run admin:create`. A palavra-passe deve ter pelo menos 12 caracteres e até 72 bytes. O comando recusa substituir contas existentes. Limpe estas variáveis depois de usar.

### Demonstração opcional

`npm --prefix backend run seed` acrescenta conteúdo e contas de demonstração apenas fora de produção. Execute-o exclusivamente numa base de dados local descartável, apontando `DATABASE_PATH` para um ficheiro separado. Essas contas têm credenciais conhecidas; não as coloque num serviço público. O arranque normal não cria contas de demonstração. O login de demonstração está desativado por defeito.

## Funcionalidades

- Catálogo e inscrição gratuita, biblioteca e progresso por aula.
- Editor de cursos com módulos, vídeo, artigos e questionários; publicação sujeita a aprovação administrativa.
- Correção de questionários no servidor, revisão de respostas abertas e submissão de projetos por ligação.
- Certificados após conclusão das aulas e aprovação das avaliações; verificação pública por credencial.
- Comunidades com canais de texto e voz, mensagens diretas, amigos e presença.
- Gestão de colaboradores e concessão manual de acesso a cursos pelo formador.
- Perfil com editor por secções, pré-visualização, imagem, privacidade e 12 redes/serviços.
- Pedidos de suporte persistentes, respostas administrativas e denúncias para moderação.

Pagamentos online não estão integrados. O acesso a cursos pagos é concedido manualmente pela equipa do curso. Os anexos no chat não estão disponíveis; podem partilhar-se ligações. Chamadas usam WebRTC e STUN; redes restritas podem exigir TURN. Consulte [DEPLOY.md](DEPLOY.md) para configuração de produção.

## Organização

```text
backend/
  src/routes/        API por domínio
  src/services/      permissões, avaliações e progresso
  src/middleware/    autenticação, limites e validação
  src/database/      SQLite, esquema e demonstração opcional
  src/sockets/       presença, chamadas e sinalização autenticada
  scripts/           administração e backup
  tests/             integração com bases temporárias
frontend/
  src/pages/         páginas e respetivo CSS
  src/features/      componentes por funcionalidade e respetivo CSS
  src/components/    elementos partilhados, navegação e estados de erro
  src/context/       sessão, tema, comunicação e chamadas
  src/services/      acesso à API
  src/styles/        reset, base e estilos comuns
```

A interface usa React, Vite, CSS separado, Lucide e a fonte Lexend alojada no projeto. Não usa Tailwind. [STYLES.md](frontend/STYLES.md) descreve as camadas CSS. O backend usa Express, SQLite, Socket.IO, bcrypt e JWT.

## Verificação e manutenção

```powershell
npm --prefix backend test
npm --prefix frontend run check
npm --prefix backend audit
npm --prefix frontend audit
npm --prefix backend run backup
```

Os testes usam bases temporárias, sem contas ou emails reais. O backup cria outro ficheiro SQLite consistente na pasta `backups` ao lado da base original, sem a substituir. Guarde uma cópia fora do servidor e teste a restauração antes de depender dela.

[Revisão técnica](docs/REVISAO.md) · [Publicação](DEPLOY.md) · [Manual de utilização](MANUAL_UTILIZADOR.md)
