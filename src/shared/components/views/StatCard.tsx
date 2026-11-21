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

  // Variant Configuration
  const configs = {
    blue: {
      bg: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #eff6ff 100%)',
      border: '1px solid #bfdbfe',
      shadow: '0 4px 15px rgba(37, 99, 235, 0.06)',
      titleColor: '#0f2744',
      valueColor: '#002060',
      subtitleColor: '#1e40af',
      iconColor: '#2563eb',
      pattern: (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'radial-gradient(rgba(59, 130, 246, 0.12) 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
          pointerEvents: 'none',
          zIndex: 0
        }} />
      ),
      waves: (
        <svg viewBox="0 0 180 90" preserveAspectRatio="none" style={{ position: 'absolute', right: 0, bottom: 0, width: '45%', height: '75%', pointerEvents: 'none', zIndex: 1 }}>
          <path d="M0,70 C45,50 85,85 130,60 C155,45 170,52 180,55 L180,90 L0,90 Z" fill="rgba(147, 197, 253, 0.5)" />
          <path d="M20,80 C60,65 95,90 140,72 C160,60 172,64 180,66 L180,90 L20,90 Z" fill="rgba(96, 165, 250, 0.45)" />
          <path d="M0,70 C45,50 85,85 130,60 C155,45 170,52 180,55" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
          <path d="M20,80 C60,65 95,90 140,72 C160,60 172,64 180,66" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    },
    emerald: {
      bg: 'linear-gradient(135deg, #dcfce7 0%, #e6fced 50%, #f0fdf4 100%)',
      border: '1px solid #bbf7d0',
      shadow: '0 4px 15px rgba(16, 185, 129, 0.06)',
      titleColor: '#064e3b',
      valueColor: '#065f46',
      subtitleColor: '#047857',
      iconColor: '#059669',
      pattern: (
        <svg style={{ position: 'absolute', top: 0, right: 0, width: '60%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.22 }}>
          <line x1="20%" y1="0" x2="20%" y2="100%" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="80%" y1="0" x2="80%" y2="100%" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="0" y1="35%" x2="100%" y2="35%" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
      ),
      waves: (
        <svg viewBox="0 0 180 90" preserveAspectRatio="none" style={{ position: 'absolute', right: 0, bottom: 0, width: '45%', height: '80%', pointerEvents: 'none', zIndex: 1 }}>
          <path d="M0,85 C50,85 70,75 105,45 C125,28 150,22 180,15 L180,90 L0,90 Z" fill="rgba(167, 243, 208, 0.55)" />
          <path d="M30,90 C70,90 95,78 125,50 C145,32 165,26 180,22 L180,90 L30,90 Z" fill="rgba(110, 231, 183, 0.45)" />
          <path d="M0,85 C50,85 70,75 105,45 C125,28 150,22 180,15" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
          <path d="M30,90 C70,90 95,78 125,50 C145,32 165,26 180,22" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="178" cy="16" r="3.5" fill="#059669" />
          <circle cx="178" cy="16" r="6" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.6" />
        </svg>
      )
    },
    purple: {
      bg: 'linear-gradient(135deg, #f3e8ff 0%, #fae8ff 50%, #faf5ff 100%)',
      border: '1px solid #e9d5ff',
      shadow: '0 4px 15px rgba(147, 51, 234, 0.06)',
      titleColor: '#3b0764',
      valueColor: '#1e1b4b',
      subtitleColor: '#6b21a8',
      iconColor: '#7c3aed',
      pattern: (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.18 }}>
          <circle cx="12%" cy="25%" r="2" fill="#a855f7" />
          <circle cx="28%" cy="15%" r="3" fill="#a855f7" />
          <circle cx="38%" cy="40%" r="2" fill="#a855f7" />
          <circle cx="55%" cy="20%" r="2.5" fill="#a855f7" />
          <circle cx="72%" cy="32%" r="2" fill="#a855f7" />
          <line x1="12%" y1="25%" x2="28%" y2="15%" stroke="#a855f7" strokeWidth="0.8" />
          <line x1="28%" y1="15%" x2="38%" y2="40%" stroke="#a855f7" strokeWidth="0.8" />
          <line x1="38%" y1="40%" x2="55%" y2="20%" stroke="#a855f7" strokeWidth="0.8" />
          <line x1="55%" y1="20%" x2="72%" y2="32%" stroke="#a855f7" strokeWidth="0.8" />
        </svg>
      ),
      waves: (
        <svg viewBox="0 0 180 90" preserveAspectRatio="none" style={{ position: 'absolute', right: 0, bottom: 0, width: '48%', height: '80%', pointerEvents: 'none', zIndex: 1 }}>
          <path d="M0,90 C30,75 50,40 85,55 C120,70 145,35 180,45 L180,90 L0,90 Z" fill="rgba(233, 213, 255, 0.55)" />
          <path d="M15,90 C45,78 65,48 95,62 C130,75 152,44 180,52 L180,90 L15,90 Z" fill="rgba(216, 180, 254, 0.45)" />
          <path d="M0,90 C30,75 50,40 85,55 C120,70 145,35 180,45" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
          <path d="M15,90 C45,78 65,48 95,62 C130,75 152,44 180,52" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    },
    amber: {
      bg: 'linear-gradient(135deg, #fef3c7 0%, #fef9c3 50%, #fffbeb 100%)',
      border: '1px solid #fde68a',
      shadow: '0 4px 15px rgba(217, 119, 6, 0.06)',
      titleColor: '#78350f',
      valueColor: '#451a03',
      subtitleColor: '#b45309',
      iconColor: '#d97706',
      pattern: (
        <svg style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.16 }}>
          <circle cx="85%" cy="30%" r="20" fill="none" stroke="#d97706" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="85%" cy="30%" r="40" fill="none" stroke="#d97706" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="85%" cy="30%" r="60" fill="none" stroke="#d97706" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
      ),
      waves: (
        <svg viewBox="0 0 180 90" preserveAspectRatio="none" style={{ position: 'absolute', right: 0, bottom: 0, width: '46%', height: '76%', pointerEvents: 'none', zIndex: 1 }}>
          <path d="M0,75 C40,60 80,75 120,50 C145,35 165,40 180,38 L180,90 L0,90 Z" fill="rgba(253, 230, 138, 0.55)" />
          <path d="M25,82 C65,70 100,80 135,58 C155,46 170,48 180,46 L180,90 L25,90 Z" fill="rgba(251, 191, 36, 0.45)" />
          <path d="M0,75 C40,60 80,75 120,50 C145,35 165,40 180,38" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <path d="M25,82 C65,70 100,80 135,58 C155,46 170,48 180,46" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    },
    rose: {
      bg: 'linear-gradient(135deg, #ffe4e6 0%, #fee2e2 50%, #fff1f2 100%)',
      border: '1px solid #fecdd3',
      shadow: '0 4px 15px rgba(225, 29, 72, 0.06)',
      titleColor: '#881337',
      valueColor: '#4c0519',
      subtitleColor: '#be123c',
      iconColor: '#e11d48',
      pattern: (
        <svg style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.16 }}>
          <path d="M0,20 L100,20 M0,40 L100,40 M0,60 L100,60" stroke="#f43f5e" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      ),
      waves: (
        <svg viewBox="0 0 180 90" preserveAspectRatio="none" style={{ position: 'absolute', right: 0, bottom: 0, width: '45%', height: '76%', pointerEvents: 'none', zIndex: 1 }}>
          <path d="M0,80 C50,75 75,55 110,65 C140,75 160,45 180,40 L180,90 L0,90 Z" fill="rgba(254, 205, 211, 0.6)" />
          <path d="M20,86 C65,80 88,62 122,72 C150,80 168,52 180,48 L180,90 L20,90 Z" fill="rgba(251, 113, 133, 0.45)" />
          <path d="M0,80 C50,75 75,55 110,65 C140,75 160,45 180,40" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
          <path d="M20,86 C65,80 88,62 122,72 C150,80 168,52 180,48" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    },
    cyan: {
      bg: 'linear-gradient(135deg, #cffafe 0%, #e0f2fe 50%, #ecfeff 100%)',
      border: '1px solid #a5f3fc',
      shadow: '0 4px 15px rgba(6, 182, 212, 0.06)',
      titleColor: '#164e63',
      valueColor: '#083344',
      subtitleColor: '#0e7490',
      iconColor: '#0891b2',
      pattern: (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'radial-gradient(rgba(6, 182, 212, 0.12) 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
          pointerEvents: 'none',
          zIndex: 0
        }} />
      ),
      waves: (
        <svg viewBox="0 0 180 90" preserveAspectRatio="none" style={{ position: 'absolute', right: 0, bottom: 0, width: '46%', height: '78%', pointerEvents: 'none', zIndex: 1 }}>
          <path d="M0,65 C35,45 75,80 115,55 C145,35 168,55 180,50 L180,90 L0,90 Z" fill="rgba(165, 243, 252, 0.55)" />
          <path d="M20,74 C50,58 85,88 125,65 C152,48 172,62 180,58 L180,90 L20,90 Z" fill="rgba(103, 232, 249, 0.45)" />
          <path d="M0,65 C35,45 75,80 115,55 C145,35 168,55 180,50" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
          <path d="M20,74 C50,58 85,88 125,65 C152,48 172,62 180,58" fill="none" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    },
    indigo: {
      bg: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 50%, #eef2ff 100%)',
      border: '1px solid #c7d2fe',
      shadow: '0 4px 15px rgba(79, 70, 229, 0.06)',
      titleColor: '#1e1b4b',
      valueColor: '#312e81',
      subtitleColor: '#4338ca',
      iconColor: '#4f46e5',
      pattern: (
        <svg style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.15 }}>
          <line x1="10%" y1="0" x2="90%" y2="100%" stroke="#4f46e5" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="30%" y1="0" x2="100%" y2="80%" stroke="#4f46e5" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
      ),
      waves: (
        <svg viewBox="0 0 180 90" preserveAspectRatio="none" style={{ position: 'absolute', right: 0, bottom: 0, width: '47%', height: '80%', pointerEvents: 'none', zIndex: 1 }}>
          <path d="M0,82 C40,55 80,85 125,48 C150,28 168,36 180,32 L180,90 L0,90 Z" fill="rgba(199, 210, 254, 0.55)" />
          <path d="M20,88 C55,65 92,90 132,58 C155,40 172,46 180,42 L180,90 L20,90 Z" fill="rgba(165, 180, 252, 0.45)" />
          <path d="M0,82 C40,55 80,85 125,48 C150,28 168,36 180,32" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
          <path d="M20,88 C55,65 92,90 132,58 C155,40 172,46 180,42" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    }
  };

  const cfg = configs[normalizedVariant] || configs.blue;

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        padding: '20px 22px',
        background: cfg.bg,
        border: cfg.border,
        boxShadow: cfg.shadow,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        ...style
      }}
      onMouseEnter={(e) => {
        if (onClick || hoverable) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,0,0,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick || hoverable) {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = cfg.shadow;
        }
      }}
    >
      {/* Textured Background Pattern */}
      {cfg.pattern}

      {/* Leading Icon or Image */}
      {imgSrc ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imgSrc}
          alt={title}
          style={{ width: '52px', height: '58px', objectFit: 'contain', zIndex: 2, flexShrink: 0 }}
        />
      ) : icon ? (
        <div style={{
          zIndex: 2,
          flexShrink: 0,
          width: '46px',
          height: '46px',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: cfg.iconColor,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.7)'
        }}>
          {icon}
        </div>
      ) : null}

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 2, minWidth: 0, flex: 1 }}>
        <span style={{
          fontSize: '13.5px',
          fontWeight: 700,
          color: cfg.titleColor,
          letterSpacing: '-0.2px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {title}
        </span>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '26px',
            fontWeight: 800,
            color: cfg.valueColor,
            lineHeight: 1.15,
            fontFamily: 'var(--font-title, inherit)'
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
            opacity: 0.9,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {subtitle}
          </span>
        )}

        {children}
      </div>

      {/* Unique Geometric Bottom Waves */}
      {cfg.waves}
    </div>
  );
};
