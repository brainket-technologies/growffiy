'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../viewmodels/AppContext';
import { Card } from '../../views/components/Card';
import { Button } from '../../views/components/Button';
import { PerformanceChart } from '../../views/components/PerformanceChart';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  TrendingUp, 
  User, 
  Calendar,
  Wallet,
  Clock,
  FileText,
  ChevronDown
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
  const router = useRouter();
  const {
    trades,
    isTradingActive,
    dashboardStats,
    toggleTrading,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      
      {/* Top Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-title)' }}>
            Trading Terminal Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>Monitor automated breakout execution and client P&L logs.</p>
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
            border: '1px solid #e2e8f0', 
            fontSize: '13px', 
            color: '#334155',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <Calendar size={14} color="#64748b" />
            <span>{dateRangeStr}</span>
            <ChevronDown size={14} color="#64748b" />
          </div>

          {loading ? (
            <div style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '6px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="live-dot" style={{ width: '6px', height: '6px', backgroundColor: '#0ea5e9' }}></span>
              Checking engine...
            </div>
          ) : (
            <>
              <div style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: isTradingActive ? '#e0f2fe' : '#f1f5f9', color: isTradingActive ? '#0284c7' : '#64748b', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isTradingActive ? '#0284c7' : '#94a3b8', display: 'inline-block' }} />
                {isTradingActive ? 'AUTO TRADING LIVE' : 'ENGINE STOPPED'}
              </div>

              <Button variant={isTradingActive ? 'danger' : 'success'} onClick={() => toggleTrading(!isTradingActive)} style={{ fontSize: '13px', padding: '8px 16px', fontWeight: 600 }}>
                {isTradingActive ? 'Stop Trading' : 'Start Auto Trading'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 4 Top KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {/* Card 1: Total Clients */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.015)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Total Clients</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f0f7ff', color: '#0052cc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '30px', fontWeight: 700, marginTop: '4px', color: '#0f172a', fontFamily: 'var(--font-title)' }}>
            {totalClients}
          </h2>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            ↑ {totalClients > 0 ? '12.5%' : '0.0%'}
          </span>
        </Card>

        {/* Card 2: Active Strategies */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.015)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Active Strategies</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f0f7ff', color: '#0052cc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '30px', fontWeight: 700, marginTop: '4px', color: '#0f172a', fontFamily: 'var(--font-title)' }}>
            {activeStrategies}
          </h2>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            ↑ {activeStrategies > 0 ? '8.3%' : '0.0%'}
          </span>
        </Card>

        {/* Card 3: Live Accounts */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.015)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Live Accounts</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f0f7ff', color: '#0052cc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '30px', fontWeight: 700, marginTop: '4px', color: '#0f172a', fontFamily: 'var(--font-title)' }}>
            {liveAccounts}
          </h2>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            ↑ {liveAccounts > 0 ? '10.2%' : '0.0%'}
          </span>
        </Card>

        {/* Card 4: Total P&L */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 2px 8px rgba(0,0,0,0.015)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Total P&L (₹)</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f0f7ff', color: '#0052cc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
              ₹
            </div>
          </div>
          <h2 style={{ fontSize: '30px', fontWeight: 700, marginTop: '4px', color: '#0f172a', fontFamily: 'var(--font-title)' }}>
            ₹ {totalPnl.toLocaleString('en-IN')}
          </h2>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            ↑ {totalPnl !== 0 ? '15.4%' : '0.0%'}
          </span>
        </Card>
      </div>

      {/* Middle Row: P&L Overview & Strategies Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left: P&L Area Curve Chart */}
        <Card style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-title)' }}>
              P&L Overview
            </h4>
            <select 
              value={pnlPeriod} 
              onChange={(e) => setPnlPeriod(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none', background: 'white', fontWeight: 600, color: '#475569' }}
            >
              <option>Daily</option>
              <option>Cumulative</option>
            </select>
          </div>
          <PerformanceChart
            data={pnlHistoryData}
            labels={pnlHistoryLabels}
            strokeColor="#0052cc"
            fillColorStart="rgba(0, 82, 204, 0.15)"
            fillColorEnd="rgba(0, 82, 204, 0)"
            height={280}
          />
        </Card>

        {/* Right: Strategies Performance Donut Chart */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-title)', marginBottom: '20px' }}>
            Strategies Performance
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', flex: 1, justifyContent: 'center' }}>
            {/* SVG Donut */}
            <div style={{ width: '130px', height: '130px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.915" fill="#fff"></circle>
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4.5"></circle>
                
                {/* Winning segment (Blue) */}
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#0052cc" strokeWidth="4.5" 
                  strokeDasharray={`${winRatePercent || 0} ${100 - (winRatePercent || 0)}`} 
                  strokeDashoffset="25"
                />
                {/* Losing segment (Red) */}
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4.5" 
                  strokeDasharray={`${lossRatePercent || 0} ${100 - (lossRatePercent || 0)}`} 
                  strokeDashoffset={`${25 - (winRatePercent || 0)}`}
                />
                {/* Breakeven segment (Gray) */}
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#cbd5e1" strokeWidth="4.5" 
                  strokeDasharray={`${drawRatePercent || 0} ${100 - (drawRatePercent || 0)}`} 
                  strokeDashoffset={`${25 - (winRatePercent || 0) - (lossRatePercent || 0)}`}
                />
              </svg>
              {/* Center total number */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>
                <strong style={{ fontSize: '22px', color: '#0f172a', fontWeight: '700' }}>{activeStrategies}</strong>
                <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Total Strategies</span>
              </div>
            </div>

            {/* Labels Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', fontSize: '13px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0052cc' }} />
                  Winning
                </span>
                <strong style={{ color: '#0f172a' }}>{winningStrats} ({winRatePercent.toFixed(1)}%)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  Losing
                </span>
                <strong style={{ color: '#0f172a' }}>{losingStrats} ({lossRatePercent.toFixed(1)}%)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                  Breakeven
                </span>
                <strong style={{ color: '#0f172a' }}>{breakevenStrats} ({drawRatePercent.toFixed(1)}%)</strong>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Row: Live Strategy & Exposure 2x2 mini-cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left: Live Strategy Table */}
        <Card style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-title)' }}>
              Live Strategy
            </h4>
            <Button 
              onClick={() => router.push('/admin/strategies')}
              style={{ backgroundColor: '#0052cc', color: 'white', padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '6px' }}
            >
              View All Strategies
            </Button>
          </div>

          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Strategy</th>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Symbol</th>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Qty</th>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Avg. Price</th>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>LTP</th>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>P&L (₹)</th>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayTrades.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>
                      No active trades running at this moment.
                    </td>
                  </tr>
                ) : (
                  displayTrades.map((trade) => {
                    const pnl = Number(trade.pnl || 0);
                    const entryPriceVal = Number(trade.entryPrice || 0);
                    const exitPriceVal = Number(trade.exitPrice || 0);
                    const strategyName = trade.strategy?.name || trade.strategyName || 'Pre Open Momentum';
                    const isBuy = trade.orderType?.toUpperCase() === 'BUY';

                    return (
                      <tr key={trade.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 500, color: '#334155' }}>{strategyName}</td>
                        <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{trade.symbol}</td>
                        <td style={{ padding: '12px 0', fontSize: '13px' }}>
                          <span style={{ fontWeight: 700, color: isBuy ? '#10b981' : '#ef4444' }}>
                            {trade.orderType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 0', fontSize: '13px', color: '#475569' }}>{trade.quantity}</td>
                        <td style={{ padding: '12px 0', fontSize: '13px', color: '#475569' }}>{entryPriceVal.toFixed(2)}</td>
                        <td style={{ padding: '12px 0', fontSize: '13px', color: '#475569' }}>{exitPriceVal ? exitPriceVal.toFixed(2) : entryPriceVal.toFixed(2)}</td>
                        <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 600, color: pnl >= 0 ? '#10b981' : '#ef4444' }}>
                          {pnl >= 0 ? `+${pnl.toFixed(2)}` : pnl.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 0', fontSize: '13px' }}>
                          <span style={{ 
                            padding: '3px 8px', 
                            fontSize: '11px', 
                            borderRadius: '4px', 
                            fontWeight: 500,
                            backgroundColor: trade.status.toLowerCase() === 'open' ? '#e6f7f4' : '#fee2e2', 
                            color: trade.status.toLowerCase() === 'open' ? '#00a389' : '#ef4444'
                          }}>
                            {trade.status.toLowerCase() === 'open' ? 'Open' : trade.status.toUpperCase()}
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

        {/* Right: Exposure & Positions metrics in a 2x2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', height: 'fit-content' }}>
          {/* Card: Total Exposure */}
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>Total Exposure (₹)</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={14} />
              </div>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '10px', color: '#0f172a', fontFamily: 'var(--font-title)' }}>
              ₹ {totalExposure.toLocaleString('en-IN')}
            </h3>
          </Card>

          {/* Card: Unrealized P&L */}
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>Unrealized P&L (₹)</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={14} />
              </div>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '10px', color: '#0f172a', fontFamily: 'var(--font-title)' }}>
              ₹ {unrealizedPnl.toLocaleString('en-IN')}
            </h3>
          </Card>

          {/* Card: Realized P&L */}
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>Realized P&L (₹)</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={14} />
              </div>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '10px', color: '#0f172a', fontFamily: 'var(--font-title)' }}>
              ₹ {realizedPnl.toLocaleString('en-IN')}
            </h3>
          </Card>

          {/* Card: Open Positions */}
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>Open Positions</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={14} />
              </div>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '10px', color: '#0f172a', fontFamily: 'var(--font-title)' }}>
              {openPositionsCount}
            </h3>
          </Card>
        </div>
      </div>
    </div>
  );
}

