const nodemailer = require('nodemailer');

function temEmailTransporte() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function criarEmailTransporte() {
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    requireTLS: process.env.NODE_ENV === 'production' && !secure,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function verificarEmailTransporte() {
  const transporter = criarEmailTransporte();

  await transporter.verify();
}

async function enviarPalavraPasseReporEmail({ to, name: nome, resetUrl: reporUrl }) {
  const transporter = criarEmailTransporte();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const seguroNome = String(nome || 'Utilizador').replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  );

  return transporter.sendMail({
    from,
    to,
    subject: 'Redefinir a palavra-passe da sua conta NEXO',
    text: `Olá ${nome || 'Utilizador'},\n\nUse esta ligação para redefinir a sua palavra-passe (válida durante 30 minutos):\n${reporUrl}\n\nSe não pediu esta alteração, ignore este email.`,
    html: `<p>Olá ${seguroNome},</p><p>Recebemos um pedido para redefinir a palavra-passe da sua conta NEXO.</p><p><a href="${reporUrl}">Criar nova palavra-passe</a></p><p>Esta ligação é válida durante 30 minutos e só pode ser utilizada uma vez.</p><p>Se não pediu esta alteração, ignore este email.</p>`,
  });
}

exports.temEmailTransporte = temEmailTransporte;
exports.verificarEmailTransporte = verificarEmailTransporte;
exports.enviarPalavraPasseReporEmail = enviarPalavraPasseReporEmail;
