import './ChamadaPalco.css';
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
import { useAutenticacao } from '../../contextos/ContextoAutenticacao';
import { useSocket } from '../../contextos/ContextoSocket';
import { useChamadaAtiva } from '../../contextos/ContextoChamadaAtiva';
import { useAvisos } from '../Avisos';
import { soundEffects } from '../../servicos/soundEffects';
import { formatarCargo } from '../../utilitarios/formatacao';

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
const VideoLeitor = ({ stream, isMirrored = false, isContain = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
      }

      el.play().catch(() => {});

      const registar = stream.getVideoTracks()[0];
      if (registar) {
        const tratarAtivarMicrofone = () => {
          el.play().catch(() => {});
        };

        registar.addEventListener('unmute', tratarAtivarMicrofone);

        return () => registar.removeEventListener('unmute', tratarAtivarMicrofone);
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

export const ChamadaPalco = ({
  roomName: salaNome,
  roomId: salaId,
  roomType: salaType = 'voice',
  initialParticipants: inicialParticipants = [],
  onDisconnect,
  isModal: isJanela = false,
  initialMuted: inicialMuted = false,
  initialCameraOn: inicialCamaraOn = false,
}) => {
  const effectiveSalaId = salaId || salaNome;
  const { user: utilizador } = useAutenticacao();
  const { socket } = useSocket();
  const { toast: aviso } = useAvisos();
  const {
    updateCallAudioState: atualizarChamadaAudioEstado,
    isMicMuted: contextoMicMuted,
    isDeafened: contextoDeafened,
  } = useChamadaAtiva();
  const iniciarMutedCalc = Boolean(inicialMuted || contextoMicMuted || contextoDeafened);
  const iniciarDeafenedCalc = Boolean(contextoDeafened);
  const [isMobile, definirIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;

    return window.innerWidth < 768;
  });

  useEffect(() => {
    const tratarRedimensionar = () => {
      definirIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', tratarRedimensionar);

    return () => window.removeEventListener('resize', tratarRedimensionar);
  }, []);
  useEffect(() => {
    document.body.classList.add('in-active-call');

    const anteriorOverflow = document.body.style.overflow;
    if (isMobile || isJanela) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.classList.remove('in-active-call');
      document.body.style.overflow = anteriorOverflow;
    };
  }, [isMobile, isJanela]);

  const [isMicMuted, definirIsMicMuted] = useState(iniciarMutedCalc);
  const [isDeafened, definirIsDeafened] = useState(iniciarDeafenedCalc);
  const isDeafenedRef = useRef(iniciarDeafenedCalc);
  const [isCamaraOn, definirIsCamaraOn] = useState(Boolean(inicialCamaraOn));
  const [isEcraSharing, definirIsEcraSharing] = useState(false);
  const [chamadaDuracao, definirChamadaDuracao] = useState(0);
  const [isEcraInteiro, definirIsEcraInteiro] = useState(false);
  const [sideDrawer, definirSideDrawer] = useState('none');
  const [autoplayBlocked, definirAutoplayBlocked] = useState(false);
  const [isEcraMaximized, definirIsEcraMaximized] = useState(false);
  const [participants, definirParticipants] = useState(() => {
    if (inicialParticipants.length > 0) return inicialParticipants;
    if (!utilizador) return [];

    return [
      {
        id: utilizador.id,
        socketId: 'self',
        name: `${utilizador.name} (Você)`,
        username: utilizador.username,
        urlAvatar: utilizador.urlAvatar,
        role: utilizador.role,
        isSelf: true,
        isSpeaking: false,
        isMuted: iniciarMutedCalc,
        isDeafened: iniciarDeafenedCalc,
        isCameraOn: Boolean(inicialCamaraOn),
        isScreenSharing: false,
      },
    ];
  });

  useEffect(() => {
    if (socket?.id) {
      definirParticipants((anterior) =>
        anterior.map((p) =>
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

  const [localCamaraStream, definirLocalCamaraStream] = useState(null);
  const [localEcraStream, definirLocalEcraStream] = useState(null);
  const [remotoCamaraStreams, definirRemotoCamaraStreams] = useState({});
  const [remotoEcraStreams, definirRemotoEcraStreams] = useState({});
  const [selecionadoEcraUtilizadorId, definirSelecionadoEcraUtilizadorId] = useState(null);
  const [conversaMensagens, definirConversaMensagens] = useState([
    {
      id: '1',
      sender: 'Sistema',
      content: `Chamada iniciada em "${salaNome}".`,
      time: 'Agora',
      isSystem: true,
    },
  ]);
  const [conversaEntrada, definirConversaEntrada] = useState('');
  const containerRef = useRef(null);
  const conversaMensagensTerminarRef = useRef(null);
  const localAudioStreamRef = useRef(null);
  const localCamaraStreamRef = useRef(null);
  const localEcraStreamRef = useRef(null);
  const participanteConnectionsRef = useRef(new Map());
  const camaraSendersRef = useRef(new Map());
  const ecraSendersRef = useRef(new Map());
  const ecraAudioSendersRef = useRef(new Map());
  const audioSendersRef = useRef(new Map());
  const makingOfferRef = useRef(new Map());
  const participanteEcraStreamIdsRef = useRef(new Map());
  const participanteCamaraStreamIdsRef = useRef(new Map());
  const participanteEcraRegistarIdsRef = useRef(new Map());
  const participanteCamaraRegistarIdsRef = useRef(new Map());
  const recentesVideoFaixasRef = useRef(new Map()); // track.id -> { targetUserId, stream, track, streamId }

  const remotoAudioElementsRef = useRef(new Map());
  const pendenteIceCandidatesRef = useRef(new Map());
  const socketToUtilizadorRef = useRef(new Map());
  const utilizadorToSocketRef = useRef(new Map());
  const audioContextoRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const ultimaSpeakingRef = useRef(false);

  // Keep latest user in ref to avoid stale closures
  const utilizadorRef = useRef(utilizador);

  useEffect(() => {
    utilizadorRef.current = utilizador;
  }, [utilizador]);

  // Duration Timer
  useEffect(() => {
    const timer = setInterval(() => definirChamadaDuracao((d) => d + 1), 1000);

    return () => clearInterval(timer);
  }, []);

  const formatarTempo = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');

    return `${m}:${s}`;
  };

  const tratarDesbloquearAudio = () => {
    remotoAudioElementsRef.current.forEach((audio) => {
      audio.play().catch(() => {});
    });
    if (audioContextoRef.current && audioContextoRef.current.state === 'suspended') {
      audioContextoRef.current.resume().catch(() => {});
    }

    definirAutoplayBlocked(false);
  };

  const configurarAudioAnalyser = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      audioContextoRef.current = ctx;

      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();

      analyser.fftSize = 128;
      src.connect(analyser);
      analyserRef.current = analyser;

      const dados = new Uint8Array(analyser.frequencyBinCount);
      const verificarAudio = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dados);

        let somar = 0;
        for (let i = 0; i < dados.length; i++) somar += dados[i];
        const avg = somar / dados.length;
        const isSpeakingAgora =
          avg > 14 &&
          !localAudioStreamRef.current?.getAudioTracks()[0]?.muted &&
          localAudioStreamRef.current?.getAudioTracks()[0]?.enabled;
        if (ultimaSpeakingRef.current !== isSpeakingAgora) {
          ultimaSpeakingRef.current = isSpeakingAgora;

          const atualUtilizadorId = utilizadorRef.current?.id;

          definirParticipants((anterior) =>
            anterior.map((p) =>
              p.id === atualUtilizadorId
                ? {
                    ...p,
                    isSpeaking: isSpeakingAgora,
                  }
                : p,
            ),
          );
          if (socket) {
            socket.emit('voice-speaking-state', {
              roomId: effectiveSalaId,
              idUtilizador: atualUtilizadorId,
              isSpeaking: isSpeakingAgora,
            });
          }
        }

        animFrameRef.current = requestAnimationFrame(verificarAudio);
      };

      verificarAudio();
    } catch {}
  };

  const iniciarLocalAudio = async () => {
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
      if (iniciarMutedCalc) {
        stream.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
      }

      localAudioStreamRef.current = stream;
      configurarAudioAnalyser(stream);

      return stream;
    } catch (erro) {
      console.warn('Microfone não acessível ou sem permissão:', erro);

      return null;
    }
  };

  // Helper to resolve whether a video track is screen share or camera
  const classifyAndStoreVideoRegistar = useCallback((registar, stream, destinoUtilizadorId) => {
    if (!destinoUtilizadorId) return;
    recentesVideoFaixasRef.current.set(registar.id, {
      targetUserId: destinoUtilizadorId,
      stream,
      track: registar,
      streamId: stream.id,
    });

    const knownEcraStreamId = participanteEcraStreamIdsRef.current.get(destinoUtilizadorId);
    const knownEcraRegistarId = participanteEcraRegistarIdsRef.current.get(destinoUtilizadorId);
    let isEcra = false;
    if (knownEcraStreamId && stream.id === knownEcraStreamId) {
      isEcra = true;
    } else if (knownEcraRegistarId && registar.id === knownEcraRegistarId) {
      isEcra = true;
    } else {
      // Distingue a câmara da partilha de ecrã do mesmo participante.
      definirRemotoCamaraStreams((atualCameras) => {
        const temExistenteCam =
          !!atualCameras[destinoUtilizadorId] && atualCameras[destinoUtilizadorId].id !== stream.id;
        if (temExistenteCam) {
          isEcra = true;
        }

        return atualCameras;
      });

      const label = (registar.label || '').toLowerCase();
      const streamId = (stream.id || '').toLowerCase();
      if (label.includes('screen') || label.includes('display') || streamId.includes('screen')) {
        isEcra = true;
      }
    }

    if (isEcra) {
      definirRemotoEcraStreams((anterior) => ({
        ...anterior,
        [destinoUtilizadorId]: stream,
      }));
      // Destaca automaticamente o ecrã partilhado.
      definirSelecionadoEcraUtilizadorId(destinoUtilizadorId);
    } else {
      definirRemotoCamaraStreams((anterior) => ({
        ...anterior,
        [destinoUtilizadorId]: stream,
      }));
    }

    registar.onended = () => {
      recentesVideoFaixasRef.current.delete(registar.id);
      if (isEcra) {
        definirRemotoEcraStreams((anterior) => {
          const seguinte = {
            ...anterior,
          };

          delete seguinte[destinoUtilizadorId];

          return seguinte;
        });
      } else {
        definirRemotoCamaraStreams((anterior) => {
          const seguinte = {
            ...anterior,
          };

          delete seguinte[destinoUtilizadorId];

          return seguinte;
        });
      }
    };
  }, []);

  // WebRTC Peer Connection Factory (Stable, not recreating on state updates)
  const obterOrCriarParticipanteLigacao = useCallback(
    (destinoSocketId, remotoUtilizador) => {
      if (participanteConnectionsRef.current.has(destinoSocketId)) {
        return participanteConnectionsRef.current.get(destinoSocketId);
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);

      participanteConnectionsRef.current.set(destinoSocketId, pc);

      // Add local audio
      if (localAudioStreamRef.current) {
        localAudioStreamRef.current.getAudioTracks().forEach((registar) => {
          try {
            const remetente = pc.addTrack(registar, localAudioStreamRef.current);

            audioSendersRef.current.set(destinoSocketId, remetente);
          } catch {}
        });
      }

      // Inclui a câmara local quando está ativa.
      if (localCamaraStreamRef.current) {
        const camRegistar = localCamaraStreamRef.current.getVideoTracks()[0];
        if (camRegistar) {
          try {
            const remetente = pc.addTrack(camRegistar, localCamaraStreamRef.current);

            camaraSendersRef.current.set(destinoSocketId, remetente);
          } catch {}
        }
      }

      // Inclui a partilha de ecrã local quando está ativa.
      if (localEcraStreamRef.current) {
        const ecraRegistar = localEcraStreamRef.current.getVideoTracks()[0];
        if (ecraRegistar) {
          try {
            const remetente = pc.addTrack(ecraRegistar, localEcraStreamRef.current);

            ecraSendersRef.current.set(destinoSocketId, remetente);
          } catch {}
        }

        const ecraAudioRegistar = localEcraStreamRef.current.getAudioTracks()[0];
        if (ecraAudioRegistar) {
          try {
            const audioRemetente = pc.addTrack(ecraAudioRegistar, localEcraStreamRef.current);

            ecraAudioSendersRef.current.set(destinoSocketId, audioRemetente);
          } catch {}
        }
      }

      pc.onicecandidate = (evento) => {
        if (evento.candidate && socket) {
          socket.emit('voice-signal-ice', {
            targetSocketId: destinoSocketId,
            candidate: evento.candidate,
          });
        }
      };

      pc.ontrack = (evento) => {
        const { track: registar } = evento;
        const destinoUtilizadorId =
          socketToUtilizadorRef.current.get(destinoSocketId) || remotoUtilizador?.id;
        const stream =
          evento.streams && evento.streams[0] ? evento.streams[0] : new MediaStream([registar]);
        if (registar.kind === 'audio') {
          let audio = remotoAudioElementsRef.current.get(destinoSocketId);
          if (!audio) {
            audio = document.createElement('audio');
            audio.autoplay = true;
            audio.playsInline = true;
            audio.muted = isDeafenedRef.current;
            document.body.appendChild(audio);
            remotoAudioElementsRef.current.set(destinoSocketId, audio);
          } else {
            audio.muted = isDeafenedRef.current;
          }

          audio.srcObject = stream;
          audio.play().catch(() => definirAutoplayBlocked(true));
        } else if (registar.kind === 'video') {
          classifyAndStoreVideoRegistar(registar, stream, destinoUtilizadorId);
        }
      };

      return pc;
    },
    [socket, classifyAndStoreVideoRegistar],
  );

  // Signaling: Send Offer
  const enviarOfferToParticipante = useCallback(
    async (destinoSocketId, autorChamadaUtilizador) => {
      try {
        if (makingOfferRef.current.get(destinoSocketId)) return;
        makingOfferRef.current.set(destinoSocketId, true);

        const pc = obterOrCriarParticipanteLigacao(destinoSocketId, autorChamadaUtilizador);
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
          targetSocketId: destinoSocketId,
          offer: pc.localDescription,
          callerUser: utilizadorRef.current,
          cameraStreamId: localCamaraStreamRef.current?.id || null,
          screenStreamId: localEcraStreamRef.current?.id || null,
          cameraTrackId: localCamaraStreamRef.current?.getVideoTracks()[0]?.id || null,
          screenTrackId: localEcraStreamRef.current?.getVideoTracks()[0]?.id || null,
          isCameraOn: !!localCamaraStreamRef.current,
          isScreenSharing: !!localEcraStreamRef.current,
        });
      } catch (erro) {
        console.error('Erro ao criar ou enviar oferta WebRTC:', erro);
      } finally {
        makingOfferRef.current.set(destinoSocketId, false);
      }
    },
    [obterOrCriarParticipanteLigacao, socket],
  );

  // Main Session & WebRTC Lifecycle
  useEffect(() => {
    let isMounted = true;
    // A entrada na sala não espera pela autorização do microfone. As ligações usam STUN.
    if (socket && utilizadorRef.current?.id) {
      socket.emit('join-voice-room', {
        roomId: effectiveSalaId,
        user: {
          id: utilizadorRef.current.id,
          name: utilizadorRef.current.name,
          username: utilizadorRef.current.username,
          urlAvatar: utilizadorRef.current.urlAvatar,
          role: utilizadorRef.current.role,
        },
        isMuted: isMicMuted,
        isDeafened: isDeafened,
        isCameraOn: Boolean(inicialCamaraOn),
      });
    }

    // 2. Initialize local audio stream in background and add to any open peer connections
    iniciarLocalAudio().then((stream) => {
      if (stream && isMounted) {
        const audioRegistar = stream.getAudioTracks()[0];
        if (audioRegistar) {
          if (isMicMuted) {
            audioRegistar.enabled = false;
          }

          for (const [destinoSocketId, pc] of participanteConnectionsRef.current.entries()) {
            try {
              const remetente = pc.addTrack(audioRegistar, stream);

              audioSendersRef.current.set(destinoSocketId, remetente);
              enviarOfferToParticipante(destinoSocketId);
            } catch {}
          }
        }
      }
    });

    // Inicia a câmara quando essa foi a opção escolhida ao entrar.
    if (inicialCamaraOn) {
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

          localCamaraStreamRef.current = camStream;
          definirLocalCamaraStream(camStream);
          definirIsCamaraOn(true);

          const camRegistar = camStream.getVideoTracks()[0];
          for (const [destinoSocketId, pc] of participanteConnectionsRef.current.entries()) {
            try {
              const remetente = pc.addTrack(camRegistar, camStream);

              camaraSendersRef.current.set(destinoSocketId, remetente);
              enviarOfferToParticipante(destinoSocketId);
            } catch {}
          }

          definirParticipants((anterior) =>
            anterior.map((p) =>
              p.isSelf
                ? {
                    ...p,
                    isCameraOn: true,
                  }
                : p,
            ),
          );
          socket?.emit('voice-state-update', {
            roomId: effectiveSalaId,
            idUtilizador: utilizadorRef.current?.id,
            isCameraOn: true,
            cameraTrackId: camRegistar?.id,
            cameraStreamId: camStream.id,
          });
        })
        .catch((erro) => {
          console.warn('Erro ao ligar câmara na entrada:', erro);
        });
    }

    if (socket && utilizadorRef.current?.id) {
      // Participantes que já se encontram na sala.
      socket.on('voice-room-existing-users', async (existenteListar) => {
        if (!Array.isArray(existenteListar) || !isMounted) return;
        definirParticipants((anterior) => {
          const seguinte = [...anterior];
          for (const item of existenteListar) {
            const remotoUtilizador = item.user;
            // Identifica o participante remoto pelo identificador do socket.
            if (remotoUtilizador && item.socketId && item.socketId !== socket.id) {
              socketToUtilizadorRef.current.set(item.socketId, remotoUtilizador.id);
              utilizadorToSocketRef.current.set(remotoUtilizador.id, item.socketId);
              if (item.screenStreamId) {
                participanteEcraStreamIdsRef.current.set(remotoUtilizador.id, item.screenStreamId);
              }

              if (item.cameraStreamId) {
                participanteCamaraStreamIdsRef.current.set(
                  remotoUtilizador.id,
                  item.cameraStreamId,
                );
              }

              if (item.screenTrackId) {
                participanteEcraRegistarIdsRef.current.set(remotoUtilizador.id, item.screenTrackId);
              }

              if (item.cameraTrackId) {
                participanteCamaraRegistarIdsRef.current.set(
                  remotoUtilizador.id,
                  item.cameraTrackId,
                );
              }

              const existenteIdx = seguinte.findIndex((p) => p.socketId === item.socketId);
              const pDados = {
                id: remotoUtilizador.id,
                socketId: item.socketId,
                name: remotoUtilizador.name,
                username: remotoUtilizador.username,
                urlAvatar: remotoUtilizador.urlAvatar,
                role: remotoUtilizador.role,
                isSelf: false,
                isSpeaking: false,
                isMuted: !!item.isMuted,
                isDeafened: !!item.isDeafened,
                isCameraOn: !!item.isCameraOn,
                isScreenSharing: !!item.isScreenSharing,
                screenTrackId: item.screenTrackId,
                cameraTrackId: item.cameraTrackId,
              };
              if (existenteIdx >= 0) {
                seguinte[existenteIdx] = {
                  ...seguinte[existenteIdx],
                  ...pDados,
                };
              } else {
                seguinte.push(pDados);
              }
            }
          }

          return seguinte;
        });

        // Initiate WebRTC offers to all existing peers
        for (const item of existenteListar) {
          if (item.socketId && item.socketId !== socket.id) {
            if (item.user?.id) {
              socketToUtilizadorRef.current.set(item.socketId, item.user.id);
              utilizadorToSocketRef.current.set(item.user.id, item.socketId);
            }

            enviarOfferToParticipante(item.socketId, item.user);
          }
        }
      });

      // 2. New remote user joined
      socket.on(
        'user-joined-voice',
        ({
          user: remotoUtilizador,
          socketId: remotoSocketId,
          isMuted: remotoMuted,
          isDeafened: remotoDeafened,
          isCameraOn: remotoCamaraOn,
        }) => {
          if (!remotoUtilizador || !remotoSocketId || remotoSocketId === socket.id || !isMounted)
            return;
          socketToUtilizadorRef.current.set(remotoSocketId, remotoUtilizador.id);
          utilizadorToSocketRef.current.set(remotoUtilizador.id, remotoSocketId);
          definirParticipants((anterior) => {
            const existenteIdx = anterior.findIndex((p) => p.socketId === remotoSocketId);
            const pDados = {
              id: remotoUtilizador.id,
              socketId: remotoSocketId,
              name: remotoUtilizador.name,
              username: remotoUtilizador.username,
              urlAvatar: remotoUtilizador.urlAvatar,
              role: remotoUtilizador.role,
              isSelf: false,
              isSpeaking: false,
              isMuted: remotoMuted !== undefined ? Boolean(remotoMuted) : false,
              isDeafened: remotoDeafened !== undefined ? Boolean(remotoDeafened) : false,
              isCameraOn: remotoCamaraOn !== undefined ? Boolean(remotoCamaraOn) : false,
              isScreenSharing: false,
            };
            if (existenteIdx >= 0) {
              const seguinte = [...anterior];

              seguinte[existenteIdx] = {
                ...seguinte[existenteIdx],
                ...pDados,
              };

              return seguinte;
            }

            return [...anterior, pDados];
          });
          aviso({
            title: 'Conectado',
            message: `${remotoUtilizador.name} juntou-se à chamada.`,
            type: 'info',
          });
        },
      );

      // Negociação WebRTC com resolução de propostas simultâneas.
      socket.on(
        'voice-signal-offer',
        async ({
          callerSocketId: autorChamadaSocketId,
          offer,
          callerUser: autorChamadaUtilizador,
          screenStreamId: ecraStreamId,
          cameraStreamId: camaraStreamId,
          screenTrackId: ecraRegistarId,
          cameraTrackId: camaraRegistarId,
        }) => {
          try {
            if (autorChamadaUtilizador?.id) {
              if (autorChamadaSocketId) {
                socketToUtilizadorRef.current.set(autorChamadaSocketId, autorChamadaUtilizador.id);
                utilizadorToSocketRef.current.set(autorChamadaUtilizador.id, autorChamadaSocketId);
              }

              if (ecraStreamId)
                participanteEcraStreamIdsRef.current.set(autorChamadaUtilizador.id, ecraStreamId);
              if (camaraStreamId)
                participanteCamaraStreamIdsRef.current.set(
                  autorChamadaUtilizador.id,
                  camaraStreamId,
                );
              if (ecraRegistarId)
                participanteEcraRegistarIdsRef.current.set(
                  autorChamadaUtilizador.id,
                  ecraRegistarId,
                );
              if (camaraRegistarId)
                participanteCamaraRegistarIdsRef.current.set(
                  autorChamadaUtilizador.id,
                  camaraRegistarId,
                );
            }

            const pc = obterOrCriarParticipanteLigacao(
              autorChamadaSocketId,
              autorChamadaUtilizador,
            );
            const isPolite = (socket.id || '').localeCompare(autorChamadaSocketId) > 0;
            const offerCollision =
              pc.signalingState !== 'stable' || makingOfferRef.current.get(autorChamadaSocketId);
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
            const pendente = pendenteIceCandidatesRef.current.get(autorChamadaSocketId) || [];
            for (const cand of pendente) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch {}
            }

            pendenteIceCandidatesRef.current.delete(autorChamadaSocketId);

            const resposta = await pc.createAnswer();

            await pc.setLocalDescription(resposta);
            socket.emit('voice-signal-answer', {
              targetSocketId: autorChamadaSocketId,
              answer: pc.localDescription,
              responderUser: utilizadorRef.current,
              screenStreamId: localEcraStreamRef.current?.id || null,
              cameraStreamId: localCamaraStreamRef.current?.id || null,
              screenTrackId: localEcraStreamRef.current?.getVideoTracks()[0]?.id || null,
              cameraTrackId: localCamaraStreamRef.current?.getVideoTracks()[0]?.id || null,
            });
          } catch (erro) {
            console.error('Erro ao processar oferta WebRTC:', erro);
          }
        },
      );

      // 4. Incoming WebRTC Answer
      socket.on(
        'voice-signal-answer',
        async ({
          responderSocketId,
          answer: resposta,
          responderUser: responderUtilizador,
          screenStreamId: ecraStreamId,
          cameraStreamId: camaraStreamId,
          screenTrackId: ecraRegistarId,
          cameraTrackId: camaraRegistarId,
        }) => {
          try {
            const rId =
              responderUtilizador?.id || socketToUtilizadorRef.current.get(responderSocketId);
            if (rId) {
              if (ecraStreamId) participanteEcraStreamIdsRef.current.set(rId, ecraStreamId);
              if (camaraStreamId) participanteCamaraStreamIdsRef.current.set(rId, camaraStreamId);
              if (ecraRegistarId) participanteEcraRegistarIdsRef.current.set(rId, ecraRegistarId);
              if (camaraRegistarId)
                participanteCamaraRegistarIdsRef.current.set(rId, camaraRegistarId);
            }

            const pc = participanteConnectionsRef.current.get(responderSocketId);
            if (pc && pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(resposta));

              const pendente = pendenteIceCandidatesRef.current.get(responderSocketId) || [];
              for (const cand of pendente) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch {}
              }

              pendenteIceCandidatesRef.current.delete(responderSocketId);
            }
          } catch (erro) {
            console.error('Erro ao processar resposta WebRTC:', erro);
          }
        },
      );

      // 5. Incoming ICE Candidate
      socket.on('voice-signal-ice', async ({ candidate, fromSocketId }) => {
        try {
          const pc = participanteConnectionsRef.current.get(fromSocketId);
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            const fila = pendenteIceCandidatesRef.current.get(fromSocketId) || [];

            fila.push(candidate);
            pendenteIceCandidatesRef.current.set(fromSocketId, fila);
          }
        } catch {}
      });

      // 6. Remote user state changed (Mic, Camera, Screen Share)
      socket.on(
        'user-voice-state-changed',
        ({
          idUtilizador: utilizadorId,
          socketId,
          isMuted,
          isDeafened: remotoDeafened,
          isCameraOn: remotoCamaraOn,
          isScreenSharing: remotoEcraSharing,
          cameraTrackId: camaraRegistarId,
          screenTrackId: ecraRegistarId,
          cameraStreamId: camaraStreamId,
          screenStreamId: ecraStreamId,
        }) => {
          if (socketId && utilizadorId) {
            socketToUtilizadorRef.current.set(socketId, utilizadorId);
            utilizadorToSocketRef.current.set(utilizadorId, socketId);
          }

          if (ecraStreamId) participanteEcraStreamIdsRef.current.set(utilizadorId, ecraStreamId);
          if (camaraStreamId)
            participanteCamaraStreamIdsRef.current.set(utilizadorId, camaraStreamId);
          if (ecraRegistarId)
            participanteEcraRegistarIdsRef.current.set(utilizadorId, ecraRegistarId);
          if (camaraRegistarId)
            participanteCamaraRegistarIdsRef.current.set(utilizadorId, camaraRegistarId);

          // Screen share turned OFF
          if (remotoEcraSharing === false && utilizadorId) {
            definirRemotoEcraStreams((anterior) => {
              const seguinte = {
                ...anterior,
              };

              delete seguinte[utilizadorId];

              return seguinte;
            });
            definirSelecionadoEcraUtilizadorId((atual) => (atual === utilizadorId ? null : atual));
          }
          // Screen share turned ON
          else if (remotoEcraSharing === true && utilizadorId) {
            definirSelecionadoEcraUtilizadorId(utilizadorId);
            // Procura a faixa de vídeo correspondente entre as faixas recebidas.
            for (const [, dados] of recentesVideoFaixasRef.current.entries()) {
              if (dados.targetUserId === utilizadorId) {
                if (
                  !ecraStreamId ||
                  dados.streamId === ecraStreamId ||
                  dados.track?.id === ecraRegistarId
                ) {
                  definirRemotoEcraStreams((anterior) => ({
                    ...anterior,
                    [utilizadorId]: dados.stream,
                  }));
                  break;
                }
              }
            }
          }

          // Camera turned OFF
          if (remotoCamaraOn === false && utilizadorId) {
            definirRemotoCamaraStreams((anterior) => {
              const seguinte = {
                ...anterior,
              };

              delete seguinte[utilizadorId];

              return seguinte;
            });
          }
          // Camera turned ON
          else if (remotoCamaraOn === true && utilizadorId) {
            for (const [, dados] of recentesVideoFaixasRef.current.entries()) {
              if (dados.targetUserId === utilizadorId) {
                if (dados.streamId !== ecraStreamId && dados.track?.id !== ecraRegistarId) {
                  definirRemotoCamaraStreams((anterior) => ({
                    ...anterior,
                    [utilizadorId]: dados.stream,
                  }));
                  break;
                }
              }
            }
          }

          definirParticipants((anterior) =>
            anterior.map((p) => {
              const isDestino = socketId
                ? p.socketId === socketId
                : p.id === utilizadorId && !p.isSelf;
              if (!isDestino) return p;

              return {
                ...p,
                socketId: p.socketId || socketId,
                isMuted: isMuted !== undefined ? isMuted : p.isMuted,
                isDeafened: remotoDeafened !== undefined ? remotoDeafened : p.isDeafened,
                isCameraOn: remotoCamaraOn !== undefined ? remotoCamaraOn : p.isCameraOn,
                isScreenSharing:
                  remotoEcraSharing !== undefined ? remotoEcraSharing : p.isScreenSharing,
                screenTrackId: ecraRegistarId || p.screenTrackId,
                cameraTrackId: camaraRegistarId || p.cameraTrackId,
              };
            }),
          );
        },
      );

      // 7. Speaking state changed
      socket.on(
        'user-voice-speaking-changed',
        ({ idUtilizador: utilizadorId, socketId, isSpeaking }) => {
          definirParticipants((anterior) =>
            anterior.map((p) => {
              const isDestino = socketId
                ? p.socketId === socketId
                : p.id === utilizadorId && !p.isSelf;

              return isDestino
                ? {
                    ...p,
                    isSpeaking: !!isSpeaking,
                  }
                : p;
            }),
          );
        },
      );

      // 8. Remote user left voice
      socket.on('user-left-voice', ({ idUtilizador: utilizadorId, socketId }) => {
        definirParticipants((anterior) =>
          anterior.filter(
            (p) => p.isSelf || (socketId ? p.socketId !== socketId : p.id !== utilizadorId),
          ),
        );

        const sId = socketId || utilizadorToSocketRef.current.get(utilizadorId);
        if (sId) {
          const pc = participanteConnectionsRef.current.get(sId);
          if (pc) {
            pc.close();
            participanteConnectionsRef.current.delete(sId);
          }

          camaraSendersRef.current.delete(sId);
          ecraSendersRef.current.delete(sId);
          ecraAudioSendersRef.current.delete(sId);
          audioSendersRef.current.delete(sId);

          const audio = remotoAudioElementsRef.current.get(sId);
          if (audio) {
            audio.srcObject = null;
            audio.remove();
            remotoAudioElementsRef.current.delete(sId);
          }
        }

        if (utilizadorId) {
          definirRemotoCamaraStreams((anterior) => {
            const seguinte = {
              ...anterior,
            };

            delete seguinte[utilizadorId];

            return seguinte;
          });
          definirRemotoEcraStreams((anterior) => {
            const seguinte = {
              ...anterior,
            };

            delete seguinte[utilizadorId];

            return seguinte;
          });
          definirSelecionadoEcraUtilizadorId((atual) => (atual === utilizadorId ? null : atual));
        }
      });

      // 9. Voice chat message
      socket.on('voice-chat-message', (msg) => {
        if (!msg) return;
        definirConversaMensagens((anterior) => {
          if (anterior.some((m) => m.id === msg.id)) return anterior;

          return [...anterior, msg];
        });
      });
    }

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (socket) {
        socket.emit('leave-voice-room', {
          roomId: effectiveSalaId,
          idUtilizador: utilizadorRef.current?.id,
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

      if (localCamaraStreamRef.current) {
        localCamaraStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (localEcraStreamRef.current) {
        localEcraStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      participanteConnectionsRef.current.forEach((pc) => pc.close());
      participanteConnectionsRef.current.clear();
      camaraSendersRef.current.clear();
      ecraSendersRef.current.clear();
      ecraAudioSendersRef.current.clear();
      audioSendersRef.current.clear();
      remotoAudioElementsRef.current.forEach((audio) => {
        audio.srcObject = null;
        audio.remove();
      });
      remotoAudioElementsRef.current.clear();
    };
  }, [effectiveSalaId, socket, obterOrCriarParticipanteLigacao, enviarOfferToParticipante, aviso]);

  // Controls: Toggle Mic
  const alternarMic = useCallback(() => {
    definirIsMicMuted((anteriorMuted) => {
      const seguinteMuted = !anteriorMuted;
      if (localAudioStreamRef.current) {
        localAudioStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = !seguinteMuted;
        });
      }

      if (seguinteMuted) {
        soundEffects.reproduzirMute();
      } else {
        soundEffects.reproduzirAtivarMicrofone();
      }

      // Reativar o microfone também repõe a receção de áudio.
      let seguinteDeafened = isDeafenedRef.current;
      if (!seguinteMuted && isDeafenedRef.current) {
        seguinteDeafened = false;
        isDeafenedRef.current = false;
        definirIsDeafened(false);
        remotoAudioElementsRef.current.forEach((audio) => {
          audio.muted = false;
        });
      }

      const atualUtilizadorId = utilizadorRef.current?.id;

      definirParticipants((anterior) =>
        anterior.map((p) =>
          p.id === atualUtilizadorId
            ? {
                ...p,
                isMuted: seguinteMuted,
                isDeafened: seguinteDeafened,
              }
            : p,
        ),
      );
      socket?.emit('voice-state-update', {
        roomId: effectiveSalaId,
        idUtilizador: atualUtilizadorId,
        isMuted: seguinteMuted,
        isDeafened: seguinteDeafened,
      });
      atualizarChamadaAudioEstado({
        isMuted: seguinteMuted,
        isDeafened: seguinteDeafened,
      });

      return seguinteMuted;
    });
  }, [effectiveSalaId, socket, atualizarChamadaAudioEstado]);

  // Controls: Toggle Deafen
  const alternarSilenciarAudio = useCallback(() => {
    const seguinteDeafened = !isDeafenedRef.current;

    isDeafenedRef.current = seguinteDeafened;
    definirIsDeafened(seguinteDeafened);

    // 1. Mute or unmute all remote audio elements
    remotoAudioElementsRef.current.forEach((audio) => {
      audio.muted = seguinteDeafened;
    });

    // 2. Play sound effects
    if (seguinteDeafened) {
      soundEffects.reproduzirSilenciarAudio();
    } else {
      soundEffects.reproduzirAtivarAudio();
    }

    // 3. Ao ficar deafen, o microfone fica OFF também!
    let seguinteMicMuted = isMicMuted;
    if (seguinteDeafened) {
      seguinteMicMuted = true;
      definirIsMicMuted(true);
      if (localAudioStreamRef.current) {
        localAudioStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
      }
    }

    const atualUtilizadorId = utilizadorRef.current?.id;

    definirParticipants((anterior) =>
      anterior.map((p) =>
        p.id === atualUtilizadorId
          ? {
              ...p,
              isMuted: seguinteMicMuted,
              isDeafened: seguinteDeafened,
            }
          : p,
      ),
    );
    socket?.emit('voice-state-update', {
      roomId: effectiveSalaId,
      idUtilizador: atualUtilizadorId,
      isMuted: seguinteMicMuted,
      isDeafened: seguinteDeafened,
    });
    atualizarChamadaAudioEstado({
      isMuted: seguinteMicMuted,
      isDeafened: seguinteDeafened,
    });
  }, [effectiveSalaId, isMicMuted, socket, atualizarChamadaAudioEstado]);

  // Sync initial audio state to ContextoChamadaAtiva
  useEffect(() => {
    atualizarChamadaAudioEstado({
      isMuted: isMicMuted,
      isDeafened,
    });
  }, [atualizarChamadaAudioEstado]);

  // Escuta as alterações de áudio e saída feitas nos controlos globais.
  useEffect(() => {
    const tratarRemotoAlternarMic = () => {
      alternarMic();
    };

    const tratarRemotoAlternarSilenciarAudio = () => {
      alternarSilenciarAudio();
    };

    const tratarRemotoSair = () => {
      onDisconnect?.();
    };

    window.addEventListener('nexo_call_toggle_mic', tratarRemotoAlternarMic);
    window.addEventListener('nexo_call_toggle_deafen', tratarRemotoAlternarSilenciarAudio);
    window.addEventListener('nexo_call_leave', tratarRemotoSair);

    return () => {
      window.removeEventListener('nexo_call_toggle_mic', tratarRemotoAlternarMic);
      window.removeEventListener('nexo_call_toggle_deafen', tratarRemotoAlternarSilenciarAudio);
      window.removeEventListener('nexo_call_leave', tratarRemotoSair);
    };
  }, [alternarMic, alternarSilenciarAudio, onDisconnect]);

  // Controls: Toggle Camera
  const alternarCamara = async () => {
    const atualUtilizadorId = utilizadorRef.current?.id;
    if (isCamaraOn) {
      if (localCamaraStreamRef.current) {
        localCamaraStreamRef.current.getTracks().forEach((t) => t.stop());
        localCamaraStreamRef.current = null;
      }

      definirLocalCamaraStream(null);
      definirIsCamaraOn(false);
      for (const [destinoSocketId, pc] of participanteConnectionsRef.current.entries()) {
        const remetente = camaraSendersRef.current.get(destinoSocketId);
        if (remetente) {
          try {
            pc.removeTrack(remetente);
          } catch {}

          camaraSendersRef.current.delete(destinoSocketId);
        }

        enviarOfferToParticipante(destinoSocketId);
      }

      definirParticipants((anterior) =>
        anterior.map((p) =>
          p.id === atualUtilizadorId
            ? {
                ...p,
                isCameraOn: false,
              }
            : p,
        ),
      );
      socket?.emit('voice-state-update', {
        roomId: effectiveSalaId,
        idUtilizador: atualUtilizadorId,
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

        localCamaraStreamRef.current = stream;
        definirLocalCamaraStream(stream);
        definirIsCamaraOn(true);

        const camRegistar = stream.getVideoTracks()[0];
        for (const [destinoSocketId, pc] of participanteConnectionsRef.current.entries()) {
          try {
            const remetente = pc.addTrack(camRegistar, stream);

            camaraSendersRef.current.set(destinoSocketId, remetente);
            enviarOfferToParticipante(destinoSocketId);
          } catch {}
        }

        definirParticipants((anterior) =>
          anterior.map((p) =>
            p.id === atualUtilizadorId
              ? {
                  ...p,
                  isCameraOn: true,
                }
              : p,
          ),
        );
        socket?.emit('voice-state-update', {
          roomId: effectiveSalaId,
          idUtilizador: atualUtilizadorId,
          isCameraOn: true,
          cameraTrackId: camRegistar.id,
          cameraStreamId: stream.id,
        });
      } catch {
        aviso({
          title: 'Aviso',
          message: 'Não foi possível aceder à câmara.',
          type: 'error',
        });
      }
    }
  };

  // Helper to cleanly stop local screen sharing
  const pararLocalEcraPartilhar = useCallback(() => {
    const atualUtilizadorId = utilizadorRef.current?.id;
    if (localEcraStreamRef.current) {
      localEcraStreamRef.current.getTracks().forEach((t) => t.stop());
      localEcraStreamRef.current = null;
    }

    definirLocalEcraStream(null);
    definirIsEcraSharing(false);
    for (const [destinoSocketId, pc] of participanteConnectionsRef.current.entries()) {
      const remetente = ecraSendersRef.current.get(destinoSocketId);
      if (remetente) {
        try {
          pc.removeTrack(remetente);
        } catch {}

        ecraSendersRef.current.delete(destinoSocketId);
      }

      const audioRemetente = ecraAudioSendersRef.current.get(destinoSocketId);
      if (audioRemetente) {
        try {
          pc.removeTrack(audioRemetente);
        } catch {}

        ecraAudioSendersRef.current.delete(destinoSocketId);
      }

      enviarOfferToParticipante(destinoSocketId);
    }

    definirParticipants((anterior) =>
      anterior.map((p) =>
        p.id === atualUtilizadorId
          ? {
              ...p,
              isScreenSharing: false,
            }
          : p,
      ),
    );
    socket?.emit('voice-state-update', {
      roomId: effectiveSalaId,
      idUtilizador: atualUtilizadorId,
      isScreenSharing: false,
    });
    definirSelecionadoEcraUtilizadorId((atual) => (atual === atualUtilizadorId ? null : atual));
  }, [effectiveSalaId, enviarOfferToParticipante, socket]);

  // Controls: Toggle Screen Share
  const alternarEcraPartilhar = async () => {
    const atualUtilizadorId = utilizadorRef.current?.id;
    if (isEcraSharing) {
      pararLocalEcraPartilhar();
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'monitor',
          },
          audio: true,
        });

        localEcraStreamRef.current = stream;
        definirLocalEcraStream(stream);
        definirIsEcraSharing(true);
        definirSelecionadoEcraUtilizadorId(atualUtilizadorId);

        const ecraRegistar = stream.getVideoTracks()[0];
        const ecraAudioRegistar = stream.getAudioTracks()[0];

        // Responde ao botão do navegador que termina a partilha.
        ecraRegistar.onended = () => {
          pararLocalEcraPartilhar();
        };

        for (const [destinoSocketId, pc] of participanteConnectionsRef.current.entries()) {
          try {
            const remetente = pc.addTrack(ecraRegistar, stream);

            ecraSendersRef.current.set(destinoSocketId, remetente);
            if (ecraAudioRegistar) {
              const audioRemetente = pc.addTrack(ecraAudioRegistar, stream);

              ecraAudioSendersRef.current.set(destinoSocketId, audioRemetente);
            }

            enviarOfferToParticipante(destinoSocketId);
          } catch {}
        }

        definirParticipants((anterior) =>
          anterior.map((p) =>
            p.id === atualUtilizadorId
              ? {
                  ...p,
                  isScreenSharing: true,
                }
              : p,
          ),
        );
        socket?.emit('voice-state-update', {
          roomId: effectiveSalaId,
          idUtilizador: atualUtilizadorId,
          isScreenSharing: true,
          screenTrackId: ecraRegistar.id,
          screenStreamId: stream.id,
        });
        aviso({
          title: 'Partilha Iniciada',
          message: 'O seu ecrã está a ser transmitido para a sala.',
          type: 'success',
        });
      } catch (erro) {
        if (erro.name !== 'NotAllowedError') {
          aviso({
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
      conversaMensagensTerminarRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
    }
  }, [conversaMensagens, sideDrawer]);

  const tratarEnviarConversaMensagem = (evento) => {
    evento.preventDefault();
    if (!conversaEntrada.trim()) return;
    const novoMsg = {
      id: `call-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender: utilizadorRef.current?.name || 'Eu',
      content: conversaEntrada.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    definirConversaMensagens((anterior) =>
      anterior.some((m) => m.id === novoMsg.id) ? anterior : [...anterior, novoMsg],
    );
    socket?.emit('voice-chat-message', {
      roomId: effectiveSalaId,
      message: novoMsg,
    });
    definirConversaEntrada('');
  };

  const alternarEcraInteiro = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      definirIsEcraInteiro(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      definirIsEcraInteiro(false);
    }
  };

  // Compile active screen shares
  const ativoEcraShares = [];
  if (isEcraSharing && localEcraStream) {
    ativoEcraShares.push({
      idUtilizador: utilizadorRef.current?.id,
      userName: `${utilizadorRef.current?.name} (Você)`,
      isSelf: true,
      stream: localEcraStream,
    });
  }

  participants.forEach((p) => {
    if (p.id !== utilizadorRef.current?.id && p.isScreenSharing) {
      const stream = remotoEcraStreams[p.id];
      if (stream) {
        ativoEcraShares.push({
          idUtilizador: p.id,
          userName: p.name,
          isSelf: false,
          stream,
        });
      }
    }
  });

  // Reconcile selected screen share
  useEffect(() => {
    if (ativoEcraShares.length > 0) {
      if (!selecionadoEcraUtilizadorId) {
        definirSelecionadoEcraUtilizadorId(ativoEcraShares[0].idUtilizador);
      } else if (selecionadoEcraUtilizadorId !== 'none') {
        const stillAtivo = ativoEcraShares.some(
          (s) => s.idUtilizador === selecionadoEcraUtilizadorId,
        );
        if (!stillAtivo) {
          definirSelecionadoEcraUtilizadorId(ativoEcraShares[0].idUtilizador);
        }
      }
    } else if (selecionadoEcraUtilizadorId && selecionadoEcraUtilizadorId !== 'none') {
      definirSelecionadoEcraUtilizadorId(null);
    }
  }, [ativoEcraShares.length, selecionadoEcraUtilizadorId]);

  const atualEcraPartilhar = ativoEcraShares.find(
    (s) => s.idUtilizador === selecionadoEcraUtilizadorId,
  );
  const spotlightStream = atualEcraPartilhar?.stream || null;
  const isViewingEcra = spotlightStream && selecionadoEcraUtilizadorId !== 'none';
  const palcoConteudo = (
    <div
      ref={containerRef}
      data-call-stage="true"
      className={isMobile || isJanela ? 'call-stage-panel' : 'call-stage-panel-2'}
    >
      {/* Audio Autoplay Unblock Banner */}
      {autoplayBlocked && (
        <div className="call-stage-panel-3">
          <Volume2 className="call-stage-volume2" />
          <span>O áudio foi pausado pelo navegador.</span>
          <button
            onClick={tratarDesbloquearAudio}
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
            <h2 className="call-stage-heading">{salaNome}</h2>
          </div>
          {salaType === 'stage' && (
            <span className="call-stage-label-2">
              <Radio className="call-stage-radio" />
              Palco Principal
            </span>
          )}
        </div>

        <div className="call-stage-panel-6">
          <div className="call-stage-panel-7">{formatarTempo(chamadaDuracao)}</div>

          <div className="call-stage-panel-8">
            <Users className="call-stage-users" />
            <span>{participants.length}</span>
          </div>

          <button
            onClick={alternarEcraInteiro}
            className="call-stage-button-2"
            title="Ecrã inteiro"
            aria-label="Alternar ecrã inteiro"
          >
            {isEcraInteiro ? (
              <Minimize2 className="call-stage-volume2" />
            ) : (
              <Maximize2 className="call-stage-volume2" />
            )}
          </button>

          {/* Saída rápida no cabeçalho em ecrãs pequenos. */}
          <button
            type="button"
            onClick={() => {
              soundEffects.reproduzirSairChamada();
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
      {ativoEcraShares.length > 0 && (
        <div className="call-stage-panel-9">
          <div className="call-stage-panel-5">
            <span className="call-stage-label-3">
              <Monitor className="call-stage-monitor" />
              <span>Transmissões:</span>
            </span>

            {ativoEcraShares.map((partilhar) => (
              <button
                key={partilhar.idUtilizador}
                onClick={() => definirSelecionadoEcraUtilizadorId(partilhar.idUtilizador)}
                className={`call-stage-button-4 ${selecionadoEcraUtilizadorId === partilhar.idUtilizador ? 'call-stage-button-5' : 'call-stage-button-6'}`}
              >
                <Monitor className="call-stage-phone-off" />
                <span>{partilhar.userName}</span>
                {selecionadoEcraUtilizadorId === partilhar.idUtilizador && (
                  <Check className="call-stage-check" />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              definirSelecionadoEcraUtilizadorId((anterior) =>
                anterior === 'none' ? ativoEcraShares[0]?.idUtilizador || null : 'none',
              )
            }
            className={`call-stage-button-7 ${selecionadoEcraUtilizadorId === 'none' ? 'call-stage-button-8' : 'call-stage-button-9'}`}
          >
            <LayoutGrid className="call-stage-phone-off" />
            <span>{selecionadoEcraUtilizadorId === 'none' ? 'Ver Ecrã' : 'Ver Grelha'}</span>
          </button>
        </div>
      )}

      {/* Stage Body */}
      <main className="call-stage-main">
        <div className="call-stage-panel-10 custom-scrollbar">
          {/* Vista de destaque da partilha de ecrã. */}
          {isViewingEcra ? (
            <div className="call-stage-panel-11">
              <div className="call-stage-panel-12">
                <VideoLeitor
                  stream={spotlightStream}
                  isContain={true}
                />
                <div className="call-stage-panel-13">
                  <Monitor className="call-stage-monitor-2" />
                  <span>
                    {atualEcraPartilhar?.isSelf
                      ? 'O seu ecrã partilhado'
                      : `Ecrã de ${atualEcraPartilhar?.userName}`}
                  </span>
                </div>

                <div className="call-stage-panel-14">
                  <button
                    onClick={() => definirIsEcraMaximized((anterior) => !anterior)}
                    className="call-stage-button-10"
                    title={isEcraMaximized ? 'Restaurar visualização' : 'Ecrã inteiro'}
                  >
                    {isEcraMaximized ? (
                      <Minimize2 className="call-stage-phone-off" />
                    ) : (
                      <Maximize2 className="call-stage-phone-off" />
                    )}
                    <span>{isEcraMaximized ? 'Restaurar' : 'Ecrã Inteiro'}</span>
                  </button>
                  <button
                    onClick={() => definirSelecionadoEcraUtilizadorId('none')}
                    className="call-stage-button-10"
                  >
                    <LayoutGrid className="call-stage-phone-off" />
                    <span>Grelha</span>
                  </button>
                </div>
              </div>

              {/* Participants Strip Below Screen Share */}
              {!isEcraMaximized && (
                <div className="call-stage-panel-15">
                  {participants.map((p) => {
                    const isSelf = p.isSelf || p.socketId === socket?.id;
                    const camStream = isSelf ? localCamaraStream : remotoCamaraStreams[p.id];
                    const temCamara = !!camStream && (isSelf ? isCamaraOn : p.isCameraOn);

                    return temCamara ? (
                      <div
                        key={p.socketId || p.id}
                        className="call-stage-panel-16"
                      >
                        <VideoLeitor
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
                          src={p.urlAvatar}
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
                const camStream = isSelf ? localCamaraStream : remotoCamaraStreams[p.id];
                const temCamara = !!camStream && (isSelf ? isCamaraOn : p.isCameraOn);

                return (
                  <div
                    key={p.socketId || p.id}
                    className={`call-stage-panel-27 ${p.isSpeaking ? 'call-stage-panel-28' : 'call-stage-panel-29'}`}
                  >
                    {temCamara ? (
                      <VideoLeitor
                        stream={camStream}
                        isMirrored={isSelf}
                      />
                    ) : (
                      <div className="call-stage-panel-30">
                        <div className="call-stage-panel-31">
                          <Avatar
                            src={p.urlAvatar}
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

                    {/* Permite abrir o ecrã partilhado pelo participante. */}
                    {p.isScreenSharing && (
                      <button
                        onClick={() => definirSelecionadoEcraUtilizadorId(p.id)}
                        className="call-stage-button-11"
                        title="Ver ecrã partilhado"
                      >
                        <Monitor className="call-stage-phone-off" />
                        <span>Ver Ecrã</span>
                      </button>
                    )}

                    {/* Participant Name & Status Distintivo */}
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

        {/* Side Drawer: Conversa or Participants */}
        {sideDrawer !== 'none' && (
          <aside className="call-stage-sidebar">
            <div className="call-stage-panel-39">
              <div className="call-stage-panel-40">
                <button
                  type="button"
                  onClick={() => definirSideDrawer('none')}
                  className="call-stage-button-12"
                  aria-label="Voltar para a chamada"
                  title="Voltar para a chamada"
                >
                  <X className="call-stage-x" />
                  <span className="call-stage-label-12">Voltar</span>
                </button>
                <h3 className="call-stage-subheading">
                  {sideDrawer === 'chat'
                    ? 'Conversa da Chamada'
                    : `Participantes (${participants.length})`}
                </h3>
              </div>

              <div className="call-stage-panel-41">
                {/* Quick Mic in Drawer Header */}
                <button
                  type="button"
                  onClick={alternarMic}
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
                  onClick={alternarSilenciarAudio}
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
                  onClick={alternarCamara}
                  className={`call-stage-button-13 ${isCamaraOn ? 'call-stage-button-16' : 'call-stage-button-15'}`}
                  title={isCamaraOn ? 'Desligar Câmara' : 'Ligar Câmara'}
                  aria-label={isCamaraOn ? 'Desligar Câmara' : 'Ligar Câmara'}
                >
                  {isCamaraOn ? (
                    <Video className="call-stage-mic-off-2" />
                  ) : (
                    <VideoOff className="call-stage-video-off" />
                  )}
                </button>

                {/* Quick Leave in Drawer Header */}
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.reproduzirSairChamada();
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
                  {conversaMensagens.map((msg) => (
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
                  <div ref={conversaMensagensTerminarRef} />
                </div>
                <form
                  onSubmit={tratarEnviarConversaMensagem}
                  className="call-stage-form"
                >
                  <input
                    type="text"
                    value={conversaEntrada}
                    onChange={(evento) => definirConversaEntrada(evento.target.value)}
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
                        src={p.urlAvatar}
                        name={p.name}
                        size="sm"
                      />
                      <div>
                        <p className="call-stage-description-4">{p.name}</p>
                        <p className="call-stage-description-5">{formatarCargo(p.role)}</p>
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

      {/* Control Bar Rodape */}
      <footer className="call-stage-footer">
        <div className="call-stage-panel-51">
          {/* Mic */}
          <button
            type="button"
            onClick={alternarMic}
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
            onClick={alternarSilenciarAudio}
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
            onClick={alternarCamara}
            className={`call-stage-button-19 ${isCamaraOn ? 'call-stage-button-22' : 'call-stage-button-21'}`}
            title={isCamaraOn ? 'Desligar Câmara' : 'Ligar Câmara'}
            aria-label={isCamaraOn ? 'Desligar Câmara' : 'Ligar Câmara'}
          >
            {isCamaraOn ? (
              <Video className="call-stage-mic-off-3" />
            ) : (
              <VideoOff className="call-stage-video-off-2" />
            )}
          </button>

          {/* Screen Share */}
          {(isEcraSharing || typeof navigator.mediaDevices?.getDisplayMedia === 'function') && (
            <button
              type="button"
              onClick={alternarEcraPartilhar}
              className={`call-stage-button-23 ${isEcraSharing ? 'call-stage-button-24' : 'call-stage-button-21'}`}
              title={isEcraSharing ? 'Parar Partilha de Ecrã' : 'Partilhar Ecrã'}
              aria-label={isEcraSharing ? 'Parar Partilha de Ecrã' : 'Partilhar Ecrã'}
            >
              {isEcraSharing ? (
                <MonitorOff className="call-stage-mic-off-3" />
              ) : (
                <Monitor className="call-stage-video-off-2" />
              )}
            </button>
          )}

          <div className="call-stage-panel-52" />

          {/* Conversa Drawer Toggle */}
          <button
            type="button"
            onClick={() => definirSideDrawer((anterior) => (anterior === 'chat' ? 'none' : 'chat'))}
            className={`call-stage-button-25 ${sideDrawer === 'chat' ? 'call-stage-button-26' : 'call-stage-button-27'}`}
            title="Conversa da chamada"
            aria-label="Abrir chat da chamada"
          >
            <MessageSquare className="call-stage-x" />
            {conversaMensagens.length > 1 && <span className="call-stage-label-16" />}
          </button>

          {/* Participants Drawer Toggle */}
          <button
            type="button"
            onClick={() =>
              definirSideDrawer((anterior) =>
                anterior === 'participants' ? 'none' : 'participants',
              )
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
              soundEffects.reproduzirSairChamada();
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
  if (isMobile && !isJanela) {
    return createPortal(palcoConteudo, document.body);
  }

  return palcoConteudo;
};

export default ChamadaPalco;
