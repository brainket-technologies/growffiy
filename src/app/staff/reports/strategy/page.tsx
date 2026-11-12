'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppViewModel } from '../../../../shared/viewmodels/AppContext';
import { Card } from '../../../../shared/components/views/Card';
import { Button } from '../../../../shared/components/views/Button';
import { Loader } from '../../../../shared/components/views/Loader';
import { TrendingUp, Award, Activity, Download, Search, Filter, TrendingDown, BarChart3, Calendar, ChevronDown } from 'lucide-react';

export default function StrategyReportPage() {
  const { trades = [], loading } = useAppViewModel();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('pnl');
  const [minTrades, setMinTrades] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [canExport, setCanExport] = useState(true);

  const now = new Date();
  const initialStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const initialEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState<Date>(initialStart);
  const [endDate, setEndDate] = useState<Date>(initialEnd);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<'month' | 'year' | 'custom'>('month');

  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());

  const formatDateToYMD = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [customStart, setCustomStart] = useState<string>(formatDateToYMD(initialStart));
  const [customEnd, setCustomEnd] = useState<string>(formatDateToYMD(initialEnd));

  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const applyMonthFilter = () => {
    setStartDate(new Date(selectedYear, selectedMonth, 1));
    setEndDate(new Date(selectedYear, selectedMonth + 1, 0));
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const applyYearFilter = () => {
    setStartDate(new Date(selectedYear, 0, 1));
    setEndDate(new Date(selectedYear, 11, 31));
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const applyCustomFilter = () => {
    if (customStart && customEnd) {
      setStartDate(new Date(customStart));
      setEndDate(new Date(customEnd));
      setIsFilterOpen(false);
      setCurrentPage(1);
    }
  };

  const clearFilters = () => {
    setStartDate(initialStart);
    setEndDate(initialEnd);
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
    setFilterType('month');
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  let dateRangeStr = '';
  if (startDate && endDate) {
    const sStr = startDate.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const eStr = endDate.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    dateRangeStr = `${sStr} - ${eStr}`;
  }

  const dateFilteredTrades = useMemo(() => {
    return (trades || []).filter(t => {
      const d = new Date(t.createdAt || t.entryTime || new Date());
      const dTime = d.getTime();
      const startOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0).getTime();
      const endOfDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59).getTime();

      return (dTime >= startOfDay && dTime <= endOfDay);
    });
  }, [trades, startDate, endDate]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const perms: { module: string; permission: string; granted: boolean }[] = JSON.parse(
        localStorage.getItem('growffiy_staff_permissions') || '[]'
      );
      // Check if logged in user is admin, if not check staff permission for strategyExport
      const role = localStorage.getItem('growffiy_logged_in_user_role');
      if (role === 'staff') {
        const hasExport = perms.some(p => p.module === 'reports' && p.permission === 'strategyExport' && p.granted);
        setCanExport(hasExport);
      }
    }
  }, []);

  const strategyStats = useMemo(() => {
    const stats: Record<string, {
      name: string; totalTrades: number; winTrades: number; totalPnl: number;
      totalProfit: number; totalLoss: number; maxWin: number; maxLoss: number;
    }> = {};

    dateFilteredTrades.forEach((trade) => {
      if (!trade) return;
      const strategyName = trade.strategy?.name || trade.strategyName || 'Pre-Open Momentum';
      const pnl = Number(trade.pnl || 0);
      if (!stats[strategyName]) {
        stats[strategyName] = { name: strategyName, totalTrades: 0, winTrades: 0, totalPnl: 0, totalProfit: 0, totalLoss: 0, maxWin: 0, maxLoss: 0 };
      }
      const s = stats[strategyName];
      s.totalTrades += 1;
      s.totalPnl += pnl;
      if (pnl > 0) { s.winTrades += 1; s.totalProfit += pnl; if (pnl > s.maxWin) s.maxWin = pnl; }
      else if (pnl < 0) { s.totalLoss += Math.abs(pnl); if (pnl < s.maxLoss) s.maxLoss = pnl; }
    });

    return Object.values(stats);
  }, [dateFilteredTrades]);

  const totalAlgoPnl = useMemo(() => strategyStats.reduce((sum, s) => sum + s.totalPnl, 0), [strategyStats]);
  const bestStrategy = useMemo(() => strategyStats.length > 0 ? [...strategyStats].sort((a, b) => b.totalPnl - a.totalPnl)[0] : null, [strategyStats]);
  const mostActive = useMemo(() => strategyStats.length > 0 ? [...strategyStats].sort((a, b) => b.totalTrades - a.totalTrades)[0] : null, [strategyStats]);
  const totalTradesCount = useMemo(() => strategyStats.reduce((sum, s) => sum + s.totalTrades, 0), [strategyStats]);
  const totalWinTrades = useMemo(() => strategyStats.reduce((sum, s) => sum + s.winTrades, 0), [strategyStats]);
  const overallWinRate = totalTradesCount > 0 ? (totalWinTrades / totalTradesCount) * 100 : 0;

  const filteredList = useMemo(() => {
    let list = strategyStats.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMinTrades = s.totalTrades >= minTrades;
      return matchesSearch && matchesMinTrades;
    });

    list.sort((a, b) => {
      if (sortBy === 'pnl') return b.totalPnl - a.totalPnl;
      if (sortBy === 'trades') return b.totalTrades - a.totalTrades;
      if (sortBy === 'winrate') {
        const wrA = a.totalTrades > 0 ? (a.winTrades / a.totalTrades) * 100 : 0;
        const wrB = b.totalTrades > 0 ? (b.winTrades / b.totalTrades) * 100 : 0;
        return wrB - wrA;
      }
      if (sortBy === 'profitFactor') {
        const pfA = a.totalLoss > 0 ? (a.totalProfit / a.totalLoss) : a.totalProfit > 0 ? 99.9 : 0;
        const pfB = b.totalLoss > 0 ? (b.totalProfit / b.totalLoss) : b.totalProfit > 0 ? 99.9 : 0;
        return pfB - pfA;
      }
      return 0;
    });

    return list;
  }, [strategyStats, searchQuery, sortBy, minTrades]);

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedList = filteredList.slice(startIndex, startIndex + pageSize);

  const handleExportCSV = () => {
    const headers = ['Strategy Name', 'Total Trades', 'Win Rate (%)', 'Total Profit/Loss (INR)', 'Profit Factor', 'Max Win', 'Max Loss'];
    const rows = filteredList.map(s => {
      const winRate = s.totalTrades > 0 ? (s.winTrades / s.totalTrades) * 100 : 0;
      const profitFactor = s.totalLoss > 0 ? (s.totalProfit / s.totalLoss) : s.totalProfit > 0 ? 99.9 : 0;
      return [s.name, s.totalTrades, winRate.toFixed(2), s.totalPnl.toFixed(2), profitFactor.toFixed(2), s.maxWin.toFixed(2), s.maxLoss.toFixed(2)];
    });
    const csvContent = [headers.join(','), ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `strategy_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <Loader title="Loading strategy report" text="Analyzing algorithmic executions and calculating stats..." fullscreen={false} />;
  }

  return (
    <>
      <style>{`
.table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.table-responsive table { min-width: 600px; font-size: 13px; }
.table-responsive th, .table-responsive td { white-space: nowrap; padding: 8px 10px; }
@media (max-width: 640px) {
  .sp-gap { gap: 16px !important; }
  .sp-gap > div:first-child h1 { font-size: 20px !important; }
  .sp-gap > div:first-child p { font-size: 13px !important; }
  .sp-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
  .sp-filters { flex-direction: column !important; align-items: stretch !important; }
  .sp-filters > div, .sp-filters > select { min-width: 0 !important; width: 100% !important; flex: 1 1 auto !important; }
  .sp-pagi { flex-direction: column !important; align-items: center !important; gap: 8px !important; }
  .sp-pagi > span:first-child { font-size: 11px !important; }
  .sp-pagi > div:first-child { gap: 8px !important; flex-wrap: wrap !important; justify-content: center !important; }
  .sp-pagi select { font-size: 11px !important; padding: 4px 6px !important; }
}
@media (min-width: 641px) and (max-width: 1024px) {
  .sp-grid { grid-template-columns: repeat(2, 1fr) !important; }
}
      `}</style>
      <div className="sp-gap" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="sp-title" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Strategy Performance Report
          </h1>
          <p className="sp-desc" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Review algorithmic efficiency, win ratios, and profit generation indicators.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

            {isFilterOpen && (
              <div style={{ 
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                background: 'var(--bg-white)',
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
          {canExport && (
            <Button variant="secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} /> Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="sp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Total Algorithmic P&L</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: totalAlgoPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {totalAlgoPnl >= 0 ? '+' : ''}₹{totalAlgoPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>{strategyStats.length} strategies</p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: totalAlgoPnl >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: totalAlgoPnl >= 0 ? '#10b981' : '#ef4444' }}>
              {totalAlgoPnl >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Best Performing Strategy</p>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {bestStrategy ? bestStrategy.name : 'N/A'}
              </h3>
              {bestStrategy && (
                <p style={{ color: 'var(--color-success)', fontSize: '11px', marginTop: '2px', fontWeight: 600 }}>
                  ₹{bestStrategy.totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })} P&L
                </p>
              )}
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Award size={20} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Most Executed Strategy</p>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {mostActive ? mostActive.name : 'N/A'}
              </h3>
              {mostActive && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                  {mostActive.totalTrades} Total Orders
                </p>
              )}
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Activity size={20} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Overall Win Rate</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: overallWinRate >= 50 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {overallWinRate.toFixed(1)}%
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                {totalWinTrades}W / {totalTradesCount - totalWinTrades}L
              </p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <BarChart3 size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Strategies Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Detailed Strategy Analytics ({filteredList.length})
          </h3>
        </div>

        {/* Filters */}
        <div className="sp-filters" style={{
          display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center',
          flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '12px 16px',
          borderRadius: '12px', border: '1px solid var(--border-color)'
        }}>
          <div style={{ position: 'relative', flex: '2 1 220px', minWidth: '180px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input type="text" placeholder="Search by strategy name..." value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ paddingLeft: '32px', height: '34px', fontSize: '12px', width: '100%', outline: 'none', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', color: 'var(--text-primary)' }} />
          </div>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', flex: '1 1 140px', minWidth: '120px' }}>
            <option value="pnl">Sort by P&L</option>
            <option value="trades">Sort by Trades</option>
            <option value="winrate">Sort by Win Rate</option>
            <option value="profitFactor">Sort by Profit Factor</option>
          </select>

          <select value={minTrades} onChange={(e) => { setMinTrades(Number(e.target.value)); setCurrentPage(1); }}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', flex: '1 1 120px', minWidth: '100px' }}>
            <option value={0}>Min Trades: Any</option>
            <option value={1}>Min Trades: 1+</option>
            <option value={5}>Min Trades: 5+</option>
            <option value={10}>Min Trades: 10+</option>
            <option value={25}>Min Trades: 25+</option>
            <option value={50}>Min Trades: 50+</option>
          </select>
        </div>

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
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    {searchQuery ? 'No strategies match your search.' : 'No strategy logs or active trade signals found.'}
                  </td>
                </tr>
              ) : (
                paginatedList.map((s, idx) => {
                  const winRate = s.totalTrades > 0 ? (s.winTrades / s.totalTrades) * 100 : 0;
                  const profitFactor = s.totalLoss > 0 ? (s.totalProfit / s.totalLoss) : s.totalProfit > 0 ? 99.9 : 0;
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                      <td>{s.totalTrades}</td>
                      <td style={{ fontWeight: 600, color: winRate >= 50 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {winRate.toFixed(1)}%
                      </td>
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

        {/* Pagination */}
        <div className="sp-pagi" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>
            Showing {filteredList.length ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, filteredList.length)} of {filteredList.length} entries
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }}>&lt;</button>
              {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => {
                const pageNum = currentPage <= 5 ? i + 1 : currentPage + i - 4;
                if (pageNum > totalPages) return null;
                return (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                    style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-color)',
                      background: currentPage === pageNum ? 'var(--primary)' : 'var(--bg-white)',
                      color: currentPage === pageNum ? 'white' : 'var(--text-body)', fontWeight: 600, cursor: 'pointer' }}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }}>&gt;</button>
            </div>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: 'pointer', outline: 'none', color: 'var(--text-primary)' }}>
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={30}>30 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </Card>
    </div></>
  );
}
