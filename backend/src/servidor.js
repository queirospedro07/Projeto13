require('./configuracao/ambiente.js');
if (process.env.NODE_ENV === 'production') {
  const { validarAmbienteProducao } = require('./configuracao/producao.js');
  const erros = validarAmbienteProducao(process.env);
  if (erros.length) throw new Error(`Configuração de produção inválida:\n${erros.join('\n')}`);
}

const http = require('http');
const { Server } = require('socket.io');
const aplicacao = require('./aplicacao.js');
const { ligarBaseDados, fecharBaseDados } = require('./base-dados/ligacao.js');
const { socketCorsConfig } = require('./intermediarios/seguranca.js');
const { autenticarSocket } = require('./tempo-real/seguranca.js');
const { configurarSocketIO } = require('./tempo-real/conversaSocket.js');
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const servidor = http.createServer(aplicacao);

// Configuração do Socket.IO
const io = new Server(servidor, {
  cors: socketCorsConfig,
  maxHttpBufferSize: 128 * 1024,
  connectTimeout: 10000,
});

io.use(autenticarSocket);
configurarSocketIO(io);
aplicacao.set('io', io);

// Ligar à base de dados e arrancar o servidor
ligarBaseDados()
  .then(() => {
    servidor.listen(PORT, HOST, () => {
      console.log(
        `Servidor NEXO a correr na porta ${PORT} (${process.env.NODE_ENV || 'development'})`,
      );
    });
  })
  .catch((erro) => {
    console.error('Erro ao ligar à base de dados:', erro.message);
    process.exit(1);
  });

let shuttingDown = false;
const tratarEncerrar = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('A encerrar servidor...');

  const deadline = setTimeout(() => process.exit(1), 10000);

  deadline.unref();
  io.close(async () => {
    await fecharBaseDados();
    clearTimeout(deadline);
    process.exit(0);
  });
};

process.on('SIGTERM', tratarEncerrar);
process.on('SIGINT', tratarEncerrar);
