/**
 * Design Tokens & Presets de Estilo (OLED Pitch Black + Light Contrast)
 */

export const THEME_COLORS = {
  // OLED Dark Mode Palettes
  dark: {
    bgBase: '#000000',
    bgSurface: '#0a0a0a',
    bgElevated: '#111111',
    bgSubtle: '#141414',
    border: '#222222',
    borderSubtle: '#1a1a1a',
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
  },
  // Clean Light Mode Palettes
  light: {
    bgBase: '#ffffff',
    bgSurface: '#f8fafc',
    bgElevated: '#f1f5f9',
    border: '#e2e8f0',
    borderSubtle: '#cbd5e1',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
  },
  // Accent & Status Colors
  brand: {
    primary: '#2563eb', // Blue-600
    hover: '#1d4ed8',   // Blue-700
    glow: 'rgba(37, 99, 235, 0.25)',
  },
  status: {
    success: '#10b981', // Emerald-500
    warning: '#f59e0b', // Amber-500
    danger: '#ef4444',  // Red-500
    info: '#3b82f6',    // Blue-500
  }
} as const;

export const GLASSMORPHISM = {
  header: 'bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200/80 dark:border-neutral-800/80',
  modal: 'bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border border-slate-200 dark:border-[#222222]',
  card: 'bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#222222] shadow-sm',
} as const;
