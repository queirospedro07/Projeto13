import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CallStage } from './CallStage';

export const CallRoomModal = ({
  roomName,
  roomId,
  roomType = 'voice',
  isOpen,
  onClose,
  initialParticipants = [],
  initialMuted = false,
  initialCameraOn = false
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 dark:bg-black flex flex-col animate-fade-in" style={{ isolation: 'isolate' }}>
      <CallStage
        key={roomId || roomName}
        roomName={roomName}
        roomId={roomId}
        roomType={roomType}
        initialParticipants={initialParticipants}
        onDisconnect={onClose}
        isModal={true}
        initialMuted={initialMuted}
        initialCameraOn={initialCameraOn}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CallRoomModal;