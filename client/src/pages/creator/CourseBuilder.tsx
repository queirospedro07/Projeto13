import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Layers, 
  Hash, 
  Volume2, 
  FileText, 
  HelpCircle, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  X,
  Sparkles, 
  Eye, 
  BookOpen, 
  CheckCircle2, 
  DollarSign,
  GripVertical,
  Bell,
  Users,
  Code2,
  ChevronDown,
  ChevronUp,
  Wand2,
  Play,
  Settings,
  AlertCircle,
  Info,
  CheckSquare,
  Square,
  Upload,
  Video,
  Award,
  Trophy,
  Flame,
  Star,
  Shield,
  Palette,
  ExternalLink,
  Download,
  FolderArchive,
  Clock,
  Unlock,
  Lock,
  Tag,
  FileCode,
  Laptop,
  CheckCheck,
  QrCode,
  Radio,
  FileBadge
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { soundEffects } from '../../services/soundEffects';
import { api } from '../../services/api';
import { QuizQuestionType } from '../../types';

export type LessonType = 'video' | 'text' | 'quiz' | 'code' | 'project' | 'resource' | 'embed';

export interface ChannelItem {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'qa' | 'showcase' | 'doc';
  topic: string;
  guidingQuestion: string;
  guidelines: string;
}

export interface QuizOptionItem {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestionItem {
  id: string;
  question: string;
  type: QuizQuestionType;
  explanation: string;
  points?: number;
  options: QuizOptionItem[];
  gradingMode?: 'auto' | 'teacher';
  expectedAnswer?: string;
  keywords?: string[];
  minWords?: number;
}

export interface VideoChapter {
  id: string;
  time: string;
  title: string;
}

export interface CodeChallengeData {
  language: 'typescript' | 'javascript' | 'python' | 'react' | 'html' | 'sql';
  initialCode: string;
  solutionCode: string;
  instructions: string;
  hints: string[];
}

export interface RichArticleData {
  markdown: string;
  calloutType: 'tip' | 'warning' | 'info' | 'challenge';
  calloutTitle: string;
  calloutText: string;
  checklist: { id: string; text: string }[];
}

export interface ProjectAssignmentData {
  deliverableTitle: string;
  brief: string;
  rubric: string[];
  allowedSubmission: 'github' | 'file' | 'both';
}

export interface DownloadableResourceItem {
  id: string;
  name: string;
  url: string;
  size: string;
  type: 'pdf' | 'zip' | 'figma' | 'code' | 'doc';
}

export interface EmbedData {
  embedUrl: string;
  provider: 'figma' | 'codepen' | 'replit' | 'loom' | 'youtube' | 'slides';
  caption: string;
}

export interface LessonItem {
  id: string;
  title: string;
  type: LessonType;
  durationMin: number;
  videoUrl?: string;
  content: string;
  xpReward?: number;
  videoChapters?: VideoChapter[];
  codeChallenge?: CodeChallengeData;
  richArticle?: RichArticleData;
  projectAssignment?: ProjectAssignmentData;
  resources?: DownloadableResourceItem[];
  embedData?: EmbedData;
  quiz?: {
    title: string;
    description: string;
    passingScore: number;
    xpReward: number;
    questions: QuizQuestionItem[];
  };
}

export interface ModuleItem {
  id: string;
  title: string;
  description: string;
  dripMode?: 'instant' | 'drip' | 'sequential';
  dripDays?: number;
  lessons: LessonItem[];
}

// Preset channel templates
interface ChannelTemplate {
  name: string;
  type: 'text' | 'voice' | 'qa' | 'showcase' | 'doc';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRESET_TEMPLATES: ChannelTemplate[] = [
  {
    name: 'anuncios',
    type: 'text',
    title: 'Anúncios Oficiais',
    description: 'Avisos e comunicados importantes do instrutor',
    icon: Bell
  },
  {
    name: 'geral',
    type: 'text',
    title: 'Discussão Geral',
    description: 'Apresentações e conversas entre os membros',
    icon: Hash
  },
  {
    name: 'duvidas-aulas',
    type: 'qa',
    title: 'Dúvidas & Questões',
    description: 'Tira-dúvidas técnicas e suporte com instrutores',
    icon: HelpCircle
  },
  {
    name: 'projetos-showcase',
    type: 'showcase',
    title: 'Showcase de Projetos',
    description: 'Partilha de código, repositórios e feedback',
    icon: Code2
  },
  {
    name: 'materiais-apoio',
    type: 'doc',
    title: 'Documentos & Recursos',
    description: 'Documentação, guias de estudo e ficheiros de apoio',
    icon: FileText
  },
  {
    name: 'mentoria-ao-vivo',
    type: 'voice',
    title: 'Sala de Mentoria',
    description: 'Sessão ao vivo com áudio, vídeo e partilha de ecrã',
    icon: Volume2
  },
  {
    name: 'networking',
    type: 'text',
    title: 'Espaço de Networking',
    description: 'Conexões profissionais e oportunidades da turma',
    icon: Users
  },
  {
    name: 'desafios-praticos',
    type: 'qa',
    title: 'Desafios & Exercícios',
    description: 'Exercícios práticos e desafios técnicos periódicos',
    icon: Sparkles
  }
];

export const CourseBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Step 1: Course Identity, Branding & Rewards Customizations
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('programming');
  const [difficulty, setDifficulty] = useState('Iniciante');
  const [language, setLanguage] = useState('Português');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('0');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountPrice, setDiscountPrice] = useState('0');
  const [couponCode, setCouponCode] = useState('BEMVINDO2026');
  const [durationHours, setDurationHours] = useState('10');
  const [thumbnailUrl, setThumbnailUrl] = useState('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80');
  
  // Custom Visual Branding
  const [brandColor, setBrandColor] = useState<'indigo' | 'cyan' | 'emerald' | 'rose' | 'amber' | 'violet' | 'slate'>('indigo');
  
  // Custom Gamification / Badge Designer
  const [badgeTitle, setBadgeTitle] = useState('Mestre do Código');
  const [badgeIcon, setBadgeIcon] = useState<'trophy' | 'flame' | 'sparkles' | 'star' | 'shield' | 'award'>('trophy');
  const [badgeRarity, setBadgeRarity] = useState<'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'>('gold');
  const [courseCompletionXp, setCourseCompletionXp] = useState(500);

  // Custom Certificate Designer
  const [certificateTitle, setCertificateTitle] = useState('Certificado de Conclusão e Excelência');
  const [certificateInstructorSignature, setCertificateInstructorSignature] = useState('Prof. Sarah Jenkins');
  const [certificateOrg, setCertificateOrg] = useState('LearnSpace Academy');
  const [certificateCustomMessage, setCertificateCustomMessage] = useState('Por ter concluído com sucesso todos os módulos teóricos, práticos e avaliações.');
  const [certificateHasQrCode, setCertificateHasQrCode] = useState(true);

  // Step 2: Channels State
  const [channels, setChannels] = useState<ChannelItem[]>([
    {
      id: 'ch-1',
      name: 'geral',
      type: 'text',
      topic: 'Boas-vindas, apresentações e conversas gerais sobre o curso.',
      guidingQuestion: 'Qual é o seu principal objetivo com este curso?',
      guidelines: 'Mantenha uma comunicação cordial e profissional com todos.',
    },
    {
      id: 'ch-2',
      name: 'duvidas-exercicios',
      type: 'qa',
      topic: 'Colocação de dúvidas de código e resolução coletiva com instrutores.',
      guidingQuestion: 'Em que lição ou conceito encontrou dificuldade?',
      guidelines: 'Inclua o excerto de código formatado e a mensagem de erro.',
    },
    {
      id: 'ch-3',
      name: 'projetos-showcase',
      type: 'showcase',
      topic: 'Partilha de projetos concluídos, links de repositórios e feedback da turma.',
      guidingQuestion: 'Que personalizações adicionou ao seu projeto prático?',
      guidelines: 'Partilhe o link do repositório ou demonstração.',
    },
    {
      id: 'ch-4',
      name: 'mentoria-ao-vivo',
      type: 'voice',
      topic: 'Sala ao vivo para estudo conjunto, mentoria e partilha de ecrã.',
      guidingQuestion: 'Que tópico estão a rever em grupo neste momento?',
      guidelines: 'Mantenha o microfone silenciado quando não estiver a falar.',
    },
  ]);

  // Expanded advanced settings accordion per channel
  const [expandedChannelIds, setExpandedChannelIds] = useState<Set<string>>(new Set());

  // Step 3: Modules & Rich Lessons State
  const [modules, setModules] = useState<ModuleItem[]>([
    {
      id: 'mod-1',
      title: 'Módulo 1: Fundamentos & Configuração',
      description: 'Primeiros passos, ferramentas essenciais e arquitetura base.',
      dripMode: 'instant',
      dripDays: 0,
      lessons: [
        {
          id: 'les-1',
          title: '1.1 Visão Geral e Metodologia do Curso',
          type: 'video',
          durationMin: 12,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          content: 'Apresentação detalhada da estrutura e objetivos de aprendizagem.',
          xpReward: 25,
          videoChapters: [
            { id: 'vc-1', time: '00:00', title: 'Boas-vindas & Visão Geral' },
            { id: 'vc-2', time: '03:30', title: 'Metodologia de Aprendizagem Ativa' },
            { id: 'vc-3', time: '08:15', title: 'Visão do Projeto Final' }
          ]
        },
        {
          id: 'les-2',
          title: '1.2 Configuração do Ambiente de Trabalho',
          type: 'text',
          durationMin: 15,
          videoUrl: '',
          content: 'Instalação das ferramentas recomendadas e primeiros comandos de terminal.',
          xpReward: 25,
          richArticle: {
            markdown: '### Guia de Configuração Rápida\n\nSiga os passos abaixo para preparar o seu ambiente de desenvolvimento completo:\n\n1. Instale o Node.js v20+\n2. Configure o seu editor de código\n3. Clone o repositório de suporte',
            calloutType: 'tip',
            calloutTitle: 'Dica de Produtividade',
            calloutText: 'Utilize os atalhos de teclado recomendados para poupar até 30% do tempo de codificação.',
            checklist: [
              { id: 'cl-1', text: 'Instalar Node.js LTS' },
              { id: 'cl-2', text: 'Criar conta no GitHub' },
              { id: 'cl-3', text: 'Testar execução no terminal' }
            ]
          }
        },
        {
          id: 'les-2b',
          title: '1.3 Desafio Interativo: Primeiro Script',
          type: 'code',
          durationMin: 20,
          videoUrl: '',
          content: 'Desafio prático de código executável.',
          xpReward: 40,
          codeChallenge: {
            language: 'typescript',
            initialCode: '// Crie uma função que retorne a mensagem de boas-vindas\nfunction boasVindas(nome: string): string {\n  // O seu código aqui\n  return "";\n}',
            solutionCode: 'function boasVindas(nome: string): string {\n  return `Bem-vindo ao LearnSpace, ${nome}!`;\n}',
            instructions: 'Implemente a função `boasVindas` para retornar uma saudação personalizada.',
            hints: ['Utilize template strings com acentos graves (`).']
          }
        }
      ],
    },
    {
      id: 'mod-2',
      title: 'Módulo 2: Projetos Práticos e Avaliação',
      description: 'Desenvolvimento de casos práticos e teste de competências.',
      dripMode: 'sequential',
      dripDays: 3,
      lessons: [
        {
          id: 'les-3',
          title: '2.1 Construção do Projeto Principal',
          type: 'video',
          durationMin: 25,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          content: 'Implementação prática passo a passo com boas práticas de arquitetura.',
          xpReward: 35,
          videoChapters: [
            { id: 'vc-21', time: '00:00', title: 'Arquitetura do Projeto' },
            { id: 'vc-22', time: '07:20', title: 'Implementação dos Componentes' },
            { id: 'vc-23', time: '18:40', title: 'Testes e Validação' }
          ]
        },
        {
          id: 'les-4',
          title: '2.2 Questionário de Avaliação de Conhecimentos',
          type: 'quiz',
          durationMin: 10,
          videoUrl: '',
          content: 'Questionário prático para validar os conhecimentos adquiridos.',
          xpReward: 50,
          quiz: {
            title: 'Avaliação dos Fundamentos',
            description: 'Responda às questões práticas para testar a sua compreensão.',
            passingScore: 70,
            xpReward: 50,
            questions: [
              {
                id: 'q-demo-1',
                type: 'single',
                question: 'Qual é o primeiro passo recomendado para inicializar um novo projeto?',
                explanation: 'A inicialização e estrutura base garantem estabilidade e organização ao projeto.',
                points: 10,
                options: [
                  { id: 'opt-demo-1-1', text: 'Inicializar as dependências e estrutura de pastas', isCorrect: true },
                  { id: 'opt-demo-1-2', text: 'Publicar diretamente em produção sem testar', isCorrect: false },
                  { id: 'opt-demo-1-3', text: 'Desativar o controlo de versões (Git)', isCorrect: false },
                  { id: 'opt-demo-1-4', text: 'Eliminar todos os ficheiros de configuração', isCorrect: false }
                ]
              },
              {
                id: 'q-demo-2',
                type: 'multiple',
                question: 'Selecione as opções que representam boas práticas essenciais num código escalável:',
                explanation: 'Tipagem estrita e testes automatizados reduzem bugs e aumentam a robustez do software.',
                points: 10,
                options: [
                  { id: 'opt-demo-2-1', text: 'Tipagem estrita e contratos claros entre módulos', isCorrect: true },
                  { id: 'opt-demo-2-2', text: 'Testes unitários e de integração contínua', isCorrect: true },
                  { id: 'opt-demo-2-3', text: 'Guardar chaves secretas no repositório público', isCorrect: false },
                  { id: 'opt-demo-2-4', text: 'Documentar convenções e arquitetura da aplicação', isCorrect: true }
                ]
              },
              {
                id: 'q-demo-3',
                type: 'true-false',
                question: 'Verdadeiro ou Falso: Um design com bom contraste e tipografia legível melhora a acessibilidade para todos os estudantes.',
                explanation: 'Verdadeiro: O contraste adequado e tipografia legível são requisitos fundamentais de acessibilidade (WCAG).',
                points: 10,
                options: [
                  { id: 'opt-demo-3-1', text: 'Verdadeiro', isCorrect: true },
                  { id: 'opt-demo-3-2', text: 'Falso', isCorrect: false }
                ]
              }
            ],
          },
        },
        {
          id: 'les-5',
          title: '2.3 Pacote de Recursos & Assets do Curso',
          type: 'resource',
          durationMin: 5,
          videoUrl: '',
          content: 'Descarregue os ficheiros e templates de suporte.',
          xpReward: 15,
          resources: [
            { id: 'res-1', name: 'Starter-Kit-LearnSpace.zip', url: 'https://learnspace.io/files/starter.zip', size: '12.4 MB', type: 'zip' },
            { id: 'res-2', name: 'Guia-Atalhos-Completos.pdf', url: 'https://learnspace.io/files/guia.pdf', size: '2.1 MB', type: 'pdf' },
            { id: 'res-3', name: 'Figma-Design-Tokens.fig', url: 'https://learnspace.io/files/tokens.fig', size: '8.7 MB', type: 'figma' }
          ]
        }
      ],
    },
  ]);

  // Active lesson editor modal state
  const [editingLessonId, setEditingLessonId] = useState<{ modId: string; lesId: string } | null>(null);

  // Toggle channel accordion
  const toggleChannelExpand = (id: string) => {
    setExpandedChannelIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Add channel from template or custom
  const handleAddChannelFromTemplate = (template: ChannelTemplate) => {
    soundEffects.play('click');
    const cleanName = template.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const isDuplicate = channels.some(c => c.name === cleanName);
    const finalName = isDuplicate ? `${cleanName}-${channels.length + 1}` : cleanName;

    const newChan: ChannelItem = {
      id: `ch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: finalName,
      type: template.type,
      topic: template.description,
      guidingQuestion: `Qual o objetivo principal deste canal #${finalName}?`,
      guidelines: 'Mantenha a comunicação respeitosa e no âmbito do curso.',
    };

    setChannels(prev => [...prev, newChan]);
    toast({
      title: 'Canal Criado',
      message: `O canal #${finalName} foi adicionado à comunidade do curso.`,
      type: 'success'
    });
  };

  const handleAddCustomChannel = (type: 'text' | 'voice' | 'qa' | 'showcase' | 'doc' = 'text') => {
    soundEffects.play('click');
    const newChan: ChannelItem = {
      id: `ch-${Date.now()}`,
      name: type === 'voice' ? `sala-ao-vivo-${channels.length + 1}` : `novo-canal-${channels.length + 1}`,
      type,
      topic: 'Canal temático da turma.',
      guidingQuestion: 'Qual o tema principal a debater aqui?',
      guidelines: 'Respeite as regras de convivência da comunidade.',
    };
    setChannels(prev => [...prev, newChan]);
  };

  const handleUpdateChannel = (id: string, field: keyof ChannelItem, value: any) => {
    setChannels(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (field === 'name') {
        const formatted = String(value).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
        return { ...c, name: formatted };
      }
      return { ...c, [field]: value };
    }));
  };

  const handleRemoveChannel = (id: string) => {
    soundEffects.play('click');
    if (channels.length <= 1) {
      toast({ title: 'Atenção', message: 'O curso deve conter pelo menos 1 canal.', type: 'error' });
      return;
    }
    setChannels(prev => prev.filter(c => c.id !== id));
  };

  // Module & Lesson helpers
  const handleAddModule = () => {
    soundEffects.play('click');
    const newMod: ModuleItem = {
      id: `mod-${Date.now()}`,
      title: `Módulo ${modules.length + 1}: Novo Módulo`,
      description: 'Breve descrição dos tópicos abordados neste módulo.',
      dripMode: 'instant',
      dripDays: 0,
      lessons: [
        {
          id: `les-${Date.now()}-1`,
          title: 'Lição 1: Introdução ao Módulo',
          type: 'video',
          durationMin: 15,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          content: 'Conteúdo programático da lição.',
          xpReward: 25,
          videoChapters: [{ id: 'vc-1', time: '00:00', title: 'Introdução' }]
        },
      ],
    };
    setModules(prev => [...prev, newMod]);
  };

  const handleUpdateModule = (modId: string, field: keyof ModuleItem, value: any) => {
    setModules(prev => prev.map(m => (m.id === modId ? { ...m, [field]: value } : m)));
  };

  const handleRemoveModule = (modId: string) => {
    soundEffects.play('click');
    if (modules.length <= 1) {
      toast({ title: 'Atenção', message: 'O curso deve conter pelo menos 1 módulo.', type: 'error' });
      return;
    }
    setModules(prev => prev.filter(m => m.id !== modId));
  };

  const handleAddLesson = (modId: string, lessonType: LessonType = 'video') => {
    soundEffects.play('click');
    setModules(prev =>
      prev.map(m => {
        if (m.id !== modId) return m;
        const newLes: LessonItem = {
          id: `les-${Date.now()}`,
          title: `Nova Lição ${m.lessons.length + 1} (${lessonType})`,
          type: lessonType,
          durationMin: 15,
          videoUrl: lessonType === 'video' ? 'https://www.w3schools.com/html/mov_bbb.mp4' : '',
          content: 'Descrição detalhada e recursos da lição.',
          xpReward: 25,
        };

        if (lessonType === 'video') {
          newLes.videoChapters = [{ id: 'vc-1', time: '00:00', title: 'Introdução' }];
        } else if (lessonType === 'code') {
          newLes.codeChallenge = {
            language: 'typescript',
            initialCode: '// Escreva a sua solução aqui\nfunction solucao() {\n  return true;\n}',
            solutionCode: 'function solucao() {\n  return true;\n}',
            instructions: 'Resolva o problema proposto.',
            hints: ['Pense na complexidade do algoritmo.']
          };
        } else if (lessonType === 'text') {
          newLes.richArticle = {
            markdown: '### Tópico de Leitura\n\nConteúdo explicativo com conceitos fundamentais.',
            calloutType: 'tip',
            calloutTitle: 'Dica do Instrutor',
            calloutText: 'Pratique este conceito criando um exemplo próprio.',
            checklist: [{ id: 'cl-1', text: 'Ler documentação oficial' }]
          };
        } else if (lessonType === 'resource') {
          newLes.resources = [
            { id: 'res-1', name: 'Recurso-Apoio.pdf', url: 'https://learnspace.io/files/guia.pdf', size: '1.5 MB', type: 'pdf' }
          ];
        }

        return { ...m, lessons: [...m.lessons, newLes] };
      })
    );
  };

  const handleUpdateLesson = (modId: string, lesId: string, field: keyof LessonItem, value: any) => {
    setModules(prev =>
      prev.map(m => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: m.lessons.map(l => {
            if (l.id !== lesId) return l;
            return { ...l, [field]: value };
          }),
        };
      })
    );
  };

  const handleRemoveLesson = (modId: string, lesId: string) => {
    soundEffects.play('click');
    setModules(prev =>
      prev.map(m => {
        if (m.id !== modId) return m;
        if (m.lessons.length <= 1) {
          toast({ title: 'Atenção', message: 'Cada módulo deve conter pelo menos 1 lição.', type: 'error' });
          return m;
        }
        return { ...m, lessons: m.lessons.filter(l => l.id !== lesId) };
      })
    );
  };

  // Submit / Publish Course
  const handlePublish = async () => {
    if (!title.trim()) {
      toast({ title: 'Campo Obrigatório', message: 'Por favor, introduza o nome do curso no Passo 1.', type: 'error' });
      setActiveStep(1);
      return;
    }

    setIsSubmitting(true);
    soundEffects.play('success');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || 'Curso completo com comunidade, aulas e acompanhamento contínuo.',
        category,
        difficulty,
        language,
        price: isFree ? 0 : Number(price || 0),
        isFree,
        hasDiscount,
        discountPrice: Number(discountPrice || 0),
        couponCode,
        durationHours: Number(durationHours || 10),
        thumbnailUrl: thumbnailUrl.trim() || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        brandColor,
        badge: {
          title: badgeTitle,
          icon: badgeIcon,
          rarity: badgeRarity,
          xpReward: courseCompletionXp
        },
        certificate: {
          title: certificateTitle,
          instructorSignature: certificateInstructorSignature,
          organization: certificateOrg,
          customMessage: certificateCustomMessage,
          hasQrCode: certificateHasQrCode
        },
        channels,
        modules,
      };

      const result = await api.createCourse(payload);
      toast({ title: 'Curso Criado com Sucesso', message: 'O curso, canais da comunidade e lições foram publicados com sucesso!', type: 'success' });
      navigate(`/learn/${result.id || result.slug}`);
    } catch (err: any) {
      toast({ title: 'Erro ao Publicar', message: err.message || 'Não foi possível publicar o curso.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Badge icon helper
  const renderBadgeIcon = (iconName: string, className = "w-5 h-5") => {
    switch (iconName) {
      case 'trophy': return <Trophy className={className} />;
      case 'flame': return <Flame className={className} />;
      case 'sparkles': return <Sparkles className={className} />;
      case 'star': return <Star className={className} />;
      case 'shield': return <Shield className={className} />;
      default: return <Award className={className} />;
    }
  };

  // Channel vector icon helper
  const renderChannelIcon = (type: string, className = "w-4 h-4") => {
    switch (type) {
      case 'voice':
        return <Volume2 className={`${className} text-indigo-400`} />;
      case 'qa':
        return <HelpCircle className={`${className} text-amber-400`} />;
      case 'showcase':
        return <Code2 className={`${className} text-emerald-400`} />;
      case 'doc':
        return <FileText className={`${className} text-blue-400`} />;
      default:
        return <Hash className={`${className} text-zinc-400`} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 pb-24 font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#0d0e14]/95 backdrop-blur-xl border-b border-[#1e2230] py-3.5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <Link 
              to="/creator" 
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1a1d28] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-black text-white tracking-tight">
                  Criador de Cursos Avançado
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Estúdio PRO
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Personalize lições interativas, canais de estudo, medalhas de gamificação e certificados.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Eye className="w-4 h-4" />}
              onClick={() => {
                soundEffects.play('click');
                setPreviewOpen(true);
              }}
              className="font-bold cursor-pointer rounded-xl text-xs bg-[#1a1d28] hover:bg-[#242838] text-zinc-200 border-[#2b3044]"
            >
              Pré-visualizar
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Check className="w-4 h-4" />}
              isLoading={isSubmitting}
              onClick={handlePublish}
              className="font-black rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Publicar Curso & Comunidade
            </Button>
          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8">

        {/* Step Indicator */}
        <nav aria-label="Progresso da criação do curso" className="mb-8">
          <div className="bg-[#12141c] p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-w-4xl mx-auto border border-[#1e2230]">
            {[
              { num: 1, label: '1. Identidade & Marca' },
              { num: 2, label: '2. Espaço & Canais' },
              { num: 3, label: '3. Aulas & Módulos' },
              { num: 4, label: '4. Revisão & Publicação' },
            ].map((st) => {
              const isCurrent = activeStep === st.num;
              return (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => { soundEffects.play('click'); setActiveStep(st.num as any); }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 select-none ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-black'
                      : 'text-zinc-400 hover:text-white hover:bg-[#1a1d28]'
                  }`}
                >
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ======================================================================= */}
        {/* PASSO 1: IDENTIDADE, PERSONALIZAÇÃO VISUAL, BADGES E CERTIFICADOS */}
        {/* ======================================================================= */}
        {activeStep === 1 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            
            {/* 1.1 Informações Principais */}
            <Card className="p-6 bg-[#11131a] border-[#1e2230] rounded-3xl flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2230]">
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    Identidade Principal do Curso
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Título, descrição, categorias e configurações de acesso.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-zinc-300">Título do Curso *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: Full-Stack React & Node.js Pro: Do Zero à Produção"
                    className="bg-[#181a24] border border-[#262a3b] rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder:text-zinc-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-zinc-300">Descrição Completa</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Descreva o que os estudantes vão dominar, metodologias e projetos que irão construir..."
                    className="bg-[#181a24] border border-[#262a3b] rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none placeholder:text-zinc-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-300">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-[#181a24] border border-[#262a3b] rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="programming">Programação & Web Dev</option>
                    <option value="design">UI/UX Design & Figma</option>
                    <option value="ai">Inteligência Artificial & Data</option>
                    <option value="business">Negócios & Gestão</option>
                    <option value="marketing">Marketing Digital & Growth</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-300">Dificuldade</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="bg-[#181a24] border border-[#262a3b] rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Iniciante">Iniciante (Fundamentos)</option>
                    <option value="Intermédio">Intermédio (Prático)</option>
                    <option value="Avançado">Avançado (Arquitetura)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-300">Capa / Imagem de Apresentação (URL)</label>
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="bg-[#181a24] border border-[#262a3b] rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-300">Carga Horária Estimada (Horas)</label>
                  <input
                    type="number"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="bg-[#181a24] border border-[#262a3b] rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </Card>

            {/* 1.2 Personalização Visual & Preço */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Tema Visual da Marca */}
              <Card className="p-6 bg-[#11131a] border-[#1e2230] rounded-3xl flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#1e2230]">
                  <Palette className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-black text-white">Cor de Destaque da Marca do Curso</h3>
                </div>
                <p className="text-xs text-zinc-400">Personalize o tom dos badges, botões e cartões de progresso.</p>

                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { id: 'indigo', label: 'Índigo', color: 'bg-indigo-600' },
                    { id: 'cyan', label: 'Ciano', color: 'bg-cyan-500' },
                    { id: 'emerald', label: 'Esmeralda', color: 'bg-emerald-500' },
                    { id: 'rose', label: 'Rosa Neon', color: 'bg-rose-500' },
                    { id: 'amber', label: 'Âmbar Ouro', color: 'bg-amber-500' },
                    { id: 'violet', label: 'Violeta', color: 'bg-purple-600' },
                    { id: 'slate', label: 'Obsidiana', color: 'bg-zinc-600' },
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setBrandColor(c.id as any)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        brandColor === c.id
                          ? 'border-white bg-[#1a1d28] shadow-lg shadow-black/40'
                          : 'border-[#262a3b] bg-[#141620] hover:border-zinc-500'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${c.color}`} />
                      <span className="text-[11px] font-bold text-zinc-300">{c.label}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Preçário & Promoções */}
              <Card className="p-6 bg-[#11131a] border-[#1e2230] rounded-3xl flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#1e2230]">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-black text-white">Modelo de Preço & Descontos</h3>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFree(true)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isFree ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-[#181a24] text-zinc-400 border-[#262a3b]'
                    }`}
                  >
                    100% Gratuito
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFree(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      !isFree ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-[#181a24] text-zinc-400 border-[#262a3b]'
                    }`}
                  >
                    Curso Pago (Premium)
                  </button>
                </div>

                {!isFree && (
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[11px] font-bold text-zinc-400">Preço Regular (€)</label>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full bg-[#181a24] border border-[#262a3b] rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[11px] font-bold text-zinc-400">Preço Promo / Early Bird (€)</label>
                        <input
                          type="number"
                          value={discountPrice}
                          onChange={(e) => setDiscountPrice(e.target.value)}
                          className="w-full bg-[#181a24] border border-[#262a3b] rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400">Cupão Promocional de Lançamento</label>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full bg-[#181a24] border border-[#262a3b] rounded-xl px-3 py-2 text-xs text-white uppercase font-mono"
                      />
                    </div>
                  </div>
                )}
              </Card>

            </div>

            {/* 1.3 Designer de Badge do Curso & Certificado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Badge Designer */}
              <Card className="p-6 bg-[#11131a] border-[#1e2230] rounded-3xl flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#1e2230]">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-black text-white">Designer de Badge do Curso</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                    +{courseCompletionXp} XP Recompensa
                  </span>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#181a24] border border-[#262a3b]">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl text-black font-black ${
                    badgeRarity === 'diamond' ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white' :
                    badgeRarity === 'platinum' ? 'bg-gradient-to-br from-slate-200 to-slate-400' :
                    badgeRarity === 'gold' ? 'bg-gradient-to-br from-amber-300 to-amber-500' :
                    badgeRarity === 'silver' ? 'bg-gradient-to-br from-zinc-300 to-zinc-500' :
                    'bg-gradient-to-br from-orange-400 to-amber-700'
                  }`}>
                    {renderBadgeIcon(badgeIcon, "w-7 h-7")}
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-black text-white">{badgeTitle || 'Nome da Medalha'}</p>
                    <p className="text-[11px] text-zinc-400 capitalize">Tier: {badgeRarity} • Desbloqueado ao concluir 100%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400">Título da Medalha</label>
                    <input
                      type="text"
                      value={badgeTitle}
                      onChange={(e) => setBadgeTitle(e.target.value)}
                      className="w-full bg-[#181a24] border border-[#262a3b] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400">Raridade</label>
                    <select
                      value={badgeRarity}
                      onChange={(e) => setBadgeRarity(e.target.value as any)}
                      className="w-full bg-[#181a24] border border-[#262a3b] rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="bronze">Bronze (Básico)</option>
                      <option value="silver">Prata (Médio)</option>
                      <option value="gold">Ouro (Avançado)</option>
                      <option value="platinum">Platina (Especialista)</option>
                      <option value="diamond">Diamante (Lendário)</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Certificate Designer */}
              <Card className="p-6 bg-[#11131a] border-[#1e2230] rounded-3xl flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#1e2230]">
                  <FileBadge className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-black text-white">Designer de Certificado de Conclusão</h3>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400">Assinatura do Instrutor</label>
                    <input
                      type="text"
                      value={certificateInstructorSignature}
                      onChange={(e) => setCertificateInstructorSignature(e.target.value)}
                      className="w-full bg-[#181a24] border border-[#262a3b] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400">Instituição / Academia Emissora</label>
                    <input
                      type="text"
                      value={certificateOrg}
                      onChange={(e) => setCertificateOrg(e.target.value)}
                      className="w-full bg-[#181a24] border border-[#262a3b] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400">Mensagem Oficial de Conclusão</label>
                    <textarea
                      value={certificateCustomMessage}
                      onChange={(e) => setCertificateCustomMessage(e.target.value)}
                      rows={2}
                      className="w-full bg-[#181a24] border border-[#262a3b] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </Card>

            </div>

            {/* Next step button */}
            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                onClick={() => { soundEffects.play('click'); setActiveStep(2); }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-3 rounded-xl"
              >
                Continuar para Canais & Comunidade
              </Button>
            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* PASSO 2: CANAIS DE TEXTO & SALAS DE ESTUDO AO VIVO */}
        {/* ======================================================================= */}
        {activeStep === 2 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <Card className="p-6 bg-[#11131a] border-[#1e2230] rounded-3xl flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2230]">
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-indigo-400" />
                    Canais de Texto & Salas de Estudo ao Vivo
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Configure os canais de texto, fóruns de dúvidas e salas de mentoria da turma.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAddCustomChannel('text')}
                    leftIcon={<Plus className="w-4 h-4" />}
                    className="text-xs bg-[#181a24] border-[#262a3b] text-zinc-200"
                  >
                    + Canal Texto
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleAddCustomChannel('voice')}
                    leftIcon={<Volume2 className="w-4 h-4" />}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    + Sala de Voz/Vídeo
                  </Button>
                </div>
              </div>

              {/* Channel List */}
              <div className="flex flex-col gap-3">
                {channels.map((chan, idx) => (
                  <div key={chan.id} className="p-4 rounded-2xl bg-[#141620] border border-[#222638] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#1e2230] flex items-center justify-center">
                          {renderChannelIcon(chan.type)}
                        </div>
                        <input
                          type="text"
                          value={chan.name}
                          onChange={(e) => handleUpdateChannel(chan.id, 'name', e.target.value)}
                          className="bg-[#181a24] border border-[#2b3044] rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                        />
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono capitalize">
                          {chan.type === 'voice' ? 'Voz & Vídeo ao Vivo' : chan.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleChannelExpand(chan.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#202434] transition-colors"
                        >
                          {expandedChannelIds.has(chan.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveChannel(chan.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {expandedChannelIds.has(chan.id) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#1e2230]">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400">Tópico do Canal</label>
                          <input
                            type="text"
                            value={chan.topic}
                            onChange={(e) => handleUpdateChannel(chan.id, 'topic', e.target.value)}
                            className="w-full bg-[#181a24] border border-[#2b3044] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400">Regras / Orientações</label>
                          <input
                            type="text"
                            value={chan.guidelines}
                            onChange={(e) => handleUpdateChannel(chan.id, 'guidelines', e.target.value)}
                            className="w-full bg-[#181a24] border border-[#2b3044] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex justify-between pt-4">
              <Button
                variant="secondary"
                onClick={() => { soundEffects.play('click'); setActiveStep(1); }}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="bg-[#181a24] border-[#262a3b] text-zinc-300"
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                onClick={() => { soundEffects.play('click'); setActiveStep(3); }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-3 rounded-xl"
              >
                Continuar para Aulas & Módulos
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* PASSO 3: MÓDULOS & 7 TIPOS DE LIÇÕES RICAS */}
        {/* ======================================================================= */}
        {activeStep === 3 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#11131a] p-5 rounded-3xl border border-[#1e2230]">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  Módulos & Lições Ricas
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Crie vídeos com capítulos, desafios de código sandbox, artigos com callouts, quizzes e recursos.
                </p>
              </div>

              <Button
                onClick={handleAddModule}
                leftIcon={<Plus className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
              >
                + Novo Módulo
              </Button>
            </div>

            {/* Modules List */}
            {modules.map((mod, mIdx) => (
              <Card key={mod.id} className="p-6 bg-[#11131a] border-[#1e2230] rounded-3xl flex flex-col gap-5">
                
                {/* Module Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2230]">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={mod.title}
                      onChange={(e) => handleUpdateModule(mod.id, 'title', e.target.value)}
                      className="bg-[#181a24] border border-[#2b3044] rounded-xl px-3.5 py-2 text-sm font-black text-white w-full max-w-md"
                    />
                    <input
                      type="text"
                      value={mod.description}
                      onChange={(e) => handleUpdateModule(mod.id, 'description', e.target.value)}
                      placeholder="Descrição do módulo..."
                      className="bg-transparent border-0 text-xs text-zinc-400 mt-1 w-full focus:outline-none"
                    />
                  </div>

                  {/* Drip Pacing mode */}
                  <div className="flex items-center gap-2">
                    <select
                      value={mod.dripMode || 'instant'}
                      onChange={(e) => handleUpdateModule(mod.id, 'dripMode', e.target.value)}
                      className="bg-[#181a24] border border-[#2b3044] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 font-bold"
                      title="Regra de desbloqueio"
                    >
                      <option value="instant">Desbloqueio Imediato</option>
                      <option value="sequential">Sequencial (Pré-requisito)</option>
                      <option value="drip">Programado por Dias (Drip)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveModule(mod.id)}
                      className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Eliminar Módulo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Lessons in this module */}
                <div className="flex flex-col gap-3">
                  {mod.lessons.map((les, lIdx) => (
                    <div key={les.id} className="p-4 rounded-2xl bg-[#141620] border border-[#222638] flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-3">
                          <span className="w-6 h-6 rounded-lg bg-[#1e2230] text-zinc-300 text-xs font-bold flex items-center justify-center">
                            {lIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={les.title}
                            onChange={(e) => handleUpdateLesson(mod.id, les.id, 'title', e.target.value)}
                            className="bg-[#181a24] border border-[#2b3044] rounded-lg px-3 py-1.5 text-xs font-bold text-white flex-1"
                          />
                        </div>

                        {/* Lesson Type selector */}
                        <div className="flex items-center gap-2">
                          <select
                            value={les.type}
                            onChange={(e) => handleUpdateLesson(mod.id, les.id, 'type', e.target.value as any)}
                            className="bg-[#181a24] border border-[#2b3044] rounded-lg px-2.5 py-1.5 text-xs text-indigo-300 font-bold"
                          >
                            <option value="video">Vídeo & Capítulos</option>
                            <option value="code">Desafio de Código</option>
                            <option value="text">Artigo Técnico Rico</option>
                            <option value="quiz">Questionário / Avaliação</option>
                            <option value="project">Projeto Prático</option>
                            <option value="resource">Pacote de Recursos / Ficheiros</option>
                            <option value="embed">Ambiente Interativo / Embed</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveLesson(mod.id, les.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Lesson Custom Content Editors by Type */}
                      
                      {/* TYPE 1: Video with Chapters */}
                      {les.type === 'video' && (
                        <div className="p-3 rounded-xl bg-[#181a24] border border-[#262a3b] flex flex-col gap-2.5">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={les.videoUrl || ''}
                              onChange={(e) => handleUpdateLesson(mod.id, les.id, 'videoUrl', e.target.value)}
                              placeholder="URL do Vídeo (ex: https://.../video.mp4 ou YouTube)"
                              className="flex-1 bg-[#12141c] border border-[#2b3044] rounded-lg px-3 py-1.5 text-xs text-zinc-300 font-mono"
                            />
                            <input
                              type="number"
                              value={les.durationMin}
                              onChange={(e) => handleUpdateLesson(mod.id, les.id, 'durationMin', Number(e.target.value))}
                              placeholder="Minutos"
                              className="w-20 bg-[#12141c] border border-[#2b3044] rounded-lg px-2 py-1.5 text-xs text-zinc-300 text-center"
                            />
                          </div>
                          
                          {/* Chapters preview */}
                          <div className="flex flex-wrap gap-1.5 items-center text-[11px] text-zinc-400">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            <span>Capítulos:</span>
                            {(les.videoChapters || []).map((ch, cIdx) => (
                              <span key={ch.id} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                                {ch.time} {ch.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TYPE 2: Coding Sandbox */}
                      {les.type === 'code' && (
                        <div className="p-3 rounded-xl bg-[#181a24] border border-[#262a3b] flex flex-col gap-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                              <Code2 className="w-3.5 h-3.5" />
                              Sandbox de Código Interativo ({les.codeChallenge?.language || 'typescript'})
                            </span>
                            <span className="text-[10px] text-zinc-400">Executável pelo Aluno</span>
                          </div>
                          <textarea
                            value={les.codeChallenge?.initialCode || ''}
                            onChange={(e) => {
                              const curr = les.codeChallenge || { language: 'typescript', initialCode: '', solutionCode: '', instructions: '', hints: [] };
                              handleUpdateLesson(mod.id, les.id, 'codeChallenge', { ...curr, initialCode: e.target.value });
                            }}
                            rows={3}
                            className="bg-[#12141c] border border-[#2b3044] rounded-lg p-2.5 font-mono text-xs text-emerald-300 focus:outline-none resize-none"
                            placeholder="// Código inicial para o estudante..."
                          />
                        </div>
                      )}

                      {/* TYPE 3: Rich Article with Callouts */}
                      {les.type === 'text' && (
                        <div className="p-3 rounded-xl bg-[#181a24] border border-[#262a3b] flex flex-col gap-2">
                          <textarea
                            value={les.richArticle?.markdown || les.content}
                            onChange={(e) => {
                              const curr = les.richArticle || { markdown: '', calloutType: 'tip', calloutTitle: 'Dica', calloutText: '', checklist: [] };
                              handleUpdateLesson(mod.id, les.id, 'richArticle', { ...curr, markdown: e.target.value });
                            }}
                            rows={2}
                            className="bg-[#12141c] border border-[#2b3044] rounded-lg p-2 text-xs text-zinc-200 focus:outline-none resize-none"
                            placeholder="Texto markdown da aula..."
                          />
                        </div>
                      )}

                      {/* TYPE 4: Downloadable Resource Pack */}
                      {les.type === 'resource' && (
                        <div className="p-3 rounded-xl bg-[#181a24] border border-[#262a3b] flex flex-col gap-2">
                          <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                            <Download className="w-3.5 h-3.5" />
                            Ficheiros & Assets de Apoio ({les.resources?.length || 0})
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {(les.resources || []).map(res => (
                              <span key={res.id} className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs flex items-center gap-1.5">
                                <FolderArchive className="w-3 h-3" />
                                {res.name} ({res.size})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  ))}

                  {/* Add Lesson Quick Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-[11px] font-bold text-zinc-400">Adicionar Lição:</span>
                    <button
                      type="button"
                      onClick={() => handleAddLesson(mod.id, 'video')}
                      className="px-2.5 py-1 rounded-lg bg-[#181a24] hover:bg-[#222638] text-indigo-300 border border-[#262a3b] text-xs font-bold cursor-pointer"
                    >
                      + Vídeo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddLesson(mod.id, 'code')}
                      className="px-2.5 py-1 rounded-lg bg-[#181a24] hover:bg-[#222638] text-emerald-300 border border-[#262a3b] text-xs font-bold cursor-pointer"
                    >
                      + Código Desafio
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddLesson(mod.id, 'text')}
                      className="px-2.5 py-1 rounded-lg bg-[#181a24] hover:bg-[#222638] text-zinc-300 border border-[#262a3b] text-xs font-bold cursor-pointer"
                    >
                      + Artigo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddLesson(mod.id, 'quiz')}
                      className="px-2.5 py-1 rounded-lg bg-[#181a24] hover:bg-[#222638] text-amber-300 border border-[#262a3b] text-xs font-bold cursor-pointer"
                    >
                      + Quiz
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddLesson(mod.id, 'resource')}
                      className="px-2.5 py-1 rounded-lg bg-[#181a24] hover:bg-[#222638] text-blue-300 border border-[#262a3b] text-xs font-bold cursor-pointer"
                    >
                      + Recursos
                    </button>
                  </div>
                </div>
              </Card>
            ))}

            <div className="flex justify-between pt-4">
              <Button
                variant="secondary"
                onClick={() => { soundEffects.play('click'); setActiveStep(2); }}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="bg-[#181a24] border-[#262a3b] text-zinc-300"
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                onClick={() => { soundEffects.play('click'); setActiveStep(4); }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-500 font-bold px-6 py-3 rounded-xl"
              >
                Rever & Publicar
              </Button>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* PASSO 4: REVISÃO & PUBLICAÇÃO INTERATIVA */}
        {/* ======================================================================= */}
        {activeStep === 4 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <Card className="p-6 bg-[#11131a] border-[#1e2230] rounded-3xl flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2230]">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    Revisão Completa do Curso
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Confirme todos os detalhes antes de lançar para os estudantes.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20">
                  Pronto para Publicar
                </span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#141620] border border-[#222638] flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-zinc-400">Estrutura Curricular</span>
                  <p className="text-lg font-black text-white">{modules.length} Módulos</p>
                  <p className="text-xs text-indigo-400 font-bold">{modules.reduce((acc, m) => acc + m.lessons.length, 0)} Lições Ricas</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#141620] border border-[#222638] flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-zinc-400">Comunidade da Turma</span>
                  <p className="text-lg font-black text-white">{channels.length} Canais</p>
                  <p className="text-xs text-emerald-400 font-bold">Salas de Voz, Q&A e Texto</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#141620] border border-[#222638] flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-zinc-400">Gamificação & Certificado</span>
                  <p className="text-lg font-black text-white">+{courseCompletionXp} XP</p>
                  <p className="text-xs text-amber-400 font-bold">Badge {badgeRarity} + Certificado QR</p>
                </div>
              </div>

              {/* Course Identity Card Preview */}
              <div className="p-5 rounded-2xl bg-[#141620] border border-[#222638] flex items-center gap-4">
                <img
                  src={thumbnailUrl}
                  alt={title}
                  className="w-24 h-24 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-white truncate">{title || 'Título do Curso'}</h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{description || 'Sem descrição.'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                      {category}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                      {difficulty}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {isFree ? 'Gratuito' : `€${price}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t border-[#1e2230]">
                <Button
                  variant="secondary"
                  onClick={() => { soundEffects.play('click'); setActiveStep(3); }}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  className="bg-[#181a24] border-[#262a3b] text-zinc-300"
                >
                  Voltar às Aulas
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  onClick={handlePublish}
                  leftIcon={<Check className="w-5 h-5" />}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/40 cursor-pointer"
                >
                  Confirmar & Publicar Curso
                </Button>
              </div>
            </Card>
          </div>
        )}

      </main>
    </div>
  );
};
