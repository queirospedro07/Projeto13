import './InstructorApplicationPage.css';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LuSparkles as Sparkles,
  LuClock as Clock,
  LuCircleAlert as AlertCircle,
  LuArrowRight as ArrowRight,
  LuArrowLeft as ArrowLeft,
  LuSend as Send,
  LuCodeXml as Code2,
  LuCpu as Cpu,
  LuShield as Shield,
  LuCloud as Cloud,
  LuPalette as Palette,
  LuCoins as Coins,
  LuCheck as Check,
  LuUserCheck as UserCheck,
} from 'react-icons/lu';
import { Cartao } from '../../components/Card';
import { Botao } from '../../components/Button';
import { Distintivo } from '../../components/Badge';
import { useAvisos } from '../../components/Alerts';
import { useAutenticacao } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const EXPERTISE_OPTIONS = [
  {
    id: 'web',
    label: 'Engenharia Web & Full-Stack',
    desc: 'React, Node.js, TypeScript, Next.js, APIs',
    icon: Code2,
  },
  {
    id: 'ai',
    label: 'Inteligência Artificial & Dados',
    desc: 'LLMs, Python, Machine Learning, Análise de Dados',
    icon: Cpu,
  },
  {
    id: 'security',
    label: 'Cibersegurança & Red Team',
    desc: 'Pentesting, Ethical Hacking, DevSecOps, Auditoria',
    icon: Shield,
  },
  {
    id: 'cloud',
    label: 'Cloud Computing & DevOps',
    desc: 'AWS, Docker, Kubernetes, CI/CD, Terraform',
    icon: Cloud,
  },
  {
    id: 'design',
    label: 'UI/UX Design & Produto',
    desc: 'Figma, Sistemas de Design, Prototipagem, Usabilidade',
    icon: Palette,
  },
  {
    id: 'business',
    label: 'Finanças, Negócios & Web3',
    desc: 'Gestão Tecnológica, Blockchain, Smart Contracts',
    icon: Coins,
  },
];
const EXPERIENCE_LEVELS = [
  {
    value: 2,
    label: '1 a 2 Anos',
    badge: 'Início de Carreira',
  },
  {
    value: 4,
    label: '3 a 5 Anos',
    badge: 'Recomendado',
  },
  {
    value: 8,
    label: '6 a 10 Anos',
    badge: 'Sénior / Especialista',
  },
  {
    value: 12,
    label: 'Mais de 10 Anos',
    badge: 'Veterano da Indústria',
  },
];

export const CandidatarFormadorPagina = () => {
  const { user: utilizador } = useAutenticacao();
  const { toast: aviso } = useAvisos();

  const [carregamento, definirCarregamento] = useState(true);
  const [submitting, definirSubmitting] = useState(false);
  const [candidatura, definirCandidatura] = useState(null);
  const [atualStep, definirAtualStep] = useState(1);
  const [formDados, definirFormDados] = useState({
    nomeCompleto: utilizador?.name || '',
    bio: utilizador?.bio || '',
    expertise: 'Engenharia Web & Full-Stack',
    anosExperiencia: 4,
    urlPortefolio: '',
    motivation: '',
    cursosPropostos: '',
    urlVideoExemplo: '',
    agreedTerms: false,
  });
  const carregarEstado = async () => {
    try {
      const resposta = await api
        .get('/formador/estado-candidatura')
        .then(({ data: dados }) => dados);
      if (resposta?.application) {
        definirCandidatura(resposta.application);
        // Recupera os dados da candidatura anterior para permitir a correção.
        if (resposta.application.status === 'REJECTED') {
          definirFormDados((anterior) => ({
            ...anterior,
            nomeCompleto: resposta.application.nomeCompleto || anterior.nomeCompleto,
            bio: resposta.application.bio || anterior.bio,
            expertise: resposta.application.expertise || anterior.expertise,
            anosExperiencia: resposta.application.anosExperiencia || anterior.anosExperiencia,
            urlPortefolio: resposta.application.urlPortefolio || anterior.urlPortefolio,
            motivation: resposta.application.motivation || anterior.motivation,
            cursosPropostos: resposta.application.cursosPropostos || anterior.cursosPropostos,
            urlVideoExemplo: resposta.application.urlVideoExemplo || anterior.urlVideoExemplo,
          }));
        }
      }
    } catch (erro) {
      console.error(erro);
    } finally {
      definirCarregamento(false);
    }
  };

  useEffect(() => {
    carregarEstado();
  }, []);

  const tratarAlterar = (evento) => {
    const { name: nome, value: valor, type, checked: selecionado } = evento.target;

    definirFormDados((anterior) => ({
      ...anterior,
      [nome]: type === 'checkbox' ? selecionado : valor,
    }));
  };

  const validarStep = (step) => {
    if (step === 1) {
      if (!formDados.nomeCompleto.trim() || formDados.nomeCompleto.trim().length < 3) {
        aviso({
          title: 'Nome Obrigatório',
          message: 'Indique o seu nome completo com pelo menos 3 caracteres.',
          type: 'error',
        });

        return false;
      }

      if (!formDados.bio.trim() || formDados.bio.trim().length < 20) {
        aviso({
          title: 'Biografia Curta',
          message: 'Descreva resumidamente o seu percurso profissional (mínimo 20 caracteres).',
          type: 'error',
        });

        return false;
      }
    }

    if (step === 2) {
      if (!formDados.expertise.trim()) {
        aviso({
          title: 'Área Obrigatória',
          message: 'Selecione ou indique a sua área principal de especialização.',
          type: 'error',
        });

        return false;
      }
    }

    if (step === 3) {
      if (!formDados.motivation.trim() || formDados.motivation.trim().length < 20) {
        aviso({
          title: 'Motivação Obrigatória',
          message: 'Partilhe a sua motivação para lecionar no NEXO (mínimo 20 caracteres).',
          type: 'error',
        });

        return false;
      }

      if (!formDados.cursosPropostos.trim() || formDados.cursosPropostos.trim().length < 30) {
        aviso({
          title: 'Proposta Incompleta',
          message:
            'Apresente os detalhes da proposta pedagógica (título do curso e tópicos previstos).',
          type: 'error',
        });

        return false;
      }
    }

    return true;
  };

  const seguinteStep = () => {
    if (validarStep(atualStep)) {
      definirAtualStep((anterior) => Math.min(4, anterior + 1));
      window.scrollTo({
        top: 120,
        behavior: 'smooth',
      });
    }
  };

  const anteriorStep = () => {
    definirAtualStep((anterior) => Math.max(1, anterior - 1));
    window.scrollTo({
      top: 120,
      behavior: 'smooth',
    });
  };

  const tratarSubmeter = async (evento) => {
    evento.preventDefault();
    if (!validarStep(1) || !validarStep(2) || !validarStep(3)) return;
    if (!formDados.agreedTerms) {
      aviso({
        title: 'Termo Pedagógico',
        message:
          'Por favor, assinale o compromisso de rigor pedagógico e ética da plataforma NEXO.',
        type: 'error',
      });

      return;
    }

    definirSubmitting(true);
    try {
      const resposta = await api
        .post('/formador/candidatar', formDados)
        .then(({ data: dados }) => dados);

      aviso({
        title: 'Inquérito Submetido!',
        message:
          resposta.message ||
          'O seu inquérito foi submetido com sucesso para análise do Conselho Pedagógico.',
        type: 'success',
      });
      definirCandidatura(resposta.application);
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (erro) {
      aviso({
        title: 'Falha ao Submeter',
        message: erro.message || 'Não foi possível submeter o inquérito. Tente novamente.',
        type: 'error',
      });
    } finally {
      definirSubmitting(false);
    }
  };

  if (carregamento) {
    return (
      <div className="apply-creator-panel">
        <div className="apply-creator-panel-2" />
        <span className="apply-creator-label">A carregar inquérito de candidatura...</span>
      </div>
    );
  }

  // Se já é Formador ou Administrador
  if (utilizador?.role === 'CREATOR' || utilizador?.role === 'ADMIN') {
    return (
      <div className="apply-creator-panel-3">
        <Cartao className="apply-creator-card">
          <div className="apply-creator-panel-4">
            <UserCheck className="apply-creator-user-check" />
          </div>
          <Distintivo
            size="md"
            variant="primary"
            className="apply-creator-badge"
          >
            Estatuto Ativo
          </Distintivo>
          <h2 className="apply-creator-heading">
            Já possui estatuto de{' '}
            {utilizador?.role === 'ADMIN' ? 'Administrador e Formador' : 'Formador NEXO'}
          </h2>
          <p className="apply-creator-description">
            A sua conta tem permissões completas de publicação de módulos, criação de salas de
            mentoria WebRTC e emissão de certificados oficiais.
          </p>
          <Link to="/formador">
            <Botao
              as="span"
              variant="primary"
              size="lg"
              className="apply-creator-button"
            >
              Aceder ao Painel do Criador
              <ArrowRight className="apply-creator-arrow-right" />
            </Botao>
          </Link>
        </Cartao>
      </div>
    );
  }

  // Se tem candidatura PENDENTE (Timeline Corporativa de Moderação)
  if (candidatura && candidatura.status === 'PENDING') {
    return (
      <div className="apply-creator-panel-5">
        <div className="apply-creator-panel-6">
          <div className="apply-creator-panel-7">
            <div className="apply-creator-panel-8">
              <Clock className="apply-creator-clock" />
            </div>
            <div>
              <span className="apply-creator-label-2">Em Análise do Conselho Pedagógico</span>
              <h2 className="apply-creator-heading-2">Inquérito Submetido com Sucesso</h2>
            </div>
          </div>

          <p className="apply-creator-description-2">
            O seu inquérito foi registado na plataforma. O Conselho Pedagógico da NEXO analisa a
            proposta metodológica, os tópicos dos cursos e os materiais de apresentação antes de
            libertar o acesso ao estúdio de publicação.
          </p>

          {/* Corporate 3-Step Process Timeline */}
          <div className="apply-creator-panel-9">
            {/* Step 1 */}
            <div className="apply-creator-panel-10">
              <div className="apply-creator-panel-11">
                <Check className="apply-creator-check" />
              </div>
              <h4 className="apply-creator-caption">1. Submissão Concluída</h4>
              <p className="apply-creator-description-3">Inquérito e materiais enviados</p>
              <span className="apply-creator-label-3">
                {new Date(candidatura.criadoEm || Date.now()).toLocaleDateString('pt-PT', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Step 2 */}
            <div className="apply-creator-panel-10">
              <div className="apply-creator-panel-12" />
              <h4 className="apply-creator-caption-2">2. Moderação Pedagógica em Curso</h4>
              <p className="apply-creator-description-3">
                Avaliação de qualidade curricular e didática
              </p>
              <p className="apply-creator-description-4">
                Tempo médio de homologação: 24 a 48 horas úteis.
              </p>
            </div>

            {/* Step 3 */}
            <div className="apply-creator-panel-10">
              <div className="apply-creator-panel-13" />
              <h4 className="apply-creator-caption-3">3. Ativação do Estúdio de Criador</h4>
              <p className="apply-creator-description-5">
                Libertação do painel de cursos, salas WebRTC e remuneração
              </p>
            </div>
          </div>

          {/* Submission Recap Summary Box */}
          <div className="apply-creator-panel-14">
            <div className="apply-creator-panel-15">
              <span className="apply-creator-label-4">Candidato:</span>
              <span className="apply-creator-label-5">{candidatura.nomeCompleto}</span>
            </div>
            <div className="apply-creator-panel-15">
              <span className="apply-creator-label-4">Área de Especialização:</span>
              <span className="apply-creator-label-6">{candidatura.expertise}</span>
            </div>
            <div className="apply-creator-panel-15">
              <span className="apply-creator-label-4">Experiência Indicada:</span>
              <span className="apply-creator-label-5">{candidatura.anosExperiencia} Anos</span>
            </div>
            <div>
              <span className="apply-creator-label-7">Cursos Previstos:</span>
              <p className="apply-creator-description-6">{candidatura.cursosPropostos}</p>
            </div>
          </div>

          <div className="apply-creator-panel-16">
            <Link to="/painel">
              <Botao
                as="span"
                variant="secondary"
                size="md"
                className="apply-creator-button-2"
              >
                Voltar ao Painel do Aluno
              </Botao>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Formulário Oficial Multi-Step
  return (
    <div className="apply-creator-panel-17">
      {/* Header */}
      <div className="apply-creator-panel-18">
        <h1 className="apply-creator-title">Inquérito de Candidatura a Criador</h1>
        <p className="apply-creator-description-7">
          Submeta o seu perfil e proposta de cursos para validação. Junte-se a uma rede de
          especialistas que ensinam tecnologia com rigor e prática em tempo real.
        </p>
      </div>

      {/* Parecer da candidatura e acesso à correção. */}
      {candidatura?.status === 'REJECTED' && (
        <div className="apply-creator-panel-20">
          <div className="apply-creator-panel-21">
            <AlertCircle className="apply-creator-alert-circle" />
          </div>
          <div>
            <h4 className="apply-creator-caption-4">Candidatura Anterior Necessita de Ajustes</h4>
            <p className="apply-creator-description-8">
              <strong>Parecer da Administração:</strong>{' '}
              {candidatura.parecerAdministracao ||
                'Ajuste a ementa dos cursos propostos e reenvie o inquérito para nova apreciação.'}
            </p>
            <p className="apply-creator-description-9">
              Os seus dados anteriores foram recuperados abaixo para facilitar a retificação.
            </p>
          </div>
        </div>
      )}

      {/* Stepper Navigation Bar */}
      <div className="apply-creator-panel-22">
        <div className="apply-creator-panel-23">
          {[
            {
              step: 1,
              title: 'Identificação',
              desc: 'Dados Pessoais',
            },
            {
              step: 2,
              title: 'Especialidade',
              desc: 'Domínio Técnico',
            },
            {
              step: 3,
              title: 'Pedagogia',
              desc: 'Proposta de Cursos',
            },
            {
              step: 4,
              title: 'Revisão',
              desc: 'Materiais & Envio',
            },
          ].map((s) => {
            const isAtivo = atualStep === s.step;
            const isConcluido = atualStep > s.step;

            return (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  if (s.step < atualStep) definirAtualStep(s.step);
                }}
                disabled={s.step > atualStep}
                className={`apply-creator-button-3 ${isAtivo ? 'apply-creator-button-4' : isConcluido ? 'apply-creator-button-5' : 'apply-creator-button-6'}`}
              >
                <div
                  className={`apply-creator-panel-24 ${isConcluido ? 'apply-creator-panel-25' : isAtivo ? 'apply-creator-panel-26' : 'apply-creator-panel-27'}`}
                >
                  {isConcluido ? <Check className="apply-creator-check-2" /> : s.step}
                </div>
                <div className="apply-creator-panel-28">
                  <p
                    className={`apply-creator-description-10 ${isAtivo ? 'apply-creator-description-11' : 'apply-creator-description-12'}`}
                  >
                    {s.title}
                  </p>
                  <p className="apply-creator-description-13">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wizard Form Cartao */}
      <Cartao className="apply-creator-card-2">
        <form onSubmit={tratarSubmeter}>
          {/* STEP 1: IDENTIFICAÇÃO & PERFIL */}
          {atualStep === 1 && (
            <div className="apply-creator-panel-29">
              <div className="apply-creator-panel-30">
                <h3 className="apply-creator-subheading">
                  Passo 1: Identificação & Perfil Profissional
                </h3>
                <p className="apply-creator-description-14">
                  Estes dados serão utilizados para compor a ficha técnica de formador na
                  plataforma.
                </p>
              </div>

              <div className="apply-creator-panel-31">
                <div>
                  <label className="apply-creator-field-label">Nome Completo Profissional *</label>
                  <input
                    type="text"
                    name="nomeCompleto"
                    required
                    value={formDados.nomeCompleto}
                    onChange={tratarAlterar}
                    placeholder="Ex.: Engenheiro Pedro Silva"
                    className="apply-creator-field"
                  />
                </div>

                <div>
                  <label className="apply-creator-field-label">
                    Biografia Executiva & Trajetória *
                  </label>
                  <textarea
                    name="bio"
                    required
                    rows={4}
                    value={formDados.bio}
                    onChange={tratarAlterar}
                    placeholder="Resuma a sua formação académica, certificações, empresas onde trabalhou ou projetos de engenharia de destaque."
                    className="apply-creator-textarea"
                  />
                  <div className="apply-creator-panel-32">
                    <span>Mínimo recomendado: 20 caracteres</span>
                    <span>{formDados.bio.length} caracteres</span>
                  </div>
                </div>

                <div>
                  <label className="apply-creator-field-label">
                    Portfólio Oficial / LinkedIn / GitHub
                  </label>
                  <input
                    type="url"
                    name="urlPortefolio"
                    value={formDados.urlPortefolio}
                    onChange={tratarAlterar}
                    placeholder="https://linkedin.com/in/seunome ou https://github.com/seunome"
                    className="apply-creator-field-2"
                  />
                  <span className="apply-creator-label-8">
                    Facilita a validação do seu histórico de código e experiência pelo Conselho.
                  </span>
                </div>
              </div>

              <div className="apply-creator-panel-33">
                <Botao
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={seguinteStep}
                  className="apply-creator-button-7"
                >
                  Seguinte: Especialidade Técnica
                  <ArrowRight className="apply-creator-arrow-right" />
                </Botao>
              </div>
            </div>
          )}

          {/* STEP 2: ESPECIALIDADE & ANOS DE EXPERIÊNCIA */}
          {atualStep === 2 && (
            <div className="apply-creator-panel-29">
              <div className="apply-creator-panel-30">
                <h3 className="apply-creator-subheading">
                  Passo 2: Domínio Técnico & Anos de Carreira
                </h3>
                <p className="apply-creator-description-14">
                  Selecione o ecossistema principal em que pretende lecionar e estruturar cursos.
                </p>
              </div>

              {/* Visual Category Selection Grid */}
              <div>
                <label className="apply-creator-field-label-2">Área de Ensino *</label>
                <div className="apply-creator-panel-34">
                  {EXPERTISE_OPTIONS.map((opt) => {
                    const isSelecionado = formDados.expertise === opt.label;
                    const Icon = opt.icon;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          definirFormDados((anterior) => ({
                            ...anterior,
                            expertise: opt.label,
                          }))
                        }
                        className={`apply-creator-button-8 ${isSelecionado ? 'apply-creator-button-9' : 'apply-creator-button-10'}`}
                      >
                        <div
                          className={`apply-creator-panel-35 ${isSelecionado ? 'apply-creator-panel-36' : 'apply-creator-panel-27'}`}
                        >
                          <Icon className="apply-creator-alert-circle" />
                        </div>
                        <div className="apply-creator-panel-37">
                          <p className="apply-creator-description-15">{opt.label}</p>
                          <p className="apply-creator-description-16">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience Level Pill Selector */}
              <div>
                <label className="apply-creator-field-label-2">
                  Tempo de Experiência Prática no Mercado *
                </label>
                <div className="apply-creator-panel-38">
                  {EXPERIENCE_LEVELS.map((lvl) => {
                    const isSelecionado = Number(formDados.anosExperiencia) === lvl.value;

                    return (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() =>
                          definirFormDados((anterior) => ({
                            ...anterior,
                            anosExperiencia: lvl.value,
                          }))
                        }
                        className={`apply-creator-button-11 ${isSelecionado ? 'apply-creator-button-12' : 'apply-creator-button-13'}`}
                      >
                        <div className="apply-creator-panel-39">{lvl.label}</div>
                        <span className="apply-creator-label-9">{lvl.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="apply-creator-panel-40">
                <Botao
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={anteriorStep}
                  className="apply-creator-button-2"
                >
                  <ArrowLeft className="apply-creator-arrow-left" />
                  Anterior
                </Botao>
                <Botao
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={seguinteStep}
                  className="apply-creator-button-7"
                >
                  Seguinte: Proposta Curricular
                  <ArrowRight className="apply-creator-arrow-right" />
                </Botao>
              </div>
            </div>
          )}

          {/* STEP 3: PROPOSTA PEDAGÓGICA & CURSOS */}
          {atualStep === 3 && (
            <div className="apply-creator-panel-29">
              <div className="apply-creator-panel-30">
                <h3 className="apply-creator-subheading">
                  Passo 3: Proposta Pedagógica & Estrutura de Aulas
                </h3>
                <p className="apply-creator-description-14">
                  Defina a metodologia de ensino e o primeiro curso prático que planeia lecionar.
                </p>
              </div>

              <div className="apply-creator-panel-31">
                <div>
                  <label className="apply-creator-field-label">
                    Metodologia & Motivação: Porque quer ensinar no NEXO? *
                  </label>
                  <textarea
                    name="motivation"
                    required
                    minLength={20}
                    rows={3}
                    value={formDados.motivation}
                    onChange={tratarAlterar}
                    placeholder="Explique como pretende estruturar os desafios práticos, o acompanhamento em salas ao vivo e a metodologia 'aprender fazendo'."
                    className="apply-creator-textarea"
                  />
                  <p className="apply-creator-description-17">
                    {formDados.motivation.trim().length}/20 caracteres mínimos
                  </p>
                </div>

                <div>
                  <label className="apply-creator-field-label">
                    Proposta Detalhada do Primeiro Curso (Ementa & Módulos) *
                  </label>
                  <textarea
                    name="cursosPropostos"
                    required
                    minLength={30}
                    rows={6}
                    value={formDados.cursosPropostos}
                    onChange={tratarAlterar}
                    placeholder={`Exemplo estruturado:
1. Título: Domínio Avançado de Microsserviços e WebRTC
2. Nível: Intermédio a Avançado
3. Módulos propostos:
   - Módulo 1: Arquitetura de Comunicação em Tempo Real
   - Módulo 2: Implementação de Salas WebRTC P2P e SFU
   - Módulo 3: Projeto Prático de Fim de Curso e Certificação`}
                    className="apply-creator-textarea-2"
                  />
                  <span className="apply-creator-label-8">
                    Uma ementa clara com módulos bem definidos acelera a homologação direta pelo
                    Administrador.
                  </span>
                  <p className="apply-creator-description-17">
                    {formDados.cursosPropostos.trim().length}/30 caracteres mínimos
                  </p>
                </div>
              </div>

              <div className="apply-creator-panel-40">
                <Botao
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={anteriorStep}
                  className="apply-creator-button-2"
                >
                  <ArrowLeft className="apply-creator-arrow-left" />
                  Anterior
                </Botao>
                <Botao
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={seguinteStep}
                  className="apply-creator-button-7"
                >
                  Seguinte: Materiais & Revisão
                  <ArrowRight className="apply-creator-arrow-right" />
                </Botao>
              </div>
            </div>
          )}

          {/* STEP 4: VÍDEO PILOTO, REVISÃO & SUBMISSÃO */}
          {atualStep === 4 && (
            <div className="apply-creator-panel-29">
              <div className="apply-creator-panel-30">
                <h3 className="apply-creator-subheading">
                  Passo 4: Materiais Piloto, Compromisso & Submissão
                </h3>
                <p className="apply-creator-description-14">
                  Reveja os dados submetidos e confirme o termo de compromisso pedagógico.
                </p>
              </div>

              <div className="apply-creator-panel-41">
                <div>
                  <label className="apply-creator-field-label">
                    Vídeo Piloto ou Gravação Demonstrativa (Opcional)
                  </label>
                  <input
                    type="url"
                    name="urlVideoExemplo"
                    value={formDados.urlVideoExemplo}
                    onChange={tratarAlterar}
                    placeholder="URL de Loom, YouTube (não listado), Vimeo ou Google Drive"
                    className="apply-creator-field-2"
                  />
                  <span className="apply-creator-label-8">
                    Um vídeo de 3 minutos a demonstrar a sua dicção e capacidade explicativa confere
                    prioridade máxima na aprovação.
                  </span>
                </div>

                {/* Consolidated Review Box */}
                <div className="apply-creator-panel-42">
                  <div className="apply-creator-panel-43">Resumo do Inquérito a Enviar</div>
                  <div className="apply-creator-panel-44">
                    <span className="apply-creator-label-4">Nome:</span>
                    <span className="apply-creator-label-5">{formDados.nomeCompleto}</span>
                  </div>
                  <div className="apply-creator-panel-44">
                    <span className="apply-creator-label-4">Área:</span>
                    <span className="apply-creator-label-6">{formDados.expertise}</span>
                  </div>
                  <div className="apply-creator-panel-44">
                    <span className="apply-creator-label-4">Experiência:</span>
                    <span className="apply-creator-label-5">{formDados.anosExperiencia} Anos</span>
                  </div>
                  <div>
                    <span className="apply-creator-label-7">Perfil profissional:</span>
                    <p className="apply-creator-description-18">{formDados.bio}</p>
                  </div>
                  <div>
                    <span className="apply-creator-label-7">Motivação e metodologia:</span>
                    <p className="apply-creator-description-18">{formDados.motivation}</p>
                  </div>
                  <div>
                    <span className="apply-creator-label-7">Ementa e módulos propostos:</span>
                    <p className="apply-creator-description-19">{formDados.cursosPropostos}</p>
                  </div>
                  {formDados.urlPortefolio && (
                    <div className="apply-creator-panel-45">
                      <span className="apply-creator-label-4">Portfólio: </span>
                      <span className="apply-creator-label-10">{formDados.urlPortefolio}</span>
                    </div>
                  )}
                  {formDados.urlVideoExemplo && (
                    <div className="apply-creator-panel-45">
                      <span className="apply-creator-label-4">Vídeo demonstrativo: </span>
                      <span className="apply-creator-label-10">{formDados.urlVideoExemplo}</span>
                    </div>
                  )}
                </div>

                {/* Code of Ethics Agreement */}
                <label className="apply-creator-field-label-3">
                  <input
                    type="checkbox"
                    name="agreedTerms"
                    checked={formDados.agreedTerms}
                    onChange={tratarAlterar}
                    className="apply-creator-field-3"
                  />
                  <div className="apply-creator-panel-46">
                    <strong className="apply-creator-strong">
                      Compromisso de Excelência Pedagógica NEXO
                    </strong>
                    Comprometo-me a fornecer conteúdos técnicos rigorosos, respeitar a propriedade
                    intelectual, manter conduta ética e prestar suporte atempado aos alunos nos
                    canais da turma.
                  </div>
                </label>
              </div>

              <div className="apply-creator-panel-47">
                <Botao
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={anteriorStep}
                  className="apply-creator-button-2"
                >
                  <ArrowLeft className="apply-creator-arrow-left" />
                  Anterior
                </Botao>
                <Botao
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting}
                  className="apply-creator-button-14"
                >
                  {submitting ? 'A Submeter Inquérito...' : 'Submeter Inquérito Oficial'}
                  <Send className="apply-creator-arrow-right" />
                </Botao>
              </div>
            </div>
          )}
        </form>
      </Cartao>
    </div>
  );
};

export default CandidatarFormadorPagina;
