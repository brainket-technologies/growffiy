'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppViewModel } from '../../../../shared/viewmodels/AppContext';
import { Card } from '../../../../shared/components/views/Card';
import { Loader } from '../../../../shared/components/views/Loader';
import { Button } from '../../../../shared/components/views/Button';
import { Modal } from '../../../../shared/components/views/Modal';
import {
  Calendar,
  BarChart2,
  ArrowLeftRight,
  Crosshair,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function TradeSummaryPage() {
  const { trades, loading, refreshAllData } = useAppViewModel();
  const [selectedSummary, setSelectedSummary] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Type Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [pnlFilter, setPnlFilter] = useState<'ALL' | 'PROFIT' | 'LOSS'>('ALL');

  // Sorting
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Date Filter State
  const now = new Date();
  const initialStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const initialEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [startDate, setStartDate] = useState<Date | null>(initialStart);
  const [endDate, setEndDate] = useState<Date | null>(initialEnd);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<'month' | 'year' | 'custom' | 'all'>('month');
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dismiss date dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const applyMonthFilter = () => {
    setStartDate(new Date(selectedYear, selectedMonth, 1));
    setEndDate(new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59));
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const applyYearFilter = () => {
    setStartDate(new Date(selectedYear, 0, 1));
    setEndDate(new Date(selectedYear, 11, 31, 23, 59, 59));
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const applyCustomFilter = () => {
    if (customStart && customEnd) {
      setStartDate(new Date(`${customStart}T00:00:00`));
      setEndDate(new Date(`${customEnd}T23:59:59`));
      setIsFilterOpen(false);
      setCurrentPage(1);
    }
  };

  const applyAllTime = () => {
    setStartDate(null);
    setEndDate(null);
    setFilterType('all');
    setIsFilterOpen(false);
    setCurrentPage(1);
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

  let dateRangeStr = 'All Time';
  if (startDate && endDate) {
    const sStr = startDate.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const eStr = endDate.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    dateRangeStr = `${sStr} - ${eStr}`;
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refreshAllData) await refreshAllData();
    } catch (e) {
      console.error('Failed refreshing trades:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDateToYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Group trades stock-wise per trade execution block
  const summarizedTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const map = new Map<string, any>();

    trades.forEach((t: any) => {
      // Exclude cancelled/failed trades with 0 PnL
      if (
        ((t.status || '').toLowerCase() === 'cancelled' || (t.status || '').toLowerCase() === 'failed') &&
        (t.pnl === null || t.pnl === undefined || Number(t.pnl) === 0)
      ) {
        return;
      }

      const symbol = t.symbol || 'N/A';
      const d = new Date(t.createdAt || t.entryTime || new Date());
      const dTime = d.getTime();

      if (startDate && endDate) {
        const startOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0).getTime();
        const endOfDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59).getTime();
        if (dTime < startOfDay || dTime > endOfDay) {
          return;
        }
      }

      const dateYMD = formatDateToYMD(d);
      const isShort = (t.direction || '').toUpperCase() === 'SHORT' || (t.type || '').toUpperCase() === 'SELL';
      const tradeType: 'LONG' | 'SHORT' = isShort ? 'SHORT' : 'LONG';

      // Group key by: Symbol + Date + Trade Type
      const groupKey = `${symbol}_${dateYMD}_${tradeType}`;

      const qty = Number(t.quantity || 0);
      const entryVal = Number(t.entryPrice || 0);
      const exitVal = t.exitPrice ? Number(t.exitPrice) : 0;

      // PnL calculation
      let pnlVal = Number(t.pnl || 0);
      if ((t.pnl === null || t.pnl === undefined || t.pnl === 0) && entryVal > 0 && exitVal > 0) {
        pnlVal = isShort ? (entryVal - exitVal) * qty : (exitVal - entryVal) * qty;
      }

      const clientInfo = {
        id: t.client?.id || t.clientId || t.client?.user?.id || 'unknown',
        clientName: t.client?.user?.name || t.clientName || 'Client Trader',
        email: t.client?.user?.email || 'N/A',
        qty,
        entryPrice: entryVal,
        exitPrice: exitVal > 0 ? exitVal : null,
        pnl: pnlVal,
        status: t.status || 'CLOSED',
        strategy: t.strategy?.name || t.strategyName || 'Strategy'
      };

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          dateTime: d,
          symbol,
          tradeType,
          totalQty: qty,
          entryPriceSum: entryVal * qty,
          exitPriceSum: exitVal * qty,
          exitedQty: exitVal > 0 ? qty : 0,
          totalPnl: pnlVal,
          totalInvestment: entryVal * qty,
          clientsMap: new Map<string, any>([[clientInfo.id, clientInfo]]),
          clientsList: [clientInfo]
        });
      } else {
        const item = map.get(groupKey);
        item.totalQty += qty;
        item.totalPnl += pnlVal;
        item.totalInvestment += entryVal * qty;
        item.entryPriceSum += entryVal * qty;
        if (exitVal > 0) {
          item.exitPriceSum += exitVal * qty;
          item.exitedQty += qty;
        }
        item.clientsMap.set(clientInfo.id, clientInfo);
        item.clientsList.push(clientInfo);

        // Keep earliest dateTime
        if (d.getTime() < item.dateTime.getTime()) {
          item.dateTime = d;
        }
      }
    });

    // Compute weighted averages and sort
    const result = Array.from(map.values()).map(item => {
      const avgEntry = item.totalQty > 0 ? item.entryPriceSum / item.totalQty : 0;
      const avgExit = item.exitedQty > 0 ? item.exitPriceSum / item.exitedQty : null;
      return {
        ...item,
        avgEntry,
        avgExit,
        tradersCount: item.clientsMap.size
      };
    });

    return result;
  }, [trades, startDate, endDate]);

  // Apply Search, Type and PnL Filters
  const filteredSummaries = useMemo(() => {
    let list = summarizedTrades;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(item => item.symbol.toLowerCase().includes(q));
    }

    if (typeFilter !== 'ALL') {
      list = list.filter(item => item.tradeType === typeFilter);
    }

    if (pnlFilter === 'PROFIT') {
      list = list.filter(item => item.totalPnl > 0.01);
    } else if (pnlFilter === 'LOSS') {
      list = list.filter(item => item.totalPnl < -0.01);
    }

    // Sort
    return [...list].sort((a, b) => {
      let aVal: any = a.dateTime;
      let bVal: any = b.dateTime;
      if (sortKey === 'date') { aVal = a.dateTime.getTime(); bVal = b.dateTime.getTime(); }
      else if (sortKey === 'symbol') { aVal = a.symbol; bVal = b.symbol; }
      else if (sortKey === 'type') { aVal = a.tradeType; bVal = b.tradeType; }
      else if (sortKey === 'entry') { aVal = a.avgEntry; bVal = b.avgEntry; }
      else if (sortKey === 'exit') { aVal = a.avgExit || 0; bVal = b.avgExit || 0; }
      else if (sortKey === 'pnl') { aVal = a.totalPnl; bVal = b.totalPnl; }

      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [summarizedTrades, searchTerm, typeFilter, pnlFilter, sortKey, sortDir]);

  // Calculate Top 3 Summary Cards
  const topStats = useMemo(() => {
    let totalInvestment = 0;
    let totalPnl = 0;
    const uniqueTradersSet = new Set<string>();

    filteredSummaries.forEach(item => {
      totalInvestment += item.totalInvestment;
      totalPnl += item.totalPnl;
      item.clientsList.forEach((c: any) => {
        if (c.id) uniqueTradersSet.add(c.id);
        else uniqueTradersSet.add(c.clientName);
      });
    });

    const pnlPercentage = totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      totalPnl,
      pnlPercentage,
      totalTraders: uniqueTradersSet.size
    };
  }, [filteredSummaries]);

  // Pagination
  const totalCount = filteredSummaries.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedList = useMemo(() => {
    return filteredSummaries.slice(startIndex, startIndex + pageSize);
  }, [filteredSummaries, startIndex, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const handleExportCSV = () => {
    const headers = ['Date & Time', 'Stock Name', 'Trade Type', 'Entry Price', 'Exit Price', 'P&L (INR)', 'Total Investment (INR)', 'Traders Count'];
    const rows = filteredSummaries.map(item => [
      item.dateTime.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      item.symbol,
      item.tradeType,
      item.avgEntry.toFixed(2),
      item.avgExit ? item.avgExit.toFixed(2) : '--',
      item.totalPnl.toFixed(2),
      item.totalInvestment.toFixed(2),
      item.tradersCount
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trade_summary_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'Outfit, sans-serif' }}>
            Trade Summary
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Consolidated stock-wise performance, total capital investment, and net P&amp;L metrics.
          </p>
        </div>

        {/* Date Filter & Export Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Date Range Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '9px 16px', 
                borderRadius: '10px', 
                background: 'var(--bg-white)', 
                border: '1px solid var(--border)', 
                fontSize: '13px', 
                color: 'var(--text-body)',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                userSelect: 'none'
              }}
            >
              <Calendar size={15} color="var(--primary)" />
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
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-heading)' }}>Date Range</span>
                  <button 
                    onClick={clearFilters}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Reset
                  </button>
                </div>

                <div style={{ display: 'flex', background: 'var(--surface)', padding: '2px', borderRadius: '8px' }}>
                  <button 
                    onClick={() => setFilterType('month')}
                    style={{ flex: 1, border: 'none', background: filterType === 'month' ? 'var(--bg-white)' : 'transparent', color: 'var(--text-body)', fontSize: '12px', padding: '6px 0', borderRadius: '6px', fontWeight: filterType === 'month' ? 600 : 500, cursor: 'pointer' }}
                  >
                    Month
                  </button>
                  <button 
                    onClick={() => setFilterType('year')}
                    style={{ flex: 1, border: 'none', background: filterType === 'year' ? 'var(--bg-white)' : 'transparent', color: 'var(--text-body)', fontSize: '12px', padding: '6px 0', borderRadius: '6px', fontWeight: filterType === 'year' ? 600 : 500, cursor: 'pointer' }}
                  >
                    Year
                  </button>
                  <button 
                    onClick={() => setFilterType('custom')}
                    style={{ flex: 1, border: 'none', background: filterType === 'custom' ? 'var(--bg-white)' : 'transparent', color: 'var(--text-body)', fontSize: '12px', padding: '6px 0', borderRadius: '6px', fontWeight: filterType === 'custom' ? 600 : 500, cursor: 'pointer' }}
                  >
                    Custom
                  </button>
                  <button 
                    onClick={applyAllTime}
                    style={{ flex: 1, border: 'none', background: filterType === 'all' ? 'var(--bg-white)' : 'transparent', color: 'var(--text-body)', fontSize: '12px', padding: '6px 0', borderRadius: '6px', fontWeight: filterType === 'all' ? 600 : 500, cursor: 'pointer' }}
                  >
                    All
                  </button>
                </div>

                {filterType === 'month' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        style={{ flex: 1, padding: '7px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                      >
                        {MONTHS.map((m, idx) => (
                          <option key={idx} value={idx}>{m}</option>
                        ))}
                      </select>
                      <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        style={{ width: '90px', padding: '7px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                      >
                        {YEARS.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <Button onClick={applyMonthFilter} style={{ width: '100%', padding: '8px', fontSize: '12px', backgroundColor: 'var(--primary)', color: 'white' }}>
                      Apply Month Filter
                    </Button>
                  </div>
                )}

                {filterType === 'year' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      style={{ padding: '7px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                    >
                      {YEARS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <Button onClick={applyYearFilter} style={{ width: '100%', padding: '8px', fontSize: '12px', backgroundColor: 'var(--primary)', color: 'white' }}>
                      Apply Year Filter
                    </Button>
                  </div>
                )}

                {filterType === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Start Date</label>
                      <input 
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', width: '100%' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>End Date</label>
                      <input 
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', width: '100%' }}
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

          {/* Export CSV Button */}
          <Button 
            variant="secondary" 
            onClick={handleExportCSV}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}
          >
            <Download size={15} /> Export CSV
          </Button>

          {/* Refresh Button */}
          <Button 
            variant="secondary"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px' }}
            title="Refresh trades"
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin-animation' : ''} />
          </Button>
        </div>
      </div>

      {/* Top 3 KPI Summary Cards (Exactly matching image specification) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Total Investment */}
        <Card style={{ 
          padding: '22px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '18px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 246, 255, 0.7))',
          border: '1px solid rgba(219, 234, 254, 0.8)',
          boxShadow: '0 4px 16px rgba(37, 99, 235, 0.05)',
          borderRadius: '16px'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
            color: '#ffffff', 
            padding: '16px', 
            borderRadius: '14px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Wallet size={26} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: 700, letterSpacing: '0.2px' }}>
              Total Investment
            </div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', marginTop: '4px', fontFamily: 'Outfit, sans-serif' }}>
              ₹{topStats.totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Across {filteredSummaries.length} trade executions
            </div>
          </div>
        </Card>

        {/* Card 2: Total P&L */}
        <Card style={{ 
          padding: '22px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '18px',
          background: topStats.totalPnl >= 0 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 253, 244, 0.7))'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(254, 242, 242, 0.7))',
          border: topStats.totalPnl >= 0 ? '1px solid rgba(187, 247, 208, 0.8)' : '1px solid rgba(254, 202, 202, 0.8)',
          boxShadow: topStats.totalPnl >= 0 ? '0 4px 16px rgba(22, 163, 74, 0.05)' : '0 4px 16px rgba(220, 38, 38, 0.05)',
          borderRadius: '16px'
        }}>
          <div style={{ 
            background: topStats.totalPnl >= 0 ? 'linear-gradient(135deg, #22c55e, #15803d)' : 'linear-gradient(135deg, #ef4444, #b91c1c)', 
            color: '#ffffff', 
            padding: '16px', 
            borderRadius: '14px',
            boxShadow: topStats.totalPnl >= 0 ? '0 4px 12px rgba(22, 163, 74, 0.25)' : '0 4px 12px rgba(220, 38, 38, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {topStats.totalPnl >= 0 ? <TrendingUp size={26} /> : <TrendingDown size={26} />}
          </div>
          <div>
            <div style={{ fontSize: '13px', color: topStats.totalPnl >= 0 ? '#14532d' : '#7f1d1d', fontWeight: 700, letterSpacing: '0.2px' }}>
              Total P&amp;L
            </div>
            <div style={{ 
              fontSize: '26px', 
              fontWeight: 900, 
              color: topStats.totalPnl >= 0 ? '#16a34a' : '#dc2626', 
              marginTop: '4px',
              fontFamily: 'Outfit, sans-serif'
            }}>
              {topStats.totalPnl >= 0 ? `+₹${topStats.totalPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : `-₹${Math.abs(topStats.totalPnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: topStats.totalPnl >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700, marginTop: '2px' }}>
              {topStats.totalPnl >= 0 ? '▲' : '▼'} {topStats.pnlPercentage >= 0 ? `+${topStats.pnlPercentage.toFixed(2)}%` : `${topStats.pnlPercentage.toFixed(2)}%`} ROI
            </div>
          </div>
        </Card>

        {/* Card 3: Total No. of Traders */}
        <Card style={{ 
          padding: '22px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '18px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 245, 255, 0.7))',
          border: '1px solid rgba(233, 213, 255, 0.8)',
          boxShadow: '0 4px 16px rgba(168, 85, 247, 0.05)',
          borderRadius: '16px'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #a855f7, #6b21a8)', 
            color: '#ffffff', 
            padding: '16px', 
            borderRadius: '14px',
            boxShadow: '0 4px 12px rgba(168, 85, 247, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={26} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#581c87', fontWeight: 700, letterSpacing: '0.2px' }}>
              Total No. of Traders
            </div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', marginTop: '4px', fontFamily: 'Outfit, sans-serif' }}>
              {topStats.totalTraders}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Subscribed accounts participating
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        
        {/* Table Filters Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '18px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-white)'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '340px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Search stock name..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                fontSize: '13px',
                outline: 'none',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Dropdown Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* Trade Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as any); setCurrentPage(1); }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Types (Long &amp; Short)</option>
              <option value="LONG">▲ Long Only</option>
              <option value="SHORT">▼ Short Only</option>
            </select>

            {/* PnL Filter */}
            <select
              value={pnlFilter}
              onChange={(e) => { setPnlFilter(e.target.value as any); setCurrentPage(1); }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All P&amp;L</option>
              <option value="PROFIT">In Profit (+)</option>
              <option value="LOSS">In Loss (-)</option>
            </select>

            {/* Results Counter */}
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginLeft: '6px' }}>
              Showing {paginatedList.length} of {totalCount} records
            </span>
          </div>
        </div>

        {/* Trade Summary Table (Styled exactly matching user request) */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                
                {/* Column: Date */}
                <th 
                  onClick={() => handleSort('date')}
                  style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#1e3a8a', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={15} style={{ color: '#2563eb' }} />
                    <span>Date</span>
                    {sortKey === 'date' && <span style={{ fontSize: '10px' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>

                {/* Column: Stock Name */}
                <th 
                  onClick={() => handleSort('symbol')}
                  style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#1e3a8a', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={15} style={{ color: '#2563eb' }} />
                    <span>Stock Name</span>
                    {sortKey === 'symbol' && <span style={{ fontSize: '10px' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>

                {/* Column: Trade Type */}
                <th 
                  onClick={() => handleSort('type')}
                  style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#1e3a8a', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowLeftRight size={15} style={{ color: '#2563eb' }} />
                    <span>Trade Type</span>
                    {sortKey === 'type' && <span style={{ fontSize: '10px' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>

                {/* Column: Entry */}
                <th 
                  onClick={() => handleSort('entry')}
                  style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#1e3a8a', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Crosshair size={15} style={{ color: '#2563eb' }} />
                    <span>Entry</span>
                    {sortKey === 'entry' && <span style={{ fontSize: '10px' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>

                {/* Column: Exit */}
                <th 
                  onClick={() => handleSort('exit')}
                  style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#1e3a8a', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowUpRight size={15} style={{ color: '#2563eb' }} />
                    <span>Exit</span>
                    {sortKey === 'exit' && <span style={{ fontSize: '10px' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>

                {/* Column: P&L */}
                <th 
                  onClick={() => handleSort('pnl')}
                  style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#1e3a8a', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <TrendingUp size={15} style={{ color: '#2563eb' }} />
                    <span>P&amp;L</span>
                    {sortKey === 'pnl' && <span style={{ fontSize: '10px' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader fullscreen={false} title="Loading Trades" text="Fetching trade summary data..." />
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)' }}>No trade executions found</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Try adjusting your date range, stock search, or type filters.</div>
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => {
                  const isLong = item.tradeType === 'LONG';
                  const isPositive = item.totalPnl > 0.01;
                  const isNegative = item.totalPnl < -0.01;

                  // Format Date e.g. "11 Nov, 09:32 am"
                  const dateStr = item.dateTime.toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });

                  return (
                    <tr 
                      key={item.key || idx}
                      onClick={() => setSelectedSummary(item)}
                      style={{ 
                        borderBottom: '1px solid #eef2f6', 
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      className="summary-table-row"
                    >
                      {/* Date */}
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#334155', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </td>

                      {/* Stock Name */}
                      <td style={{ padding: '14px 18px', fontSize: '13.5px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.2px' }}>
                        {item.symbol}
                      </td>

                      {/* Trade Type */}
                      <td style={{ padding: '14px 18px', fontSize: '12px' }}>
                        {isLong ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#dcfce7',
                            color: '#15803d',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '11px'
                          }}>
                            ▲ LONG
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '11px'
                          }}>
                            ▼ SHORT
                          </span>
                        )}
                      </td>

                      {/* Entry Price */}
                      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                        ₹{item.avgEntry.toFixed(2)}
                      </td>

                      {/* Exit Price */}
                      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 600, color: item.avgExit ? '#1e293b' : '#94a3b8' }}>
                        {item.avgExit ? `₹${item.avgExit.toFixed(2)}` : '--'}
                      </td>

                      {/* P&L */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {isPositive ? (
                          <span style={{
                            display: 'inline-block',
                            background: '#dcfce7',
                            color: '#15803d',
                            padding: '4px 14px',
                            borderRadius: '9999px',
                            fontWeight: 800,
                            fontSize: '13px'
                          }}>
                            +₹{Math.abs(item.totalPnl).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </span>
                        ) : isNegative ? (
                          <span style={{
                            display: 'inline-block',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            padding: '4px 14px',
                            borderRadius: '9999px',
                            fontWeight: 800,
                            fontSize: '13px'
                          }}>
                            -₹{Math.abs(item.totalPnl).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-block',
                            background: '#f1f5f9',
                            color: '#64748b',
                            padding: '4px 14px',
                            borderRadius: '9999px',
                            fontWeight: 700,
                            fontSize: '13px'
                          }}>
                            ₹0.00
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalCount > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-white)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Showing {startIndex + 1} - {Math.min(startIndex + pageSize, totalCount)} of {totalCount} records
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ padding: '5px 12px', fontSize: '12px' }}
              >
                Previous
              </Button>
              
              <span style={{ fontSize: '12px', fontWeight: 600, padding: '0 6px', color: 'var(--text-primary)' }}>
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: '5px 12px', fontSize: '12px' }}
              >
                Next
              </Button>

              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Drilldown Modal (Click on any stock trade to see client breakdown) */}
      {selectedSummary && (
        <Modal
          isOpen={!!selectedSummary}
          onClose={() => setSelectedSummary(null)}
          title={`Trade Breakdown: ${selectedSummary.symbol} (${selectedSummary.tradeType})`}
          maxWidth="980px"
          width="min(980px, 95vw)"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              background: 'var(--surface)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date &amp; Time</span>
                <div style={{ fontSize: '13.5px', fontWeight: 700, marginTop: '3px' }}>
                  {selectedSummary.dateTime.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trade Type</span>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: selectedSummary.tradeType === 'LONG' ? '#16a34a' : '#dc2626', marginTop: '3px' }}>
                  {selectedSummary.tradeType === 'LONG' ? '▲ LONG' : '▼ SHORT'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Entry</span>
                <div style={{ fontSize: '13.5px', fontWeight: 700, marginTop: '3px' }}>
                  ₹{selectedSummary.avgEntry.toFixed(2)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Exit</span>
                <div style={{ fontSize: '13.5px', fontWeight: 700, marginTop: '3px' }}>
                  {selectedSummary.avgExit ? `₹${selectedSummary.avgExit.toFixed(2)}` : '--'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total P&amp;L</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: selectedSummary.totalPnl >= 0 ? '#16a34a' : '#dc2626', marginTop: '3px' }}>
                  {selectedSummary.totalPnl >= 0 ? `+₹${selectedSummary.totalPnl.toFixed(2)}` : `-₹${Math.abs(selectedSummary.totalPnl).toFixed(2)}`}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Traders</span>
                <div style={{ fontSize: '13.5px', fontWeight: 700, marginTop: '3px' }}>
                  {selectedSummary.tradersCount} Clients
                </div>
              </div>
            </div>

            {/* Client Breakdown Table */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
                Client Order Breakdown ({selectedSummary.clientsList.length})
              </h4>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: '11.5px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px 14px' }}>Client</th>
                      <th style={{ padding: '10px 14px' }}>Strategy</th>
                      <th style={{ padding: '10px 14px' }}>Qty</th>
                      <th style={{ padding: '10px 14px' }}>Entry</th>
                      <th style={{ padding: '10px 14px' }}>Exit</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>P&amp;L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSummary.clientsList.map((cli: any, cIdx: number) => {
                      const cPnlPos = cli.pnl > 0.01;
                      const cPnlNeg = cli.pnl < -0.01;
                      return (
                        <tr key={cIdx} style={{ borderBottom: '1px solid var(--border)', fontSize: '12px' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{cli.clientName}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{cli.strategy}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>{cli.qty}</td>
                          <td style={{ padding: '10px 14px' }}>₹{cli.entryPrice.toFixed(2)}</td>
                          <td style={{ padding: '10px 14px' }}>{cli.exitPrice ? `₹${cli.exitPrice.toFixed(2)}` : '--'}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 800, textAlign: 'right', color: cPnlPos ? '#16a34a' : cPnlNeg ? '#dc2626' : '#64748b' }}>
                            {cPnlPos ? `+₹${cli.pnl.toFixed(2)}` : cPnlNeg ? `-₹${Math.abs(cli.pnl).toFixed(2)}` : '₹0.00'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <Button onClick={() => setSelectedSummary(null)} style={{ padding: '8px 20px', fontSize: '13px' }}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CSS for row hover */}
      <style jsx global>{`
        .summary-table-row:hover {
          background-color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}
