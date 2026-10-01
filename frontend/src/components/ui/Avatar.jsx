import React from 'react';
import { twMerge } from 'tailwind-merge';

// Role-based fallback icon colours and backgrounds
const ROLE_STYLES = {
  ADMIN: {
    bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    text: 'text-white',
    border: 'border-amber-600/40',
  },
  CREATOR: {
    bg: 'bg-gradient-to-br from-indigo-500 to-violet-600',
    text: 'text-white',
    border: 'border-indigo-600/40',
  },
  STUDENT: {
    bg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    text: 'text-white',
    border: 'border-blue-600/40',
  },
  default: {
    bg: 'bg-[#18181b]',
    text: 'text-zinc-200',
    border: 'border-[#27272a]',
  },
};

// Role-based SVG icons (shown instead of initials for known roles when there's no avatar)
const AdminIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CreatorIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>
  </svg>
);

const StudentIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const DEFAULT_ICON_SIZES = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

function RoleIcon({ role, sizeKey }) {
  const cls = DEFAULT_ICON_SIZES[sizeKey] || DEFAULT_ICON_SIZES.md;
  if (role === 'ADMIN') return <AdminIcon className={cls} />;
  if (role === 'CREATOR') return <CreatorIcon className={cls} />;
  return <StudentIcon className={cls} />;
}

export const Avatar = ({
  src,
  name = 'User',
  size = 'md',
  status,
  role,        // 'ADMIN' | 'CREATOR' | 'STUDENT' — optional, drives fallback style
  shape = 'circle', // 'circle' | 'square'
  className
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold'
  };

  const statusDotSizes = {
    xs: 'w-1.5 h-1.5 ring-1',
    sm: 'w-2 h-2 ring-1',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3.5 h-3.5 ring-2',
    xl: 'w-4 h-4 ring-2'
  };

  const statusColors = {
    online: 'bg-emerald-500',
    away: 'bg-amber-500',
    dnd: 'bg-red-500',
    offline: 'bg-zinc-500'
  };

  const isSquare = shape === 'square' || className?.includes('rounded-xl') || className?.includes('rounded-2xl') || className?.includes('rounded-lg');
  const roundedClass = isSquare ? (size === 'xl' || size === 'lg' ? 'rounded-2xl' : 'rounded-xl') : 'rounded-full';

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Pick role-based style; fall back to default dark
  const normalizedRole = role?.toUpperCase();
  const roleStyle = ROLE_STYLES[normalizedRole] || ROLE_STYLES.default;

  // Use role icon when role is known; initials otherwise
  const usesRoleIcon = !!normalizedRole && ['ADMIN', 'CREATOR', 'STUDENT'].includes(normalizedRole);

  return (
    <div className={twMerge('relative inline-flex flex-shrink-0', roundedClass, className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={twMerge(
            'object-cover bg-zinc-800 border border-zinc-700/60',
            roundedClass,
            sizes[size]
          )}
          onError={e => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <div
          className={twMerge(
            'flex items-center justify-center select-none border',
            roundedClass,
            roleStyle.bg,
            roleStyle.text,
            roleStyle.border,
            sizes[size]
          )}
        >
          {usesRoleIcon ? (
            <RoleIcon role={normalizedRole} sizeKey={size} />
          ) : (
            <span className="font-mono font-medium leading-none">{initials}</span>
          )}
        </div>
      )}

      {status && (
        <span
          className={twMerge(
            'absolute bottom-0 right-0 rounded-full ring-[#11131a]',
            statusDotSizes[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
};

export default Avatar;
