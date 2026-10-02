export const DEFAULT_AVATARS = [
  { id: 'ines', label: 'Inês', background: 'b6e3f4' },
  { id: 'beatriz', label: 'Beatriz', background: 'c0aede' },
  { id: 'leo', label: 'Leo', background: 'd1d4f9' },
  { id: 'mateus', label: 'Mateus', background: 'ffd5dc' },
  { id: 'rui', label: 'Rui', background: 'ffdfbf' },
  { id: 'sara', label: 'Sara', background: 'c0f0c0' },
  { id: 'alex', label: 'Alex', background: 'f1f4dc' },
  { id: 'luz', label: 'Luz', background: 'e5d0ff' }
].map(avatar => ({
  ...avatar,
  url: `https://api.dicebear.com/7.x/avataaars/svg?seed=NEXO-${avatar.id}&backgroundColor=${avatar.background}`
}));

export const DEFAULT_AVATAR_URL = DEFAULT_AVATARS[0].url;