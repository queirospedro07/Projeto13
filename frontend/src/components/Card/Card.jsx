import './Card.css';
import { classNames } from '../../utils/classNames';

export const Card = ({ children, className, hover = false, glow = false, ...props }) => {
  return (
    <div
      className={classNames('card-panel', hover && 'card-panel-2', className)}
      {...props}
    >
      {children}
    </div>
  );
};
