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
      onLoadedMetadata={() => videoRef.current?.play().catch(() => {})}
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
    { id: '1', sender: 'Sistema', content: `Chamada iniciada em "${roomName}".`, time: 'Agora', isSystem: true }
  ]);
  const [chatInput, setChatInput] = useState('');

  const containerRef = useRef(null);
  const localAudioStreamRef = useRef(null);
  const localCameraStreamRef = useRef(null);
  const localScreenStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const cameraSendersRef = useRef(new Map());
  const screenSendersRef = useRef(new Map());
  const peerScreenTrackIdsRef = useRef(new Map());
  const peerCameraTrackIdsRef = useRef(new Map());
  const recentVideoTracksRef = useRef(new Map());
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
        if (targetUserId) {
          recentVideoTracksRef.current.set(track.id, { targetUserId, stream, track });
        }

        const knownScreenTrackId = targetUserId ? peerScreenTrackIdsRef.current.get(targetUserId) : null;
        const currentP = targetUserId ? participants.find(p => p.id === targetUserId) : null;

        const isScreen = (knownScreenTrackId && track.id === knownScreenTrackId) ||
          (currentP?.isScreenSharing && !currentP?.isCameraOn) ||
          (currentP?.isScreenSharing && remoteCameraStreams[targetUserId]) ||
          stream.id.toLowerCase().includes('screen') ||
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
  }, [socket, participants, remoteCameraStreams]);

  const sendOfferToPeer = useCallback(async (targetSocketId, callerUser) => {
    try {
      const pc = getOrCreatePeerConnection(targetSocketId, callerUser);
      if (pc.signalingState !== 'stable') {
        await pc.setLocalDescription({ type: 'rollback' }).catch(() => {});
      }
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.emit('voice-signal-offer', {
        targetSocketId,
        offer: pc.localDescription,
        callerUser: user,
        screenTrackId: localScreenStreamRef.current?.getVideoTracks()[0]?.id,
        cameraTrackId: localCameraStreamRef.current?.getVideoTracks()[0]?.id
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
              if (item.screenTrackId) {
                peerScreenTrackIdsRef.current.set(remoteUser.id, item.screenTrackId);
              }
              if (item.cameraTrackId) {
                peerCameraTrackIdsRef.current.set(remoteUser.id, item.cameraTrackId);
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
                isScreenSharing: !!item.isScreenSharing,
                screenTrackId: item.screenTrackId,
                cameraTrackId: item.cameraTrackId
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
          title: 'Conectado',
          message: `${remoteUser.name} juntou-se à chamada.`,
          type: 'info'
        });
      });

      socket.on('voice-signal-offer', async ({ callerSocketId, offer, callerUser, screenTrackId, cameraTrackId }) => {
        try {
          if (callerUser?.id) {
            if (callerSocketId) {
              socketToUserRef.current.set(callerSocketId, callerUser.id);
              userToSocketRef.current.set(callerUser.id, callerSocketId);
            }
            if (screenTrackId) peerScreenTrackIdsRef.current.set(callerUser.id, screenTrackId);
            if (cameraTrackId) peerCameraTrackIdsRef.current.set(callerUser.id, cameraTrackId);
          }

          const pc = getOrCreatePeerConnection(callerSocketId, callerUser);
          if (pc.signalingState !== 'stable') {
            await pc.setLocalDescription({ type: 'rollback' }).catch(() => {});
          }
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
            answer: pc.localDescription,
            responderUser: user,
            screenTrackId: localScreenStreamRef.current?.getVideoTracks()[0]?.id,
            cameraTrackId: localCameraStreamRef.current?.getVideoTracks()[0]?.id
          });
        } catch (_) {}
      });

      socket.on('voice-signal-answer', async ({ responderSocketId, answer, responderUser, screenTrackId, cameraTrackId }) => {
        try {
          const rId = responderUser?.id || socketToUserRef.current.get(responderSocketId);
          if (rId) {
            if (screenTrackId) peerScreenTrackIdsRef.current.set(rId, screenTrackId);
            if (cameraTrackId) peerCameraTrackIdsRef.current.set(rId, cameraTrackId);
          }

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

      socket.on('user-voice-state-changed', ({ userId, socketId, isMuted, isCameraOn, isScreenSharing, screenTrackId, cameraTrackId }) => {
        if (socketId && userId) {
          socketToUserRef.current.set(socketId, userId);
          userToSocketRef.current.set(userId, socketId);
        }

        if (screenTrackId) peerScreenTrackIdsRef.current.set(userId, screenTrackId);
        if (cameraTrackId) peerCameraTrackIdsRef.current.set(userId, cameraTrackId);

        if (isScreenSharing === false && userId) {
          setRemoteScreenStreams(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        } else if (isScreenSharing === true && userId) {
          for (const [tId, data] of recentVideoTracksRef.current.entries()) {
            if (data.targetUserId === userId) {
              if (!screenTrackId || tId === screenTrackId) {
                setRemoteScreenStreams(prev => ({ ...prev, [userId]: data.stream }));
                break;
              }
            }
          }
        }

        if (isCameraOn === false && userId) {
          setRemoteCameraStreams(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        } else if (isCameraOn === true && userId) {
          for (const [tId, data] of recentVideoTracksRef.current.entries()) {
            if (data.targetUserId === userId) {
              if (tId !== screenTrackId) {
                setRemoteCameraStreams(prev => ({ ...prev, [userId]: data.stream }));
                break;
              }
            }
          }
        }

        setParticipants(prev => prev.map(p => {
          if (p.id !== userId) return p;
          return {
            ...p,
            socketId: p.socketId || socketId,
            isMuted: isMuted !== undefined ? isMuted : p.isMuted,
            isCameraOn: isCameraOn !== undefined ? isCameraOn : p.isCameraOn,
            isScreenSharing: isScreenSharing !== undefined ? isScreenSharing : p.isScreenSharing,
            screenTrackId: screenTrackId || p.screenTrackId,
            cameraTrackId: cameraTrackId || p.cameraTrackId
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
          isCameraOn: true,
          cameraTrackId: camTrack.id
        });
      } catch (err) {
        toast({ title: 'Aviso', message: 'Não foi possível aceder à câmara.', type: 'error' });
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
          isScreenSharing: true,
          screenTrackId: screenTrack.id
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
      if (stream) {
        activeScreenShares.push({
          userId: p.id,
          userName: p.name,
          isSelf: false,
          stream
        });
      }
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
      className="relative flex-1 w-full h-full bg-[#090a0f] text-slate-100 flex flex-col overflow-hidden select-none font-sans"
    >
      {autoplayBlocked && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in">
          <Volume2 className="w-4 h-4" />
          <span>O áudio foi pausado pelo navegador.</span>
          <button
            onClick={handleUnblockAudio}
            className="bg-white text-blue-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-100 cursor-pointer transition-colors"
          >
            Ativar Áudio
          </button>
        </div>
      )}

      <header className="h-14 px-5 border-b border-white/5 bg-[#090a0f]/90 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-md">
              {roomName}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            {formatTime(callDuration)}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{participants.length}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Ecrã inteiro"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {activeScreenShares.length > 0 && (
        <div className="px-5 py-2 bg-black/40 border-b border-white/5 flex items-center justify-between gap-3 z-20 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 shrink-0 mr-1">
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span>Transmissões:</span>
            </span>

            {activeScreenShares.map(share => (
              <button
                key={share.userId}
                onClick={() => setSelectedScreenUserId(share.userId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  selectedScreenUserId === share.userId
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
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
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20'
                : 'bg-white/5 text-slate-300 hover:text-white border-white/5'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{selectedScreenUserId === 'none' ? 'Ver Ecrã' : 'Ver Câmaras'}</span>
          </button>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-4 sm:p-6 flex flex-col overflow-y-auto custom-scrollbar">
          {isViewingScreen ? (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="flex-1 rounded-2xl overflow-hidden bg-black border border-white/10 relative shadow-2xl flex items-center justify-center">
                <VideoPlayer stream={spotlightStream} isContain={true} />
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-white flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-blue-400" />
                  <span>{currentScreenShare?.isSelf ? 'O seu ecrã' : `Ecrã de ${currentScreenShare?.userName}`}</span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedScreenUserId('none')}
                    className="bg-black/70 hover:bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Grelha</span>
                  </button>
                </div>
              </div>

              <div className="h-24 sm:h-28 flex items-center gap-3 overflow-x-auto py-1 shrink-0">
                {participants.map(p => {
                  const isSelf = p.id === user?.id;
                  const camStream = isSelf ? localCameraStream : remoteCameraStreams[p.id];
                  const hasCamera = !!camStream && (isSelf ? isCameraOn : p.isCameraOn);

                  return (
                    <div
                      key={p.id}
                      className={`h-full aspect-video rounded-xl bg-zinc-900 border overflow-hidden relative shrink-0 flex items-center justify-center transition-all ${
                        p.isSpeaking ? 'border-emerald-500/80 ring-2 ring-emerald-500/30' : 'border-white/10'
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
                            className={p.isSpeaking ? 'ring-2 ring-emerald-500' : ''}
                          />
                          <span className="text-[10px] font-medium text-slate-300 max-w-[90px] truncate">{p.name}</span>
                        </div>
                      )}
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] font-semibold bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded-md text-white pointer-events-none border border-white/5">
                        <span className="truncate max-w-[75px]">{p.name}</span>
                        {p.isMuted && <MicOff className="w-2.5 h-2.5 text-rose-400 shrink-0" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={`grid gap-4 flex-1 w-full max-w-6xl mx-auto items-center justify-center ${
              participants.length === 1 ? 'grid-cols-1 max-w-2xl' :
              participants.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl' :
              participants.length <= 4 ? 'grid-cols-2 max-w-5xl' :
              participants.length <= 6 ? 'grid-cols-2 md:grid-cols-3 max-w-6xl' :
              'grid-cols-2 md:grid-cols-4 max-w-6xl'
            }`}>
              {participants.map(p => {
                const isSelf = p.id === user?.id;
                const camStream = isSelf ? localCameraStream : remoteCameraStreams[p.id];
                const hasCamera = !!camStream && (isSelf ? isCameraOn : p.isCameraOn);

                return (
                  <div
                    key={p.id}
                    className={`aspect-video w-full rounded-2xl overflow-hidden relative flex flex-col items-center justify-center bg-zinc-900/90 border transition-all duration-200 ${
                      p.isSpeaking ? 'border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'border-white/10 hover:border-white/20'
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
                            className={p.isSpeaking ? 'ring-4 ring-emerald-500' : 'ring-4 ring-white/10'}
                          />
                          {p.role === 'ADMIN' && (
                            <span className="absolute -top-1 -right-1 p-1 rounded-full bg-amber-500 text-white shadow-xs">
                              <ShieldCheck className="w-3 h-3" />
                            </span>
                          )}
                          {p.role === 'CREATOR' && (
                            <span className="absolute -top-1 -right-1 p-1 rounded-full bg-blue-600 text-white shadow-xs">
                              <Crown className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-slate-200 tracking-tight">{p.name}</span>
                      </div>
                    )}

                    {p.isScreenSharing && (
                      <button
                        onClick={() => setSelectedScreenUserId(p.id)}
                        className="absolute top-3 left-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Ver ecrã partilhado"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Ver Ecrã</span>
                      </button>
                    )}

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <div className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 border border-white/10">
                        <span className="truncate max-w-[140px]">{p.name}</span>
                        {p.isSpeaking && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className={`p-1.5 rounded-lg backdrop-blur-md border ${
                          p.isMuted ? 'bg-rose-500/80 text-white border-rose-400/30' : 'bg-black/60 text-slate-300 border-white/10'
                        }`}>
                          {p.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
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
          <aside className="w-80 border-l border-white/10 bg-zinc-950 flex flex-col shrink-0 animate-fade-in z-20">
            <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {sideDrawer === 'chat' ? 'Mensagens da Chamada' : 'Participantes Conectados'}
              </h3>
              <button
                onClick={() => setSideDrawer('none')}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sideDrawer === 'chat' ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`text-xs ${msg.isSystem ? 'text-slate-400 italic text-center py-1' : ''}`}>
                      {!msg.isSystem && (
                        <div className="flex items-baseline justify-between mb-0.5">
                          <span className="font-bold text-blue-400">{msg.sender}</span>
                          <span className="text-[10px] text-slate-500">{msg.time}</span>
                        </div>
                      )}
                      <p className={`rounded-xl p-2.5 ${msg.isSystem ? 'bg-white/5 text-slate-400' : 'bg-zinc-900 text-slate-200 border border-white/5'}`}>
                        {msg.content}
                      </p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendChatMessage} className="p-3 border-t border-white/10 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Enviar mensagem..."
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={p.avatarUrl} name={p.name} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-white">{p.name}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{p.role?.toLowerCase() || 'membro'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      {p.isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                      {p.isCameraOn && <Video className="w-3.5 h-3.5 text-blue-400" />}
                      {p.isScreenSharing && <Monitor className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </main>

      <footer className="h-20 px-6 border-t border-white/5 bg-[#090a0f] flex items-center justify-center z-20 shrink-0">
        <div className="bg-zinc-900/90 backdrop-blur-xl px-3.5 py-2 rounded-2xl border border-white/10 flex items-center gap-2 shadow-2xl">
          <button
            onClick={toggleMic}
            className={`p-3 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isMicMuted
                ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-sm shadow-rose-600/30'
                : 'bg-white/10 text-slate-200 hover:bg-white/15 hover:text-white'
            }`}
            title={isMicMuted ? 'Ativar Microfone' : 'Silenciar Microfone'}
          >
            {isMicMuted ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={toggleCamera}
            className={`p-3 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isCameraOn
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-600/30'
                : 'bg-white/10 text-slate-200 hover:bg-white/15 hover:text-white'
            }`}
            title={isCameraOn ? 'Desligar Câmara' : 'Ligar Câmara'}
          >
            {isCameraOn ? <Video className="w-4 h-4 text-white" /> : <VideoOff className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isScreenSharing
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-600/30'
                : 'bg-white/10 text-slate-200 hover:bg-white/15 hover:text-white'
            }`}
            title={isScreenSharing ? 'Parar Partilha' : 'Partilhar Ecrã'}
          >
            {isScreenSharing ? <MonitorOff className="w-4 h-4 text-white" /> : <Monitor className="w-4 h-4 text-slate-400" />}
          </button>

          <div className="h-5 w-px bg-white/10 mx-1" />

          <button
            onClick={() => setSideDrawer(prev => prev === 'chat' ? 'none' : 'chat')}
            className={`p-3 rounded-xl font-bold transition-all cursor-pointer ${
              sideDrawer === 'chat'
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-slate-400 hover:bg-white/15 hover:text-white'
            }`}
            title="Chat da chamada"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSideDrawer(prev => prev === 'participants' ? 'none' : 'participants')}
            className={`p-3 rounded-xl font-bold transition-all cursor-pointer ${
              sideDrawer === 'participants'
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-slate-400 hover:bg-white/15 hover:text-white'
            }`}
            title="Participantes"
          >
            <Users className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-white/10 mx-1" />

          <button
            onClick={() => {
              soundEffects.playLeaveCall();
              onDisconnect?.();
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm shadow-rose-600/20 transition-all"
            title="Sair da chamada"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default CallStage;