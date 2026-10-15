import './Button.css';
import React from 'react';
import { clsx } from 'clsx';

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
  const baseStyles = 'button-base-styles';

  const sizes = {
    sm: 'button-sizes-sm',
    md: 'button-sizes-md',
    lg: 'button-sizes-lg',
  };

  const variants = {
    primary: 'button-variants-primary',
    blue: 'button-variants-blue',
    secondary: 'button-variants-secondary',
    outline: 'button-variants-outline',
    ghost: 'button-variants-ghost',
    danger: 'button-variants-danger',
    glow: 'button-variants-glow',
  };

  return (
    <button
      className={clsx(baseStyles, sizes[size], variants[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="button-icon" fill="none" viewBox="0 0 24 24">
          <circle
            className="button-icon-circle"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="button-icon-path"
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
