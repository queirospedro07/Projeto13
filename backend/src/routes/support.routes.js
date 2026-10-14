import { Router } from 'express';

const router = Router();

// 1. FAQ & Base de Conhecimento Estruturada
router.get('/faq', async (_req, res) => {
  const faqData = [
    {
      category: 'Conta, Acesso & Segurança',
      description: 'Dúvidas sobre registo, palavra-passe, perfil, privacidade e sessões.',
      items: [
        {
          q: 'Como posso alterar a visibilidade do meu perfil e o enquadramento da foto de capa?',
          a: 'Aceda à página de Definições (/settings) ou ao seu Perfil (/profile). No perfil, utilize o seletor de cores ou gradientes predefinidos para personalizar o seu banner. Nas definições de privacidade, pode ativar ou desativar a visibilidade do seu email, medalhas de XP e cursos em que está matriculado.'
        },
        {
          q: 'A plataforma suporta múltiplos perfis de acesso?',
          a: 'Sim. O NEXO disponibiliza perfis de acesso bem definidos: Aluno (estudo, questionários e certificações oficiais), Formador e Colaborador (criação e gestão de cursos no estúdio pedagógico) e Administrador Principal (gestão total de infraestruturas e utilizadores).'
        },
        {
          q: 'Como recupero o acesso se esquecer a minha palavra-passe?',
          a: 'Na página de início de sessão (/login), clique na opção "Esqueceu a sua palavra-passe?". Será encaminhado para o formulário de redefinição onde poderá solicitar um código ou link seguro para restabelecer as suas credenciais.'
        },
        {
          q: 'Como configuro quem me pode enviar mensagens diretas (DMs)?',
          a: 'Na página de Definições (/settings), na secção "Mensagens & Comunicação", pode definir a permissão de mensagens diretas para: Todos os utilizadores, Apenas Amigos Mútuos, Apenas Colegas de Turma & Formadores, ou Desativado. Pode ainda ativar a opção de Pedidos Prévios de Mensagem.'
        },
        {
          q: 'O que acontece se a minha sessão expirar?',
          a: 'Por motivos de segurança e conformidade bancária/pedagógica, as sessões têm um período de validade seguro com tokens JWT. Se a sua sessão expirar, a plataforma solicitará um novo início de sessão seguro sem perda de progresso gravado.'
        }
      ]
    },
    {
      category: 'Cursos, Aulas & Reprodutor de Conteúdos',
      description: 'Como assistir a aulas, gerir progresso, notas e descarregar recursos.',
      items: [
        {
          q: 'Como funciona o progresso e a conclusão de cada aula?',
          a: 'Ao assistir a um vídeo ou concluir um desafio/artigo na sala de aula (/learn/:id), clique no botão "Concluir Aula". A plataforma regista instantaneamente o seu progresso, credita os pontos de XP no seu perfil e atualiza a sua percentagem global do curso.'
        },
        {
          q: 'Onde posso descarregar os PDFs, exercícios e materiais de apoio?',
          a: 'Dentro do reprodutor do curso (/learn/:id), no menu inferior ou lateral, selecione a aba "Recursos & Documentos". Terá acesso direto aos ficheiros, diapositivos em PDF e código-fonte anexados pelo formador.'
        },
        {
          q: 'Posso tirar dúvidas diretamente sobre uma aula específica?',
          a: 'Sim! Nos canais de texto e chat temático da turma e comunidade do curso, pode colocar perguntas ao formador, colaboradores e aos restantes colegas com suporte a blocos de código formatados com syntax highlighting.'
        },
        {
          q: 'O reprodutor de vídeo possui atalhos de teclado e controlo de velocidade?',
          a: 'Sim. Pode controlar a velocidade de reprodução entre 0.75x e 2.0x. Pode usar a barra de espaço para pausar/reproduzir, as setas direcionais para avançar ou recuar 5 segundos, e a tecla "M" para silenciar o áudio.'
        },
        {
          q: 'Como funcionam as Notas Pessoais durante o estudo?',
          a: 'Na aba "Caderno de Notas" do reprodutor de aulas, pode escrever apontamentos pessoais que ficam associados à aula atual. As notas são guardadas automaticamente e podem ser revistas a qualquer momento.'
        }
      ]
    },
    {
      category: 'Questionários & Avaliação Prática',
      description: 'Regras de realização de quizzes, tentativas, nota mínima e pontuações.',
      items: [
        {
          q: 'Como são avaliados os questionários e qual a nota mínima?',
          a: 'Cada questionário possui uma nota mínima de aprovação configurada pelo formador (geralmente 70%). Ao submeter, o sistema calcula a pontuação imediatamente e exibe a justificação pedagógica de cada questão.'
        },
        {
          q: 'O que acontece se reprovar num questionário?',
          a: 'Pode rever os conteúdos da aula e tentar novamente o questionário. O sistema registará a sua melhor pontuação para efeitos de certificação e progressão pedagógica.'
        },
        {
          q: 'Quantos pontos de XP ganho ao superar um questionário?',
          a: 'A conclusão com sucesso de um questionário concede entre 50 a 100 pontos de XP adicionais, contribuindo para a evolução de nível e subida no ranking semanal.'
        }
      ]
    },
    {
      category: 'Certificados Oficiais & Verificação Criptográfica',
      description: 'Regras de emissão, download em PDF e validação de diplomas de conclusão.',
      items: [
        {
          q: 'Quando é emitido o meu certificado oficial?',
          a: 'O certificado oficial é gerado de forma 100% automática assim que atingir 100% de conclusão em todos os módulos, aulas e questionários da respetiva formação.'
        },
        {
          q: 'Como é validada a autenticidade do certificado por entidades externas?',
          a: 'Cada certificado emitido pela NEXO recebe um código de credencial exclusivo e imutável (ex: LS-CERT-XXXXXX). Qualquer pessoa, empresa ou entidade de recrutamento pode consultar e verificar a autenticidade através da página de verificação de diplomas (/certificates/verify/:id).'
        },
        {
          q: 'Como posso descarregar o certificado ou adicioná-lo ao LinkedIn?',
          a: 'Na secção "Os Meus Certificados" (/certificates), clique em "Ver Certificado". Encontrará o botão "Imprimir / Guardar em PDF" para descarregar o diploma em alta resolução e o botão "Partilhar no LinkedIn" que preenche automaticamente os dados na sua conta profissional.'
        },
        {
          q: 'Os certificados têm data de expiração?',
          a: 'Não. Os certificados emitidos pela plataforma NEXO são vitalícios e permanecem permanentemente acessíveis no seu histórico académico e no verificador público.'
        }
      ]
    },
    {
      category: 'Salas de Mentoria WebRTC & Comunidades',
      description: 'Chamadas ao vivo em alta definição, partilha de ecrã, voz e banner ativo.',
      items: [
        {
          q: 'Como funcionam as salas de estudo e mentoria ao vivo?',
          a: 'Cada espaço de curso inclui canais de voz/vídeo em tempo real alimentados por WebRTC com baixa latência. Ao aderir a uma sala, pode ligar o microfone, transmitir a sua câmara Web e partilhar o seu ecrã em alta definição com os colegas.'
        },
        {
          q: 'Posso continuar a ouvir a mentoria enquanto navego noutras páginas?',
          a: 'Sim! A plataforma possui um sistema de chamada flutuante global em background (Active Call Banner). A chamada mantém-se conectada sem interrupções mesmo que mude de página, consulte outros cursos ou resolva questionários.'
        },
        {
          q: 'Quais os requisitos técnicos para utilizar o WebRTC?',
          a: 'Apenas necessita de um navegador web moderno (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari ou Brave) e conceder permissão de microfone/câmara quando solicitado.'
        },
        {
          q: 'Como partilhar o ecrã durante uma sessão ao vivo?',
          a: 'Na barra de controlos da sala de voz/vídeo, clique no ícone de "Partilhar Ecrã". Poderá selecionar o ecrã inteiro, uma janela de aplicação específica (ex.: VS Code ou Figma) ou um separador do navegador.'
        }
      ]
    },
    {
      category: 'Formadores & Estúdio de Criação',
      description: 'Como criar formações, publicar conteúdos, moderação e aprovações.',
      items: [
        {
          q: 'Como me torno Formador oficial no NEXO?',
          a: 'No rodapé ou no menu principal, clique em "Candidatura a Formador" e preencha o inquérito pedagógico. A administração analisará a sua proposta e concederá acesso ao Estúdio do Formador (/creator).'
        },
        {
          q: 'Porque é que o meu curso criado ainda não aparece no catálogo público?',
          a: 'Para assegurar o mais alto padrão de qualidade de ensino, todos os novos cursos submetidos ficam inicialmente com o estado "PENDENTE". Assim que um Administrador rever o plano pedagógico e aprovar o curso, este fica imediatamente visível para todos os alunos.'
        },
        {
          q: 'O formador é contabilizado como aluno pago no seu próprio curso?',
          a: 'Não. Os autores têm acesso direto e ilimitado de formador a todas as aulas e ferramentas do seu curso, sem qualquer cobrança e sem inflacionar as estatísticas financeiras ou a contagem de inscritos.'
        },
        {
          q: 'Como adicionar questionários e ficheiros anexos ao curso?',
          a: 'No Estúdio do Formador, ao criar ou editar uma aula, pode selecionar o tipo de conteúdo (Vídeo, Artigo ou Questionário). Na aba de recursos, pode anexar ficheiros de apoio em PDF, ZIP ou links de repositórios externos.'
        }
      ]
    },
    {
      category: 'Gamificação, Níveis, Medalhas & Ranking',
      description: 'Cálculo de XP, sequências diárias (streaks), insígnias e tabelas de classificação.',
      items: [
        {
          q: 'Como ganho pontos de experiência (XP) no NEXO?',
          a: 'Ganha XP ao assistir e concluir aulas (30 a 50 XP), ao superar questionários (50 a 100 XP) e ao manter a sua sequência diária de estudos.'
        },
        {
          q: 'O que são as Sequências Diárias (Daily Streaks)?',
          a: 'A sequência diária contabiliza os dias consecutivos em que estuda na plataforma e atinge a sua meta diária de minutos. Manter sequências longas desbloqueia medalhas exclusivas e multiplicadores de XP.'
        },
        {
          q: 'Onde posso consultar o meu nível e posição na tabela de classificação?',
          a: 'No seu Perfil (/profile) ou no Dashboard (/dashboard), pode visualizar o seu nível atual, a barra de progresso para o próximo escalão e o ranking geral dos estudantes mais dedicados.'
        }
      ]
    }
  ];

  return res.json(faqData);
});

export default router;
