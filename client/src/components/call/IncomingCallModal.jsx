import React, { useState, useEffect, useRef } from 'react';
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
      setIncomingCall(current => {
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
      acceptor: user
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
      rejector: user
    });

    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12141a] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-scale-in">
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <Avatar
            src={incomingCall.caller.avatarUrl}
            name={incomingCall.caller.name}
            size="xl"
            className="ring-4 ring-emerald-500 relative"
          />
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-md">
            <Video className="w-3.5 h-3.5" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          {incomingCall.caller.name}
        </h3>
        <p className="text-xs text-slate-400 mb-6 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          A ligar para si em chamada direta...
        </p>

        <div className="flex items-center gap-4 w-full">
          <button
            onClick={handleReject}
            className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Recusar</span>
          </button>

          <button
            onClick={handleAccept}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Phone className="w-4 h-4" />
            <span>Atender</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
