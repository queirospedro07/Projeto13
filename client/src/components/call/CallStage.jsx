import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, MessageSquare, Users, Maximize2, Minimize2,
  X, Send, Volume2, ShieldCheck, Crown, LayoutGrid, Check,
  Radio
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
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
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
      socketId: 'self',
      name: `${user.name} (Você)`,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isSelf: true,
      isSpeaking: false,
      isMuted: false,
      isCameraOn: false,
      isScreenSharing: false
    }];
  });

  useEffect(() => {
    if (socket?.id) {
      setParticipants(prev => prev.map(p => p.isSelf ? { ...p, socketId: socket.id } : p));
    }
  }, [socket?.id]);

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
  const screenAudioSendersRef = useRef(new Map());
  const audioSendersRef = useRef(new Map());
  const makingOfferRef = useRef(new Map());

  const peerScreenStreamIdsRef = useRef(new Map());
  const peerCameraStreamIdsRef = useRef(new Map());
  const peerScreenTrackIdsRef = useRef(new Map());
  const peerCameraTrackIdsRef = useRef(new Map());
  const recentVideoTracksRef = useRef(new Map()); // track.id -> { targetUserId, stream, track, streamId }

  const remoteAudioElementsRef = useRef(new Map());
  const pendingIceCandidatesRef = useRef(new Map());
  const socketToUserRef = useRef(new Map());
  const userToSocketRef = useRef(new Map());

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastSpeakingRef = useRef(false);

  // Keep latest user in ref to avoid stale closures
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Duration Timer
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
        const isSpeakingNow = avg > 14 &&
          !localAudioStreamRef.current?.getAudioTracks()[0]?.muted &&
          localAudioStreamRef.current?.getAudioTracks()[0]?.enabled;

        if (lastSpeakingRef.current !== isSpeakingNow) {
          lastSpeakingRef.current = isSpeakingNow;
          const currentUserId = userRef.current?.id;
          setParticipants(prev => prev.map(p => p.id === currentUserId ? { ...p, isSpeaking: isSpeakingNow } : p));
          if (socket) {
            socket.emit('voice-speaking-state', { roomId: effectiveRoomId, userId: currentUserId, isSpeaking: isSpeakingNow });
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
      console.warn('Microfone não acessível ou sem permissão:', err);
      return null;
    }
  };

  // Helper to resolve whether a video track is screen share or camera
  const classifyAndStoreVideoTrack = useCallback((track, stream, targetUserId) => {
    if (!targetUserId) return;

    recentVideoTracksRef.current.set(track.id, {
      targetUserId,
      stream,
      track,
      streamId: stream.id
    });

    const knownScreenStreamId = peerScreenStreamIdsRef.current.get(targetUserId);
    const knownScreenTrackId = peerScreenTrackIdsRef.current.get(targetUserId);

    let isScreen = false;

    if (knownScreenStreamId && stream.id === knownScreenStreamId) {
      isScreen = true;
    } else if (knownScreenTrackId && track.id === knownScreenTrackId) {
      isScreen = true;
    } else {
      // Check if we already have a camera stream for this user that is distinct from this stream
      setRemoteCameraStreams(currentCameras => {
        const hasExistingCam = !!currentCameras[targetUserId] && currentCameras[targetUserId].id !== stream.id;
        if (hasExistingCam) {
          isScreen = true;
        }
        return currentCameras;
      });

      const label = (track.label || '').toLowerCase();
      const streamId = (stream.id || '').toLowerCase();
      if (label.includes('screen') || label.includes('display') || streamId.includes('screen')) {
        isScreen = true;
      }
    }

    if (isScreen) {
      setRemoteScreenStreams(prev => ({ ...prev, [targetUserId]: stream }));
      // Automatically focus on the shared screen
      setSelectedScreenUserId(targetUserId);
    } else {
      setRemoteCameraStreams(prev => ({ ...prev, [targetUserId]: stream }));
    }

    track.onended = () => {
      recentVideoTracksRef.current.delete(track.id);
      if (isScreen) {
        setRemoteScreenStreams(prev => {
          const next = { ...prev };
          delete next[targetUserId];
          return next;
        });
      } else {
        setRemoteCameraStreams(prev => {
          const next = { ...prev };
          delete next[targetUserId];
          return next;
        });
      }
    };
  }, []);

  // WebRTC Peer Connection Factory (Stable, not recreating on state updates)
  const getOrCreatePeerConnection = useCallback((targetSocketId, remoteUser) => {
    if (peerConnectionsRef.current.has(targetSocketId)) {
      return peerConnectionsRef.current.get(targetSocketId);
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionsRef.current.set(targetSocketId, pc);

    // Add local audio
    if (localAudioStreamRef.current) {
      localAudioStreamRef.current.getAudioTracks().forEach(track => {
        try {
          const sender = pc.addTrack(track, localAudioStreamRef.current);
          audioSendersRef.current.set(targetSocketId, sender);
        } catch (_) {}
      });
    }

    // Add local camera if active
    if (localCameraStreamRef.current) {
      const camTrack = localCameraStreamRef.current.getVideoTracks()[0];
      if (camTrack) {
        try {
          const sender = pc.addTrack(camTrack, localCameraStreamRef.current);
          cameraSendersRef.current.set(targetSocketId, sender);
        } catch (_) {}
      }
    }

    // Add local screen share if active
    if (localScreenStreamRef.current) {
      const screenTrack = localScreenStreamRef.current.getVideoTracks()[0];
      if (screenTrack) {
        try {
          const sender = pc.addTrack(screenTrack, localScreenStreamRef.current);
          screenSendersRef.current.set(targetSocketId, sender);
        } catch (_) {}
      }
      const screenAudioTrack = localScreenStreamRef.current.getAudioTracks()[0];
      if (screenAudioTrack) {
        try {
          const audioSender = pc.addTrack(screenAudioTrack, localScreenStreamRef.current);
          screenAudioSendersRef.current.set(targetSocketId, audioSender);
        } catch (_) {}
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
        classifyAndStoreVideoTrack(track, stream, targetUserId);
      }
    };

    return pc;
  }, [socket, classifyAndStoreVideoTrack]);

  // Signaling: Send Offer
  const sendOfferToPeer = useCallback(async (targetSocketId, callerUser) => {
    try {
      if (makingOfferRef.current.get(targetSocketId)) return;
      makingOfferRef.current.set(targetSocketId, true);

      const pc = getOrCreatePeerConnection(targetSocketId, callerUser);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      if (pc.signalingState !== 'stable') {
        await pc.setLocalDescription({ type: 'rollback' }).catch(() => {});
      }

      await pc.setLocalDescription(offer);

      socket?.emit('voice-signal-offer', {
        targetSocketId,
        offer: pc.localDescription,
        callerUser: userRef.current,
        cameraStreamId: localCameraStreamRef.current?.id || null,
        screenStreamId: localScreenStreamRef.current?.id || null,
        cameraTrackId: localCameraStreamRef.current?.getVideoTracks()[0]?.id || null,
        screenTrackId: localScreenStreamRef.current?.getVideoTracks()[0]?.id || null,
        isCameraOn: !!localCameraStreamRef.current,
        isScreenSharing: !!localScreenStreamRef.current
      });
    } catch (err) {
      console.error('Erro ao criar ou enviar oferta WebRTC:', err);
    } finally {
      makingOfferRef.current.set(targetSocketId, false);
    }
  }, [getOrCreatePeerConnection, socket]);

  // Main Session & WebRTC Lifecycle
  useEffect(() => {
    let isMounted = true;

    // 1. Emit join immediately to enter the room without waiting for microphone permission
    if (socket && userRef.current?.id) {
      socket.emit('join-voice-room', {
        roomId: effectiveRoomId,
        user: {
          id: userRef.current.id,
          name: userRef.current.name,
          username: userRef.current.username,
          avatarUrl: userRef.current.avatarUrl,
          role: userRef.current.role
        }
      });
    }

    // 2. Initialize local audio stream in background and add to any open peer connections
    initLocalAudio().then(stream => {
      if (stream && isMounted) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          for (const [targetSocketId, pc] of peerConnectionsRef.current.entries()) {
            try {
              const sender = pc.addTrack(audioTrack, stream);
              audioSendersRef.current.set(targetSocketId, sender);
              sendOfferToPeer(targetSocketId);
            } catch (_) {}
          }
        }
      }
    });

    if (socket && userRef.current?.id) {
      // 1. Existing participants in the room
      socket.on('voice-room-existing-users', async (existingList) => {
        if (!Array.isArray(existingList) || !isMounted) return;

        setParticipants(prev => {
          const next = [...prev];
          for (const item of existingList) {
            const remoteUser = item.user;
            // Identify remote peer by their socketId (must be different from my current socket)
            if (remoteUser && item.socketId && item.socketId !== socket.id) {
              socketToUserRef.current.set(item.socketId, remoteUser.id);
              userToSocketRef.current.set(remoteUser.id, item.socketId);

              if (item.screenStreamId) {
                peerScreenStreamIdsRef.current.set(remoteUser.id, item.screenStreamId);
              }
              if (item.cameraStreamId) {
                peerCameraStreamIdsRef.current.set(remoteUser.id, item.cameraStreamId);
              }
              if (item.screenTrackId) {
                peerScreenTrackIdsRef.current.set(remoteUser.id, item.screenTrackId);
              }
              if (item.cameraTrackId) {
                peerCameraTrackIdsRef.current.set(remoteUser.id, item.cameraTrackId);
              }

              const existingIdx = next.findIndex(p => p.socketId === item.socketId);
              const pData = {
                id: remoteUser.id,
                socketId: item.socketId,
                name: remoteUser.name,
                username: remoteUser.username,
                avatarUrl: remoteUser.avatarUrl,
                role: remoteUser.role,
                isSelf: false,
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

        // Initiate WebRTC offers to all existing peers
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

      // 2. New remote user joined
      socket.on('user-joined-voice', ({ user: remoteUser, socketId: remoteSocketId }) => {
        if (!remoteUser || !remoteSocketId || remoteSocketId === socket.id || !isMounted) return;

        socketToUserRef.current.set(remoteSocketId, remoteUser.id);
        userToSocketRef.current.set(remoteUser.id, remoteSocketId);

        setParticipants(prev => {
          const existingIdx = prev.findIndex(p => p.socketId === remoteSocketId);
          const pData = {
            id: remoteUser.id,
            socketId: remoteSocketId,
            name: remoteUser.name,
            username: remoteUser.username,
            avatarUrl: remoteUser.avatarUrl,
            role: remoteUser.role,
            isSelf: false,
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

      // 3. Incoming WebRTC Offer (Perfect Negotiation with Glare Handling)
      socket.on('voice-signal-offer', async ({
        callerSocketId,
        offer,
        callerUser,
        screenStreamId,
        cameraStreamId,
        screenTrackId,
        cameraTrackId
      }) => {
        try {
          if (callerUser?.id) {
            if (callerSocketId) {
              socketToUserRef.current.set(callerSocketId, callerUser.id);
              userToSocketRef.current.set(callerUser.id, callerSocketId);
            }
            if (screenStreamId) peerScreenStreamIdsRef.current.set(callerUser.id, screenStreamId);
            if (cameraStreamId) peerCameraStreamIdsRef.current.set(callerUser.id, cameraStreamId);
            if (screenTrackId) peerScreenTrackIdsRef.current.set(callerUser.id, screenTrackId);
            if (cameraTrackId) peerCameraTrackIdsRef.current.set(callerUser.id, cameraTrackId);
          }

          const pc = getOrCreatePeerConnection(callerSocketId, callerUser);
          const isPolite = (socket.id || '').localeCompare(callerSocketId) > 0;
          const offerCollision = (pc.signalingState !== 'stable') || makingOfferRef.current.get(callerSocketId);

          if (offerCollision && !isPolite) {
            return;
          }

          if (offerCollision && isPolite) {
            await pc.setLocalDescription({ type: 'rollback' }).catch(() => {});
          }

          await pc.setRemoteDescription(new RTCSessionDescription(offer));

          // Drain queued ICE candidates
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
            responderUser: userRef.current,
            screenStreamId: localScreenStreamRef.current?.id || null,
            cameraStreamId: localCameraStreamRef.current?.id || null,
            screenTrackId: localScreenStreamRef.current?.getVideoTracks()[0]?.id || null,
            cameraTrackId: localCameraStreamRef.current?.getVideoTracks()[0]?.id || null
          });
        } catch (err) {
          console.error('Erro ao processar oferta WebRTC:', err);
        }
      });

      // 4. Incoming WebRTC Answer
      socket.on('voice-signal-answer', async ({
        responderSocketId,
        answer,
        responderUser,
        screenStreamId,
        cameraStreamId,
        screenTrackId,
        cameraTrackId
      }) => {
        try {
          const rId = responderUser?.id || socketToUserRef.current.get(responderSocketId);
          if (rId) {
            if (screenStreamId) peerScreenStreamIdsRef.current.set(rId, screenStreamId);
            if (cameraStreamId) peerCameraStreamIdsRef.current.set(rId, cameraStreamId);
            if (screenTrackId) peerScreenTrackIdsRef.current.set(rId, screenTrackId);
            if (cameraTrackId) peerCameraTrackIdsRef.current.set(rId, cameraTrackId);
          }

          const pc = peerConnectionsRef.current.get(responderSocketId);
          if (pc && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            const pending = pendingIceCandidatesRef.current.get(responderSocketId) || [];
            for (const cand of pending) {
              try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (_) {}
            }
            pendingIceCandidatesRef.current.delete(responderSocketId);
          }
        } catch (err) {
          console.error('Erro ao processar resposta WebRTC:', err);
        }
      });

      // 5. Incoming ICE Candidate
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

      // 6. Remote user state changed (Mic, Camera, Screen Share)
      socket.on('user-voice-state-changed', ({
        userId,
        socketId,
        isMuted,
        isCameraOn: remoteCameraOn,
        isScreenSharing: remoteScreenSharing,
        cameraTrackId,
        screenTrackId,
        cameraStreamId,
        screenStreamId
      }) => {
        if (socketId && userId) {
          socketToUserRef.current.set(socketId, userId);
          userToSocketRef.current.set(userId, socketId);
        }

        if (screenStreamId) peerScreenStreamIdsRef.current.set(userId, screenStreamId);
        if (cameraStreamId) peerCameraStreamIdsRef.current.set(userId, cameraStreamId);
        if (screenTrackId) peerScreenTrackIdsRef.current.set(userId, screenTrackId);
        if (cameraTrackId) peerCameraTrackIdsRef.current.set(userId, cameraTrackId);

        // Screen share turned OFF
        if (remoteScreenSharing === false && userId) {
          setRemoteScreenStreams(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
          setSelectedScreenUserId(current => current === userId ? null : current);
        }
        // Screen share turned ON
        else if (remoteScreenSharing === true && userId) {
          setSelectedScreenUserId(userId);
          // Look for matching video track in recent tracks
          for (const [, data] of recentVideoTracksRef.current.entries()) {
            if (data.targetUserId === userId) {
              if (!screenStreamId || data.streamId === screenStreamId || data.track?.id === screenTrackId) {
                setRemoteScreenStreams(prev => ({ ...prev, [userId]: data.stream }));
                break;
              }
            }
          }
        }

        // Camera turned OFF
        if (remoteCameraOn === false && userId) {
          setRemoteCameraStreams(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        }
        // Camera turned ON
        else if (remoteCameraOn === true && userId) {
          for (const [, data] of recentVideoTracksRef.current.entries()) {
            if (data.targetUserId === userId) {
              if (data.streamId !== screenStreamId && data.track?.id !== screenTrackId) {
                setRemoteCameraStreams(prev => ({ ...prev, [userId]: data.stream }));
                break;
              }
            }
          }
        }

        setParticipants(prev => prev.map(p => {
          const isTarget = socketId ? p.socketId === socketId : (p.id === userId && !p.isSelf);
          if (!isTarget) return p;
          return {
            ...p,
            socketId: p.socketId || socketId,
            isMuted: isMuted !== undefined ? isMuted : p.isMuted,
            isCameraOn: remoteCameraOn !== undefined ? remoteCameraOn : p.isCameraOn,
            isScreenSharing: remoteScreenSharing !== undefined ? remoteScreenSharing : p.isScreenSharing,
            screenTrackId: screenTrackId || p.screenTrackId,
            cameraTrackId: cameraTrackId || p.cameraTrackId
          };
        }));
      });

      // 7. Speaking state changed
      socket.on('user-voice-speaking-changed', ({ userId, socketId, isSpeaking }) => {
        setParticipants(prev => prev.map(p => {
          const isTarget = socketId ? p.socketId === socketId : (p.id === userId && !p.isSelf);
          return isTarget ? { ...p, isSpeaking: !!isSpeaking } : p;
        }));
      });

      // 8. Remote user left voice
      socket.on('user-left-voice', ({ userId, socketId }) => {
        setParticipants(prev => prev.filter(p => p.isSelf || (socketId ? p.socketId !== socketId : p.id !== userId)));
        const sId = socketId || userToSocketRef.current.get(userId);
        if (sId) {
          const pc = peerConnectionsRef.current.get(sId);
          if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(sId);
          }
          cameraSendersRef.current.delete(sId);
          screenSendersRef.current.delete(sId);
          screenAudioSendersRef.current.delete(sId);
          audioSendersRef.current.delete(sId);

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
          setSelectedScreenUserId(current => current === userId ? null : current);
        }
      });

      // 9. Voice chat message
      socket.on('voice-chat-message', (msg) => {
        setChatMessages(prev => [...prev, msg]);
      });
    }

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      if (socket) {
        socket.emit('leave-voice-room', { roomId: effectiveRoomId, userId: userRef.current?.id });
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
      screenAudioSendersRef.current.clear();
      audioSendersRef.current.clear();

      remoteAudioElementsRef.current.forEach(audio => {
        audio.srcObject = null;
        audio.remove();
      });
      remoteAudioElementsRef.current.clear();
    };
  }, [effectiveRoomId, socket, getOrCreatePeerConnection, sendOfferToPeer, toast]);

  // Controls: Toggle Mic
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

    const currentUserId = userRef.current?.id;
    setParticipants(prev => prev.map(p => p.id === currentUserId ? { ...p, isMuted: nextMuted } : p));
    socket?.emit('voice-state-update', {
      roomId: effectiveRoomId,
      userId: currentUserId,
      isMuted: nextMuted
    });
  };

  // Controls: Toggle Camera
  const toggleCamera = async () => {
    const currentUserId = userRef.current?.id;

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

      setParticipants(prev => prev.map(p => p.id === currentUserId ? { ...p, isCameraOn: false } : p));
      socket?.emit('voice-state-update', {
        roomId: effectiveRoomId,
        userId: currentUserId,
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

        setParticipants(prev => prev.map(p => p.id === currentUserId ? { ...p, isCameraOn: true } : p));
        socket?.emit('voice-state-update', {
          roomId: effectiveRoomId,
          userId: currentUserId,
          isCameraOn: true,
          cameraTrackId: camTrack.id,
          cameraStreamId: stream.id
        });
      } catch (err) {
        toast({ title: 'Aviso', message: 'Não foi possível aceder à câmara.', type: 'error' });
      }
    }
  };

  // Helper to cleanly stop local screen sharing
  const stopLocalScreenShare = useCallback(() => {
    const currentUserId = userRef.current?.id;

    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach(t => t.stop());
      localScreenStreamRef.current = null;
    }
    setLocalScreenStream(null);
    setIsScreenSharing(false);

    for (const [targetSocketId, pc] of peerConnectionsRef.current.entries()) {
      const sender = screenSendersRef.current.get(targetSocketId);
      if (sender) {
        try { pc.removeTrack(sender); } catch (_) {}
        screenSendersRef.current.delete(targetSocketId);
      }
      const audioSender = screenAudioSendersRef.current.get(targetSocketId);
      if (audioSender) {
        try { pc.removeTrack(audioSender); } catch (_) {}
        screenAudioSendersRef.current.delete(targetSocketId);
      }
      sendOfferToPeer(targetSocketId);
    }

    setParticipants(prev => prev.map(p => p.id === currentUserId ? { ...p, isScreenSharing: false } : p));
    socket?.emit('voice-state-update', {
      roomId: effectiveRoomId,
      userId: currentUserId,
      isScreenSharing: false
    });

    setSelectedScreenUserId(current => current === currentUserId ? null : current);
  }, [effectiveRoomId, sendOfferToPeer, socket]);

  // Controls: Toggle Screen Share
  const toggleScreenShare = async () => {
    const currentUserId = userRef.current?.id;

    if (isScreenSharing) {
      stopLocalScreenShare();
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'monitor'
          },
          audio: true
        });

        localScreenStreamRef.current = stream;
        setLocalScreenStream(stream);
        setIsScreenSharing(true);
        setSelectedScreenUserId(currentUserId);

        const screenTrack = stream.getVideoTracks()[0];
        const screenAudioTrack = stream.getAudioTracks()[0];

        // Handle browser's native "Stop sharing" button
        screenTrack.onended = () => {
          stopLocalScreenShare();
        };

        for (const [targetSocketId, pc] of peerConnectionsRef.current.entries()) {
          try {
            const sender = pc.addTrack(screenTrack, stream);
            screenSendersRef.current.set(targetSocketId, sender);
            if (screenAudioTrack) {
              const audioSender = pc.addTrack(screenAudioTrack, stream);
              screenAudioSendersRef.current.set(targetSocketId, audioSender);
            }
            sendOfferToPeer(targetSocketId);
          } catch (_) {}
        }

        setParticipants(prev => prev.map(p => p.id === currentUserId ? { ...p, isScreenSharing: true } : p));
        socket?.emit('voice-state-update', {
          roomId: effectiveRoomId,
          userId: currentUserId,
          isScreenSharing: true,
          screenTrackId: screenTrack.id,
          screenStreamId: stream.id
        });

        toast({
          title: 'Partilha Iniciada',
          message: 'O seu ecrã está a ser transmitido para a sala.',
          type: 'success'
        });
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          toast({ title: 'Aviso', message: 'Não foi possível partilhar o ecrã.', type: 'error' });
        }
      }
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: `call-msg-${Date.now()}`,
      sender: userRef.current?.name || 'Eu',
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

  // Compile active screen shares
  const activeScreenShares = [];
  if (isScreenSharing && localScreenStream) {
    activeScreenShares.push({
      userId: userRef.current?.id,
      userName: `${userRef.current?.name} (Você)`,
      isSelf: true,
      stream: localScreenStream
    });
  }
  participants.forEach(p => {
    if (p.id !== userRef.current?.id && p.isScreenSharing) {
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

  // Reconcile selected screen share
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
      {/* Audio Autoplay Unblock Banner */}
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

      {/* Header */}
      <header className="h-14 px-5 border-b border-white/5 bg-[#090a0f]/90 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-md">
              {roomName}
            </h2>
          </div>
          {roomType === 'stage' && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Radio className="w-3 h-3 animate-pulse" />
              Palco Principal
            </span>
          )}
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

      {/* Active Screen Shares Bar */}
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
            <span>{selectedScreenUserId === 'none' ? 'Ver Ecrã' : 'Ver Grelha'}</span>
          </button>
        </div>
      )}

      {/* Stage Body */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-4 sm:p-6 flex flex-col overflow-y-auto custom-scrollbar">
          {/* Spotlight View for Screen Share */}
          {isViewingScreen ? (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="flex-1 rounded-2xl overflow-hidden bg-black border border-white/10 relative shadow-2xl flex items-center justify-center">
                <VideoPlayer stream={spotlightStream} isContain={true} />
                <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-white flex items-center gap-2 shadow-lg">
                  <Monitor className="w-3.5 h-3.5 text-blue-400" />
                  <span>{currentScreenShare?.isSelf ? 'O seu ecrã partilhado' : `Ecrã de ${currentScreenShare?.userName}`}</span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedScreenUserId('none')}
                    className="bg-black/75 hover:bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Grelha</span>
                  </button>
                </div>
              </div>

              {/* Participants Strip Below Screen Share */}
              <div className="h-24 sm:h-28 flex items-center gap-3 overflow-x-auto py-1 shrink-0">
                {participants.map(p => {
                  const isSelf = p.isSelf || p.socketId === socket?.id;
                  const camStream = isSelf ? localCameraStream : remoteCameraStreams[p.id];
                  const hasCamera = !!camStream && (isSelf ? isCameraOn : p.isCameraOn);

                  return (
                    <div
                      key={p.socketId || p.id}
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
            /* Grid View */
            <div className={`grid gap-4 flex-1 w-full max-w-6xl mx-auto items-center justify-center ${
              participants.length === 1 ? 'grid-cols-1 max-w-2xl' :
              participants.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl' :
              participants.length <= 4 ? 'grid-cols-2 max-w-5xl' :
              participants.length <= 6 ? 'grid-cols-2 md:grid-cols-3 max-w-6xl' :
              'grid-cols-2 md:grid-cols-4 max-w-6xl'
            }`}>
              {participants.map(p => {
                const isSelf = p.isSelf || p.socketId === socket?.id;
                const camStream = isSelf ? localCameraStream : remoteCameraStreams[p.id];
                const hasCamera = !!camStream && (isSelf ? isCameraOn : p.isCameraOn);

                return (
                  <div
                    key={p.socketId || p.id}
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
                            className="ring-4 ring-white/10"
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

                    {/* Button to view screen if this participant is sharing */}
                    {p.isScreenSharing && (
                      <button
                        onClick={() => setSelectedScreenUserId(p.id)}
                        className="absolute top-3 left-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
                        title="Ver ecrã partilhado"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Ver Ecrã</span>
                      </button>
                    )}

                    {/* Participant Name & Status Badge */}
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

        {/* Side Drawer: Chat or Participants */}
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
                  <div key={p.socketId || p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
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

      {/* Control Bar Footer */}
      <footer className="h-20 px-6 border-t border-white/5 bg-[#090a0f] flex items-center justify-center z-20 shrink-0">
        <div className="bg-zinc-900/90 backdrop-blur-xl px-3.5 py-2 rounded-2xl border border-white/10 flex items-center gap-2 shadow-2xl">
          {/* Mic */}
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

          {/* Camera */}
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

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isScreenSharing
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-600/30 animate-pulse'
                : 'bg-white/10 text-slate-200 hover:bg-white/15 hover:text-white'
            }`}
            title={isScreenSharing ? 'Parar Partilha de Ecrã' : 'Partilhar Ecrã'}
          >
            {isScreenSharing ? <MonitorOff className="w-4 h-4 text-white" /> : <Monitor className="w-4 h-4 text-slate-400" />}
          </button>

          <div className="h-5 w-px bg-white/10 mx-1" />

          {/* Chat Drawer Toggle */}
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

          {/* Participants Drawer Toggle */}
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

          {/* Leave Call */}
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