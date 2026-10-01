import { queryAll, queryOne, execute, transaction } from '../database/connection.js';

export const getStats = async (req, res) => {
  try {
    const totalUsers = (queryOne('SELECT COUNT(*) as c FROM users') || {}).c || 0;
    const totalCourses = (queryOne('SELECT COUNT(*) as c FROM courses') || {}).c || 0;
    const totalSpaces = (queryOne('SELECT COUNT(*) as c FROM spaces') || {}).c || 0;
    const totalEnrollments = (queryOne('SELECT COUNT(*) as c FROM enrollments') || {}).c || 0;
    const pendingApplications = (queryOne("SELECT COUNT(*) as c FROM creator_applications WHERE status = 'PENDING'") || {}).c || 0;
    const pendingCourses = (queryOne("SELECT COUNT(*) as c FROM courses WHERE approvalStatus = 'PENDING'") || {}).c || 0;

    return res.json({
      totalUsers,
      activeUsers: Math.max(1, Math.round(totalUsers * 0.85)),
      totalCourses, totalSpaces, totalEnrollments,
      pendingReports: 0, pendingApplications, pendingCourses
    });
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao carregar estatísticas.', error: 'Falha ao carregar estatísticas.' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = queryAll(`
      SELECT id, name, username, email, role, avatarUrl, isSuspended, xp, level, createdAt
      FROM users ORDER BY createdAt DESC
    `);
    return res.json(users.map(u => ({ ...u, isSuspended: u.isSuspended === 1 })));
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao carregar utilizadores.', error: 'Falha ao carregar utilizadores.' });
  }
};

export const toggleSuspend = async (req, res) => {
  try {
    const { id } = req.params;
    const user = queryOne('SELECT role, isSuspended FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado.', error: 'Utilizador não encontrado.' });
    if (user.role === 'ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Sem permissão para modificar administradores.', error: 'Sem permissão.' });
    }
    const newSuspended = user.isSuspended === 1 ? 0 : 1;
    execute('UPDATE users SET isSuspended = ? WHERE id = ?', [newSuspended, id]);
    return res.json({ isSuspended: newSuspended === 1 });
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao alterar estado de suspensão.', error: 'Falha ao alterar estado de suspensão.' });
  }
};

export default { getStats, getUsers, toggleSuspend };
