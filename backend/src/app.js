const { queryOne } = require('./database/connection.js');
const reportRoutes = require('./routes/report.routes.js');
const paymentRoutes = require('./routes/payment.routes.js');
const projectRoutes = require('./routes/project.routes.js');
const express = require('express');
const { authenticate } = require('./middleware/auth.js');
const { getIceServers } = require('./config/iceServers.js');
const {
  helmetMiddleware,
  corsMiddleware,
  apiLimiter,
  authLimiter,
  sanitizeInputs,
} = require('./middleware/security.js');
const authRoutes = require('./routes/auth.routes.js');
const courseRoutes = require('./routes/course.routes.js');
const quizRoutes = require('./routes/quiz.routes.js');
const spaceRoutes = require('./routes/space.routes.js');
const chatRoutes = require('./routes/chat.routes.js');
const creatorRoutes = require('./routes/creator.routes.js');
const adminRoutes = require('./routes/admin.routes.js');
const notesRoutes = require('./routes/notes.routes.js');
const certificateRoutes = require('./routes/certificate.routes.js');
const notificationRoutes = require('./routes/notification.routes.js');
const socialRoutes = require('./routes/social.routes.js');
const helpRoutes = require('./routes/help.routes.js');
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
app.use(
  [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/demo',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
  ],
  authLimiter,
);
app.use(
  express.json({
    limit: '10mb',
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  }),
);
app.use(sanitizeInputs);

// Rota de estado do servidor
app.get('/api/health', async (_req, res) => {
  try {
    await queryOne('SELECT 1 AS available');
    res.json({
      status: 'ok',
      platform: 'NEXO',
      database: 'postgresql',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: 'unavailable',
      platform: 'NEXO',
      database: 'postgresql',
    });
  }
});

// Servidores STUN para chamadas WebRTC
app.get('/api/ice-servers', authenticate, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    iceServers: getIceServers(),
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/payments', paymentRoutes);
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
app.use('/api/help', helpRoutes);
app.use((req, res) => {
  res.status(404).json({
    message: 'Rota não encontrada',
    error: 'Rota não encontrada',
  });
});

// Tratamento de erros
app.use((err, req, res, _next) => {
  console.error(err.stack || err);

  const databaseUnavailable = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    '08000',
    '08003',
    '08006',
    '57P01',
    '57P02',
    '57P03',
    '53300',
  ].includes(err.code);
  const status = databaseUnavailable
    ? 503
    : Number.isInteger(err.status) && err.status >= 400 && err.status <= 599
      ? err.status
      : 500;
  const message = databaseUnavailable
    ? 'O serviço de dados está temporariamente indisponível. Tente novamente.'
    : process.env.NODE_ENV === 'production' && status >= 500
      ? 'Ocorreu um erro interno no servidor.'
      : err.message || 'Erro interno no servidor';

  res.status(status).json({
    message,
    error: message,
  });
});
module.exports = app;
