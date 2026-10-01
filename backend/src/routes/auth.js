// Rotas de perfil e utilizador — montadas via auth.routes.js
// Rotas de autenticação (register, login, me, demo) estão em auth.routes.js

import { Router } from 'express';
import { queryOne, execute, transaction } from '../database/connection.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /auth/user/:identifier — Perfil público de um utilizador
router.get('/user/:identifier', optionalAuth, async (req, res) => {
  try {
    const cleanId = (req.params.identifier || '').trim();
    if (!cleanId) return res.status(400).json({ error: 'Identificador obrigatório' });

    const cleanLower = cleanId.toLowerCase();
    const user = queryOne(`
      SELECT u.id, u.name, u.username, u.role, u.avatarUrl, u.bio, u.location,
             u.streakDays, u.xp, u.level, u.dailyGoalMinutes, u.minutesToday, u.totalMinutes, u.createdAt,
             p.headline, p.website, p.github, p.twitter, p.linkedin, p.instagram,
             p.youtube, p.tiktok, p.discord, p.twitch, p.bannerUrl, p.bannerPosition, p.themePreference,
             p.isPublic, p.showStreak, p.showLeaderboard, p.showBio, p.showLocation,
             p.showSocials, p.showStats, p.showCourses, p.showBadges,
             (SELECT COUNT(*) FROM user_achievements WHERE userId = u.id) as achievementsCount
      FROM users u
      LEFT JOIN profiles p ON u.id = p.userId
      WHERE LOWER(u.username) = ? OR u.id = ?
    `, [cleanLower, cleanId]);

    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });

    const isSelf = req.user && req.user.id === user.id;
    const isPublic    = user.isPublic    !== 0;
    const showBio     = user.showBio     !== 0;
    const showLocation= user.showLocation!== 0;
    const showSocials = user.showSocials !== 0;
    const showStats   = user.showStats   !== 0;
    const showStreak  = user.showStreak  !== 0;
    const showBadges  = user.showBadges  !== 0;

    if (!isSelf && !isPublic) {
      return res.json({
        id: user.id, name: user.name, username: user.username,
        role: user.role, avatarUrl: user.avatarUrl, isPrivateProfile: true,
        profile: { bannerUrl: user.bannerUrl, bannerPosition: user.bannerPosition || '50% 50%', isPublic: 0 },
        createdAt: user.createdAt
      });
    }

    return res.json({
      id: user.id, name: user.name, username: user.username,
      role: user.role, avatarUrl: user.avatarUrl,
      bio:      (!isSelf && !showBio)      ? null : user.bio,
      location: (!isSelf && !showLocation) ? null : user.location,
      xp:       (!isSelf && !showStats)    ? 0    : user.xp,
      level:    (!isSelf && !showStats)    ? 1    : user.level,
      streakDays:        (!isSelf && !showStreak) ? 0 : user.streakDays,
      dailyGoalMinutes:  (!isSelf && !showStats)  ? 0 : user.dailyGoalMinutes,
      minutesToday:      (!isSelf && !showStats)  ? 0 : user.minutesToday,
      totalMinutes:      (!isSelf && !showStats)  ? 0 : user.totalMinutes,
      profile: {
        headline:  (!isSelf && !showBio)     ? null : user.headline,
        website:   (!isSelf && !showSocials) ? null : user.website,
        github:    (!isSelf && !showSocials) ? null : user.github,
        twitter:   (!isSelf && !showSocials) ? null : user.twitter,
        linkedin:  (!isSelf && !showSocials) ? null : user.linkedin,
        instagram: (!isSelf && !showSocials) ? null : user.instagram,
        youtube:   (!isSelf && !showSocials) ? null : user.youtube,
        tiktok:    (!isSelf && !showSocials) ? null : user.tiktok,
        discord:   (!isSelf && !showSocials) ? null : user.discord,
        twitch:    (!isSelf && !showSocials) ? null : user.twitch,
        bannerUrl:        user.bannerUrl,
        bannerPosition:   user.bannerPosition || '50% 50%',
        themePreference:  user.themePreference,
        isPublic:         user.isPublic        !== 0 ? 1 : 0,
        showStreak:       user.showStreak       !== 0 ? 1 : 0,
        showLeaderboard:  user.showLeaderboard  !== 0 ? 1 : 0,
        showBio:          user.showBio          !== 0 ? 1 : 0,
        showLocation:     user.showLocation     !== 0 ? 1 : 0,
        showSocials:      user.showSocials      !== 0 ? 1 : 0,
        showStats:        user.showStats        !== 0 ? 1 : 0,
        showCourses:      user.showCourses      !== 0 ? 1 : 0,
        showBadges:       user.showBadges       !== 0 ? 1 : 0,
      },
      achievementsCount: (!isSelf && !showBadges) ? 0 : (user.achievementsCount || 0),
      createdAt: user.createdAt
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao carregar perfil do utilizador' });
  }
});

// PUT /auth/profile — Atualizar perfil do utilizador autenticado
router.put('/profile', authenticate, async (req, res) => {
  try {
    const {
      name, bio, location, avatarUrl, headline,
      github, twitter, linkedin, instagram, website, bannerUrl,
      bannerPosition, youtube, tiktok, discord, twitch, themePreference,
      isPublic, showStreak, showLeaderboard, showBio, showLocation,
      showSocials, showStats, showCourses, showBadges
    } = req.body;

    const now = new Date().toISOString();

    // Validar avatarUrl
    if (avatarUrl && typeof avatarUrl === 'string') {
      const ok = avatarUrl.startsWith('data:image/') || avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://');
      if (!ok) return res.status(400).json({ error: 'URL de avatar inválido' });
      if (avatarUrl.startsWith('data:image/') && avatarUrl.length > 2_800_000)
        return res.status(400).json({ error: 'A imagem de perfil não pode exceder 2MB' });
    }

    // Validar bannerUrl
    if (bannerUrl && typeof bannerUrl === 'string') {
      const ok = bannerUrl.startsWith('data:image/') || bannerUrl.startsWith('http://') ||
                 bannerUrl.startsWith('https://') || bannerUrl.startsWith('gradient-') ||
                 bannerUrl.startsWith('#') || bannerUrl.startsWith('rgb') ||
                 bannerUrl.startsWith('hsl') || bannerUrl.startsWith('linear-gradient');
      if (!ok) return res.status(400).json({ error: 'URL ou cor de banner inválida' });
      if (bannerUrl.startsWith('data:image/') && bannerUrl.length > 2_800_000)
        return res.status(400).json({ error: 'A imagem de banner não pode exceder 2MB' });
    }

    transaction(() => {
      execute(
        'UPDATE users SET name = COALESCE(?, name), bio = COALESCE(?, bio), location = COALESCE(?, location), avatarUrl = COALESCE(?, avatarUrl), updatedAt = ? WHERE id = ?',
        [name || null, bio || null, location || null, avatarUrl || null, now, req.user.id]
      );

      // Adicionar colunas em falta (migração incremental segura)
      const safeAlter = (sql) => { try { execute(sql, []); } catch (_) {} };
      safeAlter('ALTER TABLE profiles ADD COLUMN bannerUrl TEXT');
      safeAlter("ALTER TABLE profiles ADD COLUMN bannerPosition TEXT DEFAULT '50% 50%'");
      safeAlter('ALTER TABLE profiles ADD COLUMN instagram TEXT');
      safeAlter('ALTER TABLE profiles ADD COLUMN youtube TEXT');
      safeAlter('ALTER TABLE profiles ADD COLUMN tiktok TEXT');
      safeAlter('ALTER TABLE profiles ADD COLUMN discord TEXT');
      safeAlter('ALTER TABLE profiles ADD COLUMN twitch TEXT');
      safeAlter('ALTER TABLE profiles ADD COLUMN showBio INTEGER DEFAULT 1');
      safeAlter('ALTER TABLE profiles ADD COLUMN showLocation INTEGER DEFAULT 1');
      safeAlter('ALTER TABLE profiles ADD COLUMN showSocials INTEGER DEFAULT 1');
      safeAlter('ALTER TABLE profiles ADD COLUMN showStats INTEGER DEFAULT 1');
      safeAlter('ALTER TABLE profiles ADD COLUMN showCourses INTEGER DEFAULT 1');
      safeAlter('ALTER TABLE profiles ADD COLUMN showBadges INTEGER DEFAULT 1');

      const profileExists = queryOne('SELECT id FROM profiles WHERE userId = ?', [req.user.id]);
      if (profileExists) {
        execute(`UPDATE profiles SET
          headline = COALESCE(?, headline), github = COALESCE(?, github), twitter = COALESCE(?, twitter),
          linkedin = COALESCE(?, linkedin), instagram = COALESCE(?, instagram), youtube = COALESCE(?, youtube),
          tiktok = COALESCE(?, tiktok), discord = COALESCE(?, discord), twitch = COALESCE(?, twitch),
          website = COALESCE(?, website), bannerUrl = COALESCE(?, bannerUrl),
          bannerPosition = CASE WHEN ? IS NOT NULL THEN ? ELSE COALESCE(bannerPosition, '50% 50%') END,
          themePreference = COALESCE(?, themePreference),
          isPublic = COALESCE(?, isPublic), showStreak = COALESCE(?, showStreak),
          showLeaderboard = COALESCE(?, showLeaderboard), showBio = COALESCE(?, showBio),
          showLocation = COALESCE(?, showLocation), showSocials = COALESCE(?, showSocials),
          showStats = COALESCE(?, showStats), showCourses = COALESCE(?, showCourses),
          showBadges = COALESCE(?, showBadges)
          WHERE userId = ?`, [
          headline ?? null, github ?? null, twitter ?? null, linkedin ?? null,
          instagram ?? null, youtube ?? null, tiktok ?? null, discord ?? null, twitch ?? null,
          website ?? null, bannerUrl ?? null,
          bannerPosition ?? null, bannerPosition ?? null,
          themePreference || null,
          isPublic !== undefined ? (isPublic ? 1 : 0) : null,
          showStreak !== undefined ? (showStreak ? 1 : 0) : null,
          showLeaderboard !== undefined ? (showLeaderboard ? 1 : 0) : null,
          showBio !== undefined ? (showBio ? 1 : 0) : null,
          showLocation !== undefined ? (showLocation ? 1 : 0) : null,
          showSocials !== undefined ? (showSocials ? 1 : 0) : null,
          showStats !== undefined ? (showStats ? 1 : 0) : null,
          showCourses !== undefined ? (showCourses ? 1 : 0) : null,
          showBadges !== undefined ? (showBadges ? 1 : 0) : null,
          req.user.id
        ]);
      } else {
        execute(`INSERT INTO profiles
          (id, userId, headline, github, twitter, linkedin, instagram, youtube, tiktok, discord, twitch,
           website, bannerUrl, bannerPosition, themePreference,
           isPublic, showStreak, showLeaderboard, showBio, showLocation, showSocials, showStats, showCourses, showBadges)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          `prof-${req.user.id}`, req.user.id,
          headline, github, twitter, linkedin, instagram, youtube, tiktok, discord, twitch,
          website, bannerUrl, bannerPosition || '50% 50%', themePreference || 'light',
          isPublic  !== undefined ? (isPublic  ? 1 : 0) : 1,
          showStreak !== undefined ? (showStreak ? 1 : 0) : 1,
          showLeaderboard !== undefined ? (showLeaderboard ? 1 : 0) : 1,
          showBio !== undefined ? (showBio ? 1 : 0) : 1,
          showLocation !== undefined ? (showLocation ? 1 : 0) : 1,
          showSocials !== undefined ? (showSocials ? 1 : 0) : 1,
          showStats !== undefined ? (showStats ? 1 : 0) : 1,
          showCourses !== undefined ? (showCourses ? 1 : 0) : 1,
          showBadges !== undefined ? (showBadges ? 1 : 0) : 1
        ]);
      }
    });

    const updated = queryOne(`
      SELECT u.*, p.headline, p.website, p.github, p.twitter, p.linkedin, p.instagram,
             p.youtube, p.tiktok, p.discord, p.twitch, p.bannerUrl, p.bannerPosition, p.themePreference,
             p.isPublic, p.showStreak, p.showLeaderboard, p.showBio, p.showLocation,
             p.showSocials, p.showStats, p.showCourses, p.showBadges
      FROM users u LEFT JOIN profiles p ON u.id = p.userId
      WHERE u.id = ?
    `, [req.user.id]);

    return res.json({
      user: {
        ...updated,
        profile: {
          headline: updated?.headline,   website: updated?.website,
          github:   updated?.github,     twitter:  updated?.twitter,
          linkedin: updated?.linkedin,   instagram:updated?.instagram,
          youtube:  updated?.youtube,    tiktok:   updated?.tiktok,
          discord:  updated?.discord,    twitch:   updated?.twitch,
          bannerUrl:       updated?.bannerUrl,
          bannerPosition:  updated?.bannerPosition  || '50% 50%',
          themePreference: updated?.themePreference,
          isPublic:        updated?.isPublic        !== 0 ? 1 : 0,
          showStreak:      updated?.showStreak      !== 0 ? 1 : 0,
          showLeaderboard: updated?.showLeaderboard !== 0 ? 1 : 0,
          showBio:         updated?.showBio         !== 0 ? 1 : 0,
          showLocation:    updated?.showLocation    !== 0 ? 1 : 0,
          showSocials:     updated?.showSocials     !== 0 ? 1 : 0,
          showStats:       updated?.showStats       !== 0 ? 1 : 0,
          showCourses:     updated?.showCourses     !== 0 ? 1 : 0,
          showBadges:      updated?.showBadges      !== 0 ? 1 : 0,
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao atualizar perfil' });
  }
});

// POST /auth/profile/clear-field — Remover avatar ou banner
router.post('/profile/clear-field', authenticate, async (req, res) => {
  try {
    const { field } = req.body;
    if (!['avatarUrl', 'bannerUrl'].includes(field))
      return res.status(400).json({ error: 'Campo inválido' });

    const now = new Date().toISOString();
    if (field === 'avatarUrl') {
      execute('UPDATE users SET avatarUrl = NULL, updatedAt = ? WHERE id = ?', [now, req.user.id]);
    } else {
      execute('UPDATE profiles SET bannerUrl = NULL WHERE userId = ?', [req.user.id]);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao limpar campo' });
  }
});

// POST /auth/forgot-password — Placeholder de recuperação de palavra-passe
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email obrigatório' });
  // TODO: implementar envio real de email de recuperação
  return res.json({ message: `Ligação de recuperação enviada para ${email}.` });
});

export default router;
