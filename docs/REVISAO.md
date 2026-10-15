# Revisão do projeto NEXO

Data: 15 de outubro de 2026.

## Resultado e âmbito

Foi feita uma revisão do código, da persistência, dos acessos e dos principais percursos de aluno, formador e administrador. As correções foram implementadas e verificadas com bases de dados temporárias. A interface foi observada no navegador em computador e telemóvel, nos temas claro e escuro. Não foi efetuada publicação, migração da base existente, envio de emails reais nem contratação de serviços externos.

Esta revisão não equivale a uma auditoria independente ou a um teste de intrusão do alojamento final. Não é possível garantir ausência total de vulnerabilidades; os resultados abaixo descrevem verificações concretas desta versão.

## Correções de segurança e integridade

| Problema encontrado | Correção aplicada |
| --- | --- |
| Arranque eliminava objetos da base de dados, repunha contas e acrescentava demonstração automaticamente | Retirada a limpeza destrutiva e a reposição de suspensão. Demonstração exige opção explícita fora de produção. Teste de reinício preserva utilizadores, suspensão, mensagens e submissões. |
| Acesso a cursos pagos podia resultar de inscrição ou comunidade | Acesso exige propriedade, colaboração, administração ou inscrição real. Inscrição paga direta bloqueada. Concessão manual autorizada no painel do formador. |
| Respostas e notas de avaliações dependiam do navegador | Correção e tentativas persistidas no servidor; respostas corretas omitidas antes da submissão. Respostas abertas podem ficar pendentes de revisão. |
| Projetos podiam aparentar aprovação sem avaliação | Submissão persistente por ligação e revisão do formador, com parecer e estado. |
| Certificado podia depender de percentagem declarada | Emissão verifica cada aula, aprovação dos questionários e dos projetos, dentro de transações. Repetição não duplica o certificado. |
| Eventos de comunicação aceitavam identidade e destinos do cliente | JWT e estado da conta verificados na ligação e em cada evento. Identidade obtida da base. Acesso a canais, salas e sinalização verificado no servidor; mensagens enviadas pela API autenticada. |
| Contas ou sessões anteriores continuavam válidas após redefinição da palavra-passe | Versão de sessão persistida, consumo do token de recuperação numa transação e desconexão das ligações anteriores. Suspensão também revoga sessões e desliga os sockets. |
| Publicação contornava a revisão administrativa | Criação/edição por formadores permanece em rascunho; submissão passa a pendente; aprovação administrativa publica. Uma comunidade alheia não pode ser associada ao curso. |
| Respostas a mensagens podiam referenciar outro canal; qualquer membro podia fixar | Referência validada no mesmo canal, apresentação do conteúdo parental limitada ao canal e fixação restrita à equipa de moderação. Resolução de dúvidas também persistida e autorizada. |
| Imagens, URLs e corpos de pedidos sem limites suficientes | Formatos e assinaturas de imagens limitados a JPG/PNG/WebP; URLs executáveis e credenciais em URLs recusadas; limites de profundidade, tamanho, estruturas, aulas, perguntas, documentos e mensagens. |
| Segredo de sessão de exemplo e demonstração em produção | Segredo aleatório temporário apenas como alternativa local; produção recusa segredo ausente, curto ou de exemplo. Registo só cria alunos, exige aceitação explícita dos termos e regista data/versão. |
| Simulação de PostgreSQL com mudança silenciosa de persistência | SQLite é a implementação suportada. Configuração PostgreSQL provoca erro explícito; não há fallback nem migração silenciosa. |

Cabeçalhos de segurança, CORS por origem, limites de pedidos, comparação de permissões na base de dados e parâmetros SQL foram mantidos ou reforçados. A interface de produção inclui CSP; a configuração Vercel acrescenta cabeçalhos próprios. A política permite estilos inline usados pelo React e animações, sem permitir scripts inline ou `eval`.

As palavras-passe novas exigem pelo menos 12 caracteres e no máximo 72 bytes, evitando truncagem silenciosa do bcrypt. A opção de lembrar sessão passou a selecionar armazenamento persistente; por defeito a sessão fica limitada ao separador/navegador atual através de `sessionStorage`. Tokens continuam a ser bearer tokens acessíveis ao JavaScript; proteger o frontend contra XSS e manter uma validade curta continua a ser necessário.

## Interface e funcionalidades

- CSS separado por componente e página, sem Tailwind; tipografia Lexend alojada no próprio projeto.
- Editor de perfil com dados, aparência, redes sociais, validação e pré-visualização; 12 serviços/redes disponíveis.
- Recursos apresentados a partir do conteúdo real do curso, sem exemplos de downloads simulados.
- Questionários, projetos, revisão do formador, concessão de acesso e denúncias ligados à base de dados.
- Criação e edição de canais persistentes, com permissões verificadas; chamadas do curso usam o identificador do canal real.
- Pedidos de suporte e respostas administrativas persistentes, com histórico privado para cada utilizador.
- Ajuda simplificada para descrever as capacidades atuais; retiradas promessas e classificações sem suporte nos dados.
- Estados de erro global e de falta de ligação; mensagens falhadas deixam de permanecer como enviadas apenas localmente.
- Diálogos com foco por teclado, Escape e reposição de foco; verificação do editor em largura de 390 px.
- Código formatado de forma consistente; scripts de verificação e documentação operacional atualizados. Os avisos de manutenção de código legado e dependências de hooks continuam disponíveis numa execução completa do ESLint; a verificação normal bloqueia erros, não esses avisos.

Capturas com dados exclusivamente de demonstração: [editor de perfil](perfil-revisto.jpg) e [suporte](suporte-revisto.jpg).

## Verificações realizadas

| Verificação | Resultado |
| --- | --- |
| `npm --prefix backend run check` | 42 ficheiros JavaScript válidos e 17 testes aprovados |
| Integração com SQLite temporário | Autenticação, privacidade do perfil, papéis, inscrições, conteúdo pago, avaliações, projetos, certificados, mensagens, publicação, canais, suporte e recuperação de conta |
| Sockets de teste | Ligação anónima recusada, entrada em canal não autorizado recusada, mensagem forjada recusada e ligação anterior desligada após recuperação da conta |
| Backup SQLite | Criado um ficheiro separado, aberto em modo de leitura e verificado com `PRAGMA integrity_check` |
| `npm --prefix frontend run check` | ESLint sem erros e build de produção gerado |
| `npm audit` no backend e frontend | Zero vulnerabilidades conhecidas reportadas nesta execução |
| Navegador | Login administrativo numa cópia temporária, painel, perfil, edição e gravação de rede social, visualização móvel/escura e pedido/resposta de suporte |
| Produção local | Página compilada aberta através do preview; ficheiros React e animações separados em bundles próprios |

Os testes de recuperação não enviam email: o token é preparado diretamente na base temporária. A auditoria de dependências só cobre vulnerabilidades publicadas e reconhecidas pelas fontes do npm naquele momento. A verificação visual não substitui uma auditoria de acessibilidade completa nem um teste de todas as combinações de navegador e dispositivo.

## Configuração ainda necessária para produção

1. **Email:** SMTP real para recuperação de conta. Nenhum email foi enviado nesta revisão.
2. **Pagamentos:** não existe gateway ou faturação integrados. A interface informa a indisponibilidade; o formador pode conceder acesso para acordos externos.
3. **Chamadas em redes restritas:** STUN está configurado; TURN autenticado continua por integrar. Não foi validada uma chamada entre duas redes físicas distintas.
4. **Persistência:** SQLite exige disco persistente, uma instância e backups externos. A configuração anterior de alojamento gratuito com ficheiros efémeros não é adequada. A configuração entregue não foi publicada.
5. **Dados anteriores:** não foram apagadas contas conhecidas nem convertidas bases antigas. Reveja contas de demonstração que já existissem antes de publicar. Bases legadas com tabelas inglesas exigem uma migração explícita com backup.
6. **Ficheiros:** anexos no chat estão indisponíveis. Recursos do curso aceitam ligações e PDF/TXT/imagens com limites de tamanho; não há serviço dedicado de armazenamento ou análise antivírus. Para materiais grandes, use um serviço próprio.
7. **Operação:** definir domínios HTTPS, segredos, proxy de confiança, monitorização e política de backups. JWT, SMTP e armazenamento devem ser configurados no ambiente final, sem segredos nas variáveis públicas do frontend.

Veja [DEPLOY.md](../DEPLOY.md) para procedimentos e [MANUAL_UTILIZADOR.md](../MANUAL_UTILIZADOR.md) para utilização.

## Referências técnicas

- [OWASP — Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [OWASP — Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP — File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [Node.js — SQLite](https://nodejs.org/api/sqlite.html)
- [SQLite — backups](https://sqlite.org/backup.html)
- [Render — discos persistentes](https://render.com/docs/disks)
- [Aviso de segurança de source-map-js atualizado durante a revisão](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)
