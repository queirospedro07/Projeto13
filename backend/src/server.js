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

// Real-time WebSockets with Socket.IO
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

    if (!user || user.isSuspended) {
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

// Connect to Database and start server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 NEXO API a correr na porta ${PORT}`);
      console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🛡️  Segurança ativa (Helmet, CORS restrito, express-validator, Rate Limiter)`);
      console.log(`📡 Socket.IO em tempo real conectado`);
    });
  })
  .catch((err) => {
    console.error('❌ Falha crítica ao conectar à base de dados:', err.message);
    process.exit(1);
  });

// Graceful shutdown
const handleShutdown = () => {
  console.log('A encerrar servidor de forma limpa...');
  server.close(() => {
    if (db && typeof db.close === 'function') {
      try { db.close(); } catch (_) {}
    }
    process.exit(0);
  });
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
