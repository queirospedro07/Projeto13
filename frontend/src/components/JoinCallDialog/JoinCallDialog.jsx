import './JoinCallDialog.css';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  LuX as X,
  LuVideo as Video,
  LuMic as Mic,
  LuMicOff as MicOff,
  LuVideoOff as VideoOff,
  LuRadio as Radio,
  LuCircleHelp as HelpCircle,
  LuVolume2 as Volume2,
  LuArrowRight as ArrowRight,
  LuShieldCheck as ShieldCheck,
  LuPhoneOff as PhoneOff,
} from 'react-icons/lu';
import { Botao } from '../Button';
import { Avatar } from '../Avatar';
import { useAutenticacao } from '../../contexts/AuthContext';
import { useChamadaAtiva } from '../../contexts/ActiveCallContext';

export const AderirChamadaJanela = ({
  isOpen: isAbrir,
  onClose: onFechar,
  onConfirm: onConfirmar,
  roomName: salaNome,
  contextTitle: contextoTitulo,
  roomType: salaType = 'voice',
}) => {
  const { user: utilizador } = useAutenticacao();
  const { activeCall: ativoChamada, isMicMuted, isDeafened } = useChamadaAtiva();
  const [isMicOn, definirIsMicOn] = useState(() => !isMicMuted && !isDeafened);
  const [isCamaraOn, definirIsCamaraOn] = useState(false);
  const [multimidiaStream, definirMultimidiaStream] = useState(null);
  const [permissionErro, definirPermissionErro] = useState(null);
  const [isSpeaking, definirIsSpeaking] = useState(false);
  const [mounted, definirMounted] = useState(false);
  const videoPrevisualizarRef = useRef(null);
  const audioContextoRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    definirMounted(true);
  }, []);

  // Parar faixas de mídia com segurança
  const pararFaixas = () => {
    if (multimidiaStream) {
      multimidiaStream.getTracks().forEach((t) => t.stop());
      definirMultimidiaStream(null);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextoRef.current && audioContextoRef.current.state !== 'closed') {
      audioContextoRef.current.close().catch(() => {});
      audioContextoRef.current = null;
    }

    definirIsSpeaking(false);
  };

  useEffect(() => {
    const tratarChaveDown = (evento) => {
      if (evento.key === 'Escape') tratarFechar();
    };

    if (isAbrir) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', tratarChaveDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', tratarChaveDown);
    };
  }, [isAbrir]);
  useEffect(() => {
    if (!isAbrir) {
      pararFaixas();
      definirIsCamaraOn(false);
      definirPermissionErro(null);
    } else {
      definirIsMicOn(!isMicMuted && !isDeafened);
    }
  }, [isAbrir, isMicMuted, isDeafened]);

  // Gestão simples de câmara e microfone na pré-visualização
  useEffect(() => {
    if (!isAbrir) return;
    let ativo = true;

    async function configurarPrevisualizar() {
      if (!isCamaraOn && !isMicOn) {
        pararFaixas();

        return;
      }

      try {
        definirPermissionErro(null);

        const constraints = {
          video: isCamaraOn
            ? {
                width: {
                  ideal: 640,
                },
                height: {
                  ideal: 360,
                },
              }
            : false,
          audio: isMicOn ? true : false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!ativo) {
          stream.getTracks().forEach((t) => t.stop());

          return;
        }

        if (multimidiaStream) {
          multimidiaStream.getTracks().forEach((t) => t.stop());
        }

        definirMultimidiaStream(stream);
        if (isCamaraOn && videoPrevisualizarRef.current) {
          videoPrevisualizarRef.current.srcObject = stream;
        }

        // Deteção simples de voz para o indicador discreto
        if (isMicOn && stream.getAudioTracks().length > 0) {
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();

            audioContextoRef.current = ctx;

            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();

            analyser.fftSize = 64;
            source.connect(analyser);
            analyserRef.current = analyser;

            const buffer = new Uint8Array(analyser.frequencyBinCount);
            const verificarVoz = () => {
              if (!ativo) return;
              analyser.getByteFrequencyData(buffer);

              let somar = 0;
              for (let i = 0; i < buffer.length; i++) somar += buffer[i];
              const avg = somar / buffer.length;

              definirIsSpeaking(avg > 18);
              animationFrameRef.current = requestAnimationFrame(verificarVoz);
            };

            verificarVoz();
          } catch (evento) {
            console.warn('Medição de áudio indisponível:', evento);
          }
        } else {
          definirIsSpeaking(false);
        }
      } catch (erro) {
        console.warn('Erro ao aceder a dispositivos:', erro);
        definirPermissionErro('Permissão para câmara ou microfone não concedida no navegador.');
        if (isCamaraOn) definirIsCamaraOn(false);
        if (isMicOn) definirIsMicOn(false);
      }
    }

    configurarPrevisualizar();

    return () => {
      ativo = false;
      pararFaixas();
    };
  }, [isCamaraOn, isMicOn, isAbrir]);
  if (!isAbrir || !mounted || !salaNome) return null;
  const normalized = salaNome.toLowerCase();
  const isPalco =
    salaType === 'stage' || normalized.includes('palco') || normalized.includes('masterclass');
  const isQA =
    salaType === 'qa' ||
    normalized.includes('dúvida') ||
    normalized.includes('duvidas') ||
    normalized.includes('mentoria');
  const typeConfig = isPalco
    ? {
        label: 'Palco / Masterclass',
        icon: Radio,
      }
    : isQA
      ? {
          label: 'Mentoria & Dúvidas',
          icon: HelpCircle,
        }
      : {
          label: 'Sala de Voz',
          icon: Volume2,
        };
  const TypeIcon = typeConfig.icon;
  const tratarConfirmar = () => {
    pararFaixas();
    onConfirmar({
      startMuted: !isMicOn,
      startVideoOff: !isCamaraOn,
    });
    onFechar();
  };

  const tratarFechar = () => {
    pararFaixas();
    onFechar();
  };

  const janelaConteudo = (
    <div className="join-call-modal-panel dialog-layer">
      {/* Backdrop */}
      <div
        className="join-call-modal-panel-2"
        onClick={tratarFechar}
        aria-hidden="true"
      />

      {/* Centering container */}
      <div className="join-call-modal-panel-3">
        <div
          className="join-call-modal-panel-4"
          onClick={(evento) => evento.stopPropagation()}
        >
          {/* Cabeçalho */}
          <div className="join-call-modal-panel-5">
            <div>
              <span className="join-call-modal-label">{contextoTitulo || 'Chamada da Turma'}</span>
              <h2 className="join-call-modal-heading">
                <span>{salaNome}</span>
              </h2>
            </div>

            <button
              onClick={tratarFechar}
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
              {isCamaraOn ? (
                <video
                  ref={videoPrevisualizarRef}
                  autoPlay
                  playsInline
                  muted
                  className="join-call-modal-video"
                />
              ) : (
                <div className="join-call-modal-panel-8">
                  <div className="join-call-modal-panel-9">
                    <Avatar
                      src={utilizador?.urlAvatar}
                      name={utilizador?.name || 'Aluno'}
                      size="lg"
                      className={`join-call-modal-avatar ${isSpeaking ? 'join-call-modal-avatar-2' : 'join-call-modal-avatar-3'}`}
                    />
                    {isSpeaking && <span className="join-call-modal-label-2" />}
                  </div>
                  <p className="join-call-modal-description">{utilizador?.name || 'Você'}</p>
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
                onClick={() => definirIsMicOn((anterior) => !anterior)}
                className={`join-call-modal-button-2 ${isMicOn ? 'join-call-modal-button-3' : 'join-call-modal-button-4'}`}
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
                onClick={() => definirIsCamaraOn((anterior) => !anterior)}
                className={`join-call-modal-button-2 ${isCamaraOn ? 'join-call-modal-button-5' : 'join-call-modal-button-4'}`}
              >
                {isCamaraOn ? (
                  <Video className="join-call-modal-x" />
                ) : (
                  <VideoOff className="join-call-modal-mic-off" />
                )}
                <span>{isCamaraOn ? 'Câmara Ligada' : 'Câmara Desligada'}</span>
              </button>
            </div>

            {/* Mensagem de Erro de Permissão */}
            {permissionErro && <div className="join-call-modal-panel-12">{permissionErro}</div>}

            {/* Alerta de transferência se já estiver noutra chamada */}
            {ativoChamada && (
              <div className="join-call-modal-panel-13">
                <PhoneOff className="join-call-modal-phone-off" />
                <div className="join-call-modal-panel-14">
                  <span className="join-call-modal-label-4">
                    Já se encontra ligado a: {ativoChamada.contextTitle} • {ativoChamada.roomName}
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
              <Botao
                type="button"
                variant="secondary"
                size="md"
                onClick={tratarFechar}
                className="join-call-modal-button-6"
              >
                Cancelar
              </Botao>

              <Botao
                type="button"
                variant="primary"
                size="md"
                onClick={tratarConfirmar}
                className="join-call-modal-button-7"
              >
                <span>Entrar na Sala</span>
                <ArrowRight className="join-call-modal-arrow-right" />
              </Botao>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(janelaConteudo, document.body);
};

export default AderirChamadaJanela;
