# Revisão final — 20 de outubro de 2026

## Resultado das verificações

- Backend: **54 testes aprovados** em PostgreSQL descartável, sem usar contas ou volumes reais.
- Frontend: **57 testes aprovados** em 17 ficheiros, incluindo privacidade, pagamentos, avaliação, cargos, navegação por teclado e metadados.
- ESLint sem erros, formatação consistente e CSS verificado sem `!important`.
- Auditoria npm: **zero avisos conhecidos** nas dependências do backend e do frontend nesta verificação.
- Imagens Docker da API e da interface construídas. API em modo de produção saudável, com migrações executadas por um papel PostgreSQL sem permissões de superutilizador, criação de bases ou criação de papéis.
- Rotas privadas protegidas no teste de produção e configuração Caddy validada. O teste não emitiu certificados públicos nem usou um SMTP real.
- Ficheiro Compose de publicação validado sem carregar credenciais reais.

## Segurança e publicação

O backend valida o ambiente antes de arrancar em produção: origens HTTPS, chave JWT, ligação PostgreSQL, SMTP e opções de desenvolvimento. A simulação de pagamentos está bloqueada no backend e não apresenta um botão de cobrança no build público. Os pagamentos reais não estão implementados.

As chamadas usam ligação direta entre participantes, com STUN, sem servidor TURN, credenciais de relay ou renovação periódica. Algumas redes restritivas podem impedir a ligação. A ligação Socket.IO passa pelo mesmo domínio/proxy quando não há um destino explícito, evitando dependência de localhost em produção.

O pacote de publicação exclui dados, segredos, backups, logs e dependências instaladas. Inclui proxy HTTPS, volumes persistentes, verificações de saúde, API sem utilizador root e base de dados sem porta pública. Os metadados e contactos públicos são configuráveis; builds sem domínio configurado ficam sem indexação.

O guia PUBLICACAO.md explica a configuração, administração, verificação do email, backup e limitações dos serviços externos. A pasta .github contém uma verificação automática para futuros pushes e pull requests; essa execução remota ainda não foi realizada nesta máquina.

## Adaptação aos ecrãs

Foram verificadas larguras de **320, 390, 768, 1024 e 1440 px**, além de **844 × 390 em orientação horizontal**, no navegador disponível. As medições incluíram páginas públicas, registo, perfil, biblioteca, avaliação, editor de cursos, aulas e administração, com matrizes de dimensões diferentes conforme a página. A edição de perfil, o menu de aulas, as notas, os cargos e a sessão foram também verificados por interação.

Correções desta passagem:

- Cabeçalho compacto nos ecrãs de 320 px, com todos os controlos dentro da largura disponível.
- Lista de utilizadores apresentada em cartões abaixo de 640 px; a tabela mantém-se em ecrãs maiores.
- Pesquisa administrativa com espaço próprio para o ícone e áreas de toque maiores.
- Menu da conta com altura limitada e deslocação interna; «Terminar sessão» continua acessível em paisagem.
- Alturas de mensagens, comunidade e aulas adaptadas ao viewport dinâmico e ao espaço do menu inferior.
- Vista de mensagens corrigida para mostrar apenas a área adequada no telemóvel.
- Separadores das aulas com quebra de linha nos ecrãs pequenos.
- Formulários preparados para controlos táteis e redimensionamento do viewport quando suportado pelo teclado virtual.
- Escape fecha primeiro o seletor aberto, mantendo a janela de alteração de cargo. Os botões da janela adaptam-se à largura reduzida.

Estes testes foram feitos por dimensões de viewport no navegador disponível. Não são testes físicos em todos os modelos de telemóvel nem certificação de compatibilidade com todos os navegadores. Câmara, microfone, partilha de ecrã e chamadas entre redes diferentes exigem validação no alojamento e nos dispositivos de destino.

## Legibilidade e correções anteriores preservadas

Frontend, backend e testes têm indentação consistente, propriedades JSX em linhas separadas e espaço entre blocos lógicos. CSS continua separado do JavaScript, sem Tailwind. As regras ficam em Prettier, ESLint e EditorConfig.

Mantêm-se as correções de privacidade persistida do perfil, cancelamento de carregamentos antigos, recuperação de erros da biblioteca, bloqueio de scroll com múltiplos diálogos, rótulos do registo, semântica de navegação e estabilidade dos contextos React em desenvolvimento. A alteração de cargos usa uma janela compacta; a avaliação tem seletores estilizados e filtro por curso.

## Versões de demonstração

A pasta versoes-projeto contém quatro cópias com código e instruções, sem bases de dados ou credenciais. As três primeiras são reconstruções demonstrativas com navegação progressiva: conta/base, cursos e comunidade. A quarta conserva todas as funcionalidades atuais. Cada cópia usa portas, contentor e volume locais próprios, e inclui um manifesto de ficheiros com SHA-256.

As reconstruções não são um histórico real, não incluem commits antigos nem datas de desenvolvimento inventadas. O projeto principal continua a ser a origem para publicação.

## Condições ainda necessárias para abrir ao público

Configurar domínio e alojamento, segredos próprios, contacto e SMTP reais; validar os textos públicos e a entrega do email; testar os percursos principais no domínio HTTPS e em Safari/iOS e Chrome/Android físicos. Para vender cursos é necessária uma integração de pagamentos real.

Esta revisão identifica e corrige problemas concretos, acrescenta testes e prepara a instalação. Não garante a inexistência de todos os bugs ou vulnerabilidades possíveis. Os dados reais e as credenciais existentes não foram incluídos nas cópias nem repostos pelos testes.
