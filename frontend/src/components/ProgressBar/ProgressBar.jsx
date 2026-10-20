import './ProgressBar.css';
import { classNames } from '../../utils/classNames';

export const ProgressBar = ({
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
    sm: 'progress-bar-heights-sm',
    md: 'progress-bar-heights-md',
    lg: 'progress-bar-heights-lg',
  };
  const colors = {
    brand: 'progress-bar-colors-brand',
    success: 'progress-bar-colors-success',
    amber: 'progress-bar-colors-amber',
  };

  return (
    <div className={classNames('progress-bar-panel', className)}>
      {showLabel && (
        <div className="progress-bar-panel-2">
          <span>{label || 'Progresso'}</span>
          <span className="progress-bar-label">{percentage}%</span>
        </div>
      )}
      <div className={classNames('progress-bar-panel-3', heights[size])}>
        <div
          className={[classNames('progress-bar-panel-4', colors[variant]), 'progress-bar-dynamic-1']
            .filter(Boolean)
            .join(' ')}
          style={{
            '--progress-bar-width': `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
};
