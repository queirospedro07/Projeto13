# NEXO — Manual de Utilizador

**Unidade Curricular:** Programação Web  
**Curso:** CTeSP em Tecnologias e Programação de Sistemas de Informação (TPSI) — IPVC  
**Ano Letivo:** 2025/2026  

---

## Índice

1. [Introdução](#1-introdução)
2. [Perfis de Utilizador e Permissões](#2-perfis-de-utilizador-e-permissões)
3. [Registo, Login e Contas de Teste](#3-registo-login-e-contas-de-teste)
4. [Área do Aluno](#4-área-do-aluno)
5. [Área do Formador](#5-área-do-formador)
6. [Área de Administração](#6-área-de-administração)
7. [Comunidade, Chat e Chamadas de Voz/Vídeo](#7-comunidade-chat-e-chamadas-de-vozvídeo)
8. [Definições de Conta e Privacidade](#8-definições-de-conta-e-privacidade)
9. [Resolução de Problemas Comuns](#9-resolução-de-problemas-comuns)

---

## 1. Introdução

O **NEXO** é uma aplicação web de aprendizagem e comunidade onde os utilizadores podem assistir a cursos online, resolver questionários, tirar dúvidas com formadores e colegas, e participar em canais de texto e salas de voz/vídeo.

A interface adapta-se tanto a computadores como a telemóveis e inclui suporte para modo claro e modo escuro.

---

## 2. Perfis de Utilizador e Permissões

A aplicação utiliza quatro níveis de acesso:

| Funcionalidade | Visitante | Aluno (`STUDENT`) | Formador (`CREATOR`) | Admin (`ADMIN` / `SUBADMIN`) |
|---|:---:|:---:|:---:|:---:|
| Ver catálogo público de cursos | Sim | Sim | Sim | Sim |
| Criar conta e editar perfil | Sim | Sim | Sim | Sim |
| Inscrever-se e assistir a cursos | Não | Sim | Sim | Sim |
| Descarregar materiais de apoio | Não | Sim | Sim | Sim |
| Receber e validar certificados | Não | Sim | Sim | Sim |
| Participar em canais e chamadas de voz/vídeo | Não | Sim | Sim | Sim |
| Candidatar-se a formador | Não | Sim | — | — |
| Aceder ao Estúdio do Criador (`/creator`) | Não | Não | Sim | Sim |
| Criar e editar cursos, módulos e quizzes | Não | Não | Sim (próprios) | Sim |
| Aprovar/rejeitar cursos submetidos | Não | Não | Não | Sim |
| Avaliar candidaturas e gerir utilizadores | Não | Não | Não | Sim |

---

## 3. Registo, Login e Contas de Teste

### 3.1 Criar uma Conta Nova
1. No topo da página, clicar em **Criar Conta**.
2. Preencher o nome completo, nome de utilizador, email e palavra-passe (mínimo de 6 caracteres).
3. Todas as contas novas começam com o perfil de **Aluno** (`STUDENT`).

### 3.2 Iniciar Sessão
1. Clicar em **Entrar** na barra superior.
2. Introduzir o email (ou nome de utilizador) e a palavra-passe.
3. Caso não se lembre da palavra-passe, utilizar a ligação **Esqueceu-se da palavra-passe?**.

### 3.3 Contas de Teste (Ambiente Local)
Para testar os diferentes perfis sem criar contas manualmente, a base de dados local já traz as seguintes contas configuradas:

**Contas principais** (palavra-passe: `password123`):
- **Aluno:** `aluno@nexo.pt` (Pedro Silva)
- **Formadora:** `mariana@nexo.pt` (Mariana Costa)
- **Administrador:** `admin@nexo.pt` (Rui Oliveira)
- **Aluno com candidatura a formador:** `tiago@nexo.pt` (Tiago Ramos)

**Contas adicionais** (palavra-passe: `nexoDemo2026!`):
- **Formadores:** `sofia.almeida@nexo.pt`, `miguel.ferreira@nexo.pt`
- **Alunos:** `marta.lopes@nexo.pt`, `diogo.costa@nexo.pt`, `beatriz.martins@nexo.pt`, `joao.neves@nexo.pt`

---

## 4. Área do Aluno

### 4.1 Explorar e Inscrever-se em Cursos
1. Aceder a **Explorar** no menu de navegação.
2. Filtrar os cursos por categoria, nível de dificuldade (*Iniciante*, *Intermédio* ou *Avançado*) ou pesquisar pelo nome.
3. Clicar num curso para ver a descrição, os módulos incluídos e os objetivos de aprendizagem.
4. Clicar em **Inscrever no Curso** para o adicionar à biblioteca pessoal.

### 4.2 Sala de Aula (`/learn/:courseId`)
Dentro da página de aprendizagem do curso é possível:
- **Assistir às aulas em vídeo** (com controlo de velocidade de reprodução entre 0.75x e 2x) ou ler os conteúdos de texto.
- **Tirar notas pessoais:** na aba *Notas*, escrever apontamentos sobre a aula que ficam guardados automaticamente na conta do aluno.
- **Descarregar recursos:** na aba *Recursos* ou na secção de documentos do curso, abrir ou transferir ficheiros PDF e materiais deixados pelo formador.
- **Colocar dúvidas (Q&A):** publicar perguntas sobre a matéria e ver respostas de colegas ou do formador.

### 4.3 Questionários (Quizzes) e Progresso
1. No fim de cada aula, clicar em **Concluir Aula** para atualizar a barra de progresso do curso.
2. Nas aulas do tipo **Quiz**, responder às perguntas e submeter para ver a nota obtida e a correção.
3. O aluno pode repetir o questionário caso não atinja a nota mínima definida pelo formador.

### 4.4 Certificados
1. Quando o progresso do curso chega a 100%, é emitido um certificado digital associado à conta do aluno.
2. O certificado pode ser aberto, impresso/guardado em PDF e validado através do código único na rota pública `/certificates/verify/:id`.

---

## 5. Área do Formador

### 5.1 Candidatura a Formador
1. Um aluno que queira lecionar cursos pode aceder a **Candidatura a Formador** (através das Definições ou da página inicial).
2. Preencher os dados pedidos (área de especialidade, anos de experiência, link de portfólio/GitHub e proposta de cursos) e submeter.
3. Se a candidatura for recusada, o utilizador pode corrigir os dados e submeter uma nova candidatura. Assim que for aprovada por um administrador, passa a ter o perfil `CREATOR`.

### 5.2 Estúdio do Criador e Construtor de Cursos (`/creator`)
1. No painel do formador são apresentados os números de alunos inscritos, avaliações e lista de cursos criados.
2. Ao clicar em **Novo Curso**, abre-se o construtor onde o formador pode:
   - Preencher título, descrição, categoria, dificuldade, preço e imagens de capa/banner;
   - Criar módulos e adicionar aulas (vídeo, texto, código ou quiz);
   - Anexar documentos de apoio e configurar os canais da comunidade do curso;
   - Guardar como rascunho ou **Submeter para Aprovação** da administração.

---

## 6. Área de Administração

### 6.1 Painel de Administração (`/admin`)
Acessível a contas com perfil `ADMIN` ou `SUBADMIN`. Permite:
- **Visão Geral:** consultar o total de utilizadores, cursos publicados, candidaturas pendentes e tickets de suporte.
- **Moderação de Cursos:** rever cursos submetidos pelos formadores e aprová-los (ficando visíveis no catálogo) ou rejeitá-los com uma nota de feedback.
- **Candidaturas:** aprovar ou recusar candidaturas a formador (`CREATOR`) e a subadministrador (`SUBADMIN`).
- **Utilizadores:** pesquisar contas, alterar cargos (respeitando a hierarquia entre Admin e Subadmin) e suspender ou reativar utilizadores.
- **Comunidades e Suporte:** gerir espaços criados na plataforma e responder aos tickets de ajuda enviados pelos utilizadores.

---

## 7. Comunidade, Chat e Chamadas de Voz/Vídeo

### 7.1 Espaços e Canais
- Na secção **Comunidade** (ou dentro da barra lateral de cada curso), existem canais de texto para conversa e esclarecimento de dúvidas, com suporte para anexos e reações com emojis.

### 7.2 Salas de Voz, Vídeo e Partilha de Ecrã (WebRTC)
- Ao entrar num canal de voz, o navegador pede permissão para usar o microfone (e opcionalmente a câmara).
- Durante a chamada, o utilizador pode silenciar o microfone, desativar o som (ensurdecer), ligar a câmara ou **Partilhar o Ecrã**.
- Se o utilizador navegar para outra página da aplicação enquanto está numa chamada, aparece uma barra de chamada ativa que permite regressar à sala ou desligar a chamada a qualquer momento.

### 7.3 Mensagens Diretas e Amigos (`/messages`)
- Permite adicionar outros utilizadores como amigos pelo nome de utilizador (ex.: `@mariana_costa`), iniciar conversas privadas 1-para-1 e fazer chamadas diretas.
- Os contactos mais frequentes podem ser afixados na barra lateral para acesso rápido.

---

## 8. Definições de Conta e Privacidade

Na página **Definições** (`/settings`), o utilizador pode:
- Alternar entre o tema claro e o tema escuro;
- Editar os dados do perfil público (nome, foto, banner, biografia, localização e redes sociais);
- Escolher que informações ficam visíveis para outros utilizadores no seu perfil (biografia, localização, redes sociais e cursos inscritos);
- Definir quem lhe pode enviar mensagens diretas;
- Eliminar a sua conta (mediante confirmação da palavra-passe).

---

## 9. Resolução de Problemas Comuns

- **Erro ao iniciar sessão:** confirmar se o email/utilizador e a palavra-passe estão corretos e se a conta não foi suspensa.
- **Vídeo da aula não carrega:** atualizar a página (`Ctrl + F5`) ou verificar se alguma extensão de bloqueio do navegador está a bloquear o player do YouTube/vídeo.
- **Microfone ou câmara não funcionam na chamada:** verificar no ícone junto à barra de endereço do navegador se as permissões de microfone e câmara estão autorizadas para `localhost`.
- **Certificado ainda não aparece:** confirmar se todas as aulas e questionários do curso estão marcados como concluídos (100%).