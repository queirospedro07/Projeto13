import './CourseServerSidebar.css';
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
export const CourseServerSidebar = ({
  courseTitle,
  courseId,
  isCreatorOrAdmin,
  customChannels,
  currentTextChannel,
  activeView,
  inLiveRoom,
  liveRoomName,
  modules = [],
  currentLessonId,
  completedLessonIds,
  resourcesCount,
  user,
  onCloseMobile,
  onSelectChannel,
  onSelectLesson,
  onSelectLiveRoom,
  onSelectQuiz,
  onSelectDocuments,
  onOpenCreateChannel,
  onOpenEditChannel,
}) => {
  return (
    <aside className="course-server-sidebar-sidebar">
      <div className="course-server-sidebar-panel custom-scrollbar">
        <div className="course-server-sidebar-panel-2">
          <div className="course-server-sidebar-panel-3">
            <div className="course-server-sidebar-panel-4">
              {courseTitle ? courseTitle.substring(0, 2).toUpperCase() : 'NX'}
            </div>
            <div className="course-server-sidebar-panel-5">
              <h2 className="course-server-sidebar-heading">{courseTitle}</h2>
              <div className="course-server-sidebar-panel-6">
                <span className="course-server-sidebar-label"></span>
                <span>Servidor do Espaço</span>
              </div>
            </div>
          </div>

          <div className="course-server-sidebar-panel-7">
            {courseId && (
              <Link
                to={`/courses/${courseId}`}
                className="course-server-sidebar-link"
                title="Ver detalhes do curso e currículo completo"
                aria-label="Ver detalhes do curso"
              >
                <BookOpen className="course-server-sidebar-book-open" />
              </Link>
            )}
            {isCreatorOrAdmin && (
              <button
                onClick={() => onOpenCreateChannel('text')}
                className="course-server-sidebar-button"
                title="Criar novo canal no espaço"
                aria-label="Criar canal"
              >
                <Plus className="course-server-sidebar-book-open" />
              </button>
            )}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
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
            const voiceChannels = customChannels.filter((c) => c.type === 'voice' || c.isVoice);
            if (voiceChannels.length === 0 && !isCreatorOrAdmin) return null;
            return (
              <div>
                <div className="course-server-sidebar-panel-9">
                  <span className="course-server-sidebar-label-2">
                    <Video className="course-server-sidebar-video" />
                    Salas ao Vivo & Voz
                  </span>
                  {isCreatorOrAdmin && (
                    <button
                      onClick={() => onOpenCreateChannel('voice')}
                      className="course-server-sidebar-button-3"
                      title="Criar sala de voz"
                      aria-label="Criar sala de voz"
                    >
                      <Plus className="course-server-sidebar-video" />
                    </button>
                  )}
                </div>
                {voiceChannels.length === 0 ? (
                  <p className="course-server-sidebar-description">Nenhuma sala de voz ativa.</p>
                ) : (
                  <div className="course-server-sidebar-panel-10">
                    {voiceChannels.map((ch) => {
                      const roomName = ch.name;
                      const isActive =
                        Boolean(inLiveRoom) &&
                        activeView === 'live-room' &&
                        liveRoomName === roomName;
                      return (
                        <div
                          key={ch.id || roomName}
                          className="course-server-sidebar-panel-11 group/item"
                        >
                          <button
                            onClick={() => onSelectLiveRoom(roomName)}
                            className={`course-server-sidebar-button-4 ${isActive ? 'course-server-sidebar-button-5' : 'course-server-sidebar-button-6'}`}
                          >
                            <div className="course-server-sidebar-panel-12">
                              <Video
                                className={`course-server-sidebar-video-2 ${isActive ? 'course-server-sidebar-video-3' : 'course-server-sidebar-video-4'}`}
                              />
                              <span className="course-server-sidebar-label-3">{roomName}</span>
                            </div>
                            <span
                              className={`course-server-sidebar-label-4 ${isActive ? 'course-server-sidebar-label-5' : 'course-server-sidebar-label-6'}`}
                            >
                              {isActive ? 'Ativo' : 'Entrar'}
                            </span>
                          </button>
                          {isCreatorOrAdmin && onOpenEditChannel && (
                            <div className="course-server-sidebar-panel-13">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenEditChannel(ch);
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

          <div>
            <div className="course-server-sidebar-panel-9">
              <span>Canais de Conversa</span>
              {isCreatorOrAdmin && (
                <button
                  onClick={() => onOpenCreateChannel('text')}
                  className="course-server-sidebar-button-3"
                  title="Criar canal"
                  aria-label="Criar canal"
                >
                  <Plus className="course-server-sidebar-video" />
                </button>
              )}
            </div>
            <div className="course-server-sidebar-panel-10">
              {customChannels
                .filter((c) => c.type !== 'voice')
                .map((ch) => {
                  const isSelected = activeView === 'channel' && currentTextChannel?.id === ch.id;
                  return (
                    <div key={ch.id} className="course-server-sidebar-panel-11 group/item">
                      <button
                        onClick={() => onSelectChannel(ch)}
                        className={`course-server-sidebar-button-8 ${isSelected ? 'course-server-sidebar-button-5' : 'course-server-sidebar-button-9'}`}
                      >
                        {ch.type === 'qa' ? (
                          <HelpCircle
                            className={`course-server-sidebar-video-2 ${isSelected ? 'course-server-sidebar-video-3' : 'course-server-sidebar-video-4'}`}
                          />
                        ) : ch.type === 'showcase' ? (
                          <Sparkles
                            className={`course-server-sidebar-video-2 ${isSelected ? 'course-server-sidebar-video-3' : 'course-server-sidebar-video-4'}`}
                          />
                        ) : (
                          <Hash
                            className={`course-server-sidebar-video-2 ${isSelected ? 'course-server-sidebar-video-3' : 'course-server-sidebar-hash'}`}
                          />
                        )}
                        <span className="course-server-sidebar-label-3">{ch.name}</span>
                      </button>

                      {isCreatorOrAdmin && (
                        <div className="course-server-sidebar-panel-13">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenEditChannel(ch);
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

          <div>
            <div className="course-server-sidebar-panel-9">
              <span>Aulas & Módulos</span>
              {isCreatorOrAdmin && courseId && (
                <Link
                  to={`/creator/courses/${courseId}/edit?step=3`}
                  className="course-server-sidebar-link-2"
                  title="Gerir e adicionar aulas"
                >
                  <Plus className="course-server-sidebar-video" />
                  <span>Adicionar</span>
                </Link>
              )}
            </div>
            {modules.length === 0 ? (
              <div className="course-server-sidebar-panel-14">
                <p className="course-server-sidebar-description-2">Nenhuma aula criada.</p>
                {isCreatorOrAdmin && courseId && (
                  <Link to={`/creator/courses/${courseId}/edit?step=3`}>
                    <button className="course-server-sidebar-button-10">+ Criar Aulas</button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="course-server-sidebar-panel-15">
                {modules.map((mod, mIdx) => (
                  <div key={mod.id} className="course-server-sidebar-panel-10">
                    <div className="course-server-sidebar-panel-16">
                      Módulo {mIdx + 1}: {mod.title}
                    </div>

                    {mod.lessons?.map((les) => {
                      const isSelected = activeView === 'lesson' && currentLessonId === les.id;
                      const isCompleted = completedLessonIds.has(les.id);
                      return (
                        <button
                          key={les.id}
                          onClick={() => onSelectLesson(les)}
                          className={`course-server-sidebar-button-11 ${isSelected ? 'course-server-sidebar-button-5' : 'course-server-sidebar-button-6'}`}
                        >
                          <div className="course-server-sidebar-panel-17">
                            {isCompleted ? (
                              <CheckCircle2
                                className={`course-server-sidebar-video-2 ${isSelected ? 'course-server-sidebar-check-circle2' : 'course-server-sidebar-check-circle2-2'}`}
                              />
                            ) : (
                              <Play
                                className={`course-server-sidebar-video-2 ${isSelected ? 'course-server-sidebar-play' : 'course-server-sidebar-hash'}`}
                              />
                            )}
                            <span className="course-server-sidebar-label-3">{les.title}</span>
                          </div>
                          <span
                            className={`course-server-sidebar-label-7 ${isSelected ? 'course-server-sidebar-play' : 'course-server-sidebar-hash'}`}
                          >
                            {les.type === 'quiz' ? 'Quiz' : `${les.durationMin || 15}m`}
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
              onClick={onSelectQuiz}
              className={`course-server-sidebar-button-12 ${activeView === 'quiz' ? 'course-server-sidebar-button-5' : 'course-server-sidebar-button-13'}`}
            >
              <div className="course-server-sidebar-panel-12">
                <HelpCircle
                  className={`course-server-sidebar-book-open ${activeView === 'quiz' ? 'course-server-sidebar-video-3' : 'course-server-sidebar-video-4'}`}
                />
                <span>Avaliação do Módulo</span>
              </div>
            </button>
          </div>

          <div>
            <div className="course-server-sidebar-panel-18">Documentos & Recursos</div>
            <button
              onClick={onSelectDocuments}
              className={`course-server-sidebar-button-12 ${activeView === 'documents' ? 'course-server-sidebar-button-5' : 'course-server-sidebar-button-13'}`}
            >
              <div className="course-server-sidebar-panel-12">
                <FileCode2
                  className={`course-server-sidebar-book-open ${activeView === 'documents' ? 'course-server-sidebar-video-3' : 'course-server-sidebar-video-4'}`}
                />
                <span>PDFs & Código-Fonte</span>
              </div>
              <span
                className={`course-server-sidebar-label-8 ${activeView === 'documents' ? 'course-server-sidebar-label-5' : 'course-server-sidebar-label-6'}`}
              >
                {resourcesCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
