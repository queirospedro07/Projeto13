# Preparação para publicação

O projeto inclui uma configuração de publicação com frontend compilado, proxy HTTPS, API em modo de produção e PostgreSQL persistente. Preparar o código não publica o site: faltam o domínio, alojamento, credenciais SMTP e a configuração dos serviços externos escolhidos pelo responsável.

## Ambiente local e demonstração

Execute `start.bat` para trabalhar ou apresentar o projeto. Este arranque continua a usar o ambiente local e conserva os dados existentes. Não exponha o Vite nem o PostgreSQL local na internet. As versões em `versoes-projeto` destinam-se à apresentação da evolução e têm bases e portas próprias.

## Instalação num servidor com Docker Compose

1. Copie o código e os ficheiros de dependências. Exclua `node_modules`, `dist`, `.runtime`, `backend/data`, ficheiros `.env` preenchidos e `versoes-projeto`. O `.dockerignore` já impede a sua inclusão nas imagens.
2. Aponte o domínio para o servidor e disponibilize as portas 80 e 443. A API e o PostgreSQL não precisam de portas públicas.
3. Copie `deployment/.env.production.example` para `deployment/.env.production`. Configure o domínio, contacto público de privacidade, SMTP e três segredos diferentes: palavra-passe da base, palavra-passe de administração do PostgreSQL e chave JWT.
4. Gere cada segredo com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Os segredos PostgreSQL deste modelo devem usar letras e números, para poderem integrar a ligação sem codificação adicional. Proteja o ficheiro preenchido no servidor.
5. A partir da raiz do projeto, execute:

```sh
docker compose --env-file deployment/.env.production -f deployment/compose.production.yaml config --quiet
docker compose --env-file deployment/.env.production -f deployment/compose.production.yaml up -d --build
docker compose --env-file deployment/.env.production -f deployment/compose.production.yaml exec -T api npm run production:check
```

O último comando verifica configuração, ligação PostgreSQL, ausência das contas de demonstração conhecidas e autenticação no SMTP. Não envia emails, não apaga contas e não altera a base. Faça depois uma recuperação de palavra-passe para uma conta sua para confirmar a entrega do email.

O Caddy serve os ficheiros da interface, encaminha `/api` e `/socket.io` para a API e gere HTTPS para o domínio configurado. As rotas internas da aplicação conservam o fallback para `index.html`. Consulte a documentação oficial de [SPAs e proxy no Caddy](https://caddyserver.com/docs/caddyfile/patterns) e da [precedência de ambiente no Compose](https://docs.docker.com/compose/how-tos/environment-variables/envvars-precedence/).

Use uma base de produção nova. Não importe o volume de demonstração sem rever contas, palavras-passe e dados. O papel utilizado pela API pode gerir a sua base, mas não é superutilizador do cluster nem pode criar outras bases ou papéis. Os dados persistem em volumes próprios do projeto `nexo-production`.

Para criar o primeiro administrador, forneça `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` e opcionalmente `ADMIN_NAME` ao comando `npm run admin:create` dentro do contentor da API, através do gestor de segredos ou de um ficheiro temporário protegido. O comando não substitui contas existentes. Não guarde estas variáveis no ficheiro de distribuição. Para promover uma conta já registada:

```sh
docker compose --env-file deployment/.env.production -f deployment/compose.production.yaml exec -T api npm run account:promote -- nome_utilizador
```

Este último comando atribui os acessos de administrador e formador e invalida as sessões da conta.

## Funcionalidades que dependem de serviços externos

- **Pagamentos:** continuam a ser simulações no desenvolvimento. Em produção, o servidor bloqueia a simulação e a interface informa que as compras online estão indisponíveis. Cursos gratuitos e inscrições atribuídas pelo formador continuam disponíveis. Cobranças reais exigem integrar e validar um prestador de pagamentos; essa integração não está implementada.
- **Email:** configure uma conta SMTP real. O backend exige configuração em produção; o comando `production:check` verifica a ligação. Credenciais preenchidas no modelo não garantem entrega na caixa de entrada.
- **Chamadas:** usam ligação direta entre participantes, com STUN, sem servidor TURN. É necessário HTTPS para câmara e microfone. Algumas redes móveis, empresariais ou com NAT restritivo podem impedir a ligação direta. A partilha de ecrã depende do suporte do navegador e não está disponível em todos os telemóveis.
- **Vídeos externos:** dependem dos serviços que alojam os vídeos e de acesso à internet.

## Domínio e informação pública

O build do contentor recebe o domínio e o contacto de privacidade da configuração de publicação. Atualiza os metadados, `robots.txt` e `sitemap.xml`. Um build local sem `VITE_SITE_URL` fica com `noindex` e não deve ser indexado. Para construir fora do Docker, configure `VITE_SITE_URL`, `VITE_CONTACT_EMAIL`, `VITE_API_URL` e `VITE_SOCKET_URL` no ambiente do frontend antes de `npm run build`.

Antes de abrir o registo ao público, reveja os textos de termos e privacidade, a identificação do responsável, o contacto, os serviços utilizados e os prazos de conservação de dados. O texto incluído no trabalho não comprova uma revisão jurídica nem conformidade regulamentar.

## Verificação e operação

```powershell
# Backend em PostgreSQL descartável, com remoção automática do contentor:
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-backend.ps1
npm --prefix frontend run check
npm --prefix backend run format:check
npm --prefix frontend run format:check
npm --prefix backend audit
npm --prefix frontend audit
```

Consulte `REVISAO_FINAL.md` para os resultados concretos desta passagem. A verificação responsiva usa dimensões representativas; não substitui testes físicos em Safari/iOS, Chrome/Android e dispositivos com tecnologias de apoio. Confirme no domínio final o registo, início de sessão, recuperação de conta, cursos, avaliações e chamadas entre duas redes diferentes.

Mantenha cópias de segurança cifradas e fora do servidor, incluindo a base e os ficheiros da aplicação. O comando `npm run backup` continua disponível dentro da API; copie o resultado para armazenamento seguro. O restauro só aceita uma base vazia. Não utilize `docker compose down -v` num ambiente com dados a conservar. Nesta configuração os limites de pedidos são guardados na memória de uma única instância da API; múltiplas réplicas exigem um armazenamento partilhado para esses limites e um adaptador Socket.IO adequado.
