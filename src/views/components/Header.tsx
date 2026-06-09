import React from 'react';
import { Bell, HelpCircle, User } from 'lucide-react';
import styles from './components.module.css';

interface HeaderProps {
  title: string;
  userName?: string;
  userRole?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  userName = 'Firoz Mohammad',
  userRole = 'Administrator',
}) => {
  return (
    <header className={styles.header}>
      <h2 className={styles.headerTitle}>{title}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <Bell size={20} />
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              backgroundColor: 'var(--color-danger)',
              borderRadius: '50%',
            }}
          />
        </button>

        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <HelpCircle size={20} />
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderLeft: '1px solid var(--border-color)',
            paddingLeft: '24px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justify-content: 'center',
              color: 'var(--text-primary)',
            }}
          >
            <User size={16} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
              {userName}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {userRole}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
