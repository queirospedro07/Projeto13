import './Card.css';
import React from 'react';
import { clsx } from 'clsx';

export const Card = ({ children, className, hover = false, glow = false, ...props }) => {
  return (
    <div className={clsx('card-panel', hover && 'card-panel-2', className)} {...props}>
      {children}
    </div>
  );
};
