import reportRoutes from './routes/report.routes.js';
import projectRoutes from './routes/project.routes.js';
import express from 'express';
import {
  helmetMiddleware,
  corsMiddleware,
  apiLimiter,
  authLimiter,
  sanitizeInputs,
} from './middleware/security.js';

import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import spaceRoutes from './routes/space.routes.js';
import chatRoutes from './routes/chat.routes.js';
import creatorRoutes from './routes/creator.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notesRoutes from './routes/notes.routes.js';
import certificateRoutes from './routes/certificate.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import socialRoutes from './routes/social.routes.js';
import supportRoutes from './routes/support.routes.js';

const app = express();

app.disable('x-powered-by');
if (process.env.TRUST_PROXY_HOPS) {
  const hops = Number(process.env.TRUST_PROXY_HOPS);
  if (!Number.isInteger(hops) || hops < 1 || hops > 5)
    throw new Error('TRUST_PROXY_HOPS deve ser um inteiro entre 1 e 5.');
  app.set('trust proxy', hops);
}
if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL && !process.env.FRONTEND_URL)
  throw new Error('Configure o domínio HTTPS do frontend em produção.');
// Middlewares de segurança e parsing
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use('/api', apiLimiter);
app.use(['/api/auth/login', '/api/auth/register', '/api/auth/demo'], authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInputs);

// Limite de pedidos por IP

// Rota de estado do servidor
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'NEXO',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Servidores STUN para chamadas WebRTC
app.get('/api/ice-servers', (_req, res) => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' },
  ];
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({ iceServers });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api', chatRoutes);
app.use('/api/creator', creatorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/support', supportRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Rota não encontrada',
    error: 'Rota não encontrada',
  });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Ocorreu um erro interno no servidor.'
      : err.message || 'Erro interno no servidor';

  res.status(status).json({
    message,
    error: message,
  });
});

export default app;
