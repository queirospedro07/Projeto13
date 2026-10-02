import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Card = ({
  children,
  className,
  hover = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-neutral-800 rounded-lg p-5 sm:p-6 text-slate-900 dark:text-white shadow-xs transition-all duration-150',
          hover && 'hover:border-slate-300 dark:hover:border-neutral-700 hover:shadow-sm',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};