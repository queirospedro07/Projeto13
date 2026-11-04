const { helpFaq: ajudaPerguntasFrequentes } = require('../content/frequentlyAskedQuestions.js');
const obterAjudaPerguntasFrequentes = (_Pedido, resposta) => {
  resposta.set('Cache-Control', 'public, max-age=300');
  resposta.json(ajudaPerguntasFrequentes);
};

exports.obterAjudaPerguntasFrequentes = obterAjudaPerguntasFrequentes;
