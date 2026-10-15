import './IncomingCallModal.css';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { soundEffects } from '../../services/soundEffects';

export const IncomingCallModal = ({ onAcceptCall }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState(null);
  const ringtoneIntervalRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = ({ caller, roomId }) => {
      // Don't ring if the caller is ourselves
      if (caller?.id === user?.id) return;

      setIncomingCall({ caller, roomId });
      soundEffects.playRingtone();

      if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = setInterval(() => {
        soundEffects.playRingtone();
      }, 2500);
    };

    const handleEnded = ({ roomId }) => {
      setIncomingCall((current) => {
        if (current && current.roomId === roomId) {
          if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
          return null;
        }
        return current;
      });
    };

    socket.on('direct-call-incoming', handleIncoming);
    socket.on('direct-call-ended', handleEnded);

    return () => {
      socket.off('direct-call-incoming', handleIncoming);
      socket.off('direct-call-ended', handleEnded);
      if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
    };
  }, [socket, user?.id]);

  const handleAccept = () => {
    if (!incomingCall) return;
    if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);

    socket?.emit('direct-call-accepted', {
      callerId: incomingCall.caller.id,
      roomId: incomingCall.roomId,
      acceptor: user,
    });

    const callData = incomingCall;
    setIncomingCall(null);
    onAcceptCall?.(callData);
  };

  const handleReject = () => {
    if (!incomingCall) return;
    if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);

    socket?.emit('direct-call-rejected', {
      callerId: incomingCall.caller.id,
      roomId: incomingCall.roomId,
      rejector: user,
    });

    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  const modalContent = (
    <div className="incoming-call-modal-panel dialog-layer">
      <div className="incoming-call-modal-panel-2 animate-scale-in">
        <div className="incoming-call-modal-panel-3">
          <div className="incoming-call-modal-panel-4" />
          <Avatar
            src={incomingCall.caller.avatarUrl}
            name={incomingCall.caller.name}
            size="xl"
            className="incoming-call-modal-avatar"
          />
          <div className="incoming-call-modal-panel-5">
            <Video className="incoming-call-modal-video" />
          </div>
        </div>

        <h3 className="incoming-call-modal-subheading">{incomingCall.caller.name}</h3>
        <p className="incoming-call-modal-description">
          <span className="incoming-call-modal-label" />A ligar para si em chamada direta...
        </p>

        <div className="incoming-call-modal-panel-6">
          <button onClick={handleReject} className="incoming-call-modal-button">
            <PhoneOff className="incoming-call-modal-phone-off" />
            <span>Recusar</span>
          </button>

          <button onClick={handleAccept} className="incoming-call-modal-button-2">
            <Phone className="incoming-call-modal-phone-off" />
            <span>Atender</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default IncomingCallModal;
