import React from 'react';
import styles from './components.module.css';

interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className = '',
}) => {
  return (
    <div
      className={`${styles.card} ${hoverable ? styles.cardHover : ''} ${className}`}
    >
      {children}
    </div>
  );
};
