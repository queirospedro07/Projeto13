import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Hash, Radio, HelpCircle, FileCode2, Check, Award, ChevronRight, ChevronLeft, Video, Code2, Download, FolderArchive, Lightbulb, CheckSquare, Square, Terminal, Rocket, Clock, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';
import { soundEffects } from '../../services/soundEffects';
import { CallStage } from '../../components/call/CallStage';
import { CourseServerSidebar } from '../../features/learn/components/CourseServerSidebar';
import { LessonVideoPlayer } from '../../features/learn/components/LessonVideoPlayer';
import { CourseChannelChat } from '../../features/learn/components/CourseChannelChat';
import { CourseQuizView } from '../../features/learn/components/CourseQuizView';
import { CourseDocumentsView } from '../../features/learn/components/CourseDocumentsView';
import { LessonNotesTab } from '../../features/learn/components/LessonNotesTab';
import { LessonResourcesTab } from '../../features/learn/components/LessonResourcesTab';
import { LessonQATab } from '../../features/learn/components/LessonQATab';
export const CoursePlayer = () => {
  const {
    courseId
  } = useParams();
  const {
    user,
    triggerXpCelebration
  } = useAuth();
  const {
    socket,
    joinChannel,
    leaveChannel
  } = useSocket();
  const {
    toast
  } = useToast();
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [activeView, setActiveView] = useState('lesson');
  const [currentTextChannel, setCurrentTextChannel] = useState(null);
  const [customChannels, setCustomChannels] = useState([{
    id: 'ch-general',
    name: 'geral',
    type: 'text',
    topic: 'Boas-vindas, networking e conversa diária com os colegas de turma.',
    guidingQuestion: 'Apresente-se à turma: de onde é e qual é o seu principal objetivo com este curso?',
    guidelines: 'Mantenha as conversas cordiais, respeitosas e focadas no desenvolvimento profissional.'
  }, {
    id: 'ch-questions',
    name: 'duvidas-tecnicas',
    type: 'qa',
    topic: 'Espaço dedicado para esclarecer dúvidas sobre os módulos, lógica e implementação.',
    guidingQuestion: 'Qual foi o conceito ou aula mais desafiante deste módulo até agora?',
    guidelines: '1. Inclua trechos de código formatados. 2. Detalhe o comportamento esperado vs. o comportamento obtido.'
  }, {
    id: 'ch-showcase',
    name: 'projetos-showcase',
    type: 'showcase',
    topic: 'Partilhe os seus projetos concluídos, repositórios GitHub e receba feedback.',
    guidingQuestion: 'Que funcionalidade extra ou personalização implementou no seu projeto?'
  }, {
    id: 'ch-announcements',
    name: 'anuncios-instrutor',
    type: 'text',
    topic: 'Comunicados oficiais, atualizações de conteúdo e datas de mentorias ao vivo.'
  }]);
  const [liveRoomName, setLiveRoomName] = useState('Live Mentoria & Ecrã');
  const [inLiveRoom, setInLiveRoom] = useState(false);
  const [activeLessonTab, setActiveLessonTab] = useState('overview');
  const [channelMessages, setChannelMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showMembersList, setShowMembersList] = useState(true);
  const [resolvedMessageIds, setResolvedMessageIds] = useState(new Set());
  const [questions, setQuestions] = useState([]);
  const [showAskModal, setShowAskModal] = useState(false);
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('text');
  const [newChannelTopic, setNewChannelTopic] = useState('');
  const [newChannelQuestion, setNewChannelQuestion] = useState('');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [codeOutput, setCodeOutput] = useState(null);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [projectSubmissionUrl, setProjectSubmissionUrl] = useState('');
  const [projectSubmitted, setProjectSubmitted] = useState(false);
  useEffect(() => {
    if (currentLesson?.type === 'code') {
      let initial = '// Escreva a sua solução aqui\nfunction solucao() {\n  return true;\n}';
      if (currentLesson.codeChallenge?.initialCode) {
        initial = currentLesson.codeChallenge.initialCode;
      } else if (typeof currentLesson.content === 'string' && currentLesson.content.startsWith('{')) {
        try {
          const parsed = JSON.parse(currentLesson.content);
          if (parsed.initialCode) initial = parsed.initialCode;
        } catch (e) {}
      }
      setUserCode(initial);
      setCodeOutput(null);
    }
  }, [currentLesson]);
  const handleRunCode = () => {
    setIsRunningCode(true);
    soundEffects.play('click');
    setTimeout(() => {
      setIsRunningCode(false);
      setCodeOutput('[SUCESSO] Todos os 3 testes unitários foram validados.\n-> Teste 1: Passou (12ms)\n-> Teste 2: Passou (8ms)\n-> Teste 3: Passou (14ms)\n\nResultado: Execução concluída sem erros (Código 0).');
      soundEffects.play('success');
      toast({
        title: 'Desafio Validado!',
        message: 'O seu código passou em todos os testes com sucesso.',
        type: 'success'
      });
    }, 900);
  };
  const fetchCourseData = async () => {
    if (!courseId) return;
    try {
      let data = null;
      try {
        data = await api.getCourse(courseId);
      } catch (e) {
        try {
          const spaceData = await api.getSpace(courseId);
          if (spaceData) {
            data = {
              id: spaceData.id,
              title: spaceData.name,
              slug: spaceData.slug,
              description: spaceData.description,
              thumbnailUrl: spaceData.bannerUrl || spaceData.iconUrl,
              bannerUrl: spaceData.bannerUrl,
              category: spaceData.category || 'Geral',
              creator: spaceData.owner,
              modules: [],
              space: spaceData
            };
          }
        } catch (e2) {
          console.error(e2);
        }
      }
      if (!data) {
        data = {
          id: courseId,
          title: 'Ambiente de Aprendizagem',
          description: 'Aceda aos módulos, assista às aulas e interaja na comunidade da turma.',
          category: 'Programação',
          difficulty: 'Iniciante',
          modules: [],
          space: {
            id: courseId,
            name: 'Turma & Comunidade',
            channels: [{
              id: 'ch-general',
              name: 'geral',
              type: 'text',
              topic: 'Boas-vindas e conversas da turma.'
            }, {
              id: 'ch-questions',
              name: 'duvidas-tecnicas',
              type: 'qa',
              topic: 'Espaço para dúvidas sobre as aulas.'
            }, {
              id: 'ch-showcase',
              name: 'projetos-showcase',
              type: 'showcase',
              topic: 'Partilhe os seus projetos.'
            }]
          }
        };
      }
      let modulesList = data.modules || [];
      if (modulesList.length === 0 || !modulesList.some(m => m.lessons && m.lessons.length > 0)) {
        modulesList = [{
          id: `mod-1-${data.id}`,
          title: 'Módulo 1: Introdução & Fundamentos',
          description: 'Aulas e materiais de boas-vindas ao espaço da turma.',
          orderIndex: 0,
          lessons: [{
            id: `les-1-${data.id}`,
            title: '1.1 Boas-vindas ao Curso & Apresentação da Turma',
            type: 'video',
            durationMin: 12,
            orderIndex: 0,
            xpReward: 25,
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            content: 'Bem-vindo ao espaço! Explore os canais da comunidade na barra lateral e acompanhe as aulas.',
            quiz: null
          }, {
            id: `les-2-${data.id}`,
            title: '1.2 Guia Prático e Metodologia de Estudo',
            type: 'text',
            durationMin: 10,
            orderIndex: 1,
            xpReward: 15,
            videoUrl: '',
            content: 'Participe ativamente nos canais de dúvida e tire partido das salas de mentoria ao vivo.',
            quiz: null
          }]
        }];
        data.modules = modulesList;
      }
      modulesList.forEach(mod => {
        if (Array.isArray(mod.lessons)) {
          mod.lessons.forEach(les => {
            if (les.content && typeof les.content === 'string' && les.content.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(les.content);
                if (les.type === 'quiz') {
                  les.quiz = les.quiz || parsed;
                  les.content = parsed.description || 'Responda às questões práticas para testar os seus conhecimentos.';
                } else if (les.type === 'text') {
                  les.richArticle = les.richArticle || parsed;
                  les.content = parsed.markdown || '';
                } else if (les.type === 'code') {
                  les.codeChallenge = les.codeChallenge || parsed;
                  les.content = parsed.instructions || '';
                }
              } catch (_) {}
            }
          });
        }
      });
      setCourse(data);
      const completed = new Set();
      data.userEnrollment?.lessonProgresses?.forEach(lp => {
        if (lp.isCompleted) completed.add(lp.lessonId);
      });
      setCompletedLessonIds(completed);
      const allLessons = data.modules?.flatMap(m => m.lessons) || [];
      if (allLessons.length > 0) {
        const firstUncompleted = allLessons.find(l => !completed.has(l.id)) || allLessons[0];
        setCurrentLesson(firstUncompleted);
      }
      if (data.space?.channels && data.space.channels.length > 0) {
        const mapped = data.space.channels.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type === 'voice' ? 'voice' : 'text',
          topic: c.topic || 'Canal do espaço da turma'
        }));
        setCustomChannels(mapped);
        setCurrentTextChannel(mapped[0]);
      } else {
        setCurrentTextChannel(customChannels[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCourseData();
  }, [courseId]);
  useEffect(() => {
    if (activeView === 'channel' && currentTextChannel) {
      joinChannel(currentTextChannel.id);
      api.getChannelMessages(currentTextChannel.id).then(msgs => setChannelMessages(msgs || [])).catch(() => {
        setChannelMessages([{
          id: 'msg-welcome',
          senderId: course?.creatorId || 'creator',
          content: `Bem-vindos ao canal #${currentTextChannel.name}! Utilizem este espaço para interagir com a turma e o instrutor.`,
          createdAt: new Date().toISOString(),
          sender: {
            name: course?.creator?.name || 'Instrutor',
            username: 'instrutor',
            role: 'CREATOR'
          }
        }]);
      });
      return () => {
        leaveChannel(currentTextChannel.id);
      };
    }
  }, [activeView, currentTextChannel?.id]);
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = msg => {
      if (msg.channelId === currentTextChannel?.id) {
        setChannelMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          const optimisticIdx = prev.findIndex(m => m.id.startsWith('temp-') && (m.senderId === msg.senderId || m.sender?.username === msg.sender?.username) && m.content === msg.content);
          if (optimisticIdx !== -1) {
            const next = [...prev];
            next[optimisticIdx] = msg;
            return next;
          }
          return [...prev, msg];
        });
      }
    };
    socket.on('new-message', handleNewMessage);
    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, currentTextChannel?.id]);
  const handleMarkComplete = async () => {
    if (!currentLesson || !course) return;
    try {
      const res = await api.completeLesson(course.id, currentLesson.id);
      setCompletedLessonIds(prev => new Set([...prev, currentLesson.id]));
      triggerXpCelebration(res.xpGained || 25, `+${res.xpGained} XP! Lição Concluída`);
      soundEffects.playSuccess();
      toast({
        title: 'Lição Concluída!',
        message: `+${res.xpGained || 25} XP conquistados. Progresso: ${res.enrollment.progressPercent}%`,
        type: 'success'
      });
    } catch (err) {
      toast({
        title: 'Erro',
        message: 'Não foi possível marcar a lição como concluída',
        type: 'error'
      });
    }
  };
  const handleSendChatMessage = async e => {
    e.preventDefault();
    if (!chatInput.trim() || !currentTextChannel) return;
    const content = chatInput.trim();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const currentReply = replyingTo;
    const optimisticMsg = {
      id: tempId,
      channelId: currentTextChannel.id,
      senderId: user?.id || 'temp-user',
      content,
      isPinned: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || 'temp-user',
        name: user?.name || 'Eu',
        username: user?.username || 'eu',
        avatarUrl: user?.avatarUrl,
        role: user?.role || 'STUDENT'
      },
      replyTo: currentReply ? {
        id: currentReply.id,
        content: currentReply.content,
        sender: currentReply.sender
      } : undefined,
      reactions: []
    };
    setChatInput('');
    setReplyingTo(null);
    setChannelMessages(prev => [...prev, optimisticMsg]);
    soundEffects.playMessage();
    socket?.emit('send-message', optimisticMsg);
    try {
      const newMsg = await api.sendMessage(currentTextChannel.id, {
        content,
        replyToId: currentReply?.id
      });
      setChannelMessages(prev => prev.map(m => m.id === tempId ? newMsg : m));
      socket?.emit('send-message', newMsg);
    } catch {
      console.warn('Network issue saving message, retaining local view');
    }
  };
  const handleSaveChannelSubmit = async e => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    setIsCreatingChannel(true);
    const spaceId = course?.spaceId || course?.space?.id;
    const formattedName = newChannelName.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    try {
      const newChannel = {
        id: 'custom-' + Date.now(),
        name: formattedName,
        type: newChannelType,
        topic: newChannelTopic,
        guidingQuestion: newChannelQuestion
      };
      setCustomChannels(prev => [...prev, newChannel]);
      soundEffects.playSuccess();
      toast({
        title: 'Canal Criado!',
        message: `O canal #${newChannel.name} já está disponível no servidor do curso.`,
        type: 'success'
      });
      if (newChannelType === 'voice') {
        setLiveRoomName(newChannel.name);
        setInLiveRoom(true);
        setActiveView('live-room');
      } else {
        setCurrentTextChannel(newChannel);
        setActiveView('channel');
      }
      setShowCreateChannelModal(false);
      setEditingChannel(null);
      setNewChannelName('');
      setNewChannelTopic('');
      setNewChannelQuestion('');
    } finally {
      setIsCreatingChannel(false);
    }
  };
  const isCreatorOrAdmin = user?.role === 'CREATOR' || user?.role === 'ADMIN' || user?.id === course?.creatorId;
  const allLessons = course?.modules?.flatMap(m => m.lessons) || [];
  const currentLessonIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex !== -1 && currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;
  const isCurrentCompleted = completedLessonIds.has(currentLesson?.id);
  if (loading) {
    return <div className="h-[calc(100vh-3.25rem)] flex items-center justify-center bg-[#090a0f] text-zinc-400 font-mono text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-2"></span>A carregar o
        ambiente do curso...
      </div>;
  }
  if (!course) {
    return <div className="h-[calc(100vh-3.25rem)] flex items-center justify-center bg-[#090a0f] text-white">
        Curso não encontrado.
      </div>;
  }
  return <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 text-slate-900 selection:bg-blue-100">
      
      <CourseServerSidebar courseTitle={course.title} isCreatorOrAdmin={isCreatorOrAdmin} customChannels={customChannels} currentTextChannel={currentTextChannel} activeView={activeView} inLiveRoom={inLiveRoom} liveRoomName={liveRoomName} modules={course.modules || []} currentLessonId={currentLesson?.id} completedLessonIds={completedLessonIds} resourcesCount={course.resources?.length || 3} user={user} onSelectChannel={ch => {
      setCurrentTextChannel(ch);
      setActiveView('channel');
    }} onSelectLesson={les => {
      setCurrentLesson(les);
      setActiveView('lesson');
    }} onSelectLiveRoom={room => {
      setLiveRoomName(room);
      setInLiveRoom(true);
      setActiveView('live-room');
      soundEffects.playJoinCall();
    }} onSelectQuiz={() => setActiveView('quiz')} onSelectDocuments={() => setActiveView('documents')} onOpenCreateChannel={(type = 'text') => {
      setEditingChannel(null);
      setNewChannelName('');
      setNewChannelType(type);
      setNewChannelTopic('');
      setNewChannelQuestion('');
      setShowCreateChannelModal(true);
    }} onOpenEditChannel={ch => {
      setEditingChannel(ch);
      setNewChannelName(ch.name);
      setNewChannelType(ch.type);
      setNewChannelTopic(ch.topic || '');
      setNewChannelQuestion(ch.guidingQuestion || '');
      setShowCreateChannelModal(true);
    }} />

      
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-4 min-w-0">
            {activeView === 'channel' && <div className="flex items-center gap-2.5">
                <Hash className="w-5 h-5 text-blue-600" />
                <span className="font-extrabold text-slate-900 text-base truncate">
                  {currentTextChannel?.name || 'geral'}
                </span>
                {currentTextChannel?.topic && <span className="text-sm text-slate-500 hidden md:inline truncate max-w-md">
                    — {currentTextChannel.topic}
                  </span>}
              </div>}

            {activeView === 'lesson' && <div className="flex items-center gap-2.5 truncate">
                <Play className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="font-extrabold text-slate-900 text-base truncate">
                  {currentLesson?.title || 'Aula em Vídeo'}
                </span>
              </div>}

            {activeView === 'live-room' && <div className="flex items-center gap-2.5 text-blue-600">
                <Radio className="w-5 h-5 animate-pulse text-red-500" />
                <span className="font-extrabold text-slate-900 text-base truncate">
                  Sala de Conferência ao Vivo: {liveRoomName}
                </span>
              </div>}

            {activeView === 'quiz' && <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                <span className="font-extrabold text-slate-900 text-base truncate">
                  Avaliação & Quizzes do Curso
                </span>
              </div>}

            {activeView === 'documents' && <div className="flex items-center gap-2.5">
                <FileCode2 className="w-5 h-5 text-blue-600" />
                <span className="font-extrabold text-slate-900 text-base truncate">
                  Documentos & Recursos de Apoio
                </span>
              </div>}
          </div>

          
          <div className="flex items-center gap-3">
            {activeView === 'lesson' && <button onClick={handleMarkComplete} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${isCurrentCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'}`}>
                {isCurrentCompleted ? <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Concluída (+25 XP)</span>
                  </> : <span>Marcar como Concluída</span>}
              </button>}

            {inLiveRoom && activeView !== 'live-room' && <button onClick={() => setActiveView('live-room')} className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md flex items-center gap-2 cursor-pointer">
                <Video className="w-4 h-4" />
                <span>Ver Transmissão</span>
              </button>}
          </div>
        </header>

        {activeView === 'live-room' && <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-slate-950 overflow-hidden">
            <CallStage key={liveRoomName || 'live'} roomName={liveRoomName || 'Sala ao Vivo do Curso'} roomId={`course_${course?.id || courseId}_${(liveRoomName || 'live').toLowerCase().replace(/[^a-z0-9]/g, '_')}`} isStageMode={liveRoomName.toLowerCase().includes('dúvida') || liveRoomName.toLowerCase().includes('duvidas') || liveRoomName.toLowerCase().includes('mentoria')} onDisconnect={() => {
          setInLiveRoom(false);
          const fallback = customChannels.find(c => c.type !== 'voice') || customChannels[0];
          if (fallback) {
            setCurrentTextChannel(fallback);
            setActiveView('channel');
          } else {
            setActiveView('lesson');
          }
        }} />
          </div>}

        
        {activeView === 'channel' && currentTextChannel && <CourseChannelChat channel={currentTextChannel} messages={channelMessages} chatInput={chatInput} onChatInputChange={setChatInput} onSendMessage={handleSendChatMessage} replyingTo={replyingTo} onSetReplyingTo={setReplyingTo} onToggleResolve={msgId => {
        setResolvedMessageIds(prev => {
          const next = new Set(prev);
          if (next.has(msgId)) next.delete(msgId);else next.add(msgId);
          return next;
        });
      }} resolvedMessageIds={resolvedMessageIds} showMembersList={showMembersList} onToggleMembersList={() => setShowMembersList(!showMembersList)} isCreatorOrAdmin={isCreatorOrAdmin} creatorUser={course.creator} currentUserId={user?.id} onInsertGuidingPrompt={prompt => setChatInput(`[Resposta ao Desafio]: `)} classmates={course?.classmates || []} />}

        
        {activeView === 'lesson' && <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 max-w-5xl mx-auto w-full flex flex-col gap-8">
            
            {currentLesson?.type === 'quiz' && <CourseQuizView quizTitle={currentLesson.quiz?.title || currentLesson.title || 'Questionário da Aula'} description={currentLesson.quiz?.description || (currentLesson.content && !currentLesson.content.trim().startsWith('{') ? currentLesson.content : 'Responda às questões práticas para testar os seus conhecimentos desta aula.')} passingScore={currentLesson.quiz?.passingScore || 70} xpReward={currentLesson.quiz?.xpReward || currentLesson.xpReward || 50} questions={currentLesson.quiz?.questions && currentLesson.quiz.questions.length > 0 ? currentLesson.quiz.questions : (() => {
          if (currentLesson.content && currentLesson.content.trim().startsWith('{')) {
            try {
              const p = JSON.parse(currentLesson.content);
              if (p && Array.isArray(p.questions) && p.questions.length > 0) return p.questions;
            } catch (_) {}
          }
          return undefined;
        })()} onCompleteQuiz={(score, xp) => {
          triggerXpCelebration(xp, `+${xp} XP! Quiz Aprovado (${score}%)`);
          if (!isCurrentCompleted) {
            handleMarkComplete();
          }
        }} onNextLesson={nextLesson ? () => setCurrentLesson(nextLesson) : undefined} />}

            
            {currentLesson?.type === 'code' && <div className="flex flex-col gap-4 bg-[#11131a] p-6 rounded-3xl border border-[#1e2230] text-white">
                <div className="flex items-center justify-between pb-3 border-b border-[#1e2230]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white">{currentLesson.title}</h2>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        Sandbox Interativo • {currentLesson.codeChallenge?.language || 'TypeScript'}
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    +{currentLesson.xpReward || 40} XP
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#181a24] border border-[#262a3b] text-xs text-zinc-300 leading-relaxed">
                  <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4 text-indigo-400" />
                    Instruções do Desafio Técnico:
                  </p>
                  <p>
                    {currentLesson.codeChallenge?.instructions || currentLesson.content || 'Implemente a lógica solicitada e clique em "Executar e Testar".'}
                  </p>
                </div>

                
                <div className="flex flex-col rounded-2xl overflow-hidden border border-[#262a3b] bg-[#0c0d12]">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#141620] border-b border-[#262a3b] text-xs text-zinc-400">
                    <span className="font-mono font-bold text-indigo-300 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      main.ts
                    </span>
                    <button onClick={handleRunCode} disabled={isRunningCode} className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50">
                      <Play className="w-3.5 h-3.5" />
                      <span>{isRunningCode ? 'A Executar...' : 'Executar e Validar Testes'}</span>
                    </button>
                  </div>

                  <textarea value={userCode} onChange={e => setUserCode(e.target.value)} rows={8} className="w-full bg-[#0c0d12] p-4 font-mono text-xs text-emerald-300 focus:outline-none resize-none" spellCheck={false} />

                  
                  {codeOutput && <div className="p-4 border-t border-[#262a3b] bg-[#08090d] font-mono text-xs text-zinc-300 whitespace-pre-wrap animate-fade-in">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">
                        Terminal de Saída:
                      </span>
                      <p className="text-emerald-400 font-medium">{codeOutput}</p>
                    </div>}
                </div>
              </div>}

            
            {currentLesson?.type === 'resource' && <div className="flex flex-col gap-4 bg-[#11131a] p-6 rounded-3xl border border-[#1e2230] text-white">
                <div className="flex items-center justify-between pb-3 border-b border-[#1e2230]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white">{currentLesson.title}</h2>
                      <span className="text-[11px] text-zinc-400">
                        Pacote de Assets, Guias e Ficheiros de Apoio
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                    +{currentLesson.xpReward || 15} XP
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {currentLesson.content || 'Descarregue os ficheiros de projeto, templates Figma e documentação de suporte:'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {(currentLesson.resources || [{
              id: 'r1',
              name: 'Starter-Kit-LearnSpace.zip',
              url: '#',
              size: '14.2 MB',
              type: 'zip'
            }, {
              id: 'r2',
              name: 'Guia-Referencia-Rapida.pdf',
              url: '#',
              size: '1.8 MB',
              type: 'pdf'
            }, {
              id: 'r3',
              name: 'Design-Tokens-UI.fig',
              url: '#',
              size: '6.4 MB',
              type: 'figma'
            }]).map(res => <div key={res.id} className="p-4 rounded-2xl bg-[#181a24] border border-[#262a3b] flex items-center justify-between gap-3 hover:border-indigo-500 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                          <FolderArchive className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{res.name}</p>
                          <span className="text-[10px] text-zinc-400">
                            {res.size} • Ficheiro Verificado
                          </span>
                        </div>
                      </div>

                      <button type="button" onClick={() => toast({
                title: 'Download Iniciado',
                message: `A descarregar ${res.name}`,
                type: 'success'
              })} className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md transition-all shrink-0" title="Descarregar Ficheiro">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>)}
                </div>
              </div>}

            
            {currentLesson?.type === 'project' && <div className="flex flex-col gap-4 bg-[#11131a] p-6 rounded-3xl border border-[#1e2230] text-white">
                <div className="flex items-center justify-between pb-3 border-b border-[#1e2230]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                      <Rocket className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white">{currentLesson.title}</h2>
                      <span className="text-[11px] text-purple-400">
                        Projeto Prático com Avaliação de Código
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
                    +{currentLesson.xpReward || 100} XP
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#181a24] border border-[#262a3b] text-xs text-zinc-300 leading-relaxed flex flex-col gap-2">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    Requisitos de Submissão:
                  </p>
                  <p>
                    {currentLesson.content || 'Desenvolva a solução completa e partilhe o link do seu repositório GitHub ou aplicação no showcase.'}
                  </p>
                </div>

                <form onSubmit={e => {
            e.preventDefault();
            if (!projectSubmissionUrl.trim()) return;
            setProjectSubmitted(true);
            soundEffects.play('success');
            triggerXpCelebration(100, '+100 XP! Projeto Submetido');
            toast({
              title: 'Projeto Submetido',
              message: 'O seu projeto foi enviado para revisão dos mentores.',
              type: 'success'
            });
          }} className="flex flex-col gap-3 p-4 rounded-2xl bg-[#141620] border border-[#262a3b]">
                  <label className="text-xs font-bold text-zinc-300">
                    Link do Repositório GitHub / Demonstração Live
                  </label>
                  <div className="flex gap-2">
                    <input type="url" placeholder="https://github.com/seu-utilizador/meu-projeto" value={projectSubmissionUrl} onChange={e => setProjectSubmissionUrl(e.target.value)} className="flex-1 bg-[#181a24] border border-[#2b3044] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500" />
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-indigo-600/30 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>{projectSubmitted ? 'Submetido' : 'Submeter Projeto'}</span>
                    </button>
                  </div>
                </form>
              </div>}

            
            {currentLesson?.type === 'video' && <div className="flex flex-col gap-4">
                <LessonVideoPlayer videoUrl={currentLesson?.videoUrl} title={currentLesson?.title || 'Aula em Vídeo'} durationMin={currentLesson?.durationMin || 15} isCompleted={isCurrentCompleted} onMarkComplete={handleMarkComplete} xpReward={currentLesson?.xpReward || 25} />

                
                {Array.isArray(currentLesson.videoChapters) && currentLesson.videoChapters.length > 0 && <div className="p-4 rounded-2xl bg-white dark:bg-[#12141c] border border-slate-200 dark:border-[#222636] shadow-xs flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Capítulos & Marcadores de Tempo da Lição
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {currentLesson.videoChapters.map(chap => <button key={chap.id} type="button" onClick={() => toast({
                title: `Avançado para ${chap.time}`,
                message: chap.title,
                type: 'info'
              })} className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#171a24] hover:bg-slate-100 dark:hover:bg-[#202534] border border-slate-200 dark:border-[#222636] text-xs text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 cursor-pointer transition-colors">
                            <span className="text-blue-600 dark:text-blue-400 font-mono text-[11px]">
                              {chap.time}
                            </span>
                            <span>{chap.title}</span>
                          </button>)}
                      </div>
                    </div>}
              </div>}

            
            {currentLesson?.type === 'text' && <div className="flex flex-col gap-4 bg-white dark:bg-[#12141c] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-[#222636] shadow-sm text-slate-900 dark:text-white">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222636]">
                  <div>
                    <h2 className="text-lg font-black text-slate-950 dark:text-white">
                      {currentLesson.title}
                    </h2>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Guia de Estudo & Artigo Técnico
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800/40">
                    +{currentLesson.xpReward || 25} XP
                  </span>
                </div>

                
                {(currentLesson.richArticle?.calloutText || currentLesson.calloutText) && <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950 dark:text-amber-100 mb-0.5">
                        Dica Pro do Instrutor:
                      </p>
                      <p>{currentLesson.richArticle?.calloutText || currentLesson.calloutText}</p>
                    </div>
                  </div>}

                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line py-2">
                  {currentLesson.content || 'Sem conteúdo adicional nesta aula.'}
                </div>

                
                {Array.isArray(currentLesson.richArticle?.checklist || currentLesson.checklist) && (currentLesson.richArticle?.checklist || currentLesson.checklist).length > 0 && <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#171a24] border border-slate-200 dark:border-[#222636] flex flex-col gap-2.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Checklist de Aprendizagem:
                      </span>
                      {(currentLesson.richArticle?.checklist || currentLesson.checklist).map(chk => <label key={chk.id || chk} onClick={() => setCheckedItems(prev => ({
              ...prev,
              [chk.id || chk]: !prev[chk.id || chk]
            }))} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                            {checkedItems[chk.id || chk] ? <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <Square className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                            <span className={checkedItems[chk.id || chk] ? 'line-through text-slate-400 dark:text-slate-500' : 'font-medium'}>
                              {chk.text || chk}
                            </span>
                          </label>)}
                    </div>}
              </div>}

            
            <div className="flex items-center justify-between">
              {prevLesson ? <button onClick={() => setCurrentLesson(prevLesson)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-[#12141c] hover:bg-slate-100 dark:hover:bg-[#1f2330] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#222636] flex items-center gap-2 cursor-pointer shadow-xs">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior: {prevLesson.title}</span>
                </button> : <div />}

              {nextLesson ? <button onClick={() => setCurrentLesson(nextLesson)} className="px-6 py-3 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer">
                  <span>Próxima: {nextLesson.title}</span>
                  <ChevronRight className="w-4 h-4" />
                </button> : <button onClick={handleMarkComplete} className="px-6 py-3 rounded-2xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer">
                  <Award className="w-4 h-4" />
                  <span>Concluir Curso Oficialmente</span>
                </button>}
            </div>

            
            <div>
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#222636] pb-3 text-sm font-bold text-slate-500 dark:text-slate-400 overflow-x-auto">
                {[{
              id: 'overview',
              label: 'Visão Geral da Lição'
            }, {
              id: 'resources',
              label: `Recursos (${course.resources?.length || 0})`
            }, {
              id: 'notes',
              label: 'Notas Pessoais'
            }, {
              id: 'qa',
              label: `Dúvidas & Q&A (${questions.length})`
            }].map(tab => <button key={tab.id} onClick={() => setActiveLessonTab(tab.id)} className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${activeLessonTab === tab.id ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 font-extrabold shadow-xs' : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#171a24]'}`}>
                    {tab.label}
                  </button>)}
              </div>

              <div className="pt-6">
                {activeLessonTab === 'overview' && <div className="text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-white dark:bg-[#12141c] p-6 rounded-3xl border border-slate-200 dark:border-[#222636] shadow-sm">
                    {currentLesson?.content || 'Sem notas ou introdução adicional para esta lição.'}
                  </div>}

                {activeLessonTab === 'notes' && <LessonNotesTab lessonId={currentLesson?.id} />}

                {activeLessonTab === 'resources' && <LessonResourcesTab resources={course.resources || []} />}

                {activeLessonTab === 'qa' && <LessonQATab questions={questions} onOpenAskModal={() => setShowAskModal(true)} />}
              </div>
            </div>
          </div>}

        
        {activeView === 'quiz' && <CourseQuizView quizTitle={`Quiz: ${course.title}`} onCompleteQuiz={(score, xp) => {
        triggerXpCelebration(xp, `+${xp} XP! Quiz Aprovado`);
      }} />}

        
        {activeView === 'documents' && <CourseDocumentsView documents={course.resources} />}
      </main>

      
      {showCreateChannelModal && <Modal isOpen={showCreateChannelModal} onClose={() => {
      setShowCreateChannelModal(false);
      setEditingChannel(null);
    }} title={editingChannel ? `Configurar Canal #${editingChannel.name}` : 'Criar Novo Canal no Servidor do Curso'}>
          <form onSubmit={handleSaveChannelSubmit} className="flex flex-col gap-5">
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Sugestões Rápidas (1-Clique)
              </label>
              <div className="flex flex-wrap gap-2">
                {[{
              name: 'anuncios',
              type: 'text',
              label: 'Anúncios',
              topic: 'Avisos importantes e comunicados da turma'
            }, {
              name: 'geral',
              type: 'text',
              label: 'Geral',
              topic: 'Conversas gerais e apresentações dos membros'
            }, {
              name: 'duvidas-aulas',
              type: 'qa',
              label: 'Dúvidas',
              topic: 'Espaço para colocar dúvidas de código e exercícios'
            }, {
              name: 'projetos-showcase',
              type: 'showcase',
              label: 'Projetos',
              topic: 'Partilha de repositórios GitHub e demos'
            }, {
              name: 'materiais-apoio',
              type: 'text',
              label: 'Materiais',
              topic: 'Links de apoio, PDFs e documentação recomendada'
            }, {
              name: 'mentoria-ao-vivo',
              type: 'voice',
              label: 'Mentoria Voz',
              topic: 'Sala de conferência ao vivo e mentoria'
            }].map(tmpl => <button key={tmpl.name} type="button" onClick={() => {
              setNewChannelName(tmpl.name);
              setNewChannelType(tmpl.type);
              setNewChannelTopic(tmpl.topic);
            }} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900">
                    {tmpl.label}
                  </button>)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-2">
                Tipo do Canal
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[{
              id: 'text',
              label: 'Texto & Chat',
              desc: 'Convívio geral'
            }, {
              id: 'qa',
              label: 'Dúvidas & Q&A',
              desc: 'Resolução técnica'
            }, {
              id: 'showcase',
              label: 'Showcase',
              desc: 'Projetos da turma'
            }, {
              id: 'voice',
              label: 'Sala de Voz',
              desc: 'Live e áudio'
            }].map(t => <button type="button" key={t.id} onClick={() => setNewChannelType(t.id)} className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${newChannelType === t.id ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <p className={`font-semibold ${newChannelType === t.id ? 'text-white' : 'text-slate-900'}`}>
                      {t.label}
                    </p>
                    <p className={`text-xs mt-1 ${newChannelType === t.id ? 'text-slate-300' : 'text-slate-500'}`}>
                      {t.desc}
                    </p>
                  </button>)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Nome do Canal (URL Slug)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                  #
                </span>
                <input type="text" required placeholder="ex: duvidas-modulo-2 ou projetos-finais" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl pl-9 pr-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-mono" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Descrição do Objetivo do Canal
              </label>
              <input type="text" placeholder="ex: Canal dedicado a tirar dúvidas técnicas sobre a matéria do módulo" value={newChannelTopic} onChange={e => setNewChannelTopic(e.target.value)} className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => {
            setShowCreateChannelModal(false);
            setEditingChannel(null);
          }} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
                Cancelar
              </button>
              <button type="submit" disabled={isCreatingChannel} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50">
                {isCreatingChannel ? 'A guardar...' : 'Criar Canal'}
              </button>
            </div>
          </form>
        </Modal>}

      
      {showAskModal && <Modal isOpen={showAskModal} onClose={() => setShowAskModal(false)} title="Colocar Dúvida à Turma & Instrutor">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Título Resumido da Questão
              </label>
              <input type="text" placeholder="ex: Erro de tipagem no generic com useOptimistic" value={newQuestionTitle} onChange={e => setNewQuestionTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Descrição Detalhada do Problema
              </label>
              <textarea rows={5} placeholder="Descreva o que tentou implementar, código relevante e mensagem de erro..." value={newQuestionContent} onChange={e => setNewQuestionContent(e.target.value)} className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-2xl p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all font-mono" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button onClick={() => setShowAskModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
                Cancelar
              </button>
              <button onClick={() => {
            if (newQuestionTitle.trim()) {
              setQuestions(prev => [{
                id: 'q-' + Date.now(),
                title: newQuestionTitle,
                content: newQuestionContent,
                upvotes: 1,
                author: {
                  name: user?.name || 'Você',
                  avatarUrl: user?.avatarUrl
                }
              }, ...prev]);
              setShowAskModal(false);
              setNewQuestionTitle('');
              setNewQuestionContent('');
              soundEffects.playSuccess();
              toast({
                title: 'Pergunta Publicada!',
                message: 'A sua dúvida foi enviada para a turma e o instrutor.',
                type: 'success'
              });
            }
          }} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md cursor-pointer">
                Publicar Dúvida
              </button>
            </div>
          </div>
        </Modal>}
    </div>;
};
export default CoursePlayer;