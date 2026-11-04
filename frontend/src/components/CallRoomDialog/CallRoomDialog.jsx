import './CallRoomDialog.css';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChamadaPalco } from '../CallStage';

export const ChamadaSalaJanela = ({
  roomName: salaNome,
  roomId: salaId,
  roomType: salaType = 'voice',
  isOpen: isAbrir,
  onClose: onFechar,
  initialParticipants: inicialParticipants = [],
  initialMuted: inicialMuted = false,
  initialCameraOn: inicialCamaraOn = false,
}) => {
  const [mounted, definirMounted] = useState(false);

  useEffect(() => {
    definirMounted(true);
  }, []);
  useEffect(() => {
    if (isAbrir) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAbrir]);
  if (!isAbrir || !mounted) return null;
  const janelaConteudo = (
    <div className="call-room-modal-panel dialog-layer">
      <ChamadaPalco
        key={salaId || salaNome}
        roomName={salaNome}
        roomId={salaId}
        roomType={salaType}
        initialParticipants={inicialParticipants}
        onDisconnect={onFechar}
        isModal={true}
        initialMuted={inicialMuted}
        initialCameraOn={inicialCamaraOn}
      />
    </div>
  );

  return createPortal(janelaConteudo, document.body);
};

export default ChamadaSalaJanela;
