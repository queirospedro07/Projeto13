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
  return <div className={twMerge(clsx('bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-2xl sm:rounded-3xl p-6 sm:p-7 text-slate-900 dark:text-white shadow-sm transition-all duration-150', hover && 'hover:border-slate-300 dark:hover:border-neutral-700 hover:shadow-md', className))} {...props}>
      {children}
    </div>;
};