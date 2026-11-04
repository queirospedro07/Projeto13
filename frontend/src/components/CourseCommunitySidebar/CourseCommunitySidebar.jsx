import './CourseCommunitySidebar.css';
import { Link } from 'react-router-dom';
import {
  LuHash as Hash,
  LuVideo as Video,
  LuPlay as Play,
  LuCircleCheck as CheckCircle2,
  LuCircleHelp as HelpCircle,
  LuFileCode2 as FileCode2,
  LuPlus as Plus,
  LuSettings as Settings,
  LuSparkles as Sparkles,
  LuX as X,
  LuBookOpen as BookOpen,
} from 'react-icons/lu';

export const BarraLateralComunidadeCurso = ({
  tituloCurso: cursoTitulo,
  idCurso: cursoId,
  hasCommunity: temCommunity = false,
  isCreatorOrAdmin: isFormadorOrAdministracao,
  customChannels: personalizadoCanais,
  currentTextChannel: atualTextCanal,
  activeView: ativoVista,
  inLiveRoom: inLiveSala,
  liveRoomName: liveSalaNome,
  modules: modulos = [],
  currentLessonId: atualAulaId,
  completedLessonIds: concluidoAulaIds,
  resourcesCount: recursosContar,
  onCloseMobile: onFecharMobile,
  onSelectChannel: onSelecionarCanal,
  onSelectLesson: onSelecionarAula,
  onSelectLiveRoom: onSelecionarLiveSala,
  onSelectQuiz: onSelecionarQuestionario,
  onSelectDocuments: onSelecionarDocumentos,
  onOpenCreateChannel: onAbrirCriarCanal,
  onOpenEditChannel: onAbrirEditarCanal,
}) => {
  return (
    <aside className="course-server-sidebar-sidebar">
      <div className="course-server-sidebar-panel custom-scrollbar">
        <div className="course-server-sidebar-panel-2">
          <div className="course-server-sidebar-panel-3">
            <div className="course-server-sidebar-panel-4">
              {cursoTitulo ? cursoTitulo.substring(0, 2).toUpperCase() : 'NX'}
            </div>
            <div className="course-server-sidebar-panel-5">
              <h2 className="course-server-sidebar-heading">{cursoTitulo}</h2>
              <div className="course-server-sidebar-panel-6">
                <span className="course-server-sidebar-label"></span>
                <span>{temCommunity ? 'Comunidade do curso' : 'Sala de aula'}</span>
              </div>
            </div>
          </div>

          <div className="course-server-sidebar-panel-7">
            {cursoId && (
              <Link
                to={`/cursos/${cursoId}`}
                className="course-server-sidebar-link"
                title="Ver detalhes do curso e currículo completo"
                aria-label="Ver detalhes do curso"
              >
                <BookOpen className="course-server-sidebar-book-open" />
              </Link>
            )}
            {temCommunity && isFormadorOrAdministracao && (
              <button
                onClick={() => onAbrirCriarCanal('text')}
                className="course-server-sidebar-button"
                title="Criar novo canal no espaço"
                aria-label="Criar canal"
              >
                <Plus className="course-server-sidebar-book-open" />
              </button>
            )}
            {onFecharMobile && (
              <button
                onClick={onFecharMobile}
                className="course-server-sidebar-button-2"
                title="Fechar menu"
              >
                <X className="course-server-sidebar-book-open" />
              </button>
            )}
          </div>
        </div>

        <div className="course-server-sidebar-panel-8">
          {(() => {
            if (!temCommunity) return null;
            const vozCanais = personalizadoCanais.filter((c) => c.type === 'voice' || c.eVoz);
            if (vozCanais.length === 0 && !isFormadorOrAdministracao) return null;

            return (
              <div>
                <div className="course-server-sidebar-panel-9">
                  <span className="course-server-sidebar-label-2">
                    <Video className="course-server-sidebar-video" />
                    Salas ao Vivo & Voz
                  </span>
                  {isFormadorOrAdministracao && (
                    <button
                      onClick={() => onAbrirCriarCanal('voice')}
                      className="course-server-sidebar-button-3"
                      title="Criar sala de voz"
                      aria-label="Criar sala de voz"
                    >
                      <Plus className="course-server-sidebar-video" />
                    </button>
                  )}
                </div>
                {vozCanais.length === 0 ? (
                  <p className="course-server-sidebar-description">Nenhuma sala de voz ativa.</p>
                ) : (
                  <div className="course-server-sidebar-panel-10">
                    {vozCanais.map((ch) => {
                      const salaNome = ch.name;
                      const isAtivo =
                        Boolean(inLiveSala) &&
                        ativoVista === 'live-room' &&
                        liveSalaNome === salaNome;

                      return (
                        <div
                          key={ch.id || salaNome}
                          className="course-server-sidebar-panel-11 group/item"
                        >
                          <button
                            onClick={() => onSelecionarLiveSala(salaNome)}
                            className={`course-server-sidebar-button-4 ${isAtivo ? 'course-server-sidebar-button-5' : 'course-server-sidebar-button-6'}`}
                          >
                            <div className="course-server-sidebar-panel-12">
                              <Video
                                className={`course-server-sidebar-video-2 ${isAtivo ? 'course-server-sidebar-video-3' : 'course-server-sidebar-video-4'}`}
                              />
                              <span className="course-server-sidebar-label-3">{salaNome}</span>
                            </div>
                            <span
                              className={`course-server-sidebar-label-4 ${isAtivo ? 'course-server-sidebar-label-5' : 'course-server-sidebar-label-6'}`}
                            >
                              {isAtivo ? 'Ativo' : 'Entrar'}
                            </span>
                          </button>
                          {isFormadorOrAdministracao && onAbrirEditarCanal && (
                            <div className="course-server-sidebar-panel-13">
                              <button
                                onClick={(evento) => {
                                  evento.stopPropagation();
                                  onAbrirEditarCanal(ch);
                                }}
                                className="course-server-sidebar-button-7"
                                title="Editar canal"
                              >
                                <Settings className="course-server-sidebar-video" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {temCommunity && (
            <div>
              <div className="course-server-sidebar-panel-9">
                <span>Canais de Conversa</span>
                {isFormadorOrAdministracao && (
                  <button
                    onClick={() => onAbrirCriarCanal('text')}
                    className="course-server-sidebar-button-3"
                    title="Criar canal"
                    aria-label="Criar canal"
                  >
                    <Plus className="course-server-sidebar-video" />
                  </button>
                )}
              </div>
              <div className="course-server-sidebar-panel-10">
                {personalizadoCanais
                  .filter((c) => c.type !== 'voice')
                  .map((ch) => {
                    const isSelecionado = ativoVista === 'channel' && atualTextCanal?.id === ch.id;

                    return (
                      <div
                        key={ch.id}
                        className="course-server-sidebar-panel-11 group/item"
                      >
                        <button
                          onClick={() => onSelecionarCanal(ch)}
                          className={`course-server-sidebar-button-8 ${isSelecionado ? 'course-server-sidebar-button-5' : 'course-server-sidebar-button-9'}`}
                        >
                          {ch.type === 'qa' ? (
                            <HelpCircle
                              className={`course-server-sidebar-video-2 ${isSelecionado ? 'course-server-sidebar-video-3' : 'course-server-sidebar-video-4'}`}
                            />
                          ) : ch.type === 'showcase' ? (
                            <Sparkles
                              className={`course-server-sidebar-video-2 ${isSelecionado ? 'course-server-sidebar-video-3' : 'course-server-sidebar-video-4'}`}
                            />
                          ) : (
                            <Hash
                              className={`course-server-sidebar-video-2 ${isSelecionado ? 'course-server-sidebar-video-3' : 'course-server-sidebar-hash'}`}
                            />
                          )}
                          <span className="course-server-sidebar-label-3">{ch.name}</span>
                        </button>

                        {isFormadorOrAdministracao && (
                          <div className="course-server-sidebar-panel-13">
                            <button
                              onClick={(evento) => {
                                evento.stopPropagation();
                                onAbrirEditarCanal(ch);
                              }}
                              className="course-server-sidebar-button-7"
                              title="Editar canal"
                            >
                              <Settings className="course-server-sidebar-video" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div>
            <div className="course-server-sidebar-panel-9">
              <span>Aulas & Módulos</span>
              {isFormadorOrAdministracao && cursoId && (
                <Link
                  to={`/formador/cursos/${cursoId}/edit?step=3`}
                  className="course-server-sidebar-link-2"
                  title="Gerir e adicionar aulas"
                >
                  <Plus className="course-server-sidebar-video" />
                  <span>Adicionar</span>
                </Link>
              )}
            </div>
            {modulos.length === 0 ? (
              <div className="course-server-sidebar-panel-14">
                <p className="course-server-sidebar-description-2">Nenhuma aula criada.</p>
                {isFormadorOrAdministracao && cursoId && (
                  <Link to={`/formador/cursos/${cursoId}/edit?step=3`}>
                    <button className="course-server-sidebar-button-10">+ Criar Aulas</button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="course-server-sidebar-panel-15">
                {modulos.map((mod, mIdx) => (
                  <div
                    key={mod.id}
                    className="course-server-sidebar-panel-10"
                  >
                    <div className="course-server-sidebar-panel-16">
                      Módulo {mIdx + 1}: {mod.title}
                    </div>

                    {mod.lessons?.map((les) => {
                      const isSelecionado = ativoVista === 'lesson' && atualAulaId === les.id;
                      const isConcluido = concluidoAulaIds.has(les.id);

                      return (
                        <button
                          key={les.id}
                          onClick={() => onSelecionarAula(les)}
                          className={`course-server-sidebar-button-11 ${isSelecionado ? 'course-server-sidebar-button-5' : 'course-server-sidebar-button-6'}`}
                        >
                          <div className="course-server-sidebar-panel-17">
                            {isConcluido ? (
                              <CheckCircle2
                                className={`course-server-sidebar-video-2 ${isSelecionado ? 'course-server-sidebar-check-circle2' : 'course-server-sidebar-check-circle2-2'}`}
                              />
                            ) : (
                              <Play
                                className={`course-server-sidebar-video-2 ${isSelecionado ? 'course-server-sidebar-play' : 'course-server-sidebar-hash'}`}
                              />
                            )}
                            <span className="course-server-sidebar-label-3">{les.title}</span>
                          </div>
                          <span
                            className={`course-server-sidebar-label-7 ${isSelecionado ? 'course-server-sidebar-play' : 'course-server-sidebar-hash'}`}
                          >
                            {les.type === 'quiz' ? 'Questionario' : `${les.duracaoMinutos || 15}m`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="course-server-sidebar-panel-18">Avaliações & Desafios</div>
            <button
              onClick={onSelecionarQuestionario}
              className={`course-server-sidebar-button-12 ${ativoVista === 'quiz' ? 'course-server-sidebar-button-5' : 'course-server-sidebar-button-13'}`}
            >
              <div className="course-server-sidebar-panel-12">
                <HelpCircle
                  className={`course-server-sidebar-book-open ${ativoVista === 'quiz' ? 'course-server-sidebar-video-3' : 'course-server-sidebar-video-4'}`}
                />
                <span>Avaliação do Módulo</span>
              </div>
            </button>
          </div>

          <div>
            <div className="course-server-sidebar-panel-18">Documentos & Recursos</div>
            <button
              onClick={onSelecionarDocumentos}
              className={`course-server-sidebar-button-12 ${ativoVista === 'documents' ? 'course-server-sidebar-button-5' : 'course-server-sidebar-button-13'}`}
            >
              <div className="course-server-sidebar-panel-12">
                <FileCode2
                  className={`course-server-sidebar-book-open ${ativoVista === 'documents' ? 'course-server-sidebar-video-3' : 'course-server-sidebar-video-4'}`}
                />
                <span>PDFs & Código-Fonte</span>
              </div>
              <span
                className={`course-server-sidebar-label-8 ${ativoVista === 'documents' ? 'course-server-sidebar-label-5' : 'course-server-sidebar-label-6'}`}
              >
                {recursosContar}
              </span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
