export const CORES_AVATAR = [
  { nome: 'azul', cor: '#2563eb', url: '/avatars/iniciais/azul.svg' },
  { nome: 'verde', cor: '#15803d', url: '/avatars/iniciais/verde.svg' },
  { nome: 'violeta', cor: '#7c3aed', url: '/avatars/iniciais/violeta.svg' },
  { nome: 'rosa', cor: '#be185d', url: '/avatars/iniciais/rosa.svg' },
  { nome: 'laranja', cor: '#c2410c', url: '/avatars/iniciais/laranja.svg' },
  { nome: 'turquesa', cor: '#0f766e', url: '/avatars/iniciais/turquesa.svg' },
  { nome: 'indigo', cor: '#4338ca', url: '/avatars/iniciais/indigo.svg' },
  { nome: 'cinzento', cor: '#475569', url: '/avatars/iniciais/cinzento.svg' },
];

export const obterCorAvatar = (url) => CORES_AVATAR.find((item) => item.url === url);
