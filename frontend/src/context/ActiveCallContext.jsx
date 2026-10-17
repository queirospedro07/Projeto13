import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { soundEffects } from '../services/soundEffects';
const ActiveCallContext = createContext(null);
export const ActiveCallProvider = ({ children }) => {
  const [activeCall, setActiveCall] = useState(() => {
    try {
      const saved = sessionStorage.getItem('nexo_active_call');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isMicMuted, setIsMicMuted] = useState(() => {
    try {
      return localStorage.getItem('nexo_mic_muted') === 'true';
    } catch {
      return false;
    }
  });
  const [isDeafened, setIsDeafened] = useState(() => {
    try {
      return localStorage.getItem('nexo_deafened') === 'true';
    } catch {
      return false;
    }
  });
  const startCall = ({
    roomId,
    roomName,
    contextTitle = 'Conferência NEXO',
    courseId = null,
    spaceId = null,
    returnUrl = '',
  }) => {
    const callData = {
      roomId,
      roomName,
      contextTitle,
      courseId,
      spaceId,
      returnUrl,
      startedAt: Date.now(),
    };
    setActiveCall(callData);
    try {
      sessionStorage.setItem('nexo_active_call', JSON.stringify(callData));
    } catch {}
  };
  const endCall = () => {
    setActiveCall(null);
    try {
      sessionStorage.removeItem('nexo_active_call');
    } catch {}
    window.dispatchEvent(new Event('nexo_call_ended'));
  };
  const leaveCall = useCallback(() => {
    soundEffects.playLeaveCall();
    window.dispatchEvent(new CustomEvent('nexo_call_leave'));
    endCall();
  }, []);
  const toggleMic = useCallback(() => {
    if (activeCall) {
      window.dispatchEvent(new CustomEvent('nexo_call_toggle_mic'));
    } else {
      setIsMicMuted((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('nexo_mic_muted', String(next));
        } catch {}
        if (next) {
          soundEffects.playMute();
        } else {
          soundEffects.playUnmute();
          // Desmutar enquanto ensurdecido desativa também o ensurdecimento
          setIsDeafened(false);
          try {
            localStorage.setItem('nexo_deafened', 'false');
          } catch {}
        }
        return next;
      });
    }
  }, [activeCall]);
  const toggleDeafen = useCallback(() => {
    if (activeCall) {
      window.dispatchEvent(new CustomEvent('nexo_call_toggle_deafen'));
    } else {
      setIsDeafened((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('nexo_deafened', String(next));
        } catch {}
        if (next) {
          soundEffects.playDeafen();
          // Ao ficar ensurdecido, o microfone desliga-se automaticamente também!
          setIsMicMuted(true);
          try {
            localStorage.setItem('nexo_mic_muted', 'true');
          } catch {}
        } else {
          soundEffects.playUndeafen();
        }
        return next;
      });
    }
  }, [activeCall]);
  const updateCallAudioState = useCallback(({ isMuted, isDeafened: deafened }) => {
    if (isMuted !== undefined) {
      const val = Boolean(isMuted);
      setIsMicMuted(val);
      try {
        localStorage.setItem('nexo_mic_muted', String(val));
      } catch {}
    }
    if (deafened !== undefined) {
      const val = Boolean(deafened);
      setIsDeafened(val);
      try {
        localStorage.setItem('nexo_deafened', String(val));
      } catch {}
    }
  }, []);
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'nexo_active_call') {
        try {
          setActiveCall(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  return (
    <ActiveCallContext.Provider
      value={{
        activeCall,
        startCall,
        endCall,
        leaveCall,
        setActiveCall,
        isMicMuted,
        setIsMicMuted,
        isDeafened,
        setIsDeafened,
        toggleMic,
        toggleDeafen,
        updateCallAudioState,
      }}
    >
      {children}
    </ActiveCallContext.Provider>
  );
};
export const useActiveCall = () => {
  const context = useContext(ActiveCallContext);
  return (
    context || {
      activeCall: null,
      startCall: () => {},
      endCall: () => {},
      leaveCall: () => {},
      setActiveCall: () => {},
      isMicMuted: false,
      setIsMicMuted: () => {},
      isDeafened: false,
      setIsDeafened: () => {},
      toggleMic: () => {},
      toggleDeafen: () => {},
      updateCallAudioState: () => {},
    }
  );
};
export default ActiveCallContext;
