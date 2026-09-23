import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'brand' | 'success' | 'amber';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = false,
  label,
  size = 'md',
  variant = 'brand',
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const colors = {
    brand: 'bg-blue-600',
    success: 'bg-emerald-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className={twMerge('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-1.5">
          <span>{label || 'Progresso'}</span>
          <span className="font-bold text-slate-900">{percentage}%</span>
        </div>
      )}
      <div className={twMerge('w-full bg-slate-200 rounded-full overflow-hidden', heights[size])}>
        <div
          className={twMerge('h-full rounded-full transition-all duration-300 ease-out', colors[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
