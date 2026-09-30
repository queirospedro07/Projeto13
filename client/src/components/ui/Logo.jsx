import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Original Custom NEXO Brand Icon
 * Geometric Nexus Monogram (Unique, Proprietary Brand Mark)
 */
export const LogoIcon = ({ className = 'h-7 w-auto' }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nexo-logo-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      {/* Bespoke Geometric Nexus N */}
      <path
        d="M10 38V12C10 9.5 11.8 7.5 14.2 7.5H15.2C17.7 7.5 19.5 9.5 19.5 12V24.5L28.8 11.2C30.5 8.7 33.3 7.5 36.3 8.3C39.6 9.2 41.5 12 41.5 15.3V38C41.5 40.5 39.7 42.5 37.2 42.5H36.2C33.7 42.5 31.8 40.5 31.8 38V25.5L22.5 38.8C20.8 41.3 18 42.5 15 41.7C11.7 40.8 10 38 10 34.7V38Z"
        fill="url(#nexo-logo-grad)"
      />
      <circle cx="25.6" cy="25" r="2.6" fill="#93c5fd" />
    </svg>
  );
};

/**
 * Complete NEXO Logo (Icon + Clean Wordmark)
 */
export const Logo = ({
  size = 'md',
  showText = true,
  to,
  className = '',
  iconOnly = false
}) => {
  const sizeMap = {
    sm: { iconSize: 'h-6 w-6', textSize: 'text-lg' },
    md: { iconSize: 'h-7 w-7 sm:h-8 sm:w-8', textSize: 'text-xl sm:text-2xl' },
    lg: { iconSize: 'h-9 w-9 sm:h-10 sm:w-10', textSize: 'text-2xl sm:text-3xl' },
    xl: { iconSize: 'h-12 w-12 sm:h-14 sm:w-14', textSize: 'text-3xl sm:text-4xl' }
  };

  const { iconSize, textSize } = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center gap-2.5 text-slate-900 dark:text-white select-none ${className}`}>
      <LogoIcon className={`${iconSize} shrink-0`} />
      {showText && !iconOnly && (
        <span className={`font-display font-black tracking-[-0.04em] uppercase ${textSize} leading-none text-slate-950 dark:text-white`}>
          NEXO
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="group inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;