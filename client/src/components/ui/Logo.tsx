import React from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  to?: string;
  className?: string;
  textClassName?: string;
  badgeClassName?: string;
  iconOnly?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  to,
  className = '',
  textClassName = '',
  badgeClassName = '',
  iconOnly = false,
}) => {
  const sizeMap = {
    sm: { badge: 'w-7 h-7 rounded-lg', icon: 'w-4 h-4', text: 'text-base' },
    md: { badge: 'w-9 h-9 rounded-xl', icon: 'w-5 h-5', text: 'text-xl' },
    lg: { badge: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6', text: 'text-2xl' },
    xl: { badge: 'w-16 h-16 rounded-3xl', icon: 'w-8 h-8', text: 'text-3xl' },
  };

  const { badge, icon, text } = sizeMap[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`${badge} bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 transition-transform group-hover:scale-105 ${badgeClassName}`}
      >
        <Layers className={`${icon} stroke-[2.2]`} />
      </div>
      {!iconOnly && showText && (
        <span className={`font-black tracking-tight text-slate-950 font-sans ${text} ${textClassName}`}>
          LearnSpace
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
