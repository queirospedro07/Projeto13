import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, MessageSquare, Users, Maximize2, Minimize2,
  X, Send, Volume2, ShieldCheck, Crown, LayoutGrid, Check
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../ui/Toast';
import { soundEffects } from '../../services/soundEffects';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' }
  ]
};

const VideoPlayer = ({ stream, isMirrored = false, isContain = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
      }
      el.play().catch(() => {});
      const track = stream.getVideoTracks()[0];
      if (track) {
        const handleUnmute = () => {
          el.play().catch(() => {});
        };
        track.addEventListener('unmute', handleUnmute);
        return () => track.removeEventListener('unmute', handleUnmute);
      }
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`w-full h-full ${isContain ? 'object-contain bg-black' : 'object-cover bg-black'} ${isMirrored ? 'scale-x-[-1]' : ''}`}
    />
  );
};

export const CallStage = ({
  roomName,
  roomId,
  roomType = 'voice',
  initialParticipants = [],
  onDisconnect
}) => {
  const effectiveRoomId = roomId || roomName;
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sideDrawer, setSideDrawer] = useState('none');
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const [participants, setParticipants] = useState(() => {
    if (initialParticipants.length > 0) return initialParticipants;
    if (!user) return [];
    return [{
      id: user.id,
      name: `${user.name} (Você)`,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isSpeaking: false,
      isMuted: false,
      isCameraOn: false,
      isScreenSharing: false
    }];
  });

  const [localCameraStream, setLocalCameraStream] = useState(null);
  const [localScreenStream, setLocalScreenStream] = useState(null);
  const [remoteCameraStreams, setRemoteCameraStreams] = useState({});
  const [remoteScreenStreams, setRemoteScreenStreams] = useState({});
  const [selectedScreenUserId, setSelectedScreenUserId] = useState(null);

  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'Sistema', content: `Conectado ao canal de voz "${roomName}".`, time: 'Agora', isSystem: true }
  ]);
  const [chatInput, setChatInput] = useState('');

  const containerRef = useRef(null);
  const localAudioStreamRef = useRef(null);
  const localCameraStreamRef = useRef(null);
  const localScreenStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const cameraSendersRef = useRef(new Map());
  const screenSendersRef = useRef(new Map());
  const remoteAudioElementsRef = useRef(new Map());
  const pendingIceCandidatesRef = useRef(new Map());
  const socketToUserRef = useRef(new Map());
  const userToSocketRef = useRef(new Map());
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastSpeakingRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleUnblockAudio = () => {
    remoteAudioElementsRef.current.forEach(audio => {
      audio.play().catch(() => {});
    });
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
    setAutoplayBlocked(false);
  };

  const setupAudioAnalyser = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      src.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const checkAudio = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        const isSpeakingNow = avg > 14 && !localAudioStreamRef.current?.getAudioTracks()[0]?.muted && localAudioStreamRef.current?.getAudioTracks()[0]?.enabled;

        if (lastSpeakingRef.current !== isSpeakingNow) {
          lastSpeakingRef.current = isSpeakingNow;
          setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isSpeaking: isSpeakingNow } : p));
          if (socket) {
            socket.emit('voice-speaking-state', { roomId: effectiveRoomId, userId: user?.id, isSpeaking: isSpeakingNow });
          }
        }
        animFrameRef.current = requestAnimationFrame(checkAudio);
      };
      checkAudio();
    } catch (_) {}
  };

  const initLocalAudio = async () => {
    try {
      if (localAudioStreamRef.current) return localAudioStreamRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false
      });
      localAudioStreamRef.current = stream;
      setupAudioAnalyser(stream);
      return stream;
    } catch (err) {
      return null;
    }
  };

  const getOrCreatePeerConnection = useCallback((targetSocketId, remoteUser) => {
    if (peerConnectionsRef.current.has(targetSocketId)) {
      return peerConnectionsRef.current.get(targetSocketId);
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionsRef.current.set(targetSocketId, pc);

    if (localAudioStreamRef.current) {
      localAudioStreamRef.current.getAudioTracks().forEach(track => {
        pc.addTrack(track, localAudioStreamRef.current);
      });
    }

    if (localCameraStreamRef.current) {
      const camTrack = localCameraStreamRef.current.getVideoTracks()[0];
      if (camTrack) {
        const sender = pc.addTrack(camTrack, localCameraStreamRef.current);
        cameraSendersRef.current.set(targetSocketId, sender);
      }
    }

    if (localScreenStreamRef.current) {
      const screenTrack = localScreenStreamRef.current.getVideoTracks()[0];
      if (screenTrack) {
        const sender = pc.addTrack(screenTrack, localScreenStreamRef.current);
        screenSendersRef.current.set(targetSocketId, sender);
      }
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
      const { track } = event;
      const targetUserId = socketToUserRef.current.get(targetSocketId) || remoteUser?.id;
      const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([track]);

      if (track.kind === 'audio') {
        let audio = remoteAudioElementsRef.current.get(targetSocketId);
        if (!audio) {
          audio = document.createElement('audio');
          audio.autoplay = true;
          audio.playsInline = true;
          document.body.appendChild(audio);
          remoteAudioElementsRef.current.set(targetSocketId, audio);
        }
        audio.srcObject = stream;
        audio.play().catch(() => setAutoplayBlocked(true));
      } else if (track.kind === 'video') {
        const isScreen = stream.id.toLowerCase().includes('screen') ||
          track.label.toLowerCase().includes('screen') ||
          track.label.toLowerCase().includes('display');

        if (isScreen) {
          if (targetUserId) {
            setRemoteScreenStreams(prev => ({ ...prev, [targetUserId]: stream }));
          }
          track.onended = () => {
            if (targetUserId) {
              setRemoteScreenStreams(prev => {
                const next = { ...prev };
                delete next[targetUserId];
                return next;
              });
            }
          };
        } else {
          if (targetUserId) {
            setRemoteCameraStreams(prev => ({ ...prev, [targetUserId]: stream }));
          }
          track.onended = () => {
            if (targetUserId) {
              setRemoteCameraStreams(prev => {
                const next = { ...prev };
                delete next[targetUserId];
                return next;
              });
            }
          };
        }
      }
    };

    return pc;
  }, [socket]);

  const sendOfferToPeer = useCallback(async (targetSocketId, callerUser) => {
    try {
      const pc = getOrCreatePeerConnection(targetSocketId, callerUser);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.emit('voice-signal-offer', {
        targetSocketId,
        offer: pc.localDescription,
        callerUser: user
      });
    } catch (_) {}
  }, [getOrCreatePeerConnection, socket, user]);

  useEffect(() => {
    let isMounted = true;

    const joinSession = async () => {
      await initLocalAudio();
      if (!isMounted) return;

      if (socket && user?.id) {
        socket.emit('join-voice-room', {
          roomId: effectiveRoomId,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            role: user.role
          }
        });
      }
    };

    joinSession();

    if (socket && user?.id) {
      socket.on('voice-room-existing-users', async (existingList) => {
        if (!Array.isArray(existingList) || !isMounted) return;

        setParticipants(prev => {
          const next = [...prev];
          for (const item of existingList) {
            const remoteUser = item.user;
            if (remoteUser && remoteUser.id !== user.id) {
              if (item.socketId) {
                socketToUserRef.current.set(item.socketId, remoteUser.id);
                userToSocketRef.current.set(remoteUser.id, item.socketId);
              }
              const existingIdx = next.findIndex(p => p.id === remoteUser.id);
              const pData = {
                id: remoteUser.id,
                socketId: item.socketId,
                name: remoteUser.name,
                username: remoteUser.username,
                avatarUrl: remoteUser.avatarUrl,
                role: remoteUser.role,
                isSpeaking: false,
                isMuted: !!item.isMuted,
                isCameraOn: !!item.isCameraOn,
                isScreenSharing: !!item.isScreenSharing
              };
              if (existingIdx >= 0) {
                next[existingIdx] = { ...next[existingIdx], ...pData };
              } else {
                next.push(pData);
              }
            }
          }
          return next;
        });

        for (const item of existingList) {
          if (item.socketId && item.socketId !== socket.id) {
            if (item.user?.id) {
              socketToUserRef.current.set(item.socketId, item.user.id);
              userToSocketRef.current.set(item.user.id, item.socketId);
            }
            sendOfferToPeer(item.socketId, item.user);
          }
        }
      });

      socket.on('user-joined-voice', ({ user: remoteUser, socketId: remoteSocketId }) => {
        if (!remoteUser || remoteUser.id === user.id || !isMounted) return;

        if (remoteSocketId) {
          socketToUserRef.current.set(remoteSocketId, remoteUser.id);
          userToSocketRef.current.set(remoteUser.id, remoteSocketId);
        }

        setParticipants(prev => {
          const existingIdx = prev.findIndex(p => p.id === remoteUser.id);
          const pData = {
            id: remoteUser.id,
            socketId: remoteSocketId,
            name: remoteUser.name,
            username: remoteUser.username,
            avatarUrl: remoteUser.avatarUrl,
            role: remoteUser.role,
            isSpeaking: false,
            isMuted: false,
            isCameraOn: false,
            isScreenSharing: false
          };
          if (existingIdx >= 0) {
            const next = [...prev];
            next[existingIdx] = { ...next[existingIdx], ...pData };
            return next;
          }
          return [...prev, pData];
        });

        toast({
          title: 'Canal de Voz',
          message: `${remoteUser.name} juntou-se à chamada.`,
          type: 'info'
        });
      });

      socket.on('voice-signal-offer', async ({ callerSocketId, offer, callerUser }) => {
        try {
          if (callerUser?.id && callerSocketId) {
            socketToUserRef.current.set(callerSocketId, callerUser.id);
            userToSocketRef.current.set(callerUser.id, callerSocketId);
          }

          const pc = getOrCreatePeerConnection(callerSocketId, callerUser);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));

          const pending = pendingIceCandidatesRef.current.get(callerSocketId) || [];
          for (const cand of pending) {
            try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (_) {}
          }
          pendingIceCandidatesRef.current.delete(callerSocketId);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('voice-signal-answer', {
            targetSocketId: callerSocketId,
            answer: pc.localDescription
          });
        } catch (_) {}
      });

      socket.on('voice-signal-answer', async ({ responderSocketId, answer }) => {
        try {
          const pc = peerConnectionsRef.current.get(responderSocketId);
          if (pc && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            const pending = pendingIceCandidatesRef.current.get(responderSocketId) || [];
            for (const cand of pending) {
              try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (_) {}
            }
            pendingIceCandidatesRef.current.delete(responderSocketId);
          }
        } catch (_) {}
      });

      socket.on('voice-signal-ice', async ({ candidate, fromSocketId }) => {
        try {
          const pc = peerConnectionsRef.current.get(fromSocketId);
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            const queue = pendingIceCandidatesRef.current.get(fromSocketId) || [];
            queue.push(candidate);
            pendingIceCandidatesRef.current.set(fromSocketId, queue);
          }
        } catch (_) {}
      });

      socket.on('user-voice-state-changed', ({ userId, socketId, isMuted, isCameraOn, isScreenSharing }) => {
        if (socketId && userId) {
          socketToUserRef.current.set(socketId, userId);
          userToSocketRef.current.set(userId, socketId);
        }

        if (isCameraOn === false && userId) {
          setRemoteCameraStreams(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        }
        if (isScreenSharing === false && userId) {
          setRemoteScreenStreams(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        }

        setParticipants(prev => prev.map(p => {
          if (p.id !== userId) return p;
          return {
            ...p,
            socketId: p.socketId || socketId,
            isMuted: isMuted !== undefined ? isMuted : p.isMuted,
            isCameraOn: isCameraOn !== undefined ? isCameraOn : p.isCameraOn,
            isScreenSharing: isScreenSharing !== undefined ? isScreenSharing : p.isScreenSharing
          };
        }));
      });

      socket.on('user-voice-speaking-changed', ({ userId, isSpeaking }) => {
        setParticipants(prev => prev.map(p => p.id === userId ? { ...p, isSpeaking: !!isSpeaking } : p));
      });

      socket.on('user-left-voice', ({ userId, socketId }) => {
        setParticipants(prev => prev.filter(p => p.id !== userId && p.socketId !== socketId));
        const sId = socketId || userToSocketRef.current.get(userId);
        if (sId) {
          const pc = peerConnectionsRef.current.get(sId);
          if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(sId);
          }
          cameraSendersRef.current.delete(sId);
          screenSendersRef.current.delete(sId);

          const audio = remoteAudioElementsRef.current.get(sId);
          if (audio) {
            audio.srcObject = null;
            audio.remove();
            remoteAudioElementsRef.current.delete(sId);
          }
        }
        if (userId) {
          setRemoteCameraStreams(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
          setRemoteScreenStreams(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        }
      });

      socket.on('voice-chat-message', (msg) => {
        setChatMessages(prev => [...prev, msg]);
      });
    }

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      if (socket) {
        socket.emit('leave-voice-room', { roomId: effectiveRoomId, userId: user?.id });
        socket.off('voice-room-existing-users');
        socket.off('user-joined-voice');
        socket.off('voice-signal-offer');
        socket.off('voice-signal-answer');
        socket.off('voice-signal-ice');
        socket.off('user-voice-state-changed');
        socket.off('user-voice-speaking-changed');
        socket.off('user-left-voice');
        socket.off('voice-chat-message');
      }

      if (localAudioStreamRef.current) {
        localAudioStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (localCameraStreamRef.current) {
        localCameraStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (localScreenStreamRef.current) {
        localScreenStreamRef.current.getTracks().forEach(t => t.stop());
      }

      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      cameraSendersRef.current.clear();
      screenSendersRef.current.clear();

      remoteAudioElementsRef.current.forEach(audio => {
        audio.srcObject = null;
        audio.remove();
      });
      remoteAudioElementsRef.current.clear();
    };
  }, [effectiveRoomId, socket, user?.id, getOrCreatePeerConnection, sendOfferToPeer, toast]);

  const toggleMic = () => {
    const nextMuted = !isMicMuted;
    setIsMicMuted(nextMuted);

    if (localAudioStreamRef.current) {
      localAudioStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !nextMuted;
      });
    }

    if (nextMuted) {
      soundEffects.playMute();
    } else {
      soundEffects.playUnmute();
    }

    setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isMuted: nextMuted } : p));
    socket?.emit('voice-state-update', {
      roomId: effectiveRoomId,
      userId: user?.id,
      isMuted: nextMuted
    });
  };

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (localCameraStreamRef.current) {
        localCameraStreamRef.current.getTracks().forEach(t => t.stop());
        localCameraStreamRef.current = null;
      }
      setLocalCameraStream(null);
      setIsCameraOn(false);

      for (const [targetSocketId, pc] of peerConnectionsRef.current.entries()) {
        const sender = cameraSendersRef.current.get(targetSocketId);
        if (sender) {
          try {
            pc.removeTrack(sender);
          } catch (_) {}
          cameraSendersRef.current.delete(targetSocketId);
        }
        sendOfferToPeer(targetSocketId);
      }

      setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isCameraOn: false } : p));
      socket?.emit('voice-state-update', {
        roomId: effectiveRoomId,
        userId: user?.id,
        isCameraOn: false
      });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false
        });
        localCameraStreamRef.current = stream;
        setLocalCameraStream(stream);
        setIsCameraOn(true);
        const camTrack = stream.getVideoTracks()[0];

        for (const [targetSocketId, pc] of peerConnectionsRef.current.entries()) {
          try {
            const sender = pc.addTrack(camTrack, stream);
            cameraSendersRef.current.set(targetSocketId, sender);
            sendOfferToPeer(targetSocketId);
          } catch (_) {}
        }

        setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isCameraOn: true } : p));
        socket?.emit('voice-state-update', {
          roomId: effectiveRoomId,
          userId: user?.id,
          isCameraOn: true
        });
      } catch (err) {
        toast({ title: 'Aviso', message: 'Não foi possível aceder à webcam.', type: 'error' });
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (localScreenStreamRef.current) {
        localScreenStreamRef.current.getTracks().forEach(t => t.stop());
        localScreenStreamRef.current = null;
      }
      setLocalScreenStream(null);
      setIsScreenSharing(false);

      for (const [targetSocketId, pc] of peerConnectionsRef.current.entries()) {
        const sender = screenSendersRef.current.get(targetSocketId);
        if (sender) {
          try {
            pc.removeTrack(sender);
          } catch (_) {}
          screenSendersRef.current.delete(targetSocketId);
        }
        sendOfferToPeer(targetSocketId);
      }

      setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isScreenSharing: false } : p));
      socket?.emit('voice-state-update', {
        roomId: effectiveRoomId,
        userId: user?.id,
        isScreenSharing: false
      });

      if (selectedScreenUserId === user?.id) {
        setSelectedScreenUserId(null);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        localScreenStreamRef.current = stream;
        setLocalScreenStream(stream);
        setIsScreenSharing(true);
        setSelectedScreenUserId(user?.id);
        const screenTrack = stream.getVideoTracks()[0];

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        for (const [targetSocketId, pc] of peerConnectionsRef.current.entries()) {
          try {
            const sender = pc.addTrack(screenTrack, stream);
            screenSendersRef.current.set(targetSocketId, sender);
            sendOfferToPeer(targetSocketId);
          } catch (_) {}
        }

        setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isScreenSharing: true } : p));
        socket?.emit('voice-state-update', {
          roomId: effectiveRoomId,
          userId: user?.id,
          isScreenSharing: true
        });
      } catch (err) {}
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: `call-msg-${Date.now()}`,
      sender: user?.name || 'Eu',
      content: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMsg]);
    socket?.emit('voice-chat-message', { roomId: effectiveRoomId, message: newMsg });
    setChatInput('');
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const activeScreenShares = [];
  if (isScreenSharing && localScreenStream) {
    activeScreenShares.push({
      userId: user?.id,
      userName: `${user?.name} (Você)`,
      isSelf: true,
      stream: localScreenStream
    });
  }
  participants.forEach(p => {
    if (p.id !== user?.id && p.isScreenSharing) {
      const stream = remoteScreenStreams[p.id];
      activeScreenShares.push({
        userId: p.id,
        userName: p.name,
        isSelf: false,
        stream: stream || null
      });
    }
  });

  useEffect(() => {
    if (activeScreenShares.length > 0) {
      if (!selectedScreenUserId) {
        setSelectedScreenUserId(activeScreenShares[0].userId);
      } else if (selectedScreenUserId !== 'none') {
        const stillActive = activeScreenShares.some(s => s.userId === selectedScreenUserId);
        if (!stillActive) {
          setSelectedScreenUserId(activeScreenShares[0].userId);
        }
      }
    } else if (selectedScreenUserId && selectedScreenUserId !== 'none') {
      setSelectedScreenUserId(null);
    }
  }, [activeScreenShares.length, selectedScreenUserId]);

  const currentScreenShare = activeScreenShares.find(s => s.userId === selectedScreenUserId);
  const spotlightStream = currentScreenShare?.stream || null;
  const isViewingScreen = spotlightStream && selectedScreenUserId !== 'none';

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full bg-[#000000] text-zinc-100 flex flex-col overflow-hidden select-none font-sans"
    >
      {autoplayBlocked && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#5865f2] text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Volume2 className="w-4 h-4" />
          <span>O navegador bloqueou a reprodução de áudio.</span>
          <button
            onClick={handleUnblockAudio}
            className="bg-white text-[#5865f2] px-3 py-1 rounded-xl text-xs font-bold hover:bg-zinc-100 cursor-pointer transition-colors"
          >
            Ativar Som
          </button>
        </div>
      )}

      <header className="h-14 px-5 border-b border-[#1f2023] bg-[#000000] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#23a55a]/10 border border-[#23a55a]/25 text-[#23a55a] text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
            <span>Voz Conectada</span>
          </div>

          <div className="h-4 w-px bg-[#2b2d31]" />

          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>{roomName}</span>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-[#1e1f22] text-zinc-400 border border-[#2b2d31]">
              {roomType === 'stage' ? 'Palco' : roomType === 'qa' ? 'Q&A' : 'Canal Geral'}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-xs font-mono text-zinc-400 bg-[#111214] px-2.5 py-1 rounded-lg border border-[#1e1f22]">
            {formatTime(callDuration)}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 bg-[#111214] px-2.5 py-1 rounded-lg border border-[#1e1f22]">
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span>{participants.length}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1e1f22] transition-colors cursor-pointer"
            title="Ecrã inteiro"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {activeScreenShares.length > 0 && (
        <div className="px-5 py-2.5 bg-[#0b0c0e] border-b border-[#1f2023] flex items-center justify-between gap-3 z-20 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 shrink-0 mr-1">
              <Monitor className="w-3.5 h-3.5 text-[#5865f2]" />
              <span>Transmissões ativas:</span>
            </span>

            {activeScreenShares.map(share => (
              <button
                key={share.userId}
                onClick={() => setSelectedScreenUserId(share.userId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  selectedScreenUserId === share.userId
                    ? 'bg-[#5865f2] text-white shadow-md shadow-[#5865f2]/30'
                    : 'bg-[#1e1f22] text-zinc-300 hover:bg-[#2b2d31] hover:text-white border border-[#2b2d31]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>{share.userName}</span>
                {selectedScreenUserId === share.userId && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSelectedScreenUserId(prev => prev === 'none' ? (activeScreenShares[0]?.userId || null) : 'none')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
              selectedScreenUserId === 'none'
                ? 'bg-[#23a55a] text-white border-[#23a55a] shadow-md shadow-[#23a55a]/30'
                : 'bg-[#1e1f22] text-zinc-400 hover:text-white border-[#2b2d31]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{selectedScreenUserId === 'none' ? 'Ver Ecrã Selecionado' : 'Grelha de Câmaras'}</span>
          </button>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-4 flex flex-col overflow-y-auto custom-scrollbar">
          {isViewingScreen ? (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="flex-1 rounded-2xl overflow-hidden bg-black border border-[#1e1f22] relative shadow-2xl flex items-center justify-center">
                <VideoPlayer stream={spotlightStream} isContain={true} />
                <div className="absolute top-3 left-3 bg-[#000000]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-white flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-[#5865f2]" />
                  <span>{currentScreenShare?.isSelf ? 'O seu ecrã (Em direto)' : `Ecrã de ${currentScreenShare?.userName}`}</span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedScreenUserId('none')}
                    className="bg-[#000000]/80 hover:bg-[#000000] backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Ver Câmaras</span>
                  </button>
                </div>
              </div>

              <div className="h-28 flex items-center gap-3 overflow-x-auto py-1 shrink-0">
                {participants.map(p => {
                  const isSelf = p.id === user?.id;
                  const camStream = isSelf ? localCameraStream : remoteCameraStreams[p.id];
                  const hasCamera = !!camStream && (isSelf ? isCameraOn : p.isCameraOn);

                  return (
                    <div
                      key={p.id}
                      className={`h-full aspect-video rounded-xl bg-[#111214] border overflow-hidden relative shrink-0 flex items-center justify-center transition-all ${
                        p.isSpeaking ? 'border-[#23a55a] ring-2 ring-[#23a55a]/40 shadow-lg shadow-[#23a55a]/20' : 'border-[#1e1f22]'
                      }`}
                    >
                      {hasCamera ? (
                        <VideoPlayer stream={camStream} isMirrored={isSelf} />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <Avatar
                            src={p.avatarUrl}
                            name={p.name}
                            size="md"
                            className={p.isSpeaking ? 'ring-2 ring-[#23a55a]' : ''}
                          />
                          <span className="text-[10px] font-medium text-zinc-300 max-w-[90px] truncate">{p.name}</span>
                        </div>
                      )}
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] font-semibold bg-[#000000]/80 backdrop-blur-xs px-2 py-0.5 rounded-md text-white pointer-events-none border border-white/5">
                        <span className="truncate max-w-[75px]">{p.name}</span>
                        {p.isMuted && <MicOff className="w-2.5 h-2.5 text-[#da373c] shrink-0" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={`grid gap-4 flex-1 w-full max-w-7xl mx-auto items-center justify-center ${
              participants.length === 1 ? 'grid-cols-1 max-w-3xl' :
              participants.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-5xl' :
              participants.length <= 4 ? 'grid-cols-2 max-w-6xl' :
              participants.length <= 6 ? 'grid-cols-2 md:grid-cols-3 max-w-7xl' :
              'grid-cols-2 md:grid-cols-4 max-w-7xl'
            }`}>
              {participants.map(p => {
                const isSelf = p.id === user?.id;
                const camStream = isSelf ? localCameraStream : remoteCameraStreams[p.id];
                const hasCamera = !!camStream && (isSelf ? isCameraOn : p.isCameraOn);

                return (
                  <div
                    key={p.id}
                    className={`aspect-video w-full rounded-2xl overflow-hidden relative flex flex-col items-center justify-center bg-[#111214] border transition-all duration-200 ${
                      p.isSpeaking ? 'border-[#23a55a] ring-2 ring-[#23a55a]/40 shadow-xl shadow-[#23a55a]/15' : 'border-[#1e1f22] hover:border-[#2b2d31]'
                    }`}
                  >
                    {hasCamera ? (
                      <VideoPlayer stream={camStream} isMirrored={isSelf} />
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <Avatar
                            src={p.avatarUrl}
                            name={p.name}
                            size="xl"
                            className={p.isSpeaking ? 'ring-4 ring-[#23a55a]' : 'ring-4 ring-[#1e1f22]'}
                          />
                          {p.role === 'ADMIN' && (
                            <span className="absolute -top-1 -right-1 p-1 rounded-full bg-amber-500 text-white shadow-xs">
                              <ShieldCheck className="w-3 h-3" />
                            </span>
                          )}
                          {p.role === 'CREATOR' && (
                            <span className="absolute -top-1 -right-1 p-1 rounded-full bg-[#5865f2] text-white shadow-xs">
                              <Crown className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-zinc-300 tracking-tight">{p.name}</span>
                      </div>
                    )}

                    {p.isScreenSharing && (
                      <button
                        onClick={() => setSelectedScreenUserId(p.id)}
                        className="absolute top-3 left-3 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Ver partilha de ecrã deste utilizador"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Ver Ecrã</span>
                      </button>
                    )}

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <div className="bg-[#000000]/85 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-semibold text-white flex items-center gap-1.5 border border-white/5">
                        <span className="truncate max-w-[140px]">{p.name}</span>
                        {p.isSpeaking && (
                          <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className={`p-1.5 rounded-md backdrop-blur-md border ${
                          p.isMuted ? 'bg-[#da373c] text-white border-[#da373c]' : 'bg-[#000000]/70 text-zinc-300 border-white/10'
                        }`}>
                          {p.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#23a55a]" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {sideDrawer !== 'none' && (
          <aside className="w-80 border-l border-[#1e1f22] bg-[#111214] flex flex-col shrink-0 animate-fade-in z-20">
            <div className="h-14 px-4 border-b border-[#1e1f22] flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                {sideDrawer === 'chat' ? 'Conversa da Chamada' : 'Participantes Conectados'}
              </h3>
              <button
                onClick={() => setSideDrawer('none')}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1e1f22] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sideDrawer === 'chat' ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`text-xs ${msg.isSystem ? 'text-zinc-500 italic text-center py-1' : ''}`}>
                      {!msg.isSystem && (
                        <div className="flex items-baseline justify-between mb-0.5">
                          <span className="font-bold text-[#5865f2]">{msg.sender}</span>
                          <span className="text-[10px] text-zinc-500">{msg.time}</span>
                        </div>
                      )}
                      <p className={`rounded-xl p-2.5 ${msg.isSystem ? 'bg-[#1e1f22]/60' : 'bg-[#1e1f22] text-zinc-200'}`}>
                        {msg.content}
                      </p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendChatMessage} className="p-3 border-t border-[#1e1f22] flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Enviar mensagem..."
                    className="flex-1 bg-[#1e1f22] border border-[#2b2d31] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#5865f2]"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white cursor-pointer transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e1f22]/70 border border-[#2b2d31]/50">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={p.avatarUrl} name={p.name} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-white">{p.name}</p>
                        <p className="text-[10px] text-zinc-400 capitalize">{p.role?.toLowerCase() || 'membro'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      {p.isMuted ? <MicOff className="w-3.5 h-3.5 text-[#da373c]" /> : <Mic className="w-3.5 h-3.5 text-[#23a55a]" />}
                      {p.isCameraOn && <Video className="w-3.5 h-3.5 text-[#5865f2]" />}
                      {p.isScreenSharing && <Monitor className="w-3.5 h-3.5 text-[#5865f2]" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </main>

      <footer className="h-20 px-6 border-t border-[#1f2023] bg-[#000000] flex items-center justify-center z-20 shrink-0">
        <div className="bg-[#1e1f22]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/5 flex items-center gap-2.5 shadow-2xl">
          <button
            onClick={toggleMic}
            className={`p-3.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isMicMuted
                ? 'bg-[#da373c] text-white hover:bg-[#a1282c] shadow-md shadow-[#da373c]/30'
                : 'bg-[#2b2d31] text-zinc-200 hover:bg-[#35373c] hover:text-white'
            }`}
            title={isMicMuted ? 'Ativar Microfone' : 'Silenciar Microfone'}
          >
            {isMicMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-[#23a55a]" />}
          </button>

          <button
            onClick={toggleCamera}
            className={`p-3.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isCameraOn
                ? 'bg-[#23a55a] text-white hover:bg-[#1f9350] shadow-md shadow-[#23a55a]/30'
                : 'bg-[#2b2d31] text-zinc-200 hover:bg-[#35373c] hover:text-white'
            }`}
            title={isCameraOn ? 'Desligar Câmara' : 'Ligar Câmara'}
          >
            {isCameraOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-zinc-400" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isScreenSharing
                ? 'bg-[#5865f2] text-white hover:bg-[#4752c4] shadow-md shadow-[#5865f2]/30'
                : 'bg-[#2b2d31] text-zinc-200 hover:bg-[#35373c] hover:text-white'
            }`}
            title={isScreenSharing ? 'Parar Partilha de Ecrã' : 'Partilhar Ecrã'}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5 text-white" /> : <Monitor className="w-5 h-5 text-zinc-400" />}
          </button>

          <div className="h-6 w-px bg-[#35373c] mx-1" />

          <button
            onClick={() => setSideDrawer(prev => prev === 'chat' ? 'none' : 'chat')}
            className={`p-3.5 rounded-xl font-bold transition-all cursor-pointer ${
              sideDrawer === 'chat'
                ? 'bg-[#35373c] text-white'
                : 'bg-[#2b2d31] text-zinc-400 hover:bg-[#35373c] hover:text-white'
            }`}
            title="Chat da chamada"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <button
            onClick={() => setSideDrawer(prev => prev === 'participants' ? 'none' : 'participants')}
            className={`p-3.5 rounded-xl font-bold transition-all cursor-pointer ${
              sideDrawer === 'participants'
                ? 'bg-[#35373c] text-white'
                : 'bg-[#2b2d31] text-zinc-400 hover:bg-[#35373c] hover:text-white'
            }`}
            title="Participantes"
          >
            <Users className="w-5 h-5" />
          </button>

          <div className="h-6 w-px bg-[#35373c] mx-1" />

          <button
            onClick={() => {
              soundEffects.playLeaveCall();
              onDisconnect?.();
            }}
            className="px-5 py-3.5 rounded-xl bg-[#da373c] hover:bg-[#a1282c] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-[#da373c]/20 transition-all"
            title="Desconectar do canal"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Desconectar</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default CallStage;