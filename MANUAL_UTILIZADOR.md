# NEXO — Manual do Utilizador & Guia de Operação da Plataforma

**Projeto Final de Curso / Dissertação**  
**Ano Letivo:** 2025/2026  
**Versão do Documento:** 2.0  
**Plataforma:** NEXO Learning & Community Platform  
**Ambiente:** Web (Responsive Desktop & Mobile)  

---

## Índice Geral

1. [Introdução & Visão Global](#1-introdução--visão-global)
2. [Requisitos de Sistema & Compatibilidade Técnica](#2-requisitos-de-sistema--compatibilidade-técnica)
3. [Matriz de Perfis de Utilizador & Permissões](#3-matriz-de-perfis-de-utilizador--permissões)
4. [Acesso, Registo de Conta & Demonstração](#4-acesso-registo-de-conta--demonstração)
5. [Manual do Aluno (Estudante)](#5-manual-do-aluno-estudante)
   - 5.1 [Navegação no Catálogo & Pesquisa Inteligente](#51-navegação-no-catálogo--pesquisa-inteligente)
   - 5.2 [Matrícula e Inscrição em Cursos](#52-matrícula-e-inscrição-em-cursos)
   - 5.3 [Sala de Aula & Reprodutor Cinemático](#53-sala-de-aula--reprodutor-cinemático)
   - 5.4 [Caderno de Notas & Recursos Didáticos](#54-caderno-de-notas--recursos-didáticos)
   - 5.5 [Questionários de Avaliação (Quizzes) & Validação de Aulas](#55-questionários-de-avaliação-quizzes--validação-de-aulas)
   - 5.6 [Emissão, Download e Validação Pública de Certificados](#56-emissão-download-e-validação-pública-de-certificados)
6. [Manual do Formador (Criador Pedagógico)](#6-manual-do-formador-criador-pedagógico)
   - 6.1 [Submissão de Candidatura a Formador](#61-submissão-de-candidatura-a-formador)
   - 6.2 [Acesso ao Estúdio de Criação](#62-acesso-ao-estúdio-de-criação)
   - 6.3 [Criação e Configuração Geral de Cursos](#63-criação-e-configuração-geral-de-cursos)
   - 6.4 [Estruturação de Módulos, Aulas e Questionários](#64-estruturação-de-módulos-aulas-e-questionários)
   - 6.5 [Submissão para Moderação e Publicação](#65-submissão-para-moderação-e-publicação)
   - 6.6 [Acompanhamento de Alunos e Avaliações](#66-acompanhamento-de-alunos-e-avaliações)
7. [Manual do Administrador & Moderação](#7-manual-do-administrador--moderação)
   - 7.1 [Painel Central de Administração](#71-painel-central-de-administração)
   - 7.2 [Auditoria e Aprovação de Cursos Pendentes](#72-auditoria-e-aprovação-de-cursos-pendentes)
   - 7.3 [Avaliação de Candidaturas de Formadores](#73-avaliação-de-candidaturas-de-formadores)
   - 7.4 [Gestão de Utilizadores, Perfis e Suspensões](#74-gestão-de-utilizadores-perfis-e-suspensões)
   - 7.5 [Gestão do Sistema de Tickets & Suporte](#75-gestão-do-sistema-de-tickets--suporte)
8. [Comunidade & Salas de Mentoria WebRTC](#8-comunidade--salas-de-mentoria-webrtc)
   - 8.1 [Canais de Conversação & Fórum Q&A](#81-canais-de-conversação--fórum-qa)
   - 8.2 [Comunicação WebRTC de Áudio e Vídeo em Tempo Real](#82-comunicação-webrtc-de-áudio-e-vídeo-em-tempo-real)
   - 8.3 [Partilha de Ecrã em Alta Resolução (60 FPS)](#83-partilha-de-ecrã-em-alta-resolução-60-fps)
   - 8.4 [Chamada em Segundo Plano (Active Call Banner)](#84-chamada-em-segundo-plano-active-call-banner)
   - 8.5 [Mensagens Diretas (DMs) & Pedidos Prévios](#85-mensagens-diretas-dms--pedidos-prévios)
9. [Privacidade, Gestão de Conta & Proteção de Dados (RGPD)](#9-privacidade-gestão-de-conta--proteção-de-dados-rgpd)
   - 9.1 [Definições de Privacidade & Mensagens Diretas](#91-definições-de-privacidade--mensagens-diretas)
   - 9.2 [Gestão do Perfil e Sessões de Utilizador](#92-gestão-do-perfil-e-sessões-de-utilizador)
   - 9.3 [Conformidade com o RGPD & Eliminação de Conta](#93-conformidade-com-o-rgpd--eliminação-de-conta)
10. [Resolução de Problemas (Troubleshooting)](#10-resolução-de-problemas-troubleshooting)
11. [Glossário & Contactos](#11-glossário--contactos)

---

## 1. Introdução & Visão Global

A **NEXO** é uma plataforma integrada de formação prática e colaboração académica, concebida para unir cursos digitais estruturados, mentoria em direto sem intermediários e uma comunidade ativa em regime contínuo.

### Pilares Fundamentais:
1. **Ensino Prático Aplicado:** Conteúdos modulares com vídeo, documentação técnica, blocos de código e testes de avaliação interativos.
2. **Mentoria WebRTC em Tempo Real:** Canais de voz, vídeo e partilha de ecrã a 60 FPS que funcionam diretamente no navegador sem necessidade de plugins ou software externo.
3. **Certificação Digital Criptográfica:** Diplomas digitais oficiais com identificador único verificável universalmente por entidades empregadoras.
4. **Acompanhamento e Progresso Contínuo:** Registo persistente de aulas concluídas, cálculo automático de percentagem de curso e retoma exata no reprodutor.
5. **Estúdio Pedagógico para Formadores:** Ferramentas intuitivas de publicação, estruturação hierárquica e gestão de turmas.

---

## 2. Requisitos de Sistema & Compatibilidade Técnica

A plataforma foi desenhada segundo a metodologia *Mobile-First*, garantindo adaptação total a qualquer resolução de ecrã (computadores de secretária, portáteis, tablets e smartphones).

### 2.1 Navegadores Suportados
| Navegador | Versão Mínima | Suporte WebRTC | Reprodutor de Vídeo |
|---|---|---|---|
| **Google Chrome** | 90+ | Total (H.264 / VP8 / Opus) | Aceleração Hardware |
| **Mozilla Firefox** | 88+ | Total (H.264 / VP8 / Opus) | Aceleração Hardware |
| **Microsoft Edge** | 90+ | Total (Chromium) | Aceleração Hardware |
| **Apple Safari** | 15+ (macOS / iOS) | Total | Aceleração Hardware |

### 2.2 Requisitos de Conetividade
- **Navegação geral e aulas gravadas:** Mínimo de 3 a 5 Mbps de débito descendente (*download*).
- **Aulas em Full HD e download de ficheiros:** 10 Mbps recomendados.
- **Transmissão WebRTC (Voz + Vídeo + Partilha de Ecrã):** Mínimo de 5 Mbps de *download* e 2 Mbps de *upload*, com latência (Ping) inferior a 100 ms.

### 2.3 Dispositivos Periféricos (Salas WebRTC)
- Microfone integrado ou auscultadores com microfone (*headset*).
- Câmara Web (opcional para transmissões com vídeo).
- Altifalantes ou auscultadores estéreo.

---

## 3. Matriz de Perfis de Utilizador & Permissões

O NEXO adota controlo de acessos baseado em perfis (RBAC — *Role-Based Access Control*):

| Funcionalidade | Visitante | Aluno (STUDENT) | Formador (CREATOR) | Administrador (ADMIN) |
|---|:---:|:---:|:---:|:---:|
| Explorar catálogo público | Sim | Sim | Sim | Sim |
| Criar conta e personalizar perfil | Sim | Sim | Sim | Sim |
| Matrícula e frequência de cursos | Não | Sim | Sim (acesso total) | Sim (acesso total) |
| Descarregar recursos didáticos | Não | Sim | Sim | Sim |
| Obter e verificar certificados | Não | Sim | Sim | Sim |
| Entrar em canais WebRTC e partilhar ecrã | Não | Sim | Sim | Sim |
| Submeter candidatura a formador | Não | Sim | Já credenciado | Já credenciado |
| Aceder ao Estúdio de Criação (`/creator`) | Não | Não | Sim | Sim |
| Criar, editar módulos e quizzes | Não | Não | Sim (seus cursos) | Sim (todos) |
| Aprovar/Rejeitar cursos pendentes | Não | Não | Não | Sim |
| Analisar candidaturas de formadores | Não | Não | Não | Sim |
| Suspender contas e auditar tickets | Não | Não | Não | Sim |

---

## 4. Acesso, Registo de Conta & Demonstração

### 4.1 Registo de Nova Conta
1. No cabeçalho da plataforma, clique no botão **Criar Conta**.
2. Preencha os campos obrigatórios:
   - **Nome:** Nome próprio e apelido (utilizados na emissão oficial de certificados).
   - **Nome de utilizador:** 3 a 30 caracteres alfanuméricos sem espaços (ex.: `pedro_silva`).
   - **Email:** Endereço de correio eletrónico válido.
   - **Palavra-passe:** Mínimo de 6 caracteres.
3. Por omissão, é atribuído automaticamente um avatar padrão de alta definição, não sendo obrigatório carregar ficheiros no registo.
4. Aceite os Termos de Utilização e prima **Criar Conta Gratuita**. O utilizador é autenticado de imediato e encaminhado para o seu painel pessoal.

### 4.2 Início de Sessão
1. Clique em **Entrar**.
2. Insira o email ou nome de utilizador e a palavra-passe.
3. Caso tenha esquecido a palavra-passe, selecione a ligação **Esqueci-me da palavra-passe** para receber instruções de recuperação.

### 4.3 Contas de Demonstração (Ambiente de Avaliação Local)
Para efeitos de testes rápidos e avaliação curricular, estão disponíveis contas pré-configuradas no ambiente local com a palavra-passe `nexoDemo2026!`:
- **Administrador:** `admin@nexo.pt`
- **Formadores:** `sofia.almeida@nexo.pt`, `miguel.ferreira@nexo.pt`
- **Alunos:** `marta.lopes@nexo.pt`, `diogo.costa@nexo.pt`, `beatriz.martins@nexo.pt`, `joao.neves@nexo.pt`

---

## 5. Manual do Aluno (Estudante)

### 5.1 Navegação no Catálogo & Pesquisa Inteligente
- Aceda a **Explorar** na barra de navegação.
- Utilize os filtros por categoria (Programação, Design & UI/UX, Inteligência Artificial, DevOps e Gestão).
- Filtre por nível de experiência: *Iniciante*, *Intermédio* ou *Avançado*.
- Utilize a barra de pesquisa para encontrar tecnologias ou tópicos específicos com resultados instantâneos.

### 5.2 Matrícula e Inscrição em Cursos
1. Na grelha de cursos, selecione a formação pretendida para abrir a página detalhada.
2. Analise os objetivos do curso, a biografia do formador, a carga horária estimada e o índice curricular de módulos.
3. Clique em **Inscrever no Curso** ou **Começar a Aprender**.
4. O curso fica imediatamente associado à sua conta e acessível a partir da sua biblioteca pessoal e do painel principal.

### 5.3 Sala de Aula & Reprodutor Cinemático
Ao entrar numa aula (`/learn/:courseId`), o aluno beneficia de um reprodutor de vídeo de alta fidelidade:
- **Aceleração da Reprodução:** Altere a velocidade entre 0.75x, 1.0x, 1.25x, 1.5x e 2.0x.
- **Atalhos de Teclado:**
  - `[Barra de Espaço]` ou `[K]`: Pausar / Retomar reprodução.
  - `[Seta Esquerda]` / `[J]`: Recuar 5 segundos.
  - `[Seta Direita]` / `[L]`: Avançar 5 segundos.
  - `[M]`: Silenciar / Reativar som.
  - `[F]`: Modo de ecrã inteiro.
- **Avanço Automático:** Quando uma aula termina, o sistema pode avançar automaticamente para a aula seguinte se a opção estiver ativada.

### 5.4 Caderno de Notas & Recursos Didáticos
- **Notas Sincronizadas:** Na aba *Caderno de Notas*, redija apontamentos pessoais enquanto assiste à aula. As notas ficam guardadas na base de dados com a marca temporal (*timestamp*) da aula.
- **Recursos de Apoio:** Na aba *Recursos*, consulte e descarregue diapositivos, ficheiros PDF, código-fonte e ligações a repositórios GitHub disponibilizados pelo formador.
- **Dúvidas & Q&A:** Coloque questões contextualizadas sobre a aula. O formador e os colegas de turma podem responder e as melhores soluções são destacadas.

### 5.5 Questionários de Avaliação (Quizzes) & Validação de Aulas
1. Ao concluir uma aula prática, prima o botão **Concluir Aula** para registar o progresso no servidor e receber os pontos de XP correspondentes.
2. Em módulos avaliativos, responda ao questionário de escolha múltipla.
3. Ao submeter, o sistema apresenta a nota percentual obtida e o feedback imediato para cada alternativa.
4. Para aprovação no módulo, deve alcançar a percentagem mínima definida pelo formador (por exemplo, 70%). Pode repetir o teste caso necessário.

### 5.6 Emissão, Download e Validação Pública de Certificados
1. Assim que 100% das aulas e quizzes do curso forem concluídos com aproveitamento, o diploma digital é gerado de forma automática.
2. Aceda à secção **Certificados** no menu pessoal.
3. Visualize o diploma em alta resolução com o selo institucional do NEXO, carga horária e identificador criptográfico único (ex.: `NEXO-CERT-2026-XXXX`).
4. **Guardar em PDF:** Prima o botão *Descarregar PDF / Imprimir* para obter o documento vetorial oficial pronto para anexar a candidaturas profissionais.
5. **Partilha & Validação:** Clique em *Partilhar no LinkedIn* ou copie o código de verificação para que recrutadores possam comprovar a autenticidade da credencial na página pública `/certificates/verify/:id`.

---

## 6. Manual do Formador (Criador Pedagógico)

### 6.1 Submissão de Candidatura a Formador
1. Caso tenha registado a conta como aluno, clique em **Candidatura a Formador** (no rodapé ou no menu de perfil).
2. Preencha o inquérito pedagógico: área de especialidade, anos de experiência profissional, portfólio/LinkedIn e proposta temática para os primeiros cursos.
3. A equipa de administração do NEXO avalia o pedido no prazo habitual de 24 a 48 horas. Após a validação, a conta é promovida a **CREATOR** e o Estúdio fica desbloqueado.

### 6.2 Acesso ao Estúdio de Criação
- No menu principal ou no perfil, selecione **Estúdio do Formador** (ou aceda a `/creator`).
- O painel apresenta as métricas de formador: total de cursos publicados, alunos matriculados, avaliações médias e cursos em rascunho.

### 6.3 Criação e Configuração Geral de Cursos
1. No Estúdio, clique em **Criar Novo Curso**.
2. Preencha a informação base:
   - **Título do Curso:** Claro, apelativo e focado nas competências adquiridas.
   - **Descrição & Sumário:** Contextualização completa dos temas abordados.
   - **Categoria Temática:** Selecione a área correspondente.
   - **Nível:** Iniciante, Intermédio ou Avançado.
   - **Preço:** Defina se o curso é Gratuito ou Estabeleça o Valor em Euros (€).
   - **Imagem de Capa:** Carregue uma imagem em alta definição (16:9) e utilize o seletor visual de enquadramento para garantir a melhor apresentação no catálogo.

### 6.4 Estruturação de Módulos, Aulas e Questionários
1. **Adicionar Módulos:** Divida o conteúdo em unidades curriculares lógicas (ex.: "Módulo 1: Fundamentos", "Módulo 2: Projeto Prático").
2. **Adicionar Aulas:**
   - **Aulas em Vídeo:** Introduza o título, descrição, duração estimada e ligação de vídeo (suporte a YouTube, Vimeo ou ficheiros diretos).
   - **Aulas de Leitura/Artigo:** Insira texto estruturado com formatação de código e referências.
   - **Recursos Anexos:** Anexe documentos em PDF, diapositivos ou ficheiros compactados de apoio.
3. **Construtor de Quizzes:**
   - Adicione questões de escolha múltipla.
   - Defina as opções de resposta e assinale a opção correta.
   - Escreva a justificação pedagógica de cada resposta e defina a nota mínima para aprovação.

### 6.5 Submissão para Moderação e Publicação
- Enquanto constrói a formação, o curso permanece no estado **RASCUNHO**.
- Ao concluir a estrutura pedagógica, clique em **Submeter para Aprovação**.
- O curso transita para o estado **PENDENTE**. A coordenação pedagógica analisa a conformidade do material e aprova a publicação no catálogo público.
- *Nota:* O formador tem sempre acesso total e gratuito aos seus próprios cursos para testar e verificar a experiência do aluno.

### 6.6 Acompanhamento de Alunos e Avaliações
- Na secção de métricas do estúdio, acompanhe a taxa de conclusão dos alunos, as avaliações por estrelas e o feedback deixado no fórum de apoio de cada aula.

---

## 7. Manual do Administrador & Moderação

### 7.1 Painel Central de Administração
Aceda à consola administrativa através da rota `/admin`. O painel central oferece visão analítica em tempo real:
- Total de utilizadores registados e utilizadores ativos.
- Volume de cursos publicados e cursos a aguardar validação.
- Rácio de candidaturas a formador pendentes de análise.
- Tickets de suporte abertos e tempo médio de resolução.

### 7.2 Auditoria e Aprovação de Cursos Pendentes
1. No menu lateral da administração, selecione **Cursos**.
2. Filtre pela listagem de cursos no estado **Pendente**.
3. Abra a ficha técnica do curso para auditar:
   - Coerência do título, descrição e objetivos pedagógicos.
   - Funcionamento dos links de vídeo e qualidade das miniaturas.
   - Presença de recursos didáticos e clareza dos quizzes avaliativos.
4. Escolha **Aprovar** para colocar o curso imediatamente no ar, ou **Rejeitar** indicando ao autor os pontos a corrigir.

### 7.3 Avaliação de Candidaturas de Formadores
1. Selecione a aba **Candidaturas**.
2. Consulte os dados do candidato, experiência profissional comprovada e currículo curricular proposto.
3. Clique em **Aprovar Candidatura** para promover instantaneamente o utilizador a `CREATOR` ou **Recusar** com mensagem explicativa.

### 7.4 Gestão de Utilizadores, Perfis e Suspensões
- Pesquise utilizadores por nome, endereço de email ou username.
- Possibilidade de alterar manualmente o papel de qualquer conta (`STUDENT`, `CREATOR`, `ADMIN`).
- Em casos de infração das normas comunitárias, o administrador pode **Suspender Temporariamente** ou reativar contas.

### 7.5 Gestão do Sistema de Tickets & Suporte
- Visualização de todos os tickets de suporte criados por formandos e formadores.
- Filtragem por prioridade (*Baixa*, *Média*, *Alta*, *Crítica*) e por estado (*Aberto*, *Respondido*, *Fechado*).
- Resposta técnica direta através do chat interno do ticket e encerramento do processo após resolução.

---

## 8. Comunidade & Salas de Mentoria WebRTC

### 8.1 Canais de Conversação & Fórum Q&A
- Aceda a **Comunidade** para entrar nos espaços temáticos partilhados da plataforma.
- Participe em conversas de texto, partilhe snippets de código formatados e ficheiros de estudo com os colegas de turma.

### 8.2 Comunicação WebRTC de Áudio e Vídeo em Tempo Real
- As salas de mentoria utilizam a tecnologia nativa **WebRTC** com canais de áudio de alta fidelidade e cancelamento acústico de eco.
- **Entrada na Sala:** Ao aceder a um canal de voz/vídeo, o navegador solicita permissão para o microfone e câmara. Selecione *Permitir*.
- **Controlos de Comunicação:**
  - Botão de microfone para silenciar / ativar fala rápida.
  - Botão de câmara para ligar / desligar imagem de vídeo.
  - Indicador de estado de ligação com ping em tempo real.

### 8.3 Partilha de Ecrã em Alta Resolução (60 FPS)
- Prima o botão **Partilhar Ecrã** durante uma sessão de estudo ou mentoria.
- Escolha transmitir o ecrã completo, uma janela de desenvolvimento (ex.: VS Code) ou um separador do browser.
- Permite a resolução conjunta de bugs, apresentação de trabalhos ou demonstrações ao vivo do formador.

### 8.4 Chamada em Segundo Plano (Active Call Banner)
- Caso necessite de navegar por outras áreas da plataforma (como consultar um curso ou rever o caderno de notas) enquanto conversa, a ligação WebRTC permanece ativa.
- Uma barra superior flutuante (*Active Call Banner*) permite mutar o microfone, desligar a chamada ou regressar à sala com um só clique, sem interromper o áudio.

### 8.5 Mensagens Diretas (DMs) & Pedidos Prévios
- Em **Mensagens**, comunique de forma privada com outros formandos e formadores.
- **Controlo de Privacidade:** Nas Definições, pode restringir quem lhe pode enviar mensagens (Todos, Apenas Amigos ou Desativado).
- **Pedidos de Mensagem:** Mensagens de utilizadores fora da sua lista de contactos ficam retidas numa aba de pedidos para aprovação prévia, garantindo a sua privacidade e segurança contra spam.

---

## 9. Privacidade, Gestão de Conta & Proteção de Dados (RGPD)

O NEXO prioriza o controlo rigoroso de dados e a segurança das comunicações entre alunos e formadores.

### 9.1 Definições de Privacidade & Mensagens Diretas
- Nas Definições de Conta (`/settings`), pode regular quem tem permissão para lhe enviar mensagens privadas:
  - **Todos os Utilizadores:** Canal aberto com qualquer membro registado.
  - **Apenas Amigos Mútuos:** Restrito a utilizadores com conexão recíproca.
  - **Apenas Colegas de Turma & Formadores:** Comunicação focada no contexto formativo.
  - **Desativado:** Inibe a receção de novas mensagens diretas.
- **Sistema de Pedidos Prévios:** Quando um formando sem ligação mútua envia uma mensagem, esta é retida numa caixa de entrada separada de pedidos, permitindo aceitar ou recusar a conversa com total discrição.

### 9.2 Gestão do Perfil e Sessões de Utilizador
- Personalização de nome, biografia, redes sociais e foto de perfil.
- Ajuste interativo da posição de enquadramento do banner de capa.
- Monitorização de sessões ativas e histórico de acessos seguros.

### 9.3 Conformidade com o RGPD & Eliminação de Conta
- A plataforma cumpre integralmente o Regulamento Geral sobre a Proteção de Dados (RGPD).
- Os formandos têm direito à portabilidade e exportação dos seus dados de aprendizagem.
- Possibilidade de encerramento e eliminação definitiva de conta a pedido do utilizador.

---

## 10. Resolução de Problemas (Troubleshooting)

### 10.1 Não consigo iniciar sessão ou recebo credenciais inválidas
- Verifique se o endereço de email e a palavra-passe não contêm espaços acidentais no início ou no fim.
- Certifique-se de que a tecla `Caps Lock` não está ativada.
- Utilize a hiperligação **Esqueceu-se da palavra-passe?** para receber um email seguro de redefinição com validade de 15 minutos.

### 10.2 O vídeo da aula não reproduz ou apresenta ecrã negro
1. Desative temporariamente extensões agressivas de bloqueio de anúncios ou scripts (*adblockers*) que possam impedir leitores incorporados.
2. Force a atualização da página utilizando a combinação de teclas `[Ctrl + F5]` (Windows) ou `[Cmd + Shift + R]` (Mac).
3. Verifique nas definições do navegador se a opção de aceleração gráfica por hardware está ativada.

### 10.3 Sem áudio ou câmara bloqueada nas Salas WebRTC
1. Clique no ícone do cadeado junto ao endereço URL do navegador (barra de endereços) e confirme se as permissões de **Microfone** e **Câmara** estão definidas como **Permitir**.
2. Certifique-se de que nenhuma outra aplicação aberta no computador (Teams, Zoom, Discord, Skype) está a utilizar em exclusivo o dispositivo de captura de áudio ou vídeo.
3. Se verificar eco, utilize auscultadores com microfone (*headset*).

### 10.4 O curso concluído não gerou certificado
- Confirme se todas as aulas e questionários do currículo apresentam o ícone de validação a verde (100% de progresso). Se faltar algum quiz obrigatório, o certificado permanece bloqueado até à sua conclusão.

### 10.5 Onde pedir suporte técnico adicional?
- Aceda a **Ajuda e Suporte** na plataforma e abra um ticket oficial na aba **Os Meus Tickets**. A equipa técnica responderá no próprio painel.

---

## 11. Glossário & Contactos

- **WebRTC (Web Real-Time Communication):** Protocolo de comunicação ponto-a-ponto no browser que viabiliza chamadas de áudio, vídeo e partilha de ecrã em alta definição e com latência ultra-reduzida.
- **RBAC (Role-Based Access Control):** Arquitetura de segurança que define permissões rigorosas de acordo com a função do utilizador (Aluno, Formador ou Administrador).
- **XP (Experience Points):** Pontos de experiência atribuídos pelas atividades de aprendizagem para evolução de nível no perfil.
- **Streak:** Registo contínuo de dias sucessivos de estudo na plataforma.
- **Hash de Certificação:** Identificador criptográfico alfanumérico único gravado no certificado digital para verificação pública global da formação.

**Contacto de Apoio Pedagógico:** suporte@nexo.pt  
**Repositório do Projeto:** NEXO Platform 2025/2026