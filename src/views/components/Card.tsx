import React from 'react';
import styles from './components.module.css';

interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className = '',
  style,
  onClick,
}) => {
  return (
    <div
      className={`${styles.card} ${hoverable ? styles.cardHover : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
