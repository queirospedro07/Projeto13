import React from 'react';
import { CallStage, CallParticipant } from './CallStage';

export interface CallRoomModalProps {
  roomName: string;
  roomId?: string;
  roomType?: 'voice' | 'video' | 'stage' | 'qa';
  isOpen: boolean;
  onClose: () => void;
  initialParticipants?: CallParticipant[];
}

export const CallRoomModal: React.FC<CallRoomModalProps> = ({
  roomName,
  roomId,
  roomType = 'voice',
  isOpen,
  onClose,
  initialParticipants = []
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-fade-in select-none">
      <CallStage
        roomName={roomName}
        roomId={roomId}
        roomType={roomType}
        initialParticipants={initialParticipants}
        onDisconnect={onClose}
      />
    </div>
  );
};
