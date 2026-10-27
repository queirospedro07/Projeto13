import { podeGerirEsteCurso, temInscricaoCurso } from '../../utilitarios/permissoes';
import './CursoDetalhesPagina.css';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LuStar as Star,
  LuClock as Clock,
  LuUsers as Users,
  LuCircleCheck as CheckCircle2,
  LuPlay as Play,
  LuChevronDown as ChevronDown,
  LuChevronUp as ChevronUp,
  LuSparkles as Sparkles,
  LuArrowRight as ArrowRight,
  LuBookOpen as BookOpen,
  LuAward as Award,
  LuArrowLeft as ArrowLeft,
  LuLayers as Layers,
} from 'react-icons/lu';
import { Botao } from '../../componentes/Botao';
import { Distintivo } from '../../componentes/Distintivo';
import { Avatar } from '../../componentes/Avatar';
import { CursoInscreverJanela } from '../../componentes/CursoInscreverJanela';
import { SEO } from '../../componentes/SEO';
import { useAutenticacao } from '../../contextos/ContextoAutenticacao';
import { useAvisos } from '../../componentes/Avisos';

import { api } from '../../servicos/api';
import { formatarCursoPreco, formatarCategoria } from '../../utilitarios/formatacao';

export const CursoDetalhesPagina = () => {
  const { id } = useParams();
  const { user: utilizador } = useAutenticacao();
  const { toast: aviso } = useAvisos();

  const [curso, definirCurso] = useState(null);
  const [carregamento, definirCarregamento] = useState(true);
  const [abrirModuloIndice, definirAbrirModuloIndice] = useState(null);
  const [mostrarInscreverJanela, definirMostrarInscreverJanela] = useState(false);
  const [ativoSeparador, definirAtivoSeparador] = useState(() => {
    try {
      const guardado = localStorage.getItem('nexo_course_details_tab');

      return guardado && guardado !== 'resources' ? guardado : 'overview';
    } catch {
      return 'overview';
    }
  });
  const tratarSelecionarSeparador = (separadorId) => {
    definirAtivoSeparador(separadorId);
    try {
      localStorage.setItem('nexo_course_details_tab', separadorId);
    } catch {}
  };

  const isInstructorOfThisCurso = Boolean(
    utilizador &&
    (utilizador.id === curso?.creator?.id ||
      utilizador.id === curso?.idFormador ||
      utilizador.id === curso?.instructorId),
  );
  const isFormadorOrAdministracao = podeGerirEsteCurso(utilizador, curso);
  const outcomes = Array.isArray(curso?.learningOutcomes) ? curso.learningOutcomes : [];
  const reqs = Array.isArray(curso?.requirements) ? curso.requirements : [];
  const [reverClassificacao, definirReverClassificacao] = useState(5);
  const [reverComentario, definirReverComentario] = useState('');
  const [isSubmittingRever, definirIsSubmittingRever] = useState(false);
  const carregarCurso = async () => {
    if (!id) return;
    try {
      let dados = null;
      try {
        dados = await api.get(`/cursos/${id}`).then(({ data: dados2 }) => dados2);
      } catch {
        try {
          const espacoDados = await api.get(`/espacos/${id}`).then(({ data: dados2 }) => dados2);
          if (espacoDados) {
            dados = {
              id: espacoDados.id,
              title: espacoDados.name,
              slug: espacoDados.slug,
              description: espacoDados.description,
              urlMiniatura: espacoDados.urlCapa || espacoDados.urlIcone,
              urlCapa: espacoDados.urlCapa,
              category: espacoDados.category || 'Geral',
              difficulty: 'Iniciante',
              duracaoHoras: 10,
              language: 'Português (Portugal)',
              price: 0,
              eGratuito: true,
              creator: espacoDados.owner,
              studentsCount: espacoDados.membersCount || 1,
              modules: [],
              space: espacoDados,
            };
          }
        } catch (evento2) {
          console.error(evento2);
        }
      }

      definirCurso(dados);
    } catch (erro) {
      console.error(erro);
    } finally {
      definirCarregamento(false);
    }
  };

  useEffect(() => {
    carregarCurso();
  }, [id, utilizador?.id]);

  const tratarInscreverSucesso = () => {
    definirMostrarInscreverJanela(false);
    definirCurso((anterior) =>
      anterior
        ? {
            ...anterior,
            isEnrolled: true,
            isMember: true,
          }
        : anterior,
    );
    window.dispatchEvent(new Event('nexo_courses_visibility_changed'));
    carregarCurso();
  };

  const tratarReverSubmeter = async (evento) => {
    evento.preventDefault();
    if (!reverComentario.trim()) return;
    definirIsSubmittingRever(true);
    try {
      await api
        .post(`/cursos/${curso.id}/avaliacoes`, {
          rating: reverClassificacao,
          comment: reverComentario,
        })
        .then(({ data: dados }) => dados);
      aviso({
        title: 'Avaliação Registada',
        message: 'Obrigado pela sua contribuição pedagógica!',
        type: 'success',
      });
      definirReverComentario('');
      carregarCurso();
    } catch (erro) {
      aviso({
        title: 'Erro ao avaliar',
        message: erro.message || 'Não foi possível publicar a sua avaliação.',
        type: 'error',
      });
    } finally {
      definirIsSubmittingRever(false);
    }
  };

  if (carregamento) {
    return (
      <div className="course-details-panel">
        <div className="course-details-panel-2" />
        <p className="course-details-description">A carregar os detalhes do curso...</p>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="course-details-panel-3">
        <h2 className="course-details-heading">Curso Não Encontrado</h2>
        <p className="course-details-description-2">
          O curso solicitado não existe ou foi temporariamente arquivado.
        </p>
        <Link to="/explorar">
          <Botao
            as="span"
            variant="secondary"
            size="md"
            className="course-details-button"
          >
            Explorar Outros Cursos
          </Botao>
        </Link>
      </div>
    );
  }

  const isEnrolled = temInscricaoCurso(curso);
  const utilizadorProgresso = Math.round(
    curso?.userProgress ?? curso?.userEnrollment?.percentagemProgresso ?? 0,
  );
  const totalAulas = (curso.modules || []).reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

  const dificuldadeMap = {
    Beginner: 'Iniciante',
    Intermediate: 'Intermédio',
    Advanced: 'Avançado',
  };

  return (
    <>
      <SEO
        title={`${curso.title} — Curso na NEXO`}
        description={
          curso.description ||
          `Aprenda ${curso.title} na plataforma NEXO com aulas práticas, mentoria WebRTC e certificado verificado.`
        }
        canonical={`/cursos/${curso.id}`}
        ogImage={curso.urlMiniatura || '/hero-showcase.jpg'}
      />

      <div className="course-details-panel-4">
        {/* Breadcrumb & Voltar */}
        <div className="course-details-panel-5">
          <div className="course-details-panel-6">
            <Link
              to="/explorar"
              className="course-details-link"
            >
              <ArrowLeft className="course-details-arrow-left" />
              <span>Catálogo de Cursos</span>
            </Link>
            <span>/</span>
            <span className="course-details-label">{curso.title}</span>
          </div>
        </div>

        {/* Hero / Cartao Principal de Apresentação */}
        <div className="course-details-panel-7">
          <div className="course-details-panel-8">
            {/* Informações Centrais */}
            <div className="course-details-panel-9">
              <div className="course-details-panel-10">
                <span className="course-details-label-2">{formatarCategoria(curso.category)}</span>
                <span className="course-details-label-3">
                  Nível {dificuldadeMap[curso.difficulty] || curso.difficulty || 'Geral'}
                </span>
                <span className="course-details-label-4">
                  • {curso.language || 'Português (pt-PT)'}
                </span>
              </div>

              <h1 className="course-details-title">{curso.title}</h1>

              <p className="course-details-description-3">{curso.description}</p>

              {/* Quick Metrics Bar */}
              <div className="course-details-panel-11">
                {curso.reviews && curso.reviews.length > 0 ? (
                  <span className="course-details-label-5">
                    <Star className="course-details-star" />
                    {(
                      curso.reviews.reduce((acc, r) => acc + (r.rating || 5), 0) /
                      curso.reviews.length
                    ).toFixed(1)}{' '}
                    ({curso.reviews.length}{' '}
                    {curso.reviews.length === 1 ? 'avaliação' : 'avaliações'})
                  </span>
                ) : (
                  <span className="course-details-label-6">
                    <Star className="course-details-star-2" />
                    <span>Sem avaliações</span>
                  </span>
                )}
                <span className="course-details-label-7">•</span>
                <span className="course-details-label-8">
                  <Users className="course-details-users" />
                  {curso.studentsCount || 0} alunos inscritos
                </span>
                <span className="course-details-label-7">•</span>
                <span className="course-details-label-8">
                  <Clock className="course-details-users" />
                  {curso.duracaoHoras || 12} horas de carga letiva
                </span>
                <span className="course-details-label-7">•</span>
                <span className="course-details-label-8">
                  <Layers className="course-details-users" />
                  {curso.modules?.length || 0} módulos ({totalAulas} aulas)
                </span>
              </div>

              {/* Formador */}
              <Link
                to={`/perfil/${curso.creator?.username || curso.creator?.id || ''}`}
                className="course-details-link-2 group/instructor"
                title={
                  curso.creator?.name
                    ? `Ver perfil do formador ${curso.creator.name}`
                    : 'Ver perfil do formador'
                }
              >
                <Avatar
                  src={curso.creator?.urlAvatar}
                  name={curso.creator?.name || 'Formador'}
                  size="lg"
                />
                <div>
                  <div className="course-details-panel-6">
                    <span className="course-details-label-9">Formador Oficial</span>
                    <Distintivo
                      variant="outline"
                      size="sm"
                    >
                      Verificado
                    </Distintivo>
                  </div>
                  <p className="course-details-description-4">
                    {curso.creator?.name || 'Especialista Convidado'}
                  </p>
                  <p className="course-details-description-5">
                    {curso.creator?.bio ||
                      'Profissional especialista da indústria e instrutor oficial na NEXO.'}
                  </p>
                </div>
              </Link>
            </div>

            {/* Cartão de Aquisição / Acesso Rápido Lateral */}
            <div className="course-details-panel-12">
              <div className="course-details-panel-13">
                {/* Media Thumbnail (Apenas Foto) */}
                <div className="course-details-panel-14">
                  <img
                    src={curso.urlCapa || curso.urlMiniatura || '/images/curso-sem-capa.svg'}
                    alt={curso.title}
                    className="course-details-image course-details-dynamic-1"
                    style={{
                      '--course-details-object-position':
                        curso.posicaoCapa || curso.thumbnailPosition || 'center',
                    }}
                  />
                </div>

                {/* Corpo de Ações */}
                <div className="course-details-panel-15">
                  <div className="course-details-panel-16">
                    {isFormadorOrAdministracao ? (
                      <div className="course-details-panel-17">
                        <span className="course-details-label-10">
                          <Sparkles className="course-details-sparkles" />
                          {isInstructorOfThisCurso
                            ? 'Acesso de Formador (Autor)'
                            : utilizador?.role === 'ADMIN'
                              ? 'Acesso de Administrador'
                              : 'Acesso de Formador'}
                        </span>
                        <span className="course-details-label-11">
                          Acesso de gestão deste curso
                        </span>
                      </div>
                    ) : isEnrolled ? (
                      <div className="course-details-panel-17">
                        <span className="course-details-label-12">
                          <CheckCircle2 className="course-details-check-circle2" />
                          Já estou neste curso
                        </span>
                        <span className="course-details-label-11">
                          Progresso: {utilizadorProgresso}% concluído
                        </span>
                      </div>
                    ) : (
                      <div className="course-details-panel-18">
                        <span className="course-details-label-13">{formatarCursoPreco(curso)}</span>
                        {!curso.eGratuito &&
                          Number(curso.precoReferencia) > Number(curso.price) && (
                            <del className="curso-preco-anterior">
                              {formatarCursoPreco({ ...curso, price: curso.precoReferencia })}
                            </del>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  {isFormadorOrAdministracao ? (
                    <div className="course-details-panel-19">
                      <Link
                        to={`/aprender/${curso.id}`}
                        className="course-details-link-3 course-details-button-2"
                      >
                        <Play className="course-details-play" />
                        <span>Abrir curso</span>
                        <ArrowRight className="course-details-arrow-right" />
                      </Link>

                      <Link
                        to={`/formador/cursos/${curso.id}/editar`}
                        className="course-details-link-3 course-details-button-3"
                      >
                        <Sparkles className="course-details-sparkles" />
                        <span>Gerir curso</span>
                      </Link>
                    </div>
                  ) : isEnrolled ? (
                    <div className="course-details-panel-19">
                      <Link
                        to={`/aprender/${curso.id}`}
                        className="course-details-link-3 course-details-button-4"
                      >
                        <CheckCircle2 className="course-details-check-circle2-2" />
                        <span>Já estou no curso • Continuar Aulas ({utilizadorProgresso}%)</span>
                        <ArrowRight className="course-details-arrow-right" />
                      </Link>

                      {isFormadorOrAdministracao && (
                        <Link
                          to={`/formador/cursos/${curso.id}/editar`}
                          className="course-details-link-3 course-details-button-3"
                        >
                          <Sparkles className="course-details-sparkles" />
                          <span>Editar este Curso no Estúdio</span>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="course-details-panel-19">
                      <button
                        onClick={() => definirMostrarInscreverJanela(true)}
                        className="course-details-button-5"
                      >
                        <span>
                          {curso.eGratuito
                            ? 'Entrar no curso gratuitamente'
                            : `Entrar no curso • ${formatarCursoPreco(curso)}`}
                        </span>
                        <ArrowRight className="course-details-arrow-right-2" />
                      </button>

                      {isFormadorOrAdministracao && (
                        <Link
                          to={`/formador/cursos/${curso.id}/editar`}
                          className="course-details-link-3 course-details-button-6"
                        >
                          <Sparkles className="course-details-sparkles-2" />
                          <span>Editar este Curso no Estúdio</span>
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Vantagens incluídas */}
                  <div className="course-details-panel-20">
                    <div className="course-details-panel-21">
                      <CheckCircle2 className="course-details-check-circle2-3" />
                      <span>Acesso vitalício ao currículo e atualizações futuras</span>
                    </div>
                    <div className="course-details-panel-21">
                      <CheckCircle2 className="course-details-check-circle2-3" />
                      <span>Questionários práticos e desafios de código integrados</span>
                    </div>
                    <div className="course-details-panel-21">
                      <CheckCircle2 className="course-details-check-circle2-3" />
                      <span>Certificado oficial autenticado após 100% de conclusão</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navegação de Separadores / Tabs */}
        <div className="course-details-panel-22 no-scrollbar">
          {[
            {
              id: 'overview',
              label: 'Visão Geral & Programa',
              icon: BookOpen,
            },
            {
              id: 'curriculum',
              label: `Currículo (${curso.modules?.length || 0} módulos)`,
              icon: Layers,
            },
            {
              id: 'reviews',
              label: `Avaliações (${curso.reviews?.length || 0})`,
              icon: Star,
            },
          ].map((separador) => {
            const Icon = separador.icon;
            const isAtivo = ativoSeparador === separador.id;

            return (
              <button
                key={separador.id}
                onClick={() => tratarSelecionarSeparador(separador.id)}
                className={`course-details-button-7 ${isAtivo ? 'course-details-button-8' : 'course-details-button-9'}`}
              >
                <Icon className="course-details-arrow-right-2" />
                <span>{separador.label}</span>
              </button>
            );
          })}
        </div>

        {/* Conteúdo dos Separadores */}
        <div>
          {/* 1. VISÃO GERAL */}
          {ativoSeparador === 'overview' && (
            <div className="course-details-panel-23">
              <div className="course-details-panel-24">
                {/* Sobre o Curso */}
                <div className="course-details-panel-25">
                  <h3 className="course-details-subheading">O que é este Curso?</h3>
                  <p className="course-details-description-6">{curso.description}</p>
                </div>

                {/* O que vai aprender */}
                <div className="course-details-panel-26">
                  <h4 className="course-details-caption">
                    <Sparkles className="course-details-sparkles-3" />
                    Competências que vai dominar:
                  </h4>
                  <div className="course-details-panel-27">
                    {outcomes.length === 0 && (
                      <p>O formador ainda não definiu os objetivos deste curso.</p>
                    )}
                    {outcomes.map((item, idx) => (
                      <div
                        key={idx}
                        className="course-details-panel-28 subtle-shadow"
                      >
                        <CheckCircle2 className="course-details-check-circle2-4" />
                        <span className="course-details-label-15">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requisitos */}
                <div className="course-details-panel-25">
                  <h4 className="course-details-caption-2">Requisitos e Pré-requisitos</h4>
                  <ul className="course-details-list">
                    {reqs.length === 0 && <li>Sem requisitos indicados pelo formador.</li>}
                    {reqs.map((rItem, idx) => (
                      <li
                        key={idx}
                        className="course-details-list-item"
                      >
                        {rItem}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Coluna Lateral da Visão Geral */}
              <div className="course-details-panel-29">
                {/* Certificado de Conclusão */}
                <div className="course-details-panel-30">
                  <div className="course-details-panel-31">
                    <Award className="course-details-award" />
                  </div>
                  <div>
                    <h4 className="course-details-caption-3">Certificado de Mérito NEXO</h4>
                    <p className="course-details-description-7">
                      Conclua 100% das aulas e quizzes do curso para emitir o seu certificado
                      oficial com código hash criptográfico de validação pública.
                    </p>
                  </div>
                </div>

                {/* Espaço do Servidor */}
                {curso.space && (
                  <div className="course-details-panel-32">
                    <div className="course-details-panel-33">
                      <Avatar
                        src={curso.space.logoUrl || curso.space.urlIcone}
                        name={curso.space.name}
                        size="md"
                      />
                      <div>
                        <h4 className="course-details-caption-4">{curso.space.name}</h4>
                        <p className="course-details-description-8">Turma Dedicada</p>
                      </div>
                    </div>
                    <p className="course-details-description-9">
                      {curso.space.description ||
                        curso.space.tagline ||
                        'Canais de voz, partilha de ecrã e salas de estudo dedicadas a este curso.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. CURRÍCULO DETALHADO */}
          {ativoSeparador === 'curriculum' && (
            <div className="course-details-panel-34">
              <div className="course-details-panel-35">
                <span className="course-details-label-16">
                  {curso.modules?.length || 0} módulos no total • {totalAulas} aulas programadas
                </span>
                <button
                  onClick={() => definirAbrirModuloIndice(abrirModuloIndice === -1 ? null : -1)}
                  className="course-details-button-10"
                >
                  {abrirModuloIndice === -1 ? 'Recolher Todos' : 'Expandir Todos'}
                </button>
              </div>

              {!curso.modules || curso.modules.length === 0 ? (
                <div className="course-details-panel-36">
                  <BookOpen className="course-details-book-open" />
                  <h4 className="course-details-caption-5">Estrutura Curricular em Atualização</h4>
                  <p className="course-details-description-10">
                    O formador está a finalizar os ficheiros deste currículo.
                  </p>
                </div>
              ) : (
                curso.modules.map((mod, indice) => {
                  const isAbrir = abrirModuloIndice === indice || abrirModuloIndice === -1;
                  const modDuracao = (mod.lessons || []).reduce(
                    (acc, l) => acc + (l.duracaoMinutos || 10),
                    0,
                  );

                  return (
                    <div
                      key={mod.id || indice}
                      className="course-details-panel-37"
                    >
                      <button
                        onClick={() =>
                          definirAbrirModuloIndice(abrirModuloIndice === indice ? null : indice)
                        }
                        className="course-details-button-11"
                      >
                        <div className="course-details-panel-38">
                          <div className="course-details-panel-39">{indice + 1}</div>
                          <div className="course-details-panel-40">
                            <h4 className="course-details-caption-6">{mod.title}</h4>
                            {mod.description && (
                              <p className="course-details-description-11">{mod.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="course-details-panel-41">
                          <span className="course-details-label-17">
                            {mod.lessons?.length || 0} aulas • {modDuracao}m
                          </span>
                          {isAbrir ? (
                            <ChevronUp className="course-details-chevron-up" />
                          ) : (
                            <ChevronDown className="course-details-chevron-up" />
                          )}
                        </div>
                      </button>

                      {isAbrir && (
                        <div className="course-details-panel-42">
                          {mod.lessons?.map((les, lIdx) => (
                            <div
                              key={les.id || lIdx}
                              className="course-details-panel-43"
                            >
                              <div className="course-details-panel-38">
                                <div className="course-details-panel-44">{lIdx + 1}</div>
                                <div className="course-details-panel-40">
                                  <span className="course-details-label-18">{les.title}</span>
                                  <div className="course-details-panel-45">
                                    {les.type === 'quiz' ? (
                                      <span className="course-details-label-19">
                                        Questionario Avaliativo
                                      </span>
                                    ) : les.type === 'code' ? (
                                      <span className="course-details-label-20">
                                        Desafio Prático de Código
                                      </span>
                                    ) : (
                                      <span className="course-details-label-21">
                                        Aula em Vídeo HD
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <span className="course-details-label-22">
                                {les.duracaoMinutos || 12} min
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 3. AVALIAÇÕES */}
          {ativoSeparador === 'reviews' && (
            <div className="course-details-panel-46">
              {utilizador ? (
                <div className="course-details-panel-47">
                  <h4 className="course-details-caption-7">Publicar a sua Avaliação</h4>
                  <form
                    onSubmit={tratarReverSubmeter}
                    className="course-details-form"
                  >
                    <div className="course-details-panel-33">
                      <span className="course-details-label-23">Classificação:</span>
                      <div className="course-details-panel-48">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => definirReverClassificacao(star)}
                            className="course-details-button-12"
                          >
                            <Star
                              className={`course-details-star-3 ${star <= reverClassificacao ? 'course-details-star-4' : 'course-details-star-5'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Partilhe a sua experiência de aprendizagem sobre este curso..."
                      value={reverComentario}
                      onChange={(evento) => definirReverComentario(evento.target.value)}
                      className="course-details-textarea"
                    />
                    <Botao
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isSubmittingRever}
                      className="course-details-button-13"
                    >
                      Submeter Avaliação
                    </Botao>
                  </form>
                </div>
              ) : (
                <div className="course-details-panel-49">
                  <p className="course-details-description-12">
                    Inicie sessão para poder partilhar a sua avaliação sobre este curso.
                  </p>
                  <Link to="/entrar">
                    <Botao
                      as="span"
                      variant="outline"
                      size="sm"
                      className="course-details-button"
                    >
                      Iniciar Sessão
                    </Botao>
                  </Link>
                </div>
              )}

              <div className="course-details-form">
                {!curso.reviews || curso.reviews.length === 0 ? (
                  <div className="course-details-panel-50">
                    Ainda não existem avaliações para este curso. Seja o primeiro a partilhar a sua
                    opinião!
                  </div>
                ) : (
                  curso.reviews.map((r) => (
                    <div
                      key={r.id}
                      className="course-details-panel-32"
                    >
                      <div className="course-details-panel-16">
                        <div className="course-details-panel-33">
                          <Avatar
                            src={r.user?.urlAvatar}
                            name={r.user?.name}
                            username={r.user?.username}
                            size="sm"
                          />
                          <div>
                            <span className="course-details-label-24">
                              {r.user?.name || 'Aluno NEXO'}
                            </span>
                            <span className="course-details-label-25">
                              @{r.user?.username || 'aluno'}
                            </span>
                          </div>
                        </div>
                        <div className="course-details-panel-51">
                          {Array.from({
                            length: r.rating || 5,
                          }).map((_, i) => (
                            <Star
                              key={i}
                              className="course-details-play"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="course-details-description-13">{r.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Janela de Confirmação de Matrícula / Compra */}
        <CursoInscreverJanela
          isOpen={mostrarInscreverJanela}
          course={curso}
          onClose={() => definirMostrarInscreverJanela(false)}
          onEnrollSuccess={tratarInscreverSucesso}
        />
      </div>
    </>
  );
};

export default CursoDetalhesPagina;
