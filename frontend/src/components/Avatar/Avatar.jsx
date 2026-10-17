import './Avatar.css';
import { useState, useEffect } from 'react';
import { classNames } from '../../utils/classNames';

// Role-based fallback icon colours and backgrounds
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

// Role-based SVG icons (shown instead of initials for known roles when there's no avatar)
const AdminIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const CreatorIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
  </svg>
);
const StudentIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);
const DEFAULT_ICON_SIZES = {
  xs: 'avatar-default-icon-sizes-xs',
  sm: 'avatar-default-icon-sizes-sm',
  md: 'avatar-default-icon-sizes-md',
  lg: 'avatar-default-icon-sizes-lg',
  xl: 'avatar-default-icon-sizes-xl',
};
function RoleIcon({ role, sizeKey }) {
  const cls = DEFAULT_ICON_SIZES[sizeKey] || DEFAULT_ICON_SIZES.md;
  if (role === 'ADMIN') return <AdminIcon className={cls} />;
  if (role === 'CREATOR') return <CreatorIcon className={cls} />;
  return <StudentIcon className={cls} />;
}
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
  const initials = (name || 'Utilizador')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Pick role-based style; fall back to default dark
  const normalizedRole = role?.toUpperCase();
  const roleStyle = ROLE_STYLES[normalizedRole] || ROLE_STYLES.default;

  // Use role icon when role is known; initials otherwise
  const usesRoleIcon = !!normalizedRole && ['ADMIN', 'CREATOR', 'STUDENT'].includes(normalizedRole);
  return (
    <div className={classNames('avatar-panel', roundedClass, className)}>
      {src && !imgError ? (
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
          {usesRoleIcon ? (
            <RoleIcon role={normalizedRole} sizeKey={size} />
          ) : (
            <span className="avatar-label">{initials}</span>
          )}
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
