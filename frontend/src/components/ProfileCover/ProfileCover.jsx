import './ProfileCover.css';

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

export function PerfilCapa({
  value: valor = '',
  className: turmaNome = '',
  children: conteudoFilho,
}) {
  valor = typeof valor === 'string' ? valor : '';

  const preset = BANNER_PRESETS.some((p) => p.value === valor) ? valor : 'gradient-indigo';
  const isColor =
    /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\([^;"'\\]+\)|linear-gradient\([^;"'\\]+\))$/i.test(valor);
  const isImagem = /^(https?:\/\/|data:image\/|\/)/i.test(valor);
  const seguroImagem = valor.replace(/["'()\\;\n\r]/g, '');
  const variables = isColor
    ? {
        '--banner-color': valor,
      }
    : isImagem
      ? {
          '--banner-image': `url("${seguroImagem}")`,
        }
      : undefined;

  return (
    <div
      className={`profile-banner-surface ${turmaNome}`}
      data-preset={preset}
      data-kind={isColor ? 'color' : isImagem ? 'image' : 'preset'}
      style={variables}
    >
      {conteudoFilho}
    </div>
  );
}
