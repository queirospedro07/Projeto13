import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB, db } from './database/connection.js';
import { socketCorsConfig } from './middleware/security.js';
import { setupSocketIO } from './sockets/chatSocket.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Real-time WebSockets with Socket.IO
const io = new Server(server, {
  cors: socketCorsConfig
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
