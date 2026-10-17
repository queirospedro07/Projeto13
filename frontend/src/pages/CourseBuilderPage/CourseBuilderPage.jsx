import './CourseBuilderPage.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import {
  LuLayers as Layers,
  LuHash as Hash,
  LuVolume2 as Volume2,
  LuCircleHelp as HelpCircle,
  LuPlus as Plus,
  LuTrash2 as Trash2,
  LuArrowRight as ArrowRight,
  LuArrowLeft as ArrowLeft,
  LuCheck as Check,
  LuX as X,
  LuSparkles as Sparkles,
  LuBookOpen as BookOpen,
  LuCircleCheck as CheckCircle2,
  LuDollarSign as DollarSign,
  LuChevronDown as ChevronDown,
  LuChevronUp as ChevronUp,
  LuAward as Award,
  LuTrophy as Trophy,
  LuFlame as Flame,
  LuStar as Star,
  LuShield as Shield,
  LuDownload as Download,
  LuMegaphone as Megaphone,
  LuRadio as Radio,
  LuFileBadge as FileBadge,
  LuSlidersHorizontal as SlidersHorizontal,
  LuLock as Lock,
  LuCamera as Camera,
  LuLoaderCircle as Loader2,
  LuSend as Send,
  LuCloudUpload as UploadCloud,
  LuPaperclip as Paperclip,
} from 'react-icons/lu';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Select } from '../../components/Select';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { soundEffects } from '../../services/soundEffects';
import { api } from '../../services/api';
import { formatCoursePrice, formatCategory } from '../../utils/formatters';
export const QuizLessonEditor = ({ quiz, onChange }) => {
  const currentQuiz = quiz || {
    title: 'Questionário de Avaliação',
    description: 'Responda às questões para validar a sua compreensão da aula.',
    passingScore: 70,
    xpReward: 50,
    questions: [],
  };
  const handleUpdateField = (field, value) => {
    onChange({
      ...currentQuiz,
      [field]: value,
    });
  };
  const handleAddQuestion = (type = 'single') => {
    soundEffects.play('click');
    const newQ = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      question: '',
      type,
      explanation: '',
      points: 10,
      options:
        type === 'true-false'
          ? [
              {
                id: 'opt-tf-1',
                text: 'Verdadeiro',
                isCorrect: true,
              },
              {
                id: 'opt-tf-2',
                text: 'Falso',
                isCorrect: false,
              },
            ]
          : type === 'open-ended'
            ? []
            : [
                {
                  id: 'opt-1',
                  text: 'Opção 1 (Correta)',
                  isCorrect: true,
                },
                {
                  id: 'opt-2',
                  text: 'Opção 2',
                  isCorrect: false,
                },
              ],
      gradingMode: type === 'open-ended' ? 'auto' : undefined,
      keywords: type === 'open-ended' ? [] : undefined,
      minWords: type === 'open-ended' ? 10 : undefined,
      expectedAnswer: '',
    };
    handleUpdateField('questions', [...currentQuiz.questions, newQ]);
  };
  const handleUpdateQuestion = (qId, updates) => {
    const updated = currentQuiz.questions.map((q) => {
      if (q.id !== qId) return q;
      const nextQ = {
        ...q,
        ...updates,
      };
      if (updates.type === 'true-false' && (!nextQ.options || nextQ.options.length !== 2)) {
        nextQ.options = [
          {
            id: 'opt-tf-1',
            text: 'Verdadeiro',
            isCorrect: true,
          },
          {
            id: 'opt-tf-2',
            text: 'Falso',
            isCorrect: false,
          },
        ];
      } else if (
        updates.type &&
        updates.type !== 'true-false' &&
        updates.type !== 'open-ended' &&
        (!nextQ.options || nextQ.options.length === 0)
      ) {
        nextQ.options = [
          {
            id: 'opt-1',
            text: 'Opção 1',
            isCorrect: true,
          },
          {
            id: 'opt-2',
            text: 'Opção 2',
            isCorrect: false,
          },
        ];
      }
      return nextQ;
    });
    handleUpdateField('questions', updated);
  };
  const handleRemoveQuestion = (qId) => {
    soundEffects.play('click');
    handleUpdateField(
      'questions',
      currentQuiz.questions.filter((q) => q.id !== qId),
    );
  };
  const handleAddOption = (qId) => {
    soundEffects.play('click');
    const question = currentQuiz.questions.find((q) => q.id === qId);
    if (!question) return;
    const optCount = question.options.length + 1;
    const newOpt = {
      id: `opt-${Date.now()}-${optCount}`,
      text: `Opção ${optCount}`,
      isCorrect: false,
    };
    handleUpdateQuestion(qId, {
      options: [...question.options, newOpt],
    });
  };
  const handleUpdateOption = (qId, optId, text) => {
    const question = currentQuiz.questions.find((q) => q.id === qId);
    if (!question) return;
    const options = question.options.map((o) =>
      o.id === optId
        ? {
            ...o,
            text,
          }
        : o,
    );
    handleUpdateQuestion(qId, {
      options,
    });
  };
  const handleToggleOptionCorrect = (qId, optId) => {
    soundEffects.play('click');
    const question = currentQuiz.questions.find((q) => q.id === qId);
    if (!question) return;
    let options;
    if (
      question.type === 'single' ||
      question.type === 'find-incorrect' ||
      question.type === 'true-false'
    ) {
      options = question.options.map((o) => ({
        ...o,
        isCorrect: o.id === optId,
      }));
    } else {
      options = question.options.map((o) =>
        o.id === optId
          ? {
              ...o,
              isCorrect: !o.isCorrect,
            }
          : o,
      );
      if (!options.some((o) => o.isCorrect)) {
        options = options.map((o) =>
          o.id === optId
            ? {
                ...o,
                isCorrect: true,
              }
            : o,
        );
      }
    }
    handleUpdateQuestion(qId, {
      options,
    });
  };
  const handleRemoveOption = (qId, optId) => {
    soundEffects.play('click');
    const question = currentQuiz.questions.find((q) => q.id === qId);
    if (!question || question.options.length <= 2) return;
    let remaining = question.options.filter((o) => o.id !== optId);
    if (!remaining.some((o) => o.isCorrect)) {
      remaining = remaining.map((o, idx) =>
        idx === 0
          ? {
              ...o,
              isCorrect: true,
            }
          : o,
      );
    }
    handleUpdateQuestion(qId, {
      options: remaining,
    });
  };
  return (
    <div className="course-builder-panel">
      <div className="course-builder-panel-2">
        <div className="course-builder-panel-3">
          <label className="course-builder-field-label">Título do Questionário</label>
          <input
            type="text"
            value={currentQuiz.title}
            onChange={(e) => handleUpdateField('title', e.target.value)}
            placeholder="Ex: Avaliação de React e TypeScript"
            className="course-builder-field"
          />
        </div>
        <div className="course-builder-panel-3">
          <label className="course-builder-field-label">Nota Mínima Aprovação (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={currentQuiz.passingScore}
            onChange={(e) => handleUpdateField('passingScore', Number(e.target.value) || 0)}
            className="course-builder-field"
          />
        </div>
        <div className="course-builder-panel-4">
          <label className="course-builder-field-label">Instruções aos Alunos</label>
          <input
            type="text"
            value={currentQuiz.description}
            onChange={(e) => handleUpdateField('description', e.target.value)}
            placeholder="Ex: Responda com atenção a todas as perguntas para desbloquear a aula seguinte."
            className="course-builder-field"
          />
        </div>
      </div>

      <div className="course-builder-panel-5">
        <div className="course-builder-panel-6">
          <span className="course-builder-label">Perguntas ({currentQuiz.questions.length})</span>
          <div className="course-builder-panel-7">
            <button
              type="button"
              onClick={() => handleAddQuestion('single')}
              className="course-builder-button"
            >
              <Plus className="course-builder-plus" />
              <span>Adicionar Pergunta</span>
            </button>
          </div>
        </div>

        {currentQuiz.questions.length === 0 ? (
          <div className="course-builder-panel-8">
            <p className="course-builder-description">
              Nenhuma pergunta adicionada a este questionário.
            </p>
            <p className="course-builder-description-2">
              Clique em "Adicionar Pergunta" acima para começar.
            </p>
          </div>
        ) : (
          currentQuiz.questions.map((q, qIdx) => (
            <div key={q.id} className="course-builder-panel-9">
              <div className="course-builder-panel-10">
                <div className="course-builder-panel-11">
                  <span className="course-builder-label-2">{qIdx + 1}</span>
                  <Select
                    value={q.type}
                    onChange={(e) =>
                      handleUpdateQuestion(q.id, {
                        type: e.target.value,
                      })
                    }
                    className="course-builder-select"
                  >
                    <option value="single">Escolha Única (1 Correta)</option>
                    <option value="multiple">Múltipla Seleção (Várias Corretas)</option>
                    <option value="find-incorrect">Encontre o Erro (Assinalar a Incorreta)</option>
                    <option value="true-false">Verdadeiro ou Falso</option>
                    <option value="open-ended">Resposta por Extenso / Aberta</option>
                  </Select>
                </div>

                <div className="course-builder-panel-11">
                  <div className="course-builder-panel-12">
                    <span>Pontos:</span>
                    <input
                      type="number"
                      min={1}
                      value={q.points || 10}
                      onChange={(e) =>
                        handleUpdateQuestion(q.id, {
                          points: Number(e.target.value) || 1,
                        })
                      }
                      className="course-builder-field-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(q.id)}
                    className="course-builder-button-2"
                    title="Remover pergunta"
                  >
                    <Trash2 className="course-builder-trash2" />
                  </button>
                </div>
              </div>

              <div className="course-builder-panel-3">
                <label className="course-builder-field-label">Enunciado da Pergunta</label>
                <textarea
                  value={q.question}
                  onChange={(e) =>
                    handleUpdateQuestion(q.id, {
                      question: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="Introduza aqui o enunciado da questão..."
                  className="course-builder-textarea"
                />
              </div>

              <div className="course-builder-panel-3">
                <label className="course-builder-field-label">
                  Explicação / Feedback Pedagógico (após responder)
                </label>
                <input
                  type="text"
                  value={q.explanation}
                  onChange={(e) =>
                    handleUpdateQuestion(q.id, {
                      explanation: e.target.value,
                    })
                  }
                  placeholder="Ex: Esta opção é a correta porque as Server Actions executam mutações seguras no servidor."
                  className="course-builder-field-3"
                />
              </div>

              {q.type === 'open-ended' ? (
                <div className="course-builder-panel-13">
                  <div className="course-builder-panel-3">
                    <label className="course-builder-field-label">
                      Palavras-chave para Auto-Correção (separadas por vírgulas)
                    </label>
                    <input
                      type="text"
                      value={(q.keywords || []).join(', ')}
                      onChange={(e) => {
                        const kw = e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean);
                        handleUpdateQuestion(q.id, {
                          keywords: kw,
                        });
                      }}
                      placeholder="Ex: servidor, cliente, seguranca, renderizacao"
                      className="course-builder-field-4"
                    />
                    <p className="course-builder-description-3">
                      O sistema analisa a resposta do aluno com correspondência semântica e
                      tolerância a acentos destas palavras-chave.
                    </p>
                  </div>

                  <div className="course-builder-panel-14">
                    <div className="course-builder-panel-3">
                      <label className="course-builder-field-label">
                        Número Mínimo de Palavras
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={q.minWords || 10}
                        onChange={(e) =>
                          handleUpdateQuestion(q.id, {
                            minWords: Number(e.target.value) || 5,
                          })
                        }
                        className="course-builder-field-5"
                      />
                    </div>
                    <div className="course-builder-panel-3">
                      <label className="course-builder-field-label">Critério de Avaliação</label>
                      <Select
                        value={q.gradingMode || 'auto'}
                        onChange={(e) =>
                          handleUpdateQuestion(q.id, {
                            gradingMode: e.target.value,
                          })
                        }
                        className="course-builder-field-5"
                      >
                        <option value="auto">Automático (Palavras-chave)</option>
                        <option value="teacher">Avaliação do Instrutor</option>
                      </Select>
                    </div>
                  </div>

                  <div className="course-builder-panel-3">
                    <label className="course-builder-field-label">Resposta Modelo Sugerida</label>
                    <textarea
                      value={q.expectedAnswer || ''}
                      onChange={(e) =>
                        handleUpdateQuestion(q.id, {
                          expectedAnswer: e.target.value,
                        })
                      }
                      rows={2}
                      placeholder="Exemplo de resposta ideal para referência pedagógica..."
                      className="course-builder-textarea-2"
                    />
                  </div>
                </div>
              ) : q.type === 'true-false' ? (
                <div className="course-builder-panel-15">
                  <span className="course-builder-field-label">
                    Selecione qual é a resposta correta:
                  </span>
                  <div className="course-builder-panel-16">
                    {q.options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleToggleOptionCorrect(q.id, opt.id)}
                        className={`course-builder-button-3 ${opt.isCorrect ? 'course-builder-button-4' : 'course-builder-button-5'}`}
                      >
                        <span>{opt.text}</span>
                        {opt.isCorrect && <Check className="course-builder-check" />}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="course-builder-panel-15">
                  <div className="course-builder-panel-6">
                    <span className="course-builder-field-label">
                      {q.type === 'find-incorrect'
                        ? 'Selecione a afirmação FALSA (o erro que o aluno deve detetar):'
                        : q.type === 'multiple'
                          ? 'Selecione todas as opções CORRETAS:'
                          : 'Selecione a opção CORRETA:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddOption(q.id)}
                      className="course-builder-button-6"
                    >
                      <Plus className="course-builder-plus-2" />
                      <span>Adicionar Opção</span>
                    </button>
                  </div>

                  <div className="course-builder-panel-15">
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={opt.id}
                        className={`course-builder-panel-17 ${opt.isCorrect ? 'course-builder-panel-18' : 'course-builder-panel-19'}`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleOptionCorrect(q.id, opt.id)}
                          className={`course-builder-button-7 ${opt.isCorrect ? 'course-builder-button-8' : 'course-builder-button-9'}`}
                          title={
                            opt.isCorrect ? 'Resposta correta' : 'Marcar como resposta correta'
                          }
                        >
                          <Check className="course-builder-check-2" />
                        </button>

                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleUpdateOption(q.id, opt.id, e.target.value)}
                          placeholder={`Texto da Opção ${optIdx + 1}...`}
                          className="course-builder-field-6"
                        />

                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(q.id, opt.id)}
                            className="course-builder-button-10"
                            title="Remover opção"
                          >
                            <X className="course-builder-plus" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
const PRESET_THUMBNAILS = [
  {
    label: 'Programação',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Design & UI/UX',
    url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Inteligência Artificial',
    url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Negócios & Gestão',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
  },
];
export const CourseBuilderPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { courseId: editCourseId } = useParams();
  const isEditMode = !!editCourseId;
  const { user } = useAuth();
  const { toast } = useToast();
  const initialStepParam = Number(searchParams.get('step'));
  const [activeStep, setActiveStep] = useState(
    initialStepParam >= 1 && initialStepParam <= 4 ? initialStepParam : 1,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Programação & Software');
  const [difficulty, setDifficulty] = useState('Iniciante');
  const [language, setLanguage] = useState('Português');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountPrice, setDiscountPrice] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isCompressingThumb, setIsCompressingThumb] = useState(false);
  const thumbnailInputRef = useRef(null);

  // Dynamic Course Outcomes, Requirements & Documents
  const [learningOutcomes, setLearningOutcomes] = useState([
    'Construção de projetos práticos e arquiteturas escaláveis.',
    'Domínio de ferramentas, padrões modernos e boas práticas da indústria.',
    'Resolução de desafios reais e técnicas de depuração avançada.',
  ]);
  const [requirements, setRequirements] = useState([
    'Computador com acesso à Internet e navegador web moderno.',
    'Vontade de praticar e aplicar os exercícios de cada módulo.',
  ]);
  const [documents, setDocuments] = useState([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const docInputRef = useRef(null);
  const [brandColor, setBrandColor] = useState('indigo');
  const [badgeTitle, setBadgeTitle] = useState('');
  const [badgeIcon, setBadgeIcon] = useState('award');
  const [badgeRarity, setBadgeRarity] = useState('gold');
  const [courseCompletionXp, setCourseCompletionXp] = useState(500);
  const [certificateTitle, setCertificateTitle] = useState('');
  const [certificateInstructorSignature, setCertificateInstructorSignature] = useState(
    user?.name || '',
  );
  const [certificateOrg, setCertificateOrg] = useState('');
  const [certificateCustomMessage, setCertificateCustomMessage] = useState('');
  const [certificateHasQrCode, setCertificateHasQrCode] = useState(true);
  const [defaultCallMode, setDefaultCallMode] = useState('open');
  const [allowStudentScreenShare, setAllowStudentScreenShare] = useState(true);
  const [allowStudentCamera, setAllowStudentCamera] = useState(true);
  const [step2SubTab, setStep2SubTab] = useState('channels');
  const [channels, setChannels] = useState([
    {
      id: 'ch-geral',
      name: 'geral',
      type: 'text',
      accessMode: 'discussion',
      topic: '',
      guidingQuestion: '',
      guidelines: '',
    },
  ]);
  const [expandedChannelIds, setExpandedChannelIds] = useState(new Set());
  const [collapsedModuleIds, setCollapsedModuleIds] = useState(new Set());
  const [modules, setModules] = useState([]);
  const [isLoadingCourse, setIsLoadingCourse] = useState(isEditMode);

  // Outcome Handlers
  const handleAddOutcome = () => {
    soundEffects.play('click');
    setLearningOutcomes((prev) => [...prev, '']);
  };
  const handleUpdateOutcome = (index, value) => {
    setLearningOutcomes((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const handleRemoveOutcome = (index) => {
    soundEffects.play('click');
    setLearningOutcomes((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Requirement Handlers
  const handleAddRequirement = () => {
    soundEffects.play('click');
    setRequirements((prev) => [...prev, '']);
  };
  const handleUpdateRequirement = (index, value) => {
    setRequirements((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const handleRemoveRequirement = (index) => {
    soundEffects.play('click');
    setRequirements((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Document / PDF Upload Handlers
  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploadingDoc(true);
    try {
      for (const file of files) {
        if (file.size > 2 * 1024 * 1024) {
          toast({
            title: 'Ficheiro Demasiado Grande',
            message: `O ficheiro "${file.name}" excede o limite de 2 MB.`,
            type: 'error',
          });
          continue;
        }
        if (
          !['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain'].includes(
            file.type,
          )
        ) {
          toast({
            title: 'Formato não suportado',
            message: 'Use PDF, TXT, JPG, PNG ou WebP.',
            type: 'error',
          });
          continue;
        }
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const extension = file.name.split('.').pop()?.toUpperCase() || 'PDF';
        const newDoc = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          fileName: file.name,
          type: extension,
          sizeBytes: file.size,
          url: base64Data,
        };
        setDocuments((prev) => [...prev, newDoc]);
        toast({
          title: 'Documento Anexado',
          message: `"${file.name}" carregado com sucesso.`,
          type: 'success',
        });
      }
    } catch {
      toast({
        title: 'Erro no Upload',
        message: 'Não foi possível processar o ficheiro selecionado.',
        type: 'error',
      });
    } finally {
      setIsUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };
  const handleRemoveDocument = (docId) => {
    soundEffects.play('click');
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };
  useEffect(() => {
    if (!isEditMode || !editCourseId) return;
    let isMounted = true;
    setIsLoadingCourse(true);
    api
      .get(`/creator/courses/${editCourseId}`)
      .then(({ data }) => data)
      .then((course) => {
        if (!isMounted || !course) return;
        setTitle(course.title || '');
        setDescription(course.description || '');
        const catMap = {
          programming: 'Programação & Software',
          programação: 'Programação & Software',
          design: 'Design & Criatividade',
          business: 'Negócios & Gestão',
          marketing: 'Marketing & Vendas',
          languages: 'Línguas & Idiomas',
          finance: 'Finanças & Economia',
          health: 'Saúde & Bem-Estar',
          'personal-development': 'Desenvolvimento Pessoal',
        };
        const rawCat = course.category || '';
        const mappedCat = catMap[rawCat.toLowerCase()] || rawCat || 'Programação & Software';
        setCategory(mappedCat);
        setDifficulty(course.difficulty || 'Iniciante');
        setLanguage(course.language || 'Português');
        setIsFree(course.isFree !== undefined ? !!course.isFree : true);
        setPrice(
          course.price !== undefined && course.price !== null && Number(course.price) > 0
            ? String(course.price)
            : '',
        );
        setDurationHours(
          course.durationHours !== undefined && course.durationHours !== null
            ? String(course.durationHours)
            : '',
        );
        setThumbnailUrl(course.thumbnailUrl || '');
        setBrandColor(course.brandColor || 'indigo');
        setIsPublished(course.isPublished !== undefined ? !!course.isPublished : true);
        setDefaultCallMode(course.defaultCallMode || 'open');
        setAllowStudentScreenShare(
          course.allowStudentScreenShare !== undefined ? !!course.allowStudentScreenShare : true,
        );
        setAllowStudentCamera(
          course.allowStudentCamera !== undefined ? !!course.allowStudentCamera : true,
        );
        if (Array.isArray(course.learningOutcomes)) {
          setLearningOutcomes(course.learningOutcomes.length > 0 ? course.learningOutcomes : ['']);
        }
        if (Array.isArray(course.requirements)) {
          setRequirements(course.requirements.length > 0 ? course.requirements : ['']);
        }
        if (Array.isArray(course.documents)) {
          setDocuments(course.documents);
        }
        if (Array.isArray(course.channels) && course.channels.length > 0) {
          setChannels(
            course.channels.map((c) => ({
              id: c.id,
              name: c.name,
              type: c.type || (c.isVoice ? 'voice' : 'text'),
              accessMode: c.accessMode || 'discussion',
              voiceMode: c.voiceMode || course.defaultCallMode || 'open',
              topic: c.topic || '',
              guidingQuestion: c.guidingQuestion || '',
              guidelines: c.guidelines || '',
            })),
          );
        }
        if (Array.isArray(course.modules)) {
          setModules(
            course.modules.map((m) => ({
              id: m.id,
              title: m.title,
              description: m.description || '',
              dripMode: m.dripMode === 'sequential' ? 'sequential' : 'instant',
              lessons: Array.isArray(m.lessons)
                ? m.lessons.map((l) => ({
                    id: l.id,
                    title: l.title,
                    type: l.type || 'video',
                    content: l.content || '',
                    videoUrl: l.videoUrl || '',
                    durationMin: l.durationMin || 15,
                    xpReward: l.xpReward || 25,
                    quiz: l.quiz || null,
                    richArticle: l.richArticle || null,
                  }))
                : [],
            })),
          );
        }
      })
      .catch((err) => {
        toast({
          title: 'Erro ao Carregar',
          message: err.message || 'Não foi possível carregar os dados do curso.',
          type: 'error',
        });
        navigate('/creator');
      })
      .finally(() => {
        if (isMounted) setIsLoadingCourse(false);
      });
    return () => {
      isMounted = false;
    };
  }, [editCourseId, isEditMode, user]);
  const toggleChannelExpand = (id) => {
    setExpandedChannelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const handleAddChannel = (type) => {
    soundEffects.play('click');
    const count = channels.filter((c) => c.type === type).length + 1;
    const newChan = {
      id: `ch-${Date.now()}`,
      name: type === 'voice' ? `sala-ao-vivo-${count}` : `novo-canal-${count}`,
      type,
      accessMode: type === 'text' ? 'discussion' : type === 'qa' ? 'qa' : undefined,
      voiceMode: type === 'voice' ? defaultCallMode : undefined,
      topic: 'Canal de interação da comunidade.',
      guidingQuestion: '',
      guidelines: 'Comunique de forma cordial e profissional.',
    };
    setChannels((prev) => [...prev, newChan]);
    toggleChannelExpand(newChan.id);
  };
  const handleUpdateChannel = (id, field, value) => {
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (field === 'name') {
          const formatted = String(value)
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-_]/g, '');
          return {
            ...c,
            name: formatted,
          };
        }
        return {
          ...c,
          [field]: value,
        };
      }),
    );
  };
  const handleRemoveChannel = (id) => {
    soundEffects.play('click');
    if (channels.length <= 1) {
      toast({
        title: 'Atenção',
        message: 'O curso deve conter pelo menos 1 canal.',
        type: 'error',
      });
      return;
    }
    setChannels((prev) => prev.filter((c) => c.id !== id));
  };
  const handleAddModule = () => {
    soundEffects.play('click');
    const newMod = {
      id: `mod-${Date.now()}`,
      title: `Módulo ${modules.length + 1}`,
      description: '',
      dripMode: 'instant',
      lessons: [],
    };
    setModules((prev) => [...prev, newMod]);
  };
  const handleMoveModule = (mIdx, direction) => {
    soundEffects.play('click');
    setModules((prev) => {
      const next = [...prev];
      const targetIdx = direction === 'up' ? mIdx - 1 : mIdx + 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      const temp = next[mIdx];
      next[mIdx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };
  const handleMoveLesson = (modId, lIdx, direction) => {
    soundEffects.play('click');
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== modId) return m;
        const lessons = [...m.lessons];
        const targetIdx = direction === 'up' ? lIdx - 1 : lIdx + 1;
        if (targetIdx < 0 || targetIdx >= lessons.length) return m;
        const temp = lessons[lIdx];
        lessons[lIdx] = lessons[targetIdx];
        lessons[targetIdx] = temp;
        return {
          ...m,
          lessons,
        };
      }),
    );
  };
  const toggleModuleCollapse = (id) => {
    setCollapsedModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const handleUpdateModule = (modId, field, value) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === modId
          ? {
              ...m,
              [field]: value,
            }
          : m,
      ),
    );
  };
  const handleRemoveModule = (modId) => {
    soundEffects.play('click');
    setModules((prev) => prev.filter((m) => m.id !== modId));
  };
  const handleAddLesson = (modId, lessonType = 'video') => {
    soundEffects.play('click');
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== modId) return m;
        const count = m.lessons.length + 1;
        const newLes = {
          id: `les-${Date.now()}`,
          title: `Aula ${count}`,
          type: lessonType,
          durationMin: 15,
          videoUrl: '',
          content: '',
          xpReward: 25,
        };
        if (lessonType === 'video') {
          newLes.videoChapters = [];
        } else if (lessonType === 'text') {
          newLes.richArticle = {
            markdown: '',
            checklist: [],
          };
        } else if (lessonType === 'quiz') {
          newLes.quiz = {
            title: '',
            description: '',
            passingScore: 70,
            xpReward: 50,
            questions: [],
          };
        }
        return {
          ...m,
          lessons: [...m.lessons, newLes],
        };
      }),
    );
  };
  const handleUpdateLesson = (modId, lesId, field, value) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: m.lessons.map((l) => {
            if (l.id !== lesId) return l;
            return {
              ...l,
              [field]: value,
            };
          }),
        };
      }),
    );
  };
  const handleRemoveLesson = (modId, lesId) => {
    soundEffects.play('click');
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: m.lessons.filter((l) => l.id !== lesId),
        };
      }),
    );
  };
  const handleThumbnailFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ficheiro inválido',
        message: 'Selecione uma imagem (JPG, PNG, WebP).',
        type: 'error',
      });
      return;
    }
    setIsCompressingThumb(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            const max = 1200;
            if (width > max || height > max) {
              if (width > height) {
                height = Math.round((height / width) * max);
                width = max;
              } else {
                width = Math.round((width / height) * max);
                height = max;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('canvas'));
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          };
          img.onerror = reject;
          img.src = ev.target?.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setThumbnailUrl(base64);
    } catch {
      toast({
        title: 'Erro',
        message: 'Não foi possível processar a imagem.',
        type: 'error',
      });
    } finally {
      setIsCompressingThumb(false);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }
  };
  const handlePublish = async (publish = true) => {
    if (!title.trim()) {
      toast({
        title: 'Campo Obrigatório',
        message: 'Por favor, introduza o título do curso no Passo 1.',
        type: 'error',
      });
      setActiveStep(1);
      return;
    }
    setIsSubmitting(true);
    soundEffects.play('success');
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        language,
        price: isFree ? 0 : Number(price || 0),
        isFree,
        isPublished: true,
        hasDiscount,
        discountPrice: Number(discountPrice || 0),
        couponCode: couponCode.trim(),
        durationHours: Number(durationHours || 0),
        thumbnailUrl: thumbnailUrl.trim(),
        brandColor,
        defaultCallMode,
        allowStudentScreenShare,
        allowStudentCamera,
        learningOutcomes: (learningOutcomes || []).map((o) => o.trim()).filter(Boolean),
        requirements: (requirements || []).map((r) => r.trim()).filter(Boolean),
        documents: documents || [],
        badge: {
          title: badgeTitle.trim() || (title.trim() ? `Certificado ${title.trim()}` : ''),
          icon: badgeIcon,
          rarity: badgeRarity,
          xpReward: courseCompletionXp,
        },
        certificate: {
          title: certificateTitle,
          instructorSignature: certificateInstructorSignature.trim() || user?.name || 'Instrutor',
          organization: certificateOrg,
          customMessage: certificateCustomMessage,
          hasQrCode: certificateHasQrCode,
        },
        channels,
        modules,
      };
      let resultId;
      if (isEditMode && editCourseId) {
        await api.put(`/creator/courses/${editCourseId}`, payload).then(({ data }) => data);
        resultId = editCourseId;
      } else {
        const result = await api.post('/creator/courses', payload).then(({ data }) => data);
        resultId = result.id || result.slug;
      }
      await api.post(`/creator/courses/${resultId}/submit-review`).then(({ data }) => data);
      toast({
        title: 'Curso enviado para revisão',
        message: isEditMode
          ? 'As alterações foram guardadas e aguardam revisão da administração.'
          : 'O curso foi criado e enviado para revisão antes da publicação.',
        type: 'success',
      });
      navigate('/creator');
    } catch (err) {
      toast({
        title: isEditMode ? 'Erro ao Guardar Curso' : 'Erro ao Publicar Curso',
        message:
          err.message ||
          (isEditMode
            ? 'Não foi possível guardar as alterações.'
            : 'Não foi possível publicar o curso.'),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const renderBadgeIcon = (iconName, className = 'course-builder-render-badge-icon') => {
    switch (iconName) {
      case 'trophy':
        return <Trophy className={className} />;
      case 'flame':
        return <Flame className={className} />;
      case 'sparkles':
        return <Sparkles className={className} />;
      case 'star':
        return <Star className={className} />;
      case 'shield':
        return <Shield className={className} />;
      default:
        return <Award className={className} />;
    }
  };
  if (isLoadingCourse) {
    return (
      <div className="course-builder-panel-20">
        <Loader2 className="course-builder-loader2" />
        <p className="course-builder-description-4">A carregar dados do curso para edição...</p>
      </div>
    );
  }
  return (
    <div className="course-builder-panel-21">
      <header className="course-builder-header">
        <div className="course-builder-panel-22">
          <div className="course-builder-panel-23">
            <Link to="/creator" className="course-builder-link" title="Voltar ao Painel do Criador">
              <ArrowLeft className="course-builder-render-badge-icon" />
            </Link>
            <div className="course-builder-panel-24">
              <div className="course-builder-panel-11">
                <h1 className="course-builder-title">
                  {isEditMode ? 'Editar Curso' : 'Criador de Cursos'}
                </h1>
                <span className="course-builder-label-3">
                  {isEditMode ? 'Modo Edição' : 'Novo'}
                </span>
              </div>
              <p className="course-builder-description-5">
                Estruture módulos, aulas, canais da comunidade e regras do curso.
              </p>
            </div>
          </div>

          <div className="course-builder-panel-25">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send className="course-builder-trash2" />}
              isLoading={isSubmitting}
              onClick={() => handlePublish(true)}
              className="course-builder-button-11"
            >
              <span>{isEditMode ? 'Guardar Alterações' : 'Publicar Curso'}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="course-builder-main">
        <nav aria-label="Progresso da criação do curso" className="course-builder-navigation">
          <div className="course-builder-panel-26">
            {[
              {
                num: 1,
                short: '1. Identidade',
                label: '1. Identidade & Categoria',
              },
              {
                num: 2,
                short: '2. Canais',
                label: '2. Canais & Acesso',
              },
              {
                num: 3,
                short: '3. Aulas',
                label: '3. Aulas & Módulos',
              },
              {
                num: 4,
                short: '4. Publicar',
                label: '4. Revisão & Publicação',
              },
            ].map((st) => {
              const isCurrent = activeStep === st.num;
              return (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => {
                    soundEffects.play('click');
                    setActiveStep(st.num);
                  }}
                  className={`course-builder-button-12 ${isCurrent ? 'course-builder-button-13' : 'course-builder-button-14'}`}
                >
                  <span className="course-builder-label-4">{st.short}</span>
                  <span className="course-builder-label-5">{st.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {activeStep === 1 && (
          <div className="course-builder-panel-27">
            <Card className="course-builder-card">
              <div className="course-builder-panel-28">
                <div>
                  <h2 className="course-builder-heading">
                    <BookOpen className="course-builder-book-open" />
                    Identidade e Apresentação do Curso
                  </h2>
                  <p className="course-builder-description-6">
                    Título, descrição, categoria temática abrangente e carga horária estimada.
                  </p>
                </div>
              </div>

              <div className="course-builder-panel-29">
                <div className="course-builder-panel-30">
                  <label className="course-builder-field-label-2">Título do Curso *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: Gestão Estratégica de Projetos e Liderança de Equipas"
                    className="course-builder-field-7"
                  />
                </div>

                <div className="course-builder-panel-30">
                  <label className="course-builder-field-label-2">Descrição do Curso</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Apresente os objetivos, competências a desenvolver e o que os estudantes vão dominar..."
                    className="course-builder-field-7"
                  />
                </div>

                <div className="course-builder-panel-31">
                  <label className="course-builder-field-label-2">Área Temática / Categoria</label>
                  <div className="course-builder-panel-32">
                    <Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="course-builder-select-2 subtle-shadow"
                    >
                      <option value="Negócios & Gestão">Negócios, Gestão & Liderança</option>
                      <option value="Marketing & Vendas">
                        Marketing Digital, Vendas & Comunicação
                      </option>
                      <option value="Programação & Software">
                        Programação & Engenharia de Software
                      </option>
                      <option value="Design & Criatividade">
                        UI/UX Design, Criatividade & Artes
                      </option>
                      <option value="Línguas & Idiomas">Línguas & Comunicação Internacional</option>
                      <option value="Finanças & Economia">
                        Finanças, Economia & Investimentos
                      </option>
                      <option value="Saúde & Bem-Estar">Saúde, Nutrição & Bem-Estar</option>
                      <option value="Desenvolvimento Pessoal">
                        Desenvolvimento Pessoal & Produtividade
                      </option>
                      <option value="Fotografia & Vídeo">Fotografia, Vídeo & Audiovisual</option>
                      <option value="Ciências & Engenharia">
                        Ciências, Matemática & Engenharia
                      </option>
                      <option value="Gastronomia & Culinária">
                        Gastronomia & Artes Culinárias
                      </option>
                      <option value="Música & Produção Áudio">
                        Música, Áudio & Produção Sonora
                      </option>
                      <option value="Direito & Sociedade">Direito, Cidadania & Humanidades</option>
                      <option value="Outras Áreas">Outras Áreas & Especializações</option>
                    </Select>
                  </div>
                </div>

                <div className="course-builder-panel-31">
                  <label className="course-builder-field-label-2">Nível de Dificuldade</label>
                  <div className="course-builder-panel-32">
                    <Select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="course-builder-select-2 subtle-shadow"
                    >
                      <option value="Iniciante">Iniciante (Sem pré-requisitos)</option>
                      <option value="Intermédio">Intermédio (Conhecimentos prévios)</option>
                      <option value="Avançado">Avançado (Especialização)</option>
                    </Select>
                  </div>
                </div>

                {/* Upload de Capa com Suporte a Drag & Drop */}
                <div className="course-builder-panel-30">
                  <label className="course-builder-field-label-2">
                    Imagem de Capa (Arraste e solte o ficheiro ou carregue)
                  </label>

                  {thumbnailUrl && (
                    <div className="course-builder-panel-33 ui-group">
                      {isCompressingThumb ? (
                        <div className="course-builder-panel-34">
                          <Loader2 className="course-builder-loader2-2" />
                        </div>
                      ) : (
                        <img
                          src={thumbnailUrl}
                          alt="Capa do curso"
                          className="course-builder-image"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setThumbnailUrl('')}
                        className="course-builder-button-15"
                        title="Remover imagem de capa"
                      >
                        <X className="course-builder-trash2" />
                      </button>
                    </div>
                  )}

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        handleThumbnailFileChange({
                          target: {
                            files: [file],
                          },
                        });
                      }
                    }}
                    className="course-builder-panel-35"
                  >
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="course-builder-button-16"
                    >
                      <Camera className="course-builder-trash2" />
                      <span>Escolher / Arrastar Imagem</span>
                    </button>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      className="course-builder-field-8"
                      onChange={handleThumbnailFileChange}
                    />
                    <input
                      type="text"
                      value={thumbnailUrl.startsWith('data:') ? '' : thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="Ou cole o URL direto de uma imagem..."
                      className="course-builder-field-9"
                    />
                  </div>

                  <div className="course-builder-panel-36">
                    <span className="course-builder-label-6">Sugestões temáticas:</span>
                    {PRESET_THUMBNAILS.map((pt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setThumbnailUrl(pt.url)}
                        className="course-builder-button-17"
                      >
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="course-builder-panel-30">
                  <label className="course-builder-field-label-2">
                    Carga Horária Estimada (Horas)
                  </label>
                  <input
                    type="number"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="course-builder-field-10"
                  />
                </div>
              </div>
            </Card>

            <div className="course-builder-panel-37">
              {/* Acesso & Preço */}
              <Card className="course-builder-card-2">
                <div className="course-builder-panel-38">
                  <DollarSign className="course-builder-dollar-sign" />
                  <h3 className="course-builder-subheading">Acesso & Preço do Curso</h3>
                </div>

                <div className="course-builder-panel-39">
                  <button
                    type="button"
                    onClick={() => setIsFree(true)}
                    className={`course-builder-button-18 ${isFree ? 'course-builder-button-19' : 'course-builder-button-20'}`}
                  >
                    100% Gratuito
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFree(false)}
                    className={`course-builder-button-18 ${!isFree ? 'course-builder-button-21' : 'course-builder-button-20'}`}
                  >
                    Curso Pago
                  </button>
                </div>

                {!isFree && (
                  <div className="course-builder-panel-40">
                    <div className="course-builder-panel-41">
                      <div className="course-builder-panel-42">
                        <label className="course-builder-field-label-3">Preço Regular (€)</label>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="ex: 49"
                          className="course-builder-field-11"
                        />
                      </div>
                      <div className="course-builder-panel-42">
                        <label className="course-builder-field-label-3">
                          Preço com Desconto (€)
                        </label>
                        <input
                          type="number"
                          value={discountPrice}
                          onChange={(e) => setDiscountPrice(e.target.value)}
                          placeholder="ex: 29"
                          className="course-builder-field-12"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Medalha & Reconhecimento */}
              <Card className="course-builder-card-2">
                <div className="course-builder-panel-43">
                  <div className="course-builder-panel-11">
                    <Award className="course-builder-award" />
                    <h3 className="course-builder-subheading">Medalha de Conclusão</h3>
                  </div>
                </div>

                <div className="course-builder-panel-44">
                  <div>
                    <label className="course-builder-field-label-3">Título da Medalha</label>
                    <input
                      type="text"
                      value={badgeTitle}
                      onChange={(e) => setBadgeTitle(e.target.value)}
                      placeholder="ex: Especialista em Gestão"
                      className="course-builder-field-11"
                    />
                  </div>
                  <div>
                    <label className="course-builder-field-label-3">Raridade</label>
                    <Select
                      value={badgeRarity}
                      onChange={(e) => setBadgeRarity(e.target.value)}
                      className="course-builder-select-3"
                    >
                      <option value="bronze">Bronze (Iniciante)</option>
                      <option value="silver">Prata (Intermédio)</option>
                      <option value="gold">Ouro (Avançado)</option>
                      <option value="platinum">Platina (Especialista)</option>
                      <option value="diamond">Diamante (Mestre)</option>
                    </Select>
                  </div>
                </div>
              </Card>

              <Card className="course-builder-card-2">
                <div className="course-builder-panel-38">
                  <FileBadge className="course-builder-book-open" />
                  <h3 className="course-builder-subheading">Certificado Oficial</h3>
                </div>

                <div className="course-builder-panel-5">
                  <div>
                    <label className="course-builder-field-label-3">Assinatura do Instrutor</label>
                    <input
                      type="text"
                      value={certificateInstructorSignature}
                      onChange={(e) => setCertificateInstructorSignature(e.target.value)}
                      placeholder={user?.name || 'O seu nome ou título profissional'}
                      className="course-builder-field-11"
                    />
                  </div>
                  <div>
                    <label className="course-builder-field-label-3">Instituição / Academia</label>
                    <input
                      type="text"
                      value={certificateOrg}
                      onChange={(e) => setCertificateOrg(e.target.value)}
                      placeholder="Academia NEXO"
                      className="course-builder-field-11"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Competências & O que vai aprender */}
            <Card className="course-builder-card">
              <div className="course-builder-panel-45">
                <div>
                  <h3 className="course-builder-heading">
                    <Sparkles className="course-builder-book-open" />
                    <span>Competências & O que vai aprender</span>
                  </h3>
                  <p className="course-builder-description-6">
                    Pontos-chave visíveis para os alunos sobre os conhecimentos práticos adquiridos
                    no curso.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Plus className="course-builder-trash2" />}
                  onClick={handleAddOutcome}
                  className="course-builder-button-22"
                >
                  Adicionar Competência
                </Button>
              </div>

              <div className="course-builder-panel-5">
                {learningOutcomes.map((outcome, idx) => (
                  <div key={idx} className="course-builder-panel-11">
                    <div className="course-builder-panel-46">{idx + 1}</div>
                    <input
                      type="text"
                      value={outcome}
                      onChange={(e) => handleUpdateOutcome(idx, e.target.value)}
                      placeholder={`ex: Construção de APIs REST escaláveis com Node.js e Express...`}
                      className="course-builder-field-13"
                    />
                    {learningOutcomes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOutcome(idx)}
                        className="course-builder-button-23"
                        title="Remover competência"
                      >
                        <Trash2 className="course-builder-trash2" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Requisitos e Pré-requisitos */}
            <Card className="course-builder-card">
              <div className="course-builder-panel-45">
                <div>
                  <h3 className="course-builder-heading">
                    <CheckCircle2 className="course-builder-dollar-sign" />
                    <span>Requisitos e Pré-requisitos</span>
                  </h3>
                  <p className="course-builder-description-6">
                    Ferramentas, conhecimentos ou equipamentos necessários antes de iniciar o curso.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Plus className="course-builder-trash2" />}
                  onClick={handleAddRequirement}
                  className="course-builder-button-22"
                >
                  Adicionar Requisito
                </Button>
              </div>

              <div className="course-builder-panel-5">
                {requirements.map((reqItem, idx) => (
                  <div key={idx} className="course-builder-panel-11">
                    <div className="course-builder-panel-47">{idx + 1}</div>
                    <input
                      type="text"
                      value={reqItem}
                      onChange={(e) => handleUpdateRequirement(idx, e.target.value)}
                      placeholder={`ex: Conhecimentos básicos de JavaScript e lógica de programação...`}
                      className="course-builder-field-13"
                    />
                    {requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(idx)}
                        className="course-builder-button-23"
                        title="Remover requisito"
                      >
                        <Trash2 className="course-builder-trash2" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Documentos e Ficheiros de Apoio (PDFs, Materiais) */}
            <Card className="course-builder-card">
              <div className="course-builder-panel-45">
                <div>
                  <h3 className="course-builder-heading">
                    <Paperclip className="course-builder-paperclip" />
                    <span>Documentos & Ficheiros de Apoio (PDF, Guias, Zip)</span>
                  </h3>
                  <p className="course-builder-description-6">
                    Anexe PDFs, sebentas, resumos e ficheiros de apoio para download pelos alunos
                    inscritos.
                  </p>
                </div>
                <div>
                  <input
                    ref={docInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
                    onChange={handleDocumentUpload}
                    className="course-builder-field-8"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<UploadCloud className="course-builder-trash2" />}
                    isLoading={isUploadingDoc}
                    onClick={() => docInputRef.current?.click()}
                    className="course-builder-button-24"
                  >
                    Carregar Ficheiros (PDF / ZIP)
                  </Button>
                </div>
              </div>

              {documents.length === 0 ? (
                <div
                  onClick={() => docInputRef.current?.click()}
                  className="course-builder-panel-48"
                >
                  <UploadCloud className="course-builder-upload-cloud" />
                  <p className="course-builder-field-label-2">
                    Clique aqui para carregar apontamentos ou documentos em PDF
                  </p>
                  <p className="course-builder-description-7">
                    PDF, TXT, JPG, PNG ou WebP até 2 MB; máximo de 4 MB no total.
                  </p>
                </div>
              ) : (
                <div className="course-builder-panel-49">
                  {documents.map((doc, dIdx) => (
                    <div key={doc.id || dIdx} className="course-builder-panel-50 subtle-shadow">
                      <div className="course-builder-panel-51">
                        <div className="course-builder-panel-52">{doc.type || 'PDF'}</div>
                        <div className="course-builder-panel-24">
                          <input
                            type="text"
                            value={doc.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDocuments((prev) =>
                                prev.map((d, idx) =>
                                  idx === dIdx
                                    ? {
                                        ...d,
                                        title: val,
                                      }
                                    : d,
                                ),
                              );
                            }}
                            className="course-builder-field-14"
                            placeholder="Nome do Documento"
                          />
                          <p className="course-builder-description-8">
                            {doc.sizeBytes
                              ? `${(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB`
                              : 'Ficheiro anexado'}{' '}
                            • {doc.fileName || 'documento'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="course-builder-button-25"
                        title="Remover ficheiro"
                      >
                        <Trash2 className="course-builder-plus" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="course-builder-panel-53">
              <Button
                variant="primary"
                onClick={() => {
                  soundEffects.play('click');
                  setActiveStep(2);
                }}
                rightIcon={<ArrowRight className="course-builder-trash2" />}
                className="course-builder-button-26"
              >
                Continuar para Canais & Permissões
              </Button>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="course-builder-panel-27">
            <div className="course-builder-panel-54">
              <button
                type="button"
                onClick={() => setStep2SubTab('channels')}
                className={`course-builder-button-27 ${step2SubTab === 'channels' ? 'course-builder-button-28' : 'course-builder-button-29'}`}
              >
                <Hash className="course-builder-trash2" />
                <span>Canais da Turma ({channels.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setStep2SubTab('calls')}
                className={`course-builder-button-27 ${step2SubTab === 'calls' ? 'course-builder-button-28' : 'course-builder-button-29'}`}
              >
                <Volume2 className="course-builder-trash2" />
                <span>Regras de Chamadas ao Vivo</span>
              </button>
            </div>

            {step2SubTab === 'channels' && (
              <Card className="course-builder-card">
                <div className="course-builder-panel-55">
                  <div>
                    <h2 className="course-builder-heading">
                      <Hash className="course-builder-book-open" />
                      Canais de Texto e Fóruns da Comunidade
                    </h2>
                    <p className="course-builder-description-6">
                      Configure quais canais são puramente informativos (apenas leitura) e quais
                      permitem discussão aberta.
                    </p>
                  </div>
                  <div className="course-builder-panel-11">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAddChannel('text')}
                      leftIcon={<Plus className="course-builder-trash2" />}
                      className="course-builder-button-30"
                    >
                      + Canal de Texto
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleAddChannel('voice')}
                      leftIcon={<Volume2 className="course-builder-trash2" />}
                      className="course-builder-button-31"
                    >
                      + Sala ao Vivo
                    </Button>
                  </div>
                </div>

                <div className="course-builder-panel-5">
                  {channels.map((chan) => {
                    const isVoice = chan.type === 'voice';
                    const isAnnouncement = chan.accessMode === 'announcement';
                    return (
                      <div key={chan.id} className="course-builder-panel-56">
                        <div className="course-builder-panel-6">
                          <div className="course-builder-panel-51">
                            <div className="course-builder-panel-57">
                              {isVoice ? (
                                <Volume2 className="course-builder-volume2" />
                              ) : isAnnouncement ? (
                                <Megaphone className="course-builder-megaphone" />
                              ) : (
                                <Hash className="course-builder-hash" />
                              )}
                            </div>
                            <input
                              type="text"
                              value={chan.name}
                              onChange={(e) => handleUpdateChannel(chan.id, 'name', e.target.value)}
                              className="course-builder-field-15"
                            />
                            {isAnnouncement ? (
                              <span className="course-builder-label-7">
                                <Lock className="course-builder-plus-2" />
                                Apenas Informativo
                              </span>
                            ) : isVoice ? (
                              <span className="course-builder-label-8">Sala de Voz / Vídeo</span>
                            ) : (
                              <span className="course-builder-label-9">Discussão Aberta</span>
                            )}
                          </div>

                          <div className="course-builder-panel-11">
                            <button
                              type="button"
                              onClick={() => toggleChannelExpand(chan.id)}
                              className="course-builder-button-32"
                            >
                              {expandedChannelIds.has(chan.id) ? (
                                <ChevronUp className="course-builder-trash2" />
                              ) : (
                                <ChevronDown className="course-builder-trash2" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveChannel(chan.id)}
                              className="course-builder-button-33"
                              title="Remover canal"
                            >
                              <Trash2 className="course-builder-trash2" />
                            </button>
                          </div>
                        </div>

                        {expandedChannelIds.has(chan.id) && (
                          <div className="course-builder-panel-58">
                            {!isVoice ? (
                              <div>
                                <label className="course-builder-field-label-4">
                                  Modo de Envio
                                </label>
                                <Select
                                  value={chan.accessMode || 'discussion'}
                                  onChange={(e) =>
                                    handleUpdateChannel(chan.id, 'accessMode', e.target.value)
                                  }
                                  className="course-builder-select-4"
                                >
                                  <option value="discussion">
                                    Discussão Aberta (Todos podem publicar)
                                  </option>
                                  <option value="announcement">
                                    Apenas Leitura / Informativo (Apenas Instrutor)
                                  </option>
                                  <option value="qa">
                                    Fila de Dúvidas (Perguntas & Respostas)
                                  </option>
                                </Select>
                              </div>
                            ) : (
                              <div>
                                <label className="course-builder-field-label-4">
                                  Formato da Sala ao Vivo
                                </label>
                                <Select
                                  value={chan.voiceMode || defaultCallMode}
                                  onChange={(e) =>
                                    handleUpdateChannel(chan.id, 'voiceMode', e.target.value)
                                  }
                                  className="course-builder-select-4"
                                >
                                  <option value="open">Modo Aberto (Todos falam livremente)</option>
                                  <option value="stage">
                                    Modo Palco (Alunos entram silenciados)
                                  </option>
                                  <option value="qa">Modo Dúvidas (Fila de intervenção)</option>
                                </Select>
                              </div>
                            )}

                            <div>
                              <label className="course-builder-field-label-4">
                                Tópico / Descrição Curta
                              </label>
                              <input
                                type="text"
                                value={chan.topic}
                                onChange={(e) =>
                                  handleUpdateChannel(chan.id, 'topic', e.target.value)
                                }
                                placeholder="ex: Avisos oficiais da coordenação"
                                className="course-builder-field-16"
                              />
                            </div>

                            <div>
                              <label className="course-builder-field-label-4">
                                Orientações de Convivência
                              </label>
                              <input
                                type="text"
                                value={chan.guidelines}
                                onChange={(e) =>
                                  handleUpdateChannel(chan.id, 'guidelines', e.target.value)
                                }
                                placeholder="ex: Seja cordial e objetivo"
                                className="course-builder-field-16"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {step2SubTab === 'calls' && (
              <Card className="course-builder-card-3">
                <div className="course-builder-panel-59">
                  <h2 className="course-builder-heading">
                    <Volume2 className="course-builder-book-open" />
                    Regras das Salas ao Vivo (Voz & Vídeo)
                  </h2>
                  <p className="course-builder-description-6">
                    Defina se todos os participantes podem falar livremente ou se a sala funciona
                    como palco com intervenção controlada.
                  </p>
                </div>

                <div className="course-builder-panel-60">
                  {[
                    {
                      id: 'open',
                      title: 'Modo Aberto (Convívio Livre)',
                      desc: 'Todos os alunos podem desmutar o microfone livremente e interagir a qualquer momento.',
                      icon: Volume2,
                      badge: 'Ideal para debates',
                    },
                    {
                      id: 'stage',
                      title: 'Modo Palco (Silêncio Inicial)',
                      desc: 'Alunos entram silenciados. Para falar, levantam a mão e o professor ou moderador autoriza.',
                      icon: Radio,
                      badge: 'Ideal para aulas e palestras',
                    },
                    {
                      id: 'qa',
                      title: 'Fila de Dúvidas',
                      desc: 'Os alunos entram numa fila ordenada para esclarecimento de dúvidas pontuais.',
                      icon: HelpCircle,
                      badge: 'Ideal para mentoria',
                    },
                  ].map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => setDefaultCallMode(mode.id)}
                      className={`course-builder-panel-61 ${defaultCallMode === mode.id ? 'course-builder-panel-62' : 'course-builder-panel-63'}`}
                    >
                      <div className="course-builder-panel-15">
                        <div className="course-builder-panel-6">
                          <mode.icon
                            className={`course-builder-render-badge-icon ${defaultCallMode === mode.id ? 'course-builder-course-builder' : 'course-builder-course-builder-2'}`}
                          />
                          <span className="course-builder-label-10">{mode.badge}</span>
                        </div>
                        <h3 className="course-builder-subheading-2">{mode.title}</h3>
                        <p className="course-builder-description-9">{mode.desc}</p>
                      </div>

                      <div className="course-builder-panel-64">
                        <span
                          className={
                            defaultCallMode === mode.id
                              ? 'course-builder-label-11'
                              : 'course-builder-label-12'
                          }
                        >
                          {defaultCallMode === mode.id ? 'Selecionado' : 'Escolher este modo'}
                        </span>
                        {defaultCallMode === mode.id && (
                          <Check className="course-builder-check-3" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="course-builder-panel-65">
                  <h3 className="course-builder-subheading-3">
                    <SlidersHorizontal className="course-builder-megaphone" />
                    Permissões de Média dos Estudantes
                  </h3>

                  <div className="course-builder-panel-29">
                    <label className="course-builder-field-label-5">
                      <input
                        type="checkbox"
                        checked={allowStudentScreenShare}
                        onChange={(e) => setAllowStudentScreenShare(e.target.checked)}
                        className="course-builder-field-17"
                      />
                      <div>
                        <p className="course-builder-description-10">
                          Permitir partilha de ecrã para alunos
                        </p>
                        <p className="course-builder-description-11">
                          Se desativado, apenas instrutores, tutores ou moderadores podem partilhar
                          ecrã.
                        </p>
                      </div>
                    </label>

                    <label className="course-builder-field-label-5">
                      <input
                        type="checkbox"
                        checked={allowStudentCamera}
                        onChange={(e) => setAllowStudentCamera(e.target.checked)}
                        className="course-builder-field-17"
                      />
                      <div>
                        <p className="course-builder-description-10">
                          Permitir câmara de vídeo para alunos
                        </p>
                        <p className="course-builder-description-11">
                          Os estudantes podem ativar a sua webcam durante as sessões de estudo.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </Card>
            )}

            <div className="course-builder-panel-66">
              <Button
                variant="secondary"
                onClick={() => {
                  soundEffects.play('click');
                  setActiveStep(1);
                }}
                leftIcon={<ArrowLeft className="course-builder-trash2" />}
                className="course-builder-button-34"
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  soundEffects.play('click');
                  setActiveStep(3);
                }}
                rightIcon={<ArrowRight className="course-builder-trash2" />}
                className="course-builder-button-26"
              >
                Continuar para Aulas & Módulos
              </Button>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="course-builder-panel-27">
            <div className="course-builder-panel-67">
              <div>
                <h2 className="course-builder-heading">
                  <Layers className="course-builder-book-open" />
                  Estrutura Curricular & Aulas
                </h2>
                <p className="course-builder-description-6">
                  Adicione os módulos e as aulas do seu curso ao seu próprio ritmo.
                </p>
              </div>

              <div className="course-builder-panel-68">
                <Button
                  onClick={handleAddModule}
                  leftIcon={<Plus className="course-builder-trash2" />}
                  className="course-builder-button-35"
                >
                  + Novo Módulo
                </Button>
              </div>
            </div>

            {modules.length === 0 ? (
              <Card className="course-builder-card-4">
                <div className="course-builder-panel-69">
                  <Layers className="course-builder-layers" />
                </div>
                <h3 className="course-builder-subheading-4">Nenhum módulo criado ainda</h3>
                <p className="course-builder-description-12">
                  O curso está pronto para receber o seu conteúdo. Clique no botão abaixo para
                  adicionar o primeiro módulo.
                </p>
                <div className="course-builder-panel-70">
                  <Button
                    variant="primary"
                    onClick={handleAddModule}
                    leftIcon={<Plus className="course-builder-trash2" />}
                    className="course-builder-button-36"
                  >
                    + Criar Primeiro Módulo
                  </Button>
                </div>
              </Card>
            ) : (
              modules.map((mod, mIdx) => {
                const isCollapsed = collapsedModuleIds.has(mod.id);
                return (
                  <Card key={mod.id} className="course-builder-card-5">
                    <div className="course-builder-panel-55">
                      <div className="course-builder-panel-71">
                        <button
                          type="button"
                          onClick={() => toggleModuleCollapse(mod.id)}
                          className="course-builder-button-37"
                          title={isCollapsed ? 'Expandir módulo' : 'Recolher módulo'}
                        >
                          {isCollapsed ? (
                            <ChevronDown className="course-builder-check-3" />
                          ) : (
                            <ChevronUp className="course-builder-trash2" />
                          )}
                        </button>

                        <div className="course-builder-panel-72">
                          <div className="course-builder-panel-73">
                            <input
                              type="text"
                              value={mod.title}
                              onChange={(e) => handleUpdateModule(mod.id, 'title', e.target.value)}
                              placeholder="Nome do Módulo..."
                              className="course-builder-field-18"
                            />
                            <span className="course-builder-label-13">
                              {mod.lessons.length} {mod.lessons.length === 1 ? 'aula' : 'aulas'}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={mod.description}
                            onChange={(e) =>
                              handleUpdateModule(mod.id, 'description', e.target.value)
                            }
                            placeholder="Descrição opcional dos tópicos do módulo..."
                            className="course-builder-field-19"
                          />
                        </div>
                      </div>

                      <div className="course-builder-panel-74">
                        <button
                          type="button"
                          disabled={mIdx === 0}
                          onClick={() => handleMoveModule(mIdx, 'up')}
                          className="course-builder-button-38"
                          title="Mover módulo para cima"
                        >
                          <ChevronUp className="course-builder-trash2" />
                        </button>
                        <button
                          type="button"
                          disabled={mIdx === modules.length - 1}
                          onClick={() => handleMoveModule(mIdx, 'down')}
                          className="course-builder-button-38"
                          title="Mover módulo para baixo"
                        >
                          <ChevronDown className="course-builder-trash2" />
                        </button>
                        <Select
                          value={mod.dripMode === 'sequential' ? 'sequential' : 'instant'}
                          onChange={(e) => handleUpdateModule(mod.id, 'dripMode', e.target.value)}
                          className="course-builder-select-5"
                          title="Regra de desbloqueio"
                        >
                          <option value="instant">Imediato</option>
                          <option value="sequential">Sequencial</option>
                        </Select>
                        <button
                          type="button"
                          onClick={() => handleRemoveModule(mod.id)}
                          className="course-builder-button-39"
                          title="Eliminar Módulo"
                        >
                          <Trash2 className="course-builder-trash2" />
                        </button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="course-builder-panel-5">
                        {mod.lessons.length === 0 ? (
                          <p className="course-builder-description-13">
                            Nenhuma aula adicionada a este módulo. Escolha um tipo abaixo para
                            começar.
                          </p>
                        ) : (
                          mod.lessons.map((les, lIdx) => (
                            <div key={les.id} className="course-builder-panel-75">
                              <div className="course-builder-panel-76">
                                <div className="course-builder-panel-77">
                                  <span className="course-builder-label-14">{lIdx + 1}</span>
                                  <input
                                    type="text"
                                    value={les.title}
                                    onChange={(e) =>
                                      handleUpdateLesson(mod.id, les.id, 'title', e.target.value)
                                    }
                                    placeholder="Título da Aula..."
                                    className="course-builder-field-20"
                                  />
                                </div>

                                <div className="course-builder-panel-74">
                                  <button
                                    type="button"
                                    disabled={lIdx === 0}
                                    onClick={() => handleMoveLesson(mod.id, lIdx, 'up')}
                                    className="course-builder-button-40"
                                    title="Mover aula para cima"
                                  >
                                    <ChevronUp className="course-builder-plus" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={lIdx === mod.lessons.length - 1}
                                    onClick={() => handleMoveLesson(mod.id, lIdx, 'down')}
                                    className="course-builder-button-40"
                                    title="Mover aula para baixo"
                                  >
                                    <ChevronDown className="course-builder-plus" />
                                  </button>
                                  <Select
                                    value={les.type}
                                    onChange={(e) =>
                                      handleUpdateLesson(mod.id, les.id, 'type', e.target.value)
                                    }
                                    className="course-builder-select-6"
                                  >
                                    <option value="video">Vídeo</option>
                                    <option value="text">Artigo</option>
                                    <option value="quiz">Questionário</option>
                                    <option value="resource">Recursos</option>
                                    <option value="project">Projeto</option>
                                  </Select>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLesson(mod.id, les.id)}
                                    className="course-builder-button-33"
                                    title="Remover aula"
                                  >
                                    <Trash2 className="course-builder-plus" />
                                  </button>
                                </div>
                              </div>

                              {les.type === 'video' && (
                                <div className="course-builder-panel-78">
                                  <input
                                    type="text"
                                    value={les.videoUrl || ''}
                                    onChange={(e) =>
                                      handleUpdateLesson(mod.id, les.id, 'videoUrl', e.target.value)
                                    }
                                    placeholder="URL do Vídeo (YouTube, Vimeo, MP4)..."
                                    className="course-builder-field-21"
                                  />
                                  <div className="course-builder-panel-79">
                                    <span className="course-builder-label-15">Duração:</span>
                                    <input
                                      type="number"
                                      value={les.durationMin || 15}
                                      onChange={(e) =>
                                        handleUpdateLesson(
                                          mod.id,
                                          les.id,
                                          'durationMin',
                                          Number(e.target.value),
                                        )
                                      }
                                      placeholder="Minutos"
                                      className="course-builder-field-22"
                                    />
                                    <span className="course-builder-label-16">min</span>
                                  </div>
                                </div>
                              )}

                              {les.type === 'text' && (
                                <div className="course-builder-panel-80">
                                  <textarea
                                    value={
                                      les.richArticle?.markdown ||
                                      (typeof les.content === 'string' ? les.content : '')
                                    }
                                    onChange={(e) => {
                                      const curr = les.richArticle || {
                                        markdown: '',
                                        calloutType: 'tip',
                                        calloutTitle: 'Dica',
                                        calloutText: '',
                                        checklist: [],
                                      };
                                      handleUpdateLesson(mod.id, les.id, 'richArticle', {
                                        ...curr,
                                        markdown: e.target.value,
                                      });
                                      handleUpdateLesson(mod.id, les.id, 'content', e.target.value);
                                    }}
                                    rows={3}
                                    className="course-builder-textarea-3"
                                    placeholder="Escreva as explicações e o conteúdo teórico desta aula..."
                                  />
                                </div>
                              )}

                              {les.type === 'project' && (
                                <div className="course-builder-panel-80">
                                  <label htmlFor={'project-brief-' + les.id}>
                                    Enunciado e critérios de avaliação
                                  </label>
                                  <textarea
                                    id={'project-brief-' + les.id}
                                    rows={5}
                                    maxLength={20000}
                                    value={typeof les.content === 'string' ? les.content : ''}
                                    onChange={(e) =>
                                      handleUpdateLesson(mod.id, les.id, 'content', e.target.value)
                                    }
                                    className="course-builder-textarea-3"
                                    placeholder="Descreva o trabalho, os critérios de aprovação e o que o aluno deve partilhar na ligação de entrega."
                                  />
                                </div>
                              )}
                              {les.type === 'quiz' && (
                                <QuizLessonEditor
                                  quiz={les.quiz}
                                  onChange={(updatedQuiz) =>
                                    handleUpdateLesson(mod.id, les.id, 'quiz', updatedQuiz)
                                  }
                                />
                              )}

                              {les.type === 'resource' && (
                                <div className="course-builder-panel-80">
                                  <span className="course-builder-label-17">
                                    <Download className="course-builder-plus" />
                                    Ficheiros e Documentos de Apoio
                                  </span>
                                  <input
                                    type="text"
                                    value={typeof les.content === 'string' ? les.content : ''}
                                    onChange={(e) =>
                                      handleUpdateLesson(mod.id, les.id, 'content', e.target.value)
                                    }
                                    placeholder="Instruções ou links para descarregar recursos..."
                                    className="course-builder-field-23"
                                  />
                                </div>
                              )}
                            </div>
                          ))
                        )}

                        <div className="course-builder-panel-81">
                          <span className="course-builder-label-18">+ Adicionar aula:</span>
                          <button
                            type="button"
                            onClick={() => handleAddLesson(mod.id, 'video')}
                            className="course-builder-button-41"
                          >
                            + Vídeo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddLesson(mod.id, 'text')}
                            className="course-builder-button-42"
                          >
                            + Artigo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddLesson(mod.id, 'quiz')}
                            className="course-builder-button-43"
                          >
                            + Questionário
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddLesson(mod.id, 'resource')}
                            className="course-builder-button-44"
                          >
                            + Recursos
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddLesson(mod.id, 'project')}
                            className="course-builder-button-44"
                          >
                            + Projeto
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}

            <div className="course-builder-panel-82">
              <Button
                variant="secondary"
                onClick={() => {
                  soundEffects.play('click');
                  setActiveStep(2);
                }}
                leftIcon={<ArrowLeft className="course-builder-trash2" />}
                className="course-builder-button-45"
              >
                Voltar aos Canais
              </Button>

              <Button
                variant="primary"
                onClick={() => {
                  soundEffects.play('click');
                  setActiveStep(4);
                }}
                rightIcon={<ArrowRight className="course-builder-trash2" />}
                className="course-builder-button-46"
              >
                Rever & Publicar
              </Button>
            </div>
          </div>
        )}

        {activeStep === 4 && (
          <div className="course-builder-panel-27">
            <Card className="course-builder-card-3">
              <div className="course-builder-panel-28">
                <div>
                  <h2 className="course-builder-heading-2">
                    <CheckCircle2 className="course-builder-check-circle2" />
                    Revisão e Lançamento do Curso
                  </h2>
                  <p className="course-builder-description-6">
                    Verifique os parâmetros configurados antes de publicar na plataforma.
                  </p>
                </div>
                <span className="course-builder-label-19">Pronto para Lançamento</span>
              </div>

              <div className="course-builder-panel-83">
                <div className="course-builder-panel-84">
                  <span className="course-builder-label-20">Conteúdo</span>
                  <p className="course-builder-description-14">{modules.length} Módulos</p>
                  <p className="course-builder-description-15">
                    {modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} Aulas
                  </p>
                </div>

                <div className="course-builder-panel-84">
                  <span className="course-builder-label-20">Competências</span>
                  <p className="course-builder-description-14">
                    {learningOutcomes.filter((o) => o.trim()).length} Objetivos
                  </p>
                  <p className="course-builder-description-16">Preenchidos</p>
                </div>

                <div className="course-builder-panel-84">
                  <span className="course-builder-label-20">Ficheiros / PDFs</span>
                  <p className="course-builder-description-14">{documents.length} Anexos</p>
                  <p className="course-builder-description-17">Para Download</p>
                </div>

                <div className="course-builder-panel-84">
                  <span className="course-builder-label-20">Canais da Turma</span>
                  <p className="course-builder-description-14">{channels.length} Canais</p>
                  <p className="course-builder-description-17">
                    {channels.filter((c) => c.type === 'voice').length} Voz / Palco
                  </p>
                </div>

                <div className="course-builder-panel-84">
                  <span className="course-builder-label-20">Regras de Voz</span>
                  <p className="course-builder-description-18">
                    {defaultCallMode === 'stage'
                      ? 'Modo Palco'
                      : defaultCallMode === 'qa'
                        ? 'Fila Dúvidas'
                        : 'Aberto'}
                  </p>
                  <p className="course-builder-description-16">
                    {defaultCallMode === 'stage' ? 'Silêncio Inicial' : 'Livre'}
                  </p>
                </div>

                <div className="course-builder-panel-84">
                  <span className="course-builder-label-20">Acesso Turma</span>
                  <p className="course-builder-description-14">Colaborativo</p>
                  <p className="course-builder-description-19">Formador & Colaboradores</p>
                </div>
              </div>

              <div className="course-builder-panel-85">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt={title} className="course-builder-image-2" />
                ) : (
                  <div className="course-builder-panel-86">
                    <BookOpen className="course-builder-book-open-2" />
                  </div>
                )}
                <div className="course-builder-panel-72">
                  <h3 className="course-builder-subheading-5">{title || 'Título do Curso'}</h3>
                  <p className="course-builder-description-20">{description || 'Sem descrição.'}</p>
                  <div className="course-builder-panel-87">
                    <span className="course-builder-label-21">{formatCategory(category)}</span>
                    <span className="course-builder-label-22">{difficulty}</span>
                    <span className="course-builder-label-23">
                      {isFree
                        ? 'Gratuito'
                        : formatCoursePrice({
                            price: Number(price) || 0,
                            isFree: false,
                          })}
                    </span>
                  </div>
                </div>
              </div>

              {user?.role !== 'ADMIN' && (
                <div className="course-builder-panel-88">
                  <Shield className="course-builder-shield" />
                  <div className="course-builder-panel-89">
                    <p className="course-builder-description-21">Validação Pedagógica NEXO</p>
                    Para salvaguardar os padrões de qualidade da comunidade NEXO, os novos cursos
                    submetidos por formadores são revistos pela equipa de administração antes de
                    serem publicados no catálogo aberto.
                  </div>
                </div>
              )}

              <div className="course-builder-panel-90">
                <Button
                  variant="secondary"
                  onClick={() => {
                    soundEffects.play('click');
                    setActiveStep(3);
                  }}
                  leftIcon={<ArrowLeft className="course-builder-trash2" />}
                  className="course-builder-button-45"
                >
                  Voltar às Aulas
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  onClick={() => handlePublish(true)}
                  leftIcon={<Check className="course-builder-render-badge-icon" />}
                  className="course-builder-button-47"
                >
                  {isEditMode ? 'Guardar Alterações' : 'Confirmar & Publicar Curso'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default CourseBuilderPage;
