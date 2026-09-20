import React, { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    const envSocketUrl = (import.meta as any).env?.VITE_SOCKET_URL || (import.meta as any).env?.VITE_API_URL;
    let socketServerUrl = envSocketUrl ? envSocketUrl.replace(/\/api\/?$/, '').replace(/\/$/, '') : window.location.origin;
    if (!envSocketUrl && window.location.hostname === 'localhost') {
      socketServerUrl = 'http://localhost:5000';
    }

    const newSocket = io(socketServerUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
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
