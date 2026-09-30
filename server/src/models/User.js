import bcrypt from 'bcryptjs';
import { queryOne, queryAll, execute, transaction } from '../database/connection.js';

export const User = {
  findByEmail(email) {
    return queryOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  },

  findByUsername(username) {
    return queryOne('SELECT * FROM users WHERE username = ?', [username.toLowerCase().trim()]);
  },

  findById(id) {
    return queryOne('SELECT id, name, username, email, role, avatarUrl, bio, location, streakDays, xp, level, isSuspended, createdAt FROM users WHERE id = ?', [id]);
  },

  async create({ name, username, email, password, role = 'STUDENT' }) {
    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`;
    const targetRole = role === 'CREATOR' ? 'CREATOR' : 'STUDENT';

    transaction(() => {
      execute(
        `INSERT INTO users (id, email, username, passwordHash, name, role, avatarUrl, bio, location, streakDays, dailyGoalMinutes, minutesToday, totalMinutes, xp, level, isSuspended, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, '', '', 0, 45, 0, 0, 0, 1, 0, ?, ?)`,
        [userId, cleanEmail, cleanUsername, passwordHash, name.trim(), targetRole, avatarUrl, now, now]
      );
      execute(
        `INSERT INTO profiles (id, userId, headline, isPublic, showStreak, showLeaderboard, themePreference)
         VALUES (?, ?, '', 1, 1, 1, 'light')`,
        [`prof-${userId}`, userId]
      );
      execute(
        `INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt)
         VALUES (?, ?, 'achievement', 'Bem-vindo ao LearnSpace!', 'Explore o catálogo de cursos e conecte-se com a comunidade.', '/explore', 0, ?)`,
        [`notif-${Date.now()}`, userId, now]
      );
    });

    return {
      id: userId,
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      role: targetRole,
      avatarUrl,
      xp: 0,
      level: 1,
      streakDays: 0
    };
  },

  async comparePassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
  },

  update(id, fields = {}) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = Object.values(fields);
    execute(`UPDATE users SET ${setClauses}, updatedAt = ? WHERE id = ?`, [...values, new Date().toISOString(), id]);
    return this.findById(id);
  },

  listAll(limit = 100, offset = 0) {
    return queryAll('SELECT id, name, username, email, role, xp, level, isSuspended, createdAt FROM users ORDER BY createdAt DESC LIMIT ? OFFSET ?', [limit, offset]);
  }
};

export default User;
