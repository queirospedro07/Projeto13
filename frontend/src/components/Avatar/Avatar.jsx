import { obterCorAvatar } from '../../utils/avatarColors';
import { Link } from 'react-router-dom';
import './Avatar.css';
import { useState, useEffect } from 'react';
import { classNames } from '../../utils/cssClasses';

// Cores das iniciais por tipo de conta.
const ROLE_STYLES = {
  ADMIN: {
    bg: 'avatar-role-styles-bg',
    text: 'avatar-role-styles-text',
    border: 'avatar-role-styles-border',
  },
  CREATOR: {
    bg: 'avatar-role-styles-bg-2',
    text: 'avatar-role-styles-text',
    border: 'avatar-role-styles-border-2',
  },
  STUDENT: {
    bg: 'avatar-role-styles-bg-3',
    text: 'avatar-role-styles-text',
    border: 'avatar-role-styles-border-3',
  },
  default: {
    bg: 'avatar-role-styles-bg-4',
    text: 'avatar-role-styles-text-2',
    border: 'avatar-role-styles-border-4',
  },
};

export const Avatar = ({
  src,
  username,
  name: nome = 'Utilizador',
  size = 'md',
  status: estado,
  role: cargo,
  // Cargo usado para escolher o aspeto do avatar quando não existe imagem.
  shape = 'circle',
  // 'circle' | 'square'
  className: turmaNome,
}) => {
  const [imgErro, definirImgErro] = useState(false);

  useEffect(() => {
    definirImgErro(false);
  }, [src]);

  const sizes = {
    xs: 'avatar-sizes-xs',
    sm: 'avatar-sizes-sm',
    md: 'avatar-sizes-md',
    lg: 'avatar-sizes-lg',
    xl: 'avatar-sizes-xl',
  };
  const estadoDotSizes = {
    xs: 'avatar-status-dot-sizes-xs',
    sm: 'avatar-status-dot-sizes-sm',
    md: 'avatar-status-dot-sizes-md',
    lg: 'avatar-status-dot-sizes-lg',
    xl: 'avatar-status-dot-sizes-xl',
  };
  const estadoColors = {
    online: 'avatar-status-colors-online',
    away: 'avatar-status-colors-away',
    dnd: 'avatar-status-colors-dnd',
    offline: 'avatar-status-colors-offline',
  };
  const isSquare = shape === 'square';
  const roundedTurma = isSquare
    ? size === 'xl' || size === 'lg'
      ? 'avatar-is-square-2'
      : 'avatar-is-square'
    : 'avatar-rounded-class';
  const corInicial = obterCorAvatar(src);
  const initials = Array.from((nome || 'Utilizador').trim())[0]?.toLocaleUpperCase('pt-PT') || 'U';

  // Pick role-based style; fall back to default dark
  const normalizedCargo = cargo?.toUpperCase();
  const cargoStyle = ROLE_STYLES[normalizedCargo] || ROLE_STYLES.default;

  const conteudo = (
    <div className={classNames('avatar-panel', roundedTurma, turmaNome)}>
      {src && !corInicial && src !== '/avatar-default.svg' && !imgErro ? (
        <img
          src={src}
          alt={nome}
          className={classNames('avatar-image', roundedTurma, sizes[size])}
          onError={() => definirImgErro(true)}
        />
      ) : (
        <div
          style={
            corInicial
              ? { backgroundColor: corInicial.cor, color: '#fff', borderColor: corInicial.cor }
              : undefined
          }
          className={classNames(
            'avatar-panel-2',
            roundedTurma,
            cargoStyle.bg,
            cargoStyle.text,
            cargoStyle.border,
            sizes[size],
          )}
        >
          <span className="avatar-label">{initials}</span>
        </div>
      )}

      {estado && (
        <span
          className={classNames('avatar-label-2', estadoDotSizes[size], estadoColors[estado])}
        />
      )}
    </div>
  );

  return username ? (
    <Link
      to={`/perfil/${encodeURIComponent(username)}`}
      className="avatar-profile-link"
      aria-label={`Ver perfil de ${nome}`}
      onClick={(evento) => evento.stopPropagation()}
    >
      {conteudo}
    </Link>
  ) : (
    conteudo
  );
};

export default Avatar;
