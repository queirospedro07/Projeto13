import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB, db, query } from './database/connection.js';
import { socketCorsConfig } from './middleware/security.js';
import { authenticateSocket } from './sockets/security.js';
import { setupSocketIO } from './sockets/chatSocket.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Configuração do Socket.IO
const io = new Server(server, {
  cors: socketCorsConfig,
  maxHttpBufferSize: 128 * 1024,
  connectTimeout: 10000,
});
io.use(authenticateSocket);
setupSocketIO(io);
app.set('io', io);

// Ligar à base de dados e arrancar o servidor
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(
        `Servidor NEXO a correr na porta ${PORT} (${process.env.NODE_ENV || 'development'})`,
      );
    });
  })
  .catch((err) => {
    console.error('Erro ao ligar à base de dados:', err.message);
    process.exit(1);
  });

let shuttingDown = false;
const handleShutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('A encerrar servidor...');
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  io.close(() => {
    if (db && typeof db.close === 'function') db.close();
    clearTimeout(deadline);
    process.exit(0);
  });
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
