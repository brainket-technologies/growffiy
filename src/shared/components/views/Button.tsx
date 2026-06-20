import React from 'react';
import styles from './components.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  let variantClass = styles.btnPrimary;
  if (variant === 'secondary') variantClass = styles.btnSecondary;
  else if (variant === 'success') variantClass = styles.btnSuccess;
  else if (variant === 'danger') variantClass = styles.btnDanger;

  return (
    <button
      className={`${styles.btn} ${variantClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};
