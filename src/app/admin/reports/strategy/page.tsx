'use client';

import React from 'react';
import { useAppViewModel } from '../../../../shared/viewmodels/AppContext';
import { Card } from '../../../../shared/components/views/Card';
import { Button } from '../../../../shared/components/views/Button';
import { Loader } from '../../../../shared/components/views/Loader';
import { TrendingUp, Award, Activity, BarChart2, Download, ShieldCheck } from 'lucide-react';

export default function StrategyReportPage() {
  const { trades = [], loading } = useAppViewModel();

  if (loading) {
    return <Loader title="Loading strategy report" text="Analyzing algorithmic executions and calculating stats..." fullscreen={false} />;
  }

  // Calculate strategy performance
  const strategyStats: Record<string, {
    name: string;
    totalTrades: number;
    winTrades: number;
    totalPnl: number;
    totalProfit: number;
    totalLoss: number;
    maxWin: number;
    maxLoss: number;
  }> = {};

  trades.forEach((trade) => {
    if (!trade) return;
    const strategyName = trade.strategy?.name || trade.strategyName || 'Pre-Open Momentum';
    const pnl = Number(trade.pnl || 0);

    if (!strategyStats[strategyName]) {
      strategyStats[strategyName] = {
        name: strategyName,
        totalTrades: 0,
        winTrades: 0,
        totalPnl: 0,
        totalProfit: 0,
        totalLoss: 0,
        maxWin: 0,
        maxLoss: 0,
      };
    }

    const stats = strategyStats[strategyName];
    stats.totalTrades += 1;
    stats.totalPnl += pnl;
    if (pnl > 0) {
      stats.winTrades += 1;
      stats.totalProfit += pnl;
      if (pnl > stats.maxWin) stats.maxWin = pnl;
    } else if (pnl < 0) {
      stats.totalLoss += Math.abs(pnl);
      if (pnl < stats.maxLoss) stats.maxLoss = pnl;
    }
  });

  const strategyList = Object.values(strategyStats);

  // Derive top/overview stats
  const totalAlgoPnl = strategyList.reduce((sum, s) => sum + s.totalPnl, 0);
  const bestStrategy = strategyList.length > 0 
    ? [...strategyList].sort((a, b) => b.totalPnl - a.totalPnl)[0]
    : null;
  const mostActive = strategyList.length > 0 
    ? [...strategyList].sort((a, b) => b.totalTrades - a.totalTrades)[0]
    : null;

  const handleExportCSV = () => {
    const headers = ['Strategy Name', 'Total Trades', 'Win Rate (%)', 'Total Profit/Loss (INR)', 'Profit Factor', 'Max Win', 'Max Loss'];
    const rows = strategyList.map(s => {
      const winRate = s.totalTrades > 0 ? (s.winTrades / s.totalTrades) * 100 : 0;
      const profitFactor = s.totalLoss > 0 ? (s.totalProfit / s.totalLoss) : s.totalProfit > 0 ? 99.9 : 0;
      return [
        s.name,
        s.totalTrades,
        winRate.toFixed(2),
        s.totalPnl.toFixed(2),
        profitFactor.toFixed(2),
        s.maxWin.toFixed(2),
        s.maxLoss.toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `strategy_performance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Strategy Performance Report
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review algorithmic efficiency, win ratios, and profit generation indicators.</p>
        </div>
        <Button variant="secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Grid Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Total Algorithmic P&L</p>
              <h3 style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: totalAlgoPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {totalAlgoPnl >= 0 ? '+' : ''}₹{totalAlgoPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: totalAlgoPnl >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: totalAlgoPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              <TrendingUp size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Best Performing Strategy</p>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: 'var(--text-primary)' }}>
                {bestStrategy ? bestStrategy.name : 'N/A'}
              </h3>
              {bestStrategy && (
                <p style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '4px', fontWeight: 600 }}>
                  ₹{bestStrategy.totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })} P&L
                </p>
              )}
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Award size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Most Executed Strategy</p>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: 'var(--text-primary)' }}>
                {mostActive ? mostActive.name : 'N/A'}
              </h3>
              {mostActive && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {mostActive.totalTrades} Total Orders Triggered
                </p>
              )}
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Activity size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Strategies Table */}
      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          Detailed Strategy Analytics
        </h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Strategy Name</th>
                <th>Total Signals</th>
                <th>Win Ratio</th>
                <th>Profit Factor</th>
                <th>Max Profit Trade</th>
                <th>Max Loss Trade</th>
                <th>Net P&L (INR)</th>
              </tr>
            </thead>
            <tbody>
              {strategyList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No strategy logs or active trade signals found.
                  </td>
                </tr>
              ) : (
                strategyList.map((s, idx) => {
                  const winRate = s.totalTrades > 0 ? (s.winTrades / s.totalTrades) * 100 : 0;
                  const profitFactor = s.totalLoss > 0 ? (s.totalProfit / s.totalLoss) : s.totalProfit > 0 ? 99.9 : 0;
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                      <td>{s.totalTrades}</td>
                      <td style={{ fontWeight: 600 }}>{winRate.toFixed(1)}%</td>
                      <td>{profitFactor.toFixed(2)}</td>
                      <td style={{ color: 'var(--color-success)' }}>+₹{s.maxWin.toFixed(2)}</td>
                      <td style={{ color: 'var(--color-danger)' }}>-₹{Math.abs(s.maxLoss).toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: s.totalPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {s.totalPnl >= 0 ? '+' : ''}₹{s.totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
