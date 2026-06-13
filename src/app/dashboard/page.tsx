'use client';

import React from 'react';
import { useAppViewModel } from '../../viewmodels/AppContext';
import { Card } from '../../views/components/Card';
import { PerformanceChart } from '../../views/components/PerformanceChart';
import { Loader } from '../../views/components/Loader';
import { User, Award, ShieldCheck, Activity } from 'lucide-react';

export default function ClientDashboardOverview() {
  const { trades, clients, colors, loading, activeUser } = useAppViewModel();

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
      }
    }
  }, []);

  if (loading || !activeUser) {
    return <Loader title="Loading dashboard" text="Syncing executed breakout signals and checking active plans..." fullscreen={false} />;
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
  
  // Find the active subscription dynamically
  const activeSub = activeUser?.subscriptions?.find((sub: any) => sub.status === 'active');
  const isSubscriptionActive = matchedClient?.subscriptionStatus === 'active' || !!activeSub;
  const activePlanName = activeSub?.plan?.name || (isSubscriptionActive ? 'Active Plan' : 'No Active Plan');
  const activePlanStatus = activeSub?.status || matchedClient?.subscriptionStatus || 'pending';

  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }); // e.g. "14 June 2026"
  };

  const startDateStr = activeSub?.startDate ? formatDate(activeSub.startDate) : '--';
  const endDateStr = activeSub?.endDate ? formatDate(activeSub.endDate) : '--';

  // Calculate days left for active subscription warning
  let daysLeft: number | null = null;
  if (isSubscriptionActive && activeSub?.endDate) {
    const end = new Date(activeSub.endDate);
    const today = new Date();
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  const showExpiryWarning = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;

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
          Welcome back, {matchedClient?.user?.name || matchedClient?.name || activeUser.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Monitor automated breakout execution and subscription billing logs.</p>
      </div>

      {!isSubscriptionActive && (
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fee2e2',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <h4 style={{ color: '#991b1b', fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
              Subscription Inactive / Expired
            </h4>
            <p style={{ color: '#7f1d1d', fontSize: '13px' }}>
              You do not have an active subscription plan. Purchase a plan to start automated breakout trading execution on your Demat account.
            </p>
          </div>
          <a
            href="/dashboard/subscription"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            Purchase Plan
          </a>
        </div>
      )}

      {isSubscriptionActive && showExpiryWarning && (
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fef3c7',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <h4 style={{ color: '#b45309', fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
              Subscription Expiring Soon
            </h4>
            <p style={{ color: '#78350f', fontSize: '13px' }}>
              Your active plan expires in <strong>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left</strong>. Please renew your plan to prevent any automated trading execution breaks.
            </p>
          </div>
          <a
            href="/dashboard/subscription"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#d97706',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            Renew Plan
          </a>
        </div>
      )}

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
              <h4 style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', color: isSubscriptionActive ? colors.PRIMARY : 'var(--text-subtle)' }}>
                {activePlanName}
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Status: <strong style={{ color: isSubscriptionActive ? 'var(--color-success)' : 'var(--color-danger)' }}>{activePlanStatus.toUpperCase()}</strong>
              </p>
              {!isSubscriptionActive ? (
                <a href="/dashboard/subscription" style={{
                  marginTop: '10px',
                  display: 'inline-block',
                  textDecoration: 'none',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>Activate Now</a>
              ) : (
                <span style={{
                  marginTop: '10px',
                  display: 'inline-block',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: 'var(--color-success)',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  fontSize: '11px',
                  fontWeight: 700
                }}>Active</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Start Date:</span>
                <strong>{startDateStr}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Expiry Date:</span>
                <strong>{endDateStr}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Kite Connection:</span>
                <strong style={{ color: matchedClient?.accessToken ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {matchedClient?.accessToken ? 'Connected' : 'Disconnected'}
                </strong>
              </div>
              {matchedClient?.accessToken && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Kite Client ID:</span>
                    <strong>{matchedClient.zerodhaClientId || '--'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>API Key:</span>
                    <strong>{matchedClient.zerodhaApiKey ? `${matchedClient.zerodhaApiKey.slice(0, 6)}***` : '--'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Risk Limit:</span>
                    <strong>{matchedClient.riskPercentage ? `${Number(matchedClient.riskPercentage).toFixed(2)}%` : '1.00%'}</strong>
                  </div>
                </>


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
