import React, { createContext, useContext, useState, useEffect } from 'react';

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

  const startCall = ({
    roomId,
    roomName,
    contextTitle = 'Conferência NEXO',
    courseId = null,
    spaceId = null,
    returnUrl = ''
  }) => {
    const callData = {
      roomId,
      roomName,
      contextTitle,
      courseId,
      spaceId,
      returnUrl,
      startedAt: Date.now()
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
    <ActiveCallContext.Provider value={{ activeCall, startCall, endCall, setActiveCall }}>
      {children}
    </ActiveCallContext.Provider>
  );
};

export const useActiveCall = () => {
  const context = useContext(ActiveCallContext);
  return context || {
    activeCall: null,
    startCall: () => {},
    endCall: () => {},
    setActiveCall: () => {}
  };
};

export default ActiveCallContext;
