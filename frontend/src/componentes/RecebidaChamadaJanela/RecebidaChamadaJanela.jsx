import './RecebidaChamadaJanela.css';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LuPhone as Phone, LuPhoneOff as PhoneOff, LuVideo as Video } from 'react-icons/lu';
import { Avatar } from '../Avatar';
import { useSocket } from '../../contextos/ContextoSocket';
import { useAutenticacao } from '../../contextos/ContextoAutenticacao';
import { soundEffects } from '../../servicos/soundEffects';

export const RecebidaChamadaJanela = ({ onAcceptCall: onAceitarChamada }) => {
  const { socket } = useSocket();
  const { user: utilizador } = useAutenticacao();
  const [recebidaChamada, definirRecebidaChamada] = useState(null);
  const toqueIntervalRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    const tratarRecebida = ({ caller: autorChamada, roomId: salaId }) => {
      // Não reproduz o toque quando a chamada foi iniciada pelo próprio utilizador.
      if (autorChamada?.id === utilizador?.id) return;
      definirRecebidaChamada({
        caller: autorChamada,
        roomId: salaId,
      });
      soundEffects.reproduzirToque();
      if (toqueIntervalRef.current) clearInterval(toqueIntervalRef.current);
      toqueIntervalRef.current = setInterval(() => {
        soundEffects.reproduzirToque();
      }, 2500);
    };

    const tratarTerminado = ({ roomId: salaId }) => {
      definirRecebidaChamada((atual) => {
        if (atual && atual.roomId === salaId) {
          if (toqueIntervalRef.current) clearInterval(toqueIntervalRef.current);

          return null;
        }

        return atual;
      });
    };

    socket.on('direct-call-incoming', tratarRecebida);
    socket.on('direct-call-ended', tratarTerminado);

    return () => {
      socket.off('direct-call-incoming', tratarRecebida);
      socket.off('direct-call-ended', tratarTerminado);
      if (toqueIntervalRef.current) clearInterval(toqueIntervalRef.current);
    };
  }, [socket, utilizador?.id]);

  const tratarAceitar = () => {
    if (!recebidaChamada) return;
    if (toqueIntervalRef.current) clearInterval(toqueIntervalRef.current);
    socket?.emit('direct-call-accepted', {
      callerId: recebidaChamada.caller.id,
      roomId: recebidaChamada.roomId,
      acceptor: utilizador,
    });

    const chamadaDados = recebidaChamada;

    definirRecebidaChamada(null);
    onAceitarChamada?.(chamadaDados);
  };

  const tratarRejeitar = () => {
    if (!recebidaChamada) return;
    if (toqueIntervalRef.current) clearInterval(toqueIntervalRef.current);
    socket?.emit('direct-call-rejeitado', {
      callerId: recebidaChamada.caller.id,
      roomId: recebidaChamada.roomId,
      rejector: utilizador,
    });
    definirRecebidaChamada(null);
  };

  if (!recebidaChamada) return null;
  const janelaConteudo = (
    <div className="incoming-call-modal-panel dialog-layer">
      <div className="incoming-call-modal-panel-2 animate-scale-in">
        <div className="incoming-call-modal-panel-3">
          <div className="incoming-call-modal-panel-4" />
          <Avatar
            src={recebidaChamada.caller.urlAvatar}
            name={recebidaChamada.caller.name}
            size="xl"
            className="incoming-call-modal-avatar"
          />
          <div className="incoming-call-modal-panel-5">
            <Video className="incoming-call-modal-video" />
          </div>
        </div>

        <h3 className="incoming-call-modal-subheading">{recebidaChamada.caller.name}</h3>
        <p className="incoming-call-modal-description">
          <span className="incoming-call-modal-label" />A ligar para si em chamada direta...
        </p>

        <div className="incoming-call-modal-panel-6">
          <button
            onClick={tratarRejeitar}
            className="incoming-call-modal-button"
          >
            <PhoneOff className="incoming-call-modal-phone-off" />
            <span>Recusar</span>
          </button>

          <button
            onClick={tratarAceitar}
            className="incoming-call-modal-button-2"
          >
            <Phone className="incoming-call-modal-phone-off" />
            <span>Atender</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(janelaConteudo, document.body);
};

export default RecebidaChamadaJanela;
