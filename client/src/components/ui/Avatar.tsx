import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'away' | 'dnd' | 'offline';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  status,
  className,
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
  };

  const statusDotSizes = {
    xs: 'w-1.5 h-1.5 ring-1',
    sm: 'w-2 h-2 ring-1',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3.5 h-3.5 ring-2',
    xl: 'w-4 h-4 ring-2',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    away: 'bg-amber-500',
    dnd: 'bg-red-500',
    offline: 'bg-zinc-500',
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={twMerge('relative inline-flex flex-shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={twMerge(
            'rounded-full object-cover bg-zinc-800 border border-zinc-700/60',
            sizes[size]
          )}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          className={twMerge(
            'rounded-full bg-[#18181b] text-zinc-200 flex items-center justify-center font-mono font-medium border border-[#27272a] select-none',
            sizes[size]
          )}
        >
          {initials}
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
