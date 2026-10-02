export const DEFAULT_AVATARS = [
  { id: 'astra', label: 'Astra', background: 'f5d0fe' },
  { id: 'nova', label: 'Nova', background: 'c4b5fd' },
  { id: 'vex', label: 'Vex', background: 'bfdbfe' },
  { id: 'kairo', label: 'Kai', background: 'fed7aa' },
  { id: 'lyra', label: 'Lyra', background: 'bbf7d0' },
  { id: 'orion', label: 'Orion', background: 'fde68a' },
  { id: 'zuri', label: 'Zuri', background: 'fecdd3' },
  { id: 'flux', label: 'Flux', background: 'a5f3fc' }
].map(avatar => ({
  ...avatar,
  url: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=NEXO-${avatar.id}&backgroundColor=${avatar.background}`
}));

export const DEFAULT_AVATAR_URL = DEFAULT_AVATARS[0].url;