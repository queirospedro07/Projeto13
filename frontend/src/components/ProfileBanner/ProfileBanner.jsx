import './ProfileBanner.css';

export const BANNER_PRESETS = [
  {
    value: 'gradient-indigo',
    label: 'Índigo',
  },
  {
    value: 'gradient-emerald',
    label: 'Esmeralda',
  },
  {
    value: 'gradient-sunset',
    label: 'Pôr do sol',
  },
  {
    value: 'gradient-dusk',
    label: 'Crepúsculo',
  },
  {
    value: 'gradient-aurora',
    label: 'Aurora',
  },
  {
    value: 'gradient-midnight',
    label: 'Meia-noite',
  },
];

export function ProfileBanner({ value = '', className = '', children }) {
  value = typeof value === 'string' ? value : '';

  const preset = BANNER_PRESETS.some((p) => p.value === value) ? value : 'gradient-indigo';
  const isColor =
    /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\([^;"'\\]+\)|linear-gradient\([^;"'\\]+\))$/i.test(value);
  const isImage = /^(https?:\/\/|data:image\/|\/)/i.test(value);
  const safeImage = value.replace(/["'()\\;\n\r]/g, '');
  const variables = isColor
    ? {
        '--banner-color': value,
      }
    : isImage
      ? {
          '--banner-image': `url("${safeImage}")`,
        }
      : undefined;

  return (
    <div
      className={`profile-banner-surface ${className}`}
      data-preset={preset}
      data-kind={isColor ? 'color' : isImage ? 'image' : 'preset'}
      style={variables}
    >
      {children}
    </div>
  );
}
