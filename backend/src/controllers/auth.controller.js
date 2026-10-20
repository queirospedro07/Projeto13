const Auth = require('../models/Auth.js');
const { getProfileSocialLinks } = require('../models/ProfileSocials.js');
const { validationResult } = require('express-validator');
const User = require('../models/User.js');
const { signJwtToken } = require('../middleware/auth.js');
const generateToken = (user) => signJwtToken(user);
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      message: errors.array()[0]?.msg || 'Dados de registo inválidos.',
      error: errors.array()[0]?.msg || 'Dados de registo inválidos.',
    });
  }
  try {
    const { name, username, email, password } = req.body;
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        message: 'Email já registado no sistema.',
        error: 'Email já registado no sistema.',
      });
    }
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        message: 'Nome de utilizador já se encontra em uso.',
        error: 'Nome de utilizador já se encontra em uso.',
      });
    }

    // Registo de conta é sempre como aluno
    const newUser = await User.create({
      name,
      username,
      email,
      password,
      role: 'STUDENT',
      acceptedTerms: true,
    });
    const token = generateToken(newUser);
    return res.status(201).json({
      message: 'Utilizador registado com sucesso.',
      token,
      user: newUser,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      message: 'Falha ao registar utilizador no servidor.',
      error: 'Falha ao registar utilizador no servidor.',
    });
  }
};
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      message: errors.array()[0]?.msg || 'Preencha os dados de início de sessão.',
      error: errors.array()[0]?.msg || 'Preencha os dados de início de sessão.',
    });
  }
  try {
    const loginIdentifier = (typeof req.body.login === 'string' ? req.body.login : req.body.email)
      .trim()
      .toLowerCase();
    if (loginIdentifier.length > 254)
      return res.status(400).json({
        error: 'Email ou nome de utilizador inválido.',
      });
    const { password } = req.body;
    const user = await Auth.findUser([loginIdentifier, loginIdentifier]);
    if (!user) {
      return res.status(401).json({
        message: 'Credenciais inválidas. Verifique o email/utilizador e palavra-passe.',
        error: 'Credenciais inválidas. Verifique o email/utilizador e palavra-passe.',
      });
    }
    if (Number(user.isSuspended) === 1) {
      return res.status(403).json({
        message: 'Esta conta encontra-se suspensa pela administração.',
        error: 'Esta conta encontra-se suspensa pela administração.',
      });
    }
    const isMatch = await User.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Credenciais inválidas. Verifique o email/utilizador e palavra-passe.',
        error: 'Credenciais inválidas. Verifique o email/utilizador e palavra-passe.',
      });
    }
    const tokenUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      isTeacher: user.isTeacher,
      isAdmin: user.role === 'ADMIN',
      avatarUrl: user.avatarUrl,
    };
    const token = generateToken({
      ...tokenUser,
      authVersion: user.authVersion,
    });
    return res.json({
      message: 'Sessão iniciada com sucesso.',
      token,
      user: tokenUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      message: 'Erro interno ao autenticar utilizador.',
      error: 'Erro interno ao autenticar utilizador.',
    });
  }
};
const getMe = async (req, res) => {
  try {
    const user = await Auth.findUserById([req.user.id]);
    if (!user) {
      return res.status(404).json({
        message: 'Utilizador não encontrado.',
        error: 'Utilizador não encontrado.',
      });
    }
    const profile = (await Auth.findPerfisByIdUtilizador([user.id])) || {};
    const safeUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      isTeacher: user.isTeacher,
      isAdmin: user.role === 'ADMIN',
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      dailyGoalMinutes: user.dailyGoalMinutes,
      minutesToday: user.minutesToday,
      totalMinutes: user.totalMinutes,
      profile: {
        socialLinks: await getProfileSocialLinks(user.id),
        headline: profile.headline || '',
        website: profile.website || '',
        github: profile.github || '',
        linkedin: profile.linkedin || '',
        bannerUrl: profile.bannerUrl || '',
        isPublic: Boolean(profile.isPublic !== 0),
        showBio: profile.showBio !== 0 ? 1 : 0,
        showLocation: profile.showLocation !== 0 ? 1 : 0,
        showSocials: profile.showSocials !== 0 ? 1 : 0,
        showStats: profile.showStats !== 0 ? 1 : 0,
        showCourses: profile.showCourses !== 0 ? 1 : 0,
        themePreference: profile.themePreference || 'light',
      },
    };
    return res.json({
      user: safeUser,
      ...safeUser,
    });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({
      message: 'Erro ao carregar dados do utilizador.',
      error: 'Erro ao carregar dados do utilizador.',
    });
  }
};
const demoLogin = async (req, res) => {
  if (process.env.NODE_ENV !== 'development' || process.env.ENABLE_DEMO_LOGIN !== 'true') {
    return res.status(403).json({
      message: 'Modo de demonstração desativado.',
      error: 'Modo de demonstração desativado.',
    });
  }
  const { role = 'student' } = req.params;
  const targetRole = String(role).toUpperCase();
  if (!['STUDENT', 'CREATOR'].includes(targetRole)) {
    return res.status(400).json({
      message: 'Perfil de demonstração inválido.',
      error: 'Perfil de demonstração inválido.',
    });
  }
  const user = await Auth.findUserByPapelAndId([
    targetRole,
    targetRole === 'CREATOR' ? 'demo-creator-sofia' : 'demo-student-marta',
  ]);
  if (!user) {
    return res.status(404).json({
      message: 'Conta de demonstração não encontrada.',
      error: 'Conta de demonstração não encontrada.',
    });
  }
  const tokenUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    isAdmin: user.role === 'ADMIN',
    avatarUrl: user.avatarUrl,
    authVersion: user.authVersion,
  };
  const token = generateToken(tokenUser);
  return res.json({
    token,
    user: tokenUser,
  });
};
exports.register = register;
exports.login = login;
exports.getMe = getMe;
exports.demoLogin = demoLogin;
