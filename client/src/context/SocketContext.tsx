import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface PresenceUser {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'dnd';
}

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: PresenceUser[];
  isConnected: boolean;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  sendTyping: (channelId: string) => void;
  sendStopTyping: (channelId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  // Keep the server URL so the keepalive can ping /api/health
  const serverUrlRef = useRef<string>('');

  useEffect(() => {
    const envSocketUrl = (import.meta as any).env?.VITE_SOCKET_URL || (import.meta as any).env?.VITE_API_URL;
    let socketServerUrl = envSocketUrl ? envSocketUrl.replace(/\/api\/?$/, '').replace(/\/$/, '') : window.location.origin;
    if (!envSocketUrl && window.location.hostname === 'localhost') {
      socketServerUrl = 'http://localhost:5000';
    }
    serverUrlRef.current = socketServerUrl;

    const newSocket = io(socketServerUrl, {
      // Try WebSocket first; fall back to long-polling if needed (e.g. some proxies block WS)
      transports: ['websocket', 'polling'],
      // Render free tier can take 30-60s to wake from hibernation — be patient
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 60000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (user) {
        newSocket.emit('user-connected', { userId: user.id, username: user.username });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('presence-update', (users: PresenceUser[]) => {
      setOnlineUsers(users);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    if (socket && isConnected && user) {
      socket.emit('user-connected', { userId: user.id, username: user.username });
    }
  }, [socket, isConnected, user?.id]);

  // Keepalive: ping /api/health every 10 minutes so Render free tier never hibernates
  // while a user is logged in. Ignored in local dev (localhost).
  useEffect(() => {
    const url = serverUrlRef.current;
    if (!url || url.includes('localhost') || url.includes('127.0.0.1')) return;

    const ping = () => {
      fetch(`${url}/api/health`, { method: 'GET', cache: 'no-store' }).catch(() => {
        // Silent — if the server is waking up the next real request will retry
      });
    };

    // Ping immediately on mount so Render wakes up as soon as the user opens the app
    ping();
    const interval = setInterval(ping, 10 * 60 * 1000); // every 10 minutes
    return () => clearInterval(interval);
  }, []);

  const joinChannel = (channelId: string) => {
    socket?.emit('join-channel', channelId);
  };

  const leaveChannel = (channelId: string) => {
    socket?.emit('leave-channel', channelId);
  };

  const sendTyping = (channelId: string) => {
    if (user && socket) {
      socket.emit('typing', { channelId, username: user.name || user.username });
    }
  };

  const sendStopTyping = (channelId: string) => {
    if (user && socket) {
      socket.emit('stop-typing', { channelId, username: user.name || user.username });
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
