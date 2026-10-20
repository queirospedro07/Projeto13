import './Avatar.css';
import { useState, useEffect } from 'react';
import { classNames } from '../../utils/classNames';

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
  name = 'Utilizador',
  size = 'md',
  status,
  role,
  // 'ADMIN' | 'CREATOR' | 'STUDENT' — optional, drives fallback style
  shape = 'circle',
  // 'circle' | 'square'
  className,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const sizes = {
    xs: 'avatar-sizes-xs',
    sm: 'avatar-sizes-sm',
    md: 'avatar-sizes-md',
    lg: 'avatar-sizes-lg',
    xl: 'avatar-sizes-xl',
  };
  const statusDotSizes = {
    xs: 'avatar-status-dot-sizes-xs',
    sm: 'avatar-status-dot-sizes-sm',
    md: 'avatar-status-dot-sizes-md',
    lg: 'avatar-status-dot-sizes-lg',
    xl: 'avatar-status-dot-sizes-xl',
  };
  const statusColors = {
    online: 'avatar-status-colors-online',
    away: 'avatar-status-colors-away',
    dnd: 'avatar-status-colors-dnd',
    offline: 'avatar-status-colors-offline',
  };
  const isSquare = shape === 'square';
  const roundedClass = isSquare
    ? size === 'xl' || size === 'lg'
      ? 'avatar-is-square-2'
      : 'avatar-is-square'
    : 'avatar-rounded-class';
  const initials = Array.from((name || 'Utilizador').trim())[0]?.toLocaleUpperCase('pt-PT') || 'U';

  // Pick role-based style; fall back to default dark
  const normalizedRole = role?.toUpperCase();
  const roleStyle = ROLE_STYLES[normalizedRole] || ROLE_STYLES.default;

  return (
    <div className={classNames('avatar-panel', roundedClass, className)}>
      {src && src !== '/avatar-default.svg' && !imgError ? (
        <img
          src={src}
          alt={name}
          className={classNames('avatar-image', roundedClass, sizes[size])}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={classNames(
            'avatar-panel-2',
            roundedClass,
            roleStyle.bg,
            roleStyle.text,
            roleStyle.border,
            sizes[size],
          )}
        >
          <span className="avatar-label">{initials}</span>
        </div>
      )}

      {status && (
        <span
          className={classNames('avatar-label-2', statusDotSizes[size], statusColors[status])}
        />
      )}
    </div>
  );
};

export default Avatar;
