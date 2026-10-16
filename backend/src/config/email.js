const nodemailer = require('nodemailer');
function hasEmailTransport() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}
function createEmailTransport() {
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
async function verifyEmailTransport() {
  const transporter = createEmailTransport();
  await transporter.verify();
}
async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const transporter = createEmailTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const safeName = String(name || 'Utilizador').replace(
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
    text: `Olá ${name || 'Utilizador'},\n\nUse esta ligação para redefinir a sua palavra-passe (válida durante 30 minutos):\n${resetUrl}\n\nSe não pediu esta alteração, ignore este email.`,
    html: `<p>Olá ${safeName},</p><p>Recebemos um pedido para redefinir a palavra-passe da sua conta NEXO.</p><p><a href="${resetUrl}">Criar nova palavra-passe</a></p><p>Esta ligação é válida durante 30 minutos e só pode ser utilizada uma vez.</p><p>Se não pediu esta alteração, ignore este email.</p>`,
  });
}
exports.hasEmailTransport = hasEmailTransport;
exports.verifyEmailTransport = verifyEmailTransport;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
