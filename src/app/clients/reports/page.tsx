'use client';

import React, { useEffect, useState } from 'react';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';
import { Card } from '../../../shared/components/views/Card';
import { PerformanceChart } from '../../../shared/components/views/PerformanceChart';
import { Loader } from '../../../shared/components/views/Loader';
import { TrendingUp, TrendingDown, Calendar, AlertCircle } from 'lucide-react';

export default function ClientTradingReports() {
  const { trades, clients, colors, loading, activeUser } = useAppViewModel();
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  if (loading || !activeUser) {
    return <Loader title="Loading reports" text="Compiling execution records and computing win rates..." fullscreen={false} />;
  }

  // Find client configurations
  const matchedClient = clients.find(c => 
    c.zerodhaClientId?.toLowerCase() === activeUser.id.toLowerCase() || 
    c.user?.userId?.toLowerCase() === activeUser.id.toLowerCase() ||
    c.user?.name?.toLowerCase() === activeUser.name.toLowerCase()
  );

  // Filter client's trades
  const clientTrades = trades.filter(t => {
    const isClientTrade = matchedClient 
      ? t.clientId === matchedClient.id 
      : (t.client?.user?.name || t.clientName || '').toLowerCase().includes('aman') || t.clientId === 'c1';

    const matchSymbol = filterSymbol ? t.symbol.toLowerCase().includes(filterSymbol.toLowerCase()) : true;
    const matchStatus = filterStatus !== 'all' ? t.status === filterStatus : true;

    return isClientTrade && matchSymbol && matchStatus;
  });

  const totalTradesCount = clientTrades.length;
  const profitableTrades = clientTrades.filter(t => Number(t.pnl || 0) > 0);
  const winRate = totalTradesCount > 0 ? (profitableTrades.length / totalTradesCount) * 100 : 0;
  const totalNetProfit = clientTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
  const totalVolume = clientTrades.reduce((sum, t) => sum + Number(t.quantity || 0), 0);

  const clientPnlData = clientTrades.map(t => Number(t.pnl || 0));
  const clientPnlLabels = clientTrades.map(t => t.symbol);

  // Set fallbacks for chart if no trades
  const chartData = clientPnlData.length > 0 ? clientPnlData : [0, 1500, -800, 3200, 4800];
  const chartLabels = clientPnlLabels.length > 0 ? clientPnlLabels : ['Start', 'Trade 1', 'Trade 2', 'Trade 3', 'Today'];

  const stats = [
    { name: 'Win Rate', value: `${winRate.toFixed(1)}%`, desc: `${profitableTrades.length} of ${totalTradesCount} trades`, color: colors.INFO },
    { name: 'Net Profit/Loss', value: totalNetProfit >= 0 ? `+₹${totalNetProfit.toFixed(2)}` : `-₹${Math.abs(totalNetProfit).toFixed(2)}`, desc: 'Today\'s breakout cycles', color: totalNetProfit >= 0 ? colors.SUCCESS : colors.DANGER },
    { name: 'Total Volume traded', value: `${totalVolume} Units`, desc: 'Aggregated position quantity', color: colors.PRIMARY },
  ];

  return (
    <div className="page-reports" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
          Trading Reports
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Analyze mathematical performance curves and track transaction execution sheets.</p>
      </div>

      <div className="reports-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 }}>{stat.name}</p>
            <h3 style={{ fontSize: '22px', fontWeight: 700, marginTop: '8px', color: stat.color, fontFamily: 'var(--font-title)' }}>
              {stat.value}
            </h3>
            <p style={{ color: 'var(--text-subtle)', fontSize: '12px', marginTop: '4px' }}>{stat.desc}</p>
          </Card>
        ))}
      </div>

      <div className="reports-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start' }}>
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: 'var(--font-title)' }}>
            Session Profit Trajectory
          </h3>
          <PerformanceChart
            data={chartData}
            labels={chartLabels}
            strokeColor={colors.PRIMARY}
            fillColorStart={`${colors.PRIMARY}20`}
            fillColorEnd={`${colors.PRIMARY}00`}
          />
        </Card>

        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', fontFamily: 'var(--font-title)' }}>
            Execution Filter Sheet
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-body)', display: 'block', marginBottom: '6px' }}>Filter by Symbol</label>
              <input
                type="text"
                placeholder="e.g. INFYS, SBIN..."
                value={filterSymbol}
                onChange={(e) => setFilterSymbol(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-body)', display: 'block', marginBottom: '6px' }}>Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '14px', backgroundColor: 'white' }}
              >
                <option value="all">All Transactions</option>
                <option value="open">Open Positions</option>
                <option value="closed">Closed Positions</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: 'var(--font-title)' }}>
          Detailed Execution Sheet
        </h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Order Type</th>
                <th>Quantity</th>
                <th>Entry Price</th>
                <th>Exit Price</th>
                <th>Total P&L</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clientTrades.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No execution matches for active filters.
                  </td>
                </tr>
              ) : (
                clientTrades.map((t) => {
                  const pnlVal = Number(t.pnl || 0);
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.symbol}</td>
                      <td>{t.orderType}</td>
                      <td>{t.quantity}</td>
                      <td>₹{Number(t.entryPrice || 0).toFixed(2)}</td>
                      <td>{t.exitPrice ? `₹${Number(t.exitPrice).toFixed(2)}` : '--'}</td>
                      <td style={{ fontWeight: 600, color: pnlVal >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {pnlVal >= 0 ? `+₹${pnlVal.toFixed(2)}` : `-₹${Math.abs(pnlVal).toFixed(2)}`}
                      </td>
                      <td>
                        <span className={`badge ${t.status === 'open' ? 'badge-info' : 'badge-success'}`}>
                          {t.status}
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
      <style>{`
@media (max-width: 1024px) {
  .reports-main-grid { grid-template-columns: 1fr !important; }
}
@media (max-width: 640px) {
  .reports-stats-grid { grid-template-columns: 1fr !important; }
  .reports-main-grid { grid-template-columns: 1fr !important; }
  .table-responsive table { font-size: 11px; }
  .table-responsive th, .table-responsive td { padding: 8px 4px !important; }
  .table-responsive th:nth-child(2), .table-responsive td:nth-child(2) { display: none; }
  .table-responsive th:nth-child(5), .table-responsive td:nth-child(5) { display: none; }
}
      `}</style>
    </div>
  );
}
