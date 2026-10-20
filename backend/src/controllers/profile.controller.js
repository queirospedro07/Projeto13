const Profile = require('../models/Profile.js');
const { isSafeImage, isSafeBanner } = require('../validation/content.js');
const {
  getProfileSocialLinks,
  saveProfileSocialLinks,
  validateSocialLinks,
} = require('../models/ProfileSocials.js');
const { createHash, randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');
const { transaction } = require('../database/connection.js');
const {
  hasEmailTransport,
  sendPasswordResetEmail,
  verifyEmailTransport,
} = require('../config/email.js');
const recoveryMessage =
  'Se existir uma conta associada a este email, receberá instruções para redefinir a palavra-passe.';
function getFrontendUrl() {
  const configuredUrl = (process.env.CLIENT_URL || process.env.FRONTEND_URL || '')
    .split(',')[0]
    .trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '');
  return process.env.NODE_ENV === 'production' ? null : 'http://localhost:5173';
}
const hashResetToken = (token) => createHash('sha256').update(token).digest('hex');

// GET /auth/user/:identifier — Perfil público de um utilizador
const getProfileUserByIdentifier = async (req, res) => {
  try {
    const cleanId = (req.params.identifier || '').trim();
    if (!cleanId)
      return res.status(400).json({
        error: 'Identificador obrigatório',
      });
    const cleanLower = cleanId.toLowerCase();
    const user = await Profile.findUserById([cleanLower, cleanId]);
    if (!user)
      return res.status(404).json({
        error: 'Utilizador não encontrado',
      });
    const isSelf = req.user && req.user.id === user.id;
    const isPublic = user.isPublic !== 0;
    const showBio = user.showBio !== 0;
    const showLocation = user.showLocation !== 0;
    const showSocials = user.showSocials !== 0;
    const showStats = user.showStats !== 0;
    if (!isSelf && !isPublic) {
      return res.json({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isPrivateProfile: true,
        profile: {
          bannerUrl: user.bannerUrl,
          isPublic: 0,
        },
        createdAt: user.createdAt,
      });
    }
    return res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: !isSelf && !showBio ? null : user.bio,
      location: !isSelf && !showLocation ? null : user.location,
      dailyGoalMinutes: !isSelf && !showStats ? 0 : user.dailyGoalMinutes,
      minutesToday: !isSelf && !showStats ? 0 : user.minutesToday,
      totalMinutes: !isSelf && !showStats ? 0 : user.totalMinutes,
      profile: {
        headline: !isSelf && !showBio ? null : user.headline,
        socialLinks: !isSelf && !showSocials ? {} : await getProfileSocialLinks(user.id),
        website: !isSelf && !showSocials ? null : user.website,
        github: !isSelf && !showSocials ? null : user.github,
        linkedin: !isSelf && !showSocials ? null : user.linkedin,
        bannerUrl: user.bannerUrl,
        themePreference: user.themePreference,
        isPublic: user.isPublic !== 0 ? 1 : 0,
        showBio: user.showBio !== 0 ? 1 : 0,
        showLocation: user.showLocation !== 0 ? 1 : 0,
        showSocials: user.showSocials !== 0 ? 1 : 0,
        showStats: user.showStats !== 0 ? 1 : 0,
        showCourses: user.showCourses !== 0 ? 1 : 0,
      },
      courses: await (async () => {
        const showCourses = user.showCourses !== 0;
        if (!isSelf && !showCourses) return [];
        const enrollmentRows = await Profile.listEnrollmentRowsByUserId([user.id]);
        return enrollmentRows
          .filter((r) => isSelf || r.isHidden !== 1)
          .map((r) => ({
            id: r.enrollmentId,
            courseId: r.id,
            progressPercent: r.progressPercent || 0,
            completedAt: r.completedAt,
            isHidden: r.isHidden === 1,
            course: {
              id: r.id,
              title: r.title,
              slug: r.slug,
              description: r.description,
              category: r.category,
              thumbnailUrl: r.thumbnailUrl,
              bannerUrl: r.bannerUrl,
              durationHours: r.durationHours,
            },
          }));
      })(),
      createdAt: user.createdAt,
    });
  } catch {
    return res.status(500).json({
      error: 'Falha ao carregar perfil do utilizador',
    });
  }
};
const putProfileProfile = async (req, res) => {
  try {
    const {
      name,
      bio,
      location,
      avatarUrl,
      headline,
      github,
      linkedin,
      website,
      bannerUrl,
      socialLinks,
      themePreference,
      isPublic,
      showBio,
      showLocation,
      showSocials,
      showStats,
      showCourses,
    } = req.body;
    let cleanSocialLinks;
    if (socialLinks !== undefined) {
      try {
        cleanSocialLinks = validateSocialLinks(socialLinks);
      } catch (error) {
        return res.status(400).json({
          error: error.message,
        });
      }
    }
    if (
      name !== undefined &&
      (typeof name !== 'string' || !name.trim() || name.trim().length > 100)
    ) {
      return res.status(400).json({
        error: 'O nome deve ter entre 1 e 100 caracteres.',
      });
    }
    for (const [label, value, limit] of [
      ['Biografia', bio, 500],
      ['Título', headline, 120],
      ['Localização', location, 100],
    ]) {
      if (value !== undefined && (typeof value !== 'string' || value.length > limit))
        return res.status(400).json({
          error: label + ': limite de ' + limit + ' caracteres.',
        });
    }
    const now = new Date().toISOString();
    if (avatarUrl !== undefined && !isSafeImage(avatarUrl))
      return res.status(400).json({
        error: 'Imagem de perfil inválida. Use JPG, PNG ou WebP, ou um link http/https.',
      });
    if (bannerUrl !== undefined && !isSafeBanner(bannerUrl))
      return res.status(400).json({
        error: 'Capa inválida. Use uma imagem, uma cor ou um dos gradientes disponíveis.',
      });
    for (const value of [isPublic, showBio, showLocation, showSocials, showStats, showCourses])
      if (value !== undefined && ![true, false, 0, 1].includes(value))
        return res.status(400).json({
          error: 'Opção de privacidade inválida.',
        });
    await transaction(async () => {
      await Profile.updateUtilizadoresByAtualizadoEmAndId([
        name || null,
        bio !== undefined ? 1 : 0,
        bio ?? null,
        location !== undefined ? 1 : 0,
        location ?? null,
        avatarUrl !== undefined ? 1 : 0,
        avatarUrl || null,
        now,
        req.user.id,
      ]);
      const profileExists = await Profile.findProfileExistsByIdUtilizador([req.user.id]);
      if (profileExists) {
        await Profile.updatePerfisByIdUtilizador([
          headline !== undefined ? 1 : 0,
          headline ?? null,
          github !== undefined ? 1 : 0,
          github ?? null,
          linkedin !== undefined ? 1 : 0,
          linkedin ?? null,
          website !== undefined ? 1 : 0,
          website ?? null,
          bannerUrl !== undefined ? 1 : 0,
          bannerUrl || null,
          themePreference || null,
          isPublic !== undefined ? (isPublic ? 1 : 0) : null,
          showBio !== undefined ? (showBio ? 1 : 0) : null,
          showLocation !== undefined ? (showLocation ? 1 : 0) : null,
          showSocials !== undefined ? (showSocials ? 1 : 0) : null,
          showStats !== undefined ? (showStats ? 1 : 0) : null,
          showCourses !== undefined ? (showCourses ? 1 : 0) : null,
          req.user.id,
        ]);
      } else {
        await Profile.insertProfiles([
          `prof-${req.user.id}`,
          req.user.id,
          headline ?? null,
          github ?? null,
          linkedin ?? null,
          website ?? null,
          bannerUrl ?? null,
          themePreference || 'light',
          isPublic !== undefined ? (isPublic ? 1 : 0) : 1,
          showBio !== undefined ? (showBio ? 1 : 0) : 1,
          showLocation !== undefined ? (showLocation ? 1 : 0) : 1,
          showSocials !== undefined ? (showSocials ? 1 : 0) : 1,
          showStats !== undefined ? (showStats ? 1 : 0) : 1,
          showCourses !== undefined ? (showCourses ? 1 : 0) : 1,
        ]);
      }
      if (cleanSocialLinks !== undefined)
        await saveProfileSocialLinks(req.user.id, cleanSocialLinks);
    });
    const updated = await Profile.findUpdatedById([req.user.id]);
    return res.json({
      user: {
        ...updated,
        profile: {
          socialLinks: await getProfileSocialLinks(req.user.id),
          headline: updated?.headline,
          website: updated?.website,
          github: updated?.github,
          linkedin: updated?.linkedin,
          bannerUrl: updated?.bannerUrl,
          themePreference: updated?.themePreference,
          isPublic: updated?.isPublic !== 0 ? 1 : 0,
          showBio: updated?.showBio !== 0 ? 1 : 0,
          showLocation: updated?.showLocation !== 0 ? 1 : 0,
          showSocials: updated?.showSocials !== 0 ? 1 : 0,
          showStats: updated?.showStats !== 0 ? 1 : 0,
          showCourses: updated?.showCourses !== 0 ? 1 : 0,
        },
      },
    });
  } catch (err) {
    console.error('Falha ao atualizar perfil:', err.message);
    return res.status(500).json({
      error: 'Falha ao atualizar perfil',
    });
  }
};
const postProfileProfileClearField = async (req, res) => {
  try {
    const { field } = req.body;
    if (!['avatarUrl', 'bannerUrl'].includes(field))
      return res.status(400).json({
        error: 'Campo inválido',
      });
    const now = new Date().toISOString();
    if (field === 'avatarUrl') {
      await Profile.updateUtilizadoresByAtualizadoEmAndIdForPostProfileProfileClearField([
        now,
        req.user.id,
      ]);
    } else {
      await Profile.updatePerfisByIdUtilizadorForPostProfileProfileClearField([req.user.id]);
    }
    return res.json({
      success: true,
    });
  } catch {
    return res.status(500).json({
      error: 'Falha ao limpar campo',
    });
  }
};
const postProfileForgotPassword = async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      message: 'Introduza um endereço de email válido.',
    });
  }
  const frontendUrl = getFrontendUrl();
  const smtpConfigured = hasEmailTransport();
  const localDevelopmentReset =
    process.env.NODE_ENV === 'development' &&
    process.env.ENABLE_DEV_PASSWORD_RESET === 'true' &&
    ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.ip);
  if (!frontendUrl || (!smtpConfigured && !localDevelopmentReset)) {
    return res.status(503).json({
      message: 'A recuperação de palavra-passe está temporariamente indisponível.',
    });
  }
  if (smtpConfigured) {
    try {
      await verifyEmailTransport();
    } catch (error) {
      console.error('SMTP transport verification failed:', error.message);
      return res.status(503).json({
        message: 'O serviço de email está indisponível. Verifique a configuração SMTP.',
      });
    }
  }
  try {
    const userResult = await Profile.findUserResult([email]);
    const user = userResult.rows?.[0];
    if (!user)
      return res.json({
        message: recoveryMessage,
      });
    const token = randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await Profile.findPasswordResetTokensByUserId([user.id]);
    await Profile.findPasswordResetTokens([
      `reset-${randomBytes(12).toString('hex')}`,
      user.id,
      tokenHash,
      expiresAt,
      now.toISOString(),
    ]);
    if (!smtpConfigured && process.env.NODE_ENV !== 'production') {
      return res.json({
        message: recoveryMessage,
        devResetUrl: resetUrl,
      });
    }
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (error) {
      console.error('Password reset email failed:', error.message);
      await Profile.findPasswordResetTokensByTokenHash([tokenHash]);
      return res.status(503).json({
        message: 'Não foi possível enviar o email de recuperação. Tente novamente mais tarde.',
      });
    }
    return res.json({
      message: recoveryMessage,
    });
  } catch (error) {
    console.error('Password reset request failed:', error.message);
    return res.status(500).json({
      message: 'Não foi possível processar o pedido. Tente novamente mais tarde.',
    });
  }
};
const postProfileResetPassword = async (req, res) => {
  const { token, password } = req.body || {};
  if (typeof token !== 'string' || !/^[a-f\d]{64}$/i.test(token)) {
    return res.status(400).json({
      message: 'A ligação é inválida ou expirou. Peça uma nova ligação.',
    });
  }
  if (
    typeof password !== 'string' ||
    password.length < 12 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({
      message: 'A palavra-passe deve ter pelo menos 12 caracteres e não exceder 72 bytes.',
    });
  }
  try {
    const tokenHash = hashResetToken(token);
    const tokenResult = await Profile.findTokenResultByTokenHash([tokenHash]);
    const resetRecord = tokenResult.rows?.[0];
    if (
      !resetRecord ||
      !Number.isFinite(Date.parse(resetRecord.expires_at)) ||
      Date.parse(resetRecord.expires_at) <= Date.now()
    ) {
      if (resetRecord) await Profile.findPasswordResetTokensByTokenHash([tokenHash]);
      return res.status(400).json({
        message: 'A ligação é inválida ou expirou. Peça uma nova ligação.',
      });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const changed = await transaction(async () => {
      const consumed = await Profile.deleteConsumedByHashToken([
        tokenHash,
        new Date().toISOString(),
      ]);
      if (Number(consumed.changes) !== 1) return false;
      await Profile.updateUtilizadoresByHashPalavraPasseAndAtualizadoEmAndId([
        passwordHash,
        new Date().toISOString(),
        resetRecord.user_id,
      ]);
      return true;
    });
    if (!changed)
      return res.status(400).json({
        message: 'A ligação é inválida ou expirou. Peça uma nova ligação.',
      });
    req.app
      .get('io')
      ?.in('user_' + resetRecord.user_id)
      .disconnectSockets(true);
    return res.json({
      message: 'Palavra-passe atualizada. Já pode iniciar sessão.',
    });
  } catch (error) {
    console.error('Password reset failed:', error.message);
    return res.status(500).json({
      message: 'Não foi possível redefinir a palavra-passe. Tente novamente.',
    });
  }
};
exports.getProfileUserByIdentifier = getProfileUserByIdentifier;
exports.putProfileProfile = putProfileProfile;
exports.postProfileProfileClearField = postProfileProfileClearField;
exports.postProfileForgotPassword = postProfileForgotPassword;
exports.postProfileResetPassword = postProfileResetPassword;
