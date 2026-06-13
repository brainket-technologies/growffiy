'use client';

import React from 'react';
import { useAppViewModel } from '../../viewmodels/AppContext';
import { Card } from '../../views/components/Card';
import { PerformanceChart } from '../../views/components/PerformanceChart';
import { User, Award, ShieldCheck, Activity } from 'lucide-react';

export default function ClientDashboardOverview() {
  const { trades, clients, colors } = useAppViewModel();
  const [activeUser, setActiveUser] = React.useState<any>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('growffiy_logged_in_user_id');
      const storedRole = localStorage.getItem('growffiy_logged_in_user_role');
      if (!storedId || storedRole !== 'client') {
        if (storedRole === 'admin') {
          window.location.href = '/admin';
        } else {
          localStorage.removeItem('growffiy_logged_in_user_id');
          localStorage.removeItem('growffiy_logged_in_user_role');
          window.location.href = '/login';
        }
        return;
      }
      const cleanName = storedId
        .split(/[_-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setActiveUser({ name: cleanName, id: storedId });
    }
  }, []);

  if (!activeUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontFamily: 'sans-serif' }}>
        Authenticating session...
      </div>
    );
  }

  // Find dynamic configuration matches for this client from active clients database list
  const matchedClient = clients.find(c => 
    c.zerodhaClientId?.toLowerCase() === activeUser.id.toLowerCase() || 
    c.user?.userId?.toLowerCase() === activeUser.id.toLowerCase() ||
    c.user?.name?.toLowerCase() === activeUser.name.toLowerCase()
  );

  // Fallbacks: if matchedClient is found, use its details, otherwise fallback to static presets
  const capital = matchedClient ? Number(matchedClient.capital) : 250000;
  const activeStrategy = matchedClient?.strategyId ? 
    (matchedClient.strategyId.split(/[_-]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')) : 
    'Pre-Open Breakout';

  // Filter trades placed on behalf of this client dynamically
  const clientTrades = trades.filter(t => {
    if (matchedClient) {
      return t.clientId === matchedClient.id;
    }
    const name = t.client?.user?.name || t.clientName || '';
    return name.toLowerCase().includes('aman') || t.clientId === 'c1';
  });

  const totalPnl = clientTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
  const activePlan = {
    name: 'Quarterly Plan',
    price: 12999,
    startDate: '10 May 2026',
    expiryDate: '10 Aug 2026',
    status: matchedClient?.subscriptionStatus || 'active',
  };

  const clientPnlData = [12000, 24000, 18000, 31000, 42000, 48000, totalPnl];
  const clientPnlLabels = ['13 May', '14 May', '15 May', '16 May', '17 May', '18 May', 'Today'];

  const stats = [
    { name: 'Today P&L', value: totalPnl >= 0 ? `+₹${totalPnl.toFixed(2)}` : `-₹${Math.abs(totalPnl).toFixed(2)}`, color: totalPnl >= 0 ? colors.SUCCESS : colors.DANGER },
    { name: 'Allocated Capital', value: `₹${capital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: colors.PRIMARY },
    { name: 'Active Strategy', value: activeStrategy, color: colors.INFO },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          Welcome back, {activeUser.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Monitor automated breakout execution and subscription billing logs.</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>{stat.name}</p>
            <h3 style={{ fontSize: '22px', fontWeight: 700, marginTop: '8px', color: stat.color, fontFamily: 'var(--font-title)' }}>
              {stat.value}
            </h3>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* P&L Performance */}
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: 'var(--font-title)' }}>
            My Performance Curve
          </h3>
          <PerformanceChart
            data={clientPnlData}
            labels={clientPnlLabels}
            strokeColor={colors.PRIMARY}
            fillColorStart={`${colors.PRIMARY}20`}
            fillColorEnd={`${colors.PRIMARY}00`}
          />
        </Card>

        {/* Subscription Info */}
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: 'var(--font-title)' }}>
            My Active Subscription
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Active Plan</p>
              <h4 style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', color: colors.PRIMARY }}>
                {activePlan.name}
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Expires on: <strong>{activePlan.expiryDate}</strong>
              </p>
              <span className="badge badge-success" style={{ marginTop: '10px' }}>Active</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Start Date:</span>
                <strong>{activePlan.startDate}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Demat Connection:</span>
                <strong style={{ color: 'var(--color-success)' }}>Linked</strong>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Client Trades List */}
      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: 'var(--font-title)' }}>
          My Executed Trades
        </h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Strategy</th>
                <th>Order Type</th>
                <th>Quantity</th>
                <th>Entry Price</th>
                <th>Exit Price</th>
                <th>P&L (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clientTrades.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No trades executed today. Trading engine is waiting for signal breakouts.
                  </td>
                </tr>
              ) : (
                clientTrades.map((trade) => {
                  const pnl = Number(trade.pnl || 0);
                  return (
                    <tr key={trade.id}>
                      <td style={{ fontWeight: 600 }}>{trade.symbol}</td>
                      <td>Pre-Open Breakout</td>
                      <td>{trade.orderType}</td>
                      <td>{trade.quantity}</td>
                      <td>₹{Number(trade.entryPrice || 0).toFixed(2)}</td>
                      <td>{trade.exitPrice ? `₹${Number(trade.exitPrice).toFixed(2)}` : '--'}</td>
                      <td style={{ fontWeight: 600, color: pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {pnl >= 0 ? `+₹${pnl.toFixed(2)}` : `-₹${Math.abs(pnl).toFixed(2)}`}
                      </td>
                      <td>
                        <span className={`badge ${trade.status === 'open' ? 'badge-info' : 'badge-success'}`}>
                          {trade.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
