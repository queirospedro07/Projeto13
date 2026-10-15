import './JoinCallModal.css';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Radio,
  HelpCircle,
  Volume2,
  ArrowRight,
  ShieldCheck,
  Check,
  PhoneOff,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useActiveCall } from '../../context/ActiveCallContext';

export const JoinCallModal = ({
  isOpen,
  onClose,
  onConfirm,
  roomName,
  contextTitle,
  roomType = 'voice',
}) => {
  const { user } = useAuth();
  const { activeCall, isMicMuted, isDeafened } = useActiveCall();
  const [isMicOn, setIsMicOn] = useState(() => !isMicMuted && !isDeafened);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mounted, setMounted] = useState(false);

  const videoPreviewRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parar faixas de mídia com segurança
  const stopTracks = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsSpeaking(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      stopTracks();
      setIsCameraOn(false);
      setPermissionError(null);
    } else {
      setIsMicOn(!isMicMuted && !isDeafened);
    }
  }, [isOpen, isMicMuted, isDeafened]);

  // Gestão simples de câmara e microfone na pré-visualização
  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    async function setupPreview() {
      if (!isCameraOn && !isMicOn) {
        stopTracks();
        return;
      }

      try {
        setPermissionError(null);
        const constraints = {
          video: isCameraOn ? { width: { ideal: 640 }, height: { ideal: 360 } } : false,
          audio: isMicOn ? true : false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (mediaStream) {
          mediaStream.getTracks().forEach((t) => t.stop());
        }

        setMediaStream(stream);

        if (isCameraOn && videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }

        // Deteção simples de voz para o indicador discreto
        if (isMicOn && stream.getAudioTracks().length > 0) {
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            analyserRef.current = analyser;

            const buffer = new Uint8Array(analyser.frequencyBinCount);
            const checkVoice = () => {
              if (!active) return;
              analyser.getByteFrequencyData(buffer);
              let sum = 0;
              for (let i = 0; i < buffer.length; i++) sum += buffer[i];
              const avg = sum / buffer.length;
              setIsSpeaking(avg > 18);
              animationFrameRef.current = requestAnimationFrame(checkVoice);
            };
            checkVoice();
          } catch (e) {
            console.warn('Medição de áudio indisponível:', e);
          }
        } else {
          setIsSpeaking(false);
        }
      } catch (err) {
        console.warn('Erro ao aceder a dispositivos:', err);
        setPermissionError('Permissão para câmara ou microfone não concedida no navegador.');
        if (isCameraOn) setIsCameraOn(false);
        if (isMicOn) setIsMicOn(false);
      }
    }

    setupPreview();

    return () => {
      active = false;
      stopTracks();
    };
  }, [isCameraOn, isMicOn, isOpen]);

  if (!isOpen || !mounted || !roomName) return null;

  const normalized = roomName.toLowerCase();
  const isStage =
    roomType === 'stage' || normalized.includes('palco') || normalized.includes('masterclass');
  const isQA =
    roomType === 'qa' ||
    normalized.includes('dúvida') ||
    normalized.includes('duvidas') ||
    normalized.includes('mentoria');

  const typeConfig = isStage
    ? { label: 'Palco / Masterclass', icon: Radio }
    : isQA
      ? { label: 'Mentoria & Dúvidas', icon: HelpCircle }
      : { label: 'Sala de Voz', icon: Volume2 };

  const TypeIcon = typeConfig.icon;

  const handleConfirm = () => {
    stopTracks();
    onConfirm({
      startMuted: !isMicOn,
      startVideoOff: !isCameraOn,
    });
    onClose();
  };

  const handleClose = () => {
    stopTracks();
    onClose();
  };

  const modalContent = (
    <div className="join-call-modal-panel dialog-layer">
      {/* Backdrop */}
      <div className="join-call-modal-panel-2" onClick={handleClose} aria-hidden="true" />

      {/* Centering container */}
      <div className="join-call-modal-panel-3">
        <div className="join-call-modal-panel-4" onClick={(e) => e.stopPropagation()}>
          {/* Cabeçalho */}
          <div className="join-call-modal-panel-5">
            <div>
              <span className="join-call-modal-label">{contextTitle || 'Chamada da Turma'}</span>
              <h2 className="join-call-modal-heading">
                <span>{roomName}</span>
              </h2>
            </div>

            <button
              onClick={handleClose}
              className="join-call-modal-button"
              title="Fechar"
              aria-label="Fechar"
            >
              <X className="join-call-modal-x" />
            </button>
          </div>

          {/* Corpo */}
          <div className="join-call-modal-panel-6 custom-scrollbar">
            {/* Caixa de Pré-visualização de Vídeo / Áudio */}
            <div className="join-call-modal-panel-7">
              {isCameraOn ? (
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className="join-call-modal-video"
                />
              ) : (
                <div className="join-call-modal-panel-8">
                  <div className="join-call-modal-panel-9">
                    <Avatar
                      src={user?.avatarUrl}
                      name={user?.name || 'Aluno'}
                      size="lg"
                      className={`join-call-modal-avatar ${
                        isSpeaking ? 'join-call-modal-avatar-2' : 'join-call-modal-avatar-3'
                      }`}
                    />
                    {isSpeaking && <span className="join-call-modal-label-2" />}
                  </div>
                  <p className="join-call-modal-description">{user?.name || 'Você'}</p>
                  <span className="join-call-modal-label-3">Câmara desligada</span>
                </div>
              )}

              {/* Selo Tipo de Sessão */}
              <div className="join-call-modal-panel-10">
                <TypeIcon className="join-call-modal-type-icon" />
                <span>{typeConfig.label}</span>
              </div>
            </div>

            {/* Controlos Rápidos de Pré-Entrada */}
            <div className="join-call-modal-panel-11">
              <button
                type="button"
                onClick={() => setIsMicOn((prev) => !prev)}
                className={`join-call-modal-button-2 ${
                  isMicOn ? 'join-call-modal-button-3' : 'join-call-modal-button-4'
                }`}
              >
                {isMicOn ? (
                  <Mic className="join-call-modal-x" />
                ) : (
                  <MicOff className="join-call-modal-mic-off" />
                )}
                <span>{isMicOn ? 'Microfone Ligado' : 'Microfone Mutado'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCameraOn((prev) => !prev)}
                className={`join-call-modal-button-2 ${
                  isCameraOn ? 'join-call-modal-button-5' : 'join-call-modal-button-4'
                }`}
              >
                {isCameraOn ? (
                  <Video className="join-call-modal-x" />
                ) : (
                  <VideoOff className="join-call-modal-mic-off" />
                )}
                <span>{isCameraOn ? 'Câmara Ligada' : 'Câmara Desligada'}</span>
              </button>
            </div>

            {/* Mensagem de Erro de Permissão */}
            {permissionError && <div className="join-call-modal-panel-12">{permissionError}</div>}

            {/* Alerta de transferência se já estiver noutra chamada */}
            {activeCall && (
              <div className="join-call-modal-panel-13">
                <PhoneOff className="join-call-modal-phone-off" />
                <div className="join-call-modal-panel-14">
                  <span className="join-call-modal-label-4">
                    Já se encontra ligado a: {activeCall.contextTitle} • {activeCall.roomName}
                  </span>
                  <span className="join-call-modal-label-5">
                    Ao confirmar a entrada nesta sala, será transferido automaticamente da chamada
                    anterior.
                  </span>
                </div>
              </div>
            )}

            {/* Resumo simples dos dispositivos e segurança */}
            <div className="join-call-modal-panel-15">
              <div className="join-call-modal-panel-16">
                <span
                  className={`join-call-modal-label-6 ${isMicOn ? 'join-call-modal-label-7' : 'join-call-modal-label-8'}`}
                />
                <span>{isMicOn ? 'Microfone ativado' : 'Entra com microfone mutado'}</span>
              </div>
              <div className="join-call-modal-panel-17">
                <ShieldCheck className="join-call-modal-shield-check" />
                <span>Ligação Segura</span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="join-call-modal-panel-18">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleClose}
                className="join-call-modal-button-6"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleConfirm}
                className="join-call-modal-button-7"
              >
                <span>Entrar na Sala</span>
                <ArrowRight className="join-call-modal-arrow-right" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default JoinCallModal;
