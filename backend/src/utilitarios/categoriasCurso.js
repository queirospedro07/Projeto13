const categorias = {
  programming: ['programação', 'programacao', 'programação & software'],
  design: ['design & criatividade', 'ui/ux'],
  ai: ['ia', 'ai & data', 'ia & dados'],
  data: ['dados', 'dados & bases de dados'],
  cloud: ['cloud & devops', 'devops'],
  cybersecurity: ['cibersegurança', 'ciberseguranca'],
  business: ['negócios & gestão'],
  marketing: ['marketing & vendas'],
  languages: ['línguas & idiomas'],
  finance: ['finanças & economia'],
  health: ['saúde & bem-estar'],
  'personal-development': ['desenvolvimento pessoal'],
  photography: ['fotografia & vídeo'],
  science: ['ciências & engenharia'],
  cooking: ['gastronomia & culinária'],
  music: ['música & produção áudio'],
  law: ['direito & sociedade'],
  other: ['outras áreas'],
};

function aliasesParaCategoria(valor) {
  const chave = valor.trim().toLowerCase();
  const entrada = Object.entries(categorias).find(
    ([id, aliases]) => id === chave || aliases.includes(chave),
  );

  return entrada ? [entrada[0], ...entrada[1]] : [chave];
}

exports.aliasesParaCategoria = aliasesParaCategoria;
