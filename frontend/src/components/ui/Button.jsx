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
  // Professional, crisp rectilinear square geometry (rounded-lg / rounded-md)
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 dark:focus-visible:ring-blue-400/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-2.5 text-sm sm:text-base gap-2.5'
  };

  const variants = {
    primary:
      'bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 border border-slate-900 dark:border-white shadow-xs active:translate-y-[1px]',
    blue:
      'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-xs active:translate-y-[1px]',
    secondary:
      'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-800 dark:text-neutral-100 border border-slate-200 dark:border-neutral-800 active:translate-y-[1px]',
    outline:
      'border border-slate-300 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-900 active:translate-y-[1px]',
    ghost:
      'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-900',
    danger:
      'bg-red-600 hover:bg-red-700 text-white border border-red-600 shadow-xs active:translate-y-[1px]',
    glow:
      'bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-950 border border-slate-900 dark:border-white shadow-sm active:translate-y-[1px]'
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizes[size], variants[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};