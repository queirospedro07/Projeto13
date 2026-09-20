/**
 * Utilitários de Formatação em Português de Portugal (PT-PT)
 */

export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const formatXP = (xp: number): string => {
  return `${(xp || 0).toLocaleString('pt-PT')} XP`;
};

export const formatDifficulty = (difficulty: string): string => {
  switch (difficulty?.toLowerCase()) {
    case 'beginner':
    case 'iniciante':
      return 'Iniciante';
    case 'intermediate':
    case 'intermédio':
    case 'intermediario':
      return 'Intermédio';
    case 'advanced':
    case 'avançado':
    case 'avancado':
      return 'Avançado';
    default:
      return difficulty || 'Geral';
  }
};

export const formatRelativeTime = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Agora mesmo';
  if (diffMinutes < 60) return `Há ${diffMinutes}m`;
  if (diffHours < 24) return `Há ${diffHours}h`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;

  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
