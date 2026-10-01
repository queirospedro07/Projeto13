import { Router } from 'express';
import { queryAll, queryOne, execute } from '../database/connection.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
const router = Router();
router.get('/verify/:certificateId', optionalAuth, async (req, res) => {
  try {
    const {
      certificateId
    } = req.params;
    const cert = queryOne(`SELECT c.*,
              u.id as user_id, u.name as user_name, u.username as user_username, u.avatarUrl as user_avatarUrl,
              co.id as course_id, co.title as course_title, co.slug as course_slug, co.durationHours as course_durationHours
       FROM certificates c
       JOIN users u ON c.userId = u.id
       JOIN courses co ON c.courseId = co.id
       WHERE c.id = ? OR c.credentialId = ?`, [certificateId, certificateId]);
    if (!cert) {
      return res.status(404).json({
        error: 'Certificado não encontrado ou identificador inválido'
      });
    }
    return res.json({
      id: cert.id,
      recipientName: cert.recipientName,
      courseTitle: cert.courseTitle,
      credentialId: cert.credentialId,
      issuedAt: cert.issuedAt,
      score: cert.score,
      user: {
        id: cert.user_id,
        name: cert.user_name,
        username: cert.user_username,
        avatarUrl: cert.user_avatarUrl
      },
      course: {
        id: cert.course_id,
        title: cert.course_title,
        slug: cert.course_slug,
        durationHours: cert.course_durationHours
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao verificar credencial de certificado'
    });
  }
});
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const certs = queryAll(`SELECT c.*, co.title as course_title, co.thumbnailUrl
       FROM certificates c
       JOIN courses co ON c.courseId = co.id
       WHERE c.userId = ?
       ORDER BY c.issuedAt DESC`, [userId]);
    return res.json(certs.map(c => ({
      ...c,
      course: {
        title: c.course_title,
        thumbnailUrl: c.thumbnailUrl
      }
    })));
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao carregar certificados'
    });
  }
});

// Gerar certificado manualmente para um curso já concluído
router.post('/generate/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollment = queryOne(
      'SELECT * FROM enrollments WHERE userId = ? AND courseId = ?',
      [userId, courseId]
    );
    if (!enrollment || enrollment.progressPercent < 100) {
      return res.status(400).json({
        error: 'Deve completar 100% do curso antes de gerar o certificado.'
      });
    }

    const existing = queryOne(
      'SELECT * FROM certificates WHERE userId = ? AND courseId = ?',
      [userId, courseId]
    );
    if (existing) {
      return res.json({ message: 'Certificado já emitido.', certificate: existing });
    }

    const course = queryOne('SELECT title FROM courses WHERE id = ?', [courseId]);
    const user = queryOne('SELECT name FROM users WHERE id = ?', [userId]);
    if (!course || !user) {
      return res.status(404).json({ error: 'Curso ou utilizador não encontrado.' });
    }

    const certId = `cert-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const credId = `LS-CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const now = new Date().toISOString();

    execute(
      `INSERT INTO certificates (id, userId, courseId, recipientName, courseTitle, credentialId, issuedAt, score)
       VALUES (?, ?, ?, ?, ?, ?, ?, 100)`,
      [certId, userId, courseId, user.name, course.title, credId, now]
    );

    const certificate = queryOne('SELECT * FROM certificates WHERE id = ?', [certId]);
    return res.status(201).json({ message: 'Certificado emitido com sucesso!', certificate });
  } catch (err) {
    console.error('Generate certificate error:', err);
    return res.status(500).json({ error: 'Falha ao gerar certificado.' });
  }
});

export default router;