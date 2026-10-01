import { queryAll, queryOne, execute } from '../database/connection.js';

export const getLeaderboard = async (req, res) => {
  try {
    const users = queryAll(`
      SELECT id, name, username, avatarUrl, xp, level, streakDays, totalMinutes
      FROM users
      WHERE isSuspended = 0
      ORDER BY xp DESC
      LIMIT 50
    `);
    return res.json(users.map((u, i) => ({ ...u, rank: i + 1 })));
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao carregar leaderboard.', error: 'Falha ao carregar leaderboard.' });
  }
};

export const getAchievements = async (req, res) => {
  try {
    const achievements = queryAll('SELECT * FROM achievements ORDER BY rarity ASC');
    let userAchievements = [];
    if (req.user) {
      userAchievements = queryAll('SELECT achievementId FROM user_achievements WHERE userId = ?', [req.user.id]);
    }
    const unlockedIds = new Set(userAchievements.map(a => a.achievementId));
    return res.json(achievements.map(a => ({ ...a, unlocked: unlockedIds.has(a.id) })));
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao carregar conquistas.', error: 'Falha ao carregar conquistas.' });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = queryOne('SELECT xp, level, streakDays, totalMinutes, minutesToday FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado.', error: 'Utilizador não encontrado.' });

    const completedCourses = (queryOne('SELECT COUNT(*) as c FROM enrollments WHERE userId = ? AND completedAt IS NOT NULL', [userId]) || {}).c || 0;
    const enrolledCourses = (queryOne('SELECT COUNT(*) as c FROM enrollments WHERE userId = ?', [userId]) || {}).c || 0;
    const achievementsCount = (queryOne('SELECT COUNT(*) as c FROM user_achievements WHERE userId = ?', [userId]) || {}).c || 0;

    return res.json({ ...user, completedCourses, enrolledCourses, achievementsCount });
  } catch (err) {
    return res.status(500).json({ message: 'Falha ao carregar estatísticas do utilizador.', error: 'Falha ao carregar estatísticas do utilizador.' });
  }
};

export default { getLeaderboard, getAchievements, getUserStats };
