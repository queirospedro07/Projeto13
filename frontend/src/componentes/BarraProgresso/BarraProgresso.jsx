import './BarraProgresso.css';
import { classNames } from '../../utilitarios/classesCss';

export const BarraProgresso = ({
  value: valor,
  max = 100,
  showLabel: mostrarLabel = false,
  label,
  size = 'md',
  variant = 'brand',
  className: turmaNome,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((valor / max) * 100)));
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
    <div className={classNames('progress-bar-panel', turmaNome)}>
      {mostrarLabel && (
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
