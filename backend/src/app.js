import express from 'express';
import { helmetMiddleware, corsMiddleware, apiLimiter, authLimiter, sanitizeInputs } from './middleware/security.js';

import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import spaceRoutes from './routes/space.routes.js';
import chatRoutes from './routes/chat.routes.js';
import gamificationRoutes from './routes/gamification.routes.js';
import creatorRoutes from './routes/creator.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notesRoutes from './routes/notes.routes.js';
import qaRoutes from './routes/qa.routes.js';
import certificateRoutes from './routes/certificate.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import socialRoutes from './routes/social.routes.js';
import supportRoutes from './routes/support.routes.js';

const app = express();

// Security middlewares (Helmet, CORS, Body parsers, Sanitization)
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInputs);

// Rate limiters
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// Health check endpoint (matching PW-P-LAB-TRABALHO-PRATICO)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'NEXO',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// WebRTC ICE servers endpoint for audio/video calls
app.get('/api/ice-servers', (_req, res) => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' }
  ];
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({ iceServers });
});

// Standard API Routes
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
app.use('/api/support', supportRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Rota não encontrada',
    error: 'Rota não encontrada'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Ocorreu um erro interno no servidor.'
    : err.message || 'Erro interno no servidor';

  res.status(status).json({
    message,
    error: message
  });
});

export default app;
