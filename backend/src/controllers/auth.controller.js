import { validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { signJwtToken } from '../middleware/auth.js';
import { queryOne, execute } from '../database/connection.js';

const generateToken = (user) => signJwtToken(user);

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      message: errors.array()[0]?.msg || 'Dados de registo inválidos.',
      error: errors.array()[0]?.msg || 'Dados de registo inválidos.'
    });
  }

  try {
    const { name, username, email, password, avatarUrl } = req.body;

    const existingEmail = User.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        message: 'Email já registado no sistema.',
        error: 'Email já registado no sistema.'
      });
    }

    const existingUser = User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        message: 'Nome de utilizador já se encontra em uso.',
        error: 'Nome de utilizador já se encontra em uso.'
      });
    }

    // Registo de conta é sempre como aluno
    const newUser = await User.create({ name, username, email, password, avatarUrl, role: 'STUDENT' });
    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Utilizador registado com sucesso.',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      message: 'Falha ao registar utilizador no servidor.',
      error: 'Falha ao registar utilizador no servidor.'
    });
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      message: errors.array()[0]?.msg || 'Preencha os dados de início de sessão.',
      error: errors.array()[0]?.msg || 'Preencha os dados de início de sessão.'
    });
  }

  try {
    const loginIdentifier = (req.body.login || req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    const user = queryOne(
      `SELECT id, email, nome_utilizador AS username, hash_palavra_passe AS passwordHash,
              nome AS name, papel AS role, url_avatar AS avatarUrl, biografia AS bio,
              localizacao AS location, dias_sequencia AS streakDays, data_ultima_atividade AS lastActiveDate,
              meta_diaria_minutos AS dailyGoalMinutes, minutos_hoje AS minutesToday,
              minutos_totais AS totalMinutes, xp, nivel AS level, esta_suspenso AS isSuspended
       FROM utilizadores
       WHERE LOWER(email) = ? OR LOWER(nome_utilizador) = ?`,
      [loginIdentifier, loginIdentifier]
    );

    if (!user) {
      return res.status(401).json({
        message: 'Credenciais inválidas. Verifique o email/utilizador e palavra-passe.',
        error: 'Credenciais inválidas. Verifique o email/utilizador e palavra-passe.'
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        message: 'Esta conta encontra-se suspensa pela administração.',
        error: 'Esta conta encontra-se suspensa pela administração.'
      });
    }

    const isMatch = await User.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Credenciais inválidas. Verifique o email/utilizador e palavra-passe.',
        error: 'Credenciais inválidas. Verifique o email/utilizador e palavra-passe.'
      });
    }

    // Update streak and last active date
    const today = new Date().toISOString().split('T')[0];
    if (user.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak = user.lastActiveDate === yesterday ? user.streakDays + 1 : 1;
      execute(
        'UPDATE utilizadores SET dias_sequencia = ?, data_ultima_atividade = ?, minutos_hoje = 0, atualizado_em = ? WHERE id = ?',
        [newStreak, today, new Date().toISOString(), user.id]
      );
      user.streakDays = newStreak;
    }

    const tokenUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      isAdmin: user.role === 'ADMIN',
      avatarUrl: user.avatarUrl,
      xp: user.xp,
      level: user.level,
      streakDays: user.streakDays
    };

    const token = generateToken(tokenUser);

    return res.json({
      message: 'Sessão iniciada com sucesso.',
      token,
      user: tokenUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      message: 'Erro interno ao autenticar utilizador.',
      error: 'Erro interno ao autenticar utilizador.'
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = queryOne(
      `SELECT id, email, nome_utilizador AS username, nome AS name, papel AS role,
              url_avatar AS avatarUrl, biografia AS bio, localizacao AS location,
              dias_sequencia AS streakDays, meta_diaria_minutos AS dailyGoalMinutes,
              minutos_hoje AS minutesToday, minutos_totais AS totalMinutes,
              xp, nivel AS level, esta_suspenso AS isSuspended
       FROM utilizadores
       WHERE id = ?`,
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.', error: 'Utilizador não encontrado.' });
    }

    const profile = queryOne(
      `SELECT titulo_perfil AS headline, website, github, twitter, linkedin, instagram,
              url_banner AS bannerUrl, e_publico AS isPublic, preferencia_tema AS themePreference
       FROM perfis
       WHERE id_utilizador = ?`,
      [user.id]
    ) || {};

    const safeUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      isAdmin: user.role === 'ADMIN',
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      streakDays: user.streakDays,
      dailyGoalMinutes: user.dailyGoalMinutes,
      minutesToday: user.minutesToday,
      totalMinutes: user.totalMinutes,
      xp: user.xp,
      level: user.level,
      profile: {
        headline: profile.headline || '',
        website: profile.website || '',
        github: profile.github || '',
        twitter: profile.twitter || '',
        linkedin: profile.linkedin || '',
        instagram: profile.instagram || '',
        bannerUrl: profile.bannerUrl || '',
        isPublic: Boolean(profile.isPublic !== 0),
        themePreference: profile.themePreference || 'light'
      }
    };

    return res.json({ user: safeUser, ...safeUser });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ message: 'Erro ao carregar dados do utilizador.', error: 'Erro ao carregar dados do utilizador.' });
  }
};

export const demoLogin = async (req, res) => {
  const { role = 'student' } = req.params;
  const targetRole = role.toUpperCase();

  const user = queryOne(
    `SELECT id, email, nome_utilizador AS username, nome AS name, papel AS role,
            url_avatar AS avatarUrl, xp, nivel AS level, dias_sequencia AS streakDays
     FROM utilizadores
     WHERE papel = ?
     LIMIT 1`,
    [targetRole]
  ) || queryOne(
    `SELECT id, email, nome_utilizador AS username, nome AS name, papel AS role,
            url_avatar AS avatarUrl, xp, nivel AS level, dias_sequencia AS streakDays
     FROM utilizadores
     LIMIT 1`
  );

  if (!user) {
    return res.status(404).json({ message: 'Conta demo não encontrada.', error: 'Conta demo não encontrada.' });
  }

  const tokenUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    isAdmin: user.role === 'ADMIN',
    avatarUrl: user.avatarUrl,
    xp: user.xp,
    level: user.level,
    streakDays: user.streakDays
  };

  const token = generateToken(tokenUser);
  return res.json({ token, user: tokenUser });
};

export default { register, login, getMe, demoLogin };
