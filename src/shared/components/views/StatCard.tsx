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

  // Modern Institutional Fintech Pastel Configurations
  // Exactly matching trading terminal cards in reference design
  const configs = {
    blue: {
      bg: 'rgba(235, 246, 255, 0.92)',
      border: '#bfdbfe',
      accentColor: '#3b82f6',
      iconBg: 'rgba(59, 130, 246, 0.12)',
      iconBorder: 'rgba(59, 130, 246, 0.22)',
      titleColor: '#1e3a8a',
      valueColor: '#0f172a',
      subtitleColor: '#475569',
      barColor: '#3b82f6',
      hoverBorder: '#60a5fa',
    },
    emerald: {
      bg: 'rgba(236, 253, 245, 0.92)',
      border: '#bbf7d0',
      accentColor: '#10b981',
      iconBg: 'rgba(16, 185, 129, 0.12)',
      iconBorder: 'rgba(16, 185, 129, 0.22)',
      titleColor: '#065f46',
      valueColor: '#064e3b',
      subtitleColor: '#047857',
      barColor: '#10b981',
      hoverBorder: '#34d399',
    },
    purple: {
      bg: 'rgba(250, 245, 255, 0.92)',
      border: '#e9d5ff',
      accentColor: '#a855f7',
      iconBg: 'rgba(168, 85, 247, 0.12)',
      iconBorder: 'rgba(168, 85, 247, 0.22)',
      titleColor: '#6b21a8',
      valueColor: '#4c1d95',
      subtitleColor: '#7e22ce',
      barColor: '#a855f7',
      hoverBorder: '#c084fc',
    },
    amber: {
      bg: 'rgba(255, 251, 235, 0.92)',
      border: '#fde68a',
      accentColor: '#f59e0b',
      iconBg: 'rgba(245, 158, 11, 0.12)',
      iconBorder: 'rgba(245, 158, 11, 0.22)',
      titleColor: '#92400e',
      valueColor: '#78350f',
      subtitleColor: '#b45309',
      barColor: '#f59e0b',
      hoverBorder: '#fbbf24',
    },
    rose: {
      bg: 'rgba(255, 241, 242, 0.92)',
      border: '#fecdd3',
      accentColor: '#f43f5e',
      iconBg: 'rgba(244, 63, 94, 0.12)',
      iconBorder: 'rgba(244, 63, 94, 0.22)',
      titleColor: '#9f1239',
      valueColor: '#881337',
      subtitleColor: '#be123c',
      barColor: '#f43f5e',
      hoverBorder: '#fb7185',
    },
    cyan: {
      bg: 'rgba(236, 254, 255, 0.92)',
      border: '#a5f3fc',
      accentColor: '#06b6d4',
      iconBg: 'rgba(6, 182, 212, 0.12)',
      iconBorder: 'rgba(6, 182, 212, 0.22)',
      titleColor: '#0e7490',
      valueColor: '#155e75',
      subtitleColor: '#0891b2',
      barColor: '#06b6d4',
      hoverBorder: '#22d3ee',
    },
    indigo: {
      bg: 'rgba(245, 243, 255, 0.92)',
      border: '#ddd6fe',
      accentColor: '#6366f1',
      iconBg: 'rgba(99, 102, 241, 0.12)',
      iconBorder: 'rgba(99, 102, 241, 0.22)',
      titleColor: '#4338ca',
      valueColor: '#312e81',
      subtitleColor: '#4f46e5',
      barColor: '#6366f1',
      hoverBorder: '#818cf8',
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
        borderRadius: '16px',
        padding: '18px 20px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02)',
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
          e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.06)';
          e.currentTarget.style.borderColor = cfg.hoverBorder;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick || hoverable) {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02)';
          e.currentTarget.style.borderColor = cfg.border;
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

      {/* Main Content Area - Text has right padding so it never overlaps with bottom-right bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: 1, paddingRight: '44px' }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          color: cfg.titleColor,
          letterSpacing: '0.04em',
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

      {/* Mini 5-Bar Ascending Watermark Chart strictly in the bottom-right corner - Zero overlap with text */}
      <svg
        viewBox="0 0 46 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '12px',
          bottom: '10px',
          width: '38px',
          height: '26px',
          pointerEvents: 'none',
          opacity: 0.55
        }}
      >
        <rect x="0" y="24" width="6" height="8" rx="2" fill={cfg.barColor} />
        <rect x="9" y="18" width="6" height="14" rx="2" fill={cfg.barColor} />
        <rect x="18" y="12" width="6" height="20" rx="2" fill={cfg.barColor} />
        <rect x="27" y="6" width="6" height="26" rx="2" fill={cfg.barColor} />
        <rect x="36" y="0" width="6" height="32" rx="2" fill={cfg.barColor} />
      </svg>
    </div>
  );
};
