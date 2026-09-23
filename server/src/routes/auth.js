import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne, execute, transaction } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { signJwtToken } from '../config/jwt.js';
const router = Router();
function generateToken(user) {
  return signJwtToken(user);
}
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      password,
      role
    } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        error: 'Todos os campos são obrigatórios'
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        error: 'A palavra-passe deve ter pelo menos 6 caracteres'
      });
    }
    if (password.length > 128) {
      return res.status(400).json({
        error: 'A palavra-passe não pode exceder 128 caracteres'
      });
    }
    if (name.trim().length < 2 || name.trim().length > 80) {
      return res.status(400).json({
        error: 'O nome deve ter entre 2 e 80 caracteres'
      });
    }
    const usernameClean = username.toLowerCase().trim();
    if (!/^[a-z0-9_]{3,30}$/.test(usernameClean)) {
      return res.status(400).json({
        error: 'O nome de utilizador deve ter 3–30 caracteres (letras, números e _)'
      });
    }
    const emailClean = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      return res.status(400).json({
        error: 'Endereço de e-mail inválido'
      });
    }
    const targetRole = role === 'CREATOR' ? 'CREATOR' : 'STUDENT';
    const cleanUsername = usernameClean;
    const cleanEmail = emailClean;
    const existing = queryOne('SELECT id FROM users WHERE email = ? OR username = ?', [cleanEmail, cleanUsername]);
    if (existing) {
      return res.status(400).json({
        error: 'Já existe uma conta com este e-mail ou nome de utilizador'
      });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`;
    transaction(() => {
      execute(`INSERT INTO users (id, email, username, passwordHash, name, role, avatarUrl, bio, location, streakDays, dailyGoalMinutes, minutesToday, totalMinutes, xp, level, isSuspended, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, '', '', 0, 45, 0, 0, 0, 1, 0, ?, ?)`, [userId, cleanEmail, cleanUsername, passwordHash, name, targetRole, avatarUrl, now, now]);
      execute(`INSERT INTO profiles (id, userId, headline, isPublic, showStreak, showLeaderboard, themePreference)
         VALUES (?, ?, '', 1, 1, 1, 'light')`, [`prof-${userId}`, userId]);
      execute(`INSERT INTO notifications (id, userId, type, title, content, link, isRead, createdAt)
         VALUES (?, ?, 'achievement', 'Bem-vindo ao LearnSpace!', 'Explore o catálogo de cursos e junte-se aos espaços da comunidade.', '/explore', 0, ?)`, [`notif-${Date.now()}`, userId, now]);
    });
    const user = {
      id: userId,
      name,
      username: cleanUsername,
      email: cleanEmail,
      role: targetRole,
      avatarUrl,
      xp: 0,
      level: 1,
      streakDays: 0
    };
    const token = generateToken(user);
    return res.status(201).json({
      user,
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      error: 'Falha ao criar conta no servidor'
    });
  }
});
router.post('/login', async (req, res) => {
  try {
    const {
      login,
      password
    } = req.body;
    if (!login || !password) {
      return res.status(400).json({
        error: 'Nome de utilizador/Email e palavra-passe são obrigatórios'
      });
    }
    const cleanLogin = login.toLowerCase().trim();
    const user = queryOne(`SELECT u.*, p.headline, p.website, p.github, p.twitter, p.linkedin, p.themePreference
       FROM users u
       LEFT JOIN profiles p ON u.id = p.userId
       WHERE u.email = ? OR u.username = ?`, [cleanLogin, cleanLogin]);
    if (!user) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }
    if (user.isSuspended) {
      return res.status(403).json({
        error: 'Esta conta foi suspensa pela administração.'
      });
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }
    const token = generateToken(user);
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        location: user.location,
        xp: user.xp,
        level: user.level,
        streakDays: user.streakDays,
        dailyGoalMinutes: user.dailyGoalMinutes,
        minutesToday: user.minutesToday,
        profile: {
          headline: user.headline,
          website: user.website,
          github: user.github,
          twitter: user.twitter,
          linkedin: user.linkedin,
          themePreference: user.themePreference
        }
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      error: 'Falha na autenticação'
    });
  }
});
router.get('/demo/:role', async (req, res) => {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_LOGIN !== 'true') {
    return res.status(403).json({
      error: 'Acesso de demonstração desativado por motivos de segurança. Por favor, autentique-se com credenciais reais.'
    });
  }
  try {
    const {
      role
    } = req.params;
    let username = 'aluno';
    if (role === 'creator') username = 'sarah_dev';
    if (role === 'admin') username = 'alex_admin';
    let user = queryOne(`SELECT u.*, p.headline, p.website, p.github, p.twitter, p.linkedin, p.themePreference
       FROM users u
       LEFT JOIN profiles p ON u.id = p.userId
       WHERE u.username = ?`, [username]);
    if (!user && role === 'student') {
      user = queryOne(`SELECT u.*, p.headline, p.website, p.github, p.twitter, p.linkedin, p.themePreference
         FROM users u
         LEFT JOIN profiles p ON u.id = p.userId
         WHERE u.username = 'pedro'`);
    }
    if (!user) {
      return res.status(404).json({
        error: 'Conta de demonstração não encontrada'
      });
    }
    const token = generateToken(user);
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        location: user.location,
        xp: user.xp,
        level: user.level,
        streakDays: user.streakDays,
        dailyGoalMinutes: user.dailyGoalMinutes,
        minutesToday: user.minutesToday,
        profile: {
          headline: user.headline,
          website: user.website,
          github: user.github,
          twitter: user.twitter,
          linkedin: user.linkedin,
          themePreference: user.themePreference
        }
      },
      token
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao carregar conta de demonstração'
    });
  }
});
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = queryOne(`SELECT u.*, p.headline, p.website, p.github, p.twitter, p.linkedin, p.bannerUrl, p.themePreference,
       (SELECT COUNT(*) FROM user_achievements WHERE userId = u.id) as achievementsCount
       FROM users u
       LEFT JOIN profiles p ON u.id = p.userId
       WHERE u.id = ?`, [req.user.id]);
    if (!user) {
      return res.status(404).json({
        error: 'Utilizador não encontrado'
      });
    }
    return res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      xp: user.xp,
      level: user.level,
      streakDays: user.streakDays,
      dailyGoalMinutes: user.dailyGoalMinutes,
      minutesToday: user.minutesToday,
      totalMinutes: user.totalMinutes,
      profile: {
        headline: user.headline,
        website: user.website,
        github: user.github,
        twitter: user.twitter,
        linkedin: user.linkedin,
        bannerUrl: user.bannerUrl,
        themePreference: user.themePreference
      },
      achievementsCount: user.achievementsCount || 0,
      createdAt: user.createdAt
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao obter perfil'
    });
  }
});
router.put('/profile', authenticate, async (req, res) => {
  try {
    const {
      name,
      bio,
      location,
      avatarUrl,
      headline,
      github,
      twitter,
      linkedin,
      website,
      bannerUrl,
      themePreference
    } = req.body;
    const now = new Date().toISOString();
    if (avatarUrl && typeof avatarUrl === 'string') {
      const isDataUrl = avatarUrl.startsWith('data:image/');
      const isHttpUrl = avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://');
      if (!isDataUrl && !isHttpUrl) {
        return res.status(400).json({
          error: 'URL de avatar inválido'
        });
      }
      if (isDataUrl && avatarUrl.length > 2_800_000) {
        return res.status(400).json({
          error: 'A imagem de perfil não pode exceder 2MB'
        });
      }
    }
    if (bannerUrl && typeof bannerUrl === 'string') {
      const isDataUrl = bannerUrl.startsWith('data:image/');
      const isHttpUrl = bannerUrl.startsWith('http://') || bannerUrl.startsWith('https://');
      const isPreset = bannerUrl.startsWith('gradient-');
      if (!isDataUrl && !isHttpUrl && !isPreset) {
        return res.status(400).json({
          error: 'URL de banner inválido'
        });
      }
      if (isDataUrl && bannerUrl.length > 2_800_000) {
        return res.status(400).json({
          error: 'A imagem de banner não pode exceder 2MB'
        });
      }
    }
    transaction(() => {
      execute(`UPDATE users SET name = COALESCE(?, name), bio = COALESCE(?, bio), location = COALESCE(?, location), avatarUrl = COALESCE(?, avatarUrl), updatedAt = ? WHERE id = ?`, [name || null, bio || null, location || null, avatarUrl || null, now, req.user.id]);
      try {
        execute(`ALTER TABLE profiles ADD COLUMN bannerUrl TEXT`, []);
      } catch (_) {}
      const profileExists = queryOne('SELECT id FROM profiles WHERE userId = ?', [req.user.id]);
      if (profileExists) {
        execute(`UPDATE profiles SET
            headline = COALESCE(?, headline),
            github = COALESCE(?, github),
            twitter = COALESCE(?, twitter),
            linkedin = COALESCE(?, linkedin),
            website = COALESCE(?, website),
            bannerUrl = COALESCE(?, bannerUrl),
            themePreference = COALESCE(?, themePreference)
           WHERE userId = ?`, [headline || null, github || null, twitter || null, linkedin || null, website || null, bannerUrl || null, themePreference || null, req.user.id]);
      } else {
        execute(`INSERT INTO profiles (id, userId, headline, github, twitter, linkedin, website, bannerUrl, themePreference)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [`prof-${req.user.id}`, req.user.id, headline, github, twitter, linkedin, website, bannerUrl, themePreference || 'light']);
      }
    });
    const updated = queryOne(`SELECT u.*, p.headline, p.website, p.github, p.twitter, p.linkedin, p.bannerUrl, p.themePreference
       FROM users u
       LEFT JOIN profiles p ON u.id = p.userId
       WHERE u.id = ?`, [req.user.id]);
    return res.json({
      user: {
        ...updated,
        profile: {
          headline: updated?.headline,
          website: updated?.website,
          github: updated?.github,
          twitter: updated?.twitter,
          linkedin: updated?.linkedin,
          bannerUrl: updated?.bannerUrl,
          themePreference: updated?.themePreference
        }
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao atualizar perfil'
    });
  }
});
router.post('/profile/clear-field', authenticate, async (req, res) => {
  try {
    const {
      field
    } = req.body;
    if (!['avatarUrl', 'bannerUrl'].includes(field)) {
      return res.status(400).json({
        error: 'Campo inválido'
      });
    }
    const now = new Date().toISOString();
    if (field === 'avatarUrl') {
      execute(`UPDATE users SET avatarUrl = NULL, updatedAt = ? WHERE id = ?`, [now, req.user.id]);
    } else {
      execute(`UPDATE profiles SET bannerUrl = NULL WHERE userId = ?`, [req.user.id]);
    }
    return res.json({
      success: true
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Falha ao limpar campo'
    });
  }
});
router.post('/forgot-password', async (req, res) => {
  const {
    email
  } = req.body;
  return res.json({
    message: `Ligação de recuperação enviada para ${email || 'o seu e-mail'}.`
  });
});
export default router;