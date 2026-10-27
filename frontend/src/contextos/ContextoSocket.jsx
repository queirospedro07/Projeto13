import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAutenticacao } from './ContextoAutenticacao';
import { ContextoSocket } from './contextos';

export const FornecedorSocket = ({ children: conteudoFilho }) => {
  const { user: utilizador, token } = useAutenticacao();
  const [socket, definirSocket] = useState(null);
  const [onlineUtilizadoresListar, definirOnlineUtilizadoresListar] = useState([]);
  const [isConnected, definirIsConnected] = useState(false);
  const servidorUrlRef = useRef('');
  const onlineUtilizadores = useMemo(() => {
    const arr = Array.isArray(onlineUtilizadoresListar) ? [...onlineUtilizadoresListar] : [];
    const idDefinir = new Set(
      arr.map((u) => (typeof u === 'string' ? u : u?.idUtilizador || u?.id)).filter(Boolean),
    );

    arr.has = (id) => idDefinir.has(id);

    return arr;
  }, [onlineUtilizadoresListar]);

  useEffect(() => {
    if (!utilizador?.id || !token) {
      definirSocket(null);
      definirIsConnected(false);

      return undefined;
    }

    const ambienteSocketUrl = import.meta.env?.VITE_SOCKET_URL || import.meta.env?.VITE_API_URL;
    let socketServidorUrl = ambienteSocketUrl
      ? ambienteSocketUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')
      : window.location.origin;

    servidorUrlRef.current = socketServidorUrl;

    const novoSocket = io(socketServidorUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        token,
      },
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 60000,
    });

    novoSocket.on('connect', () => {
      definirIsConnected(true);
      if (utilizador) {
        novoSocket.emit('user-connected', {
          idUtilizador: utilizador.id,
          username: utilizador.username || utilizador.name || 'Utilizador',
        });
      }
    });
    novoSocket.on('disconnect', () => {
      definirIsConnected(false);
    });
    novoSocket.on('presence-update', (utilizadores) => {
      definirOnlineUtilizadoresListar(utilizadores);
    });
    definirSocket(novoSocket);

    return () => {
      novoSocket.disconnect();
    };
  }, [utilizador?.id, token]);
  useEffect(() => {
    const url = servidorUrlRef.current;
    if (!url || url.includes('localhost') || url.includes('127.0.0.1')) return;
    const ping = () => {
      fetch(`${url}/api/estado`, {
        method: 'GET',
        cache: 'no-store',
      }).catch(() => {});
    };

    ping();

    const interval = setInterval(ping, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const aderirCanal = (canalId) => {
    socket?.emit('join-channel', canalId);
  };

  const sairCanal = (canalId) => {
    socket?.emit('leave-channel', canalId);
  };

  const enviarEscrever = (canalId) => {
    if (utilizador && socket) {
      socket.emit('typing', {
        idCanal: canalId,
      });
    }
  };

  const enviarPararEscrever = (canalId) => {
    if (utilizador && socket) {
      socket.emit('stop-typing', {
        idCanal: canalId,
      });
    }
  };

  return (
    <ContextoSocket.Provider
      value={{
        socket,
        onlineUsers: onlineUtilizadores,
        isConnected,
        aderirCanal,
        sairCanal,
        enviarEscrever,
        enviarPararEscrever,
      }}
    >
      {conteudoFilho}
    </ContextoSocket.Provider>
  );
};

export const useSocket = () => {
  const contexto = useContext(ContextoSocket);
  if (!contexto) throw new Error('useSocket must be used within FornecedorSocket');

  return contexto;
};
