const { randomInt } = require('node:crypto');
const cores = ['azul', 'verde', 'violeta', 'rosa', 'laranja', 'turquesa', 'indigo', 'cinzento'];

function sortearAvatarInicial() {
  return '/avatars/iniciais/' + cores[randomInt(cores.length)] + '.svg';
}

module.exports = { sortearAvatarInicial };
