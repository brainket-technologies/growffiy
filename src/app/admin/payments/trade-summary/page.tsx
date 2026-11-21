'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppViewModel } from '../../../../shared/viewmodels/AppContext';
import { Card } from '../../../../shared/components/views/Card';
import { Button } from '../../../../shared/components/views/Button';
import { Modal } from '../../../../shared/components/views/Modal';
import {
  Calendar,
  ChevronDown,
  Download,
  RefreshCw,
  Search,
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart2
} from 'lucide-react';

function formatDateTime(timeStr: string | Date | null) {
  if (!timeStr) return '--';
  try {
    const date = new Date(timeStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const prefix = isToday ? 'Today' : isYesterday ? 'Yesterday' : '';
    const formatted = date.toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
    });
    return prefix ? `${prefix} ${formatted}` : formatted;
  } catch { return '--'; }
}

export default function TradeSummaryPage() {
  const { trades = [], clients = [], loading, refreshAllData } = useAppViewModel();
  const [selectedSummary, setSelectedSummary] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Type Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [pnlFilter, setPnlFilter] = useState<'ALL' | 'PROFIT' | 'LOSS'>('ALL');

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
        clientName: t.client?.user?.name || t.clientName || 'System Client',
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

        if (d.getTime() < item.dateTime.getTime()) {
          item.dateTime = d;
        }
      }
    });

    // Compute weighted averages and sort by date descending
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

    return result.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
  }, [trades, startDate, endDate]);

  // Apply Search, Type, and PnL Filters
  const filteredSummaries = useMemo(() => {
    let list = summarizedTrades;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
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

    return list;
  }, [summarizedTrades, searchQuery, typeFilter, pnlFilter]);

  // Top Summary Cards
  const topStats = useMemo(() => {
    let totalPnl = 0;
    const uniqueTradersSet = new Set<string>();

    filteredSummaries.forEach(item => {
      totalPnl += item.totalPnl;
      item.clientsList.forEach((c: any) => {
        if (c.id) uniqueTradersSet.add(c.id);
        else uniqueTradersSet.add(c.clientName);
      });
    });

    const totalDemat = clients.reduce((acc, c: any) => acc + (Number(c.liveMargin) || 0), 0);
    const pnlPercentage = totalDemat > 0 ? (totalPnl / totalDemat) * 100 : 0;

    return {
      totalDemat,
      totalPnl,
      pnlPercentage,
      totalTraders: uniqueTradersSet.size
    };
  }, [filteredSummaries, clients]);

  // Pagination
  const totalCount = filteredSummaries.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedList = useMemo(() => {
    return filteredSummaries.slice(startIndex, startIndex + pageSize);
  }, [filteredSummaries, startIndex, pageSize]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Trade Summary
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            View aggregated stock performance, total capital investment, and P&amp;L statements.
          </p>
        </div>

        {/* Date Filter & Export Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Date Picker Button */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 14px', 
                borderRadius: '8px', 
                background: 'var(--bg-white)', 
                border: '1px solid var(--border-color)', 
                fontSize: '12px', 
                color: 'var(--text-primary)',
                fontWeight: 500,
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <Calendar size={14} color="var(--primary)" />
              <span>{dateRangeStr}</span>
              <ChevronDown size={14} color="var(--text-subtle)" />
            </div>

            {isFilterOpen && (
              <div style={{ 
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                background: 'var(--bg-white)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
                padding: '16px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>Date Range Filter</span>
                  <button 
                    onClick={clearFilters}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Reset
                  </button>
                </div>

                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '2px', borderRadius: '8px' }}>
                  <button 
                    onClick={() => setFilterType('month')}
                    style={{ flex: 1, border: 'none', background: filterType === 'month' ? 'var(--bg-white)' : 'transparent', color: 'var(--text-primary)', fontSize: '12px', padding: '6px 0', borderRadius: '6px', fontWeight: filterType === 'month' ? 600 : 500, cursor: 'pointer' }}
                  >
                    Month
                  </button>
                  <button 
                    onClick={() => setFilterType('year')}
                    style={{ flex: 1, border: 'none', background: filterType === 'year' ? 'var(--bg-white)' : 'transparent', color: 'var(--text-primary)', fontSize: '12px', padding: '6px 0', borderRadius: '6px', fontWeight: filterType === 'year' ? 600 : 500, cursor: 'pointer' }}
                  >
                    Year
                  </button>
                  <button 
                    onClick={() => setFilterType('custom')}
                    style={{ flex: 1, border: 'none', background: filterType === 'custom' ? 'var(--bg-white)' : 'transparent', color: 'var(--text-primary)', fontSize: '12px', padding: '6px 0', borderRadius: '6px', fontWeight: filterType === 'custom' ? 600 : 500, cursor: 'pointer' }}
                  >
                    Custom
                  </button>
                  <button 
                    onClick={applyAllTime}
                    style={{ flex: 1, border: 'none', background: filterType === 'all' ? 'var(--bg-white)' : 'transparent', color: 'var(--text-primary)', fontSize: '12px', padding: '6px 0', borderRadius: '6px', fontWeight: filterType === 'all' ? 600 : 500, cursor: 'pointer' }}
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
                        style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
                      >
                        {MONTHS.map((m, idx) => (
                          <option key={idx} value={idx}>{m}</option>
                        ))}
                      </select>
                      <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        style={{ width: '90px', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
                      >
                        {YEARS.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <Button onClick={applyMonthFilter} style={{ width: '100%', padding: '7px', fontSize: '12px' }}>
                      Apply Month
                    </Button>
                  </div>
                )}

                {filterType === 'year' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
                    >
                      {YEARS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <Button onClick={applyYearFilter} style={{ width: '100%', padding: '7px', fontSize: '12px' }}>
                      Apply Year
                    </Button>
                  </div>
                )}

                {filterType === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Start Date</label>
                      <input 
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>End Date</label>
                      <input 
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <Button onClick={applyCustomFilter} style={{ width: '100%', padding: '7px', fontSize: '12px' }}>
                      Apply Custom Range
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
          >
            <Download size={14} /> Export CSV
          </Button>

          {/* Refresh Button */}
          <Button 
            variant="secondary"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px' }}
            title="Refresh trades"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Top 3 Summary Cards Section with Custom Pastel Gradients, Waves & Candlestick Banner */}
      <div style={{
        position: 'relative',
        borderRadius: '20px',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(219, 234, 254, 0.4) 0%, rgba(240, 249, 255, 0.6) 50%, rgba(255, 255, 255, 0.9) 100%)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
        overflow: 'hidden'
      }}>
        {/* Candlestick Silhouette Banner in Top-Right Background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/candlestick_banner.png" 
          alt="" 
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            height: '45px',
            objectFit: 'contain',
            opacity: 0.85,
            pointerEvents: 'none',
            zIndex: 0
          }} 
        />

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '16px',
          position: 'relative',
          zIndex: 1
        }}>
          
          {/* Card 1: Total Demat (Light Blue Pastel with Fluid Waves & Money Pouch PNG) */}
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '16px',
            padding: '20px 22px',
            background: 'linear-gradient(135deg, #dbeafe 0%, #e0f2fe 50%, #eff6ff 100%)',
            border: '1px solid rgba(147, 197, 253, 0.6)',
            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Money Pouch PNG Icon */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/card_icon_demat.png" 
              alt="Total Demat" 
              style={{ width: '56px', height: '62px', objectFit: 'contain', zIndex: 2, flexShrink: 0 }} 
            />

            {/* Card Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 2 }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f2744', letterSpacing: '-0.2px' }}>
                Total Demat
              </span>
              <span style={{ fontSize: '30px', fontWeight: 800, color: '#002060', lineHeight: 1.15, fontFamily: 'var(--font-title, inherit)' }}>
                ₹{topStats.totalDemat.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>

            {/* Bottom-Right Blue SVG Waves */}
            <svg viewBox="0 0 160 90" preserveAspectRatio="none" style={{ position: 'absolute', right: 0, bottom: 0, width: '45%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
              <path d="M0,82 C40,95 70,55 110,65 C135,72 150,55 160,58 L160,90 L0,90 Z" fill="rgba(147, 197, 253, 0.45)" />
              <path d="M10,88 C50,98 80,68 120,78 C140,84 152,72 160,74 L160,90 L10,90 Z" fill="rgba(96, 165, 250, 0.4)" />
              <path d="M0,82 C40,95 70,55 110,65 C135,72 150,55 160,58" fill="none" stroke="rgba(147, 197, 253, 0.85)" strokeWidth="1.5" />
              <path d="M10,88 C50,98 80,68 120,78 C140,84 152,72 160,74" fill="none" stroke="rgba(96, 165, 250, 0.9)" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Card 2: Total P&L (Light Green Pastel with Fluid Waves & Growth Chart PNG) */}
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '16px',
            padding: '20px 22px',
            background: 'linear-gradient(135deg, #dcfce7 0%, #e6fced 50%, #f0fdf4 100%)',
            border: '1px solid rgba(187, 247, 208, 0.7)',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Growth Bar Chart PNG Icon */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/card_icon_pnl.png" 
              alt="Total P&L" 
              style={{ width: '50px', height: '56px', objectFit: 'contain', zIndex: 2, flexShrink: 0 }} 
            />

            {/* Card Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 2 }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#064e3b', letterSpacing: '-0.2px' }}>
                Total P&amp;L
              </span>
              <span style={{ 
                fontSize: '30px', 
                fontWeight: 800, 
                color: topStats.totalPnl >= 0 ? '#047857' : '#dc2626', 
                lineHeight: 1.15, 
                fontFamily: 'var(--font-title, inherit)',
                whiteSpace: 'nowrap'
              }}>
                {topStats.totalPnl >= 0 ? '+' : ''}₹{topStats.totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '13px', 
                fontWeight: 700, 
                color: topStats.totalPnl >= 0 ? '#047857' : '#dc2626',
                marginTop: '1px'
              }}>
                <span>{topStats.totalPnl >= 0 ? '▲' : '▼'}</span>
                <span>{topStats.pnlPercentage >= 0 ? `+${topStats.pnlPercentage.toFixed(2)}%` : `${topStats.pnlPercentage.toFixed(2)}%`}</span>
              </div>
            </div>

            {/* Bottom-Right Green SVG Waves */}
            <svg viewBox="0 0 160 90" preserveAspectRatio="none" style={{ position: 'absolute', right: 0, bottom: 0, width: '45%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
              <path d="M0,78 C35,55 70,88 115,48 C140,25 152,32 160,36 L160,90 L0,90 Z" fill="rgba(167, 243, 208, 0.45)" />
              <path d="M15,86 C50,65 80,94 125,58 C145,38 155,42 160,46 L160,90 L15,90 Z" fill="rgba(110, 231, 183, 0.4)" />
              <path d="M0,78 C35,55 70,88 115,48 C140,25 152,32 160,36" fill="none" stroke="rgba(52, 211, 153, 0.85)" strokeWidth="1.5" />
              <path d="M15,86 C50,65 80,94 125,58 C145,38 155,42 160,46" fill="none" stroke="rgba(16, 185, 129, 0.9)" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Card 3: Total No. of Traders (Light Purple Pastel with Fluid Waves & Users PNG) */}
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '16px',
            padding: '20px 22px',
            background: 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 50%, #faf5ff 100%)',
            border: '1px solid rgba(221, 214, 254, 0.7)',
            boxShadow: '0 4px 15px rgba(168, 85, 247, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Users / Traders PNG Icon */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/card_icon_traders.png" 
              alt="Total No. of Traders" 
              style={{ width: '56px', height: '54px', objectFit: 'contain', zIndex: 2, flexShrink: 0 }} 
            />

            {/* Card Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 2 }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#4c1d95', letterSpacing: '-0.2px' }}>
                Total No. of Traders
              </span>
              <span style={{ fontSize: '30px', fontWeight: 800, color: '#1e1b4b', lineHeight: 1.15, fontFamily: 'var(--font-title, inherit)' }}>
                {topStats.totalTraders}
              </span>
            </div>

            {/* Bottom-Right Purple SVG Waves */}
            <svg viewBox="0 0 160 90" preserveAspectRatio="none" style={{ position: 'absolute', right: 0, bottom: 0, width: '45%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
              <path d="M0,80 C35,62 70,92 115,52 C140,28 152,36 160,40 L160,90 L0,90 Z" fill="rgba(216, 180, 254, 0.4)" />
              <path d="M15,88 C50,72 80,98 125,62 C145,42 155,48 160,50 L160,90 L15,90 Z" fill="rgba(192, 132, 252, 0.45)" />
              <path d="M0,80 C35,62 70,92 115,52 C140,28 152,36 160,40" fill="none" stroke="rgba(192, 132, 252, 0.85)" strokeWidth="1.5" />
              <path d="M15,88 C50,72 80,98 125,62 C145,42 155,48 160,50" fill="none" stroke="rgba(168, 85, 247, 0.9)" strokeWidth="1.5" />
            </svg>
          </div>

        </div>
      </div>

      {/* Main Table Card (Exact structure & classes matching trades/page.tsx) */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Trade Summary Log ({filteredSummaries.length})
          </h3>
        </div>

        {/* Filters Bar (Exact layout from trades/page.tsx) */}
        <div style={{
          display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center',
          flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '12px 16px',
          borderRadius: '12px', border: '1px solid var(--border-color)'
        }}>
          {/* Search by Symbol / Stock Name */}
          <div style={{ position: 'relative', flex: '2 1 200px', minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search by symbol, stock name..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{
                paddingLeft: '32px',
                height: '34px',
                fontSize: '12px',
                width: '100%',
                outline: 'none',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-white)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Trade Type Filter */}
          <select 
            value={typeFilter} 
            onChange={(e) => { setTypeFilter(e.target.value as any); setCurrentPage(1); }}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '12px',
              height: '34px',
              outline: 'none',
              background: 'var(--bg-white)',
              color: 'var(--text-primary)',
              flex: '1 1 120px',
              minWidth: '110px'
            }}
          >
            <option value="ALL">All Types</option>
            <option value="LONG">BUY (LONG)</option>
            <option value="SHORT">SELL (SHORT)</option>
          </select>

          {/* PnL Outcome Filter */}
          <select 
            value={pnlFilter} 
            onChange={(e) => { setPnlFilter(e.target.value as any); setCurrentPage(1); }}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '12px',
              height: '34px',
              outline: 'none',
              background: 'var(--bg-white)',
              color: 'var(--text-primary)',
              flex: '1 1 120px',
              minWidth: '110px'
            }}
          >
            <option value="ALL">All Status</option>
            <option value="PROFIT">In Profit (+)</option>
            <option value="LOSS">In Loss (-)</option>
          </select>
        </div>

        {/* Table Responsive Wrapper */}
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>DATE &amp; TIME</th>
                <th style={{ whiteSpace: 'nowrap' }}>STOCK NAME</th>
                <th style={{ whiteSpace: 'nowrap' }}>TRADE TYPE</th>
                <th style={{ whiteSpace: 'nowrap' }}>ENTRY</th>
                <th style={{ whiteSpace: 'nowrap' }}>EXIT</th>
                <th style={{ whiteSpace: 'nowrap' }}>P&amp;L (₹)</th>
                <th style={{ whiteSpace: 'nowrap' }}>TRADERS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
                      <RefreshCw size={18} className="spin" style={{ marginRight: '10px' }} /> Loading trade summary data...
                    </div>
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    {searchQuery || typeFilter !== 'ALL' || pnlFilter !== 'ALL'
                      ? 'No trades match the selected filters.'
                      : 'No trade transactions recorded in this period.'}
                  </td>
                </tr>
              ) : (
                paginatedList.map((row: any, idx: number) => {
                  const isLong = row.tradeType === 'LONG';
                  const isProfit = row.totalPnl >= 0;

                  return (
                    <tr
                      key={row.key || idx}
                      onClick={() => setSelectedSummary(row)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Date & Time */}
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDateTime(row.dateTime)}
                      </td>

                      {/* Stock Name */}
                      <td style={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                        {row.symbol}
                      </td>

                      {/* Trade Type */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span 
                          className={`badge ${isLong ? 'badge-blue' : 'badge-red'}`} 
                          style={{ padding: '3px 8px', fontSize: '10px', textTransform: 'uppercase' }}
                        >
                          {isLong ? 'BUY' : 'SELL'}
                        </span>
                      </td>

                      {/* Entry Price */}
                      <td style={{ fontSize: '12px', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        ₹{row.avgEntry.toFixed(2)}
                      </td>

                      {/* Exit Price */}
                      <td style={{ fontSize: '12px', whiteSpace: 'nowrap', fontWeight: 500, color: row.avgExit ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {row.avgExit ? `₹${row.avgExit.toFixed(2)}` : '--'}
                      </td>

                      {/* P&L */}
                      <td style={{ fontWeight: 600, fontSize: '13px', color: isProfit ? 'var(--color-success)' : 'var(--color-danger)', whiteSpace: 'nowrap' }}>
                        {isProfit ? `+₹${row.totalPnl.toFixed(2)}` : `-₹${Math.abs(row.totalPnl).toFixed(2)}`}
                      </td>

                      {/* Traders */}
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <Users size={13} style={{ color: '#2563eb' }} />
                          {row.tradersCount} Traders
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Exact style from trades/page.tsx) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>
            Showing {filteredSummaries.length ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, filteredSummaries.length)} of {filteredSummaries.length} entries
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }}
              >
                &lt;
              </button>

              {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => {
                const pageNum = currentPage <= 5
                  ? i + 1
                  : currentPage + i - 4;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '4px 10px', borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: currentPage === pageNum ? 'var(--primary)' : 'var(--bg-white)',
                      color: currentPage === pageNum ? 'white' : 'var(--text-primary)',
                      fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }}
              >
                &gt;
              </button>
            </div>

            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: 'pointer', outline: 'none', color: 'var(--text-primary)' }}
            >
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
              <option value={200}>200 / page</option>
              <option value={500}>500 / page</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Drilldown Modal: Client Breakdown for Selected Stock Trade */}
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
              background: 'var(--bg-secondary)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date &amp; Time</span>
                <div style={{ fontSize: '13.5px', fontWeight: 600, marginTop: '3px' }}>
                  {formatDateTime(selectedSummary.dateTime)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trade Type</span>
                <div style={{ marginTop: '3px' }}>
                  <span className={`badge ${selectedSummary.tradeType === 'LONG' ? 'badge-blue' : 'badge-red'}`} style={{ padding: '2px 8px', fontSize: '10px' }}>
                    {selectedSummary.tradeType === 'LONG' ? 'BUY (LONG)' : 'SELL (SHORT)'}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Entry</span>
                <div style={{ fontSize: '13.5px', fontWeight: 600, marginTop: '3px' }}>
                  ₹{selectedSummary.avgEntry.toFixed(2)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Exit</span>
                <div style={{ fontSize: '13.5px', fontWeight: 600, marginTop: '3px' }}>
                  {selectedSummary.avgExit ? `₹${selectedSummary.avgExit.toFixed(2)}` : '--'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total P&amp;L</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: selectedSummary.totalPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '3px' }}>
                  {selectedSummary.totalPnl >= 0 ? `+₹${selectedSummary.totalPnl.toFixed(2)}` : `-₹${Math.abs(selectedSummary.totalPnl).toFixed(2)}`}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Traders</span>
                <div style={{ fontSize: '13.5px', fontWeight: 600, marginTop: '3px' }}>
                  {selectedSummary.tradersCount} Traders
                </div>
              </div>
            </div>

            {/* Client Breakdown Table */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                Client Order Breakdown ({selectedSummary.clientsList.length})
              </h4>
              <div className="table-responsive" style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ whiteSpace: 'nowrap' }}>Client</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Strategy</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Qty</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Entry</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Exit</th>
                      <th style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>P&amp;L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSummary.clientsList.map((cli: any, cIdx: number) => {
                      const cPnlPos = cli.pnl > 0.01;
                      const cPnlNeg = cli.pnl < -0.01;
                      return (
                        <tr key={cIdx} style={{ fontSize: '12px' }}>
                          <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{cli.clientName}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{cli.strategy}</td>
                          <td style={{ fontWeight: 600 }}>{cli.qty}</td>
                          <td>₹{cli.entryPrice.toFixed(2)}</td>
                          <td>{cli.exitPrice ? `₹${cli.exitPrice.toFixed(2)}` : '--'}</td>
                          <td style={{ fontWeight: 600, textAlign: 'right', color: cPnlPos ? 'var(--color-success)' : cPnlNeg ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                            {cPnlPos ? `+₹${cli.pnl.toFixed(2)}` : cPnlNeg ? `-₹${Math.abs(cli.pnl).toFixed(2)}` : '₹0.00'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <Button onClick={() => setSelectedSummary(null)} style={{ padding: '8px 20px', fontSize: '13px' }}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
