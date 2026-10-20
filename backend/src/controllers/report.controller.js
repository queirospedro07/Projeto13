const Report = require('../models/Report.js');
const { randomUUID } = require('node:crypto');
const { canAccessChannel } = require('../middleware/channelAccess.js');

async function createReport(req, res) {
  const { targetType, targetId, reason } = req.body;
  const tables = {
    user: 'users',
    course: 'courses',
    message: 'messages',
    space: 'spaces',
  };
  if (
    !Object.hasOwn(tables, targetType) ||
    typeof targetId !== 'string' ||
    targetId.length > 180 ||
    typeof reason !== 'string' ||
    reason.trim().length < 10 ||
    reason.length > 2000
  )
    return res.status(400).json({
      error: 'Indique um alvo válido e um motivo entre 10 e 2000 caracteres.',
    });
  const target = await Report.findTargetById(tables[targetType], [targetId]);
  if (!target)
    return res.status(404).json({
      error: 'Conteúdo não encontrado.',
    });
  if (targetType === 'message' && !(await canAccessChannel(req.user, target.channelId)))
    return res.status(403).json({
      error: 'Sem acesso ao conteúdo.',
    });
  const id = randomUUID();
  const now = new Date().toISOString();

  await Report.insertDenuncias([id, req.user.id, targetType, targetId, reason.trim(), now, now]);

  return res.status(201).json({
    id,
    status: 'OPEN',
    message: 'Denúncia registada para análise da administração.',
  });
}

exports.createReport = createReport;
