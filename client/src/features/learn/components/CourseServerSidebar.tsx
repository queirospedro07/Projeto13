import React from 'react';
import { 
  Hash, 
  Video, 
  Play, 
  CheckCircle2, 
  HelpCircle, 
  FileCode2, 
  Plus, 
  Settings, 
  Sparkles 
} from 'lucide-react';
import { CourseChannel } from '../../../pages/learn/CoursePlayer';

interface CourseServerSidebarProps {
  courseTitle: string;
  isCreatorOrAdmin: boolean;
  customChannels: CourseChannel[];
  currentTextChannel: CourseChannel | null;
  activeView: 'lesson' | 'channel' | 'live-room' | 'quiz' | 'documents';
  inLiveRoom: boolean;
  liveRoomName: string;
  modules: any[];
  currentLessonId?: string;
  completedLessonIds: Set<string>;
  resourcesCount: number;
  user: any;
  onSelectChannel: (channel: CourseChannel) => void;
  onSelectLesson: (lesson: any) => void;
  onSelectLiveRoom: (roomName: string) => void;
  onSelectQuiz: () => void;
  onSelectDocuments: () => void;
  onOpenCreateChannel: (type?: any) => void;
  onOpenEditChannel: (channel: CourseChannel) => void;
}

export const CourseServerSidebar: React.FC<CourseServerSidebarProps> = ({
  courseTitle,
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
  onSelectChannel,
  onSelectLesson,
  onSelectLiveRoom,
  onSelectQuiz,
  onSelectDocuments,
  onOpenCreateChannel,
  onOpenEditChannel
}) => {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none z-20 shadow-xs">
      <div className="flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
        {/* Server / Course Header */}
        <div className="h-16 px-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {courseTitle.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-sm truncate leading-tight">{courseTitle}</h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Servidor do Espaço</span>
              </div>
            </div>
          </div>

          {isCreatorOrAdmin && (
            <button
              onClick={() => onOpenCreateChannel('text')}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              title="Criar novo canal no espaço"
              aria-label="Criar canal"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Channels Section */}
        <div className="p-3 flex flex-col gap-5">
          {/* CATEGORIA: SALAS AO VIVO */}
          <div>
            <div className="px-2 pb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                Salas ao Vivo & Voz
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {['Live Mentoria & Ecrã', 'Sala de Dúvidas (Voz)'].map((room) => {
                const isActive = activeView === 'live-room' && liveRoomName === room;
                return (
                  <button
                    key={room}
                    onClick={() => onSelectLiveRoom(room)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white font-medium shadow-xs'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-normal'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Video className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span className="truncate">{room}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${isActive ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {isActive ? 'Ativo' : 'Entrar'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CATEGORIA: CANAIS DA TURMA */}
          <div>
            <div className="px-2 pb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Canais de Conversa</span>
              {isCreatorOrAdmin && (
                <button
                  onClick={() => onOpenCreateChannel('text')}
                  className="hover:text-slate-900 text-xs font-bold p-1 rounded-md hover:bg-slate-100 cursor-pointer"
                  title="Criar canal"
                  aria-label="Criar canal"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {customChannels.filter(c => c.type !== 'voice').map(ch => {
                const isSelected = activeView === 'channel' && currentTextChannel?.id === ch.id;
                return (
                  <div key={ch.id} className="group/item flex items-center">
                    <button
                      onClick={() => onSelectChannel(ch)}
                      className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-all cursor-pointer min-w-0 ${
                        isSelected
                          ? 'bg-slate-900 text-white font-medium shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-normal'
                      }`}
                    >
                      {ch.type === 'qa' ? (
                        <HelpCircle className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                      ) : ch.type === 'showcase' ? (
                        <Sparkles className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                      ) : (
                        <Hash className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      )}
                      <span className="truncate">{ch.name}</span>
                    </button>

                    {isCreatorOrAdmin && (
                      <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center pr-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenEditChannel(ch); }}
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
          </div>

          {/* CATEGORIA: AULAS & CURRÍCULO */}
          <div>
            <div className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Aulas & Módulos
            </div>
            <div className="flex flex-col gap-3">
              {modules.map((mod: any, mIdx: number) => (
                <div key={mod.id} className="flex flex-col gap-1">
                  <div className="px-2 py-1 text-xs text-slate-500 font-semibold uppercase tracking-wider truncate">
                    Módulo {mIdx + 1}: {mod.title}
                  </div>

                  {mod.lessons?.map((les: any) => {
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
                          {les.type === 'quiz' ? 'Quiz' : `${les.durationMin}m`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* CATEGORIA: QUIZZES */}
          <div>
            <div className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Avaliações & Desafios
            </div>
            <button
              onClick={onSelectQuiz}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-left transition-all cursor-pointer ${
                activeView === 'quiz'
                  ? 'bg-slate-900 text-white font-medium shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-normal'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <HelpCircle className={`w-4 h-4 ${activeView === 'quiz' ? 'text-white' : 'text-slate-500'}`} />
                <span>Avaliação do Módulo</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${activeView === 'quiz' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>+50 XP</span>
            </button>
          </div>

          {/* CATEGORIA: DOCUMENTOS */}
          <div>
            <div className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Documentos & Recursos
            </div>
            <button
              onClick={onSelectDocuments}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-left transition-all cursor-pointer ${
                activeView === 'documents'
                  ? 'bg-slate-900 text-white font-medium shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-normal'
              }`}
            >
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
    </aside>
  );
};
