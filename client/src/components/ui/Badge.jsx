import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  icon
}) => {
  const base = 'inline-flex items-center font-bold rounded-lg select-none text-xs';
  const sizes = {
    sm: 'px-2 py-0.5 gap-1 text-[11px]',
    md: 'px-2.5 py-1 gap-1.5 text-xs'
  };
  const variants = {
    default: 'bg-slate-100 dark:bg-neutral-900 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-800',
    brand: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60',
    primary: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60',
    accent: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60',
    success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60',
    warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60',
    danger: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60',
    outline: 'border border-slate-300 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 bg-white dark:bg-black'
  };
  return <span className={twMerge(clsx(base, sizes[size], variants[variant], className))}>
      {icon}
      {children}
    </span>;
};