import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Hash, Radio, HelpCircle, FileCode2, Check, Award, ChevronRight, ChevronLeft, Video, Download, FolderArchive, Lightbulb, CheckSquare, Square, Rocket, Clock, CheckCircle2, Menu, BookOpen, Plus, Settings, Users, Lock, Sparkles, PhoneCall } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { useToast } from '../../../components/ui/Toast';
import { useActiveCall } from '../../../context/ActiveCallContext';
import { api } from '../../../services/api';
import { soundEffects } from '../../../services/soundEffects';
import { CallStage } from '../../../components/call/CallStage';
import { JoinCallModal } from '../../../components/call/JoinCallModal';
import { CourseServerSidebar } from '../../../features/learn/components/CourseServerSidebar';
import { LessonVideoPlayer } from '../../../features/learn/components/LessonVideoPlayer';
import { CourseChannelChat } from '../../../features/learn/components/CourseChannelChat';
import { CourseQuizView } from '../../../features/learn/components/CourseQuizView';
import { CourseDocumentsView } from '../../../features/learn/components/CourseDocumentsView';
import { LessonNotesTab } from '../../../features/learn/components/LessonNotesTab';
import { LessonResourcesTab } from '../../../features/learn/components/LessonResourcesTab';
export const CoursePlayer = () => {
  const {
    courseId
  } = useParams();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    activeCall,
    startCall,
    endCall
  } = useActiveCall();
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
  const [activeView, setActiveView] = useState(() => {
    try {
      const savedCourseView = localStorage.getItem(`nexo_player_view_${courseId}`);
      const savedGlobal = localStorage.getItem('nexo_player_preferred_view');
      const candidate = savedCourseView || savedGlobal;
      if (candidate && ['lesson', 'channel', 'quiz', 'documents'].includes(candidate)) {
        return candidate;
      }
    } catch (e) {}
    return 'lesson';
  });

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view !== 'live-room') {
      try {
        localStorage.setItem(`nexo_player_view_${courseId}`, view);
        localStorage.setItem('nexo_player_preferred_view', view);
      } catch (e) {}
    }
  };

  const [currentTextChannel, setCurrentTextChannel] = useState(null);
  const [customChannels, setCustomChannels] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [liveRoomName, setLiveRoomName] = useState('Live Mentoria & Ecrã');
  const [inLiveRoom, setInLiveRoom] = useState(false);
  const [pendingJoinRoom, setPendingJoinRoom] = useState(null);
  const [liveRoomPreferences, setLiveRoomPreferences] = useState({ startMuted: false, startVideoOff: true });
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
  const [checkedItems, setCheckedItems] = useState({});
  const [projectSubmissionUrl, setProjectSubmissionUrl] = useState('');
  const [projectSubmitted, setProjectSubmitted] = useState(false);
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
          description: '',
          category: 'Geral',
          difficulty: 'Iniciante',
          modules: [],
          space: {
            id: courseId,
            name: 'Turma & Comunidade',
            channels: []
          }
        };
      }
      let modulesList = data.modules || [];
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
                }
              } catch (_) {}
            }
          });
        }
      });
      if (user && data.id && !data.isEnrolled && (data.isFree || Number(data.price || 0) <= 0)) {
        api.enrollCourse(data.id)
          .then(() => {
            window.dispatchEvent(new Event('nexo_courses_visibility_changed'));
          })
          .catch(() => {});
        data.isEnrolled = true;
      }
      setCourse(data);
      const completed = new Set();
      data.userEnrollment?.lessonProgresses?.forEach(lp => {
        if (lp.completed === 1 || lp.completed === true || lp.isCompleted) {
          completed.add(lp.lessonId);
        }
      });
      setCompletedLessonIds(completed);
      const allLessons = data.modules?.flatMap(m => m.lessons) || [];
      if (allLessons.length > 0) {
        let targetLesson = null;
        try {
          const savedLessonId = localStorage.getItem(`nexo_last_lesson_${data.id || courseId}`);
          if (savedLessonId) {
            targetLesson = allLessons.find(l => l.id === savedLessonId);
          }
        } catch (e) {}
        if (!targetLesson) {
          targetLesson = allLessons.find(l => !completed.has(l.id)) || allLessons[0];
        }
        setCurrentLesson(targetLesson);
      } else {
        setCurrentLesson(null);
      }
      if (data.space?.channels && data.space.channels.length > 0) {
        const mapped = data.space.channels.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type === 'voice' ? 'voice' : 'text',
          topic: c.topic || 'Canal do espaço da turma'
        }));
        setCustomChannels(mapped);
        const textChannels = mapped.filter(c => c.type === 'text');
        let targetChannel = textChannels[0] || mapped[0];
        try {
          const savedChannelId = localStorage.getItem(`nexo_player_channel_${data.id || courseId}`);
          if (savedChannelId) {
            const found = textChannels.find(c => c.id === savedChannelId);
            if (found) targetChannel = found;
          }
        } catch (e) {}
        setCurrentTextChannel(targetChannel);
      } else {
        setCustomChannels([]);
        setCurrentTextChannel(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCourse(null);
    setLoading(true);
    setCurrentTextChannel(null);
    setChannelMessages([]);
    setCustomChannels([]);

    const isThisCourseCall = Boolean(activeCall && String(activeCall.courseId) === String(courseId));
    if (isThisCourseCall) {
      setInLiveRoom(true);
      setLiveRoomName(activeCall.roomName || 'Sala ao Vivo');
      setActiveView('live-room');
    } else {
      setInLiveRoom(false);
      setLiveRoomName('');
      let preferred = 'lesson';
      try {
        const savedCourseView = localStorage.getItem(`nexo_player_view_${courseId}`);
        const savedGlobal = localStorage.getItem('nexo_player_preferred_view');
        const candidate = savedCourseView || savedGlobal;
        if (candidate && ['lesson', 'channel', 'quiz', 'documents'].includes(candidate)) {
          preferred = candidate;
        }
      } catch (e) {}
      setActiveView(preferred);
    }
    setPendingJoinRoom(null);
    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    if (currentLesson?.id && (course?.id || courseId)) {
      try {
        localStorage.setItem(`nexo_last_lesson_${course?.id || courseId}`, currentLesson.id);
      } catch (e) {}
    }
  }, [currentLesson?.id, course?.id, courseId]);

  useEffect(() => {
    const isThisCourseCall = Boolean(activeCall && String(activeCall.courseId) === String(courseId));
    if (isThisCourseCall) {
      setInLiveRoom(true);
      setLiveRoomName(activeCall.roomName || 'Sala ao Vivo');
    } else {
      setInLiveRoom(false);
      if (activeView === 'live-room') {
        let preferred = 'lesson';
        try {
          const savedCourseView = localStorage.getItem(`nexo_player_view_${courseId}`);
          const savedGlobal = localStorage.getItem('nexo_player_preferred_view');
          const candidate = savedCourseView || savedGlobal;
          if (candidate && ['lesson', 'channel', 'quiz', 'documents'].includes(candidate)) {
            preferred = candidate;
          }
        } catch (e) {}
        setActiveView(preferred);
      }
    }
  }, [activeCall, courseId]);

  useEffect(() => {
    const handleFocusCall = (e) => {
      const call = e.detail || activeCall;
      if (call && String(call.courseId) === String(courseId)) {
        setInLiveRoom(true);
        setLiveRoomName(call.roomName || 'Sala ao Vivo');
        setActiveView('live-room');
      }
    };
    window.addEventListener('nexo_focus_call', handleFocusCall);
    return () => window.removeEventListener('nexo_focus_call', handleFocusCall);
  }, [courseId, activeCall]);
  useEffect(() => {
    let isSubscribed = true;
    if (activeView === 'channel' && currentTextChannel) {
      setChannelMessages([]);
      joinChannel(currentTextChannel.id);
      api.getChannelMessages(currentTextChannel.id).then(msgs => {
        if (isSubscribed) {
          setChannelMessages(msgs || []);
        }
      }).catch(() => {
        if (isSubscribed) {
          setChannelMessages([{
            id: `msg-welcome-${currentTextChannel.id}`,
            senderId: course?.creatorId || 'creator',
            content: `Bem-vindos ao canal #${currentTextChannel.name}! Utilizem este espaço para interagir com a turma e o instrutor.`,
            createdAt: new Date().toISOString(),
            sender: {
              name: course?.creator?.name || 'Instrutor',
              username: 'instrutor',
              role: 'CREATOR'
            }
          }]);
        }
      });
      return () => {
        isSubscribed = false;
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
      setCourse(prev => {
        if (!prev) return prev;
        const updatedLessonProgresses = res.enrollment?.lessonProgresses || [
          ...(prev.userEnrollment?.lessonProgresses || []).filter(lp => lp.lessonId !== currentLesson.id),
          { enrollmentId: res.enrollment?.id, lessonId: currentLesson.id, completed: 1, isCompleted: true }
        ];
        return {
          ...prev,
          userEnrollment: {
            ...prev.userEnrollment,
            ...res.enrollment,
            lessonProgresses: updatedLessonProgresses,
            progressPercent: res.enrollment?.progressPercent ?? prev.userEnrollment?.progressPercent
          }
        };
      });
      soundEffects.playSuccess();
      toast({
        title: 'Aula Concluída!',
        message: `Progresso: ${res.enrollment?.progressPercent ?? 0}%`,
        type: 'success'
      });
    } catch (err) {
      toast({
        title: 'Erro',
        message: 'Não foi possível marcar a aula como concluída',
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
    try {
      const newMsg = await api.sendMessage(currentTextChannel.id, {
        content,
        replyToId: currentReply?.id
      });
      setChannelMessages(prev => prev.map(m => m.id === tempId ? newMsg : m));
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
      let newChannel = {
        id: editingChannel?.id || 'custom-' + Date.now(),
        name: formattedName,
        type: newChannelType,
        topic: newChannelTopic,
        guidingQuestion: newChannelQuestion
      };
      if (spaceId && !editingChannel) {
        try {
          const created = await api.createChannel(spaceId, {
            name: formattedName,
            type: newChannelType,
            topic: newChannelTopic
          });
          if (created && created.id) {
            newChannel = {
              ...newChannel,
              ...created,
              guidingQuestion: newChannelQuestion
            };
          }
        } catch (err) {
          console.warn('Falha ao persistir canal no servidor, a manter localmente:', err);
        }
      }
      if (editingChannel) {
        setCustomChannels(prev => prev.map(c => c.id === editingChannel.id ? newChannel : c));
      } else {
        setCustomChannels(prev => [...prev, newChannel]);
      }
      soundEffects.playSuccess();
      toast({
        title: editingChannel ? 'Canal Atualizado!' : 'Canal Criado!',
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
  const handleSelectChannel = (ch) => {
    if (currentTextChannel?.id !== ch.id) {
      setChannelMessages([]);
    }
    setCurrentTextChannel(ch);
    handleViewChange('channel');
    try {
      localStorage.setItem(`nexo_player_channel_${course?.id || courseId}`, ch.id);
    } catch (e) {}
  };

  const isCreatorOrAdmin = Boolean(user?.role === 'ADMIN' || user?.id === course?.creatorId || user?.id === course?.creator?.id || user?.id === course?.instructorId || course?.isCollaborator || course?.collaborators?.some(c => c.id === user?.id));
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
  const courseDocs = course.documents || course.resources || [];
  const courseQuizQuestions = (course.modules || []).flatMap(m =>
    (m.lessons || [])
      .filter(l => l.type === 'quiz')
      .flatMap(l => {
        if (Array.isArray(l.quiz?.questions) && l.quiz.questions.length > 0) return l.quiz.questions;
        if (typeof l.content === 'string' && l.content.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(l.content);
            if (Array.isArray(parsed?.questions)) return parsed.questions;
          } catch {}
        }
        return [];
      })
  );
  return <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-white selection:bg-blue-100">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <CourseServerSidebar courseTitle={course.title} courseId={course.id} isCreatorOrAdmin={isCreatorOrAdmin} customChannels={customChannels} currentTextChannel={currentTextChannel} activeView={activeView} inLiveRoom={inLiveRoom} liveRoomName={liveRoomName} modules={course.modules || []} currentLessonId={currentLesson?.id} completedLessonIds={completedLessonIds} resourcesCount={courseDocs.length} user={user} onSelectChannel={handleSelectChannel} onSelectLesson={les => {
          setCurrentLesson(les);
          handleViewChange('lesson');
          try {
            localStorage.setItem(`nexo_last_lesson_${course?.id || courseId}`, les.id);
          } catch (e) {}
        }} onSelectLiveRoom={room => {
          if (inLiveRoom && liveRoomName === room) {
            setActiveView('live-room');
          } else {
            setPendingJoinRoom(room);
          }
        }} onSelectQuiz={() => handleViewChange('quiz')} onSelectDocuments={() => handleViewChange('documents')} onOpenCreateChannel={(type = 'text') => {
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
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full bg-white dark:bg-[#090a0f] z-10 shadow-2xl">
            <CourseServerSidebar
              courseTitle={course.title}
              courseId={course.id}
              isCreatorOrAdmin={isCreatorOrAdmin}
              customChannels={customChannels}
              currentTextChannel={currentTextChannel}
              activeView={activeView}
              inLiveRoom={inLiveRoom}
              liveRoomName={liveRoomName}
              modules={course.modules || []}
              currentLessonId={currentLesson?.id}
              completedLessonIds={completedLessonIds}
              resourcesCount={courseDocs.length}
              user={user}
              onCloseMobile={() => setMobileSidebarOpen(false)}
              onSelectChannel={ch => {
                handleSelectChannel(ch);
                setMobileSidebarOpen(false);
              }}
              onSelectLesson={les => {
                setCurrentLesson(les);
                handleViewChange('lesson');
                try {
                  localStorage.setItem(`nexo_last_lesson_${course?.id || courseId}`, les.id);
                } catch (e) {}
                setMobileSidebarOpen(false);
              }}
              onSelectLiveRoom={room => {
                if (inLiveRoom && liveRoomName === room) {
                  setActiveView('live-room');
                } else {
                  setPendingJoinRoom(room);
                }
                setMobileSidebarOpen(false);
              }}
              onSelectQuiz={() => {
                handleViewChange('quiz');
                setMobileSidebarOpen(false);
              }}
              onSelectDocuments={() => {
                handleViewChange('documents');
                setMobileSidebarOpen(false);
              }}
              onOpenCreateChannel={(type = 'text') => {
                setMobileSidebarOpen(false);
                setEditingChannel(null);
                setNewChannelName('');
                setNewChannelType(type);
                setNewChannelTopic('');
                setNewChannelQuestion('');
                setShowCreateChannelModal(true);
              }}
              onOpenEditChannel={ch => {
                setMobileSidebarOpen(false);
                setEditingChannel(ch);
                setNewChannelName(ch.name);
                setNewChannelType(ch.type);
                setNewChannelTopic(ch.topic || '');
                setNewChannelQuestion(ch.guidingQuestion || '');
                setShowCreateChannelModal(true);
              }}
            />
          </div>
        </div>
      )}

      
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#090a0f] overflow-hidden">
        
        <header className="h-16 border-b border-slate-200 dark:border-[#222636] bg-white dark:bg-[#0c0d12] px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#171a24] md:hidden transition-colors cursor-pointer shrink-0"
              title="Abrir menu do curso"
              aria-label="Abrir menu do curso"
            >
              <Menu className="w-5 h-5" />
            </button>

            {activeView === 'channel' && (
              <div className="flex items-center gap-2 truncate max-w-[200px] xs:max-w-xs sm:max-w-md">
                {currentTextChannel?.type === 'qa' ? (
                  <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                ) : currentTextChannel?.type === 'showcase' ? (
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                ) : (currentTextChannel?.accessMode === 'announcement' || currentTextChannel?.name?.includes('anuncio')) ? (
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
                ) : (
                  <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                )}
                <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                  #{currentTextChannel?.name || 'geral'}
                </span>
                {currentTextChannel?.topic && (
                  <span className="text-sm text-slate-500 dark:text-neutral-400 hidden md:inline truncate max-w-md">
                    — {currentTextChannel.topic}
                  </span>
                )}
                {(currentTextChannel?.accessMode === 'announcement' || currentTextChannel?.name?.includes('anuncio')) && (
                  <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] uppercase">
                    Apenas Leitura
                  </span>
                )}
              </div>
            )}

            {activeView === 'lesson' && <div className="flex items-center gap-2 truncate max-w-[140px] xs:max-w-[220px] sm:max-w-md">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                  {currentLesson?.title || 'Aula em Vídeo'}
                </span>
              </div>}

            {activeView === 'live-room' && <div className="flex items-center gap-2 text-blue-600 truncate max-w-[140px] xs:max-w-[220px] sm:max-w-md">
                <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse text-red-500 shrink-0" />
                <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                  {liveRoomName}
                </span>
              </div>}

            {activeView === 'quiz' && <div className="flex items-center gap-2 truncate">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
                <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                  Quizzes
                </span>
              </div>}

            {activeView === 'documents' && <div className="flex items-center gap-2 truncate">
                <FileCode2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                  Documentos
                </span>
              </div>}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {activeView === 'channel' && (
              <button
                type="button"
                onClick={() => setShowMembersList(prev => !prev)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                  showMembersList
                    ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-[#1a1d28] dark:text-blue-400 dark:border-blue-900/50'
                    : 'text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:border-[#222636] dark:hover:bg-[#151720]'
                }`}
                title={showMembersList ? 'Ocultar Colegas e Instrutor' : 'Ver Colegas e Instrutor'}
                aria-label="Alternar lista de colegas"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Membros</span>
              </button>
            )}

            {isCreatorOrAdmin && (
              <Link
                to={`/creator/courses/${course.id}/edit?step=3`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#171a24] hover:bg-slate-200 dark:hover:bg-[#222636] text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                title="Adicionar ou gerir aulas e módulos"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Editar Aulas</span>
              </Link>
            )}

            {activeView === 'lesson' && currentLesson && <button onClick={handleMarkComplete} className={`px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2 transition-all cursor-pointer shrink-0 ${isCurrentCompleted ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'}`}>
                {isCurrentCompleted ? <>
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden xs:inline">Concluída</span>
                    <span className="xs:hidden">Feito</span>
                  </> : <>
                    <span className="hidden xs:inline">Marcar como Concluída</span>
                    <span className="xs:hidden">Concluir</span>
                  </>}
              </button>}

            {inLiveRoom && activeView !== 'live-room' && <button onClick={() => setActiveView('live-room')} className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md flex items-center gap-2 cursor-pointer">
                <Video className="w-4 h-4" />
                <span>Ver Transmissão</span>
              </button>}
          </div>
        </header>

        {activeView === 'live-room' && inLiveRoom && <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-slate-950 overflow-hidden">
            <CallStage key={`${courseId}_${liveRoomName || 'live'}`} roomName={liveRoomName || 'Sala ao Vivo do Curso'} roomId={`course_${courseId}_${(liveRoomName || 'live').toLowerCase().replace(/[^a-z0-9]/g, '_')}`} isStageMode={liveRoomName.toLowerCase().includes('dúvida') || liveRoomName.toLowerCase().includes('duvidas') || liveRoomName.toLowerCase().includes('mentoria')} initialMuted={liveRoomPreferences.startMuted} initialCameraOn={!liveRoomPreferences.startVideoOff} onDisconnect={() => {
          setInLiveRoom(false);
          endCall();
          const fallback = customChannels.find(c => c.type !== 'voice') || customChannels[0];
          if (fallback) {
            setCurrentTextChannel(fallback);
            handleViewChange('channel');
          } else {
            handleViewChange('lesson');
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

        
        {activeView === 'lesson' && (!currentLesson ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">
                Nenhuma aula publicada ainda
              </h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                {isCreatorOrAdmin
                  ? 'Este curso ainda não possui aulas adicionadas. Clique no botão abaixo para adicionar módulos e aulas no editor do curso.'
                  : 'O instrutor ainda está a preparar os conteúdos deste curso. Fique atento às novidades!'}
              </p>
              {isCreatorOrAdmin && (
                <Link
                  to={`/creator/courses/${course.id}/edit?step=3`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Aulas & Módulos</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 max-w-5xl mx-auto w-full flex flex-col gap-8">
            
            {currentLesson?.type === 'quiz' && <CourseQuizView quizTitle={currentLesson.quiz?.title || currentLesson.title || 'Questionário da Aula'} description={currentLesson.quiz?.description || (currentLesson.content && !currentLesson.content.trim().startsWith('{') ? currentLesson.content : 'Responda às questões práticas para testar os seus conhecimentos desta aula.')} passingScore={currentLesson.quiz?.passingScore || 70} xpReward={currentLesson.quiz?.xpReward || currentLesson.xpReward || 50} questions={currentLesson.quiz?.questions && currentLesson.quiz.questions.length > 0 ? currentLesson.quiz.questions : (() => {
          if (currentLesson.content && currentLesson.content.trim().startsWith('{')) {
            try {
              const p = JSON.parse(currentLesson.content);
              if (p && Array.isArray(p.questions) && p.questions.length > 0) return p.questions;
            } catch (_) {}
          }
          return undefined;
        })()} onCompleteQuiz={() => {
          if (!isCurrentCompleted) {
            handleMarkComplete();
          }
        }} onNextLesson={nextLesson ? () => setCurrentLesson(nextLesson) : undefined} />}



            
            {currentLesson?.type === 'resource' && <div className="flex flex-col gap-4 bg-[#11131a] p-6 rounded-xl border border-[#1e2230] text-white">
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
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {currentLesson.content || 'Descarregue os ficheiros de projeto, templates Figma e documentação de suporte:'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {(currentLesson.resources || [{
              id: 'r1',
              name: 'Starter-Kit-NEXO.zip',
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

            
            {currentLesson?.type === 'project' && <div className="flex flex-col gap-4 bg-[#11131a] p-6 rounded-xl border border-[#1e2230] text-white">
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
                        Capítulos & Marcadores de Tempo da Aula
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

            
            {currentLesson?.type === 'text' && <div className="flex flex-col gap-4 bg-white dark:bg-[#12141c] p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-[#222636] shadow-sm text-slate-900 dark:text-white">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222636]">
                  <div>
                    <h2 className="text-lg font-black text-slate-950 dark:text-white">
                      {currentLesson.title}
                    </h2>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Guia de Estudo & Artigo Técnico
                    </span>
                  </div>
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

            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {prevLesson ? (
                <button
                  onClick={() => setCurrentLesson(prevLesson)}
                  className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-[#12141c] hover:bg-slate-100 dark:hover:bg-[#1f2330] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#222636] flex items-center justify-center sm:justify-start gap-2 cursor-pointer shadow-xs min-w-0"
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  <span className="truncate">Anterior: {prevLesson.title}</span>
                </button>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <button
                  onClick={() => setCurrentLesson(nextLesson)}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center sm:justify-end gap-2 cursor-pointer min-w-0"
                >
                  <span className="truncate">Próxima: {nextLesson.title}</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              ) : (
                <button
                  onClick={handleMarkComplete}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer min-w-0"
                >
                  <Award className="w-4 h-4 shrink-0" />
                  <span>Concluir Curso Oficialmente</span>
                </button>
              )}
            </div>

            
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 dark:border-[#222636] pb-3 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 overflow-x-auto no-scrollbar">
                {[{
              id: 'overview',
              label: 'Visão Geral da Aula'
            }, {
              id: 'resources',
              label: `Recursos (${courseDocs.length})`
            }, {
              id: 'notes',
              label: 'Notas Pessoais'
            }].map(tab => <button key={tab.id} onClick={() => setActiveLessonTab(tab.id)} className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${activeLessonTab === tab.id ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 font-extrabold shadow-xs' : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#171a24]'}`}>
                    {tab.label}
                  </button>)}
              </div>

              <div className="pt-6">
                {activeLessonTab === 'overview' && <div className="text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-white dark:bg-[#12141c] p-6 rounded-xl border border-slate-200 dark:border-[#222636] shadow-sm">
                    {currentLesson?.content || 'Sem notas ou introdução adicional para esta aula.'}
                  </div>}

                {activeLessonTab === 'notes' && <LessonNotesTab lessonId={currentLesson?.id} />}

                {activeLessonTab === 'resources' && <LessonResourcesTab resources={courseDocs} />}
              </div>
            </div>
          </div>))}

        
        {activeView === 'quiz' && <CourseQuizView quizTitle={`Quiz: ${course.title}`} questions={courseQuizQuestions.length > 0 ? courseQuizQuestions : undefined} onCompleteQuiz={() => {}} />}

        
        {activeView === 'documents' && <CourseDocumentsView documents={courseDocs} />}
      </main>

      
      {showCreateChannelModal && <Modal isOpen={showCreateChannelModal} onClose={() => {
      setShowCreateChannelModal(false);
      setEditingChannel(null);
    }} title={editingChannel ? `Configurar Canal #${editingChannel.name}` : 'Criar Novo Canal no Servidor do Curso'}>
          <form onSubmit={handleSaveChannelSubmit} className="flex flex-col gap-5">
            
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
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
            }} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#151720] hover:bg-slate-100 dark:hover:bg-neutral-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900">
                    {tmpl.label}
                  </button>)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-2">
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
            }].map(t => <button type="button" key={t.id} onClick={() => setNewChannelType(t.id)} className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${newChannelType === t.id ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-500 font-medium shadow-xs' : 'bg-white dark:bg-[#151720] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800'}`}>
                    <p className={`font-semibold ${newChannelType === t.id ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {t.label}
                    </p>
                    <p className={`text-xs mt-1 ${newChannelType === t.id ? 'text-slate-300 dark:text-blue-100' : 'text-slate-500 dark:text-zinc-400'}`}>
                      {t.desc}
                    </p>
                  </button>)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-white mb-1.5">
                Nome do Canal (URL Slug)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                  #
                </span>
                <input type="text" required placeholder="ex: duvidas-modulo-2 ou projetos-finais" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="w-full bg-slate-50 dark:bg-[#151720] border border-slate-300 dark:border-neutral-700 focus:border-blue-600 focus:bg-white dark:focus:bg-[#151720] rounded-xl pl-9 pr-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all font-mono" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-white mb-1.5">
                Descrição do Objetivo do Canal
              </label>
              <input type="text" placeholder="ex: Canal dedicado a tirar dúvidas técnicas sobre a matéria do módulo" value={newChannelTopic} onChange={e => setNewChannelTopic(e.target.value)} className="w-full bg-slate-50 dark:bg-[#151720] border border-slate-300 dark:border-neutral-700 focus:border-blue-600 focus:bg-white dark:focus:bg-[#151720] rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-neutral-800">
              <button type="button" onClick={() => {
            setShowCreateChannelModal(false);
            setEditingChannel(null);
          }} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer">
                Cancelar
              </button>
              <button type="submit" disabled={isCreatingChannel} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50">
                {isCreatingChannel ? 'A guardar...' : 'Criar Canal'}
              </button>
            </div>
          </form>
        </Modal>}



      {/* Modal de confirmação com informações principais antes de entrar na chamada */}
      <JoinCallModal
        isOpen={Boolean(pendingJoinRoom)}
        roomName={pendingJoinRoom}
        contextTitle={course?.title}
        onClose={() => setPendingJoinRoom(null)}
        onConfirm={({ startMuted, startVideoOff }) => {
          const room = pendingJoinRoom;
          if (activeCall) {
            endCall();
          }
          setLiveRoomPreferences({ startMuted, startVideoOff });
          const roomId = `course_${courseId}_${(room || 'live').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          setLiveRoomName(room);
          setInLiveRoom(true);
          setActiveView('live-room');
          soundEffects.playJoinCall();
          startCall({
            roomId,
            roomName: room,
            contextTitle: course?.title || 'Curso',
            courseId: courseId,
            returnUrl: `/learn/${courseId}`
          });
          setPendingJoinRoom(null);
        }}
      />
    </div>;
};
export default CoursePlayer;