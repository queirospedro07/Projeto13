const { queryOne, execute } = require('../database/connection.js');
const Report = {
  findTargetById(fragment1, params = []) {
    return queryOne(`SELECT * FROM "${fragment1}" WHERE id = $1`, params);
  },
  insertDenuncias(params = []) {
    return execute(
      'INSERT INTO denuncias (id,id_utilizador,tipo_alvo,id_alvo,motivo,criado_em,atualizado_em) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      params,
    );
  },
};
module.exports = Report;
