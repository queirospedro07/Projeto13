import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB, db, query } from './database/connection.js';
import { socketCorsConfig } from './middleware/security.js';
import { verifyJwtToken } from './middleware/auth.js';
import { setupSocketIO } from './sockets/chatSocket.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Configuração do Socket.IO
const io = new Server(server, {
  cors: socketCorsConfig
});
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (typeof token !== 'string' || !token) {
    return next(new Error('Autenticação necessária.'));
  }

  try {
    const payload = verifyJwtToken(token);
    const result = await query(
      'SELECT id, name, username, role, avatarUrl, isSuspended FROM users WHERE id = ?',
      [payload.id]
    );
    const user = result?.rows?.[0] || null;

    if (!user || (user.role !== 'ADMIN' && Number(user.isSuspended) === 1)) {
      return next(new Error('Utilizador não autorizado.'));
    }

    socket.data.user = user;
    return next();
  } catch {
    return next(new Error('Token de autenticação inválido.'));
  }
});
setupSocketIO(io);
app.set('io', io);

// Ligar à base de dados e arrancar o servidor
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Servidor NEXO a correr na porta ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  })
  .catch((err) => {
    console.error('Erro ao ligar à base de dados:', err.message);
    process.exit(1);
  });

const handleShutdown = () => {
  console.log('A encerrar servidor...');
  server.close(() => {
    if (db && typeof db.close === 'function') {
      try { db.close(); } catch (_) {}
    }
    process.exit(0);
  });
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
