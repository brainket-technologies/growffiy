'use client';

import React from 'react';
import { useAppViewModel } from '../../viewmodels/AppContext';
import { Card } from '../../views/components/Card';
import { Button } from '../../views/components/Button';
import { PerformanceChart } from '../../views/components/PerformanceChart';
import { Users, TrendingUp, ShieldAlert, Award, Play, Square } from 'lucide-react';

export default function AdminDashboard() {
  const {
    clients,
    trades,
    isTradingActive,
    dashboardStats,
    toggleTrading,
    colors,
    loading,
  } = useAppViewModel();

  // Mock static PnL timeline points
  const pnlData = [45200, 68400, -12000, 89500, 112000, 145000, dashboardStats.totalPnl];
  const pnlLabels = ['13 May', '14 May', '15 May', '16 May', '17 May', '18 May', 'Today'];

  const stats = [
    { name: 'Total Clients', value: dashboardStats.totalClients, icon: Users, color: colors.PRIMARY },
    { name: 'Active Strategies', value: 24, icon: TrendingUp, color: colors.SUCCESS },
    { name: 'Live Accounts', value: dashboardStats.activeClients, icon: ShieldAlert, color: colors.WARNING },
    { name: 'Total P&L', value: `₹${dashboardStats.totalPnl.toLocaleString()}`, icon: Award, color: colors.DANGER },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Controls & Kill Switch */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Trading Terminal Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to Trade Pro algorithmic execution workspace.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {loading ? (
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--text-secondary)', 
              background: '#f1f5f9', 
              padding: '6px 16px', 
              borderRadius: '8px',
              fontWeight: 500,
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span className="live-dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--primary)' }}></span>
              Checking status...
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: isTradingActive ? 'var(--color-success-bg)' : '#f1f5f9',
                  color: isTradingActive ? 'var(--color-success)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isTradingActive ? 'var(--color-success)' : 'var(--text-muted)',
                    display: 'inline-block',
                  }}
                />
                {isTradingActive ? 'AUTO TRADING LIVE' : 'ENGINE STOPPED'}
              </div>

              <Button
                variant={isTradingActive ? 'danger' : 'success'}
                onClick={() => toggleTrading(!isTradingActive)}
              >
                {isTradingActive ? (
                  <>
                    <Square size={16} fill="white" /> Stop Trading
                  </>
                ) : (
                  <>
                    <Play size={16} fill="white" /> Start Auto Trading
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} hoverable={true}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>{stat.name}</p>
                  <h3 style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                    {stat.value}
                  </h3>
                </div>
                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: `${stat.color}15`, color: stat.color }}>
                  <Icon size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Analytics and Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <Card>
          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            P&L Overview (Cumulative)
          </h4>
          <PerformanceChart
            data={pnlData}
            labels={pnlLabels}
            strokeColor={colors.PRIMARY}
            fillColorStart={`${colors.PRIMARY}25`}
            fillColorEnd={`${colors.PRIMARY}00`}
          />
        </Card>

        <Card>
          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            System Connections
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <p style={{ fontWeight: 600 }}>Zerodha Kite API</p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Status: Active</p>
              </div>
              <span className="badge badge-success">Connected</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <p style={{ fontWeight: 600 }}>Razorpay Webhook</p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Status: Waiting for calls</p>
              </div>
              <span className="badge badge-success">Listening</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600 }}>Market Data Feed</p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Status: WebSocket Streaming</p>
              </div>
              <span className="badge badge-success">Live Ticks</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Trades Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Live & Recent Trades
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Autorefreshing every 3s</span>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Client</th>
                <th>Order Type</th>
                <th>Qty</th>
                <th>Entry Price</th>
                <th>Exit Price</th>
                <th>P&L (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No trades placed today. Start Auto Trading to generate signals.
                  </td>
                </tr>
              ) : (
                trades.map((trade) => {
                  const pnl = Number(trade.pnl || 0);
                  const clientName = trade.client?.user?.name || trade.clientName || 'System Client';
                  return (
                    <tr key={trade.id}>
                      <td style={{ fontWeight: 600 }}>{trade.symbol}</td>
                      <td>{clientName}</td>
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
