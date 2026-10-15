import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { queryOne, execute } from '../database/connection.js';
import { authenticate } from '../middleware/auth.js';
import { canAccessChannel } from '../middleware/channelAccess.js';
export function createReport(req, res) {
  const { targetType, targetId, reason } = req.body;
  const tables = { user: 'users', course: 'courses', message: 'messages', space: 'spaces' };
  if (
    !Object.hasOwn(tables, targetType) ||
    typeof targetId !== 'string' ||
    targetId.length > 180 ||
    typeof reason !== 'string' ||
    reason.trim().length < 10 ||
    reason.length > 2000
  )
    return res
      .status(400)
      .json({ error: 'Indique um alvo válido e um motivo entre 10 e 2000 caracteres.' });
  const target = queryOne(`SELECT * FROM ${tables[targetType]} WHERE id = ?`, [targetId]);
  if (!target) return res.status(404).json({ error: 'Conteúdo não encontrado.' });
  if (targetType === 'message' && !canAccessChannel(req.user, target.channelId))
    return res.status(403).json({ error: 'Sem acesso ao conteúdo.' });
  const id = randomUUID(),
    now = new Date().toISOString();
  execute(
    'INSERT INTO denuncias (id,id_utilizador,tipo_alvo,id_alvo,motivo,criado_em,atualizado_em) VALUES (?,?,?,?,?,?,?)',
    [id, req.user.id, targetType, targetId, reason.trim(), now, now],
  );
  return res
    .status(201)
    .json({ id, status: 'OPEN', message: 'Denúncia registada para análise da administração.' });
}
const router = Router();
router.post(
  '/',
  authenticate,
  rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false }),
  createReport,
);
export default router;
