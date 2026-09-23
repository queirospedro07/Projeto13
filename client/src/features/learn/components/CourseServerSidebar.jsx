import React from 'react';
import { Link } from 'react-router-dom';
import { Hash, Video, Play, CheckCircle2, HelpCircle, FileCode2, Plus, Settings, Sparkles, X } from 'lucide-react';
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
  onOpenEditChannel
}) => {
  return <aside className="w-72 h-full bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none shadow-xs">
      <div className="flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
        
        <div className="h-16 px-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {courseTitle ? courseTitle.substring(0, 2).toUpperCase() : 'LS'}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-sm truncate leading-tight">
                {courseTitle}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Servidor do Espaço</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isCreatorOrAdmin && <button onClick={() => onOpenCreateChannel('text')} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer" title="Criar novo canal no espaço" aria-label="Criar canal">
                <Plus className="w-4 h-4" />
              </button>}
            {onCloseMobile && (
              <button onClick={onCloseMobile} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 md:hidden transition-colors cursor-pointer" title="Fechar menu">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        
        <div className="p-3 flex flex-col gap-5">
          
          {(() => {
            const voiceChannels = customChannels.filter(c => c.type === 'voice' || c.isVoice);
            if (voiceChannels.length === 0 && !isCreatorOrAdmin) return null;
            return (
              <div>
                <div className="px-2 pb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" />
                    Salas ao Vivo & Voz
                  </span>
                  {isCreatorOrAdmin && (
                    <button
                      onClick={() => onOpenCreateChannel('voice')}
                      className="hover:text-slate-900 text-xs font-bold p-1 rounded-md hover:bg-slate-100 cursor-pointer"
                      title="Criar sala de voz"
                      aria-label="Criar sala de voz"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {voiceChannels.length === 0 ? (
                  <p className="px-3 py-1.5 text-xs text-slate-400 italic">Nenhuma sala de voz ativa.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {voiceChannels.map(ch => {
                      const roomName = ch.name;
                      const isActive = activeView === 'live-room' && liveRoomName === roomName;
                      return (
                        <div key={ch.id || roomName} className="group/item flex items-center">
                          <button
                            onClick={() => onSelectLiveRoom(roomName)}
                            className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-sm text-left transition-all cursor-pointer min-w-0 ${
                              isActive
                                ? 'bg-slate-900 text-white font-medium shadow-xs'
                                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-normal'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Video className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                              <span className="truncate">{roomName}</span>
                            </div>
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 ml-1 ${
                                isActive ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isActive ? 'Ativo' : 'Entrar'}
                            </span>
                          </button>
                          {isCreatorOrAdmin && onOpenEditChannel && (
                            <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center pr-1">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  onOpenEditChannel(ch);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Editar canal"
                              >
                                <Settings className="w-3.5 h-3.5" />
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
            <div className="px-2 pb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Canais de Conversa</span>
              {isCreatorOrAdmin && <button onClick={() => onOpenCreateChannel('text')} className="hover:text-slate-900 text-xs font-bold p-1 rounded-md hover:bg-slate-100 cursor-pointer" title="Criar canal" aria-label="Criar canal">
                  <Plus className="w-3.5 h-3.5" />
                </button>}
            </div>
            <div className="flex flex-col gap-1">
              {customChannels.filter(c => c.type !== 'voice').map(ch => {
              const isSelected = activeView === 'channel' && currentTextChannel?.id === ch.id;
              return <div key={ch.id} className="group/item flex items-center">
                      <button onClick={() => onSelectChannel(ch)} className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-all cursor-pointer min-w-0 ${isSelected ? 'bg-slate-900 text-white font-medium shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-normal'}`}>
                        {ch.type === 'qa' ? <HelpCircle className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} /> : ch.type === 'showcase' ? <Sparkles className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} /> : <Hash className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />}
                        <span className="truncate">{ch.name}</span>
                      </button>

                      {isCreatorOrAdmin && <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center pr-1">
                          <button onClick={e => {
                    e.stopPropagation();
                    onOpenEditChannel(ch);
                  }} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Editar canal">
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>}
                    </div>;
            })}
            </div>
          </div>

          
          <div>
            <div className="px-2 pb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Aulas & Módulos</span>
              {isCreatorOrAdmin && courseId && (
                <Link
                  to={`/creator/courses/${courseId}/edit?step=3`}
                  className="hover:text-indigo-600 text-[11px] font-bold p-1 rounded-md hover:bg-slate-100 flex items-center gap-1 cursor-pointer text-slate-500 transition-colors"
                  title="Gerir e adicionar aulas"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </Link>
              )}
            </div>
            {modules.length === 0 ? (
              <div className="p-3 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 my-1">
                <p className="text-xs text-slate-500 font-medium">Nenhuma aula criada.</p>
                {isCreatorOrAdmin && courseId && (
                  <Link to={`/creator/courses/${courseId}/edit?step=3`}>
                    <button className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors cursor-pointer">
                      + Criar Lições
                    </button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {modules.map((mod, mIdx) => (
                  <div key={mod.id} className="flex flex-col gap-1">
                    <div className="px-2 py-1 text-xs text-slate-500 font-semibold uppercase tracking-wider truncate">
                      Módulo {mIdx + 1}: {mod.title}
                    </div>

                    {mod.lessons?.map(les => {
                      const isSelected = activeView === 'lesson' && currentLessonId === les.id;
                      const isCompleted = completedLessonIds.has(les.id);
                      return (
                        <button
                          key={les.id}
                          onClick={() => onSelectLesson(les)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white font-medium shadow-xs'
                              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-normal'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isCompleted ? (
                              <CheckCircle2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-emerald-600'}`} />
                            ) : (
                              <Play className={`w-4 h-4 shrink-0 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`} />
                            )}
                            <span className="truncate">{les.title}</span>
                          </div>
                          <span className={`text-xs font-mono shrink-0 ml-2 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
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
            <div className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Avaliações & Desafios
            </div>
            <button onClick={onSelectQuiz} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-left transition-all cursor-pointer ${activeView === 'quiz' ? 'bg-slate-900 text-white font-medium shadow-xs' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-normal'}`}>
              <div className="flex items-center gap-2.5 truncate">
                <HelpCircle className={`w-4 h-4 ${activeView === 'quiz' ? 'text-white' : 'text-slate-500'}`} />
                <span>Avaliação do Módulo</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${activeView === 'quiz' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                +50 XP
              </span>
            </button>
          </div>

          
          <div>
            <div className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Documentos & Recursos
            </div>
            <button onClick={onSelectDocuments} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-left transition-all cursor-pointer ${activeView === 'documents' ? 'bg-slate-900 text-white font-medium shadow-xs' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-normal'}`}>
              <div className="flex items-center gap-2.5 truncate">
                <FileCode2 className={`w-4 h-4 ${activeView === 'documents' ? 'text-white' : 'text-slate-500'}`} />
                <span>PDFs & Código-Fonte</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${activeView === 'documents' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {resourcesCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </aside>;
};