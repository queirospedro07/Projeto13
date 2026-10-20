const Certificate = require('../models/Certificate.js');
const { issueCertificate } = require('../services/progress.js');
const getCertificateVerifyByCertificateId = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = await Certificate.findCertByIdAndCredentialId([certificateId, certificateId]);
    if (!cert) {
      return res.status(404).json({
        error: 'Certificado não encontrado ou identificador inválido',
      });
    }

    return res.json({
      id: cert.id,
      recipientName: cert.recipientName,
      courseTitle: cert.courseTitle,
      credentialId: cert.credentialId,
      issuedAt: cert.issuedAt,
      score: cert.score,
      user: {
        id: cert.user_id,
        name: cert.user_name,
        username: cert.user_username,
        avatarUrl: cert.user_avatarUrl,
      },
      course: {
        id: cert.course_id,
        title: cert.course_title,
        slug: cert.course_slug,
        durationHours: cert.course_durationHours,
      },
    });
  } catch {
    return res.status(500).json({
      error: 'Falha ao verificar credencial de certificado',
    });
  }
};

const getCertificateMy = async (req, res) => {
  try {
    const userId = req.user.id;
    const certs = await Certificate.listCertsByUserId([userId]);

    return res.json(
      certs.map((c) => ({
        ...c,
        course: {
          title: c.course_title,
          thumbnailUrl: c.thumbnailUrl,
        },
      })),
    );
  } catch {
    return res.status(500).json({
      error: 'Falha ao carregar certificados',
    });
  }
};

const postCertificateGenerateByCourseId = async (req, res) => {
  try {
    return res.json({
      message: 'Certificado disponível.',
      certificate: await issueCertificate(req.user.id, req.params.courseId),
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.status ? error.message : 'Não foi possível emitir o certificado.',
    });
  }
};

exports.getCertificateVerifyByCertificateId = getCertificateVerifyByCertificateId;
exports.getCertificateMy = getCertificateMy;
exports.postCertificateGenerateByCourseId = postCertificateGenerateByCourseId;
