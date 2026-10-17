import './Badge.css';
import { classNames } from '../../utils/classNames';
export const Badge = ({ children, variant = 'default', size = 'md', className, icon }) => {
  const base = 'badge-base';
  const sizes = {
    sm: 'badge-sizes-sm',
    md: 'badge-sizes-md',
  };
  const variants = {
    default: 'badge-variants-default',
    brand: 'badge-variants-brand',
    primary: 'badge-variants-brand',
    accent: 'badge-variants-accent',
    success: 'badge-variants-success',
    warning: 'badge-variants-warning',
    danger: 'badge-variants-danger',
    outline: 'badge-variants-outline',
  };
  return (
    <span className={classNames(base, sizes[size], variants[variant], className)}>
      {icon}
      {children}
    </span>
  );
};
