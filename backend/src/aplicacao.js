const { consultarUm } = require('./base-dados/ligacao.js');
const pagamentoRotas = require('./rotas/pagamento.rotas.js');
const projetoRotas = require('./rotas/projeto.rotas.js');
const express = require('express');
const { autenticar: autenticar } = require('./intermediarios/autenticacao.js');
const { obterServidoresIce } = require('./configuracao/servidoresIce.js');
const {
  helmetMiddleware,
  corsMiddleware,
  apiLimiter,
  authLimiter: autenticacaoLimiter,
  higienizarInputs,
} = require('./intermediarios/seguranca.js');
const autenticacaoRotas = require('./rotas/autenticacao.rotas.js');
const cursoRotas = require('./rotas/curso.rotas.js');
const questionarioRotas = require('./rotas/questionario.rotas.js');
const espacoRotas = require('./rotas/espaco.rotas.js');
const conversaRotas = require('./rotas/conversa.rotas.js');
const formadorRotas = require('./rotas/formador.rotas.js');
const administracaoRotas = require('./rotas/administracao.rotas.js');
const notasRotas = require('./rotas/notas.rotas.js');
const certificadoRotas = require('./rotas/certificado.rotas.js');
const notificacaoRotas = require('./rotas/notificacao.rotas.js');
const socialRotas = require('./rotas/social.rotas.js');
const ajudaRotas = require('./rotas/ajuda.rotas.js');
const aplicacao = express();

aplicacao.disable('x-powered-by');
if (process.env.TRUST_PROXY_HOPS) {
  const hops = Number(process.env.TRUST_PROXY_HOPS);
  if (!Number.isInteger(hops) || hops < 1 || hops > 5)
    throw new Error('TRUST_PROXY_HOPS deve ser um inteiro entre 1 e 5.');
  aplicacao.set('trust proxy', hops);
}

if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL && !process.env.FRONTEND_URL)
  console.warn('Aviso: CLIENT_URL / FRONTEND_URL não configurados.');
// Middlewares de segurança e parsing
aplicacao.use(helmetMiddleware);
aplicacao.use(corsMiddleware);
aplicacao.options('*', corsMiddleware);
aplicacao.use(['/api', '/autenticacao', '/auth', '/cursos', '/courses', '/pagamentos', '/payments', '/questionarios', '/quizzes', '/projetos', '/projects', '/espacos', '/spaces', '/conversas', '/mensagens', '/formador', '/creator', '/administracao', '/admin', '/notas', '/notes', '/certificados', '/certificates', '/notificacoes', '/notifications', '/social', '/ajuda', '/help'], apiLimiter);
aplicacao.use(
  [
    '/api/auth/entrar',
    '/api/auth/login',
    '/api/autenticacao/entrar',
    '/api/autenticacao/login',
    '/auth/entrar',
    '/auth/login',
    '/autenticacao/entrar',
    '/autenticacao/login',
    '/api/auth/registar',
    '/api/auth/register',
    '/api/autenticacao/registar',
    '/api/autenticacao/register',
    '/auth/registar',
    '/auth/register',
    '/autenticacao/registar',
    '/autenticacao/register',
    '/api/auth/demo',
    '/api/autenticacao/demo',
    '/auth/demo',
    '/autenticacao/demo',
  ],
  autenticacaoLimiter,
);
aplicacao.use(
  express.json({
    limit: '10mb',
  }),
);
aplicacao.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  }),
);
aplicacao.use(higienizarInputs);

// Rota de estado do servidor
aplicacao.get(['/api/estado', '/api/health', '/estado', '/health'], async (_Pedido, resposta) => {
  try {
    await consultarUm('SELECT 1 AS available');
    resposta.json({
      status: 'ok',
      platform: 'NEXO',
      database: 'postgresql',
      timestamp: new Date().toISOString(),
    });
  } catch {
    resposta.status(503).json({
      status: 'unavailable',
      platform: 'NEXO',
      database: 'postgresql',
    });
  }
});

// Servidores STUN para chamadas WebRTC
aplicacao.get(['/api/servidores-ice', '/api/ice-servers', '/servidores-ice', '/ice-servers'], autenticar, (pedido, resposta) => {
  resposta.setHeader('Cache-Control', 'no-store');
  resposta.json({
    iceServers: obterServidoresIce(),
  });
});

// Rotas da API (suporta prefixos /api e chamadas diretas)
aplicacao.use(['/api/autenticacao', '/api/auth', '/autenticacao', '/auth'], autenticacaoRotas);
aplicacao.use(['/api/cursos', '/api/courses', '/cursos', '/courses'], cursoRotas);
aplicacao.use(['/api/pagamentos', '/api/payments', '/pagamentos', '/payments'], pagamentoRotas);
aplicacao.use(['/api/questionarios', '/api/quizzes', '/questionarios', '/quizzes'], questionarioRotas);
aplicacao.use(['/api/projetos', '/api/projects', '/projetos', '/projects'], projetoRotas);
aplicacao.use(['/api/espacos', '/api/spaces', '/espacos', '/spaces'], espacoRotas);
aplicacao.use(['/api', '/'], conversaRotas);
aplicacao.use(['/api/formador', '/api/creator', '/formador', '/creator'], formadorRotas);
aplicacao.use(['/api/administracao', '/api/admin', '/administracao', '/admin'], administracaoRotas);
aplicacao.use(['/api/notas', '/api/notes', '/notas', '/notes'], notasRotas);
aplicacao.use(['/api/certificados', '/api/certificates', '/certificados', '/certificates'], certificadoRotas);
aplicacao.use(['/api/notificacoes', '/api/notifications', '/notificacoes', '/notifications'], notificacaoRotas);
aplicacao.use(['/api/social', '/social'], socialRotas);
aplicacao.use(['/api/ajuda', '/api/help', '/ajuda', '/help'], ajudaRotas);
aplicacao.use((pedido, resposta) => {
  resposta.status(404).json({
    message: 'Rota não encontrada',
    error: 'Rota não encontrada',
  });
});

// Tratamento de erros
aplicacao.use((erro, pedido, resposta, _Seguinte) => {
  console.error(erro.stack || erro);

  const baseDadosUnavailable = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    '08000',
    '08003',
    '08006',
    '57P01',
    '57P02',
    '57P03',
    '53300',
  ].includes(erro.code);
  const estado = baseDadosUnavailable
    ? 503
    : Number.isInteger(erro.status) && erro.status >= 400 && erro.status <= 599
      ? erro.status
      : 500;
  const mensagem = baseDadosUnavailable
    ? 'O serviço de dados está temporariamente indisponível. Tente novamente.'
    : process.env.NODE_ENV === 'production' && estado >= 500
      ? 'Ocorreu um erro interno no servidor.'
      : erro.message || 'Erro interno no servidor';

  resposta.status(estado).json({
    message: mensagem,
    error: mensagem,
  });
});
module.exports = aplicacao;
