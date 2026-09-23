import React from 'react';
import { CallStage } from './CallStage';
export const CallRoomModal = ({
  roomName,
  roomId,
  roomType = 'voice',
  isOpen,
  onClose,
  initialParticipants = []
}) => {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-fade-in select-none">
      <CallStage key={roomId || roomName} roomName={roomName} roomId={roomId} roomType={roomType} initialParticipants={initialParticipants} onDisconnect={onClose} />
    </div>;
};