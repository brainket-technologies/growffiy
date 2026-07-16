'use client';

import React from 'react';
import { Card } from '../../shared/components/views/Card';
import { Users, LineChart, TrendingUp, FileText, CreditCard, Activity, Search, LifeBuoy, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const MODULE_ICONS: Record<string, React.ReactNode> = {
  clients: <Users size={22} />,
  preopen: <Search size={22} />,
  plans: <CreditCard size={22} />,
  strategies: <TrendingUp size={22} />,
  trades: <Activity size={22} />,
  reports: <FileText size={22} />,
  support: <LifeBuoy size={22} />,
  marketWatch: <LineChart size={22} />,
};

const MODULE_COLORS: Record<string, string> = {
  clients: '#1252AB',
  preopen: '#0891b2',
  plans: '#7c3aed',
  strategies: '#059669',
  trades: '#dc2626',
  reports: '#ca8a04',
  support: '#2563eb',
  marketWatch: '#4f46e5',
};

export default function StaffDashboard() {
  const [permissions, setPermissions] = React.useState<any[]>([]);
  const [staffName, setStaffName] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('growffiy_logged_in_user_name');
      const storedPerms = localStorage.getItem('growffiy_staff_permissions');
      setStaffName(storedName || 'Staff');
      try { setPermissions(JSON.parse(storedPerms || '[]')); } catch { setPermissions([]); }
    }
  }, []);

  const moduleMap = new Map<string, { module: string; grantedCount: number }>();
  permissions.filter((p) => p.granted).forEach((p) => {
    const existing = moduleMap.get(p.module);
    if (existing) {
      existing.grantedCount += 1;
    } else {
      moduleMap.set(p.module, { module: p.module, grantedCount: 1 });
    }
  });
  const viewModules = Array.from(moduleMap.values());

  return (
    <div className="page-content">
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: 'var(--text-heading)' }}>Welcome, {staffName}</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        Staff Dashboard — you have access to {viewModules.length} module(s).
      </p>

      <div className="staff-modules-grid">
        {viewModules.length === 0 ? (
          <Card>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No modules assigned. Contact admin to get access.</p>
          </Card>
        ) : (
          viewModules.map((p) => {
            const color = MODULE_COLORS[p.module] || '#64748b';
            const label = p.module === 'marketWatch' ? 'Live Market' : p.module.replace(/([A-Z])/g, ' $1').trim();
            return (
              <Link key={p.module} href={`/staff/${p.module === 'marketWatch' ? 'market-watch' : p.module === 'reports' ? 'reports' : p.module}`}
                style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ height: '100%' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: `${color}15`, color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                  }}>
                    {MODULE_ICONS[p.module] || <BarChart3 size={22} />}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 4, textTransform: 'capitalize' }}>
                    {label}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {p.grantedCount} permission{p.grantedCount !== 1 ? 's' : ''} enabled
                  </p>
                </Card>
              </Link>
            );
          })
        )}
      </div>

      <style>{`
        .page-content {
          padding: 0;
        }
        .staff-modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        @media (max-width: 1024px) {
          .staff-modules-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .staff-modules-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .staff-modules-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .staff-modules-grid h3 {
            font-size: 14px !important;
          }
          .staff-modules-grid p {
            font-size: 11px !important;
          }
          .staff-modules-grid > a > div {
            padding: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
