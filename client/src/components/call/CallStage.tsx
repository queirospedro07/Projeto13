import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff, 
  Headphones, 
  VolumeX, 
  PhoneOff, 
  MessageSquare, 
  Users, 
  Settings, 
  Maximize2, 
  Minimize2, 
  Grid, 
  Layout, 
  Send, 
  Hand,
  SlidersHorizontal,
  X,
  Radio,
  Crown,
  Shield,
  UserCheck,
  UserX,
  Check,
  Share2,
  Copy
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../ui/Toast';
import { soundEffects } from '../../services/soundEffects';

export interface CallParticipant {
  id: string;
  socketId?: string;
  name: string;
  username: string;
  avatarUrl?: string;
  role?: string;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isCameraOn?: boolean;
  isScreenSharing?: boolean;
  handRaised?: boolean;
  canSpeak?: boolean;
  canShareScreen?: boolean;
}

export type RoomMode = 'stage' | 'open' | 'qa';

export interface CallStageProps {
  roomName: string;
  roomType?: 'voice' | 'video' | 'stage' | 'qa';
  isStageMode?: boolean;
  initialParticipants?: CallParticipant[];
  onDisconnect: () => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const CallStage: React.FC<CallStageProps> = ({
  roomName,
  roomType = 'voice',
  isStageMode = false,
  initialParticipants = [],
  onDisconnect
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();

  const isHostOrModerator = user?.role === 'CREATOR' || user?.role === 'ADMIN';

  // Room Mode: 'stage' (Palco restrito), 'open' (Convívio aberto), 'qa' (Dúvidas)
  const [roomMode, setRoomMode] = useState<RoomMode>(() => {
    if (isStageMode || roomType === 'stage') return 'stage';
    if (roomType === 'qa') return 'qa';
    return 'open';
  });

  // Media state
  const [isMicMuted, setIsMicMuted] = useState(roomMode === 'stage' && !isHostOrModerator);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'spotlight'>('grid');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSideDrawer, setActiveSideDrawer] = useState<'none' | 'chat' | 'members' | 'requests'>('none');

  // Audio level & Settings
  const [micLevel, setMicLevel] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedParticipantVolume, setSelectedParticipantVolume] = useState<string | null>(null);
  const [userVolumes, setUserVolumes] = useState<Record<string, number>>({});
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  // Speaker Requests (Stage Mode Queue)
  const [speakerRequests, setSpeakerRequests] = useState<Array<{ id: string; name: string; username: string; avatarUrl?: string; time: string }>>([]);

  // In-Call Chat
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; content: string; time: string; isSystem?: boolean }>>([
    {
      id: 'init-msg',
      sender: 'Sistema',
      content: `Conectado ao canal de voz "${roomName}". Modo atual: ${
        roomMode === 'stage' ? 'Palco Restrito' : roomMode === 'qa' ? 'Fila de Dúvidas' : 'Convívio Aberto'
      }.`,
      time: 'Agora',
      isSystem: true
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Media references
  const containerRef = useRef<HTMLDivElement | null>(null);
  const localCameraRef = useRef<HTMLVideoElement | null>(null);
  const localScreenRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // WebRTC maps
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Real participants only (no mock data!)
  const [participants, setParticipants] = useState<CallParticipant[]>(() => {
    if (initialParticipants.length > 0) return initialParticipants;
    if (!user) return [];
    return [{
      id: user.id,
      name: `${user.name} (Você)`,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isSpeaking: false,
      isMuted: roomMode === 'stage' && !isHostOrModerator,
      isCameraOn: false,
      isScreenSharing: false,
      handRaised: false,
      canSpeak: roomMode !== 'stage' || isHostOrModerator,
      canShareScreen: roomMode !== 'stage' || isHostOrModerator
    }];
  });

  // Self permissions
  const selfParticipant = participants.find(p => p.id === user?.id);
  const canSelfSpeak = roomMode !== 'stage' || isHostOrModerator || !!selfParticipant?.canSpeak;
  const canSelfShareScreen = roomMode !== 'stage' || isHostOrModerator || !!selfParticipant?.canShareScreen;

  // Call timer ticking
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDurationSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 1. Real Hardware Microphone Setup
  const initHardwareMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      localStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          const level = Math.min(100, Math.round((avg / 35) * 100));
          setMicLevel(level);

          const isSpeakingNow = level > 10;
          setParticipants(prev => prev.map(p => 
            p.id === user?.id ? { ...p, isSpeaking: isSpeakingNow } : p
          ));

          animFrameRef.current = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      }

      // If stage mode and not host, mute audio track initially
      if (roomMode === 'stage' && !isHostOrModerator) {
        stream.getAudioTracks().forEach(t => { t.enabled = false; });
        setIsMicMuted(true);
      } else {
        setIsMicMuted(false);
      }
    } catch (err) {
      console.warn('Microphone passive mode:', err);
    }
  }, [user?.id, roomMode, isHostOrModerator]);

  // Clean up all streams and connections
  const stopAllMedia = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();

    remoteAudiosRef.current.forEach(audio => {
      audio.srcObject = null;
      audio.remove();
    });
    remoteAudiosRef.current.clear();
  }, []);

  // WebRTC Peer Connection Helper
  const createPeerConnection = useCallback((targetSocketId: string) => {
    if (peerConnectionsRef.current.has(targetSocketId)) {
      return peerConnectionsRef.current.get(targetSocketId)!;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionsRef.current.set(targetSocketId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('voice-signal-ice', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        let audioEl = remoteAudiosRef.current.get(targetSocketId);
        if (!audioEl) {
          audioEl = new Audio();
          audioEl.autoplay = true;
          remoteAudiosRef.current.set(targetSocketId, audioEl);
          document.body.appendChild(audioEl);
        }
        audioEl.srcObject = remoteStream;
      }
    };

    return pc;
  }, [socket]);

  // 2. Real-Time Socket.IO Synchronization
  useEffect(() => {
    initHardwareMicrophone();

    if (socket && user) {
      const roomPayload = {
        roomId: roomName,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatarUrl: user.avatarUrl,
          role: user.role
        }
      };

      socket.emit('join-voice-room', roomPayload);

      // Remote user joined
      socket.on('user-joined-voice', async ({ user: remoteUser, socketId }: any) => {
        if (!remoteUser || remoteUser.id === user.id) return;

        setParticipants(prev => {
          if (prev.some(p => p.id === remoteUser.id)) return prev;
          return [...prev, {
            id: remoteUser.id,
            socketId,
            name: remoteUser.name,
            username: remoteUser.username,
            avatarUrl: remoteUser.avatarUrl,
            role: remoteUser.role,
            isSpeaking: false,
            isMuted: roomMode === 'stage' && remoteUser.role !== 'CREATOR' && remoteUser.role !== 'ADMIN',
            isCameraOn: false,
            canSpeak: roomMode !== 'stage' || remoteUser.role === 'CREATOR' || remoteUser.role === 'ADMIN',
            canShareScreen: roomMode !== 'stage' || remoteUser.role === 'CREATOR' || remoteUser.role === 'ADMIN'
          }];
        });

        toast({ title: 'Entrada na Sala', message: `${remoteUser.name} entrou no canal de voz.`, type: 'info' });

        try {
          const pc = createPeerConnection(socketId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('voice-signal-offer', {
            targetSocketId: socketId,
            offer,
            callerUser: user
          });
        } catch (e) {
          console.error('Error creating WebRTC offer:', e);
        }
      });

      // WebRTC Offer received
      socket.on('voice-signal-offer', async ({ callerSocketId, offer, callerUser }: any) => {
        try {
          const pc = createPeerConnection(callerSocketId);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('voice-signal-answer', {
            targetSocketId: callerSocketId,
            answer
          });

          if (callerUser && callerUser.id !== user.id) {
            setParticipants(prev => {
              if (prev.some(p => p.id === callerUser.id)) return prev;
              return [...prev, {
                id: callerUser.id,
                socketId: callerSocketId,
                name: callerUser.name,
                username: callerUser.username,
                avatarUrl: callerUser.avatarUrl,
                role: callerUser.role,
                isSpeaking: false,
                isMuted: false,
                canSpeak: roomMode !== 'stage' || callerUser.role === 'CREATOR' || callerUser.role === 'ADMIN',
                canShareScreen: roomMode !== 'stage' || callerUser.role === 'CREATOR' || callerUser.role === 'ADMIN'
              }];
            });
          }
        } catch (e) {
          console.error('Error handling WebRTC offer:', e);
        }
      });

      // WebRTC Answer
      socket.on('voice-signal-answer', async ({ responderSocketId, answer }: any) => {
        try {
          const pc = peerConnectionsRef.current.get(responderSocketId);
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) {
          console.error('Error handling WebRTC answer:', e);
        }
      });

      // WebRTC ICE Candidate
      socket.on('voice-signal-ice', async ({ candidate, fromSocketId }: any) => {
        try {
          const pc = peerConnectionsRef.current.get(fromSocketId);
          if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error handling ICE candidate:', e);
        }
      });

      // Remote User Left
      socket.on('user-left-voice', ({ userId, socketId }: any) => {
        setParticipants(prev => prev.filter(p => p.id !== userId && p.socketId !== socketId));
        if (socketId) {
          const pc = peerConnectionsRef.current.get(socketId);
          if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(socketId);
          }
          const audio = remoteAudiosRef.current.get(socketId);
          if (audio) {
            audio.remove();
            remoteAudiosRef.current.delete(socketId);
          }
        }
      });

      // Remote State Changed (mute, camera, screen)
      socket.on('user-voice-state-changed', ({ userId, isMuted: rMuted, isCameraOn: rCam, isScreenSharing: rScreen }: any) => {
        setParticipants(prev => prev.map(p => {
          if (p.id !== userId) return p;
          return {
            ...p,
            isMuted: rMuted !== undefined ? rMuted : p.isMuted,
            isCameraOn: rCam !== undefined ? rCam : p.isCameraOn,
            isScreenSharing: rScreen !== undefined ? rScreen : p.isScreenSharing
          };
        }));
      });

      // Room Mode Changed by Host (Palco / Convívio / Dúvidas)
      socket.on('voice-room-mode-changed', ({ mode }: { mode: RoomMode }) => {
        setRoomMode(mode);
        const modeLabel = mode === 'stage' ? 'Modo Palco' : mode === 'qa' ? 'Fila de Dúvidas' : 'Convívio Aberto';
        toast({ title: 'Modo de Sala Alterado', message: `O moderador mudou o formato para: ${modeLabel}.`, type: 'info' });

        setParticipants(prev => prev.map(p => {
          const isPrivileged = p.role === 'CREATOR' || p.role === 'ADMIN';
          return {
            ...p,
            canSpeak: mode !== 'stage' || isPrivileged || !!p.canSpeak,
            canShareScreen: mode !== 'stage' || isPrivileged || !!p.canShareScreen
          };
        }));

        if (mode === 'stage' && !isHostOrModerator) {
          setIsMicMuted(true);
          if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
          }
        }
      });

      // Individual Permissions Updated
      socket.on('voice-permissions-updated', ({ targetUserId, canSpeak, canShareScreen }: any) => {
        setParticipants(prev => prev.map(p => {
          if (p.id !== targetUserId) return p;
          return {
            ...p,
            canSpeak: canSpeak !== undefined ? canSpeak : p.canSpeak,
            canShareScreen: canShareScreen !== undefined ? canShareScreen : p.canShareScreen
          };
        }));

        if (targetUserId === user.id) {
          if (canSpeak) {
            toast({ title: 'Palco Concedido', message: 'Tem autorização para falar no microfone.', type: 'success' });
          } else if (canSpeak === false) {
            setIsMicMuted(true);
            if (localStreamRef.current) {
              localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
            }
            toast({ title: 'Palco Revogado', message: 'O seu microfone foi bloqueado pelo anfitrião.', type: 'info' });
          }
        }
      });

      // Speaker Request (Stage Mode)
      socket.on('voice-speaker-request', ({ user: reqUser }: any) => {
        if (isHostOrModerator && reqUser) {
          soundEffects.play('click');
          setSpeakerRequests(prev => {
            if (prev.some(r => r.id === reqUser.id)) return prev;
            return [...prev, {
              id: reqUser.id,
              name: reqUser.name,
              username: reqUser.username,
              avatarUrl: reqUser.avatarUrl,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }];
          });
          toast({ title: 'Pedido de Palavra', message: `${reqUser.name} pediu a palavra no palco.`, type: 'info' });
        }
      });

      // Speaker Decision (Approve / Deny)
      socket.on('voice-speaker-decision', ({ targetUserId, approved }: any) => {
        if (targetUserId === user.id) {
          if (approved) {
            toast({ title: 'Pedido Aceite', message: 'O anfitrião autorizou a sua intervenção. Já pode desmutar o microfone.', type: 'success' });
          } else {
            setIsHandRaised(false);
            toast({ title: 'Pedido Não Autorizado', message: 'O anfitrião manteve o palco restrito no momento.', type: 'info' });
          }
        }
      });

      // Kicked from Voice Room
      socket.on('voice-user-kicked', ({ targetUserId }: any) => {
        if (targetUserId === user.id) {
          stopAllMedia();
          toast({ title: 'Desconectado', message: 'Foi removido da chamada pelo moderador.', type: 'error' });
          onDisconnect();
        } else {
          setParticipants(prev => prev.filter(p => p.id !== targetUserId));
        }
      });

      // In-Room Chat Message
      socket.on('voice-chat-message', (msg: any) => {
        setChatMessages(prev => [...prev, msg]);
      });
    }

    return () => {
      if (socket && user) {
        socket.emit('leave-voice-room', { roomId: roomName, userId: user.id });
        socket.off('user-joined-voice');
        socket.off('voice-signal-offer');
        socket.off('voice-signal-answer');
        socket.off('voice-signal-ice');
        socket.off('user-left-voice');
        socket.off('user-voice-state-changed');
        socket.off('voice-room-mode-changed');
        socket.off('voice-permissions-updated');
        socket.off('voice-speaker-request');
        socket.off('voice-speaker-decision');
        socket.off('voice-user-kicked');
        socket.off('voice-chat-message');
      }
      stopAllMedia();
    };
  }, [roomName, user, socket, initHardwareMicrophone, createPeerConnection, stopAllMedia, isHostOrModerator, toast, onDisconnect]);

  // Host: Change Room Mode
  const handleChangeRoomMode = (newMode: RoomMode) => {
    if (!isHostOrModerator) return;
    setRoomMode(newMode);
    if (socket) {
      socket.emit('voice-set-room-mode', { roomId: roomName, mode: newMode });
    }
    const label = newMode === 'stage' ? 'Modo Palco' : newMode === 'qa' ? 'Fila de Dúvidas' : 'Convívio Aberto';
    toast({ title: 'Modo de Sala Atualizado', message: `O formato agora é: ${label}.`, type: 'success' });
  };

  // Host: Authorize or Revoke Speaker
  const handleToggleSpeakerPermission = (targetUserId: string, allow: boolean) => {
    if (!isHostOrModerator) return;
    setParticipants(prev => prev.map(p => p.id === targetUserId ? { ...p, canSpeak: allow } : p));
    if (socket) {
      socket.emit('voice-update-permissions', {
        roomId: roomName,
        targetUserId,
        canSpeak: allow
      });
    }
    setSpeakerRequests(prev => prev.filter(r => r.id !== targetUserId));
    toast({ title: allow ? 'Permissão Concedida' : 'Permissão Revogada', message: `Permissão de microfone atualizada.`, type: 'info' });
  };

  // Host: Authorize or Revoke Screen Share Permission
  const handleToggleScreenPermission = (targetUserId: string, allow: boolean) => {
    if (!isHostOrModerator) return;
    setParticipants(prev => prev.map(p => p.id === targetUserId ? { ...p, canShareScreen: allow } : p));
    if (socket) {
      socket.emit('voice-update-permissions', {
        roomId: roomName,
        targetUserId,
        canShareScreen: allow
      });
    }
    toast({ title: allow ? 'Partilha Autorizada' : 'Partilha Bloqueada', message: `Permissão de ecrã atualizada.`, type: 'info' });
  };

  // Host: Kick user
  const handleKickParticipant = (targetUserId: string, participantName: string) => {
    if (!isHostOrModerator) return;
    if (socket) {
      socket.emit('voice-kick-user', { roomId: roomName, targetUserId });
    }
    setParticipants(prev => prev.filter(p => p.id !== targetUserId));
    toast({ title: 'Participante Removido', message: `${participantName} foi expulso da sala.`, type: 'info' });
  };

  // Student: Toggle Mic with Stage Protection
  const handleToggleMic = () => {
    if (!canSelfSpeak) {
      toast({ 
        title: 'Microfone Restrito', 
        message: 'A sala está em Modo Palco. Levante a mão para pedir autorização para intervir.', 
        type: 'info' 
      });
      return;
    }

    if (isDeafened) {
      setIsDeafened(false);
      remoteAudiosRef.current.forEach(audio => { audio.muted = false; });
    }

    const nextMuted = !isMicMuted;
    setIsMicMuted(nextMuted);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !nextMuted; });
    }

    setParticipants(prev => prev.map(p => 
      p.id === user?.id ? { ...p, isMuted: nextMuted, isSpeaking: false } : p
    ));

    if (socket) {
      socket.emit('voice-state-update', {
        roomId: roomName,
        userId: user?.id || 'me',
        isMuted: nextMuted
      });
    }

    if (nextMuted) {
      soundEffects.playMute();
      toast({ title: 'Microfone Mutado' });
    } else {
      soundEffects.playUnmute();
      toast({ title: 'Microfone Ativo' });
    }
  };

  // Toggle Deafen
  const handleToggleDeafen = () => {
    const next = !isDeafened;
    setIsDeafened(next);

    remoteAudiosRef.current.forEach(audio => { audio.muted = next; });

    if (next) {
      setIsMicMuted(true);
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
      }
      toast({ title: 'Áudio e Microfone Silenciados' });
    } else {
      setIsMicMuted(false);
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = true; });
      }
      toast({ title: 'Áudio Reativado' });
    }
  };

  // Toggle Camera
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
      setIsCameraActive(false);
      setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isCameraOn: false } : p));

      if (socket) {
        socket.emit('voice-state-update', {
          roomId: roomName,
          userId: user?.id || 'me',
          isCameraOn: false
        });
      }
      toast({ title: 'Câmara Desligada' });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        cameraStreamRef.current = stream;
        setIsCameraActive(true);
        setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isCameraOn: true } : p));

        setTimeout(() => {
          if (localCameraRef.current) localCameraRef.current.srcObject = stream;
        }, 50);

        if (socket) {
          socket.emit('voice-state-update', {
            roomId: roomName,
            userId: user?.id || 'me',
            isCameraOn: true
          });
        }
        toast({ title: 'Câmara Ligada', type: 'success' });
      } catch (err) {
        toast({ title: 'Câmara Indisponível', message: 'Não foi possível aceder à câmara de vídeo.', type: 'error' });
      }
    }
  };

  // Toggle Screen Sharing with Stage Protection
  const handleToggleScreenShare = async () => {
    if (!canSelfShareScreen) {
      toast({ title: 'Partilha Restrita', message: 'Apenas anfitriões ou oradores autorizados podem partilhar ecrã nesta sala.', type: 'info' });
      return;
    }

    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isScreenSharing: false } : p));

      if (socket) {
        socket.emit('voice-state-update', {
          roomId: roomName,
          userId: user?.id || 'me',
          isScreenSharing: false
        });
      }
      toast({ title: 'Partilha de Ecrã Terminada' });
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        setLayoutMode('spotlight');

        setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isScreenSharing: true } : p));

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isScreenSharing: false } : p));
        };

        setTimeout(() => {
          if (localScreenRef.current) localScreenRef.current.srcObject = stream;
        }, 50);

        if (socket) {
          socket.emit('voice-state-update', {
            roomId: roomName,
            userId: user?.id || 'me',
            isScreenSharing: true
          });
        }
        toast({ title: 'A partilhar ecrã', type: 'success' });
      } catch (e) {
        // User closed prompt
      }
    }
  };

  // Toggle Hand Raise (Pedir Palavra no Palco)
  const handleToggleHand = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, handRaised: next } : p));

    if (next && socket) {
      socket.emit('voice-speaker-request', {
        roomId: roomName,
        user: {
          id: user?.id,
          name: user?.name,
          username: user?.username,
          avatarUrl: user?.avatarUrl
        }
      });
      toast({ title: 'Pedido Enviado', message: 'O moderador recebeu a sua solicitação para falar.', type: 'info' });
    }
  };

  // In-Call Chat send
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: 'msg-' + Date.now(),
      sender: user?.name || 'Você',
      content: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');

    if (socket) {
      socket.emit('voice-chat-message', {
        roomId: roomName,
        message: newMsg
      });
    }
  };

  // Adjust Individual User Volume
  const handleSetUserVolume = (participantId: string, volume: number) => {
    setUserVolumes(prev => ({ ...prev, [participantId]: volume }));
    const targetSocketId = participants.find(p => p.id === participantId)?.socketId;
    if (targetSocketId) {
      const audio = remoteAudiosRef.current.get(targetSocketId);
      if (audio) audio.volume = Math.min(1, Math.max(0, volume / 100));
    }
  };

  // Copy Room Link to Invite
  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link Copiado', message: 'O link da sala foi copiado para a área de transferência.', type: 'success' });
  };

  const handleDisconnect = () => {
    stopAllMedia();
    soundEffects.playLeaveCall();
    onDisconnect();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const activeScreenSharer = participants.find(p => p.isScreenSharing);
  const spotlightUser = activeScreenSharer || participants.find(p => p.isSpeaking) || participants[0];

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-[#0c0d12] text-slate-900 dark:text-slate-100 select-none font-sans overflow-hidden relative transition-colors duration-200"
    >
      {/* ======================================================================= */}
      {/* 1. TOP BAR: Mode Selector (Host), Quality Indicator, Fullscreen */}
      {/* ======================================================================= */}
      <header className="h-14 bg-white dark:bg-[#151720] border-b border-slate-200 dark:border-[#222636] px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/40">
            <Radio className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">{roomName}</h2>
              
              {/* Room Mode Selector (Anfitrião) / Badge (Alunos) */}
              {isHostOrModerator ? (
                <select
                  value={roomMode}
                  onChange={(e) => handleChangeRoomMode(e.target.value as RoomMode)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#202433] border border-slate-200 dark:border-[#2b3144] text-[11px] font-bold text-slate-800 dark:text-zinc-200 cursor-pointer focus:outline-none"
                  title="Alterar formato da chamada"
                >
                  <option value="stage">Modo Palco (Silêncio Geral)</option>
                  <option value="open">Modo Convívio (Livre)</option>
                  <option value="qa">Modo Dúvidas (Fila)</option>
                </select>
              ) : (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  roomMode === 'stage' 
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                    : roomMode === 'qa'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }`}>
                  {roomMode === 'stage' ? 'Palco (Restrito)' : roomMode === 'qa' ? 'Fila de Dúvidas' : 'Convívio Aberto'}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
              <span className="font-mono">{formatTimer(callDurationSeconds)}</span>
              <span>•</span>
              <span>{participants.length} {participants.length === 1 ? 'membro' : 'membros'} na sala</span>
            </div>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2">
          {/* Speaker Requests Badge for Host */}
          {isHostOrModerator && speakerRequests.length > 0 && (
            <button
              onClick={() => setActiveSideDrawer('requests')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 animate-pulse cursor-pointer"
            >
              <Hand className="w-3.5 h-3.5" />
              <span>{speakerRequests.length} no palco</span>
            </button>
          )}

          {/* Copy Invite Link */}
          <button
            onClick={handleCopyInvite}
            className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#202433] transition-colors cursor-pointer"
            title="Copiar link de convite da sala"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Layout Grid / Spotlight */}
          <div className="bg-slate-100 dark:bg-[#202433] p-0.5 rounded-lg flex items-center border border-slate-200 dark:border-[#2b3144]">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                layoutMode === 'grid' 
                  ? 'bg-white dark:bg-[#2c3246] text-slate-900 dark:text-white shadow-xs font-bold' 
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grelha"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('spotlight')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                layoutMode === 'spotlight' 
                  ? 'bg-white dark:bg-[#2c3246] text-slate-900 dark:text-white shadow-xs font-bold' 
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Destaque"
            >
              <Layout className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222636] transition-colors cursor-pointer"
            title={isFullscreen ? 'Sair de Ecrã Inteiro' : 'Ecrã Inteiro'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ======================================================================= */}
      {/* 2. MAIN PARTICIPANTS CANVAS */}
      {/* ======================================================================= */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        <main className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto custom-scrollbar justify-center items-center">
          
          {/* Solo user state (Waiting for others) */}
          {participants.length <= 1 && (
            <div className="mb-4 py-2 px-4 rounded-xl bg-white/80 dark:bg-[#151720]/80 border border-slate-200 dark:border-[#222636] text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Conectado. A aguardar a entrada de outros participantes...</span>
              <button 
                onClick={handleCopyInvite}
                className="ml-2 font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                Copiar convite
              </button>
            </div>
          )}

          {/* SPOTLIGHT MODE */}
          {layoutMode === 'spotlight' ? (
            <div className="w-full h-full flex flex-col gap-3 max-w-6xl">
              <div className="flex-1 bg-white dark:bg-[#151720] border border-slate-200 dark:border-[#222636] rounded-2xl relative overflow-hidden flex items-center justify-center shadow-xs">
                {activeScreenSharer ? (
                  activeScreenSharer.id === user?.id ? (
                    <video ref={localScreenRef} autoPlay playsInline muted className="w-full h-full object-contain bg-black" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                      <Monitor className="w-14 h-14 text-indigo-500 mb-2 animate-pulse" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{activeScreenSharer.name}</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">Partilha de ecrã em direto</p>
                    </div>
                  )
                ) : spotlightUser?.isCameraOn ? (
                  spotlightUser.id === user?.id ? (
                    <video ref={localCameraRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <Avatar src={spotlightUser.avatarUrl} name={spotlightUser.name} size="xl" className="mb-3" />
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{spotlightUser.name}</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Avatar src={spotlightUser?.avatarUrl} name={spotlightUser?.name} size="xl" className="mb-3" />
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{spotlightUser?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Orador Ativo</p>
                  </div>
                )}

                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white font-bold text-xs flex items-center gap-1.5">
                    {activeScreenSharer ? <Monitor className="w-3.5 h-3.5 text-indigo-400" /> : <Crown className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{activeScreenSharer ? `Ecrã: ${activeScreenSharer.name}` : spotlightUser?.name}</span>
                  </span>
                </div>
              </div>

              {/* Thumbnails row */}
              <div className="h-24 flex items-center gap-2.5 overflow-x-auto pb-1 shrink-0">
                {participants.map(p => {
                  const isTalking = p.isSpeaking && !p.isMuted;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedParticipantVolume(selectedParticipantVolume === p.id ? null : p.id)}
                      className={`h-full aspect-video bg-white dark:bg-[#151720] rounded-xl border relative overflow-hidden flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                        isTalking 
                          ? 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-sm' 
                          : 'border-slate-200 dark:border-[#222636] hover:border-slate-400 dark:hover:border-zinc-500'
                      }`}
                    >
                      <Avatar src={p.avatarUrl} name={p.name} size="md" />
                      <span className="absolute bottom-1 inset-x-1 text-[10px] font-bold text-white truncate bg-black/75 px-1 py-0.5 rounded text-center">
                        {p.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* GRID MODE */
            <div className={`w-full max-w-5xl grid gap-4 auto-rows-fr h-full max-h-[620px] ${
              participants.length <= 1 
                ? 'grid-cols-1 max-w-md mx-auto' 
                : participants.length <= 2 
                ? 'grid-cols-1 sm:grid-cols-2' 
                : participants.length <= 4 
                ? 'grid-cols-2' 
                : 'grid-cols-2 sm:grid-cols-3'
            }`}>
              {participants.map((p) => {
                const isTalking = p.isSpeaking && !p.isMuted;
                const isSelf = p.id === user?.id;

                return (
                  <div
                    key={p.id}
                    className={`bg-white dark:bg-[#151720] border rounded-2xl relative overflow-hidden flex items-center justify-center transition-all group min-h-[170px] ${
                      isTalking 
                        ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-md shadow-emerald-500/10' 
                        : 'border-slate-200 dark:border-[#222636] shadow-xs'
                    }`}
                  >
                    {p.isCameraOn ? (
                      isSelf ? (
                        <video ref={localCameraRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#12141c]">
                          <Avatar src={p.avatarUrl} name={p.name} size="lg" className="mb-2" />
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4">
                        <div className="relative">
                          <Avatar 
                            src={p.avatarUrl} 
                            name={p.name} 
                            size="lg" 
                            className={`transition-transform duration-150 ${isTalking ? 'scale-105' : ''}`}
                          />
                          {isTalking && (
                            <span className="absolute -inset-1 rounded-full border-2 border-emerald-500 animate-ping opacity-75 pointer-events-none"></span>
                          )}
                        </div>
                        <span className="font-bold text-slate-800 dark:text-zinc-100 text-xs mt-2.5 truncate max-w-[140px] text-center">{p.name}</span>
                        {p.role === 'CREATOR' && (
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                            <Crown className="w-3 h-3" />
                            Instrutor
                          </span>
                        )}
                        {roomMode === 'stage' && !p.canSpeak && p.role !== 'CREATOR' && p.role !== 'ADMIN' && (
                          <span className="text-[10px] font-medium text-slate-400 mt-0.5">Ouvinte</span>
                        )}
                      </div>
                    )}

                    {/* Bottom Status Bar */}
                    <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                      <span className="text-[11px] font-bold text-white bg-black/75 px-2 py-0.5 rounded-md backdrop-blur-xs truncate max-w-[70%]">
                        {p.name}
                      </span>

                      <div className="flex items-center gap-1 pointer-events-auto">
                        {p.handRaised && (
                          <span className="p-1 rounded-md bg-amber-500/20 text-amber-500 border border-amber-500/30" title="Mão levantada">
                            <Hand className="w-3.5 h-3.5 animate-bounce" />
                          </span>
                        )}
                        {p.isMuted ? (
                          <span className="p-1 rounded-md bg-red-500/20 text-red-500 border border-red-500/30" title="Microfone silenciado">
                            <MicOff className="w-3.5 h-3.5" />
                          </span>
                        ) : isTalking ? (
                          <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-500 border border-emerald-500/30" title="A falar">
                            <Mic className="w-3.5 h-3.5" />
                          </span>
                        ) : null}

                        {!isSelf && (
                          <button
                            onClick={() => setSelectedParticipantVolume(selectedParticipantVolume === p.id ? null : p.id)}
                            className="p-1 rounded-md bg-slate-100 dark:bg-[#202433] hover:bg-slate-200 dark:hover:bg-[#2b3144] text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer border border-slate-200 dark:border-[#2b3144]"
                            title="Ajustar volume individual"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Volume Slider Popover */}
                    {selectedParticipantVolume === p.id && (
                      <div className="absolute inset-x-3 bottom-12 p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#2b3144] rounded-xl shadow-xl z-30 flex flex-col gap-2 animate-scale-in">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                          <span>Volume ({p.name.split(' ')[0]})</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-mono">{userVolumes[p.id] || 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={userVolumes[p.id] || 100}
                          onChange={(e) => handleSetUserVolume(p.id, Number(e.target.value))}
                          className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-[#262b3b] rounded-lg cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* =================================================================== */}
        {/* RIGHT DRAWER: CHAT / MEMBERS / STAGE REQUESTS */}
        {/* =================================================================== */}
        {activeSideDrawer !== 'none' && (
          <aside className="w-80 bg-white dark:bg-[#151720] border-l border-slate-200 dark:border-[#222636] flex flex-col shrink-0 z-20 animate-slide-in transition-colors">
            
            {/* Drawer Header */}
            <div className="h-12 px-4 border-b border-slate-200 dark:border-[#222636] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                {activeSideDrawer === 'chat' && (
                  <>
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    <span>Chat de Voz da Sala</span>
                  </>
                )}
                {activeSideDrawer === 'members' && (
                  <>
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span>Gestão de Membros ({participants.length})</span>
                  </>
                )}
                {activeSideDrawer === 'requests' && (
                  <>
                    <Hand className="w-4 h-4 text-amber-500" />
                    <span>Pedidos de Palco ({speakerRequests.length})</span>
                  </>
                )}
              </div>

              <button
                onClick={() => setActiveSideDrawer('none')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222636] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB 1: CHAT */}
            {activeSideDrawer === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-2.5">
                  {chatMessages.map(m => (
                    <div key={m.id} className="flex flex-col gap-0.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${m.isSystem ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-zinc-200'}`}>
                          {m.sender}
                        </span>
                        <span className="text-[10px] text-slate-400">{m.time}</span>
                      </div>
                      <p className="text-slate-700 dark:text-zinc-300 leading-relaxed bg-slate-100 dark:bg-[#1e2230] p-2 rounded-lg mt-0.5">
                        {m.content}
                      </p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 dark:border-[#222636] flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Escrever mensagem..."
                    className="flex-1 bg-slate-50 dark:bg-[#1e2230] border border-slate-200 dark:border-[#2a3042] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: MEMBERS & PERMISSIONS MANAGEMENT */}
            {activeSideDrawer === 'members' && (
              <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-2.5">
                {participants.map(p => {
                  const isSelf = p.id === user?.id;
                  const isCreator = p.role === 'CREATOR' || p.role === 'ADMIN';

                  return (
                    <div 
                      key={p.id} 
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f2b] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={p.avatarUrl} name={p.name} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                              {p.name}
                              {isCreator && <Crown className="w-3 h-3 text-amber-500" />}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400">@{p.username}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {p.isMuted ? (
                            <MicOff className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <Mic className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </div>
                      </div>

                      {/* Moderator Actions Toolbar per participant */}
                      {isHostOrModerator && !isSelf && !isCreator && (
                        <div className="pt-2 border-t border-slate-200 dark:border-[#282d3e] grid grid-cols-3 gap-1.5 text-[10px] font-bold">
                          {/* Speak permission toggle */}
                          <button
                            onClick={() => handleToggleSpeakerPermission(p.id, !p.canSpeak)}
                            className={`py-1 px-1.5 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                              p.canSpeak 
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                                : 'bg-slate-200 dark:bg-[#252a3b] text-slate-600 dark:text-zinc-300 hover:bg-emerald-500/10'
                            }`}
                            title={p.canSpeak ? 'Revogar Microfone' : 'Autorizar Microfone'}
                          >
                            <Mic className="w-3 h-3" />
                            <span>{p.canSpeak ? 'Falar: Sim' : 'Falar: Não'}</span>
                          </button>

                          {/* Screen permission toggle */}
                          <button
                            onClick={() => handleToggleScreenPermission(p.id, !p.canShareScreen)}
                            className={`py-1 px-1.5 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                              p.canShareScreen 
                                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' 
                                : 'bg-slate-200 dark:bg-[#252a3b] text-slate-600 dark:text-zinc-300 hover:bg-indigo-500/10'
                            }`}
                            title={p.canShareScreen ? 'Revogar Ecrã' : 'Autorizar Ecrã'}
                          >
                            <Monitor className="w-3 h-3" />
                            <span>{p.canShareScreen ? 'Ecrã: Sim' : 'Ecrã: Não'}</span>
                          </button>

                          {/* Kick button */}
                          <button
                            onClick={() => handleKickParticipant(p.id, p.name)}
                            className="py-1 px-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Expulsar da chamada"
                          >
                            <UserX className="w-3 h-3" />
                            <span>Expulsar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: STAGE SPEAKER REQUESTS QUEUE (Host only) */}
            {activeSideDrawer === 'requests' && isHostOrModerator && (
              <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-2.5">
                {speakerRequests.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 dark:text-zinc-400 py-8">
                    Não há pedidos de intervenção pendentes.
                  </p>
                ) : (
                  speakerRequests.map(req => (
                    <div key={req.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1f2b] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar src={req.avatarUrl} name={req.name} size="sm" />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{req.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400">{req.time}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-[#282d3e]">
                        <button
                          onClick={() => handleToggleSpeakerPermission(req.id, true)}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Conceder Palco</span>
                        </button>
                        <button
                          onClick={() => setSpeakerRequests(prev => prev.filter(r => r.id !== req.id))}
                          className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-[#282d3e] hover:bg-slate-300 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ======================================================================= */}
      {/* 3. ESSENTIAL BOTTOM CONTROL DOCK */}
      {/* ======================================================================= */}
      <footer className="h-20 bg-white dark:bg-[#151720] border-t border-slate-200 dark:border-[#222636] px-4 flex items-center justify-center shrink-0 z-30 transition-colors">
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-100 dark:bg-[#0c0d12] p-1.5 rounded-2xl border border-slate-200 dark:border-[#222636] shadow-sm">
          
          {/* 1. Microphone Toggle */}
          <button
            onClick={handleToggleMic}
            className={`p-3 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 relative ${
              isMicMuted 
                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/25' 
                : 'bg-white dark:bg-[#1e2230] text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-[#2b3144] shadow-xs'
            }`}
            title={!canSelfSpeak ? 'Microfone bloqueado pelo anfitrião (Modo Palco)' : isMicMuted ? 'Ativar Microfone' : 'Desativar Microfone'}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            {!isMicMuted && (
              <span className="w-1.5 h-5 bg-emerald-500/25 rounded-full overflow-hidden flex flex-col justify-end">
                <span className="w-full bg-emerald-500 transition-all duration-75" style={{ height: `${micLevel}%` }}></span>
              </span>
            )}
          </button>

          {/* 2. Deafen Audio */}
          <button
            onClick={handleToggleDeafen}
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              isDeafened
                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                : 'bg-white dark:bg-[#1e2230] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-[#2b3144] hover:bg-slate-50 dark:hover:bg-[#252a3b]'
            }`}
            title={isDeafened ? 'Reativar Áudio da Sala' : 'Silenciar Todo o Áudio (Deafen)'}
          >
            {isDeafened ? <VolumeX className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
          </button>

          {/* 3. Camera Toggle */}
          <button
            onClick={handleToggleCamera}
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              isCameraActive 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'bg-white dark:bg-[#1e2230] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-[#2b3144] hover:bg-slate-50 dark:hover:bg-[#252a3b]'
            }`}
            title={isCameraActive ? 'Desligar Câmara' : 'Ligar Câmara'}
          >
            {isCameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* 4. Screen Sharing */}
          <button
            onClick={handleToggleScreenShare}
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              isScreenSharing 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                : 'bg-white dark:bg-[#1e2230] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-[#2b3144] hover:bg-slate-50 dark:hover:bg-[#252a3b]'
            }`}
            title={!canSelfShareScreen ? 'Partilha de ecrã restrita aos oradores' : isScreenSharing ? 'Parar Partilha' : 'Partilhar Ecrã'}
          >
            {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
          </button>

          {/* 5. Hand Raise (Stage / Q&A Mode) */}
          <button
            onClick={handleToggleHand}
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              isHandRaised 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30' 
                : 'bg-white dark:bg-[#1e2230] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-[#2b3144] hover:bg-slate-50 dark:hover:bg-[#252a3b]'
            }`}
            title={isHandRaised ? 'Baixar Mão' : 'Pedir a Palavra no Palco (Levantar Mão)'}
          >
            <Hand className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-slate-300 dark:bg-[#2b3144] mx-0.5"></div>

          {/* 6. Settings Modal */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-3 rounded-xl bg-white dark:bg-[#1e2230] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-[#2b3144] hover:bg-slate-50 dark:hover:bg-[#252a3b] transition-colors cursor-pointer"
            title="Definições de Áudio"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* 7. Text Chat Drawer */}
          <button
            onClick={() => setActiveSideDrawer(activeSideDrawer === 'chat' ? 'none' : 'chat')}
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              activeSideDrawer === 'chat' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-white dark:bg-[#1e2230] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-[#2b3144] hover:bg-slate-50 dark:hover:bg-[#252a3b]'
            }`}
            title="Chat da Sala"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* 8. Participants & Permissions Drawer */}
          <button
            onClick={() => setActiveSideDrawer(activeSideDrawer === 'members' ? 'none' : 'members')}
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              activeSideDrawer === 'members' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-white dark:bg-[#1e2230] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-[#2b3144] hover:bg-slate-50 dark:hover:bg-[#252a3b]'
            }`}
            title="Gestão de Participantes"
          >
            <Users className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-slate-300 dark:bg-[#2b3144] mx-0.5"></div>

          {/* 9. Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-red-600/30"
            title="Sair da Sala de Voz"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline text-xs font-black uppercase tracking-wider">Desconectar</span>
          </button>

        </div>
      </footer>

      {/* ======================================================================= */}
      {/* SETTINGS MODAL */}
      {/* ======================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#151720] border border-slate-200 dark:border-[#222636] rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222636]">
              <div className="flex items-center gap-2 font-black text-base">
                <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Definições de Voz & Áudio</span>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1e2230] border border-slate-200 dark:border-[#282d3e] flex flex-col gap-2">
                <p className="font-bold text-slate-900 dark:text-white">Teste de Microfone em Tempo Real</p>
                <div className="w-full bg-slate-200 dark:bg-[#282d3e] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-75" style={{ width: `${micLevel}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Fale ao microfone para verificar a resposta da barra verde.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1e2230] border border-slate-200 dark:border-[#282d3e]">
                <p className="font-bold text-slate-900 dark:text-white mb-1">Qualidade do Sinal</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Codec Opus 48 kHz estéreo com cancelamento de eco acústico e supressão de ruído habilitados.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Fechar Definições
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
