import { ProjectSubmission } from '../../components/ProjectSubmission';
import './CoursePlayerPage.css';
import CourseCompletion from '../../components/CourseCompletion/CourseCompletion';
import { safeExternalUrl } from '../../utils/safeUrl';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  LuPlay as Play,
  LuHash as Hash,
  LuRadio as Radio,
  LuCircleHelp as HelpCircle,
  LuFileCode2 as FileCode2,
  LuCheck as Check,
  LuAward as Award,
  LuChevronRight as ChevronRight,
  LuChevronLeft as ChevronLeft,
  LuVideo as Video,
  LuLightbulb as Lightbulb,
  LuSquareCheck as CheckSquare,
  LuSquare as Square,
  LuMenu as Menu,
  LuBookOpen as BookOpen,
  LuPlus as Plus,
  LuSettings as Settings,
  LuUsers as Users,
  LuLock as Lock,
  LuSparkles as Sparkles,
} from 'react-icons/lu';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/Toast';
import { useActiveCall } from '../../context/ActiveCallContext';
import { api } from '../../services/api';
import { soundEffects } from '../../services/soundEffects';
import { CallStage } from '../../components/CallStage';
import { JoinCallModal } from '../../components/JoinCallModal';
import { CourseServerSidebar } from '../../components/CourseServerSidebar';
import { CourseChannelChat } from '../../components/CourseChannelChat';
import { CourseQuizView } from '../../components/CourseQuizView';
import { CourseDocumentsView } from '../../components/CourseDocumentsView';
import { LessonNotesTab } from '../../components/LessonNotesTab';
import { LessonResourcesTab } from '../../components/LessonResourcesTab';
export const CoursePlayerPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeCall, startCall, endCall } = useActiveCall();
  const { socket, joinChannel, leaveChannel } = useSocket();
  const { toast } = useToast();
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
    } catch {}
    return 'lesson';
  });
  const handleViewChange = (view) => {
    setActiveView(view);
    if (view !== 'live-room') {
      try {
        localStorage.setItem(`nexo_player_view_${courseId}`, view);
        localStorage.setItem('nexo_player_preferred_view', view);
      } catch {}
    }
  };
  const [currentTextChannel, setCurrentTextChannel] = useState(null);
  const [customChannels, setCustomChannels] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [liveRoomName, setLiveRoomName] = useState('Live Mentoria & Ecrã');
  const [inLiveRoom, setInLiveRoom] = useState(false);
  const [pendingJoinRoom, setPendingJoinRoom] = useState(null);
  const [liveRoomPreferences, setLiveRoomPreferences] = useState({
    startMuted: false,
    startVideoOff: true,
  });
  const [activeLessonTab, setActiveLessonTab] = useState('overview');
  const [channelMessages, setChannelMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showMembersList, setShowMembersList] = useState(true);
  const resolvedMessageIds = new Set(
    channelMessages.filter((message) => message.isResolved).map((message) => message.id),
  );
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('text');
  const [newChannelTopic, setNewChannelTopic] = useState('');
  const [newChannelQuestion, setNewChannelQuestion] = useState('');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const fetchCourseData = async () => {
    if (!courseId) return;
    try {
      let data = null;
      try {
        data = await api.get(`/courses/${courseId}`).then(({ data }) => data);
      } catch {
        try {
          const spaceData = await api.get(`/spaces/${courseId}`).then(({ data }) => data);
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
              space: spaceData,
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
            channels: [],
          },
        };
      }
      let modulesList = data.modules || [];
      modulesList.forEach((mod) => {
        if (Array.isArray(mod.lessons)) {
          mod.lessons.forEach((les) => {
            if (
              les.content &&
              typeof les.content === 'string' &&
              les.content.trim().startsWith('{')
            ) {
              try {
                const parsed = JSON.parse(les.content);
                if (les.type === 'quiz') {
                  les.quiz = les.quiz || parsed;
                  les.content =
                    parsed.description ||
                    'Responda às questões práticas para testar os seus conhecimentos.';
                } else if (les.type === 'text') {
                  les.richArticle = les.richArticle || parsed;
                  les.content = parsed.markdown || '';
                }
              } catch {}
            }
          });
        }
      });
      const canManage =
        user && (user.role === 'ADMIN' || data.creator?.id === user.id || data.isCreator);
      if (!data.isEnrolled && !data.isMember && !data.space?.isMember && !canManage) {
        navigate(`/courses/${data.slug || data.id || courseId}`, { replace: true });
        return;
      }
      setCourse(data);
      const completed = new Set();
      data.userEnrollment?.lessonProgresses?.forEach((lp) => {
        if (lp.completed === 1 || lp.completed === true || lp.isCompleted) {
          completed.add(lp.lessonId);
        }
      });
      setCompletedLessonIds(completed);
      const allLessons = data.modules?.flatMap((m) => m.lessons) || [];
      if (allLessons.length > 0) {
        let targetLesson = null;
        try {
          const savedLessonId = localStorage.getItem(`nexo_last_lesson_${data.id || courseId}`);
          if (savedLessonId) {
            targetLesson = allLessons.find((l) => l.id === savedLessonId);
          }
        } catch {}
        if (!targetLesson) {
          targetLesson = allLessons.find((l) => !completed.has(l.id)) || allLessons[0];
        }
        setCurrentLesson(targetLesson);
      } else {
        setCurrentLesson(null);
      }
      if (data.space?.channels && data.space.channels.length > 0) {
        const mapped = data.space.channels.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type === 'voice' ? 'voice' : 'text',
          topic: c.topic || 'Canal do espaço da turma',
        }));
        setCustomChannels(mapped);
        const textChannels = mapped.filter((c) => c.type === 'text');
        let targetChannel = textChannels[0] || mapped[0];
        try {
          const savedChannelId = localStorage.getItem(`nexo_player_channel_${data.id || courseId}`);
          if (savedChannelId) {
            const found = textChannels.find((c) => c.id === savedChannelId);
            if (found) targetChannel = found;
          }
        } catch {}
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
    const isThisCourseCall = Boolean(
      activeCall && String(activeCall.courseId) === String(courseId),
    );
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
      } catch {}
      setActiveView(preferred);
    }
    setPendingJoinRoom(null);
    fetchCourseData();
  }, [courseId]);
  useEffect(() => {
    if (currentLesson?.id && (course?.id || courseId)) {
      try {
        localStorage.setItem(`nexo_last_lesson_${course?.id || courseId}`, currentLesson.id);
      } catch {}
    }
  }, [currentLesson?.id, course?.id, courseId]);
  useEffect(() => {
    const isThisCourseCall = Boolean(
      activeCall && String(activeCall.courseId) === String(courseId),
    );
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
        } catch {}
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
      api
        .get(`/channels/${currentTextChannel.id}/messages`)
        .then(({ data }) => data)
        .then((msgs) => {
          if (isSubscribed) {
            setChannelMessages(msgs || []);
          }
        })
        .catch(() => {
          if (isSubscribed) {
            setChannelMessages([
              {
                id: `msg-welcome-${currentTextChannel.id}`,
                senderId: course?.creatorId || 'creator',
                content: `Bem-vindos ao canal #${currentTextChannel.name}! Utilizem este espaço para interagir com a turma e o instrutor.`,
                createdAt: new Date().toISOString(),
                sender: {
                  name: course?.creator?.name || 'Instrutor',
                  username: 'instrutor',
                  role: 'CREATOR',
                },
              },
            ]);
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
    const handleNewMessage = (msg) => {
      if (msg.channelId === currentTextChannel?.id) {
        setChannelMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const optimisticIdx = prev.findIndex(
            (m) =>
              m.id.startsWith('temp-') &&
              (m.senderId === msg.senderId || m.sender?.username === msg.sender?.username) &&
              m.content === msg.content,
          );
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
      const res = await api
        .post(`/courses/${course.id}/lessons/${currentLesson.id}/complete`)
        .then(({ data }) => data);
      setCompletedLessonIds((prev) => new Set([...prev, currentLesson.id]));
      setCourse((prev) => {
        if (!prev) return prev;
        const updatedLessonProgresses = res.enrollment?.lessonProgresses || [
          ...(prev.userEnrollment?.lessonProgresses || []).filter(
            (lp) => lp.lessonId !== currentLesson.id,
          ),
          {
            enrollmentId: res.enrollment?.id,
            lessonId: currentLesson.id,
            completed: 1,
            isCompleted: true,
          },
        ];
        return {
          ...prev,
          certificate: res.certificate || prev.certificate,
          userEnrollment: {
            ...prev.userEnrollment,
            ...res.enrollment,
            lessonProgresses: updatedLessonProgresses,
            progressPercent:
              res.enrollment?.progressPercent ?? prev.userEnrollment?.progressPercent,
          },
        };
      });
      soundEffects.playSuccess();
      if (res.certificate?.id) {
        toast({
          title: 'Curso concluído!',
          message: 'O seu certificado foi emitido.',
          type: 'success',
        });
        navigate(`/certificates/verify/${encodeURIComponent(res.certificate.id)}`);
        return;
      }
      toast({
        title: 'Aula Concluída!',
        message: `Progresso: ${res.enrollment?.progressPercent ?? 0}%`,
        type: 'success',
      });
    } catch {
      toast({
        title: 'Erro',
        message: 'Não foi possível marcar a aula como concluída',
        type: 'error',
      });
    }
  };
  const handleSendChatMessage = async (e) => {
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
        role: user?.role || 'STUDENT',
      },
      replyTo: currentReply
        ? {
            id: currentReply.id,
            content: currentReply.content,
            sender: currentReply.sender,
          }
        : undefined,
      reactions: [],
    };
    setChatInput('');
    setReplyingTo(null);
    setChannelMessages((prev) => [...prev, optimisticMsg]);
    soundEffects.playMessage();
    try {
      const newMsg = await api
        .post(`/channels/${currentTextChannel.id}/messages`, {
          content,
          replyToId: currentReply?.id,
        })
        .then(({ data }) => data);
      setChannelMessages((prev) => prev.map((m) => (m.id === tempId ? newMsg : m)));
    } catch (error) {
      setChannelMessages((prev) => prev.filter((m) => m.id !== tempId));
      setChatInput(content);
      setReplyingTo(currentReply);
      toast({
        title: 'Mensagem não enviada',
        message: error.message,
        type: 'error',
      });
    }
  };
  const handleSaveChannelSubmit = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    setIsCreatingChannel(true);
    let spaceId = course?.spaceId || course?.space?.id;
    const formattedName = newChannelName.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    try {
      if (!spaceId) {
        const { data } = await api.post(`/creator/courses/${course.id}/community`);
        spaceId = data.spaceId;
        setCourse((current) => ({
          ...current,
          spaceId,
          hasCommunity: true,
          space: { id: spaceId, channels: [], members: [] },
        }));
      }
      const channelData = {
        name: formattedName,
        type: newChannelType,
        topic: newChannelTopic,
        guidingQuestion: newChannelQuestion,
      };
      const newChannel = editingChannel
        ? await api
            .put('/spaces/' + spaceId + '/channels/' + editingChannel.id, channelData)
            .then(({ data }) => data)
        : await api.post(`/spaces/${spaceId}/channels`, channelData).then(({ data }) => data);
      if (editingChannel) {
        setCustomChannels((prev) => prev.map((c) => (c.id === editingChannel.id ? newChannel : c)));
      } else {
        setCustomChannels((prev) => [...prev, newChannel]);
      }
      soundEffects.playSuccess();
      toast({
        title: editingChannel ? 'Canal Atualizado!' : 'Canal Criado!',
        message: `O canal #${newChannel.name} já está disponível no servidor do curso.`,
        type: 'success',
      });
      if (newChannelType === 'voice') {
        setLiveRoomName(newChannel.name);
        setPendingJoinRoom(newChannel.name);
      } else {
        setCurrentTextChannel(newChannel);
        setActiveView('channel');
      }
      setShowCreateChannelModal(false);
      setEditingChannel(null);
      setNewChannelName('');
      setNewChannelTopic('');
      setNewChannelQuestion('');
    } catch (error) {
      toast({
        title: 'Não foi possível guardar o canal',
        message: error.message,
        type: 'error',
      });
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
    } catch {}
  };
  const isCreatorOrAdmin = Boolean(
    user?.role === 'ADMIN' ||
    user?.id === course?.creatorId ||
    user?.id === course?.creator?.id ||
    user?.id === course?.instructorId ||
    course?.isCollaborator ||
    course?.collaborators?.some((c) => c.id === user?.id),
  );
  const allLessons = course?.modules?.flatMap((m) => m.lessons) || [];
  const currentLessonIndex = allLessons.findIndex((l) => l.id === currentLesson?.id);
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex !== -1 && currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;
  const isCurrentCompleted = completedLessonIds.has(currentLesson?.id);
  if (loading) {
    return (
      <div className="course-player-panel">
        <span className="course-player-label"></span>A carregar o ambiente do curso...
      </div>
    );
  }
  if (!course) {
    return <div className="course-player-panel-2">Curso não encontrado.</div>;
  }
  const courseDocs = course.documents || course.resources || [];
  return (
    <div className="course-player-panel-3">
      {/* Desktop Sidebar */}
      <div className="course-player-panel-4">
        <CourseServerSidebar
          courseTitle={course.title}
          hasCommunity={Boolean(course.hasCommunity)}
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
          onSelectChannel={handleSelectChannel}
          onSelectLesson={(les) => {
            setCurrentLesson(les);
            handleViewChange('lesson');
            try {
              localStorage.setItem(`nexo_last_lesson_${course?.id || courseId}`, les.id);
            } catch {}
          }}
          onSelectLiveRoom={(room) => {
            if (inLiveRoom && liveRoomName === room) {
              setActiveView('live-room');
            } else {
              setPendingJoinRoom(room);
            }
          }}
          onSelectQuiz={() => handleViewChange('quiz')}
          onSelectDocuments={() => handleViewChange('documents')}
          onOpenCreateChannel={(type = 'text') => {
            setEditingChannel(null);
            setNewChannelName('');
            setNewChannelType(type);
            setNewChannelTopic('');
            setNewChannelQuestion('');
            setShowCreateChannelModal(true);
          }}
          onOpenEditChannel={(ch) => {
            setEditingChannel(ch);
            setNewChannelName(ch.name);
            setNewChannelType(ch.type);
            setNewChannelTopic(ch.topic || '');
            setNewChannelQuestion(ch.guidingQuestion || '');
            setShowCreateChannelModal(true);
          }}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="course-player-panel-5">
          <div className="course-player-panel-6" onClick={() => setMobileSidebarOpen(false)} />
          <div className="course-player-panel-7">
            <CourseServerSidebar
              courseTitle={course.title}
              hasCommunity={Boolean(course.hasCommunity)}
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
              onSelectChannel={(ch) => {
                handleSelectChannel(ch);
                setMobileSidebarOpen(false);
              }}
              onSelectLesson={(les) => {
                setCurrentLesson(les);
                handleViewChange('lesson');
                try {
                  localStorage.setItem(`nexo_last_lesson_${course?.id || courseId}`, les.id);
                } catch {}
                setMobileSidebarOpen(false);
              }}
              onSelectLiveRoom={(room) => {
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
              onOpenEditChannel={(ch) => {
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

      <main className="course-player-main">
        {(course.certificate ||
          (allLessons.length > 0 &&
            allLessons.every((lesson) => completedLessonIds.has(lesson.id)))) && (
          <CourseCompletion courseId={course.id} certificate={course.certificate} />
        )}
        <header className="course-player-header">
          <div className="course-player-panel-8">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="course-player-button"
              title="Abrir menu do curso"
              aria-label="Abrir menu do curso"
            >
              <Menu className="course-player-menu" />
            </button>

            {activeView === 'channel' && (
              <div className="course-player-panel-9">
                {currentTextChannel?.type === 'qa' ? (
                  <HelpCircle className="course-player-help-circle" />
                ) : currentTextChannel?.type === 'showcase' ? (
                  <Sparkles className="course-player-sparkles" />
                ) : currentTextChannel?.accessMode === 'announcement' ||
                  currentTextChannel?.name?.includes('anuncio') ? (
                  <Lock className="course-player-lock" />
                ) : (
                  <Hash className="course-player-help-circle" />
                )}
                <span className="course-player-label-2">
                  #{currentTextChannel?.name || 'geral'}
                </span>
                {currentTextChannel?.topic && (
                  <span className="course-player-label-3">— {currentTextChannel.topic}</span>
                )}
                {(currentTextChannel?.accessMode === 'announcement' ||
                  currentTextChannel?.name?.includes('anuncio')) && (
                  <span className="course-player-label-4">Apenas Leitura</span>
                )}
              </div>
            )}

            {activeView === 'lesson' && (
              <div className="course-player-panel-10">
                <Play className="course-player-help-circle" />
                <span className="course-player-label-2">
                  {currentLesson?.title || 'Aula em Vídeo'}
                </span>
              </div>
            )}

            {activeView === 'live-room' && (
              <div className="course-player-panel-11">
                <Radio className="course-player-radio" />
                <span className="course-player-label-2">{liveRoomName}</span>
              </div>
            )}

            {activeView === 'quiz' && (
              <div className="course-player-panel-12">
                <HelpCircle className="course-player-help-circle-2" />
                <span className="course-player-label-2">Quizzes</span>
              </div>
            )}

            {activeView === 'documents' && (
              <div className="course-player-panel-12">
                <FileCode2 className="course-player-help-circle" />
                <span className="course-player-label-2">Documentos</span>
              </div>
            )}
          </div>

          <div className="course-player-panel-13">
            {activeView === 'channel' && (
              <button
                type="button"
                onClick={() => setShowMembersList((prev) => !prev)}
                className={`course-player-button-2 ${showMembersList ? 'course-player-button-3' : 'course-player-button-4'}`}
                title={showMembersList ? 'Ocultar Colegas e Instrutor' : 'Ver Colegas e Instrutor'}
                aria-label="Alternar lista de colegas"
              >
                <Users className="course-player-users" />
                <span className="course-player-label-5">Membros</span>
              </button>
            )}

            {isCreatorOrAdmin && (
              <Link
                to={`/creator/courses/${course.id}/edit?step=3`}
                className="course-player-link"
                title="Adicionar ou gerir aulas e módulos"
              >
                <Settings className="course-player-settings" />
                <span>Editar Aulas</span>
              </Link>
            )}

            {activeView === 'lesson' && currentLesson && (
              <button
                onClick={handleMarkComplete}
                className={`course-player-button-5 ${isCurrentCompleted ? 'course-player-button-6' : 'course-player-button-7'}`}
              >
                {isCurrentCompleted ? (
                  <>
                    <Check className="course-player-check" />
                    <span className="course-player-label-6">Concluída</span>
                    <span className="course-player-label-7">Feito</span>
                  </>
                ) : (
                  <>
                    <span className="course-player-label-6">Marcar como Concluída</span>
                    <span className="course-player-label-7">Concluir</span>
                  </>
                )}
              </button>
            )}

            {inLiveRoom && activeView !== 'live-room' && (
              <button onClick={() => setActiveView('live-room')} className="course-player-button-8">
                <Video className="course-player-users" />
                <span>Ver Transmissão</span>
              </button>
            )}
          </div>
        </header>

        {activeView === 'live-room' && inLiveRoom && (
          <div className="course-player-panel-14">
            <CallStage
              key={`${courseId}_${liveRoomName || 'live'}`}
              roomName={liveRoomName || 'Sala ao Vivo do Curso'}
              roomId={
                customChannels.find(
                  (channel) => channel.name === liveRoomName && channel.type === 'voice',
                )?.id
              }
              isStageMode={
                liveRoomName.toLowerCase().includes('dúvida') ||
                liveRoomName.toLowerCase().includes('duvidas') ||
                liveRoomName.toLowerCase().includes('mentoria')
              }
              initialMuted={liveRoomPreferences.startMuted}
              initialCameraOn={!liveRoomPreferences.startVideoOff}
              onDisconnect={() => {
                setInLiveRoom(false);
                endCall();
                const fallback =
                  customChannels.find((c) => c.type !== 'voice') || customChannels[0];
                if (fallback) {
                  setCurrentTextChannel(fallback);
                  handleViewChange('channel');
                } else {
                  handleViewChange('lesson');
                }
              }}
            />
          </div>
        )}

        {activeView === 'channel' && currentTextChannel && (
          <CourseChannelChat
            channel={currentTextChannel}
            messages={channelMessages}
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            onSendMessage={handleSendChatMessage}
            replyingTo={replyingTo}
            onSetReplyingTo={setReplyingTo}
            onToggleResolve={
              isCreatorOrAdmin
                ? async (msgId) => {
                    try {
                      const result = await api
                        .post('/messages/' + msgId + '/resolve')
                        .then(({ data }) => data);
                      setChannelMessages((prev) =>
                        prev.map((m) =>
                          m.id === msgId
                            ? {
                                ...m,
                                isResolved: result.isResolved,
                              }
                            : m,
                        ),
                      );
                    } catch (error) {
                      toast({
                        title: 'Não foi possível atualizar a dúvida',
                        message: error.message,
                        type: 'error',
                      });
                    }
                  }
                : undefined
            }
            resolvedMessageIds={resolvedMessageIds}
            showMembersList={showMembersList}
            onToggleMembersList={() => setShowMembersList(!showMembersList)}
            isCreatorOrAdmin={isCreatorOrAdmin}
            creatorUser={course.creator}
            currentUserId={user?.id}
            onInsertGuidingPrompt={(prompt) => setChatInput(`${prompt}\n\n`)}
            classmates={course?.classmates || []}
          />
        )}

        {activeView === 'lesson' &&
          (!currentLesson ? (
            <div className="course-player-panel-15">
              <div className="course-player-panel-16">
                <BookOpen className="course-player-book-open" />
              </div>
              <h3 className="course-player-subheading">Nenhuma aula publicada ainda</h3>
              <p className="course-player-description">
                {isCreatorOrAdmin
                  ? 'Este curso ainda não possui aulas adicionadas. Clique no botão abaixo para adicionar módulos e aulas no editor do curso.'
                  : 'O instrutor ainda está a preparar os conteúdos deste curso. Fique atento às novidades!'}
              </p>
              {isCreatorOrAdmin && (
                <Link
                  to={`/creator/courses/${course.id}/edit?step=3`}
                  className="course-player-link-2"
                >
                  <Plus className="course-player-users" />
                  <span>Adicionar Aulas & Módulos</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="course-player-panel-17 custom-scrollbar">
              {currentLesson?.type === 'quiz' && (
                <CourseQuizView
                  key={currentLesson.id}
                  lessonId={currentLesson.id}
                  onCompleteQuiz={() => !isCurrentCompleted && handleMarkComplete()}
                  onNextLesson={nextLesson ? () => setCurrentLesson(nextLesson) : undefined}
                />
              )}

              {currentLesson?.type === 'resource' && (
                <>
                  <p className="course-player-description">
                    {typeof currentLesson.content === 'string' ? currentLesson.content : ''}
                  </p>
                  <LessonResourcesTab
                    resources={
                      currentLesson.resources ||
                      (safeExternalUrl(currentLesson.content)
                        ? [
                            {
                              title: currentLesson.title,
                              url: safeExternalUrl(currentLesson.content),
                            },
                          ]
                        : course.documents || [])
                    }
                  />
                </>
              )}
              {currentLesson?.type === 'project' && (
                <ProjectSubmission
                  key={currentLesson.id}
                  lessonId={currentLesson.id}
                  title={currentLesson.title}
                  description={currentLesson.content}
                  onApproved={handleMarkComplete}
                />
              )}
              {currentLesson?.type === 'text' && (
                <div className="course-player-panel-33">
                  <div className="course-player-panel-34">
                    <div>
                      <h2 className="course-player-heading-2">{currentLesson.title}</h2>
                      <span className="course-player-label-13">
                        Guia de Estudo & Artigo Técnico
                      </span>
                    </div>
                  </div>

                  {(currentLesson.richArticle?.calloutText || currentLesson.calloutText) && (
                    <div className="course-player-panel-35">
                      <Lightbulb className="course-player-lightbulb" />
                      <div>
                        <p className="course-player-description-5">Dica Pro do Instrutor:</p>
                        <p>{currentLesson.richArticle?.calloutText || currentLesson.calloutText}</p>
                      </div>
                    </div>
                  )}

                  <div className="course-player-panel-36">
                    {currentLesson.content || 'Sem conteúdo adicional nesta aula.'}
                  </div>

                  {Array.isArray(currentLesson.richArticle?.checklist || currentLesson.checklist) &&
                    (currentLesson.richArticle?.checklist || currentLesson.checklist).length >
                      0 && (
                      <div className="course-player-panel-37">
                        <span className="course-player-label-14">Checklist de Aprendizagem:</span>
                        {(currentLesson.richArticle?.checklist || currentLesson.checklist).map(
                          (chk) => (
                            <label
                              key={chk.id || chk}
                              onClick={() =>
                                setCheckedItems((prev) => ({
                                  ...prev,
                                  [chk.id || chk]: !prev[chk.id || chk],
                                }))
                              }
                              className="course-player-field-label-2"
                            >
                              {checkedItems[chk.id || chk] ? (
                                <CheckSquare className="course-player-check-square" />
                              ) : (
                                <Square className="course-player-square" />
                              )}
                              <span
                                className={
                                  checkedItems[chk.id || chk]
                                    ? 'course-player-label-15'
                                    : 'course-player-label-16'
                                }
                              >
                                {chk.text || chk}
                              </span>
                            </label>
                          ),
                        )}
                      </div>
                    )}
                </div>
              )}

              <div className="course-player-panel-38">
                {prevLesson ? (
                  <button
                    onClick={() => setCurrentLesson(prevLesson)}
                    className="course-player-button-12"
                  >
                    <ChevronLeft className="course-player-chevron-left" />
                    <span className="course-player-label-17">Anterior: {prevLesson.title}</span>
                  </button>
                ) : (
                  <div />
                )}

                {nextLesson ? (
                  <button
                    onClick={() => setCurrentLesson(nextLesson)}
                    className="course-player-button-13"
                  >
                    <span className="course-player-label-17">Próxima: {nextLesson.title}</span>
                    <ChevronRight className="course-player-chevron-left" />
                  </button>
                ) : (
                  <button onClick={handleMarkComplete} className="course-player-button-14">
                    <Award className="course-player-chevron-left" />
                    <span>Concluir última aula</span>
                  </button>
                )}
              </div>

              <div>
                <div className="course-player-panel-39 no-scrollbar">
                  {[
                    {
                      id: 'overview',
                      label: 'Visão Geral da Aula',
                    },
                    {
                      id: 'resources',
                      label: `Recursos (${courseDocs.length})`,
                    },
                    {
                      id: 'notes',
                      label: 'Notas Pessoais',
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveLessonTab(tab.id)}
                      className={`course-player-button-15 ${activeLessonTab === tab.id ? 'course-player-button-16' : 'course-player-button-17'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="course-player-panel-40">
                  {activeLessonTab === 'overview' && (
                    <div className="course-player-panel-41">
                      {currentLesson?.content ||
                        'Sem notas ou introdução adicional para esta aula.'}
                    </div>
                  )}

                  {activeLessonTab === 'notes' && <LessonNotesTab lessonId={currentLesson?.id} />}

                  {activeLessonTab === 'resources' && <LessonResourcesTab resources={courseDocs} />}
                </div>
              </div>
            </div>
          ))}

        {activeView === 'quiz' && (
          <CourseQuizView
            lessons={(course.modules || [])
              .flatMap((m) => m.lessons || [])
              .filter((l) => l.type === 'quiz')}
          />
        )}

        {activeView === 'documents' && <CourseDocumentsView documents={courseDocs} />}
      </main>

      {showCreateChannelModal && (
        <Modal
          isOpen={showCreateChannelModal}
          onClose={() => {
            setShowCreateChannelModal(false);
            setEditingChannel(null);
          }}
          title={
            editingChannel
              ? `Configurar Canal #${editingChannel.name}`
              : 'Criar Novo Canal no Servidor do Curso'
          }
        >
          <form onSubmit={handleSaveChannelSubmit} className="course-player-form-2">
            {!course?.spaceId && !course?.space?.id && (
              <p>
                Ao criar o primeiro canal, ativa a comunidade deste curso para chats e chamadas.
              </p>
            )}
            <div>
              <label className="course-player-field-label-3">Sugestões Rápidas (1-Clique)</label>
              <div className="course-player-panel-32">
                {[
                  {
                    name: 'anuncios',
                    type: 'text',
                    label: 'Anúncios',
                    topic: 'Avisos importantes e comunicados da turma',
                  },
                  {
                    name: 'geral',
                    type: 'text',
                    label: 'Geral',
                    topic: 'Conversas gerais e apresentações dos membros',
                  },
                  {
                    name: 'duvidas-aulas',
                    type: 'qa',
                    label: 'Dúvidas',
                    topic: 'Espaço para colocar dúvidas de código e exercícios',
                  },
                  {
                    name: 'projetos-showcase',
                    type: 'showcase',
                    label: 'Projetos',
                    topic: 'Partilha de repositórios GitHub e demos',
                  },
                  {
                    name: 'materiais-apoio',
                    type: 'text',
                    label: 'Materiais',
                    topic: 'Links de apoio, PDFs e documentação recomendada',
                  },
                  {
                    name: 'mentoria-ao-vivo',
                    type: 'voice',
                    label: 'Mentoria Voz',
                    topic: 'Sala de conferência ao vivo e mentoria',
                  },
                ].map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => {
                      setNewChannelName(tmpl.name);
                      setNewChannelType(tmpl.type);
                      setNewChannelTopic(tmpl.topic);
                    }}
                    className="course-player-button-18"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="course-player-field-label-4">Tipo do Canal</label>
              <div className="course-player-panel-42">
                {[
                  {
                    id: 'text',
                    label: 'Texto & Chat',
                    desc: 'Convívio geral',
                  },
                  {
                    id: 'qa',
                    label: 'Dúvidas & Q&A',
                    desc: 'Resolução técnica',
                  },
                  {
                    id: 'showcase',
                    label: 'Showcase',
                    desc: 'Projetos da turma',
                  },
                  {
                    id: 'voice',
                    label: 'Sala de Voz',
                    desc: 'Live e áudio',
                  },
                ].map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setNewChannelType(t.id)}
                    className={`course-player-button-19 ${newChannelType === t.id ? 'course-player-button-20' : 'course-player-button-21'}`}
                  >
                    <p
                      className={`course-player-description-6 ${newChannelType === t.id ? 'course-player-description-7' : 'course-player-description-8'}`}
                    >
                      {t.label}
                    </p>
                    <p
                      className={`course-player-description-9 ${newChannelType === t.id ? 'course-player-description-10' : 'course-player-description-11'}`}
                    >
                      {t.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="course-player-field-label-5">Nome do Canal (URL Slug)</label>
              <div className="course-player-panel-43">
                <span className="course-player-label-18">#</span>
                <input
                  type="text"
                  required
                  placeholder="ex: duvidas-modulo-2 ou projetos-finais"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="course-player-field-2"
                />
              </div>
            </div>

            <div>
              <label className="course-player-field-label-5">Descrição do Objetivo do Canal</label>
              <input
                type="text"
                placeholder="ex: Canal dedicado a tirar dúvidas técnicas sobre a matéria do módulo"
                value={newChannelTopic}
                onChange={(e) => setNewChannelTopic(e.target.value)}
                className="course-player-field-3"
              />
            </div>

            <div className="course-player-panel-44">
              <button
                type="button"
                onClick={() => {
                  setShowCreateChannelModal(false);
                  setEditingChannel(null);
                }}
                className="course-player-button-22"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreatingChannel}
                className="course-player-button-23"
              >
                {isCreatingChannel ? 'A guardar...' : 'Criar Canal'}
              </button>
            </div>
          </form>
        </Modal>
      )}

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
          setLiveRoomPreferences({
            startMuted,
            startVideoOff,
          });
          const roomId = customChannels.find(
            (channel) => channel.name === room && channel.type === 'voice',
          )?.id;
          if (!roomId) {
            toast({
              title: 'Sala indisponível',
              message: 'Atualize os canais e tente novamente.',
              type: 'error',
            });
            setPendingJoinRoom(null);
            return;
          }
          setLiveRoomName(room);
          setInLiveRoom(true);
          setActiveView('live-room');
          soundEffects.playJoinCall();
          startCall({
            roomId,
            roomName: room,
            contextTitle: course?.title || 'Curso',
            courseId: courseId,
            returnUrl: `/learn/${courseId}`,
          });
          setPendingJoinRoom(null);
        }}
      />
    </div>
  );
};
export default CoursePlayerPage;
