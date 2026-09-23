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
  Volume2,
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
  bannerUrl?: string;
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
  roomId?: string;
  roomType?: 'voice' | 'video' | 'stage' | 'qa';
  isStageMode?: boolean;
  initialParticipants?: CallParticipant[];
  onDisconnect: () => void;
}

// Fallback ICE config — only public STUN, no TURN needed.
// P2P works on most home/office networks. When it fails (symmetric NAT, mobile),
// the relay fallback kicks in automatically via Socket.IO binary chunks.
const STUN_ONLY_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' },
  ],
  iceCandidatePoolSize: 10,
};

// How long (ms) to wait for a WebRTC connection before switching to relay mode
const P2P_TIMEOUT_MS = 5000;

// Best audio codec params for MediaRecorder relay chunks
const RELAY_AUDIO_MIME = (() => {
  for (const mime of [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ]) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
})();

// Safe video player component that attaches MediaStream cleanly to HTMLVideoElement
const VideoStreamPlayer: React.FC<{
  stream: MediaStream | null;
  isMirrored?: boolean;
  className?: string;
  objectFit?: 'cover' | 'contain';
}> = ({ stream, isMirrored = false, className = '', objectFit = 'cover' }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && stream.active && stream.getVideoTracks().length > 0) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.play().catch(e => {
        // Autoplay may be deferred until user interaction
        console.warn('Video playback notice:', e);
      });
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`w-full h-full ${objectFit === 'contain' ? 'object-contain bg-black' : 'object-cover'} ${isMirrored ? 'scale-x-[-1]' : ''} ${className}`}
    />
  );
};

// React-managed remote audio player that safely complies with browser autoplay policy
const RemoteAudioPlayer: React.FC<{
  stream: MediaStream;
  volume: number;
  muted: boolean;
  onAutoplayBlocked: () => void;
}> = ({ stream, volume, muted, onAutoplayBlocked }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.srcObject !== stream) {
      audio.srcObject = stream;
    }
    audio.volume = Math.min(1, Math.max(0, volume / 100));
    audio.muted = muted;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Remote audio autoplay prevented:', err);
        onAutoplayBlocked();
      });
    }
  }, [stream, volume, muted, onAutoplayBlocked]);

  return <audio ref={audioRef} autoPlay playsInline />;
};

export const CallStage: React.FC<CallStageProps> = ({
  roomName,
  roomId,
  roomType = 'voice',
  isStageMode = false,
  initialParticipants = [],
  onDisconnect
}) => {
  const effectiveRoomId = roomId || roomName;
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
  const [isAudioAutoplayBlocked, setIsAudioAutoplayBlocked] = useState(false);

  // Audio level & Settings
  const [micLevel, setMicLevel] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedParticipantVolume, setSelectedParticipantVolume] = useState<string | null>(null);
  const [userVolumes, setUserVolumes] = useState<Record<string, number>>({});
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  // Remote streams dictionary: targetSocketId -> MediaStream
  const [remoteVideoStreams, setRemoteVideoStreams] = useState<Record<string, MediaStream>>({});
  const [remoteAudioStreams, setRemoteAudioStreams] = useState<Record<string, MediaStream>>({});

  // Speaker Requests (Stage Mode Queue)
  const [speakerRequests, setSpeakerRequests] = useState<Array<{ id: string; name: string; username: string; avatarUrl?: string; time: string }>>([]);

  // In-Call Chat
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; content: string; time: string; isSystem?: boolean }>>([
    {
      id: 'init-msg',
      sender: 'Sistema',
      content: `Conectado à sala "${roomName}". Formato atual: ${
        roomMode === 'stage' ? 'Palco Restrito' : roomMode === 'qa' ? 'Fila de Dúvidas' : 'Convívio Aberto'
      }.`,
      time: 'Agora',
      isSystem: true
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Media stream references
  const containerRef = useRef<HTMLDivElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // WebRTC maps & socket associations
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const pendingIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const socketToUserRef = useRef<Map<string, string>>(new Map());
  const userToSocketRef = useRef<Map<string, string>>(new Map());
  const lastSpeakingRef = useRef<boolean>(false);

  // ── Socket.IO relay fallback ─────────────────────────────────────────────
  // Used when WebRTC P2P cannot connect (symmetric NAT, mobile, firewalls).
  // Audio chunks from MediaRecorder are sent as binary frames over Socket.IO
  // and the server fans them out to all other peers in the room.
  // Key: sourceSocketId → MediaSource state for playback
  const relayMediaSourcesRef = useRef<Map<string, { ms: MediaSource; sb: SourceBuffer | null; queue: ArrayBuffer[]; ready: boolean }>>(new Map());
  const relayAudioElemsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  // Which peers we are serving via relay (vs direct P2P)
  const relayPeersRef = useRef<Set<string>>(new Set());
  // Our outbound MediaRecorder that broadcasts mic audio to relay
  const relayRecorderRef = useRef<MediaRecorder | null>(null);
  // Pending P2P timeout per peer: if not connected within P2P_TIMEOUT_MS → relay
  const p2pTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Stable references
  const userRef = useRef(user);
  userRef.current = user;
  const roomModeRef = useRef(roomMode);
  roomModeRef.current = roomMode;
  const isHostOrModeratorRef = useRef(isHostOrModerator);
  isHostOrModeratorRef.current = isHostOrModerator;
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const onDisconnectRef = useRef(onDisconnect);
  onDisconnectRef.current = onDisconnect;
  const isMicMutedRef = useRef(isMicMuted);
  isMicMutedRef.current = isMicMuted;
  const userVolumesRef = useRef(userVolumes);
  userVolumesRef.current = userVolumes;

  // Real participants
  const [participants, setParticipants] = useState<CallParticipant[]>(() => {
    if (initialParticipants.length > 0) return initialParticipants;
    if (!user) return [];
    return [{
      id: user.id,
      name: `${user.name} (Você)`,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.profile?.bannerUrl,
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

  // Helper: Retrieve remote video stream for a participant
  const getRemoteStreamForUser = (userId: string, socketId?: string): MediaStream | null => {
    if (socketId && remoteVideoStreams[socketId]) {
      return remoteVideoStreams[socketId];
    }
    const sId = userToSocketRef.current.get(userId);
    if (sId && remoteVideoStreams[sId]) {
      return remoteVideoStreams[sId];
    }
    return null;
  };

  // 1. Call timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDurationSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 1a. (removed — no TURN fetch needed; relay is the fallback)

  // 2. Unblock audio playback if blocked by browser policy
  const handleUnblockAudio = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
    remoteAudiosRef.current.forEach(audio => {
      audio.play().catch(e => console.warn('Unblock audio error:', e));
    });
    relayAudioElemsRef.current.forEach(audio => {
      audio.play().catch(() => {});
    });
    setIsAudioAutoplayBlocked(false);
  }, []);

  // ── Relay helpers ──────────────────────────────────────────────────────────

  // Start the outbound relay recorder (broadcasts mic chunks to the room)
  const startRelayRecorder = useCallback((roomId: string, sock: ReturnType<typeof useSocket>['socket']) => {
    if (!sock) return;
    if (relayRecorderRef.current && relayRecorderRef.current.state !== 'inactive') return;

    const stream = localStreamRef.current;
    if (!stream || stream.getAudioTracks().length === 0) return;

    if (!RELAY_AUDIO_MIME) {
      console.warn('[Relay] MediaRecorder not supported in this browser');
      return;
    }

    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: RELAY_AUDIO_MIME,
        audioBitsPerSecond: 32000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0 && sock.connected) {
          e.data.arrayBuffer().then(buf => {
            sock.emit('voice-relay-chunk', { roomId, kind: 'audio', chunk: buf });
          });
        }
      };

      recorder.start(80); // 80ms chunks — low latency
      relayRecorderRef.current = recorder;
    } catch (err) {
      console.warn('[Relay] Failed to start MediaRecorder:', err);
    }
  }, []);

  // Stop the outbound relay recorder
  const stopRelayRecorder = useCallback(() => {
    const r = relayRecorderRef.current;
    if (r && r.state !== 'inactive') {
      try { r.stop(); } catch (_) {}
    }
    relayRecorderRef.current = null;
  }, []);

  // Set up a MediaSource + hidden <audio> element to play relay chunks from a peer
  const setupRelayReceiver = useCallback((fromSocketId: string) => {
    if (relayAudioElemsRef.current.has(fromSocketId)) return;

    const ms = new MediaSource();
    const audio = document.createElement('audio');
    audio.autoplay = true;
    (audio as any).playsInline = true;
    audio.src = URL.createObjectURL(ms);
    document.body.appendChild(audio);
    relayAudioElemsRef.current.set(fromSocketId, audio);

    const state: { ms: MediaSource; sb: SourceBuffer | null; queue: ArrayBuffer[]; ready: boolean } = {
      ms, sb: null, queue: [], ready: false,
    };
    relayMediaSourcesRef.current.set(fromSocketId, state);

    ms.addEventListener('sourceopen', () => {
      if (!RELAY_AUDIO_MIME) return;
      try {
        const sb = ms.addSourceBuffer(RELAY_AUDIO_MIME.split(';')[0]); // strip codecs for addSourceBuffer
        state.sb = sb;
        state.ready = true;

        sb.addEventListener('updateend', () => {
          if (state.queue.length > 0 && !sb.updating) {
            try { sb.appendBuffer(state.queue.shift()!); } catch (_) {}
          }
        });

        // Drain anything that arrived before sourceopen
        if (state.queue.length > 0 && !sb.updating) {
          try { sb.appendBuffer(state.queue.shift()!); } catch (_) {}
        }
      } catch (err) {
        console.warn('[Relay] addSourceBuffer failed:', err);
      }
    });

    audio.play().catch(() => setIsAudioAutoplayBlocked(true));
  }, []);

  // Feed an incoming chunk to the correct relay receiver
  const feedRelayChunk = useCallback((fromSocketId: string, chunk: ArrayBuffer) => {
    const state = relayMediaSourcesRef.current.get(fromSocketId);
    if (!state) {
      setupRelayReceiver(fromSocketId);
      // Queue the chunk — will be appended once sourceopen fires
      const newState = relayMediaSourcesRef.current.get(fromSocketId);
      newState?.queue.push(chunk);
      return;
    }

    const { sb, queue } = state;
    if (!sb || sb.updating) {
      // Buffer not ready or mid-update — queue and drain later
      queue.push(chunk);
      // Prevent unbounded growth: drop oldest chunk if queue is too large
      if (queue.length > 30) queue.shift();
      return;
    }

    try {
      sb.appendBuffer(chunk);
    } catch (err) {
      // QuotaExceededError or similar — skip this chunk
      console.warn('[Relay] appendBuffer error (chunk dropped):', err);
    }
  }, [setupRelayReceiver]);

  // Tear down the relay receiver for a peer that left
  const teardownRelayReceiver = useCallback((fromSocketId: string) => {
    const audio = relayAudioElemsRef.current.get(fromSocketId);
    if (audio) {
      audio.srcObject = null;
      if (audio.src) URL.revokeObjectURL(audio.src);
      audio.remove();
      relayAudioElemsRef.current.delete(fromSocketId);
    }
    relayMediaSourcesRef.current.delete(fromSocketId);
    relayPeersRef.current.delete(fromSocketId);
  }, []);

  // Switch a specific peer from P2P to relay mode
  const switchPeerToRelay = useCallback((peerSocketId: string, roomId: string, sock: ReturnType<typeof useSocket>['socket']) => {
    if (relayPeersRef.current.has(peerSocketId)) return; // already on relay

    console.info(`[Relay] Switching peer ${peerSocketId} to Socket.IO relay (P2P failed or timed out)`);
    relayPeersRef.current.add(peerSocketId);

    // Close the failed P2P connection
    const pc = peerConnectionsRef.current.get(peerSocketId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(peerSocketId);
    }

    // Set up inbound relay playback for this peer
    setupRelayReceiver(peerSocketId);

    // Start outbound relay recorder if not already running
    startRelayRecorder(roomId, sock);

    // Tell the peer we switched so they start their relay recorder too
    sock?.emit('voice-relay-start', { roomId });
  }, [setupRelayReceiver, startRelayRecorder]);

  // Schedule a P2P→relay fallback for a peer connection
  const schedulePeerFallback = useCallback((peerSocketId: string, pc: RTCPeerConnection, roomId: string, sock: ReturnType<typeof useSocket>['socket']) => {
    // Cancel any existing timer for this peer
    const existing = p2pTimeoutsRef.current.get(peerSocketId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      p2pTimeoutsRef.current.delete(peerSocketId);
      if (pc.connectionState !== 'connected') {
        switchPeerToRelay(peerSocketId, roomId, sock);
      }
    }, P2P_TIMEOUT_MS);

    p2pTimeoutsRef.current.set(peerSocketId, timer);

    // Also cancel the timer immediately if P2P succeeds
    pc.addEventListener('connectionstatechange', () => {
      if (pc.connectionState === 'connected') {
        const t = p2pTimeoutsRef.current.get(peerSocketId);
        if (t) {
          clearTimeout(t);
          p2pTimeoutsRef.current.delete(peerSocketId);
        }
      }
    });
  }, [switchPeerToRelay]);

  // 3. Update Audio Sender on all active peer connections without renegotiation
  const updateActiveAudioTrack = useCallback((track: MediaStreamTrack | null) => {
    peerConnectionsRef.current.forEach((pc) => {
      try {
        const senders = pc.getSenders();
        const transceivers = pc.getTransceivers();
        const audioSender = senders.find(s => {
          if (s.track && s.track.kind === 'audio') return true;
          const matchTransceiver = transceivers.find(t => t.sender === s && t.receiver.track.kind === 'audio');
          return !!matchTransceiver;
        });

        if (audioSender) {
          audioSender.replaceTrack(track).catch(err => {
            console.warn('replaceTrack audio error:', err);
          });
        } else if (track && localStreamRef.current) {
          pc.addTrack(track, localStreamRef.current);
        }
      } catch (err) {
        console.warn('Error updating audio track sender:', err);
      }
    });
  }, []);

  // 4. Update Video Sender on all active peer connections without renegotiation
  const updateActiveVideoTrack = useCallback((track: MediaStreamTrack | null, stream?: MediaStream | null) => {
    peerConnectionsRef.current.forEach((pc) => {
      try {
        const senders = pc.getSenders();
        const transceivers = pc.getTransceivers();
        const videoSender = senders.find(s => {
          if (s.track && s.track.kind === 'video') return true;
          const matchTransceiver = transceivers.find(t => t.sender === s && t.receiver.track.kind === 'video');
          return !!matchTransceiver;
        });

        if (videoSender) {
          videoSender.replaceTrack(track).catch(err => {
            console.warn('replaceTrack video error:', err);
          });
        } else if (track && stream) {
          pc.addTrack(track, stream);
        }
      } catch (err) {
        console.warn('Error updating video track sender:', err);
      }
    });
  }, []);

  // 5. Hardware Microphone Capture
  const initHardwareMicrophone = useCallback(async () => {
    try {
      if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      localStreamRef.current = stream;

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        if (roomModeRef.current === 'stage' && !isHostOrModeratorRef.current) {
          audioTrack.enabled = false;
          setIsMicMuted(true);
        } else {
          audioTrack.enabled = !isMicMutedRef.current;
        }
        updateActiveAudioTrack(audioTrack);
      }

      // Web Audio API for real-time speech meter and voice activity detection
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume().catch(() => {});
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

          const isSpeakingNow = level > 12 && !isMicMutedRef.current;
          if (lastSpeakingRef.current !== isSpeakingNow) {
            lastSpeakingRef.current = isSpeakingNow;
            setParticipants(prev => prev.map(p => 
              p.id === userRef.current?.id ? { ...p, isSpeaking: isSpeakingNow } : p
            ));

            if (socket) {
              socket.emit('voice-speaking-state', {
                roomId: effectiveRoomId,
                userId: userRef.current?.id,
                isSpeaking: isSpeakingNow
              });
            }
          }

          animFrameRef.current = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      }
    } catch (err) {
      console.warn('Microphone access notice (passive mode active):', err);
    }
  }, [effectiveRoomId, socket, updateActiveAudioTrack]);

  // 6. Clean up all media hardware & connections
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

    // Relay cleanup
    stopRelayRecorder();
    p2pTimeoutsRef.current.forEach(t => clearTimeout(t));
    p2pTimeoutsRef.current.clear();
    relayPeersRef.current.clear();
    relayAudioElemsRef.current.forEach(audio => {
      audio.srcObject = null;
      if (audio.src) URL.revokeObjectURL(audio.src);
      audio.remove();
    });
    relayAudioElemsRef.current.clear();
    relayMediaSourcesRef.current.clear();

    setRemoteVideoStreams({});
    setRemoteAudioStreams({});
  }, [stopRelayRecorder]);

  // 7. WebRTC Peer Connection Factory with Transceivers + auto relay fallback
  const createPeerConnection = useCallback((targetSocketId: string) => {
    if (peerConnectionsRef.current.has(targetSocketId)) {
      return peerConnectionsRef.current.get(targetSocketId)!;
    }

    const pc = new RTCPeerConnection({
      iceServers: STUN_ONLY_CONFIG.iceServers,
      iceCandidatePoolSize: 10,
    });
    peerConnectionsRef.current.set(targetSocketId, pc);

    // ICE gathering timeout — if gathering isn't done in 8s, proceed with
    // whatever candidates we have (prevents hanging on slow STUN servers)
    let iceGatheringTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      iceGatheringTimer = null;
      if (pc.iceGatheringState !== 'complete' && pc.signalingState !== 'closed') {
        pc.dispatchEvent(new Event('icegatheringcomplete'));
      }
    }, 8000);

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete' && iceGatheringTimer) {
        clearTimeout(iceGatheringTimer);
        iceGatheringTimer = null;
      }
    };

    // Connection health: on 'failed' or after P2P_TIMEOUT_MS with no connection,
    // seamlessly fall back to Socket.IO relay
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'failed') {
        console.warn(`[WebRTC] P2P to ${targetSocketId} failed → switching to relay`);
        switchPeerToRelay(targetSocketId, effectiveRoomId, socket);
      }
    };

    // Schedule relay fallback if P2P hasn't connected within P2P_TIMEOUT_MS
    schedulePeerFallback(targetSocketId, pc, effectiveRoomId, socket);

    // Audio sender/transceiver
    const audioTrack = localStreamRef.current?.getAudioTracks()[0] || null;
    if (audioTrack && localStreamRef.current) {
      try {
        pc.addTrack(audioTrack, localStreamRef.current);
      } catch (_) {
        try { pc.addTransceiver('audio', { direction: 'sendrecv' }); } catch (_) {}
      }
    } else {
      try {
        pc.addTransceiver('audio', { direction: 'sendrecv' });
      } catch (_) {}
    }

    // Video sender/transceiver (Camera or Screen share)
    const activeVideoTrack = screenStreamRef.current?.getVideoTracks()[0] || cameraStreamRef.current?.getVideoTracks()[0] || null;
    const activeVideoStream = screenStreamRef.current || cameraStreamRef.current || null;
    if (activeVideoTrack && activeVideoStream) {
      try {
        pc.addTrack(activeVideoTrack, activeVideoStream);
      } catch (_) {
        try { pc.addTransceiver('video', { direction: 'sendrecv' }); } catch (_) {}
      }
    } else {
      try {
        pc.addTransceiver('video', { direction: 'sendrecv' });
      } catch (_) {}
    }

    // ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('voice-signal-ice', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    // Remote Track Reception (Audio and Video)
    pc.ontrack = (event) => {
      const { track } = event;
      const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([track]);

      if (track.kind === 'audio') {
        setRemoteAudioStreams(prev => ({
          ...prev,
          [targetSocketId]: stream
        }));

        let audioEl = remoteAudiosRef.current.get(targetSocketId);
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          (audioEl as any).playsInline = true;
          document.body.appendChild(audioEl);
          remoteAudiosRef.current.set(targetSocketId, audioEl);
        }
        audioEl.srcObject = stream;
        
        const mappedUserId = socketToUserRef.current.get(targetSocketId);
        const vol = mappedUserId ? (userVolumesRef.current[mappedUserId] ?? 100) : 100;
        audioEl.volume = Math.min(1, Math.max(0, vol / 100));

        audioEl.play().catch(err => {
          console.warn('Audio autoplay blocked by browser:', err);
          setIsAudioAutoplayBlocked(true);
        });
      } else if (track.kind === 'video') {
        setRemoteVideoStreams(prev => ({
          ...prev,
          [targetSocketId]: stream
        }));

        track.onended = () => {
          setRemoteVideoStreams(prev => {
            const next = { ...prev };
            delete next[targetSocketId];
            return next;
          });
        };
      }
    };

    return pc;
  }, [socket]);

  // 8. Real-Time Socket.IO Synchronization & Signaling
  useEffect(() => {
    let isCancelled = false;

    const joinCallSession = async () => {
      await initHardwareMicrophone();
      if (isCancelled) return;

      // After mic is acquired, start relay recorder for any peers that already
      // switched to relay mode before getUserMedia finished (race condition fix)
      if (relayPeersRef.current.size > 0) {
        startRelayRecorder(effectiveRoomId, socket);
      }

      if (socket && user?.id) {
        const roomPayload = {
          roomId: effectiveRoomId,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            bannerUrl: user.profile?.bannerUrl,
            role: user.role
          }
        };

        socket.emit('join-voice-room', roomPayload);
      }
    };

    joinCallSession();

    if (socket && user?.id) {
      // 1. Existing users in the room
      socket.on('voice-room-existing-users', async (existingList: any[]) => {
        if (!Array.isArray(existingList)) return;

        setParticipants(prev => {
          const next = [...prev];
          for (const item of existingList) {
            const remoteUser = item.user;
            if (remoteUser && remoteUser.id !== userRef.current?.id) {
              if (item.socketId) {
                socketToUserRef.current.set(item.socketId, remoteUser.id);
                userToSocketRef.current.set(remoteUser.id, item.socketId);
              }
              const existingIndex = next.findIndex(p => p.id === remoteUser.id);
              const participantData: CallParticipant = {
                id: remoteUser.id,
                socketId: item.socketId,
                name: remoteUser.name,
                username: remoteUser.username,
                avatarUrl: remoteUser.avatarUrl,
                bannerUrl: remoteUser.bannerUrl,
                role: remoteUser.role,
                isSpeaking: false,
                isMuted: !!item.isMuted,
                isCameraOn: !!item.isCameraOn,
                isScreenSharing: !!item.isScreenSharing,
                canSpeak: true,
                canShareScreen: true
              };
              if (existingIndex >= 0) {
                next[existingIndex] = { ...next[existingIndex], ...participantData };
              } else {
                next.push(participantData);
              }
            }
          }
          return next;
        });

        // Initiate WebRTC offer to each existing participant
        for (const item of existingList) {
          if (item.socketId && item.socketId !== socket.id) {
            try {
              const pc = createPeerConnection(item.socketId);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('voice-signal-offer', {
                targetSocketId: item.socketId,
                offer,
                callerUser: userRef.current
              });
            } catch (e) {
              console.warn('Error creating WebRTC offer for peer:', e);
            }
          }
        }
      });

      // 2. New user joined the room
      socket.on('user-joined-voice', ({ user: remoteUser, socketId: remoteSocketId }: any) => {
        if (!remoteUser || remoteUser.id === userRef.current?.id) return;

        if (remoteSocketId) {
          socketToUserRef.current.set(remoteSocketId, remoteUser.id);
          userToSocketRef.current.set(remoteUser.id, remoteSocketId);
        }

        setParticipants(prev => {
          if (prev.some(p => p.id === remoteUser.id)) {
            return prev.map(p => p.id === remoteUser.id ? { ...p, socketId: remoteSocketId } : p);
          }
          return [...prev, {
            id: remoteUser.id,
            socketId: remoteSocketId,
            name: remoteUser.name,
            username: remoteUser.username,
            avatarUrl: remoteUser.avatarUrl,
            bannerUrl: remoteUser.bannerUrl,
            role: remoteUser.role,
            isSpeaking: false,
            isMuted: false,
            isCameraOn: false,
            isScreenSharing: false,
            canSpeak: true,
            canShareScreen: true
          }];
        });

        toastRef.current({ title: 'Entrada na Sala', message: `${remoteUser.name} entrou na chamada.`, type: 'info' });
      });

      // 3. WebRTC Offer received
      socket.on('voice-signal-offer', async ({ callerSocketId, offer, callerUser }: any) => {
        try {
          if (callerUser?.id && callerSocketId) {
            socketToUserRef.current.set(callerSocketId, callerUser.id);
            userToSocketRef.current.set(callerUser.id, callerSocketId);
          }

          const pc = createPeerConnection(callerSocketId);
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
            answer
          });

          if (callerUser && callerUser.id !== userRef.current?.id) {
            setParticipants(prev => {
              if (prev.some(p => p.id === callerUser.id)) {
                return prev.map(p => p.id === callerUser.id ? { ...p, socketId: callerSocketId } : p);
              }
              return [...prev, {
                id: callerUser.id,
                socketId: callerSocketId,
                name: callerUser.name,
                username: callerUser.username,
                avatarUrl: callerUser.avatarUrl,
                bannerUrl: callerUser.bannerUrl,
                role: callerUser.role,
                isSpeaking: false,
                isMuted: false,
                isCameraOn: false,
                isScreenSharing: false,
                canSpeak: true,
                canShareScreen: true
              }];
            });
          }
        } catch (e) {
          console.warn('Error handling WebRTC offer:', e);
        }
      });

      // 4. WebRTC Answer received
      socket.on('voice-signal-answer', async ({ responderSocketId, answer }: any) => {
        try {
          const pc = peerConnectionsRef.current.get(responderSocketId);
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));

            // Drain queued ICE candidates
            const pending = pendingIceCandidatesRef.current.get(responderSocketId) || [];
            for (const cand of pending) {
              try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (_) {}
            }
            pendingIceCandidatesRef.current.delete(responderSocketId);
          }
        } catch (e) {
          console.warn('Error handling WebRTC answer:', e);
        }
      });

      // 5. WebRTC ICE Candidate received
      socket.on('voice-signal-ice', async ({ candidate, fromSocketId }: any) => {
        try {
          const pc = peerConnectionsRef.current.get(fromSocketId);
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            const queue = pendingIceCandidatesRef.current.get(fromSocketId) || [];
            queue.push(candidate);
            pendingIceCandidatesRef.current.set(fromSocketId, queue);
          }
        } catch (e) {
          console.warn('Error handling ICE candidate:', e);
        }
      });

      // 6. Remote User Left
      socket.on('user-left-voice', ({ userId, socketId }: any) => {
        setParticipants(prev => prev.filter(p => p.id !== userId && p.socketId !== socketId));
        const effectiveSocketId = socketId || userToSocketRef.current.get(userId);
        if (effectiveSocketId) {
          const pc = peerConnectionsRef.current.get(effectiveSocketId);
          if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(effectiveSocketId);
          }
          const audio = remoteAudiosRef.current.get(effectiveSocketId);
          if (audio) {
            audio.remove();
            remoteAudiosRef.current.delete(effectiveSocketId);
          }
          pendingIceCandidatesRef.current.delete(effectiveSocketId);
          setRemoteVideoStreams(prev => {
            const next = { ...prev };
            delete next[effectiveSocketId];
            return next;
          });
          setRemoteAudioStreams(prev => {
            const next = { ...prev };
            delete next[effectiveSocketId];
            return next;
          });
        }
      });

      // 7. Remote State Changed (Mute, Camera, Screen share)
      socket.on('user-voice-state-changed', ({ userId, socketId: sId, isMuted: rMuted, isCameraOn: rCam, isScreenSharing: rScreen }: any) => {
        if (sId && userId) {
          socketToUserRef.current.set(sId, userId);
          userToSocketRef.current.set(userId, sId);
        }

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

      // 8. Remote Speaking Indicator changed
      socket.on('user-voice-speaking-changed', ({ userId, isSpeaking: rSpeaking }: any) => {
        setParticipants(prev => prev.map(p => {
          if (p.id !== userId) return p;
          return { ...p, isSpeaking: !!rSpeaking };
        }));
      });

      // 9. Room Mode Changed
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

      // 10. Individual Permissions Updated
      socket.on('voice-permissions-updated', ({ targetUserId, canSpeak, canShareScreen }: any) => {
        setParticipants(prev => prev.map(p => {
          if (p.id !== targetUserId) return p;
          return {
            ...p,
            canSpeak: canSpeak !== undefined ? canSpeak : p.canSpeak,
            canShareScreen: canShareScreen !== undefined ? canShareScreen : p.canShareScreen
          };
        }));

        if (targetUserId === userRef.current?.id) {
          if (canSpeak) {
            toastRef.current({ title: 'Palco Concedido', message: 'Tem autorização para falar no microfone.', type: 'success' });
          } else if (canSpeak === false) {
            setIsMicMuted(true);
            if (localStreamRef.current) {
              localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
            }
            toastRef.current({ title: 'Palco Revogado', message: 'O seu microfone foi silenciado pelo moderador.', type: 'info' });
          }
        }
      });

      // 11. Speaker Requests & Decisions
      socket.on('voice-speaker-request', ({ user: reqUser }: any) => {
        if (isHostOrModeratorRef.current && reqUser) {
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
          toastRef.current({ title: 'Pedido de Palavra', message: `${reqUser.name} pediu a palavra no palco.`, type: 'info' });
        }
      });

      socket.on('voice-speaker-decision', ({ targetUserId, approved }: any) => {
        if (targetUserId === userRef.current?.id) {
          if (approved) {
            toastRef.current({ title: 'Pedido Aceite', message: 'O anfitrião autorizou a sua intervenção. Já pode ativar o microfone.', type: 'success' });
          } else {
            setIsHandRaised(false);
            toastRef.current({ title: 'Pedido Não Autorizado', message: 'O anfitrião manteve o palco restrito no momento.', type: 'info' });
          }
        }
      });

      // 12. User Kicked
      socket.on('voice-user-kicked', ({ targetUserId }: any) => {
        if (targetUserId === userRef.current?.id) {
          stopAllMedia();
          toastRef.current({ title: 'Desconectado', message: 'Foi removido da chamada pelo moderador.', type: 'error' });
          onDisconnectRef.current();
        } else {
          setParticipants(prev => prev.filter(p => p.id !== targetUserId));
        }
      });

      // 13. Chat messages
      socket.on('voice-chat-message', (msg: any) => {
        setChatMessages(prev => [...prev, msg]);
      });

      // 14. Relay: a peer is switching to Socket.IO relay mode
      socket.on('voice-relay-start', ({ fromSocketId }: { fromSocketId: string }) => {
        // They're on relay — make sure we are relaying our audio to them too
        if (!relayPeersRef.current.has(fromSocketId)) {
          relayPeersRef.current.add(fromSocketId);
          setupRelayReceiver(fromSocketId);
        }
        startRelayRecorder(effectiveRoomId, socket);
      });

      // 15. Relay: incoming audio/video chunk from a peer via server
      socket.on('voice-relay-chunk', ({ fromSocketId, kind, chunk }: {
        fromSocketId: string;
        kind: 'audio' | 'video';
        chunk: ArrayBuffer;
      }) => {
        if (kind === 'audio') {
          feedRelayChunk(fromSocketId, chunk);
        }
        // video relay is not implemented (bandwidth cost); video still uses P2P
      });
    }

    return () => {
      isCancelled = true;
      if (socket && userRef.current) {
        socket.emit('leave-voice-room', { roomId: effectiveRoomId, userId: userRef.current.id });
        socket.off('voice-room-existing-users');
        socket.off('user-joined-voice');
        socket.off('voice-signal-offer');
        socket.off('voice-signal-answer');
        socket.off('voice-signal-ice');
        socket.off('user-left-voice');
        socket.off('user-voice-state-changed');
        socket.off('user-voice-speaking-changed');
        socket.off('voice-room-mode-changed');
        socket.off('voice-permissions-updated');
        socket.off('voice-speaker-request');
        socket.off('voice-speaker-decision');
        socket.off('voice-user-kicked');
        socket.off('voice-chat-message');
        socket.off('voice-relay-start');
        socket.off('voice-relay-chunk');
      }
      stopAllMedia();
    };
  }, [effectiveRoomId, user?.id, socket, initHardwareMicrophone, createPeerConnection, stopAllMedia, setupRelayReceiver, startRelayRecorder, feedRelayChunk]);

  // Microphone Toggle
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

    // Pause/resume relay recorder track in sync with mute state
    if (relayRecorderRef.current) {
      try {
        if (nextMuted && relayRecorderRef.current.state === 'recording') {
          relayRecorderRef.current.pause();
        } else if (!nextMuted && relayRecorderRef.current.state === 'paused') {
          relayRecorderRef.current.resume();
        }
      } catch (_) {}
    }

    setParticipants(prev => prev.map(p => 
      p.id === user?.id ? { ...p, isMuted: nextMuted, isSpeaking: false } : p
    ));

    if (socket) {
      socket.emit('voice-state-update', {
        roomId: effectiveRoomId,
        userId: user?.id || 'me',
        isMuted: nextMuted
      });
      if (nextMuted) {
        socket.emit('voice-speaking-state', {
          roomId: effectiveRoomId,
          userId: user?.id || 'me',
          isSpeaking: false
        });
      }
    }

    if (nextMuted) {
      soundEffects.playMute();
      toast({ title: 'Microfone Silenciado' });
    } else {
      soundEffects.playUnmute();
      toast({ title: 'Microfone Ativo' });
    }
  };

  // Deafen Toggle
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

  // Camera Toggle
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
      setIsCameraActive(false);
      setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isCameraOn: false } : p));

      // Revert video track to screen share track if sharing, else null
      const activeVideoTrack = screenStreamRef.current?.getVideoTracks()[0] || null;
      updateActiveVideoTrack(activeVideoTrack);

      if (socket) {
        socket.emit('voice-state-update', {
          roomId: effectiveRoomId,
          userId: user?.id || 'me',
          isCameraOn: false
        });
      }
      toast({ title: 'Câmara Desligada' });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: false
        });
        cameraStreamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0];

        // If not actively sharing screen, attach camera track to peer senders
        if (!isScreenSharing) {
          updateActiveVideoTrack(videoTrack, stream);
        }

        videoTrack.onended = () => {
          handleToggleCamera();
        };

        setIsCameraActive(true);
        setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isCameraOn: true } : p));

        if (socket) {
          socket.emit('voice-state-update', {
            roomId: effectiveRoomId,
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

  // Screen Sharing Toggle
  const handleToggleScreenShare = async () => {
    if (!canSelfShareScreen) {
      toast({ title: 'Partilha Restrita', message: 'Apenas oradores autorizados podem partilhar ecrã nesta sala.', type: 'info' });
      return;
    }

    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isScreenSharing: false } : p));

      // Revert video sender to camera track if active, else null
      const activeVideoTrack = cameraStreamRef.current?.getVideoTracks()[0] || null;
      updateActiveVideoTrack(activeVideoTrack);

      if (socket) {
        socket.emit('voice-state-update', {
          roomId: effectiveRoomId,
          userId: user?.id || 'me',
          isScreenSharing: false
        });
      }
      toast({ title: 'Partilha de Ecrã Terminada' });
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        const screenTrack = stream.getVideoTracks()[0];

        // Send screen video track to peers
        updateActiveVideoTrack(screenTrack, stream);

        setIsScreenSharing(true);
        setLayoutMode('spotlight');
        setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isScreenSharing: true } : p));

        screenTrack.onended = () => {
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
          }
          setIsScreenSharing(false);
          setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, isScreenSharing: false } : p));
          const camTrack = cameraStreamRef.current?.getVideoTracks()[0] || null;
          updateActiveVideoTrack(camTrack);
          if (socket) {
            socket.emit('voice-state-update', {
              roomId: effectiveRoomId,
              userId: user?.id || 'me',
              isScreenSharing: false
            });
          }
        };

        if (socket) {
          socket.emit('voice-state-update', {
            roomId: effectiveRoomId,
            userId: user?.id || 'me',
            isScreenSharing: true
          });
        }
        toast({ title: 'A partilhar ecrã', type: 'success' });
      } catch (e) {
        // User cancelled selection dialog
      }
    }
  };

  // Hand Raise Toggle
  const handleToggleHand = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    setParticipants(prev => prev.map(p => p.id === user?.id ? { ...p, handRaised: next } : p));

    if (next && socket) {
      socket.emit('voice-speaker-request', {
        roomId: effectiveRoomId,
        user: {
          id: user?.id,
          name: user?.name,
          username: user?.username,
          avatarUrl: user?.avatarUrl
        }
      });
      toast({ title: 'Pedido Enviado', message: 'O moderador recebeu a sua solicitação para intervir.', type: 'info' });
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
        roomId: effectiveRoomId,
        message: newMsg
      });
    }
  };

  // Individual Participant Volume
  const handleSetUserVolume = (participantId: string, volume: number) => {
    setUserVolumes(prev => ({ ...prev, [participantId]: volume }));
    const targetSocketId = participants.find(p => p.id === participantId)?.socketId || userToSocketRef.current.get(participantId);
    if (targetSocketId) {
      const audio = remoteAudiosRef.current.get(targetSocketId);
      if (audio) audio.volume = Math.min(1, Math.max(0, volume / 100));
    }
  };

  // Host: Change Room Mode
  const handleChangeRoomMode = (newMode: RoomMode) => {
    if (!isHostOrModerator) return;
    setRoomMode(newMode);
    if (socket) {
      socket.emit('voice-set-room-mode', { roomId: effectiveRoomId, mode: newMode });
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
        roomId: effectiveRoomId,
        targetUserId,
        canSpeak: allow
      });
    }
    setSpeakerRequests(prev => prev.filter(r => r.id !== targetUserId));
    toast({ title: allow ? 'Permissão Concedida' : 'Permissão Revogada', message: 'Permissão de microfone atualizada.', type: 'info' });
  };

  // Host: Authorize or Revoke Screen Share
  const handleToggleScreenPermission = (targetUserId: string, allow: boolean) => {
    if (!isHostOrModerator) return;
    setParticipants(prev => prev.map(p => p.id === targetUserId ? { ...p, canShareScreen: allow } : p));
    if (socket) {
      socket.emit('voice-update-permissions', {
        roomId: effectiveRoomId,
        targetUserId,
        canShareScreen: allow
      });
    }
    toast({ title: allow ? 'Partilha Autorizada' : 'Partilha Bloqueada', message: 'Permissão de ecrã atualizada.', type: 'info' });
  };

  // Host: Kick user
  const handleKickParticipant = (targetUserId: string, participantName: string) => {
    if (!isHostOrModerator) return;
    if (socket) {
      socket.emit('voice-kick-user', { roomId: effectiveRoomId, targetUserId });
    }
    setParticipants(prev => prev.filter(p => p.id !== targetUserId));
    toast({ title: 'Participante Removido', message: `${participantName} foi expulso da chamada.`, type: 'info' });
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

  const handleContainerClick = () => {
    if (isAudioAutoplayBlocked) {
      handleUnblockAudio();
    } else if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
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
      onClick={handleContainerClick}
      className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-[#0c0d12] text-slate-900 dark:text-slate-100 select-none font-sans overflow-hidden relative transition-colors duration-200"
    >
      {/* Hidden React-managed audio elements for all remote streams */}
      <div className="hidden" aria-hidden="true">
        {Object.entries(remoteAudioStreams).map(([targetSocketId, stream]) => {
          const mappedUserId = socketToUserRef.current.get(targetSocketId);
          const vol = mappedUserId ? (userVolumes[mappedUserId] ?? 100) : 100;
          return (
            <RemoteAudioPlayer
              key={targetSocketId}
              stream={stream}
              volume={vol}
              muted={isDeafened}
              onAutoplayBlocked={() => setIsAudioAutoplayBlocked(true)}
            />
          );
        })}
      </div>
      {/* ======================================================================= */}
      {/* 0. AUDIO AUTOPLAY RESTRICTION BANNER */}
      {/* ======================================================================= */}
      {isAudioAutoplayBlocked && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between z-30 shrink-0 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <VolumeX className="w-4 h-4 shrink-0" />
            <span>O seu navegador bloqueou a reprodução automática de áudio dos participantes.</span>
          </div>
          <button
            onClick={handleUnblockAudio}
            className="px-3 py-1 bg-slate-950 text-white rounded-lg text-xs font-bold hover:bg-slate-900 cursor-pointer shadow-xs transition-colors shrink-0 ml-3"
          >
            Ativar Som
          </button>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 1. TOP BAR: Mode Selector (Host), Room Title, Fullscreen */}
      {/* ======================================================================= */}
      <header className="h-14 bg-white dark:bg-[#151720] border-b border-slate-200 dark:border-[#222636] px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/40">
            <Radio className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">{roomName}</h2>
              
              {/* Room Mode Selector (Host) / Badge (Participants) */}
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
              title="Vista em Grelha"
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
              title="Vista em Destaque"
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
          
          {/* Solo user state */}
          {participants.length <= 1 && (
            <div className="mb-4 py-2 px-4 rounded-xl bg-white/90 dark:bg-[#151720]/90 border border-slate-200 dark:border-[#222636] text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Conectado à sala. A aguardar a entrada de outros participantes...</span>
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
                    <VideoStreamPlayer stream={screenStreamRef.current} objectFit="contain" />
                  ) : (
                    <VideoStreamPlayer 
                      stream={getRemoteStreamForUser(activeScreenSharer.id, activeScreenSharer.socketId)} 
                      objectFit="contain" 
                    />
                  )
                ) : spotlightUser?.isCameraOn ? (
                  spotlightUser.id === user?.id ? (
                    <VideoStreamPlayer stream={cameraStreamRef.current} isMirrored objectFit="cover" />
                  ) : (
                    <VideoStreamPlayer 
                      stream={getRemoteStreamForUser(spotlightUser.id, spotlightUser.socketId)} 
                      objectFit="cover" 
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="relative mb-3">
                      <Avatar src={spotlightUser?.avatarUrl} name={spotlightUser?.name} size="xl" />
                      {spotlightUser?.isSpeaking && !spotlightUser?.isMuted && (
                        <span className="absolute -inset-2 rounded-full border-2 border-emerald-500 animate-ping opacity-75 pointer-events-none"></span>
                      )}
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{spotlightUser?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Orador Ativo</p>
                  </div>
                )}

                <div className="absolute top-3 left-3 z-10">
                  <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white font-bold text-xs flex items-center gap-1.5 shadow-sm">
                    {activeScreenSharer ? <Monitor className="w-3.5 h-3.5 text-indigo-400" /> : <Crown className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{activeScreenSharer ? `Ecrã: ${activeScreenSharer.name}` : spotlightUser?.name}</span>
                  </span>
                </div>
              </div>

              {/* Spotlight Thumbnails row */}
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
                const remoteStream = isSelf ? null : getRemoteStreamForUser(p.id, p.socketId);

                return (
                  <div
                    key={p.id}
                    className={`bg-white dark:bg-[#151720] border rounded-2xl relative overflow-hidden flex items-center justify-center transition-all group min-h-[170px] ${
                      isTalking 
                        ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-md shadow-emerald-500/10' 
                        : 'border-slate-200 dark:border-[#222636] shadow-xs'
                    }`}
                  >
                    {/* Video / Screen share or Avatar */}
                    {p.isScreenSharing ? (
                      isSelf ? (
                        <VideoStreamPlayer stream={screenStreamRef.current} objectFit="contain" />
                      ) : (
                        <VideoStreamPlayer stream={remoteStream} objectFit="contain" />
                      )
                    ) : p.isCameraOn ? (
                      isSelf ? (
                        <VideoStreamPlayer stream={cameraStreamRef.current} isMirrored objectFit="cover" />
                      ) : (
                        <VideoStreamPlayer stream={remoteStream} objectFit="cover" />
                      )
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center p-4 w-full h-full relative"
                        style={
                          p.bannerUrl && !p.bannerUrl.startsWith('gradient-')
                            ? { backgroundImage: `url(${p.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : undefined
                        }
                      >
                        {/* Gradient preset banner background */}
                        {p.bannerUrl && p.bannerUrl.startsWith('gradient-') && (() => {
                          const presetMap: Record<string, string> = {
                            'gradient-indigo': 'from-blue-600 via-indigo-600 to-blue-700',
                            'gradient-emerald': 'from-emerald-500 via-teal-500 to-cyan-600',
                            'gradient-sunset': 'from-rose-500 via-orange-400 to-amber-400',
                            'gradient-dusk': 'from-violet-600 via-purple-600 to-indigo-700',
                            'gradient-aurora': 'from-cyan-400 via-blue-500 to-purple-600',
                            'gradient-midnight': 'from-slate-800 via-slate-900 to-black',
                          };
                          const gradClasses = presetMap[p.bannerUrl] || 'from-blue-600 via-indigo-600 to-blue-700';
                          return <div className={`absolute inset-0 bg-gradient-to-r ${gradClasses}`} />;
                        })()}
                        {/* Darkening overlay on top of banner for readability */}
                        {p.bannerUrl && <div className="absolute inset-0 bg-black/30" />}

                        <div className="relative z-10 flex flex-col items-center">
                          <div className="relative">
                            <Avatar
                              src={p.avatarUrl}
                              name={p.name}
                              size="lg"
                              className={`transition-transform duration-150 ${isTalking ? 'scale-105' : ''} ring-2 ring-white/60`}
                            />
                            {isTalking && (
                              <span className="absolute -inset-1 rounded-full border-2 border-emerald-500 animate-ping opacity-75 pointer-events-none"></span>
                            )}
                          </div>
                          <span className={`font-bold text-xs mt-2.5 truncate max-w-[140px] text-center ${p.bannerUrl ? 'text-white drop-shadow' : 'text-slate-800 dark:text-zinc-100'}`}>{p.name}</span>
                          {p.role === 'CREATOR' && (
                            <span className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${p.bannerUrl ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`}>
                              <Crown className="w-3 h-3" />
                              Instrutor
                            </span>
                          )}
                          {roomMode === 'stage' && !p.canSpeak && p.role !== 'CREATOR' && p.role !== 'ADMIN' && (
                            <span className={`text-[10px] font-medium mt-0.5 ${p.bannerUrl ? 'text-white/70' : 'text-slate-400'}`}>Ouvinte</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bottom Status Bar */}
                    <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10">
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
                          <span className="text-indigo-600 dark:text-indigo-400 font-mono">{userVolumes[p.id] ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={userVolumes[p.id] ?? 100}
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
          <aside className="absolute inset-0 sm:relative sm:inset-auto w-full sm:w-80 bg-white dark:bg-[#151720] border-l border-slate-200 dark:border-[#222636] flex flex-col z-20 animate-slide-in transition-colors">
            
            {/* Drawer Header */}
            <div className="h-12 px-4 border-b border-slate-200 dark:border-[#222636] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                {activeSideDrawer === 'chat' && (
                  <>
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    <span>Chat da Sala</span>
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#222636] transition-colors cursor-pointer"
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

            {/* TAB 2: MEMBERS & PERMISSIONS */}
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

                      {/* Moderator Toolbar per participant */}
                      {isHostOrModerator && !isSelf && !isCreator && (
                        <div className="pt-2 border-t border-slate-200 dark:border-[#282d3e] grid grid-cols-3 gap-1.5 text-[10px] font-bold">
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

                          <button
                            onClick={() => handleKickParticipant(p.id, p.name)}
                            className="py-1 px-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Remover da chamada"
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

            {/* TAB 3: STAGE REQUESTS (Host only) */}
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
      {/* 3. BOTTOM CONTROL DOCK — responsive two-row layout on mobile          */}
      {/* ======================================================================= */}
      <footer className="bg-white dark:bg-[#151720] border-t border-slate-200 dark:border-[#222636] px-2 sm:px-4 py-2 sm:py-0 sm:h-20 flex flex-col sm:flex-row items-center justify-center gap-2 shrink-0 z-30 transition-colors pb-safe">
        {/* Row 1 (mobile) / Single row (desktop): primary media controls + disconnect */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-[#0c0d12] p-1.5 rounded-2xl border border-slate-200 dark:border-[#222636] shadow-sm w-full sm:w-auto justify-center">

          {/* 1. Microphone Toggle */}
          <button
            onClick={handleToggleMic}
            className={`p-2.5 sm:p-3 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 relative min-w-[44px] min-h-[44px] justify-center ${
              isMicMuted
                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/25'
                : 'bg-white dark:bg-[#1e2230] text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-[#2b3144] shadow-xs'
            }`}
            title={!canSelfSpeak ? 'Microfone bloqueado (Modo Palco)' : isMicMuted ? 'Ativar Microfone' : 'Desativar Microfone'}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            {!isMicMuted && (
              <span className="hidden sm:flex w-1.5 h-5 bg-emerald-500/25 rounded-full overflow-hidden flex-col justify-end">
                <span className="w-full bg-emerald-500 transition-all duration-75" style={{ height: `${micLevel}%` }}></span>
              </span>
            )}
          </button>

          {/* 2. Deafen Audio */}
          <button
            onClick={handleToggleDeafen}
            className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isDeafened
                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                : 'bg-white dark:bg-[#1e2230] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-[#2b3144] hover:bg-slate-50 dark:hover:bg-[#252a3b]'
            }`}
            title={isDeafened ? 'Reativar Áudio' : 'Silenciar Tudo'}
          >
            {isDeafened ? <VolumeX className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
          </button>

          {/* 3. Camera Toggle */}
          <button
            onClick={handleToggleCamera}
            className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isCameraActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white dark:bg-[#1e2230] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-[#2b3144] hover:bg-slate-50 dark:hover:bg-[#252a3b]'
            }`}
            title={isCameraActive ? 'Desligar Câmara' : 'Ligar Câmara'}
          >
            {isCameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* 4. Screen Sharing — hidden on mobile (not supported on most mobile browsers) */}
          <button
            onClick={handleToggleScreenShare}
            className={`hidden sm:flex p-3 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] items-center justify-center ${
              isScreenSharing
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-white dark:bg-[#1e2230] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-[#2b3144] hover:bg-slate-50 dark:hover:bg-[#252a3b]'
            }`}
            title={!canSelfShareScreen ? 'Partilha restrita' : isScreenSharing ? 'Parar Partilha' : 'Partilhar Ecrã'}
          >
            {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
          </button>

          {/* 5. Hand Raise */}
          <button
            onClick={handleToggleHand}
            className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isHandRaised
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                : 'bg-white dark:bg-[#1e2230] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-[#2b3144] hover:bg-slate-50 dark:hover:bg-[#252a3b]'
            }`}
            title={isHandRaised ? 'Baixar Mão' : 'Pedir a Palavra'}
          >
            <Hand className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-slate-300 dark:bg-[#2b3144] mx-0.5 hidden sm:block"></div>

          {/* 6. Settings — hidden on mobile to save space */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="hidden sm:flex p-3 rounded-xl bg-white dark:bg-[#1e2230] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-[#2b3144] hover:bg-slate-50 dark:hover:bg-[#252a3b] transition-colors cursor-pointer min-w-[44px] min-h-[44px] items-center justify-center"
            title="Definições de Voz e Áudio"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* 7. Text Chat Drawer */}
          <button
            onClick={() => setActiveSideDrawer(activeSideDrawer === 'chat' ? 'none' : 'chat')}
            className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
              activeSideDrawer === 'chat'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#1e2230] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-[#2b3144] hover:bg-slate-50 dark:hover:bg-[#252a3b]'
            }`}
            title="Chat da Sala"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* 8. Participants Drawer */}
          <button
            onClick={() => setActiveSideDrawer(activeSideDrawer === 'members' ? 'none' : 'members')}
            className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
              activeSideDrawer === 'members'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#1e2230] text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-[#2b3144] hover:bg-slate-50 dark:hover:bg-[#252a3b]'
            }`}
            title="Participantes"
          >
            <Users className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-slate-300 dark:bg-[#2b3144] mx-0.5"></div>

          {/* 9. Disconnect */}
          <button
            onClick={handleDisconnect}
            className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/30 min-h-[44px]"
            title="Sair da Sala"
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
