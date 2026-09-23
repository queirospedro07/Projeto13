import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';
  const sizes = {
    sm: 'px-3.5 py-2 text-xs gap-2',
    md: 'px-5 py-2.5 text-sm gap-2.5',
    lg: 'px-7 py-3.5 text-base gap-3'
  };
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:translate-y-[1px]',
    secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-800 dark:text-neutral-100 border border-slate-200 dark:border-neutral-800 active:translate-y-[1px]',
    outline: 'border border-slate-300 dark:border-neutral-800 hover:border-slate-400 dark:hover:border-neutral-700 text-slate-700 dark:text-neutral-200 hover:text-slate-950 dark:hover:text-white bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-neutral-900 active:translate-y-[1px]',
    ghost: 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 active:translate-y-[1px]',
    glow: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 active:translate-y-[1px]'
  };
  return <button className={twMerge(clsx(baseStyles, sizes[size], variants[variant], className))} disabled={disabled || isLoading} {...props}>
      {isLoading ? <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>;
};