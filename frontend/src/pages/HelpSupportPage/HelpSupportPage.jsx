import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Ticket,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  LifeBuoy,
  BookOpen,
  GraduationCap,
  Video,
  Sparkles,
  ArrowRight,
  User,
  X,
  RefreshCw,
  FileText,
  Radio,
  Award,
  Layers,
  Check,
  Laptop,
  Flame,
  MessageSquare,
  Lock,
  Download,
  Share2,
  Sliders,
  Settings,
  Tv,
  FileCode,
  CheckSquare,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { SEO } from '../../components/common/SEO';

const FALLBACK_FAQ = [
  {
    category: 'Conta, Acesso & Segurança',
    description: 'Dúvidas sobre registo, palavra-passe, perfil, privacidade e sessões.',
    items: [
      {
        q: 'Como posso alterar a visibilidade do meu perfil e o enquadramento da foto de capa?',
        a: 'Aceda à página de Definições (/settings) ou ao seu Perfil (/profile). No perfil, utilize a ferramenta de ajuste de capa para arrastar e enquadrar a imagem milimetricamente com pré-visualização em tempo real. Nas definições de privacidade, pode ativar ou desativar a visibilidade do seu email, medalhas de XP e cursos em que está matriculado.'
      },
      {
        q: 'A plataforma suporta múltiplos perfis de acesso?',
        a: 'Sim. O NEXO disponibiliza perfis de acesso dedicados: Aluno (estudo, questionários e certificações oficiais), Formador e Colaborador (criação e gestão de cursos no estúdio pedagógico) e Administrador Principal (gestão total de infraestruturas e utilizadores).'
      },
      {
        q: 'Como recupero o acesso se esquecer a minha palavra-passe?',
        a: 'Na página de início de sessão (/login), clique na opção "Esqueceu a sua palavra-passe?". Será encaminhado para o formulário de redefinição onde poderá solicitar um código ou link seguro para restabelecer as suas credenciais.'
      },
      {
        q: 'Como configuro quem me pode enviar mensagens diretas (DMs)?',
        a: 'Na página de Definições (/settings), na secção "Mensagens & Comunicação", pode definir a permissão de mensagens diretas para: Todos os utilizadores, Apenas Amigos Mútuos, Apenas Colegas de Turma & Formadores, ou Desativado. Pode ainda ativar a opção de Pedidos Prévios de Mensagem para aprovar conversas de utilizadores que ainda não segue.'
      },
      {
        q: 'O que acontece se a minha sessão expirar?',
        a: 'Por motivos de segurança e integridade de dados, as sessões autenticadas utilizam tokens JWT protegidos. Se a sua sessão expirar, o sistema solicitará um novo início de sessão seguro, sem que haja qualquer perda do seu progresso em aulas ou questionários gravados.'
      }
    ]
  },
  {
    category: 'Cursos, Aulas & Reprodutor de Conteúdos',
    description: 'Como assistir a aulas, gerir progresso, notas e descarregar recursos didáticos.',
    items: [
      {
        q: 'Como funciona o progresso e a conclusão de cada aula?',
        a: 'Ao assistir a um vídeo ou concluir um desafio/artigo na sala de aula (/learn/:id), clique no botão "Concluir Aula". A plataforma regista instantaneamente o seu progresso no servidor, credita os pontos de XP no seu perfil e atualiza a sua percentagem global de conclusão da formação.'
      },
      {
        q: 'Onde posso descarregar os PDFs, exercícios e materiais de apoio?',
        a: 'Dentro do reprodutor do curso (/learn/:id), no menu inferior ou lateral, selecione a aba "Recursos & Documentos". Terá acesso direto aos ficheiros, apresentações em PDF, diapositivos e links de repositórios GitHub disponibilizados pelo formador.'
      },
      {
        q: 'Posso colocar dúvidas diretamente sobre uma aula específica?',
        a: 'Sim! Na aba "Dúvidas & Q&A" da aula ou nos canais de texto temáticos da comunidade associada, pode colocar perguntas ao formador e aos restantes colegas de turma, com suporte total a formatação de código com realce sintático.'
      },
      {
        q: 'O reprodutor de vídeo possui atalhos de teclado e controlo de velocidade?',
        a: 'Sim. Pode alterar a velocidade de reprodução entre 0.75x e 2.0x. Pode também utilizar a barra de espaço para pausar/retomar a aula, as setas direcionais para a esquerda/direita para recuar ou avançar 5 segundos, e a tecla "M" para silenciar o áudio.'
      },
      {
        q: 'Como funcionam as Notas Pessoais durante as aulas?',
        a: 'Na aba "Caderno de Notas" do reprodutor de aulas, pode registar apontamentos pessoais sincronizados com o momento da aula. O sistema guarda os seus apontamentos de forma automática e segura para consulta futura.'
      }
    ]
  },
  {
    category: 'Questionários & Avaliação Prática',
    description: 'Regras de realização de quizzes, nota mínima, tentativas e pontuação.',
    items: [
      {
        q: 'Como são avaliados os questionários e qual a nota mínima de aprovação?',
        a: 'Cada questionário possui uma nota mínima de aprovação configurada pelo formador (normalmente 70%). Ao submeter as respostas, o sistema calcula a nota em tempo real e apresenta a justificação pedagógica de cada alternativa para reforçar a aprendizagem.'
      },
      {
        q: 'O que acontece se não atingir a nota mínima num questionário?',
        a: 'Pode rever os conteúdos da aula e repetir o questionário. O sistema registará a sua melhor pontuação para efeitos de cálculo de média e desbloqueio do certificado de conclusão.'
      }
    ]
  },
  {
    category: 'Certificados Oficiais & Verificação Criptográfica',
    description: 'Regras de emissão, download em PDF e validação de diplomas de conclusão.',
    items: [
      {
        q: 'Quando é emitido o meu certificado oficial?',
        a: 'O certificado oficial é gerado de forma 100% automática assim que atingir 100% de conclusão em todos os módulos, aulas e questionários do plano curricular da formação.'
      },
      {
        q: 'Como é validada a autenticidade do certificado por entidades externas?',
        a: 'Cada certificado emitido pela NEXO recebe um código de credencial exclusivo e imutável (ex: NEXO-XXXXXX). Qualquer entidade empregadora, universidade ou parceiro pode consultar e validar a autenticidade em tempo real na página de verificação de diplomas (/certificates/verify/:id).'
      },
      {
        q: 'Como posso descarregar o certificado em PDF ou partilhá-lo no LinkedIn?',
        a: 'Na secção "Certificados" da Minha Biblioteca (/library), clique em "Ver Certificado". Terá à disposição o botão "Imprimir / Guardar em PDF" para descarregar o diploma em alta resolução vetorial e o botão "Partilhar no LinkedIn", que preenche diretamente o nome da formação, entidade emissora e hash da credencial.'
      },
      {
        q: 'Os certificados têm prazo de validade?',
        a: 'Não. Os certificados emitidos pela plataforma NEXO são vitalícios e permanecem permanentemente acessíveis no seu perfil e no registo público da plataforma.'
      }
    ]
  },
  {
    category: 'Salas de Mentoria WebRTC & Comunidades',
    description: 'Chamadas ao vivo em alta definição, partilha de ecrã, áudio e banner flutuante.',
    items: [
      {
        q: 'Como funcionam as salas de estudo e mentoria ao vivo?',
        a: 'Cada espaço de curso integra canais de voz e vídeo em tempo real alimentados pelo protocolo WebRTC de baixa latência. Ao entrar na sala, pode ligar o microfone, ativar a câmara Web e partilhar o ecrã em alta definição com formadores e colegas de turma.'
      },
      {
        q: 'Posso continuar a ouvir a mentoria enquanto navego noutras páginas?',
        a: 'Sim! A plataforma possui um sistema de chamada flutuante global em background (Active Call Banner). A chamada mantém-se conectada sem interrupções mesmo que mude de página, consulte outros cursos ou resolva questionários.'
      },
      {
        q: 'Quais são os requisitos técnicos para utilizar o WebRTC?',
        a: 'Apenas necessita de um navegador moderno (Chrome, Firefox, Edge, Safari ou Brave) e conceder permissão de acesso ao microfone e à câmara quando solicitado pelo navegador.'
      },
      {
        q: 'Como partilho o meu ecrã durante uma sessão ao vivo?',
        a: 'Na barra de controlos da chamada, clique no botão "Partilhar Ecrã". Poderá selecionar o ecrã inteiro, uma janela específica de código (ex: VS Code) ou um separador do navegador a 60 quadros por segundo.'
      }
    ]
  },
  {
    category: 'Formadores & Estúdio de Criação',
    description: 'Como criar cursos, publicar conteúdos, anexar ficheiros e aprovações.',
    items: [
      {
        q: 'Como me torno Formador oficial no NEXO?',
        a: 'No rodapé ou no menu principal, clique em "Candidatura a Formador" e preencha o inquérito pedagógico detalhando a sua experiência e proposta de formação. A administração analisa as candidaturas e concede acesso ao Estúdio do Formador (/creator).'
      },
      {
        q: 'Porque é que o meu curso criado ainda não aparece no catálogo público?',
        a: 'Para assegurar o mais alto padrão de qualidade pedagógica, todos os novos cursos submetidos iniciam com o estado "PENDENTE". Assim que um Administrador ou Sub-Administrador validar a estrutura e aprovar a formação, esta fica imediatamente visível no catálogo para todos os alunos.'
      },
      {
        q: 'O formador tem acesso gratuito ao seu próprio curso?',
        a: 'Sim, com certeza. Os autores têm acesso direto e irrestrito de formador a todas as aulas, quizzes e materiais dos seus cursos, sem qualquer encargo financeiro e sem influenciar as métricas de alunos inscritos.'
      },
      {
        q: 'Como posso adicionar questionários e ficheiros anexos ao curso?',
        a: 'No Estúdio do Formador, ao criar ou editar uma aula, pode definir o tipo de aula (Vídeo, Artigo ou Questionário). Na aba de recursos, pode anexar ficheiros de apoio em PDF, ZIP ou links de repositórios externos.'
      }
    ]
  }
];

export const HelpSupportPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'faq';
  });

  // FAQ State
  const [faqCategories, setFaqCategories] = useState(FALLBACK_FAQ);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState('ALL');
  const [openFaqIndices, setOpenFaqIndices] = useState({});
  const [loadingFaq, setLoadingFaq] = useState(false);

  // Manual Section State (Apresentação interativa em acordeão idêntica ao FAQ)
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [selectedManualCategory, setSelectedManualCategory] = useState('ALL');
  const [openManualIndices, setOpenManualIndices] = useState({ '0-0': true, '0-1': true });

  const toggleManualItem = (mIdx, sIdx) => {
    const key = `${mIdx}-${sIdx}`;
    setOpenManualIndices((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleAllModuleItems = (mIdx, sections, expand) => {
    setOpenManualIndices((prev) => {
      const next = { ...prev };
      sections.forEach((_, sIdx) => {
        next[`${mIdx}-${sIdx}`] = expand;
      });
      return next;
    });
  };

  // Load FAQ from server
  useEffect(() => {
    const fetchFaq = async () => {
      try {
        setLoadingFaq(true);
        const data = await api.getSupportFaq();
        if (Array.isArray(data) && data.length > 0) {
          setFaqCategories(data);
        }
      } catch (err) {
        console.warn('Using fallback FAQ data:', err);
      } finally {
        setLoadingFaq(false);
      }
    };
    fetchFaq();
  }, []);

  const toggleFaqItem = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`;
    setOpenFaqIndices((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filter FAQ items
  const filteredFaqCategories = faqCategories
    .map((cat) => {
      if (selectedFaqCategory !== 'ALL' && cat.category !== selectedFaqCategory) {
        return null;
      }
      const questions = cat.items || cat.questions || [];
      if (!faqSearchQuery.trim()) {
        return { ...cat, items: questions };
      }
      const query = faqSearchQuery.toLowerCase();
      const matchedQuestions = questions.filter(
        (q) => (q.q && q.q.toLowerCase().includes(query)) || (q.a && q.a.toLowerCase().includes(query))
      );
      if (matchedQuestions.length === 0) return null;
      return { ...cat, items: matchedQuestions };
    })
    .filter(Boolean);

  // Professional Deep User Manual Modules
  const manualModules = [
    {
      id: 'student',
      title: 'Manual do Aluno & Aprendizagem',
      subtitle: 'Inscrições, Reprodutor de Aulas, Atalhos & Notas',
      icon: GraduationCap,
      badge: 'Essencial',
      overview: 'Guia de operação completo para estudantes: descubra como encontrar formações, assistir a aulas com reprodução acelerada, tomar notas em tempo real e superar questionários com distinção.',
      sections: [
        {
          title: '1.1 Navegação & Pesquisa no Catálogo de Cursos',
          icon: Search,
          content: 'Aceda à secção "Explorar Cursos" no menu principal. Utilize os filtros laterais por área técnica (Programação, Design & UI/UX, Inteligência Artificial, Cibersegurança e Cloud/DevOps). A pesquisa em tempo real permite filtrar por palavras-chave, nome do formador ou nível de dificuldade (Iniciante, Intermédio ou Avançado).'
        },
        {
          title: '1.2 Inscrição & Gestão no Painel Pessoal',
          icon: CheckCircle2,
          content: 'Na página de detalhes da formação, clique em "Começar a Aprender" ou "Inscrever no Curso". A matrícula é instantânea e o curso passa a constar no seu Painel (/dashboard) e na secção "Os Meus Cursos", onde poderá retomar qualquer aula no exato segundo onde pausou.'
        },
        {
          title: '1.3 Reprodutor de Aulas Avançado & Atalhos de Teclado',
          icon: Tv,
          content: 'O reprodutor cinemático oferece aceleração de vídeo de 0.75x a 2.0x, resolução dinâmica e modo ecrã inteiro. Atalhos disponíveis: [Barra de Espaço] para pausar/retomar, [Seta Esquerda / Seta Direita] para recuar ou avançar 5 segundos, [Tecla M] para silenciar o áudio e [Tecla F] para alternar ecrã inteiro.'
        },
        {
          title: '1.4 Caderno de Apontamentos & Notas Sincronizadas',
          icon: FileCode,
          content: 'Na aba "Caderno de Notas" do reprodutor, pode redigir notas pessoais com suporte a formatação markdown. As notas ficam permanentemente associadas ao timestamp da aula e podem ser consultadas, editadas ou exportadas sempre que desejar.'
        },
        {
          title: '1.5 Fórum Q&A e Esclarecimento de Dúvidas',
          icon: MessageSquare,
          content: 'Tem alguma dúvida sobre o código ou conceito abordado? Na aba "Dúvidas & Q&A" da aula, publique a sua questão com blocos de código formatados. O formador e os colegas de turma recebem notificações e as melhores respostas podem ser assinaladas como solução oficial.'
        },
        {
          title: '1.6 Questionários Práticos & Avaliação',
          icon: CheckSquare,
          content: 'Nos módulos com quizzes avaliativos, responda às questões de escolha múltipla. Ao submeter, recebe feedback pedagógico imediato e explicações detalhadas para cada opção. Superar o quiz valida o progresso rumo ao certificado.'
        }
      ],
      proTips: [
        'Ative o Auto-Play na barra do reprodutor para encadear aulas sem interrupções manuais.',
        'Mantenha uma rotina diária de pelo menos 15 minutos para preservar a sua Sequência de Estudo (Streak).'
      ]
    },
    {
      id: 'creator',
      title: 'Manual do Formador & Estúdio',
      subtitle: 'Criação de Cursos, Módulos, Quizzes & Aprovação',
      icon: BookOpen,
      badge: 'Pedagógico',
      overview: 'Manual técnico e pedagógico para autores e formadores: conheça o processo de candidatura, estruturação hierárquica de módulos, upload de materiais didáticos e ciclo de aprovação.',
      sections: [
        {
          title: '2.1 Candidatura Pedagógica & Acreditação de Formador',
          icon: Award,
          content: 'Para publicar cursos no NEXO, clique em "Candidatura a Formador" no rodapé e preencha o formulário com a sua biografia, anos de experiência, portfólio profissional e plano da formação que pretende lecionar. A equipa pedagógica analisa e responde no prazo de 24 a 48 horas.'
        },
        {
          title: '2.2 Estúdio do Formador & Criação Hierárquica',
          icon: Sliders,
          content: 'Após aprovação, aceda ao Estúdio do Formador (/creator). Clique em "Novo Curso" para definir o título oficial, categoria temática, nível de dificuldade, requisitos prévios, objetivos de aprendizagem e imagem de capa em alta definição com ajuste milimétrico de enquadramento.'
        },
        {
          title: '2.3 Estruturação de Módulos & Aulas em Vídeo',
          icon: Layers,
          content: 'Organize a sua formação em módulos sequenciais lógicos. Em cada aula, insira o link de vídeo (YouTube, Vimeo ou MP4 direto), duração estimada em minutos, descrição detalhada do sumário e recursos didáticos anexos (PDFs, ficheiros ZIP e links GitHub).'
        },
        {
          title: '2.4 Construtor de Quizzes & Bancos de Perguntas',
          icon: CheckSquare,
          content: 'Adicione questionários interativos às suas aulas. Pode definir a percentagem mínima de aprovação (ex: 70%) e explicações pedagógicas personalizadas para cada resposta certa e errada.'
        },
        {
          title: '2.5 Submissão para Moderação & Publicação Pública',
          icon: Shield,
          content: 'Quando o curso estiver estruturado, clique em "Submeter para Revisão". O curso entrará no estado "PENDENTE". Um Administrador ou Sub-Administrador verificará o cumprimento das diretrizes de qualidade e autorizará a publicação no catálogo oficial.'
        },
        {
          title: '2.6 Acesso Direto do Formador às suas Formações',
          icon: Lock,
          content: 'Os formadores possuem acesso gratuito, total e vitalício aos seus próprios cursos para testar a experiência do aluno, acompanhar respostas nos questionários e interagir no fórum de dúvidas, sem qualquer cobrança financeira.'
        }
      ],
      proTips: [
        'Adicione exercícios práticos no final de cada módulo para aumentar a retenção dos alunos.',
        'Imagens de capa com resolução 1920x1080 e boa iluminação geram até 3x mais inscrições no catálogo público.'
      ]
    },
    {
      id: 'webrtc',
      title: 'Manual de Salas WebRTC & Mentoria',
      subtitle: 'Áudio HD, Partilha de Ecrã & Chamada em Background',
      icon: Radio,
      badge: 'Tempo Real',
      overview: 'Instruções para sessões de mentoria ao vivo e salas de estudo coletivo: comunicação peer-to-peer de alta fidelidade, partilha de janelas de programação e navegação fluida em multitarefa.',
      sections: [
        {
          title: '3.1 Conexão WebRTC Peer-to-Peer sem Plugins',
          icon: Radio,
          content: 'As salas de mentoria funcionam diretamente no navegador através da tecnologia WebRTC com servidores STUN/TURN dedicados. Não é necessário instalar extensões nem programas de terceiros para participar em sessões de áudio e vídeo em alta definição.'
        },
        {
          title: '3.2 Permissões de Microfone & Câmara',
          icon: Video,
          content: 'Ao ingressar numa sala pela primeira vez, autorize o navegador a utilizar o seu microfone e câmara. A plataforma integra filtros de cancelamento de eco acústico e supressão automática de ruído ambiente para máxima clareza sonora.'
        },
        {
          title: '3.3 Partilha de Ecrã em Alta Resolução (60 FPS)',
          icon: Laptop,
          content: 'Clique no ícone de "Partilhar Ecrã" durante a mentoria ao vivo para demonstrar linhas de código no seu editor, apresentar slides ou depurar erros em conjunto. Pode escolher transmitir o ecrã inteiro, uma janela específica de programa ou um separador do browser.'
        },
        {
          title: '3.4 Active Call Banner Flutuante & Multitarefa',
          icon: Tv,
          content: 'Graças ao sistema de chamada flutuante global, pode continuar a ouvir a mentoria e falar no microfone enquanto navega por outras páginas do NEXO, consulta o catálogo de cursos, lê documentação técnica ou resolve exercícios.'
        },
        {
          title: '3.5 Moderação de Áudio & Controlo de Participantes',
          icon: Users,
          content: 'Os formadores e administradores dispõem de ferramentas para silenciar microfones, definir oradores no palco virtual ou abrir a discussão em formato mesa-redonda para todos os estudantes da turma.'
        }
      ],
      proTips: [
        'Utilize auscultadores para evitar feedback de áudio em chamadas com múltiplos participantes.',
        'Se a sua ligação oscilar, desative temporariamente a câmara e mantenha apenas a transmissão de áudio e partilha de ecrã.'
      ]
    },
    {
      id: 'certificates',
      title: 'Manual de Certificação & Validação',
      subtitle: 'Emissão de Diploma, Download PDF & Hash Criptográfico',
      icon: Award,
      badge: 'Criptográfico',
      overview: 'Tudo sobre os diplomas emitidos pelo NEXO: critérios de 100% de conclusão, geração de hash criptográfico único, download de diploma em PDF vetorial e integração no LinkedIn.',
      sections: [
        {
          title: '4.1 Critérios Obrigatórios de Emissão',
          icon: CheckCircle2,
          content: 'Para que o certificado seja desbloqueado, o estudante deve atingir 100% de progresso em todas as aulas em vídeo e obter aproveitamento positivo (igual ou superior à nota mínima) em todos os questionários do plano de estudos.'
        },
        {
          title: '4.2 Emissão Imediata & Diploma Digital Oficial',
          icon: Award,
          content: 'Assim que a última aula ou quiz for concluído, o sistema gera o Certificado Digital Oficial emitido com o nome completo do formando, título da formação, carga horária, data de emissão e assinaturas digitais do formador e da coordenação.'
        },
        {
          title: '4.3 Validação Criptográfica Pública por Hash',
          icon: Shield,
          content: 'Cada diploma recebe um identificador alfanumérico exclusivo e imutável (ex: NEXO-XXXXXX). Empresas recrutadoras, universidades ou clientes podem verificar a veracidade do diploma em qualquer parte do mundo através da página pública /certificates/verify/:id.'
        },
        {
          title: '4.4 Download em PDF Vetorial de Alta Fidelidade',
          icon: Download,
          content: 'No visualizador de certificado (/library), clique no botão "Imprimir / Guardar em PDF". O documento é processado em alta resolução gráfica com fontes tipográficas embutidas, pronto para impressão ou envio por correio eletrónico.'
        },
        {
          title: '4.5 Partilha Social & Adição ao Perfil LinkedIn',
          icon: Share2,
          content: 'Utilize o botão "Partilhar no LinkedIn" para preencher instantaneamente a secção de "Licenças e Certificados" da sua rede profissional com a credencial verificada do NEXO.'
        }
      ],
      proTips: [
        'Confirme se o seu nome e apelido estão corretamente preenchidos nas Definições de Perfil antes de emitir o certificado.',
        'Pode incluir o link direto de validação da sua credencial no seu currículo em formato PDF.'
      ]
    },
    {
      id: 'privacy',
      title: 'Manual de Privacidade & Mensagens (DMs)',
      subtitle: 'Controlo de DMs, Pedidos Prévios & Proteção RGPD',
      icon: Lock,
      badge: 'Segurança',
      overview: 'Compreenda todas as opções de controlo e privacidade do NEXO: regule quem lhe pode enviar mensagens privadas, ative pedidos prévios de conversa e controle a visibilidade dos seus dados segundo o RGPD.',
      sections: [
        {
          title: '5.1 Permissões Granulares de Mensagens Diretas (DMs)',
          icon: MessageSquare,
          content: 'Na página de Definições (/settings), secção "Mensagens & Comunicação", selecione quem tem autorização para lhe enviar mensagens privadas: "Todos os Utilizadores", "Apenas Amigos Mútuos", "Apenas Colegas de Turma & Formadores" ou "Desativado".'
        },
        {
          title: '5.2 Sistema de Pedidos Prévios de Mensagem',
          icon: Shield,
          content: 'Ao ativar a funcionalidade "Exigir Pedido Prévio de Mensagem", mensagens de utilizadores que ainda não segue ficam retidas numa aba separada de pedidos. Poderá aceitar ou rejeitar a conversa sem que o remetente saiba se a mensagem foi lida.'
        },
        {
          title: '5.3 Visibilidade Pública de Perfil e Cursos',
          icon: Settings,
          content: 'Pode escolher tornar o seu perfil público ou ocultar elementos específicos, como o seu endereço de email, lista de cursos em que está matriculado ou links das redes sociais.'
        },
        {
          title: '5.4 Proteção de Dados & Conformidade com o RGPD',
          icon: Lock,
          content: 'A plataforma NEXO cumpre integralmente o Regulamento Geral sobre a Proteção de Dados (RGPD). Os seus dados pessoais não são comercializados e pode solicitar a exportação ou eliminação definitiva da sua conta a qualquer instante.'
        }
      ],
      proTips: [
        'Recomendamos manter as DMs configuradas para "Amigos Mútuos" ou "Colegas & Formadores" para evitar mensagens não solicitadas.',
        'Utilize o centro de suporte ou a abertura de tickets caso identifique qualquer conduta em violação das regras comunitárias.'
      ]
    },
    {
      id: 'admin',
      title: 'Manual de Administração & Moderação',
      subtitle: 'Aprovação de Cursos, Candidaturas de Formadores & Auditoria',
      icon: Shield,
      badge: 'Administração',
      overview: 'Guia operacional para a coordenação e administração do NEXO: validação de novos cursos submetidos, triagem curricular de candidaturas de formadores, gestão de utilizadores e monitorização global.',
      sections: [
        {
          title: '6.1 Painel Central de Administração (/admin)',
          icon: Shield,
          content: 'Aceda à consola administrativa no menu do perfil ou em /admin. O dashboard apresenta as métricas vitais da plataforma: total de alunos, formadores ativos, cursos em aprovação, volume de inscrições e tickets pendentes de resposta.'
        },
        {
          title: '6.2 Validação & Aprovação de Cursos Pendentes',
          icon: CheckCircle2,
          content: 'Na aba "Cursos", filtre por estado "Pendente". Abra os detalhes para auditar a estrutura pedagógica, os módulos, a pré-visualização de vídeos, os PDFs e a clareza do sumário. Clique em "Aprovar" para disponibilizar imediatamente o curso no catálogo público, ou "Rejeitar" com notas de melhoria.'
        },
        {
          title: '6.3 Triagem de Candidaturas a Formador',
          icon: Award,
          content: 'Em "Candidaturas", avalie o portfólio, anos de experiência e propostas curriculares submetidas pelos alunos. Ao validar uma candidatura, o perfil do utilizador é promovido para a função "CREATOR" e o Estúdio de Criação é desbloqueado no respetivo painel.'
        },
        {
          title: '6.4 Gestão de Utilizadores, Papéis e Suspensões',
          icon: Users,
          content: 'Na secção "Utilizadores", pesquise por nome, email ou username. Pode alterar funções de utilizadores (STUDENT, CREATOR, ADMIN) ou suspender temporariamente contas que desrespeitem os termos comunitários de convivência.'
        },
        {
          title: '6.5 Triagem e Resposta a Tickets de Suporte',
          icon: Ticket,
          content: 'Na secção de Tickets, consulte pedidos de suporte abertos por estudantes e formadores. Pode atribuir prioridade, responder diretamente ao utilizador e encerrar o ticket assim que a dúvida técnica ou pedagógica estiver resolvida.'
        }
      ],
      proTips: [
        'Verifique sempre se os links de vídeo de um curso estão acessíveis antes de emitir a aprovação final.',
        'Mantenha o tempo de resposta a candidaturas de formadores dentro das primeiras 24 horas para fomentar novos criadores.'
      ]
    },
    {
      id: 'troubleshoot',
      title: 'Resolução de Problemas & Requisitos',
      subtitle: 'Diagnóstico de Aulas, Permissões WebRTC & Recuperação',
      icon: AlertCircle,
      badge: 'Diagnóstico',
      overview: 'Procedimentos rápidos para diagnóstico e resolução de problemas técnicos frequentes relacionados com vídeo, microfone, sessões e inscrições na plataforma NEXO.',
      sections: [
        {
          title: '7.1 Requisitos Mínimos de Sistema e Navegadores',
          icon: Laptop,
          content: 'O NEXO funciona de forma nativa e sem necessidade de plugins nos navegadores modernos: Google Chrome 90+, Mozilla Firefox 88+, Microsoft Edge 90+ e Safari 15+. Recomenda-se ligação à Internet de pelo menos 5 Mbps para reprodução fluida em Full HD e 10 Mbps para transmissão de ecrã a 60 FPS.'
        },
        {
          title: '7.2 O vídeo da aula não carrega ou apresenta ecrã negro',
          icon: Tv,
          content: '1) Desative bloqueadores de anúncios (adblockers) agressivos que possam impedir a incorporação de leitores; 2) Atualize a página com [Ctrl + F5] ou limpe a cache do navegador; 3) Confirme se a aceleração por hardware do navegador está ativa; 4) Caso o problema persista, contacte o suporte indicando o ID da aula.'
        },
        {
          title: '7.3 Sem som ou sem imagem nas Salas de Mentoria WebRTC',
          icon: Radio,
          content: 'Ao ingressar na sala, confirme se concedeu permissão de microfone/câmara nas definições de permissão do site (ícone de cadeado junto à barra de endereço do navegador). Certifique-se de que nenhuma outra aplicação (Teams, Zoom, Discord) está a monopolizar o dispositivo de captura.'
        },
        {
          title: '7.4 Esqueci-me da palavra-passe ou sessão expirada',
          icon: Lock,
          content: 'Na janela de início de sessão (/login), selecione "Esqueceu-se da palavra-passe?" e introduza o seu email registado. Receberá um link seguro válido por 15 minutos para redefinir as suas credenciais. Se a sessão expirar enquanto estuda, inicie sessão novamente sem receio: o seu progresso anterior está gravado no servidor.'
        },
        {
          title: '7.5 O curso não surge na biblioteca após inscrição',
          icon: CheckCircle2,
          content: 'Normalmente a sincronização é imediata. Aceda a /explore ou ao seu /dashboard e recarregue a página. Se o curso não aparecer, aceda à página do curso e clique em "Continuar a Estudar". Se ainda assim não constar, abra um ticket na aba "Os Meus Tickets" indicando o título do curso.'
        }
      ],
      proTips: [
        'Utilize modo de navegação anónima para despistar extensões do browser que possam interferir na reprodução de conteúdos.',
        'Nos dispositivos móveis, prefira redes Wi-Fi estáveis durante transmissões de voz e vídeo WebRTC para poupar tráfego de dados.'
      ]
    }
  ];

  // Filtered Manual Modules based on search and category
  const filteredManualModules = manualModules
    .map((mod) => {
      if (selectedManualCategory !== 'ALL' && mod.id !== selectedManualCategory) {
        return null;
      }
      const sections = mod.sections || [];
      if (!manualSearchQuery.trim()) {
        return mod;
      }
      const query = manualSearchQuery.toLowerCase();
      const matchesMod =
        (mod.title && mod.title.toLowerCase().includes(query)) ||
        (mod.subtitle && mod.subtitle.toLowerCase().includes(query)) ||
        (mod.overview && mod.overview.toLowerCase().includes(query));

      const matchedSections = sections.filter(
        (s) =>
          (s.title && s.title.toLowerCase().includes(query)) ||
          (s.content && s.content.toLowerCase().includes(query))
      );

      if (!matchesMod && matchedSections.length === 0) return null;
      return {
        ...mod,
        sections: matchesMod ? sections : matchedSections
      };
    })
    .filter(Boolean);

  return (
    <>
      <SEO
        title="Dúvidas, Suporte & Manual do Utilizador — NEXO"
        description="Centro de Ajuda oficial da plataforma NEXO. Consulte as perguntas frequentes, explore o manual do utilizador passo a passo e abra tickets de suporte com a equipa técnica."
        canonical="https://nexo.pt/help"
      />

      <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in pb-24 px-3.5 sm:px-6">
        {/* Header Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge size="md" variant="primary" className="font-bold">
                Centro de Ajuda & Apoio
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight">
              Dúvidas & Suporte Técnico
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400 mt-1 max-w-2xl">
              Consulte as respostas mais comuns e aprenda a operar todos os recursos com o manual do utilizador completo.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-neutral-800 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'faq'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Perguntas Frequentes (FAQ)</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Manual do Utilizador</span>
          </button>
        </div>

        {/* TAB 1: PERGUNTAS FREQUENTES (FAQ) */}
        {activeTab === 'faq' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            {/* Search Bar & Category Filters */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0b0c0e] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col gap-4">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pesquise por palavra-chave (ex.: certificado, aulas, mentoria, notas, formador, quizzes)..."
                  value={faqSearchQuery}
                  onChange={(e) => setFaqSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 mr-1">Filtrar por Área:</span>
                <button
                  onClick={() => setSelectedFaqCategory('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    selectedFaqCategory === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-800'
                  }`}
                >
                  Todas as Categorias
                </button>
                {faqCategories.map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => setSelectedFaqCategory(cat.category)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      selectedFaqCategory === cat.category
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {cat.category}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions List Accordion */}
            {loadingFaq ? (
              <div className="py-16 text-center text-slate-500 font-medium">A carregar perguntas frequentes...</div>
            ) : filteredFaqCategories.length === 0 ? (
              <Card className="p-12 text-center border border-slate-200 dark:border-neutral-800">
                <HelpCircle className="w-12 h-12 text-slate-300 dark:text-neutral-700 mx-auto mb-3" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Nenhum resultado encontrado</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto mb-4">
                  Não encontrámos perguntas correspondentes a &quot;{faqSearchQuery}&quot;. Experimente outros termos ou abra um ticket de apoio.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (!user) {
                      toast({
                        title: 'Início de Sessão Necessário',
                        message: 'Inicie sessão para abrir um ticket de suporte.',
                        type: 'info'
                      });
                      return;
                    }
                    setShowNewTicketModal(true);
                  }}
                  leftIcon={<Ticket className="w-3.5 h-3.5" />}
                  className="text-xs font-bold"
                >
                  Abrir Ticket de Suporte
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredFaqCategories.map((cat, catIdx) => {
                  const questions = cat.items || cat.questions || [];
                  return (
                    <div key={cat.category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>{cat.category}</span>
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">
                          {questions.length} {questions.length === 1 ? 'questão' : 'questões'}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {questions.map((item, qIdx) => {
                          const isOpen = openFaqIndices[`${catIdx}-${qIdx}`];
                          return (
                            <div
                              key={qIdx}
                              className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0b0c0e] overflow-hidden transition-all shadow-xs"
                            >
                              <button
                                onClick={() => toggleFaqItem(catIdx, qIdx)}
                                className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors cursor-pointer"
                              >
                                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                                  {item.q}
                                </span>
                                <ChevronDown
                                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                                    isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                                  }`}
                                />
                              </button>
                              {isOpen && (
                                <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-neutral-300 border-t border-slate-100 dark:border-neutral-800/80">
                                  {item.a}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Support Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Não encontrou a resposta que procurava?
                </h4>
                <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5">
                  A nossa equipa técnica e pedagógica está disponível para ajudar através do sistema de tickets.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (!user) {
                    toast({
                      title: 'Início de Sessão Necessário',
                      message: 'Inicie sessão para abrir um ticket.',
                      type: 'info'
                    });
                    return;
                  }
                  setShowNewTicketModal(true);
                }}
                leftIcon={<Ticket className="w-3.5 h-3.5" />}
                className="shrink-0 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                Abrir Ticket de Suporte
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: MANUAL DO UTILIZADOR */}
        {activeTab === 'manual' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            {/* Search Bar & Category Filters (Idêntico ao estilo do FAQ) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0b0c0e] border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col gap-4">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pesquise no manual de instruções (ex.: matrícula, atalhos de vídeo, estúdio, notas, aprovação, salas webrtc, certificados, streaks)..."
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 mr-1">Filtrar por Módulo:</span>
                <button
                  onClick={() => setSelectedManualCategory('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    selectedManualCategory === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-800'
                  }`}
                >
                  Todos os Guias
                </button>
                {manualModules.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedManualCategory(mod.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      selectedManualCategory === mod.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {mod.title.replace('Manual d', 'D').replace('Manual de ', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Modules & Accordion Items (Like FAQ) */}
            {filteredManualModules.length === 0 ? (
              <Card className="p-12 text-center border border-slate-200 dark:border-neutral-800">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-neutral-700 mx-auto mb-3" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Nenhum guia encontrado</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto mb-4">
                  Não encontrámos tópicos no manual correspondentes a &quot;{manualSearchQuery}&quot;. Experimente outros termos ou consulte as Perguntas Frequentes.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setManualSearchQuery('');
                    setSelectedManualCategory('ALL');
                  }}
                  className="text-xs font-bold"
                >
                  Limpar Pesquisa
                </Button>
              </Card>
            ) : (
              <div className="space-y-8">
                {filteredManualModules.map((module, mIdx) => {
                  const ModuleIcon = module.icon;
                  const sections = module.sections || [];
                  const allExpanded = sections.length > 0 && sections.every((_, sIdx) => openManualIndices[`${mIdx}-${sIdx}`]);

                  return (
                    <div
                      key={module.id}
                      className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0b0c0e] border border-slate-200 dark:border-neutral-800 shadow-xs space-y-6"
                    >
                      {/* Module Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-neutral-800/80">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <ModuleIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                Guia Prático
                              </span>
                              <span className="text-xs text-slate-300 dark:text-neutral-700">•</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400">
                                {module.badge}
                              </span>
                            </div>
                            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                              {module.title}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                              {module.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <button
                            type="button"
                            onClick={() => toggleAllModuleItems(mIdx, sections, !allExpanded)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-[11px] font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            {allExpanded ? 'Recolher Todos' : 'Expandir Todos'}
                          </button>
                          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                            {sections.length} {sections.length === 1 ? 'tópico' : 'tópicos'}
                          </span>
                        </div>
                      </div>

                      {/* Module Overview */}
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed bg-slate-50 dark:bg-neutral-900/40 p-4 rounded-xl border border-slate-100 dark:border-neutral-800/60">
                        {module.overview}
                      </p>

                      {/* Accordion Items List (Exactly like FAQ) */}
                      <div className="space-y-2.5">
                        {sections.map((sec, sIdx) => {
                          const SecIcon = sec.icon || CheckCircle2;
                          const isOpen = openManualIndices[`${mIdx}-${sIdx}`];

                          return (
                            <div
                              key={sIdx}
                              className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#08090b] overflow-hidden transition-all shadow-xs"
                            >
                              <button
                                onClick={() => toggleManualItem(mIdx, sIdx)}
                                className="w-full p-4 sm:p-4.5 flex items-center justify-between text-left gap-3.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <SecIcon className="w-4 h-4" />
                                  </div>
                                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                    {sec.title}
                                  </span>
                                </div>
                                <ChevronDown
                                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                                    isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                                  }`}
                                />
                              </button>

                              {isOpen && (
                                <div className="px-4 sm:px-5 pb-4 pt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-neutral-300 border-t border-slate-100 dark:border-neutral-800/80">
                                  <p className="pl-10">{sec.content}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Pro Tips Box */}
                      {module.proTips && module.proTips.length > 0 && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                            <Sparkles className="w-4 h-4" />
                            <span>Dicas Recomendadas & Boas Práticas</span>
                          </div>
                          <ul className="space-y-1.5 pl-5 list-disc text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
                            {module.proTips.map((tip, tIdx) => (
                              <li key={tIdx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
};

export default HelpSupportPage;
