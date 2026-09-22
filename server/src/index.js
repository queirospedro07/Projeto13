import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { helmetMiddleware, corsMiddleware, socketCorsConfig, apiLimiter, authLimiter, sanitizeInputs } from './middleware/security.js';
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import quizRoutes from './routes/quizzes.js';
import spaceRoutes from './routes/spaces.js';
import chatRoutes from './routes/chat.js';
import gamificationRoutes from './routes/gamification.js';
import creatorRoutes from './routes/creator.js';
import adminRoutes from './routes/admin.js';
import notesRoutes from './routes/notes.js';
import qaRoutes from './routes/qa.js';
import certificateRoutes from './routes/certificates.js';
import notificationRoutes from './routes/notifications.js';
import socialRoutes from './routes/social.js';
import { setupSocketIO } from './sockets/chatSocket.js';
import { db } from './db/index.js';
dotenv.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({
  limit: '5mb'
}));
app.use(express.urlencoded({
  extended: true,
  limit: '5mb'
}));
app.use(sanitizeInputs);
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
const io = new Server(server, {
  cors: socketCorsConfig
});
setupSocketIO(io);
app.set('io', io);
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'LearnSpace',
    tagline: 'Aprender. Conectar. Evoluir.',
    environment: process.env.NODE_ENV || 'development',
    database: 'SQLite (Direct Prepared Queries - WAL Mode)',
    timestamp: new Date().toISOString()
  });
});
app.get('/api/ice-servers', (_req, res) => {
  const iceServers = [{
    urls: 'stun:stun.l.google.com:19302'
  }, {
    urls: 'stun:stun1.l.google.com:19302'
  }, {
    urls: 'stun:stun.relay.metered.ca:80'
  }];
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({
    iceServers
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api', chatRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/creator', creatorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/social', socialRoutes);
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Ocorreu um erro interno no servidor.' : err.message || 'Erro no servidor';
  res.status(status).json({
    error: message
  });
});
process.on('SIGTERM', () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
});
server.listen(PORT, () => {
  console.log(`🚀 LearnSpace API em execução em http://localhost:${PORT}`);
  console.log('🛡️  Segurança de produção ativada (Helmet, CORS restrito, Rate Limiters, Sanitização SQL)');
  console.log('📡 Socket.IO em tempo real pronto');
});