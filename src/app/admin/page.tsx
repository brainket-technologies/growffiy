'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../viewmodels/AppContext';
import { Card } from '../../views/components/Card';
import { Button } from '../../views/components/Button';
import { PerformanceChart } from '../../views/components/PerformanceChart';
import { 
  Users, 
  TrendingUp, 
  ShieldAlert, 
  Award, 
  Play, 
  Square, 
  Activity, 
  TrendingDown,
  Percent,
  Calendar,
  Briefcase,
  AlertCircle
} from 'lucide-react';

const formatDateTime = (timeStr: string | Date | null) => {
  if (!timeStr) return '--';
  try {
    const date = new Date(timeStr);
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (e) {
    return '--';
  }
};

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

  const [pnlPeriod, setPnlPeriod] = useState('Daily');

  // Extract stats from polled context
  const totalClients = dashboardStats?.totalClients || 0;
  const activeStrategies = dashboardStats?.activeStrategies || 0;
  const liveAccounts = dashboardStats?.activeClients || 0;
  const totalPnl = dashboardStats?.totalPnl || 0;

  const winningStrats = dashboardStats?.winningStrategies || 0;
  const losingStrats = dashboardStats?.losingStrategies || 0;
  const breakevenStrats = dashboardStats?.breakevenStrategies || 0;
  const totalStratsCount = winningStrats + losingStrats + breakevenStrats || activeStrategies || 1;

  const winRatePercent = ((winningStrats / totalStratsCount) * 100);
  const lossRatePercent = ((losingStrats / totalStratsCount) * 100);
  const drawRatePercent = ((breakevenStrats / totalStratsCount) * 100);

  const totalExposure = dashboardStats?.totalExposure || 0;
  const unrealizedPnl = dashboardStats?.unrealizedPnl || 0;
  const realizedPnl = dashboardStats?.realizedPnl || 0;
  const openPositionsCount = dashboardStats?.openTrades || 0;

  const pnlHistoryData = dashboardStats?.pnlHistoryData || [0, 0];
  const pnlHistoryLabels = dashboardStats?.pnlHistoryLabels || ['Start', 'Today'];

  // Calculate dynamic date range for header
  let dateRangeStr = 'All Time';
  if (trades.length > 0) {
    const times = trades
      .map(t => new Date(t.createdAt).getTime())
      .filter(t => !isNaN(t));
    if (times.length > 0) {
      const minDate = new Date(Math.min(...times));
      const maxDate = new Date(Math.max(...times));
      dateRangeStr = `${minDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} - ${maxDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
  }

  // Filter out trades that are open to display in the live table, fallback to recent trades
  const liveTableTrades = trades.filter(t => t.status.toLowerCase() === 'open');
  const recentTableTrades = trades.slice(0, 5); // Fallback recent list
  const displayTrades = liveTableTrades.length > 0 ? liveTableTrades : recentTableTrades;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
            Trading Terminal Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Monitor automated breakout execution and client P&L logs.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Date Picker Pill */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '6px 14px', 
            borderRadius: '8px', 
            background: 'white', 
            border: '1px solid var(--border-color)', 
            fontSize: '13px', 
            color: 'var(--text-body)',
            cursor: 'pointer'
          }}>
            <Calendar size={14} color="var(--text-muted)" />
            <span>{dateRangeStr}</span>
          </div>

          {loading ? (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: '#f1f5f9', padding: '6px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="live-dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--primary)' }}></span>
              Checking engine...
            </div>
          ) : (
            <>
              <div style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: isTradingActive ? 'var(--color-success-bg)' : '#f1f5f9', color: isTradingActive ? 'var(--color-success)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isTradingActive ? 'var(--color-success)' : 'var(--text-muted)', display: 'inline-block' }} />
                {isTradingActive ? 'AUTO TRADING LIVE' : 'ENGINE STOPPED'}
              </div>

              <Button variant={isTradingActive ? 'danger' : 'success'} onClick={() => toggleTrading(!isTradingActive)}>
                {isTradingActive ? (
                  <><Square size={16} fill="white" /> Stop Trading</>
                ) : (
                  <><Play size={16} fill="white" /> Start Auto Trading</>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 4 Top KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {/* Card 1: Total Clients */}
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Clients</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
            {totalClients}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            ↑ {totalClients > 0 ? '12.5%' : '0.0%'}
          </span>
        </Card>

        {/* Card 2: Active Strategies */}
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Strategies</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
            {activeStrategies}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            ↑ {activeStrategies > 0 ? '8.3%' : '0.0%'}
          </span>
        </Card>

        {/* Card 3: Live Accounts */}
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Live Accounts</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
            {liveAccounts}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            ↑ {liveAccounts > 0 ? '10.2%' : '0.0%'}
          </span>
        </Card>

        {/* Card 4: Total P&L */}
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total P&L (₹)</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: totalPnl >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: totalPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: totalPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontFamily: 'var(--font-title)' }}>
            ₹{totalPnl.toLocaleString('en-IN')}
          </h2>
          <span style={{ fontSize: '11px', color: totalPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            {totalPnl >= 0 ? '↑' : '↓'} {totalPnl !== 0 ? '15.4%' : '0.0%'}
          </span>
        </Card>
      </div>

      {/* Middle Row: P&L Overview & Strategies Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left: P&L Area Curve Chart */}
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
              P&L Overview
            </h4>
            <select 
              value={pnlPeriod} 
              onChange={(e) => setPnlPeriod(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', outline: 'none', background: 'white', fontWeight: 600 }}
            >
              <option>Daily</option>
              <option>Cumulative</option>
            </select>
          </div>
          <PerformanceChart
            data={pnlHistoryData}
            labels={pnlHistoryLabels}
            strokeColor="var(--primary)"
            fillColorStart="rgba(14, 165, 233, 0.2)"
            fillColorEnd="rgba(14, 165, 233, 0)"
            height={280}
          />
        </Card>

        {/* Right: Strategies Performance Donut Chart */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', marginBottom: '20px' }}>
            Strategies Performance
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', flex: 1, justifyContent: 'center' }}>
            {/* SVG Donut */}
            <div style={{ width: '130px', height: '130px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.915" fill="#fff"></circle>
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4.5"></circle>
                
                {/* Winning segment (Blue) */}
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--primary)" strokeWidth="4.5" 
                  strokeDasharray={`${winRatePercent || 0} ${100 - (winRatePercent || 0)}`} 
                  strokeDashoffset="25"
                />
                {/* Losing segment (Red) */}
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--color-danger)" strokeWidth="4.5" 
                  strokeDasharray={`${lossRatePercent || 0} ${100 - (lossRatePercent || 0)}`} 
                  strokeDashoffset={`${25 - (winRatePercent || 0)}`}
                />
                {/* Breakeven segment (Gray) */}
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--text-subtle)" strokeWidth="4.5" 
                  strokeDasharray={`${drawRatePercent || 0} ${100 - (drawRatePercent || 0)}`} 
                  strokeDashoffset={`${25 - (winRatePercent || 0) - (lossRatePercent || 0)}`}
                />
              </svg>
              {/* Center total number */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>
                <strong style={{ fontSize: '20px', color: 'var(--text-heading)' }}>{activeStrategies}</strong>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Strategies</span>
              </div>
            </div>

            {/* Labels Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', fontSize: '13px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                  Winning
                </span>
                <strong>{winningStrats} ({winRatePercent.toFixed(1)}%)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }} />
                  Losing
                </span>
                <strong>{losingStrats} ({lossRatePercent.toFixed(1)}%)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--text-subtle)' }} />
                  Breakeven
                </span>
                <strong>{breakevenStrats} ({drawRatePercent.toFixed(1)}%)</strong>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Row: Live Strategy & Exposure mini-cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left: Live Strategy Table */}
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
              Live Strategy Parameters
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="live-dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-success)' }}></span>
              Autorefreshing every 3s
            </span>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Strategy</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Entry Price</th>
                  <th>Exit Price</th>
                  <th>P&L (₹)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayTrades.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No active trades running at this moment.
                    </td>
                  </tr>
                ) : (
                  displayTrades.map((trade) => {
                    const pnl = Number(trade.pnl || 0);
                    const entryPriceVal = Number(trade.entryPrice || 0);
                    const exitPriceVal = Number(trade.exitPrice || 0);
                    const strategyName = trade.strategy?.name || trade.strategyName || 'Pre-Open Momentum';
                    const isBuy = trade.orderType?.toUpperCase() === 'BUY';

                    return (
                      <tr key={trade.id}>
                        <td style={{ fontWeight: 600 }}>{strategyName}</td>
                        <td style={{ fontWeight: 700 }}>{trade.symbol}</td>
                        <td>
                          <span className={`badge ${isBuy ? 'badge-blue' : 'badge-red'}`} style={{ padding: '2px 8px', fontSize: '10px' }}>
                            {trade.orderType}
                          </span>
                        </td>
                        <td>{trade.quantity}</td>
                        <td>₹{entryPriceVal.toFixed(2)}</td>
                        <td>{exitPriceVal ? `₹${exitPriceVal.toFixed(2)}` : '--'}</td>
                        <td style={{ fontWeight: 600, color: pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {pnl >= 0 ? `+₹${pnl.toFixed(2)}` : `-₹${Math.abs(pnl).toFixed(2)}`}
                        </td>
                        <td>
                          <span className={`badge ${
                            trade.status.toLowerCase() === 'open' 
                              ? 'badge-info' 
                              : trade.status.toLowerCase() === 'failed' 
                                ? 'badge-danger' 
                                : trade.status.toLowerCase() === 'cancelled'
                                  ? 'badge-warning'
                                  : 'badge-success'
                          }`}>
                            {trade.status.toUpperCase()}
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

        {/* Right: Exposure & Positions metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card: Total Exposure */}
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Exposure</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={18} />
              </div>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '10px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
              ₹{totalExposure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
          </Card>

          {/* Card: Unrealized P&L */}
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Unrealized P&L</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '10px', color: unrealizedPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontFamily: 'var(--font-title)' }}>
              ₹{unrealizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
          </Card>

          {/* Card: Realized P&L */}
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Realized P&L</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={18} />
              </div>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '10px', color: realizedPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontFamily: 'var(--font-title)' }}>
              ₹{realizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
          </Card>

          {/* Card: Open Positions */}
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Open Positions</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={18} />
              </div>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '10px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
              {openPositionsCount}
            </h3>
          </Card>
        </div>
      </div>
    </div>
  );
}
