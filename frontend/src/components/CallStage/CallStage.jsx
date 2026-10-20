import './CallStage.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  LuMic as Mic,
  LuMicOff as MicOff,
  LuVideo as Video,
  LuVideoOff as VideoOff,
  LuMonitor as Monitor,
  LuMonitorOff as MonitorOff,
  LuPhoneOff as PhoneOff,
  LuMessageSquare as MessageSquare,
  LuUsers as Users,
  LuMaximize2 as Maximize2,
  LuMinimize2 as Minimize2,
  LuX as X,
  LuSend as Send,
  LuVolume2 as Volume2,
  LuShieldCheck as ShieldCheck,
  LuCrown as Crown,
  LuLayoutGrid as LayoutGrid,
  LuCheck as Check,
  LuRadio as Radio,
  LuHeadphones as Headphones,
  LuHeadphoneOff as HeadphoneOff,
} from 'react-icons/lu';
import { Avatar } from '../Avatar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useActiveCall } from '../../context/ActiveCallContext';
import { useToast } from '../Toast';
import { soundEffects } from '../../services/soundEffects';
import { formatRole } from '../../utils/formatters';

const RTC_CONFIG = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun1.l.google.com:19302',
    },
  ],
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
      className={`call-stage-video ${isContain ? 'call-stage-video-2' : 'call-stage-video-3'} ${isMirrored ? 'call-stage-video-4' : ''}`}
    />
  );
};

export const CallStage = ({
  roomName,
  roomId,
  roomType = 'voice',
  initialParticipants = [],
  onDisconnect,
  isModal = false,
  initialMuted = false,
  initialCameraOn = false,
}) => {
  const effectiveRoomId = roomId || roomName;
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const {
    updateCallAudioState,
    isMicMuted: contextMicMuted,
    isDeafened: contextDeafened,
  } = useActiveCall();
  const startMutedCalc = Boolean(initialMuted || contextMicMuted || contextDeafened);
  const startDeafenedCalc = Boolean(contextDeafened);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;

    return window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    document.body.classList.add('in-active-call');

    const prevOverflow = document.body.style.overflow;
    if (isMobile || isModal) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.classList.remove('in-active-call');
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobile, isModal]);

  const [isMicMuted, setIsMicMuted] = useState(startMutedCalc);
  const [isDeafened, setIsDeafened] = useState(startDeafenedCalc);
  const isDeafenedRef = useRef(startDeafenedCalc);
  const [isCameraOn, setIsCameraOn] = useState(Boolean(initialCameraOn));
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sideDrawer, setSideDrawer] = useState('none');
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isScreenMaximized, setIsScreenMaximized] = useState(false);
  const [participants, setParticipants] = useState(() => {
    if (initialParticipants.length > 0) return initialParticipants;
    if (!user) return [];

    return [
      {
        id: user.id,
        socketId: 'self',
        name: `${user.name} (Você)`,
        username: user.username,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isSelf: true,
        isSpeaking: false,
        isMuted: startMutedCalc,
        isDeafened: startDeafenedCalc,
        isCameraOn: Boolean(initialCameraOn),
        isScreenSharing: false,
      },
    ];
  });

  useEffect(() => {
    if (socket?.id) {
      setParticipants((prev) =>
        prev.map((p) =>
          p.isSelf
            ? {
                ...p,
                socketId: socket.id,
              }
            : p,
        ),
      );
    }
  }, [socket?.id]);

  const [localCameraStream, setLocalCameraStream] = useState(null);
  const [localScreenStream, setLocalScreenStream] = useState(null);
  const [remoteCameraStreams, setRemoteCameraStreams] = useState({});
  const [remoteScreenStreams, setRemoteScreenStreams] = useState({});
  const [selectedScreenUserId, setSelectedScreenUserId] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    {
      id: '1',
      sender: 'Sistema',
      content: `Chamada iniciada em "${roomName}".`,
      time: 'Agora',
      isSystem: true,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const containerRef = useRef(null);
  const chatMessagesEndRef = useRef(null);
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
    const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');

    return `${m}:${s}`;
  };

  const handleUnblockAudio = () => {
    remoteAudioElementsRef.current.forEach((audio) => {
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
        const isSpeakingNow =
          avg > 14 &&
          !localAudioStreamRef.current?.getAudioTracks()[0]?.muted &&
          localAudioStreamRef.current?.getAudioTracks()[0]?.enabled;
        if (lastSpeakingRef.current !== isSpeakingNow) {
          lastSpeakingRef.current = isSpeakingNow;

          const currentUserId = userRef.current?.id;

          setParticipants((prev) =>
            prev.map((p) =>
              p.id === currentUserId
                ? {
                    ...p,
                    isSpeaking: isSpeakingNow,
                  }
                : p,
            ),
          );
          if (socket) {
            socket.emit('voice-speaking-state', {
              roomId: effectiveRoomId,
              userId: currentUserId,
              isSpeaking: isSpeakingNow,
            });
          }
        }

        animFrameRef.current = requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch {}
  };

  const initLocalAudio = async () => {
    try {
      if (localAudioStreamRef.current) return localAudioStreamRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      if (startMutedCalc) {
        stream.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
      }

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
      streamId: stream.id,
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
      setRemoteCameraStreams((currentCameras) => {
        const hasExistingCam =
          !!currentCameras[targetUserId] && currentCameras[targetUserId].id !== stream.id;
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
      setRemoteScreenStreams((prev) => ({
        ...prev,
        [targetUserId]: stream,
      }));
      // Automatically focus on the shared screen
      setSelectedScreenUserId(targetUserId);
    } else {
      setRemoteCameraStreams((prev) => ({
        ...prev,
        [targetUserId]: stream,
      }));
    }

    track.onended = () => {
      recentVideoTracksRef.current.delete(track.id);
      if (isScreen) {
        setRemoteScreenStreams((prev) => {
          const next = {
            ...prev,
          };

          delete next[targetUserId];

          return next;
        });
      } else {
        setRemoteCameraStreams((prev) => {
          const next = {
            ...prev,
          };

          delete next[targetUserId];

          return next;
        });
      }
    };
  }, []);

  // WebRTC Peer Connection Factory (Stable, not recreating on state updates)
  const getOrCreatePeerConnection = useCallback(
    (targetSocketId, remoteUser) => {
      if (peerConnectionsRef.current.has(targetSocketId)) {
        return peerConnectionsRef.current.get(targetSocketId);
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);

      peerConnectionsRef.current.set(targetSocketId, pc);

      // Add local audio
      if (localAudioStreamRef.current) {
        localAudioStreamRef.current.getAudioTracks().forEach((track) => {
          try {
            const sender = pc.addTrack(track, localAudioStreamRef.current);

            audioSendersRef.current.set(targetSocketId, sender);
          } catch {}
        });
      }

      // Add local camera if active
      if (localCameraStreamRef.current) {
        const camTrack = localCameraStreamRef.current.getVideoTracks()[0];
        if (camTrack) {
          try {
            const sender = pc.addTrack(camTrack, localCameraStreamRef.current);

            cameraSendersRef.current.set(targetSocketId, sender);
          } catch {}
        }
      }

      // Add local screen share if active
      if (localScreenStreamRef.current) {
        const screenTrack = localScreenStreamRef.current.getVideoTracks()[0];
        if (screenTrack) {
          try {
            const sender = pc.addTrack(screenTrack, localScreenStreamRef.current);

            screenSendersRef.current.set(targetSocketId, sender);
          } catch {}
        }

        const screenAudioTrack = localScreenStreamRef.current.getAudioTracks()[0];
        if (screenAudioTrack) {
          try {
            const audioSender = pc.addTrack(screenAudioTrack, localScreenStreamRef.current);

            screenAudioSendersRef.current.set(targetSocketId, audioSender);
          } catch {}
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('voice-signal-ice', {
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const { track } = event;
        const targetUserId = socketToUserRef.current.get(targetSocketId) || remoteUser?.id;
        const stream =
          event.streams && event.streams[0] ? event.streams[0] : new MediaStream([track]);
        if (track.kind === 'audio') {
          let audio = remoteAudioElementsRef.current.get(targetSocketId);
          if (!audio) {
            audio = document.createElement('audio');
            audio.autoplay = true;
            audio.playsInline = true;
            audio.muted = isDeafenedRef.current;
            document.body.appendChild(audio);
            remoteAudioElementsRef.current.set(targetSocketId, audio);
          } else {
            audio.muted = isDeafenedRef.current;
          }

          audio.srcObject = stream;
          audio.play().catch(() => setAutoplayBlocked(true));
        } else if (track.kind === 'video') {
          classifyAndStoreVideoTrack(track, stream, targetUserId);
        }
      };

      return pc;
    },
    [socket, classifyAndStoreVideoTrack],
  );

  // Signaling: Send Offer
  const sendOfferToPeer = useCallback(
    async (targetSocketId, callerUser) => {
      try {
        if (makingOfferRef.current.get(targetSocketId)) return;
        makingOfferRef.current.set(targetSocketId, true);

        const pc = getOrCreatePeerConnection(targetSocketId, callerUser);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        if (pc.signalingState !== 'stable') {
          await pc
            .setLocalDescription({
              type: 'rollback',
            })
            .catch(() => {});
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
          isScreenSharing: !!localScreenStreamRef.current,
        });
      } catch (err) {
        console.error('Erro ao criar ou enviar oferta WebRTC:', err);
      } finally {
        makingOfferRef.current.set(targetSocketId, false);
      }
    },
    [getOrCreatePeerConnection, socket],
  );

  // Main Session & WebRTC Lifecycle
  useEffect(() => {
    let isMounted = true;
    // Join without waiting for microphone permission; calls use direct connections and STUN.
    if (socket && userRef.current?.id) {
      socket.emit('join-voice-room', {
        roomId: effectiveRoomId,
        user: {
          id: userRef.current.id,
          name: userRef.current.name,
          username: userRef.current.username,
          avatarUrl: userRef.current.avatarUrl,
          role: userRef.current.role,
        },
        isMuted: isMicMuted,
        isDeafened: isDeafened,
        isCameraOn: Boolean(initialCameraOn),
      });
    }

    // 2. Initialize local audio stream in background and add to any open peer connections
    initLocalAudio().then((stream) => {
      if (stream && isMounted) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          if (isMicMuted) {
            audioTrack.enabled = false;
          }

          for (const [targetSocketId, pc] of peerConnectionsRef.current.entries()) {
            try {
              const sender = pc.addTrack(audioTrack, stream);

              audioSendersRef.current.set(targetSocketId, sender);
              sendOfferToPeer(targetSocketId);
            } catch {}
          }
        }
      }
    });

    // 3. If user chose to enter with camera on, initialize camera stream
    if (initialCameraOn) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
            facingMode: 'user',
          },
          audio: false,
        })
        .then((camStream) => {
          if (!isMounted) {
            camStream.getTracks().forEach((t) => t.stop());

            return;
          }

          localCameraStreamRef.current = camStream;
          setLocalCameraStream(camStream);
          setIsCameraOn(true);

          const camTrack = camStream.getVideoTracks()[0];
          for (const [targetSocketId, pc] of peerConnectionsRef.current.entries()) {
            try {
              const sender = pc.addTrack(camTrack, camStream);

              cameraSendersRef.current.set(targetSocketId, sender);
              sendOfferToPeer(targetSocketId);
            } catch {}
          }

          setParticipants((prev) =>
            prev.map((p) =>
              p.isSelf
                ? {
                    ...p,
                    isCameraOn: true,
                  }
                : p,
            ),
          );
          socket?.emit('voice-state-update', {
            roomId: effectiveRoomId,
            userId: userRef.current?.id,
            isCameraOn: true,
            cameraTrackId: camTrack?.id,
            cameraStreamId: camStream.id,
          });
        })
        .catch((err) => {
          console.warn('Erro ao ligar câmara na entrada:', err);
        });
    }

    if (socket && userRef.current?.id) {
      // 1. Existing participants in the room
      socket.on('voice-room-existing-users', async (existingList) => {
        if (!Array.isArray(existingList) || !isMounted) return;
        setParticipants((prev) => {
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

              const existingIdx = next.findIndex((p) => p.socketId === item.socketId);
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
                isDeafened: !!item.isDeafened,
                isCameraOn: !!item.isCameraOn,
                isScreenSharing: !!item.isScreenSharing,
                screenTrackId: item.screenTrackId,
                cameraTrackId: item.cameraTrackId,
              };
              if (existingIdx >= 0) {
                next[existingIdx] = {
                  ...next[existingIdx],
                  ...pData,
                };
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
      socket.on(
        'user-joined-voice',
        ({
          user: remoteUser,
          socketId: remoteSocketId,
          isMuted: remoteMuted,
          isDeafened: remoteDeafened,
          isCameraOn: remoteCameraOn,
        }) => {
          if (!remoteUser || !remoteSocketId || remoteSocketId === socket.id || !isMounted) return;
          socketToUserRef.current.set(remoteSocketId, remoteUser.id);
          userToSocketRef.current.set(remoteUser.id, remoteSocketId);
          setParticipants((prev) => {
            const existingIdx = prev.findIndex((p) => p.socketId === remoteSocketId);
            const pData = {
              id: remoteUser.id,
              socketId: remoteSocketId,
              name: remoteUser.name,
              username: remoteUser.username,
              avatarUrl: remoteUser.avatarUrl,
              role: remoteUser.role,
              isSelf: false,
              isSpeaking: false,
              isMuted: remoteMuted !== undefined ? Boolean(remoteMuted) : false,
              isDeafened: remoteDeafened !== undefined ? Boolean(remoteDeafened) : false,
              isCameraOn: remoteCameraOn !== undefined ? Boolean(remoteCameraOn) : false,
              isScreenSharing: false,
            };
            if (existingIdx >= 0) {
              const next = [...prev];

              next[existingIdx] = {
                ...next[existingIdx],
                ...pData,
              };

              return next;
            }

            return [...prev, pData];
          });
          toast({
            title: 'Conectado',
            message: `${remoteUser.name} juntou-se à chamada.`,
            type: 'info',
          });
        },
      );

      // 3. Incoming WebRTC Offer (Perfect Negotiation with Glare Handling)
      socket.on(
        'voice-signal-offer',
        async ({
          callerSocketId,
          offer,
          callerUser,
          screenStreamId,
          cameraStreamId,
          screenTrackId,
          cameraTrackId,
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
            const offerCollision =
              pc.signalingState !== 'stable' || makingOfferRef.current.get(callerSocketId);
            if (offerCollision && !isPolite) {
              return;
            }

            if (offerCollision && isPolite) {
              await pc
                .setLocalDescription({
                  type: 'rollback',
                })
                .catch(() => {});
            }

            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            // Drain queued ICE candidates
            const pending = pendingIceCandidatesRef.current.get(callerSocketId) || [];
            for (const cand of pending) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch {}
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
              cameraTrackId: localCameraStreamRef.current?.getVideoTracks()[0]?.id || null,
            });
          } catch (err) {
            console.error('Erro ao processar oferta WebRTC:', err);
          }
        },
      );

      // 4. Incoming WebRTC Answer
      socket.on(
        'voice-signal-answer',
        async ({
          responderSocketId,
          answer,
          responderUser,
          screenStreamId,
          cameraStreamId,
          screenTrackId,
          cameraTrackId,
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
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch {}
              }

              pendingIceCandidatesRef.current.delete(responderSocketId);
            }
          } catch (err) {
            console.error('Erro ao processar resposta WebRTC:', err);
          }
        },
      );

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
        } catch {}
      });

      // 6. Remote user state changed (Mic, Camera, Screen Share)
      socket.on(
        'user-voice-state-changed',
        ({
          userId,
          socketId,
          isMuted,
          isDeafened: remoteDeafened,
          isCameraOn: remoteCameraOn,
          isScreenSharing: remoteScreenSharing,
          cameraTrackId,
          screenTrackId,
          cameraStreamId,
          screenStreamId,
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
            setRemoteScreenStreams((prev) => {
              const next = {
                ...prev,
              };

              delete next[userId];

              return next;
            });
            setSelectedScreenUserId((current) => (current === userId ? null : current));
          }
          // Screen share turned ON
          else if (remoteScreenSharing === true && userId) {
            setSelectedScreenUserId(userId);
            // Look for matching video track in recent tracks
            for (const [, data] of recentVideoTracksRef.current.entries()) {
              if (data.targetUserId === userId) {
                if (
                  !screenStreamId ||
                  data.streamId === screenStreamId ||
                  data.track?.id === screenTrackId
                ) {
                  setRemoteScreenStreams((prev) => ({
                    ...prev,
                    [userId]: data.stream,
                  }));
                  break;
                }
              }
            }
          }

          // Camera turned OFF
          if (remoteCameraOn === false && userId) {
            setRemoteCameraStreams((prev) => {
              const next = {
                ...prev,
              };

              delete next[userId];

              return next;
            });
          }
          // Camera turned ON
          else if (remoteCameraOn === true && userId) {
            for (const [, data] of recentVideoTracksRef.current.entries()) {
              if (data.targetUserId === userId) {
                if (data.streamId !== screenStreamId && data.track?.id !== screenTrackId) {
                  setRemoteCameraStreams((prev) => ({
                    ...prev,
                    [userId]: data.stream,
                  }));
                  break;
                }
              }
            }
          }

          setParticipants((prev) =>
            prev.map((p) => {
              const isTarget = socketId ? p.socketId === socketId : p.id === userId && !p.isSelf;
              if (!isTarget) return p;

              return {
                ...p,
                socketId: p.socketId || socketId,
                isMuted: isMuted !== undefined ? isMuted : p.isMuted,
                isDeafened: remoteDeafened !== undefined ? remoteDeafened : p.isDeafened,
                isCameraOn: remoteCameraOn !== undefined ? remoteCameraOn : p.isCameraOn,
                isScreenSharing:
                  remoteScreenSharing !== undefined ? remoteScreenSharing : p.isScreenSharing,
                screenTrackId: screenTrackId || p.screenTrackId,
                cameraTrackId: cameraTrackId || p.cameraTrackId,
              };
            }),
          );
        },
      );

      // 7. Speaking state changed
      socket.on('user-voice-speaking-changed', ({ userId, socketId, isSpeaking }) => {
        setParticipants((prev) =>
          prev.map((p) => {
            const isTarget = socketId ? p.socketId === socketId : p.id === userId && !p.isSelf;

            return isTarget
              ? {
                  ...p,
                  isSpeaking: !!isSpeaking,
                }
              : p;
          }),
        );
      });

      // 8. Remote user left voice
      socket.on('user-left-voice', ({ userId, socketId }) => {
        setParticipants((prev) =>
          prev.filter((p) => p.isSelf || (socketId ? p.socketId !== socketId : p.id !== userId)),
        );

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
          setRemoteCameraStreams((prev) => {
            const next = {
              ...prev,
            };

            delete next[userId];

            return next;
          });
          setRemoteScreenStreams((prev) => {
            const next = {
              ...prev,
            };

            delete next[userId];

            return next;
          });
          setSelectedScreenUserId((current) => (current === userId ? null : current));
        }
      });

      // 9. Voice chat message
      socket.on('voice-chat-message', (msg) => {
        if (!msg) return;
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;

          return [...prev, msg];
        });
      });
    }

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (socket) {
        socket.emit('leave-voice-room', {
          roomId: effectiveRoomId,
          userId: userRef.current?.id,
        });
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
        localAudioStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (localCameraStreamRef.current) {
        localCameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (localScreenStreamRef.current) {
        localScreenStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      cameraSendersRef.current.clear();
      screenSendersRef.current.clear();
      screenAudioSendersRef.current.clear();
      audioSendersRef.current.clear();
      remoteAudioElementsRef.current.forEach((audio) => {
        audio.srcObject = null;
        audio.remove();
      });
      remoteAudioElementsRef.current.clear();
    };
  }, [effectiveRoomId, socket, getOrCreatePeerConnection, sendOfferToPeer, toast]);

  // Controls: Toggle Mic
  const toggleMic = useCallback(() => {
    setIsMicMuted((prevMuted) => {
      const nextMuted = !prevMuted;
      if (localAudioStreamRef.current) {
        localAudioStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = !nextMuted;
        });
      }

      if (nextMuted) {
        soundEffects.playMute();
      } else {
        soundEffects.playUnmute();
      }

      // If unmuting while deafened, automatically undeafen!
      let nextDeafened = isDeafenedRef.current;
      if (!nextMuted && isDeafenedRef.current) {
        nextDeafened = false;
        isDeafenedRef.current = false;
        setIsDeafened(false);
        remoteAudioElementsRef.current.forEach((audio) => {
          audio.muted = false;
        });
      }

      const currentUserId = userRef.current?.id;

      setParticipants((prev) =>
        prev.map((p) =>
          p.id === currentUserId
            ? {
                ...p,
                isMuted: nextMuted,
                isDeafened: nextDeafened,
              }
            : p,
        ),
      );
      socket?.emit('voice-state-update', {
        roomId: effectiveRoomId,
        userId: currentUserId,
        isMuted: nextMuted,
        isDeafened: nextDeafened,
      });
      updateCallAudioState({
        isMuted: nextMuted,
        isDeafened: nextDeafened,
      });

      return nextMuted;
    });
  }, [effectiveRoomId, socket, updateCallAudioState]);

  // Controls: Toggle Deafen
  const toggleDeafen = useCallback(() => {
    const nextDeafened = !isDeafenedRef.current;

    isDeafenedRef.current = nextDeafened;
    setIsDeafened(nextDeafened);

    // 1. Mute or unmute all remote audio elements
    remoteAudioElementsRef.current.forEach((audio) => {
      audio.muted = nextDeafened;
    });

    // 2. Play sound effects
    if (nextDeafened) {
      soundEffects.playDeafen();
    } else {
      soundEffects.playUndeafen();
    }

    // 3. Ao ficar deafen, o microfone fica OFF também!
    let nextMicMuted = isMicMuted;
    if (nextDeafened) {
      nextMicMuted = true;
      setIsMicMuted(true);
      if (localAudioStreamRef.current) {
        localAudioStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
      }
    }

    const currentUserId = userRef.current?.id;

    setParticipants((prev) =>
      prev.map((p) =>
        p.id === currentUserId
          ? {
              ...p,
              isMuted: nextMicMuted,
              isDeafened: nextDeafened,
            }
          : p,
      ),
    );
    socket?.emit('voice-state-update', {
      roomId: effectiveRoomId,
      userId: currentUserId,
      isMuted: nextMicMuted,
      isDeafened: nextDeafened,
    });
    updateCallAudioState({
      isMuted: nextMicMuted,
      isDeafened: nextDeafened,
    });
  }, [effectiveRoomId, isMicMuted, socket, updateCallAudioState]);

  // Sync initial audio state to ActiveCallContext
  useEffect(() => {
    updateCallAudioState({
      isMuted: isMicMuted,
      isDeafened,
    });
  }, [updateCallAudioState]);

  // Listen to remote toggle & leave events from Sidebar / Global controls
  useEffect(() => {
    const handleRemoteToggleMic = () => {
      toggleMic();
    };

    const handleRemoteToggleDeafen = () => {
      toggleDeafen();
    };

    const handleRemoteLeave = () => {
      onDisconnect?.();
    };

    window.addEventListener('nexo_call_toggle_mic', handleRemoteToggleMic);
    window.addEventListener('nexo_call_toggle_deafen', handleRemoteToggleDeafen);
    window.addEventListener('nexo_call_leave', handleRemoteLeave);

    return () => {
      window.removeEventListener('nexo_call_toggle_mic', handleRemoteToggleMic);
      window.removeEventListener('nexo_call_toggle_deafen', handleRemoteToggleDeafen);
      window.removeEventListener('nexo_call_leave', handleRemoteLeave);
    };
  }, [toggleMic, toggleDeafen, onDisconnect]);

  // Controls: Toggle Camera
  const toggleCamera = async () => {
    const currentUserId = userRef.current?.id;
    if (isCameraOn) {
      if (localCameraStreamRef.current) {
        localCameraStreamRef.current.getTracks().forEach((t) => t.stop());
        localCameraStreamRef.current = null;
      }

      setLocalCameraStream(null);
      setIsCameraOn(false);
      for (const [targetSocketId, pc] of peerConnectionsRef.current.entries()) {
        const sender = cameraSendersRef.current.get(targetSocketId);
        if (sender) {
          try {
            pc.removeTrack(sender);
          } catch {}

          cameraSendersRef.current.delete(targetSocketId);
        }

        sendOfferToPeer(targetSocketId);
      }

      setParticipants((prev) =>
        prev.map((p) =>
          p.id === currentUserId
            ? {
                ...p,
                isCameraOn: false,
              }
            : p,
        ),
      );
      socket?.emit('voice-state-update', {
        roomId: effectiveRoomId,
        userId: currentUserId,
        isCameraOn: false,
      });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
            facingMode: 'user',
          },
          audio: false,
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
          } catch {}
        }

        setParticipants((prev) =>
          prev.map((p) =>
            p.id === currentUserId
              ? {
                  ...p,
                  isCameraOn: true,
                }
              : p,
          ),
        );
        socket?.emit('voice-state-update', {
          roomId: effectiveRoomId,
          userId: currentUserId,
          isCameraOn: true,
          cameraTrackId: camTrack.id,
          cameraStreamId: stream.id,
        });
      } catch {
        toast({
          title: 'Aviso',
          message: 'Não foi possível aceder à câmara.',
          type: 'error',
        });
      }
    }
  };

  // Helper to cleanly stop local screen sharing
  const stopLocalScreenShare = useCallback(() => {
    const currentUserId = userRef.current?.id;
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach((t) => t.stop());
      localScreenStreamRef.current = null;
    }

    setLocalScreenStream(null);
    setIsScreenSharing(false);
    for (const [targetSocketId, pc] of peerConnectionsRef.current.entries()) {
      const sender = screenSendersRef.current.get(targetSocketId);
      if (sender) {
        try {
          pc.removeTrack(sender);
        } catch {}

        screenSendersRef.current.delete(targetSocketId);
      }

      const audioSender = screenAudioSendersRef.current.get(targetSocketId);
      if (audioSender) {
        try {
          pc.removeTrack(audioSender);
        } catch {}

        screenAudioSendersRef.current.delete(targetSocketId);
      }

      sendOfferToPeer(targetSocketId);
    }

    setParticipants((prev) =>
      prev.map((p) =>
        p.id === currentUserId
          ? {
              ...p,
              isScreenSharing: false,
            }
          : p,
      ),
    );
    socket?.emit('voice-state-update', {
      roomId: effectiveRoomId,
      userId: currentUserId,
      isScreenSharing: false,
    });
    setSelectedScreenUserId((current) => (current === currentUserId ? null : current));
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
            displaySurface: 'monitor',
          },
          audio: true,
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
          } catch {}
        }

        setParticipants((prev) =>
          prev.map((p) =>
            p.id === currentUserId
              ? {
                  ...p,
                  isScreenSharing: true,
                }
              : p,
          ),
        );
        socket?.emit('voice-state-update', {
          roomId: effectiveRoomId,
          userId: currentUserId,
          isScreenSharing: true,
          screenTrackId: screenTrack.id,
          screenStreamId: stream.id,
        });
        toast({
          title: 'Partilha Iniciada',
          message: 'O seu ecrã está a ser transmitido para a sala.',
          type: 'success',
        });
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          toast({
            title: 'Aviso',
            message: 'Não foi possível partilhar o ecrã.',
            type: 'error',
          });
        }
      }
    }
  };

  useEffect(() => {
    if (sideDrawer === 'chat') {
      chatMessagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
    }
  }, [chatMessages, sideDrawer]);

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = {
      id: `call-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender: userRef.current?.name || 'Eu',
      content: chatInput.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setChatMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
    socket?.emit('voice-chat-message', {
      roomId: effectiveRoomId,
      message: newMsg,
    });
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
      stream: localScreenStream,
    });
  }

  participants.forEach((p) => {
    if (p.id !== userRef.current?.id && p.isScreenSharing) {
      const stream = remoteScreenStreams[p.id];
      if (stream) {
        activeScreenShares.push({
          userId: p.id,
          userName: p.name,
          isSelf: false,
          stream,
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
        const stillActive = activeScreenShares.some((s) => s.userId === selectedScreenUserId);
        if (!stillActive) {
          setSelectedScreenUserId(activeScreenShares[0].userId);
        }
      }
    } else if (selectedScreenUserId && selectedScreenUserId !== 'none') {
      setSelectedScreenUserId(null);
    }
  }, [activeScreenShares.length, selectedScreenUserId]);

  const currentScreenShare = activeScreenShares.find((s) => s.userId === selectedScreenUserId);
  const spotlightStream = currentScreenShare?.stream || null;
  const isViewingScreen = spotlightStream && selectedScreenUserId !== 'none';
  const stageContent = (
    <div
      ref={containerRef}
      data-call-stage="true"
      className={isMobile || isModal ? 'call-stage-panel' : 'call-stage-panel-2'}
    >
      {/* Audio Autoplay Unblock Banner */}
      {autoplayBlocked && (
        <div className="call-stage-panel-3">
          <Volume2 className="call-stage-volume2" />
          <span>O áudio foi pausado pelo navegador.</span>
          <button
            onClick={handleUnblockAudio}
            className="call-stage-button"
          >
            Ativar Áudio
          </button>
        </div>
      )}

      {/* Header */}
      <header className="call-stage-header">
        <div className="call-stage-panel-4">
          <div className="call-stage-panel-5">
            <span className="call-stage-label" />
            <h2 className="call-stage-heading">{roomName}</h2>
          </div>
          {roomType === 'stage' && (
            <span className="call-stage-label-2">
              <Radio className="call-stage-radio" />
              Palco Principal
            </span>
          )}
        </div>

        <div className="call-stage-panel-6">
          <div className="call-stage-panel-7">{formatTime(callDuration)}</div>

          <div className="call-stage-panel-8">
            <Users className="call-stage-users" />
            <span>{participants.length}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="call-stage-button-2"
            title="Ecrã inteiro"
            aria-label="Alternar ecrã inteiro"
          >
            {isFullscreen ? (
              <Minimize2 className="call-stage-volume2" />
            ) : (
              <Maximize2 className="call-stage-volume2" />
            )}
          </button>

          {/* Quick Leave Button for Mobile in Header */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playLeaveCall();
              onDisconnect?.();
            }}
            className="call-stage-button-3"
            title="Sair da chamada"
            aria-label="Sair da chamada"
          >
            <PhoneOff className="call-stage-phone-off" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Active Screen Shares Bar */}
      {activeScreenShares.length > 0 && (
        <div className="call-stage-panel-9">
          <div className="call-stage-panel-5">
            <span className="call-stage-label-3">
              <Monitor className="call-stage-monitor" />
              <span>Transmissões:</span>
            </span>

            {activeScreenShares.map((share) => (
              <button
                key={share.userId}
                onClick={() => setSelectedScreenUserId(share.userId)}
                className={`call-stage-button-4 ${selectedScreenUserId === share.userId ? 'call-stage-button-5' : 'call-stage-button-6'}`}
              >
                <Monitor className="call-stage-phone-off" />
                <span>{share.userName}</span>
                {selectedScreenUserId === share.userId && <Check className="call-stage-check" />}
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              setSelectedScreenUserId((prev) =>
                prev === 'none' ? activeScreenShares[0]?.userId || null : 'none',
              )
            }
            className={`call-stage-button-7 ${selectedScreenUserId === 'none' ? 'call-stage-button-8' : 'call-stage-button-9'}`}
          >
            <LayoutGrid className="call-stage-phone-off" />
            <span>{selectedScreenUserId === 'none' ? 'Ver Ecrã' : 'Ver Grelha'}</span>
          </button>
        </div>
      )}

      {/* Stage Body */}
      <main className="call-stage-main">
        <div className="call-stage-panel-10 custom-scrollbar">
          {/* Spotlight View for Screen Share */}
          {isViewingScreen ? (
            <div className="call-stage-panel-11">
              <div className="call-stage-panel-12">
                <VideoPlayer
                  stream={spotlightStream}
                  isContain={true}
                />
                <div className="call-stage-panel-13">
                  <Monitor className="call-stage-monitor-2" />
                  <span>
                    {currentScreenShare?.isSelf
                      ? 'O seu ecrã partilhado'
                      : `Ecrã de ${currentScreenShare?.userName}`}
                  </span>
                </div>

                <div className="call-stage-panel-14">
                  <button
                    onClick={() => setIsScreenMaximized((prev) => !prev)}
                    className="call-stage-button-10"
                    title={isScreenMaximized ? 'Restaurar visualização' : 'Ecrã inteiro'}
                  >
                    {isScreenMaximized ? (
                      <Minimize2 className="call-stage-phone-off" />
                    ) : (
                      <Maximize2 className="call-stage-phone-off" />
                    )}
                    <span>{isScreenMaximized ? 'Restaurar' : 'Ecrã Inteiro'}</span>
                  </button>
                  <button
                    onClick={() => setSelectedScreenUserId('none')}
                    className="call-stage-button-10"
                  >
                    <LayoutGrid className="call-stage-phone-off" />
                    <span>Grelha</span>
                  </button>
                </div>
              </div>

              {/* Participants Strip Below Screen Share */}
              {!isScreenMaximized && (
                <div className="call-stage-panel-15">
                  {participants.map((p) => {
                    const isSelf = p.isSelf || p.socketId === socket?.id;
                    const camStream = isSelf ? localCameraStream : remoteCameraStreams[p.id];
                    const hasCamera = !!camStream && (isSelf ? isCameraOn : p.isCameraOn);

                    return hasCamera ? (
                      <div
                        key={p.socketId || p.id}
                        className="call-stage-panel-16"
                      >
                        <VideoPlayer
                          stream={camStream}
                          isMirrored={isSelf}
                        />
                        <div className="call-stage-panel-17 backdrop-blur-xs">
                          <span className="call-stage-label-4">{p.name}</span>
                          {p.isMuted && <MicOff className="call-stage-mic-off" />}
                        </div>
                      </div>
                    ) : (
                      <div
                        key={p.socketId || p.id}
                        className="call-stage-panel-18"
                      >
                        <Avatar
                          src={p.avatarUrl}
                          name={p.name}
                          size="sm"
                        />
                        <div className="call-stage-panel-19">
                          <div className="call-stage-panel-20">
                            <span className="call-stage-label-5">{p.name}</span>
                            {p.isSpeaking && <span className="call-stage-label-6" />}
                          </div>
                          {p.isDeafened && (
                            <span className="call-stage-label-7">
                              <HeadphoneOff className="call-stage-headphone-off" /> Ensurdecido
                            </span>
                          )}
                          {p.isMuted && !p.isDeafened && (
                            <span className="call-stage-label-7">
                              <MicOff className="call-stage-headphone-off" /> Silenciado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div> /* Grid View */
          ) : (
            <div
              className={`call-stage-panel-21 ${participants.length === 1 ? 'call-stage-panel-22' : participants.length === 2 ? 'call-stage-panel-23' : participants.length <= 4 ? 'call-stage-panel-24' : participants.length <= 6 ? 'call-stage-panel-25' : 'call-stage-panel-26'}`}
            >
              {participants.map((p) => {
                const isSelf = p.isSelf || p.socketId === socket?.id;
                const camStream = isSelf ? localCameraStream : remoteCameraStreams[p.id];
                const hasCamera = !!camStream && (isSelf ? isCameraOn : p.isCameraOn);

                return (
                  <div
                    key={p.socketId || p.id}
                    className={`call-stage-panel-27 ${p.isSpeaking ? 'call-stage-panel-28' : 'call-stage-panel-29'}`}
                  >
                    {hasCamera ? (
                      <VideoPlayer
                        stream={camStream}
                        isMirrored={isSelf}
                      />
                    ) : (
                      <div className="call-stage-panel-30">
                        <div className="call-stage-panel-31">
                          <Avatar
                            src={p.avatarUrl}
                            name={p.name}
                            size="xl"
                            className="call-stage-avatar"
                          />
                          {p.role === 'ADMIN' && (
                            <span className="call-stage-label-8">
                              <ShieldCheck className="call-stage-shield-check" />
                            </span>
                          )}
                          {p.role === 'CREATOR' && (
                            <span className="call-stage-label-9">
                              <Crown className="call-stage-shield-check" />
                            </span>
                          )}
                        </div>
                        <span className="call-stage-label-10">{p.name}</span>
                      </div>
                    )}

                    {/* Button to view screen if this participant is sharing */}
                    {p.isScreenSharing && (
                      <button
                        onClick={() => setSelectedScreenUserId(p.id)}
                        className="call-stage-button-11"
                        title="Ver ecrã partilhado"
                      >
                        <Monitor className="call-stage-phone-off" />
                        <span>Ver Ecrã</span>
                      </button>
                    )}

                    {/* Participant Name & Status Badge */}
                    <div className="call-stage-panel-32">
                      <div className="call-stage-panel-33">
                        <span className="call-stage-label-11">{p.name}</span>
                        {p.isSpeaking && <span className="call-stage-label" />}
                      </div>

                      <div className="call-stage-panel-34">
                        {p.isDeafened && (
                          <div
                            className="call-stage-panel-35"
                            title="Ensurdecido"
                          >
                            <HeadphoneOff className="call-stage-phone-off" />
                          </div>
                        )}
                        <div
                          className={`call-stage-panel-36 ${p.isMuted ? 'call-stage-panel-37' : 'call-stage-panel-38'}`}
                        >
                          {p.isMuted ? (
                            <MicOff className="call-stage-phone-off" />
                          ) : (
                            <Mic className="call-stage-mic" />
                          )}
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
          <aside className="call-stage-sidebar">
            <div className="call-stage-panel-39">
              <div className="call-stage-panel-40">
                <button
                  type="button"
                  onClick={() => setSideDrawer('none')}
                  className="call-stage-button-12"
                  aria-label="Voltar para a chamada"
                  title="Voltar para a chamada"
                >
                  <X className="call-stage-x" />
                  <span className="call-stage-label-12">Voltar</span>
                </button>
                <h3 className="call-stage-subheading">
                  {sideDrawer === 'chat'
                    ? 'Chat da Chamada'
                    : `Participantes (${participants.length})`}
                </h3>
              </div>

              <div className="call-stage-panel-41">
                {/* Quick Mic in Drawer Header */}
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`call-stage-button-13 ${isMicMuted ? 'call-stage-button-14' : 'call-stage-button-15'}`}
                  title={isMicMuted ? 'Ativar Microfone' : 'Silenciar'}
                  aria-label={isMicMuted ? 'Ativar Microfone' : 'Silenciar'}
                >
                  {isMicMuted ? (
                    <MicOff className="call-stage-mic-off-2" />
                  ) : (
                    <Mic className="call-stage-mic-2" />
                  )}
                </button>

                {/* Quick Deafen in Drawer Header */}
                <button
                  type="button"
                  onClick={toggleDeafen}
                  className={`call-stage-button-13 ${isDeafened ? 'call-stage-button-14' : 'call-stage-button-15'}`}
                  title={isDeafened ? 'Desativar Ensurdecer' : 'Ensurdecer'}
                  aria-label={isDeafened ? 'Desativar Ensurdecer' : 'Ensurdecer'}
                >
                  {isDeafened ? (
                    <HeadphoneOff className="call-stage-mic-off-2" />
                  ) : (
                    <Headphones className="call-stage-headphones" />
                  )}
                </button>

                {/* Quick Camera in Drawer Header */}
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`call-stage-button-13 ${isCameraOn ? 'call-stage-button-16' : 'call-stage-button-15'}`}
                  title={isCameraOn ? 'Desligar Câmara' : 'Ligar Câmara'}
                  aria-label={isCameraOn ? 'Desligar Câmara' : 'Ligar Câmara'}
                >
                  {isCameraOn ? (
                    <Video className="call-stage-mic-off-2" />
                  ) : (
                    <VideoOff className="call-stage-video-off" />
                  )}
                </button>

                {/* Quick Leave in Drawer Header */}
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playLeaveCall();
                    onDisconnect?.();
                  }}
                  className="call-stage-button-17"
                  title="Sair da chamada"
                  aria-label="Sair da chamada"
                >
                  <PhoneOff className="call-stage-volume2" />
                  <span className="call-stage-label-13">Sair</span>
                </button>
              </div>
            </div>

            {sideDrawer === 'chat' ? (
              <div className="call-stage-panel-42">
                <div className="call-stage-panel-43 custom-scrollbar">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`call-stage-panel-44 ${msg.isSystem ? 'call-stage-panel-45' : ''}`}
                    >
                      {!msg.isSystem && (
                        <div className="call-stage-panel-46">
                          <span className="call-stage-label-14">{msg.sender}</span>
                          <span className="call-stage-label-15">{msg.time}</span>
                        </div>
                      )}
                      <p
                        className={`call-stage-description ${msg.isSystem ? 'call-stage-description-2' : 'call-stage-description-3'}`}
                      >
                        {msg.content}
                      </p>
                    </div>
                  ))}
                  <div ref={chatMessagesEndRef} />
                </div>
                <form
                  onSubmit={handleSendChatMessage}
                  className="call-stage-form"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Enviar mensagem..."
                    className="call-stage-field"
                  />
                  <button
                    type="submit"
                    className="call-stage-button-18"
                    title="Enviar"
                    aria-label="Enviar mensagem"
                  >
                    <Send className="call-stage-volume2" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="call-stage-panel-47 custom-scrollbar">
                {participants.map((p) => (
                  <div
                    key={p.socketId || p.id}
                    className="call-stage-panel-48"
                  >
                    <div className="call-stage-panel-49">
                      <Avatar
                        src={p.avatarUrl}
                        name={p.name}
                        size="sm"
                      />
                      <div>
                        <p className="call-stage-description-4">{p.name}</p>
                        <p className="call-stage-description-5">{formatRole(p.role)}</p>
                      </div>
                    </div>
                    <div className="call-stage-panel-50">
                      {p.isDeafened && <HeadphoneOff className="call-stage-headphone-off-2" />}
                      {p.isMuted ? (
                        <MicOff className="call-stage-headphone-off-2" />
                      ) : (
                        <Mic className="call-stage-mic" />
                      )}
                      {p.isCameraOn && <Video className="call-stage-video-5" />}
                      {p.isScreenSharing && <Monitor className="call-stage-video-5" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </main>

      {/* Control Bar Footer */}
      <footer className="call-stage-footer">
        <div className="call-stage-panel-51">
          {/* Mic */}
          <button
            type="button"
            onClick={toggleMic}
            className={`call-stage-button-19 ${isMicMuted ? 'call-stage-button-20' : 'call-stage-button-21'}`}
            title={isMicMuted ? 'Ativar Microfone' : 'Silenciar Microfone'}
            aria-label={isMicMuted ? 'Ativar Microfone' : 'Silenciar Microfone'}
          >
            {isMicMuted ? (
              <MicOff className="call-stage-mic-off-3" />
            ) : (
              <Mic className="call-stage-mic-3" />
            )}
          </button>

          {/* Deafen (Ensurdecer) */}
          <button
            type="button"
            onClick={toggleDeafen}
            className={`call-stage-button-19 ${isDeafened ? 'call-stage-button-20' : 'call-stage-button-21'}`}
            title={
              isDeafened
                ? 'Desativar Ensurdecer (Ouvir Chamada)'
                : 'Ensurdecer (Desativar Áudio da Chamada)'
            }
            aria-label={isDeafened ? 'Desativar Ensurdecer' : 'Ensurdecer'}
          >
            {isDeafened ? (
              <HeadphoneOff className="call-stage-mic-off-3" />
            ) : (
              <Headphones className="call-stage-headphones-2" />
            )}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={toggleCamera}
            className={`call-stage-button-19 ${isCameraOn ? 'call-stage-button-22' : 'call-stage-button-21'}`}
            title={isCameraOn ? 'Desligar Câmara' : 'Ligar Câmara'}
            aria-label={isCameraOn ? 'Desligar Câmara' : 'Ligar Câmara'}
          >
            {isCameraOn ? (
              <Video className="call-stage-mic-off-3" />
            ) : (
              <VideoOff className="call-stage-video-off-2" />
            )}
          </button>

          {/* Screen Share */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`call-stage-button-23 ${isScreenSharing ? 'call-stage-button-24' : 'call-stage-button-21'}`}
            title={isScreenSharing ? 'Parar Partilha de Ecrã' : 'Partilhar Ecrã'}
            aria-label={isScreenSharing ? 'Parar Partilha de Ecrã' : 'Partilhar Ecrã'}
          >
            {isScreenSharing ? (
              <MonitorOff className="call-stage-mic-off-3" />
            ) : (
              <Monitor className="call-stage-video-off-2" />
            )}
          </button>

          <div className="call-stage-panel-52" />

          {/* Chat Drawer Toggle */}
          <button
            type="button"
            onClick={() => setSideDrawer((prev) => (prev === 'chat' ? 'none' : 'chat'))}
            className={`call-stage-button-25 ${sideDrawer === 'chat' ? 'call-stage-button-26' : 'call-stage-button-27'}`}
            title="Chat da chamada"
            aria-label="Abrir chat da chamada"
          >
            <MessageSquare className="call-stage-x" />
            {chatMessages.length > 1 && <span className="call-stage-label-16" />}
          </button>

          {/* Participants Drawer Toggle */}
          <button
            type="button"
            onClick={() =>
              setSideDrawer((prev) => (prev === 'participants' ? 'none' : 'participants'))
            }
            className={`call-stage-button-28 ${sideDrawer === 'participants' ? 'call-stage-button-26' : 'call-stage-button-27'}`}
            title="Participantes"
            aria-label="Ver participantes da chamada"
          >
            <Users className="call-stage-x" />
            <span className="call-stage-label-17">{participants.length}</span>
          </button>

          <div className="call-stage-panel-52" />

          {/* Leave Call */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playLeaveCall();
              onDisconnect?.();
            }}
            className="call-stage-button-29"
            title="Sair da chamada"
            aria-label="Sair da chamada"
          >
            <PhoneOff className="call-stage-phone-off-2" />
            <span className="call-stage-label-18">Sair</span>
          </button>
        </div>
      </footer>
    </div>
  );
  if (isMobile && !isModal) {
    return createPortal(stageContent, document.body);
  }

  return stageContent;
};

export default CallStage;
