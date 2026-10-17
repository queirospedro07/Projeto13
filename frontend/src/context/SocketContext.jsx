import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
const SocketContext = createContext(undefined);
export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsersList, setOnlineUsersList] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const serverUrlRef = useRef('');
  const onlineUsers = useMemo(() => {
    const arr = Array.isArray(onlineUsersList) ? [...onlineUsersList] : [];
    const idSet = new Set(
      arr.map((u) => (typeof u === 'string' ? u : u?.userId || u?.id)).filter(Boolean),
    );
    arr.has = (id) => idSet.has(id);
    return arr;
  }, [onlineUsersList]);
  useEffect(() => {
    if (!user?.id || !token) {
      setSocket(null);
      setIsConnected(false);
      return undefined;
    }
    const envSocketUrl = import.meta.env?.VITE_SOCKET_URL || import.meta.env?.VITE_API_URL;
    let socketServerUrl = envSocketUrl
      ? envSocketUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')
      : window.location.origin;
    if (!envSocketUrl && window.location.hostname === 'localhost') {
      socketServerUrl = 'http://localhost:5000';
    }
    serverUrlRef.current = socketServerUrl;
    const newSocket = io(socketServerUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        token,
      },
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 60000,
    });
    newSocket.on('connect', () => {
      setIsConnected(true);
      if (user) {
        newSocket.emit('user-connected', {
          userId: user.id,
          username: user.username || user.name || 'Utilizador',
        });
      }
    });
    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });
    newSocket.on('presence-update', (users) => {
      setOnlineUsersList(users);
    });
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [user?.id, token]);
  useEffect(() => {
    const url = serverUrlRef.current;
    if (!url || url.includes('localhost') || url.includes('127.0.0.1')) return;
    const ping = () => {
      fetch(`${url}/api/health`, {
        method: 'GET',
        cache: 'no-store',
      }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  const joinChannel = (channelId) => {
    socket?.emit('join-channel', channelId);
  };
  const leaveChannel = (channelId) => {
    socket?.emit('leave-channel', channelId);
  };
  const sendTyping = (channelId) => {
    if (user && socket) {
      socket.emit('typing', {
        channelId,
      });
    }
  };
  const sendStopTyping = (channelId) => {
    if (user && socket) {
      socket.emit('stop-typing', {
        channelId,
      });
    }
  };
  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        isConnected,
        joinChannel,
        leaveChannel,
        sendTyping,
        sendStopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
