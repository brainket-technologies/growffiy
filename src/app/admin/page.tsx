'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppViewModel } from '../../shared/viewmodels/AppContext';
import { Card } from '../../shared/components/views/Card';
import { Button } from '../../shared/components/views/Button';
import { PerformanceChart } from '../../shared/components/views/PerformanceChart';
import { useRouter } from 'next/navigation';
import { api } from '../../shared/services/api';
import { API_ENDPOINTS } from '../../core/constants';
import { 
  Users, 
  TrendingUp, 
  User, 
  Calendar,
  Wallet,
  Clock,
  FileText,
  ChevronDown,
  Filter,
  RefreshCw
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = [2024, 2025, 2026];

export default function AdminDashboard() {
  const router = useRouter();
  const {
    trades,
    isTradingActive,
    toggleTrading,
    loading: globalLoading,
  } = useAppViewModel();

  const [pnlPeriod, setPnlPeriod] = useState('Daily');

  // Calendar settings for trading days display
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(true);
  const [tradingDays, setTradingDays] = useState<string[]>([]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [specialDays, setSpecialDays] = useState<string[]>([]);

  useEffect(() => {
    api.get(API_ENDPOINTS.SETTINGS).then((res: any) => {
      if (res.success && res.settings) {
        setAutoTradeEnabled(res.settings.auto_trade_enabled !== 'false');
        try { setTradingDays(JSON.parse(res.settings.trading_days || '[]')); } catch {}
        try { setHolidays(JSON.parse(res.settings.market_holidays || '[]')); } catch {}
        try { setSpecialDays(JSON.parse(res.settings.special_market_days || '[]')); } catch {}
      }
    }).catch(() => {});
  }, []);

  // Filter local states - default to current month
  const now = new Date();
  const initialStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const initialEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState<Date>(initialStart);
  const [endDate, setEndDate] = useState<Date>(initialEnd);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<'month' | 'year' | 'custom'>('month');
  
  // Selection states
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [customStart, setCustomStart] = useState<string>(initialStart.toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState<string>(initialEnd.toISOString().split('T')[0]);

  // Dashboard Stats state
  const [stats, setStats] = useState<any>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStats = async (start: Date, end: Date) => {
    try {
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      const res = await api.get(`${API_ENDPOINTS.DASHBOARD}?startDate=${startStr}&endDate=${endStr}`);
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard stats:', e);
    } finally {
      setLocalLoading(false);
    }
  };

  // Poll stats every 2 seconds
  useEffect(() => {
    fetchStats(startDate, endDate);
    const interval = setInterval(() => {
      fetchStats(startDate, endDate);
    }, 2000);
    return () => clearInterval(interval);
  }, [startDate, endDate]);

  const applyMonthFilter = () => {
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0);
    setStartDate(start);
    setEndDate(end);
    setIsFilterOpen(false);
  };

  const applyYearFilter = () => {
    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31);
    setStartDate(start);
    setEndDate(end);
    setIsFilterOpen(false);
  };

  const applyCustomFilter = () => {
    if (customStart && customEnd) {
      setStartDate(new Date(customStart));
      setEndDate(new Date(customEnd));
      setIsFilterOpen(false);
    }
  };

  const clearFilters = () => {
    setStartDate(initialStart);
    setEndDate(initialEnd);
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
    setFilterType('month');
    setIsFilterOpen(false);
  };

  // Extract stats
  const totalClients = stats?.totalClients || 0;
  const activeStrategies = stats?.activeStrategies || 0;
  const liveAccounts = stats?.activeClients || 0;
  const totalPnl = stats?.totalPnl || 0;

  const winningStrats = stats?.winningStrategies || 0;
  const losingStrats = stats?.losingStrategies || 0;
  const breakevenStrats = stats?.breakevenStrategies || 0;
  const totalStratsCount = winningStrats + losingStrats + breakevenStrats || activeStrategies || 1;

  const winRatePercent = ((winningStrats / totalStratsCount) * 100);
  const lossRatePercent = ((losingStrats / totalStratsCount) * 100);
  const drawRatePercent = ((breakevenStrats / totalStratsCount) * 100);

  const totalExposure = stats?.totalExposure || 0;
  const unrealizedPnl = stats?.unrealizedPnl || 0;
  const realizedPnl = stats?.realizedPnl || 0;
  const openPositionsCount = stats?.openTrades || 0;

  const pnlHistoryData = stats?.pnlHistoryData || [0, 0];
  const pnlHistoryLabels = stats?.pnlHistoryLabels || ['Start', 'Today'];

  const dateRangeStr = `${startDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  // Filter trades displayed in table by selected date range

  const filteredTrades = trades.filter(t => {
    const tradeDate = new Date(t.createdAt);
    const startLimit = new Date(startDate);
    startLimit.setHours(0, 0, 0, 0);
    const endLimit = new Date(endDate);
    endLimit.setHours(23, 59, 59, 999);
    return tradeDate >= startLimit && tradeDate <= endLimit;
  });

  const displayTrades = filteredTrades.slice(0, 5);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      
      {/* Top Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
            Trading Terminal Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Monitor automated breakout execution and client P&L logs.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
          
          {/* Filter Dropdown Pill */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                borderRadius: '8px', 
                background: 'var(--bg-white)', 
                border: '1px solid var(--border)', 
                fontSize: '13px', 
                color: 'var(--text-body)',
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                userSelect: 'none'
              }}
            >
              <Calendar size={14} color="var(--primary)" />
              <span>{dateRangeStr}</span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </div>

            {/* Dropdown Menu */}
            {isFilterOpen && (
              <div style={{ 
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
                padding: '16px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-heading)' }}>Date Filter</span>
                  <button 
                    onClick={clearFilters}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Reset to Default
                  </button>
                </div>

                {/* Filter Selector Tabs */}
                <div style={{ display: 'flex', background: 'var(--surface)', padding: '2px', borderRadius: '6px' }}>
                  <button 
                    onClick={() => setFilterType('month')}
                    style={{ flex: 1, border: 'none', background: filterType === 'month' ? 'var(--bg-white)' : 'transparent', color: 'var(--text-body)', fontSize: '12px', padding: '6px 0', borderRadius: '4px', fontWeight: filterType === 'month' ? 600 : 500, cursor: 'pointer' }}
                  >
                    Month
                  </button>
                  <button 
                    onClick={() => setFilterType('year')}
                    style={{ flex: 1, border: 'none', background: filterType === 'year' ? 'var(--bg-white)' : 'transparent', color: 'var(--text-body)', fontSize: '12px', padding: '6px 0', borderRadius: '4px', fontWeight: filterType === 'year' ? 600 : 500, cursor: 'pointer' }}
                  >
                    Year
                  </button>
                  <button 
                    onClick={() => setFilterType('custom')}
                    style={{ flex: 1, border: 'none', background: filterType === 'custom' ? 'var(--bg-white)' : 'transparent', color: 'var(--text-body)', fontSize: '12px', padding: '6px 0', borderRadius: '4px', fontWeight: filterType === 'custom' ? 600 : 500, cursor: 'pointer' }}
                  >
                    Custom Date
                  </button>
                </div>

                {/* Dropdown Content based on Tab */}
                {filterType === 'month' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                      >
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <select 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        style={{ flex: 1.5, padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                      >
                        {MONTHS.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
                      </select>
                    </div>
                    <Button onClick={applyMonthFilter} style={{ width: '100%', padding: '8px', fontSize: '12px', backgroundColor: 'var(--primary)', color: 'white' }}>
                      Apply Month Filter
                    </Button>
                  </div>
                )}

                {filterType === 'year' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                    >
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <Button onClick={applyYearFilter} style={{ width: '100%', padding: '8px', fontSize: '12px', backgroundColor: 'var(--primary)', color: 'white' }}>
                      Apply Year Filter
                    </Button>
                  </div>
                )}

                {filterType === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Start Date</label>
                      <input 
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', width: '100%' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>End Date</label>
                      <input 
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', width: '100%' }}
                      />
                    </div>
                    <Button onClick={applyCustomFilter} style={{ width: '100%', padding: '8px', fontSize: '12px', backgroundColor: 'var(--primary)', color: 'white' }}>
                      Apply Custom Filter
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {globalLoading ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--surface)', padding: '6px 16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="live-dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--primary)' }}></span>
              Checking engine...
            </div>
          ) : (
            <>
              <div style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: isTradingActive ? 'var(--primary-light)' : 'var(--surface)', color: isTradingActive ? 'var(--primary-dark)' : 'var(--text-muted)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isTradingActive ? 'var(--primary-dark)' : 'var(--text-subtle)', display: 'inline-block' }} />
                <span>{isTradingActive ? 'AUTO TRADING LIVE' : 'ENGINE STOPPED'}</span>
                <span style={{ width: '1px', height: '14px', background: isTradingActive ? 'rgba(2,132,199,0.2)' : 'rgba(100,116,139,0.2)' }} />
                <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.8 }}>
                  {!autoTradeEnabled ? 'Auto Trade OFF' : holidays.includes(new Date().toLocaleDateString('en-CA')) ? 'Holiday - Skip' : tradingDays.includes(new Date().toLocaleDateString('en-US', { weekday: 'short' })) || specialDays.includes(new Date().toLocaleDateString('en-CA')) ? '✅ Trading Day' : '❌ Not a Trading Day'}
                </span>
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
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.015)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>Total Clients</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '30px', fontWeight: 700, marginTop: '4px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
            {totalClients}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            ↑ {totalClients > 0 ? '12.5%' : '0.0%'}
          </span>
        </Card>

        {/* Card 2: Active Strategies */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.015)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>Active Strategies</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '30px', fontWeight: 700, marginTop: '4px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
            {activeStrategies}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            ↑ {activeStrategies > 0 ? '8.3%' : '0.0%'}
          </span>
        </Card>

        {/* Card 3: Live Accounts */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.015)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>Live Accounts</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '30px', fontWeight: 700, marginTop: '4px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
            {liveAccounts}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            ↑ {liveAccounts > 0 ? '10.2%' : '0.0%'}
          </span>
        </Card>

        {/* Card 4: Total P&L */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.015)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>Total P&L (₹)</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
              ₹
            </div>
          </div>
          <h2 style={{ fontSize: '30px', fontWeight: 700, marginTop: '4px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
            ₹ {totalPnl.toLocaleString('en-IN')}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            ↑ {totalPnl !== 0 ? '15.4%' : '0.0%'}
          </span>
        </Card>
      </div>

      {/* Middle Row: P&L Overview & Strategies Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left: P&L Area Curve Chart */}
        <Card style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
              P&L Overview
            </h4>
            <select 
              value={pnlPeriod} 
              onChange={(e) => setPnlPeriod(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px', outline: 'none', background: 'var(--bg-white)', fontWeight: 600, color: 'var(--text-body)' }}
            >
              <option>Daily</option>
              <option>Cumulative</option>
            </select>
          </div>
          <PerformanceChart
            data={pnlHistoryData}
            labels={pnlHistoryLabels}
            strokeColor="var(--primary)"
            fillColorStart="rgba(0, 82, 204, 0.15)"
            fillColorEnd="rgba(0, 82, 204, 0)"
            height={280}
          />
        </Card>

        {/* Right: Strategies Performance Donut Chart */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', marginBottom: '20px' }}>
            Strategies Performance
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', flex: 1, justifyContent: 'center' }}>
            {/* SVG Donut */}
            <div style={{ width: '130px', height: '130px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.915" fill="#fff"></circle>
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--surface)" strokeWidth="4.5"></circle>
                
                {/* Winning segment (Blue) */}
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--primary)" strokeWidth="4.5" 
                  strokeDasharray={`${winRatePercent || 0} ${100 - (winRatePercent || 0)}`} 
                  strokeDashoffset="25"
                />
                {/* Losing segment (Red) */}
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--danger)" strokeWidth="4.5" 
                  strokeDasharray={`${lossRatePercent || 0} ${100 - (lossRatePercent || 0)}`} 
                  strokeDashoffset={`${25 - (winRatePercent || 0)}`}
                />
                {/* Breakeven segment (Gray) */}
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--border-color)" strokeWidth="4.5" 
                  strokeDasharray={`${drawRatePercent || 0} ${100 - (drawRatePercent || 0)}`} 
                  strokeDashoffset={`${25 - (winRatePercent || 0) - (lossRatePercent || 0)}`}
                />
              </svg>
              {/* Center total number */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>
                <strong style={{ fontSize: '22px', color: 'var(--text-heading)', fontWeight: '700' }}>{activeStrategies}</strong>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Total Strategies</span>
              </div>
            </div>

            {/* Labels Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', fontSize: '13px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-body)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                  Winning
                </span>
                <strong style={{ color: 'var(--text-heading)' }}>{winningStrats} ({winRatePercent.toFixed(1)}%)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-body)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--danger)' }} />
                  Losing
                </span>
                <strong style={{ color: 'var(--text-heading)' }}>{losingStrats} ({lossRatePercent.toFixed(1)}%)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-body)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--border-color)' }} />
                  Breakeven
                </span>
                <strong style={{ color: 'var(--text-heading)' }}>{breakevenStrats} ({drawRatePercent.toFixed(1)}%)</strong>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Row: Live Strategy & Exposure 2x2 mini-cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left: Live Strategy Table */}
        <Card style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
              Live Strategy
            </h4>
            <Button 
              onClick={() => router.push('/admin/strategies')}
              style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '6px' }}
            >
              View All Strategies
            </Button>
          </div>

          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>Strategy</th>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>Symbol</th>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>Qty</th>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>Avg. Price</th>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>LTP</th>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>P&L (₹)</th>
                  <th style={{ padding: '10px 0', fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayTrades.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-subtle)', fontSize: '13px' }}>
                      No active trades running at this moment.
                    </td>
                  </tr>
                ) : (
                  displayTrades.map((trade) => {
                    const pnl = Number(trade.pnl || 0);
                    const entryPriceVal = Number(trade.entryPrice || 0);
                    const exitPriceVal = Number(trade.exitPrice || 0);
                    const strategyName = trade.strategy?.name || trade.strategyName || 'Pre Open Momentum';
                    
                    // Dynamically calculate transaction type from strategy config action
                    let transactionType = 'BUY';
                    try {
                      const config = JSON.parse(trade.strategy?.configJson || '{}');
                      const action = config?.tradeAction?.action || 'Long';
                      if (action.toLowerCase() === 'short' || action.toLowerCase() === 'sell') {
                        transactionType = 'SELL';
                      }
                    } catch (e) {}
                    const isBuy = transactionType === 'BUY';

                    return (
                      <tr key={trade.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 500, color: 'var(--text-body)' }}>{strategyName}</td>
                        <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>{trade.symbol}</td>
                        <td style={{ padding: '12px 0', fontSize: '13px' }}>
                          <span style={{ fontWeight: 700, color: isBuy ? 'var(--accent)' : 'var(--danger)' }}>
                            {transactionType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text-body)' }}>{trade.quantity}</td>
                        <td style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text-body)' }}>{entryPriceVal.toFixed(2)}</td>
                        <td style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text-body)' }}>{exitPriceVal ? exitPriceVal.toFixed(2) : entryPriceVal.toFixed(2)}</td>
                        <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 600, color: pnl >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                          {pnl >= 0 ? `+${pnl.toFixed(2)}` : pnl.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 0', fontSize: '13px' }}>
                          <span style={{ 
                            padding: '3px 8px', 
                            fontSize: '11px', 
                            borderRadius: '4px', 
                            fontWeight: 500,
                            backgroundColor: trade.status.toLowerCase() === 'open' ? '#e6f7f4' : '#fee2e2', 
                            color: trade.status.toLowerCase() === 'open' ? 'var(--accent-dark)' : 'var(--danger)'
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
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>Total Exposure (₹)</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={14} />
              </div>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '10px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
              ₹ {totalExposure.toLocaleString('en-IN')}
            </h3>
          </Card>

          {/* Card: Unrealized P&L */}
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>Unrealized P&L (₹)</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={14} />
              </div>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '10px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
              ₹ {unrealizedPnl.toLocaleString('en-IN')}
            </h3>
          </Card>

          {/* Card: Realized P&L */}
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>Realized P&L (₹)</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={14} />
              </div>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '10px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
              ₹ {realizedPnl.toLocaleString('en-IN')}
            </h3>
          </Card>

          {/* Card: Open Positions */}
          <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>Open Positions</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--warning-light)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={14} />
              </div>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '10px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
              {openPositionsCount}
            </h3>
          </Card>
        </div>
      </div>
    </div>
  );
}


