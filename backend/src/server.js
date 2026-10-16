require('./config/environment.js');
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app.js');
const { connectDB, closeDatabase } = require('./database/connection.js');
const { socketCorsConfig } = require('./middleware/security.js');
const { authenticateSocket } = require('./sockets/security.js');
const { setupSocketIO } = require('./sockets/chatSocket.js');
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
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
    server.listen(PORT, HOST, () => {
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
  io.close(async () => {
    await closeDatabase();
    clearTimeout(deadline);
    process.exit(0);
  });
};
process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
