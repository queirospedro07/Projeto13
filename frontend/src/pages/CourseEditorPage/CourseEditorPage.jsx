import { CursoPrecoCampos } from '../../components/CoursePriceFields/CoursePriceFields';
import '../../styles/editor-management.css';
import { CursoParecer } from '../../components/CourseReview/CourseReview';
import './CourseEditorPage.css';
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
  LuChevronDown as ChevronDown,
  LuChevronUp as ChevronUp,
  LuShield as Shield,
  LuDownload as Download,
  LuMegaphone as Megaphone,
  LuRadio as Radio,
  LuSlidersHorizontal as SlidersHorizontal,
  LuLock as Lock,
  LuCamera as Camera,
  LuLoaderCircle as Loader2,
  LuSend as Send,
  LuCloudUpload as UploadCloud,
  LuPaperclip as Paperclip,
} from 'react-icons/lu';
import { Botao } from '../../components/Button';
import { Cartao } from '../../components/Card';
import { Seletor } from '../../components/Select';
import { useAvisos } from '../../components/Alerts';
import { useAutenticacao } from '../../contexts/AuthContext';
import { soundEffects } from '../../services/soundEffects';
import { api } from '../../services/api';
import { formatarCursoPreco, formatarCategoria } from '../../utils/formatting';
import { EsqueletoPagina } from '../../components/Skeleton';

export const QuestionarioAulaEditor = ({ quiz: questionario, onChange: onAlterar }) => {
  const atualQuestionario = questionario || {
    title: 'Questionário de Avaliação',
    description: 'Responda às questões para validar a sua compreensão da aula.',
    pontuacaoAprovacao: 70,
    recompensaExperiencia: 50,
    questions: [],
  };
  const tratarAtualizarCampo = (campo, valor) => {
    onAlterar({
      ...atualQuestionario,
      [campo]: valor,
    });
  };

  const tratarAdicionarPergunta = (type = 'single') => {
    soundEffects.play('click');

    const novoQ = {
      id: `q-${crypto.randomUUID()}-${Math.random().toString(36).substr(2, 4)}`,
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

    tratarAtualizarCampo('questions', [...atualQuestionario.questions, novoQ]);
  };

  const tratarAtualizarPergunta = (qId, updates) => {
    const atualizado = atualQuestionario.questions.map((q) => {
      if (q.id !== qId) return q;
      const seguinteQ = {
        ...q,
        ...updates,
      };
      if (updates.type === 'true-false' && (!seguinteQ.options || seguinteQ.options.length !== 2)) {
        seguinteQ.options = [
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
        (!seguinteQ.options || seguinteQ.options.length === 0)
      ) {
        seguinteQ.options = [
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

      return seguinteQ;
    });

    tratarAtualizarCampo('questions', atualizado);
  };

  const tratarRemoverPergunta = (qId) => {
    soundEffects.play('click');
    tratarAtualizarCampo(
      'questions',
      atualQuestionario.questions.filter((q) => q.id !== qId),
    );
  };

  const tratarAdicionarOpcao = (qId) => {
    soundEffects.play('click');

    const pergunta = atualQuestionario.questions.find((q) => q.id === qId);
    if (!pergunta) return;
    const optContar = pergunta.options.length + 1;
    const novoOpt = {
      id: `opt-${crypto.randomUUID()}-${optContar}`,
      text: `Opção ${optContar}`,
      isCorrect: false,
    };

    tratarAtualizarPergunta(qId, {
      options: [...pergunta.options, novoOpt],
    });
  };

  const tratarAtualizarOpcao = (qId, optId, text) => {
    const pergunta = atualQuestionario.questions.find((q) => q.id === qId);
    if (!pergunta) return;
    const opcoes = pergunta.options.map((o) =>
      o.id === optId
        ? {
            ...o,
            text,
          }
        : o,
    );

    tratarAtualizarPergunta(qId, {
      options: opcoes,
    });
  };

  const tratarAlternarOpcaoCorreta = (qId, optId) => {
    soundEffects.play('click');

    const pergunta = atualQuestionario.questions.find((q) => q.id === qId);
    if (!pergunta) return;
    let opcoes;
    if (
      pergunta.type === 'single' ||
      pergunta.type === 'find-incorrect' ||
      pergunta.type === 'true-false'
    ) {
      opcoes = pergunta.options.map((o) => ({
        ...o,
        isCorrect: o.id === optId,
      }));
    } else {
      opcoes = pergunta.options.map((o) =>
        o.id === optId
          ? {
              ...o,
              isCorrect: !o.isCorrect,
            }
          : o,
      );
      if (!opcoes.some((o) => o.isCorrect)) {
        opcoes = opcoes.map((o) =>
          o.id === optId
            ? {
                ...o,
                isCorrect: true,
              }
            : o,
        );
      }
    }

    tratarAtualizarPergunta(qId, {
      options: opcoes,
    });
  };

  const tratarRemoverOpcao = (qId, optId) => {
    soundEffects.play('click');

    const pergunta = atualQuestionario.questions.find((q) => q.id === qId);
    if (!pergunta || pergunta.options.length <= 2) return;
    let remaining = pergunta.options.filter((o) => o.id !== optId);
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

    tratarAtualizarPergunta(qId, {
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
            value={atualQuestionario.title}
            onChange={(evento) => tratarAtualizarCampo('title', evento.target.value)}
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
            value={atualQuestionario.pontuacaoAprovacao}
            onChange={(evento) =>
              tratarAtualizarCampo('pontuacaoAprovacao', Number(evento.target.value) || 0)
            }
            className="course-builder-field"
          />
        </div>
        <div className="course-builder-panel-4">
          <label className="course-builder-field-label">Instruções aos Alunos</label>
          <input
            type="text"
            value={atualQuestionario.description}
            onChange={(evento) => tratarAtualizarCampo('description', evento.target.value)}
            placeholder="Ex: Responda com atenção a todas as perguntas para desbloquear a aula seguinte."
            className="course-builder-field"
          />
        </div>
      </div>

      <div className="course-builder-panel-5">
        <div className="course-builder-panel-6">
          <span className="course-builder-label">
            Perguntas ({atualQuestionario.questions.length})
          </span>
          <div className="course-builder-panel-7">
            <button
              type="button"
              onClick={() => tratarAdicionarPergunta('single')}
              className="course-builder-button"
            >
              <Plus className="course-builder-plus" />
              <span>Adicionar Pergunta</span>
            </button>
          </div>
        </div>

        {atualQuestionario.questions.length === 0 ? (
          <div className="course-builder-panel-8">
            <p className="course-builder-description">
              Nenhuma pergunta adicionada a este questionário.
            </p>
            <p className="course-builder-description-2">
              Clique em "Adicionar Pergunta" acima para começar.
            </p>
          </div>
        ) : (
          atualQuestionario.questions.map((q, qIdx) => (
            <div
              key={q.id}
              className="course-builder-panel-9"
            >
              <div className="course-builder-panel-10">
                <div className="course-builder-panel-11">
                  <span className="course-builder-label-2">{qIdx + 1}</span>
                  <Seletor
                    value={q.type}
                    onChange={(evento) =>
                      tratarAtualizarPergunta(q.id, {
                        type: evento.target.value,
                      })
                    }
                    className="course-builder-select"
                  >
                    <option value="single">Escolha Única (1 Correta)</option>
                    <option value="multiple">Múltipla Seleção (Várias Corretas)</option>
                    <option value="find-incorrect">Encontre o Erro (Assinalar a Incorreta)</option>
                    <option value="true-false">Verdadeiro ou Falso</option>
                    <option value="open-ended">Resposta por Extenso / Aberta</option>
                  </Seletor>
                </div>

                <div className="course-builder-panel-11">
                  <div className="course-builder-panel-12">
                    <span>Pontos:</span>
                    <input
                      type="number"
                      min={1}
                      value={q.points || 10}
                      onChange={(evento) =>
                        tratarAtualizarPergunta(q.id, {
                          points: Number(evento.target.value) || 1,
                        })
                      }
                      className="course-builder-field-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => tratarRemoverPergunta(q.id)}
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
                  onChange={(evento) =>
                    tratarAtualizarPergunta(q.id, {
                      question: evento.target.value,
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
                  onChange={(evento) =>
                    tratarAtualizarPergunta(q.id, {
                      explanation: evento.target.value,
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
                      onChange={(evento) => {
                        const kw = evento.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean);

                        tratarAtualizarPergunta(q.id, {
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
                        onChange={(evento) =>
                          tratarAtualizarPergunta(q.id, {
                            minWords: Number(evento.target.value) || 5,
                          })
                        }
                        className="course-builder-field-5"
                      />
                    </div>
                    <div className="course-builder-panel-3">
                      <label className="course-builder-field-label">Critério de Avaliação</label>
                      <Seletor
                        value={q.gradingMode || 'auto'}
                        onChange={(evento) =>
                          tratarAtualizarPergunta(q.id, {
                            gradingMode: evento.target.value,
                          })
                        }
                        className="course-builder-field-5"
                      >
                        <option value="auto">Automático (Palavras-chave)</option>
                        <option value="teacher">Avaliação do Instrutor</option>
                      </Seletor>
                    </div>
                  </div>

                  <div className="course-builder-panel-3">
                    <label className="course-builder-field-label">Resposta Modelo Sugerida</label>
                    <textarea
                      value={q.expectedAnswer || ''}
                      onChange={(evento) =>
                        tratarAtualizarPergunta(q.id, {
                          expectedAnswer: evento.target.value,
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
                        onClick={() => tratarAlternarOpcaoCorreta(q.id, opt.id)}
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
                      onClick={() => tratarAdicionarOpcao(q.id)}
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
                          onClick={() => tratarAlternarOpcaoCorreta(q.id, opt.id)}
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
                          onChange={(evento) =>
                            tratarAtualizarOpcao(q.id, opt.id, evento.target.value)
                          }
                          placeholder={`Texto da Opção ${optIdx + 1}...`}
                          className="course-builder-field-6"
                        />

                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => tratarRemoverOpcao(q.id, opt.id)}
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

export const CursoEditorPagina = () => {
  const navigate = useNavigate();
  const [pesquisarParametros] = useSearchParams();
  const { idCurso: editarCursoId } = useParams();
  const isEditarModo = !!editarCursoId;
  const { user: utilizador } = useAutenticacao();
  const { toast: aviso } = useAvisos();
  const inicialStepParametro = Number(pesquisarParametros.get('step'));
  const [ativoStep, definirAtivoStep] = useState(
    inicialStepParametro >= 1 && inicialStepParametro <= 4 ? inicialStepParametro : 1,
  );
  const [isSubmitting, definirIsSubmitting] = useState(false);
  const [titulo, definirTitulo] = useState('');
  const [descricao, definirDescricao] = useState('');
  const [categoria, definirCategoria] = useState('Programação & Software');
  const [dificuldade, definirDificuldade] = useState('Iniciante');
  const [language, definirLanguage] = useState('Português');
  const [isGratuito, definirIsGratuito] = useState(true);
  const [preco, definirPreco] = useState('');
  const [precoReferencia, definirPrecoReferencia] = useState('');
  const [duracaoHoras, definirDuracaoHoras] = useState('');
  const [miniaturaUrl, definirMiniaturaUrl] = useState('');
  const [isCompressingThumb, definirIsCompressingThumb] = useState(false);
  const miniaturaEntradaRef = useRef(null);

  // Dynamic Curso Outcomes, Requirements & Documents
  const [aprendizagemOutcomes, definirAprendizagemOutcomes] = useState([
    'Construção de projetos práticos e arquiteturas escaláveis.',
    'Domínio de ferramentas, padrões modernos e boas práticas da indústria.',
    'Resolução de desafios reais e técnicas de depuração avançada.',
  ]);
  const [requisitos, definirRequisitos] = useState([
    'Computador com acesso à Internet e navegador web moderno.',
    'Vontade de praticar e aplicar os exercícios de cada módulo.',
  ]);
  const [documentos, definirDocumentos] = useState([]);
  const [isUploadingDoc, definirIsUploadingDoc] = useState(false);
  const docEntradaRef = useRef(null);
  const [temCommunity, definirTemCommunity] = useState(true);
  const [existenteCommunity, definirExistenteCommunity] = useState(false);
  const [canais, definirCanais] = useState([
    {
      id: 'ch-geral',
      name: 'geral',
      type: 'text',
      modoAcesso: 'discussion',
      topic: '',
      perguntaOrientadora: '',
      guidelines: '',
    },
  ]);
  const [expandedCanalIds, definirExpandedCanalIds] = useState(new Set());
  const [collapsedModuloIds, definirCollapsedModuloIds] = useState(new Set());
  const [modulos, definirModulos] = useState([]);
  const [publicacao, definirPublicacao] = useState(null);
  const guardadoCursoId = useRef(null);
  const savingCurso = useRef(false);
  const [isCarregamentoCurso, definirIsCarregamentoCurso] = useState(isEditarModo);

  // Outcome Handlers
  const tratarAdicionarResultado = () => {
    soundEffects.play('click');
    definirAprendizagemOutcomes((anterior) => [...anterior, '']);
  };

  const tratarAtualizarResultado = (indice, valor) => {
    definirAprendizagemOutcomes((anterior) => {
      const seguinte = [...anterior];

      seguinte[indice] = valor;

      return seguinte;
    });
  };

  const tratarRemoverResultado = (indice) => {
    soundEffects.play('click');
    definirAprendizagemOutcomes((anterior) => anterior.filter((_, idx) => idx !== indice));
  };

  // Requirement Handlers
  const tratarAdicionarRequisito = () => {
    soundEffects.play('click');
    definirRequisitos((anterior) => [...anterior, '']);
  };

  const tratarAtualizarRequisito = (indice, valor) => {
    definirRequisitos((anterior) => {
      const seguinte = [...anterior];

      seguinte[indice] = valor;

      return seguinte;
    });
  };

  const tratarRemoverRequisito = (indice) => {
    soundEffects.play('click');
    definirRequisitos((anterior) => anterior.filter((_, idx) => idx !== indice));
  };

  // Document / PDF Upload Handlers
  const tratarDocumentoCarregar = async (evento) => {
    const files = Array.from(evento.target.files || []);
    if (!files.length) return;
    definirIsUploadingDoc(true);
    try {
      for (const ficheiro of files) {
        if (ficheiro.size > 2 * 1024 * 1024) {
          aviso({
            title: 'Ficheiro Demasiado Grande',
            message: `O ficheiro "${ficheiro.name}" excede o limite de 2 MB.`,
            type: 'error',
          });
          continue;
        }

        if (
          !['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain'].includes(
            ficheiro.type,
          )
        ) {
          aviso({
            title: 'Formato não suportado',
            message: 'Use PDF, TXT, JPG, PNG ou WebP.',
            type: 'error',
          });
          continue;
        }

        const base64Dados = await new Promise((resolver, rejeitar) => {
          const reader = new FileReader();

          reader.onload = () => resolver(reader.result);
          reader.onerror = rejeitar;
          reader.readAsDataURL(ficheiro);
        });
        const extension = ficheiro.name.split('.').pop()?.toUpperCase() || 'PDF';
        const novoDoc = {
          id: `doc-${crypto.randomUUID()}-${Math.random().toString(36).substr(2, 4)}`,
          title: ficheiro.name.replace(/\.[^/.]+$/, ''),
          fileName: ficheiro.name,
          type: extension,
          sizeBytes: ficheiro.size,
          url: base64Dados,
        };

        definirDocumentos((anterior) => [...anterior, novoDoc]);
        aviso({
          title: 'Documento Anexado',
          message: `"${ficheiro.name}" carregado com sucesso.`,
          type: 'success',
        });
      }
    } catch {
      aviso({
        title: 'Erro no Upload',
        message: 'Não foi possível processar o ficheiro selecionado.',
        type: 'error',
      });
    } finally {
      definirIsUploadingDoc(false);
      if (docEntradaRef.current) docEntradaRef.current.value = '';
    }
  };

  const tratarRemoverDocumento = (docId) => {
    soundEffects.play('click');
    definirDocumentos((anterior) => anterior.filter((d) => d.id !== docId));
  };

  useEffect(() => {
    if (!isEditarModo || !editarCursoId) return;
    let isMounted = true;

    definirIsCarregamentoCurso(true);
    api
      .get(`/formador/cursos/${editarCursoId}`)
      .then(({ data: dados }) => dados)
      .then((curso) => {
        if (!isMounted || !curso) return;
        definirTitulo(curso.title || '');
        definirDescricao(curso.description || '');

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
        const rawCat = curso.category || '';
        const mappedCat = catMap[rawCat.toLowerCase()] || rawCat || 'Programação & Software';

        definirCategoria(mappedCat);
        definirDificuldade(curso.difficulty || 'Iniciante');
        definirLanguage(curso.language || 'Português');
        definirIsGratuito(curso.eGratuito !== undefined ? !!curso.eGratuito : true);
        definirPrecoReferencia(curso.precoReferencia == null ? '' : String(curso.precoReferencia));
        definirPreco(
          curso.price !== undefined && curso.price !== null && Number(curso.price) > 0
            ? String(curso.price)
            : '',
        );
        definirDuracaoHoras(
          curso.duracaoHoras !== undefined && curso.duracaoHoras !== null
            ? String(curso.duracaoHoras)
            : '',
        );
        definirMiniaturaUrl(curso.urlMiniatura || '');
        definirTemCommunity(Boolean(curso.idEspaco));
        definirExistenteCommunity(Boolean(curso.idEspaco));
        definirPublicacao(curso);
        if (Array.isArray(curso.learningOutcomes)) {
          definirAprendizagemOutcomes(
            curso.learningOutcomes.length > 0 ? curso.learningOutcomes : [''],
          );
        }

        if (Array.isArray(curso.requirements)) {
          definirRequisitos(curso.requirements.length > 0 ? curso.requirements : ['']);
        }

        if (Array.isArray(curso.documents)) {
          definirDocumentos(curso.documents);
        }

        if (Array.isArray(curso.channels) && curso.channels.length > 0) {
          definirCanais(
            curso.channels.map((c) => ({
              id: c.id,
              name: c.name,
              type: c.type || (c.eVoz ? 'voice' : 'text'),
              modoAcesso: c.modoAcesso || 'discussion',
              modoVoz: 'open',
              topic: c.topic || '',
              perguntaOrientadora: c.perguntaOrientadora || '',
              guidelines: c.guidelines || '',
            })),
          );
        }

        if (Array.isArray(curso.modules)) {
          definirModulos(
            curso.modules.map((m) => ({
              id: m.id,
              title: m.title,
              description: m.description || '',
              modoDesbloqueio: m.modoDesbloqueio === 'sequential' ? 'sequential' : 'instant',
              lessons: Array.isArray(m.lessons)
                ? m.lessons.map((l) => ({
                    id: l.id,
                    title: l.title,
                    type: l.type || 'video',
                    content: l.content || '',
                    urlVideo: l.urlVideo || '',
                    duracaoMinutos: l.duracaoMinutos || 15,
                    recompensaExperiencia: l.recompensaExperiencia || 25,
                    quiz: l.quiz || null,
                    richArticle: l.richArticle || null,
                  }))
                : [],
            })),
          );
        }
      })
      .catch((erro) => {
        aviso({
          title: 'Erro ao Carregar',
          message: erro.message || 'Não foi possível carregar os dados do curso.',
          type: 'error',
        });
        navigate('/formador');
      })
      .finally(() => {
        if (isMounted) definirIsCarregamentoCurso(false);
      });

    return () => {
      isMounted = false;
    };
  }, [editarCursoId, isEditarModo, utilizador]);

  const alternarCanalExpandir = (id) => {
    definirExpandedCanalIds((anterior) => {
      const seguinte = new Set(anterior);
      if (seguinte.has(id)) seguinte.delete(id);
      else seguinte.add(id);

      return seguinte;
    });
  };

  const tratarAdicionarCanal = (type) => {
    soundEffects.play('click');

    const contar = canais.filter((c) => c.type === type).length + 1;
    const novoChan = {
      id: `ch-${crypto.randomUUID()}`,
      name: type === 'voice' ? `sala-ao-vivo-${contar}` : `novo-canal-${contar}`,
      type,
      modoAcesso: type === 'text' ? 'discussion' : type === 'qa' ? 'qa' : undefined,
      modoVoz: type === 'voice' ? 'open' : undefined,
      topic: 'Canal de interação da comunidade.',
      perguntaOrientadora: '',
      guidelines: 'Comunique de forma cordial e profissional.',
    };

    definirCanais((anterior) => [...anterior, novoChan]);
    alternarCanalExpandir(novoChan.id);
  };

  const tratarAtualizarCanal = (id, campo, valor) => {
    definirCanais((anterior) =>
      anterior.map((c) => {
        if (c.id !== id) return c;
        if (campo === 'name') {
          const formatted = String(valor)
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
          [campo]: valor,
        };
      }),
    );
  };

  const tratarRemoverCanal = (id) => {
    soundEffects.play('click');
    if (canais.length <= 1) {
      aviso({
        title: 'Atenção',
        message: 'O curso deve conter pelo menos 1 canal.',
        type: 'error',
      });

      return;
    }

    if (
      isEditarModo &&
      !String(id).startsWith('ch-') &&
      !window.confirm('Eliminar este canal e as suas mensagens ao guardar o curso?')
    )
      return;
    definirCanais((anterior) => anterior.filter((c) => c.id !== id));
  };

  const tratarAdicionarModulo = () => {
    soundEffects.play('click');

    const novoMod = {
      id: `mod-${crypto.randomUUID()}`,
      title: `Módulo ${modulos.length + 1}`,
      description: '',
      modoDesbloqueio: 'instant',
      lessons: [],
    };

    definirModulos((anterior) => [...anterior, novoMod]);
  };

  const tratarMoverModulo = (mIdx, direction) => {
    soundEffects.play('click');
    definirModulos((anterior) => {
      const seguinte = [...anterior];
      const destinoIdx = direction === 'up' ? mIdx - 1 : mIdx + 1;
      if (destinoIdx < 0 || destinoIdx >= seguinte.length) return anterior;
      const temp = seguinte[mIdx];

      seguinte[mIdx] = seguinte[destinoIdx];
      seguinte[destinoIdx] = temp;

      return seguinte;
    });
  };

  const tratarMoverAula = (modId, lIdx, direction) => {
    soundEffects.play('click');
    definirModulos((anterior) =>
      anterior.map((m) => {
        if (m.id !== modId) return m;
        const aulas = [...m.lessons];
        const destinoIdx = direction === 'up' ? lIdx - 1 : lIdx + 1;
        if (destinoIdx < 0 || destinoIdx >= aulas.length) return m;
        const temp = aulas[lIdx];

        aulas[lIdx] = aulas[destinoIdx];
        aulas[destinoIdx] = temp;

        return {
          ...m,
          lessons: aulas,
        };
      }),
    );
  };

  const alternarModuloCollapse = (id) => {
    definirCollapsedModuloIds((anterior) => {
      const seguinte = new Set(anterior);
      if (seguinte.has(id)) seguinte.delete(id);
      else seguinte.add(id);

      return seguinte;
    });
  };

  const tratarAtualizarModulo = (modId, campo, valor) => {
    definirModulos((anterior) =>
      anterior.map((m) =>
        m.id === modId
          ? {
              ...m,
              [campo]: valor,
            }
          : m,
      ),
    );
  };

  const tratarRemoverModulo = (modId) => {
    soundEffects.play('click');
    definirModulos((anterior) => anterior.filter((m) => m.id !== modId));
  };

  const tratarAdicionarAula = (modId, aulaType = 'video') => {
    soundEffects.play('click');
    definirModulos((anterior) =>
      anterior.map((m) => {
        if (m.id !== modId) return m;
        const contar = m.lessons.length + 1;
        const novoLes = {
          id: `les-${crypto.randomUUID()}`,
          title: `Aula ${contar}`,
          type: aulaType,
          duracaoMinutos: 15,
          urlVideo: '',
          content: '',
          recompensaExperiencia: 25,
        };
        if (aulaType === 'video') {
          novoLes.videoChapters = [];
        } else if (aulaType === 'text') {
          novoLes.richArticle = {
            markdown: '',
            checklist: [],
          };
        } else if (aulaType === 'quiz') {
          novoLes.quiz = {
            title: '',
            description: '',
            pontuacaoAprovacao: 70,
            recompensaExperiencia: 50,
            questions: [],
          };
        }

        return {
          ...m,
          lessons: [...m.lessons, novoLes],
        };
      }),
    );
  };

  const tratarAtualizarAula = (modId, lesId, campo, valor) => {
    definirModulos((anterior) =>
      anterior.map((m) => {
        if (m.id !== modId) return m;

        return {
          ...m,
          lessons: m.lessons.map((l) => {
            if (l.id !== lesId) return l;

            return {
              ...l,
              [campo]: valor,
            };
          }),
        };
      }),
    );
  };

  const tratarRemoverAula = (modId, lesId) => {
    soundEffects.play('click');
    definirModulos((anterior) =>
      anterior.map((m) => {
        if (m.id !== modId) return m;

        return {
          ...m,
          lessons: m.lessons.filter((l) => l.id !== lesId),
        };
      }),
    );
  };

  const tratarMiniaturaFicheiroAlterar = async (evento) => {
    const ficheiro = evento.target.files?.[0];
    if (!ficheiro) return;
    if (!ficheiro.type.startsWith('image/')) {
      aviso({
        title: 'Ficheiro inválido',
        message: 'Selecione uma imagem (JPG, PNG, WebP).',
        type: 'error',
      });

      return;
    }

    definirIsCompressingThumb(true);
    try {
      const base64 = await new Promise((resolver, rejeitar) => {
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
              rejeitar(new Error('canvas'));

              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            resolver(canvas.toDataURL('image/jpeg', 0.82));
          };

          img.onerror = rejeitar;
          img.src = ev.target?.result;
        };

        reader.onerror = rejeitar;
        reader.readAsDataURL(ficheiro);
      });

      definirMiniaturaUrl(base64);
    } catch {
      aviso({
        title: 'Erro',
        message: 'Não foi possível processar a imagem.',
        type: 'error',
      });
    } finally {
      definirIsCompressingThumb(false);
      if (miniaturaEntradaRef.current) miniaturaEntradaRef.current.value = '';
    }
  };

  const tratarPublicar = async (publicar = true) => {
    if (savingCurso.current) return;
    if (!titulo.trim()) {
      aviso({
        title: 'Campo Obrigatório',
        message: 'Por favor, introduza o título do curso no Passo 1.',
        type: 'error',
      });
      definirAtivoStep(1);

      return;
    }

    savingCurso.current = true;
    definirIsSubmitting(true);
    try {
      const payload = {
        title: titulo.trim(),
        description: descricao.trim(),
        category: categoria,
        difficulty: dificuldade,
        language,
        price: isGratuito ? 0 : Number(preco || 0),
        precoReferencia: isGratuito || !precoReferencia ? null : Number(precoReferencia),
        eGratuito: isGratuito,
        estaPublicado: false,
        atualizadoEmEsperado: publicacao?.atualizadoEm,
        duracaoHoras: Number(duracaoHoras || 0),
        urlMiniatura: miniaturaUrl.trim(),
        learningOutcomes: (aprendizagemOutcomes || []).map((o) => o.trim()).filter(Boolean),
        requirements: (requisitos || []).map((r) => r.trim()).filter(Boolean),
        documents: documentos || [],
        hasCommunity: temCommunity,
        channels: temCommunity ? canais : [],
        modules: modulos,
      };
      let resultadoId = guardadoCursoId.current || editarCursoId;
      if (resultadoId) await api.put(`/formador/cursos/${resultadoId}`, payload);
      else {
        const { data: dados } = await api.post('/formador/cursos', payload);

        resultadoId = dados.id;
        guardadoCursoId.current = resultadoId;
      }

      const { data: guardado } = await api.get(`/formador/cursos/${resultadoId}`);

      definirPublicacao(guardado);
      if (publicar) await api.post(`/formador/cursos/${resultadoId}/submeter-revisao`);
      aviso({
        title: publicar ? 'Curso enviado para revisão' : 'Rascunho guardado',
        message: publicar
          ? 'Receberá a decisão e o feedback nas notificações e no painel do criador.'
          : 'Pode continuar a editar o curso antes de o enviar para revisão.',
        type: 'success',
      });
      navigate('/formador');
    } catch (erro) {
      aviso({
        title: isEditarModo ? 'Erro ao Guardar Curso' : 'Erro ao Publicar Curso',
        message:
          erro.message ||
          (isEditarModo
            ? 'Não foi possível guardar as alterações.'
            : 'Não foi possível publicar o curso.'),
        type: 'error',
      });
    } finally {
      savingCurso.current = false;
      definirIsSubmitting(false);
    }
  };

  if (isCarregamentoCurso) {
    return <EsqueletoPagina variant="course" label="A carregar dados do curso para edição" />;
  }

  return (
    <div className="course-builder-panel-21">
      <header className="course-builder-header">
        <div className="course-builder-panel-22">
          <div className="course-builder-panel-23">
            <Link
              to="/formador"
              className="course-builder-link"
              title="Voltar ao Painel do Criador"
            >
              <ArrowLeft className="course-builder-render-badge-icon" />
            </Link>
            <div className="course-builder-panel-24">
              <div className="course-builder-panel-11">
                <h1 className="course-builder-title">
                  {isEditarModo ? 'Editar curso' : 'Criar curso'}
                </h1>
              </div>
              <p className="course-builder-description-5">
                Organize os módulos, as aulas e a comunidade do curso.
              </p>
            </div>
          </div>

          <div className="course-builder-panel-25">
            <Botao
              variant="secondary"
              size="sm"
              disabled={isSubmitting}
              onClick={() => tratarPublicar(false)}
            >
              Guardar rascunho
            </Botao>
            <Botao
              variant="primary"
              size="sm"
              leftIcon={<Send className="course-builder-trash2" />}
              isLoading={isSubmitting}
              onClick={() => tratarPublicar(true)}
              className="course-builder-button-11"
            >
              <span>Enviar para revisão</span>
            </Botao>
          </div>
        </div>
      </header>

      <div className="course-builder-main">
        {publicacao && <CursoParecer course={publicacao} />}
        <div className="editor-workspace">
          <nav
            aria-label="Progresso da criação do curso"
            className="course-builder-navigation"
          >
            <p className="editor-nav-title">Organizar o curso</p>
            <div className="course-builder-panel-26">
              {[
                {
                  num: 1,
                  short: '1. Identidade',
                  label: 'Apresentação',
                  description: 'Informações, imagem e preço',
                },
                {
                  num: 2,
                  short: '2. Canais',
                  label: 'Comunidade',
                  description: 'Canais e acesso dos alunos',
                },
                {
                  num: 3,
                  short: '3. Aulas',
                  label: 'Conteúdos',
                  description: 'Módulos, aulas e recursos',
                },
                {
                  num: 4,
                  short: '4. Publicar',
                  label: 'Revisão',
                  description: 'Conferir antes de enviar',
                },
              ].map((st) => {
                const isAtual = ativoStep === st.num;

                return (
                  <button
                    key={st.num}
                    type="button"
                    aria-current={isAtual ? 'step' : undefined}
                    onClick={() => {
                      soundEffects.play('click');
                      definirAtivoStep(st.num);
                    }}
                    className={`course-builder-button-12 ${isAtual ? 'course-builder-button-13' : 'course-builder-button-14'}`}
                  >
                    <span className="editor-step-number">{st.num}</span>
                    <span className="editor-step-text">
                      <strong>{st.label}</strong>
                      <small>{st.description}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
          <div className="editor-content">
            {ativoStep === 1 && (
              <div className="course-builder-panel-27">
                <Cartao className="course-builder-card">
                  <div className="course-builder-panel-28">
                    <div>
                      <h2 className="course-builder-heading">
                        <BookOpen className="course-builder-book-open" />
                        Informações do curso
                      </h2>
                      <p className="course-builder-description-6">
                        Título, descrição, categoria temática abrangente e carga horária estimada.
                      </p>
                    </div>
                  </div>

                  <div className="course-builder-panel-29">
                    <div className="course-builder-panel-30">
                      <label
                        htmlFor="curso-nome"
                        className="course-builder-field-label-2"
                      >
                        Nome do curso *
                      </label>
                      <input
                        id="curso-nome"
                        type="text"
                        value={titulo}
                        onChange={(evento) => definirTitulo(evento.target.value)}
                        placeholder="Ex.: Introdução à programação"
                        className="course-builder-field-7"
                      />
                    </div>

                    <div className="course-builder-panel-30">
                      <label
                        htmlFor="curso-descricao"
                        className="course-builder-field-label-2"
                      >
                        Descrição do curso
                      </label>
                      <textarea
                        id="curso-descricao"
                        value={descricao}
                        onChange={(evento) => definirDescricao(evento.target.value)}
                        rows={3}
                        placeholder="Explique o que os alunos vão aprender e para quem é este curso."
                        className="course-builder-field-7"
                      />
                    </div>

                    <div className="course-builder-panel-31">
                      <label className="course-builder-field-label-2">Categoria</label>
                      <div className="course-builder-panel-32">
                        <Seletor
                          value={categoria}
                          onChange={(evento) => definirCategoria(evento.target.value)}
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
                          <option value="Línguas & Idiomas">
                            Línguas & Comunicação Internacional
                          </option>
                          <option value="Finanças & Economia">
                            Finanças, Economia & Investimentos
                          </option>
                          <option value="Saúde & Bem-Estar">Saúde, Nutrição & Bem-Estar</option>
                          <option value="Desenvolvimento Pessoal">
                            Desenvolvimento Pessoal & Produtividade
                          </option>
                          <option value="Fotografia & Vídeo">
                            Fotografia, Vídeo & Audiovisual
                          </option>
                          <option value="Ciências & Engenharia">
                            Ciências, Matemática & Engenharia
                          </option>
                          <option value="Gastronomia & Culinária">
                            Gastronomia & Artes Culinárias
                          </option>
                          <option value="Música & Produção Áudio">
                            Música, Áudio & Produção Sonora
                          </option>
                          <option value="Direito & Sociedade">
                            Direito, Cidadania & Humanidades
                          </option>
                          <option value="Outras Áreas">Outras Áreas & Especializações</option>
                        </Seletor>
                      </div>
                    </div>

                    <div className="course-builder-panel-31">
                      <label className="course-builder-field-label-2">Dificuldade</label>
                      <div className="course-builder-panel-32">
                        <Seletor
                          value={dificuldade}
                          onChange={(evento) => definirDificuldade(evento.target.value)}
                          className="course-builder-select-2 subtle-shadow"
                        >
                          <option value="Iniciante">Iniciante (Sem pré-requisitos)</option>
                          <option value="Intermédio">Intermédio (Conhecimentos prévios)</option>
                          <option value="Avançado">Avançado (Especialização)</option>
                        </Seletor>
                      </div>
                    </div>

                    {/* Upload de Capa com Suporte a Drag & Drop */}
                    <div className="course-builder-panel-30">
                      <label className="course-builder-field-label-2">
                        Imagem de Capa (Arraste e solte o ficheiro ou carregue)
                      </label>

                      {miniaturaUrl && (
                        <div className="course-builder-panel-33 ui-group">
                          {isCompressingThumb ? (
                            <div className="course-builder-panel-34">
                              <Loader2 className="course-builder-loader2-2" />
                            </div>
                          ) : (
                            <img
                              src={miniaturaUrl}
                              alt="Capa do curso"
                              className="course-builder-image"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => definirMiniaturaUrl('')}
                            className="course-builder-button-15"
                            title="Remover imagem de capa"
                          >
                            <X className="course-builder-trash2" />
                          </button>
                        </div>
                      )}

                      <div
                        onDragOver={(evento) => {
                          evento.preventDefault();
                          evento.stopPropagation();
                        }}
                        onDrop={(evento) => {
                          evento.preventDefault();
                          evento.stopPropagation();

                          const ficheiro = evento.dataTransfer.files?.[0];
                          if (ficheiro && ficheiro.type.startsWith('image/')) {
                            tratarMiniaturaFicheiroAlterar({
                              target: {
                                files: [ficheiro],
                              },
                            });
                          }
                        }}
                        className="course-builder-panel-35"
                      >
                        <button
                          type="button"
                          onClick={() => miniaturaEntradaRef.current?.click()}
                          className="course-builder-button-16"
                        >
                          <Camera className="course-builder-trash2" />
                          <span>Escolher / Arrastar Imagem</span>
                        </button>
                        <input
                          ref={miniaturaEntradaRef}
                          type="file"
                          accept="image/*"
                          className="course-builder-field-8"
                          onChange={tratarMiniaturaFicheiroAlterar}
                        />
                        <input
                          type="text"
                          value={miniaturaUrl.startsWith('data:') ? '' : miniaturaUrl}
                          onChange={(evento) => definirMiniaturaUrl(evento.target.value)}
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
                            onClick={() => definirMiniaturaUrl(pt.url)}
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
                        value={duracaoHoras}
                        onChange={(evento) => definirDuracaoHoras(evento.target.value)}
                        className="course-builder-field-10"
                      />
                    </div>
                  </div>
                </Cartao>

                <div className="course-builder-panel-37">
                  <Cartao className="course-builder-card-2 curso-preco">
                    <h3 className="course-builder-subheading">Inscrição e preço</h3>
                    <CursoPrecoCampos
                      isGratuito={isGratuito}
                      preco={preco}
                      precoReferencia={precoReferencia}
                      onGratuitoChange={definirIsGratuito}
                      onPrecoChange={definirPreco}
                      onPrecoReferenciaChange={definirPrecoReferencia}
                    />
                  </Cartao>
                </div>

                {/* Competências & O que vai aprender */}
                <Cartao className="course-builder-card">
                  <div className="course-builder-panel-45">
                    <div>
                      <h3 className="course-builder-heading">
                        <Sparkles className="course-builder-book-open" />
                        <span>Competências & O que vai aprender</span>
                      </h3>
                      <p className="course-builder-description-6">
                        Pontos-chave visíveis para os alunos sobre os conhecimentos práticos
                        adquiridos no curso.
                      </p>
                    </div>
                    <Botao
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={<Plus className="course-builder-trash2" />}
                      onClick={tratarAdicionarResultado}
                      className="course-builder-button-22"
                    >
                      Adicionar Competência
                    </Botao>
                  </div>

                  <div className="course-builder-panel-5">
                    {aprendizagemOutcomes.map((resultado, idx) => (
                      <div
                        key={idx}
                        className="course-builder-panel-11"
                      >
                        <div className="course-builder-panel-46">{idx + 1}</div>
                        <input
                          type="text"
                          value={resultado}
                          onChange={(evento) => tratarAtualizarResultado(idx, evento.target.value)}
                          placeholder={`ex: Construção de APIs REST escaláveis com Node.js e Express...`}
                          className="course-builder-field-13"
                        />
                        {aprendizagemOutcomes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => tratarRemoverResultado(idx)}
                            className="course-builder-button-23"
                            title="Remover competência"
                          >
                            <Trash2 className="course-builder-trash2" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </Cartao>

                {/* Requisitos e Pré-requisitos */}
                <Cartao className="course-builder-card">
                  <div className="course-builder-panel-45">
                    <div>
                      <h3 className="course-builder-heading">
                        <CheckCircle2 className="course-builder-dollar-sign" />
                        <span>Requisitos e Pré-requisitos</span>
                      </h3>
                      <p className="course-builder-description-6">
                        Ferramentas, conhecimentos ou equipamentos necessários antes de iniciar o
                        curso.
                      </p>
                    </div>
                    <Botao
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={<Plus className="course-builder-trash2" />}
                      onClick={tratarAdicionarRequisito}
                      className="course-builder-button-22"
                    >
                      Adicionar Requisito
                    </Botao>
                  </div>

                  <div className="course-builder-panel-5">
                    {requisitos.map((pedidoItem, idx) => (
                      <div
                        key={idx}
                        className="course-builder-panel-11"
                      >
                        <div className="course-builder-panel-47">{idx + 1}</div>
                        <input
                          type="text"
                          value={pedidoItem}
                          onChange={(evento) => tratarAtualizarRequisito(idx, evento.target.value)}
                          placeholder={`ex: Conhecimentos básicos de JavaScript e lógica de programação...`}
                          className="course-builder-field-13"
                        />
                        {requisitos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => tratarRemoverRequisito(idx)}
                            className="course-builder-button-23"
                            title="Remover requisito"
                          >
                            <Trash2 className="course-builder-trash2" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </Cartao>

                {/* Documentos e Ficheiros de Apoio (PDFs, Materiais) */}
                <Cartao className="course-builder-card">
                  <div className="course-builder-panel-45">
                    <div>
                      <h3 className="course-builder-heading">
                        <Paperclip className="course-builder-paperclip" />
                        <span>Documentos & Ficheiros de Apoio (PDF, Guias, Zip)</span>
                      </h3>
                      <p className="course-builder-description-6">
                        Anexe PDFs, sebentas, resumos e ficheiros de apoio para download pelos
                        alunos inscritos.
                      </p>
                    </div>
                    <div>
                      <input
                        ref={docEntradaRef}
                        type="file"
                        multiple
                        accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
                        onChange={tratarDocumentoCarregar}
                        className="course-builder-field-8"
                      />
                      <Botao
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={<UploadCloud className="course-builder-trash2" />}
                        isLoading={isUploadingDoc}
                        onClick={() => docEntradaRef.current?.click()}
                        className="course-builder-button-24"
                      >
                        Carregar Ficheiros (PDF / ZIP)
                      </Botao>
                    </div>
                  </div>

                  {documentos.length === 0 ? (
                    <div
                      onClick={() => docEntradaRef.current?.click()}
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
                      {documentos.map((doc, dIdx) => (
                        <div
                          key={doc.id || dIdx}
                          className="course-builder-panel-50 subtle-shadow"
                        >
                          <div className="course-builder-panel-51">
                            <div className="course-builder-panel-52">{doc.type || 'PDF'}</div>
                            <div className="course-builder-panel-24">
                              <input
                                type="text"
                                value={doc.title}
                                onChange={(evento) => {
                                  const val = evento.target.value;

                                  definirDocumentos((anterior) =>
                                    anterior.map((d, idx) =>
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
                            onClick={() => tratarRemoverDocumento(doc.id)}
                            className="course-builder-button-25"
                            title="Remover ficheiro"
                          >
                            <Trash2 className="course-builder-plus" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Cartao>

                <div className="course-builder-panel-53">
                  <Botao
                    variant="primary"
                    onClick={() => {
                      soundEffects.play('click');
                      definirAtivoStep(2);
                    }}
                    rightIcon={<ArrowRight className="course-builder-trash2" />}
                    className="course-builder-button-26"
                  >
                    Continuar para Comunidade
                  </Botao>
                </div>
              </div>
            )}

            {ativoStep === 2 && (
              <div className="course-builder-panel-27">
                <Cartao className="course-builder-card">
                  <h2 className="course-builder-heading">Tipo de curso</h2>
                  <p className="course-builder-description-6">
                    Escolha se o curso inclui chats e salas de chamada para a turma.
                  </p>
                  <fieldset className="course-community-choice">
                    <legend>Comunidade do curso</legend>
                    <label>
                      <input
                        type="radio"
                        name="course-community"
                        checked={temCommunity}
                        onChange={() => definirTemCommunity(true)}
                      />{' '}
                      Com comunidade <span>Chats, fóruns e chamadas ao vivo.</span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="course-community"
                        checked={!temCommunity}
                        disabled={existenteCommunity}
                        onChange={() => definirTemCommunity(false)}
                      />{' '}
                      Sem comunidade <span>Apenas módulos, aulas e avaliações.</span>
                    </label>
                  </fieldset>
                  {existenteCommunity && (
                    <p className="course-builder-description-6">
                      Este curso já tem uma comunidade. Os canais e as conversas existentes serão
                      conservados.
                    </p>
                  )}
                  {!temCommunity && (
                    <p className="course-builder-description-6">
                      Pode ativar a comunidade mais tarde ao editar o curso.
                    </p>
                  )}
                </Cartao>
                {temCommunity && (
                  <Cartao className="course-builder-card">
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
                        <Botao
                          size="sm"
                          variant="secondary"
                          onClick={() => tratarAdicionarCanal('text')}
                          leftIcon={<Plus className="course-builder-trash2" />}
                          className="course-builder-button-30"
                        >
                          + Canal de Texto
                        </Botao>
                        <Botao
                          size="sm"
                          variant="primary"
                          onClick={() => tratarAdicionarCanal('voice')}
                          leftIcon={<Volume2 className="course-builder-trash2" />}
                          className="course-builder-button-31"
                        >
                          + Sala ao Vivo
                        </Botao>
                      </div>
                    </div>

                    <div className="course-builder-panel-5">
                      {canais.map((chan) => {
                        const isVoz = chan.type === 'voice';
                        const isAnnouncement = chan.modoAcesso === 'announcement';

                        return (
                          <div
                            key={chan.id}
                            className="course-builder-panel-56"
                          >
                            <div className="course-builder-panel-6">
                              <div className="course-builder-panel-51">
                                <div className="course-builder-panel-57">
                                  {isVoz ? (
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
                                  onChange={(evento) =>
                                    tratarAtualizarCanal(chan.id, 'name', evento.target.value)
                                  }
                                  className="course-builder-field-15"
                                />
                                {isAnnouncement ? (
                                  <span className="course-builder-label-7">
                                    <Lock className="course-builder-plus-2" />
                                    Apenas Informativo
                                  </span>
                                ) : isVoz ? (
                                  <span className="course-builder-label-8">
                                    Sala de Voz / Vídeo
                                  </span>
                                ) : (
                                  <span className="course-builder-label-9">Discussão Aberta</span>
                                )}
                              </div>

                              <div className="course-builder-panel-11">
                                <button
                                  type="button"
                                  onClick={() => alternarCanalExpandir(chan.id)}
                                  className="course-builder-button-32"
                                >
                                  {expandedCanalIds.has(chan.id) ? (
                                    <ChevronUp className="course-builder-trash2" />
                                  ) : (
                                    <ChevronDown className="course-builder-trash2" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => tratarRemoverCanal(chan.id)}
                                  className="course-builder-button-33"
                                  title="Remover canal"
                                >
                                  <Trash2 className="course-builder-trash2" />
                                </button>
                              </div>
                            </div>

                            {expandedCanalIds.has(chan.id) && (
                              <div className="course-builder-panel-58">
                                {!isVoz ? (
                                  <div>
                                    <label className="course-builder-field-label-4">
                                      Modo de Envio
                                    </label>
                                    <Seletor
                                      value={chan.modoAcesso || 'discussion'}
                                      onChange={(evento) =>
                                        tratarAtualizarCanal(
                                          chan.id,
                                          'modoAcesso',
                                          evento.target.value,
                                        )
                                      }
                                      className="course-builder-select-4"
                                    >
                                      <option value="discussion">
                                        Discussão Aberta (Todos podem publicar)
                                      </option>
                                      <option value="announcement">
                                        Apenas Leitura / Informativo (Apenas Instrutor)
                                      </option>
                                      <option value="qa">Perguntas & Respostas</option>
                                    </Seletor>
                                  </div>
                                ) : (
                                  <p>Chamada de voz e vídeo com os controlos normais da sala.</p>
                                )}

                                <div>
                                  <label className="course-builder-field-label-4">
                                    Tópico / Descrição Curta
                                  </label>
                                  <input
                                    type="text"
                                    value={chan.topic}
                                    onChange={(evento) =>
                                      tratarAtualizarCanal(chan.id, 'topic', evento.target.value)
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
                                    onChange={(evento) =>
                                      tratarAtualizarCanal(
                                        chan.id,
                                        'guidelines',
                                        evento.target.value,
                                      )
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
                  </Cartao>
                )}

                <div className="course-builder-panel-66">
                  <Botao
                    variant="secondary"
                    onClick={() => {
                      soundEffects.play('click');
                      definirAtivoStep(1);
                    }}
                    leftIcon={<ArrowLeft className="course-builder-trash2" />}
                    className="course-builder-button-34"
                  >
                    Voltar
                  </Botao>
                  <Botao
                    variant="primary"
                    onClick={() => {
                      soundEffects.play('click');
                      definirAtivoStep(3);
                    }}
                    rightIcon={<ArrowRight className="course-builder-trash2" />}
                    className="course-builder-button-26"
                  >
                    Continuar para Aulas & Módulos
                  </Botao>
                </div>
              </div>
            )}

            {ativoStep === 3 && (
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
                    <Botao
                      onClick={tratarAdicionarModulo}
                      leftIcon={<Plus className="course-builder-trash2" />}
                      className="course-builder-button-35"
                    >
                      + Novo Módulo
                    </Botao>
                  </div>
                </div>

                {modulos.length === 0 ? (
                  <Cartao className="course-builder-card-4">
                    <div className="course-builder-panel-69">
                      <Layers className="course-builder-layers" />
                    </div>
                    <h3 className="course-builder-subheading-4">Nenhum módulo criado ainda</h3>
                    <p className="course-builder-description-12">
                      O curso está pronto para receber o seu conteúdo. Clique no botão abaixo para
                      adicionar o primeiro módulo.
                    </p>
                    <div className="course-builder-panel-70">
                      <Botao
                        variant="primary"
                        onClick={tratarAdicionarModulo}
                        leftIcon={<Plus className="course-builder-trash2" />}
                        className="course-builder-button-36"
                      >
                        + Criar Primeiro Módulo
                      </Botao>
                    </div>
                  </Cartao>
                ) : (
                  modulos.map((mod, mIdx) => {
                    const isCollapsed = collapsedModuloIds.has(mod.id);

                    return (
                      <Cartao
                        key={mod.id}
                        className="course-builder-card-5"
                      >
                        <div className="course-builder-panel-55">
                          <div className="course-builder-panel-71">
                            <button
                              type="button"
                              onClick={() => alternarModuloCollapse(mod.id)}
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
                                  onChange={(evento) =>
                                    tratarAtualizarModulo(mod.id, 'title', evento.target.value)
                                  }
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
                                onChange={(evento) =>
                                  tratarAtualizarModulo(mod.id, 'description', evento.target.value)
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
                              onClick={() => tratarMoverModulo(mIdx, 'up')}
                              className="course-builder-button-38"
                              title="Mover módulo para cima"
                            >
                              <ChevronUp className="course-builder-trash2" />
                            </button>
                            <button
                              type="button"
                              disabled={mIdx === modulos.length - 1}
                              onClick={() => tratarMoverModulo(mIdx, 'down')}
                              className="course-builder-button-38"
                              title="Mover módulo para baixo"
                            >
                              <ChevronDown className="course-builder-trash2" />
                            </button>
                            <Seletor
                              value={
                                mod.modoDesbloqueio === 'sequential' ? 'sequential' : 'instant'
                              }
                              onChange={(evento) =>
                                tratarAtualizarModulo(
                                  mod.id,
                                  'modoDesbloqueio',
                                  evento.target.value,
                                )
                              }
                              className="course-builder-select-5"
                              title="Regra de desbloqueio"
                            >
                              <option value="instant">Imediato</option>
                              <option value="sequential">Sequencial</option>
                            </Seletor>
                            <button
                              type="button"
                              onClick={() => tratarRemoverModulo(mod.id)}
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
                                <div
                                  key={les.id}
                                  className="course-builder-panel-75"
                                >
                                  <div className="course-builder-panel-76">
                                    <div className="course-builder-panel-77">
                                      <span className="course-builder-label-14">{lIdx + 1}</span>
                                      <input
                                        type="text"
                                        value={les.title}
                                        onChange={(evento) =>
                                          tratarAtualizarAula(
                                            mod.id,
                                            les.id,
                                            'title',
                                            evento.target.value,
                                          )
                                        }
                                        placeholder="Título da Aula..."
                                        className="course-builder-field-20"
                                      />
                                    </div>

                                    <div className="course-builder-panel-74">
                                      <button
                                        type="button"
                                        disabled={lIdx === 0}
                                        onClick={() => tratarMoverAula(mod.id, lIdx, 'up')}
                                        className="course-builder-button-40"
                                        title="Mover aula para cima"
                                      >
                                        <ChevronUp className="course-builder-plus" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={lIdx === mod.lessons.length - 1}
                                        onClick={() => tratarMoverAula(mod.id, lIdx, 'down')}
                                        className="course-builder-button-40"
                                        title="Mover aula para baixo"
                                      >
                                        <ChevronDown className="course-builder-plus" />
                                      </button>
                                      <Seletor
                                        value={les.type}
                                        onChange={(evento) =>
                                          tratarAtualizarAula(
                                            mod.id,
                                            les.id,
                                            'type',
                                            evento.target.value,
                                          )
                                        }
                                        className="course-builder-select-6"
                                      >
                                        <option value="video">Vídeo</option>
                                        <option value="text">Artigo</option>
                                        <option value="quiz">Questionário</option>
                                        <option value="resource">Recursos</option>
                                        <option value="project">Projeto</option>
                                      </Seletor>
                                      <button
                                        type="button"
                                        onClick={() => tratarRemoverAula(mod.id, les.id)}
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
                                        value={les.urlVideo || ''}
                                        onChange={(evento) =>
                                          tratarAtualizarAula(
                                            mod.id,
                                            les.id,
                                            'urlVideo',
                                            evento.target.value,
                                          )
                                        }
                                        placeholder="URL do Vídeo (YouTube, Vimeo, MP4)..."
                                        className="course-builder-field-21"
                                      />
                                      <div className="course-builder-panel-79">
                                        <span className="course-builder-label-15">Duração:</span>
                                        <input
                                          type="number"
                                          value={les.duracaoMinutos || 15}
                                          onChange={(evento) =>
                                            tratarAtualizarAula(
                                              mod.id,
                                              les.id,
                                              'duracaoMinutos',
                                              Number(evento.target.value),
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
                                        onChange={(evento) => {
                                          const curr = les.richArticle || {
                                            markdown: '',
                                            calloutType: 'tip',
                                            calloutTitle: 'Dica',
                                            calloutText: '',
                                            checklist: [],
                                          };

                                          tratarAtualizarAula(mod.id, les.id, 'richArticle', {
                                            ...curr,
                                            markdown: evento.target.value,
                                          });
                                          tratarAtualizarAula(
                                            mod.id,
                                            les.id,
                                            'content',
                                            evento.target.value,
                                          );
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
                                        onChange={(evento) =>
                                          tratarAtualizarAula(
                                            mod.id,
                                            les.id,
                                            'content',
                                            evento.target.value,
                                          )
                                        }
                                        className="course-builder-textarea-3"
                                        placeholder="Descreva o trabalho, os critérios de aprovação e o que o aluno deve partilhar na ligação de entrega."
                                      />
                                    </div>
                                  )}
                                  {les.type === 'quiz' && (
                                    <QuestionarioAulaEditor
                                      quiz={les.quiz}
                                      onChange={(atualizadoQuestionario) =>
                                        tratarAtualizarAula(
                                          mod.id,
                                          les.id,
                                          'quiz',
                                          atualizadoQuestionario,
                                        )
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
                                        onChange={(evento) =>
                                          tratarAtualizarAula(
                                            mod.id,
                                            les.id,
                                            'content',
                                            evento.target.value,
                                          )
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
                                onClick={() => tratarAdicionarAula(mod.id, 'video')}
                                className="course-builder-button-41"
                              >
                                + Vídeo
                              </button>
                              <button
                                type="button"
                                onClick={() => tratarAdicionarAula(mod.id, 'text')}
                                className="course-builder-button-42"
                              >
                                + Artigo
                              </button>
                              <button
                                type="button"
                                onClick={() => tratarAdicionarAula(mod.id, 'quiz')}
                                className="course-builder-button-43"
                              >
                                + Questionário
                              </button>
                              <button
                                type="button"
                                onClick={() => tratarAdicionarAula(mod.id, 'resource')}
                                className="course-builder-button-44"
                              >
                                + Recursos
                              </button>
                              <button
                                type="button"
                                onClick={() => tratarAdicionarAula(mod.id, 'project')}
                                className="course-builder-button-44"
                              >
                                + Projeto
                              </button>
                            </div>
                          </div>
                        )}
                      </Cartao>
                    );
                  })
                )}

                <div className="course-builder-panel-82">
                  <Botao
                    variant="secondary"
                    onClick={() => {
                      soundEffects.play('click');
                      definirAtivoStep(2);
                    }}
                    leftIcon={<ArrowLeft className="course-builder-trash2" />}
                    className="course-builder-button-45"
                  >
                    Voltar aos Canais
                  </Botao>

                  <Botao
                    variant="primary"
                    onClick={() => {
                      soundEffects.play('click');
                      definirAtivoStep(4);
                    }}
                    rightIcon={<ArrowRight className="course-builder-trash2" />}
                    className="course-builder-button-46"
                  >
                    Rever curso
                  </Botao>
                </div>
              </div>
            )}

            {ativoStep === 4 && (
              <div className="course-builder-panel-27">
                <Cartao className="course-builder-card-3">
                  <div className="course-builder-panel-28">
                    <div>
                      <h2 className="course-builder-heading-2">
                        <CheckCircle2 className="course-builder-check-circle2" />
                        Rever o curso
                      </h2>
                      <p className="course-builder-description-6">
                        Verifique os parâmetros configurados antes de publicar na plataforma.
                      </p>
                    </div>
                  </div>

                  <div className="course-builder-panel-83">
                    <div className="course-builder-panel-84">
                      <span className="course-builder-label-20">Conteúdo</span>
                      <p className="course-builder-description-14">{modulos.length} Módulos</p>
                      <p className="course-builder-description-15">
                        {modulos.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)} Aulas
                      </p>
                    </div>

                    <div className="course-builder-panel-84">
                      <span className="course-builder-label-20">Competências</span>
                      <p className="course-builder-description-14">
                        {aprendizagemOutcomes.filter((o) => o.trim()).length} Objetivos
                      </p>
                      <p className="course-builder-description-16">Preenchidos</p>
                    </div>

                    <div className="course-builder-panel-84">
                      <span className="course-builder-label-20">Ficheiros / PDFs</span>
                      <p className="course-builder-description-14">{documentos.length} Anexos</p>
                      <p className="course-builder-description-17">Para Download</p>
                    </div>

                    <div className="course-builder-panel-84">
                      <span className="course-builder-label-20">Canais da Turma</span>
                      <p className="course-builder-description-14">
                        {temCommunity ? canais.length : 0} Canais
                      </p>
                      <p className="course-builder-description-17">
                        {temCommunity ? canais.filter((c) => c.type === 'voice').length : 0} Salas
                        ao vivo
                      </p>
                    </div>

                    <div className="course-builder-panel-84">
                      <span className="course-builder-label-20">Acesso Turma</span>
                      <p className="course-builder-description-14">Colaborativo</p>
                      <p className="course-builder-description-19">Formador & Colaboradores</p>
                    </div>
                  </div>

                  <div className="course-builder-panel-85">
                    {miniaturaUrl ? (
                      <img
                        src={miniaturaUrl}
                        alt={titulo}
                        className="course-builder-image-2"
                      />
                    ) : (
                      <div className="course-builder-panel-86">
                        <BookOpen className="course-builder-book-open-2" />
                      </div>
                    )}
                    <div className="course-builder-panel-72">
                      <h3 className="course-builder-subheading-5">{titulo || 'Título do Curso'}</h3>
                      <p className="course-builder-description-20">
                        {descricao || 'Sem descrição.'}
                      </p>
                      <div className="course-builder-panel-87">
                        <span className="course-builder-label-21">
                          {formatarCategoria(categoria)}
                        </span>
                        <span className="course-builder-label-22">{dificuldade}</span>
                        <span className="course-builder-label-23">
                          {isGratuito
                            ? 'Gratuito'
                            : formatarCursoPreco({
                                price: Number(preco) || 0,
                                eGratuito: false,
                              })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {utilizador?.role !== 'ADMIN' && (
                    <div className="course-builder-panel-88">
                      <Shield className="course-builder-shield" />
                      <div className="course-builder-panel-89">
                        <p className="course-builder-description-21">Validação Pedagógica NEXO</p>
                        Para salvaguardar os padrões de qualidade da comunidade NEXO, os novos
                        cursos submetidos por formadores são revistos pela equipa de administração
                        antes de serem publicados no catálogo aberto.
                      </div>
                    </div>
                  )}

                  <div className="course-builder-panel-90">
                    <Botao
                      variant="secondary"
                      onClick={() => {
                        soundEffects.play('click');
                        definirAtivoStep(3);
                      }}
                      leftIcon={<ArrowLeft className="course-builder-trash2" />}
                      className="course-builder-button-45"
                    >
                      Voltar às Aulas
                    </Botao>

                    <Botao
                      variant="primary"
                      size="lg"
                      isLoading={isSubmitting}
                      onClick={() => tratarPublicar(true)}
                      leftIcon={<Check className="course-builder-render-badge-icon" />}
                      className="course-builder-button-47"
                    >
                      Enviar para revisão
                    </Botao>
                  </div>
                </Cartao>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CursoEditorPagina;
