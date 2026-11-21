import React from 'react';

export type StatCardVariant = 'blue' | 'emerald' | 'green' | 'purple' | 'violet' | 'amber' | 'yellow' | 'rose' | 'red' | 'cyan' | 'teal' | 'indigo';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  imgSrc?: string;
  variant?: StatCardVariant;
  badge?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  children?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  imgSrc,
  variant = 'blue',
  badge,
  style,
  className = '',
  onClick,
  hoverable = false,
  children
}) => {
  // Normalize color alias
  const normalizedVariant: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'cyan' | 'indigo' =
    variant === 'green' ? 'emerald' :
    variant === 'violet' ? 'purple' :
    variant === 'yellow' ? 'amber' :
    variant === 'red' ? 'rose' :
    variant === 'teal' ? 'cyan' :
    (variant as any);

  // High-End Institutional Fintech Styling Configurations
  const configs = {
    blue: {
      accentColor: '#104193',
      glowColor: 'rgba(16, 65, 147, 0.05)',
      iconBg: 'rgba(16, 65, 147, 0.07)',
      iconBorder: 'rgba(16, 65, 147, 0.16)',
      titleColor: '#64748b',
      valueColor: '#0f172a',
      subtitleColor: '#64748b',
      hoverBorder: 'rgba(16, 65, 147, 0.35)',
    },
    emerald: {
      accentColor: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.05)',
      iconBg: 'rgba(16, 185, 129, 0.08)',
      iconBorder: 'rgba(16, 185, 129, 0.18)',
      titleColor: '#64748b',
      valueColor: '#047857',
      subtitleColor: '#059669',
      hoverBorder: 'rgba(16, 185, 129, 0.35)',
    },
    purple: {
      accentColor: '#8b5cf6',
      glowColor: 'rgba(139, 92, 246, 0.05)',
      iconBg: 'rgba(139, 92, 246, 0.08)',
      iconBorder: 'rgba(139, 92, 246, 0.18)',
      titleColor: '#64748b',
      valueColor: '#1e1b4b',
      subtitleColor: '#6b21a8',
      hoverBorder: 'rgba(139, 92, 246, 0.35)',
    },
    amber: {
      accentColor: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.05)',
      iconBg: 'rgba(245, 158, 11, 0.08)',
      iconBorder: 'rgba(245, 158, 11, 0.18)',
      titleColor: '#64748b',
      valueColor: '#78350f',
      subtitleColor: '#b45309',
      hoverBorder: 'rgba(245, 158, 11, 0.35)',
    },
    rose: {
      accentColor: '#f43f5e',
      glowColor: 'rgba(244, 63, 94, 0.05)',
      iconBg: 'rgba(244, 63, 94, 0.08)',
      iconBorder: 'rgba(244, 63, 94, 0.18)',
      titleColor: '#64748b',
      valueColor: '#9f1239',
      subtitleColor: '#be123c',
      hoverBorder: 'rgba(244, 63, 94, 0.35)',
    },
    cyan: {
      accentColor: '#06b6d4',
      glowColor: 'rgba(6, 182, 212, 0.05)',
      iconBg: 'rgba(6, 182, 212, 0.08)',
      iconBorder: 'rgba(6, 182, 212, 0.18)',
      titleColor: '#64748b',
      valueColor: '#0e7490',
      subtitleColor: '#0891b2',
      hoverBorder: 'rgba(6, 182, 212, 0.35)',
    },
    indigo: {
      accentColor: '#6366f1',
      glowColor: 'rgba(99, 102, 241, 0.05)',
      iconBg: 'rgba(99, 102, 241, 0.08)',
      iconBorder: 'rgba(99, 102, 241, 0.18)',
      titleColor: '#64748b',
      valueColor: '#312e81',
      subtitleColor: '#4338ca',
      hoverBorder: 'rgba(99, 102, 241, 0.35)',
    }
  };

  const cfg = configs[normalizedVariant] || configs.blue;

  // Intelligent icon resolution
  const resolvedImgSrc = imgSrc || (() => {
    const t = (title || '').toLowerCase();
    if (t.includes('demat') || t.includes('capital') || t.includes('invest') || t.includes('balance')) return '/card_icon_demat.png';
    if (t.includes('p&l') || t.includes('pnl') || t.includes('profit') || t.includes('return') || t.includes('earning')) return '/card_icon_pnl.png';
    if (t.includes('trader')) return '/card_icon_traders.png';
    if (t.includes('inactive') || t.includes('cancel')) return '/card_icon_inactive.png';
    if (t.includes('strateg')) return '/card_icon_strategy.png';
    if (t.includes('per day') || t.includes('wallet') || t.includes('margin') || t.includes('request')) return '/card_icon_wallet.png';
    if (t.includes('success') || t.includes('closed') || t.includes('target') || t.includes('win')) return '/card_icon_success.png';
    if (t.includes('fail') || t.includes('loss') || t.includes('stoploss') || t.includes('sl hit')) return '/card_icon_failed.png';
    if (t.includes('open') || t.includes('live') || t.includes('session')) return '/card_icon_active_trade.png';
    if (t.includes('trade') || t.includes('batch') || t.includes('execution') || t.includes('transaction')) return '/card_icon_trades.png';
    if (t.includes('subscript') || t.includes('plan') || t.includes('revenue') || t.includes('top earning')) return '/card_icon_subscription.png';
    if (t.includes('client') || t.includes('user') || t.includes('staff') || t.includes('account')) return '/card_icon_users.png';

    // Fallback by variant
    switch (normalizedVariant) {
      case 'emerald': return '/card_icon_pnl.png';
      case 'purple': return '/card_icon_traders.png';
      case 'amber': return '/card_icon_strategy.png';
      case 'rose': return '/card_icon_failed.png';
      case 'cyan': return '/card_icon_active_trade.png';
      case 'indigo': return '/card_icon_trades.png';
      case 'blue':
      default: return '/card_icon_users.png';
    }
  })();

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '14px',
        padding: '18px 20px',
        background: 'var(--bg-card, #ffffff)',
        backgroundImage: `radial-gradient(circle at top right, ${cfg.glowColor} 0%, transparent 70%)`,
        border: '1px solid var(--border-color, #e2e8f0)',
        borderTop: `3px solid ${cfg.accentColor}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        ...style
      }}
      onMouseEnter={(e) => {
        if (onClick || hoverable) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
          e.currentTarget.style.borderColor = cfg.hoverBorder;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick || hoverable) {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)';
          e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)';
          e.currentTarget.style.borderTop = `3px solid ${cfg.accentColor}`;
        }
      }}
    >
      {/* Sleek, Executive Icon Container */}
      <div style={{
        width: '46px',
        height: '46px',
        minWidth: '46px',
        borderRadius: '12px',
        background: cfg.iconBg,
        border: `1px solid ${cfg.iconBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {resolvedImgSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={resolvedImgSrc}
            alt={title}
            style={{
              width: '28px',
              height: '28px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))'
            }}
          />
        ) : icon ? (
          <span style={{ color: cfg.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </span>
        ) : null}
      </div>

      {/* Main Content Area - Clean, Legible, Zero Overlap */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: 1 }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: cfg.titleColor,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {title}
        </span>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '24px',
            fontWeight: 800,
            color: cfg.valueColor,
            lineHeight: 1.15,
            fontFamily: 'var(--font-title, inherit)',
            letterSpacing: '-0.02em'
          }}>
            {value}
          </span>
          {badge}
        </div>

        {subtitle && (
          <span style={{
            fontSize: '11.5px',
            fontWeight: 500,
            color: cfg.subtitleColor,
            marginTop: '1px',
            lineHeight: 1.35,
            wordBreak: 'break-word'
          }}>
            {subtitle}
          </span>
        )}

        {children}
      </div>
    </div>
  );
};
