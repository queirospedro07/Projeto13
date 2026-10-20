const categories = {
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

function aliasesForCategory(value) {
  const key = value.trim().toLowerCase();
  const entry = Object.entries(categories).find(
    ([id, aliases]) => id === key || aliases.includes(key),
  );

  return entry ? [entry[0], ...entry[1]] : [key];
}

exports.aliasesForCategory = aliasesForCategory;
