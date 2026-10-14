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
  PhoneOff
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
  roomType = 'voice'
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
      mediaStream.getTracks().forEach(t => t.stop());
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
          audio: isMicOn ? true : false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        if (mediaStream) {
          mediaStream.getTracks().forEach(t => t.stop());
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
  const isStage = roomType === 'stage' || normalized.includes('palco') || normalized.includes('masterclass');
  const isQA = roomType === 'qa' || normalized.includes('dúvida') || normalized.includes('duvidas') || normalized.includes('mentoria');

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
      startVideoOff: !isCameraOn
    });
    onClose();
  };

  const handleClose = () => {
    stopTracks();
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ isolation: 'isolate' }}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 dark:bg-black/90 transition-opacity" 
        onClick={handleClose} 
        aria-hidden="true"
      />

      {/* Centering container */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
        <div 
          className="relative w-full max-w-lg bg-white dark:bg-[#0d0f14] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-10 animate-fade-in my-6 text-slate-900 dark:text-white text-left max-h-[88vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {contextTitle || 'Chamada da Turma'}
              </span>
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white tracking-tight flex items-center gap-2 mt-0.5">
                <span>{roomName}</span>
              </h2>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
              title="Fechar"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Corpo */}
          <div className="p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar flex-1">
            {/* Caixa de Pré-visualização de Vídeo / Áudio */}
            <div className="relative aspect-video w-full rounded-xl bg-slate-950 border border-slate-200 dark:border-neutral-800 overflow-hidden flex items-center justify-center shadow-inner shrink-0">
              {isCameraOn ? (
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <div className="relative">
                    <Avatar 
                      src={user?.avatarUrl} 
                      name={user?.name || 'Aluno'} 
                      size="lg" 
                      className={`ring-2 transition-all ${
                        isSpeaking ? 'ring-emerald-400 shadow-lg' : 'ring-neutral-700'
                      }`}
                    />
                    {isSpeaking && (
                      <span className="absolute -inset-1 rounded-full border border-emerald-400 animate-ping pointer-events-none" />
                    )}
                  </div>
                  <p className="font-bold text-xs text-neutral-300 mt-2">
                    {user?.name || 'Você'}
                  </p>
                  <span className="text-[11px] text-neutral-500">
                    Câmara desligada
                  </span>
                </div>
              )}

              {/* Selo Tipo de Sessão */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-semibold text-white pointer-events-none">
                <TypeIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>{typeConfig.label}</span>
              </div>
            </div>

            {/* Controlos Rápidos de Pré-Entrada */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsMicOn(prev => !prev)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                  isMicOn
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-xs'
                    : 'bg-slate-100 dark:bg-[#181b24] hover:bg-slate-200 dark:hover:bg-[#202430] text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-neutral-800'
                }`}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-rose-500" />}
                <span>{isMicOn ? 'Microfone Ligado' : 'Microfone Mutado'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCameraOn(prev => !prev)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                  isCameraOn
                    ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-xs'
                    : 'bg-slate-100 dark:bg-[#181b24] hover:bg-slate-200 dark:hover:bg-[#202430] text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-neutral-800'
                }`}
              >
                {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-rose-500" />}
                <span>{isCameraOn ? 'Câmara Ligada' : 'Câmara Desligada'}</span>
              </button>
            </div>

            {/* Mensagem de Erro de Permissão */}
            {permissionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {permissionError}
              </div>
            )}

            {/* Alerta de transferência se já estiver noutra chamada */}
            {activeCall && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400">
                <PhoneOff className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold">Já se encontra ligado a: {activeCall.contextTitle} • {activeCall.roomName}</span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-300 mt-0.5">
                    Ao confirmar a entrada nesta sala, será transferido automaticamente da chamada anterior.
                  </span>
                </div>
              </div>
            )}

            {/* Resumo simples dos dispositivos e segurança */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0c0d12] border border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isMicOn ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>{isMicOn ? 'Microfone ativado' : 'Entra com microfone mutado'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Ligação Segura</span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleClose}
                className="flex-1 font-bold justify-center"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleConfirm}
                className="flex-1 font-bold justify-center shadow-xs"
              >
                <span>Entrar na Sala</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
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
