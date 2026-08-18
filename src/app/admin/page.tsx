'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  RefreshCw,
  BarChart3,
  Activity,
  Zap,
  Layers,
  ArrowUpRight,
  X
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

const formatDateToLocalYMD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AdminDashboard() {
  const router = useRouter();
  const {
    trades,
    isTradingActive,
    toggleTrading,
    loading: globalLoading,
  } = useAppViewModel();

  const [pnlPeriod, setPnlPeriod] = useState('Weekly');
  const [cardPnlFilter, setCardPnlFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [selectedBarModal, setSelectedBarModal] = useState<{ label: string; index: number } | null>(null);
  const [modalTrades, setModalTrades] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalViewMode, setModalViewMode] = useState<'list' | 'grouped'>('list');

  // Calendar settings for trading days display
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(true);
  const [tradingDays, setTradingDays] = useState<string[]>([]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [specialDays, setSpecialDays] = useState<string[]>([]);
  const [isSheetStreaming, setIsSheetStreaming] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);

  useEffect(() => {
    api.get(API_ENDPOINTS.SETTINGS).then((res: any) => {
      if (res.success && res.settings) {
        setAutoTradeEnabled(res.settings.auto_trade_enabled !== 'false');
        try { setTradingDays(JSON.parse(res.settings.trading_days || '[]')); } catch {}
        try { setHolidays(JSON.parse(res.settings.market_holidays || '[]')); } catch {}
        try { setSpecialDays(JSON.parse(res.settings.special_market_days || '[]')); } catch {}
      }
    }).catch(() => {});

    // Fetch initial sheets sync status
    fetch('/api/admin/sheet-stream/toggle')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsSheetStreaming(data.active);
        }
      })
      .catch(() => {});
  }, []);

  const toggleSheetStreaming = async () => {
    setSheetLoading(true);
    try {
      const res = await fetch('/api/admin/sheet-stream/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !isSheetStreaming })
      });
      const data = await res.json();
      if (data.success) {
        setIsSheetStreaming(data.active);
      }
    } catch (err) {
      console.error("Failed to toggle sheet streaming", err);
    } finally {
      setSheetLoading(false);
    }
  };

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
  const [customStart, setCustomStart] = useState<string>(formatDateToLocalYMD(initialStart));
  const [customEnd, setCustomEnd] = useState<string>(formatDateToLocalYMD(initialEnd));

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
      const startStr = formatDateToLocalYMD(start);
      const endStr = formatDateToLocalYMD(end);
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
  const activeSubscriptions = stats?.activeSubscriptions || 0;
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

  // Helper function to calculate P&L for a trade
  const getTradePnl = (t: any) => {
    const status = (t.status || '').toLowerCase();
    if (status === 'cancelled' || status === 'failed' || status === 'rejected' || status === 'open') {
      return 0;
    }
    let val = Number(t.pnl || 0);
    if ((t.pnl === null || t.pnl === undefined || val === 0) && t.entryPrice && t.exitPrice && Number(t.quantity) > 0) {
      const isShort = (t.direction || '').toLowerCase() === 'short';
      const entry = Number(t.entryPrice);
      const exit = Number(t.exitPrice);
      const qty = Number(t.quantity);
      val = isShort ? (entry - exit) * qty : (exit - entry) * qty;
    }
    return val;
  };

  // Dynamic P&L History calculation for Chart (Weekly = Last 7 Days, Monthly = 12 Months Jan-Dec, Yearly = 2024-2026)
  const { pnlHistoryData, pnlHistoryLabels } = useMemo(() => {
    const now = new Date();

    if (pnlPeriod === 'Weekly') {
      // Last 7 days including today
      const data = [0, 0, 0, 0, 0, 0, 0];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const labels: string[] = [];

      const dates: Date[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        dates.push(d);
        const dayName = dayNames[d.getDay()];
        const dayNum = String(d.getDate()).padStart(2, '0');
        labels.push(`${dayName} ${dayNum}`);
      }

      trades.forEach(t => {
        const dStr = t.createdAt || t.entryTime;
        if (!dStr) return;
        const d = new Date(dStr);
        const dateYMD = formatDateToLocalYMD(d);
        const idx = dates.findIndex(dt => formatDateToLocalYMD(dt) === dateYMD);
        if (idx !== -1) {
          data[idx] += getTradePnl(t);
        }
      });

      return { pnlHistoryData: data, pnlHistoryLabels: labels };
    }

    if (pnlPeriod === 'Monthly') {
      // 12 Months of current year (Jan, Feb, Mar ... Dec)
      const year = now.getFullYear();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const labels = [...monthNames];
      const data = Array(12).fill(0);

      trades.forEach(t => {
        const dStr = t.createdAt || t.entryTime;
        if (!dStr) return;
        const d = new Date(dStr);
        if (d.getFullYear() === year) {
          const m = d.getMonth();
          if (m >= 0 && m < 12) {
            data[m] += getTradePnl(t);
          }
        }
      });

      return { pnlHistoryData: data, pnlHistoryLabels: labels };
    }

    if (pnlPeriod === 'Yearly') {
      // Years representation e.g. 2024, 2025, 2026
      const years = [2024, 2025, 2026];
      const labels = years.map(String);
      const data = Array(years.length).fill(0);

      trades.forEach(t => {
        const dStr = t.createdAt || t.entryTime;
        if (!dStr) return;
        const d = new Date(dStr);
        const y = d.getFullYear();
        const yIdx = years.indexOf(y);
        if (yIdx !== -1) {
          data[yIdx] += getTradePnl(t);
        }
      });

      return { pnlHistoryData: data, pnlHistoryLabels: labels };
    }

    // Default Fallback
    return {
      pnlHistoryData: stats?.pnlHistoryData || [0, 0],
      pnlHistoryLabels: stats?.pnlHistoryLabels || ['Start', 'Today']
    };
  }, [trades, pnlPeriod, stats]);

  // Filtered P&L calculation for the single right-side P&L Card (Today, Week, Month, Year)
  const cardFilteredPnl = useMemo(() => {
    const now = new Date();

    // Start of Today (00:00:00)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Cutoff date based on filter
    let cutoff = startOfDay;
    if (cardPnlFilter === 'week') {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Past 7 days
    } else if (cardPnlFilter === 'month') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0); // Start of current month
    } else if (cardPnlFilter === 'year') {
      cutoff = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0); // Start of current year
    }

    const filtered = trades.filter(t => {
      const dStr = t.createdAt || t.entryTime;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= cutoff;
    });

    let sumPnl = filtered.reduce((acc, t) => acc + getTradePnl(t), 0);
    let totalCount = filtered.length;
    let winCount = filtered.filter(t => getTradePnl(t) > 0).length;
    let lossCount = filtered.filter(t => getTradePnl(t) < 0).length;

    // Fallback if no trades match filter in local array (e.g. for month/year when trades are fetched via stats API):
    if ((totalCount === 0 || sumPnl === 0) && cardPnlFilter !== 'today' && realizedPnl !== 0) {
      sumPnl = realizedPnl;
      totalCount = stats?.closedTrades || trades.length || 0;
      winCount = stats?.winningStrategies || (sumPnl > 0 ? 1 : 0);
      lossCount = stats?.losingStrategies || (sumPnl < 0 ? 1 : 0);
    }

    return {
      pnlVal: sumPnl,
      totalCount,
      winCount,
      lossCount,
    };
  }, [trades, cardPnlFilter, realizedPnl, stats]);

  const dateRangeStr = `${startDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  // Dynamic Date Range Subtitle for P&L Overview Chart (Weekly, Monthly, Yearly)
  const chartDateRangeStr = useMemo(() => {
    const now = new Date();
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    if (pnlPeriod === 'Weekly') {
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dayIndex = startOfWeek.getDay();
      const diffToMon = startOfWeek.getDate() - dayIndex + (dayIndex === 0 ? -6 : 1);
      startOfWeek.setDate(diffToMon);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${fmt(startOfWeek)} - ${fmt(endOfWeek)}`;
    }
    if (pnlPeriod === 'Monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return `${fmt(startOfMonth)} - ${fmt(endOfMonth)}`;
    }
    if (pnlPeriod === 'Yearly') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      return `${fmt(startOfYear)} - ${fmt(endOfYear)}`;
    }
    return dateRangeStr;
  }, [pnlPeriod, dateRangeStr]);

  // Selected Chart Bar Trade Transactions filter for Popup Window
  const selectedBarTrades = useMemo(() => {
    if (!selectedBarModal) return [];
    const now = new Date();
    const { index } = selectedBarModal;

    if (pnlPeriod === 'Weekly') {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - (6 - index));
      targetDate.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      return trades.filter(t => {
        const dStr = t.createdAt || t.entryTime;
        if (!dStr) return false;
        const d = new Date(dStr);
        return d >= targetDate && d <= endOfDay;
      });
    }

    if (pnlPeriod === 'Monthly') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      let minDay = 1;
      let maxDay = 7;
      if (index === 1) { minDay = 8; maxDay = 14; }
      else if (index === 2) { minDay = 15; maxDay = 21; }
      else if (index === 3) { minDay = 22; maxDay = 28; }
      else if (index === 4) { minDay = 29; maxDay = daysInMonth; }

      return trades.filter(t => {
        const dStr = t.createdAt || t.entryTime;
        if (!dStr) return false;
        const d = new Date(dStr);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const dateNum = d.getDate();
          return dateNum >= minDay && dateNum <= maxDay;
        }
        return false;
      });
    }

    if (pnlPeriod === 'Yearly') {
      const year = now.getFullYear();
      return trades.filter(t => {
        const dStr = t.createdAt || t.entryTime;
        if (!dStr) return false;
        const d = new Date(dStr);
        return d.getFullYear() === year && d.getMonth() === index;
      });
    }

    return trades;
  }, [trades, selectedBarModal, pnlPeriod]);

  // Fetch full trades for selected chart bar period (enables viewing full historical month/year trades)
  useEffect(() => {
    if (!selectedBarModal) {
      setModalTrades([]);
      return;
    }

    const fetchBarTrades = async () => {
      setModalLoading(true);
      const now = new Date();
      const { index } = selectedBarModal;
      let start = startDate;
      let end = endDate;

      if (pnlPeriod === 'Weekly') {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - (6 - index));
        targetDate.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        start = targetDate;
        end = endOfDay;
      } else if (pnlPeriod === 'Monthly') {
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let minDay = 1;
        let maxDay = 7;
        if (index === 1) { minDay = 8; maxDay = 14; }
        else if (index === 2) { minDay = 15; maxDay = 21; }
        else if (index === 3) { minDay = 22; maxDay = 28; }
        else if (index === 4) { minDay = 29; maxDay = daysInMonth; }

        start = new Date(year, month, minDay, 0, 0, 0, 0);
        end = new Date(year, month, maxDay, 23, 59, 59, 999);
      } else if (pnlPeriod === 'Yearly') {
        const year = now.getFullYear();
        start = new Date(year, index, 1, 0, 0, 0, 0);
        end = new Date(year, index + 1, 0, 23, 59, 59, 999);
      }

      try {
        const startStr = formatDateToLocalYMD(start);
        const endStr = formatDateToLocalYMD(end);
        const res = await api.get(`${API_ENDPOINTS.DASHBOARD}?startDate=${startStr}&endDate=${endStr}`);
        if (res.success && res.trades && res.trades.length > 0) {
          setModalTrades(res.trades);
        } else {
          setModalTrades(selectedBarTrades);
        }
      } catch (err) {
        console.error('Error fetching bar trades:', err);
        setModalTrades(selectedBarTrades);
      } finally {
        setModalLoading(false);
      }
    };

    fetchBarTrades();
  }, [selectedBarModal, pnlPeriod]);

  const activeBarTrades = modalTrades.length > 0 ? modalTrades : selectedBarTrades;

  // Filter out 0 P&L trades (showing strictly + or - P&L executed trades)
  const displayBarTrades = useMemo(() => {
    return activeBarTrades.filter(t => Math.abs(getTradePnl(t)) > 0.001);
  }, [activeBarTrades]);

  // Group trade transactions by execution (dualLegGroupId or symbol + date/time + client)
  const groupedBarTrades = useMemo(() => {
    if (displayBarTrades.length === 0) return [];

    const map = new Map<string, any[]>();
    displayBarTrades.forEach((t: any) => {
      const d = new Date(t.createdAt || t.entryTime);
      const timeKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}_${d.getHours()}:${d.getMinutes()}`;
      const groupKey = t.dualLegGroupId || `${t.strategyName || t.symbol || 'Trade'}_${timeKey}_${t.clientName || t.clientCode || 'Client'}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(t);
    });

    return Array.from(map.values());
  }, [displayBarTrades]);

  // Smart display trades logic for Live Strategy table:
  // 1. Prioritize open/active trades currently running
  // 2. Otherwise display trades within the selected date range
  // 3. Fallback to recent platform trades so the table is never empty
  const openTradesList = trades.filter(t => (t.status || '').toLowerCase() === 'open');

  const filteredTrades = trades.filter(t => {
    const dStr = t.createdAt || t.entryTime;
    if (!dStr) return true;
    const tradeDate = new Date(dStr);
    const startLimit = new Date(startDate);
    startLimit.setHours(0, 0, 0, 0);
    const endLimit = new Date(endDate);
    endLimit.setHours(23, 59, 59, 999);
    return tradeDate >= startLimit && tradeDate <= endLimit;
  });

  const displayTrades = openTradesList.length > 0 
    ? openTradesList.slice(0, 5) 
    : filteredTrades.slice(0, 5);


  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1400px', margin: '0 auto', paddingTop: '6px', fontFamily: 'var(--font-body)' }}>
      
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
              <Button variant={isTradingActive ? 'danger' : 'success'} onClick={() => toggleTrading(!isTradingActive)} style={{ fontSize: '13px', padding: '8px 16px', fontWeight: 600 }}>
                {isTradingActive ? 'Stop Trading' : 'Start Auto Trading'}
              </Button>
              <Button variant={isSheetStreaming ? 'danger' : 'success'} onClick={toggleSheetStreaming} disabled={sheetLoading} style={{ fontSize: '13px', padding: '8px 16px', fontWeight: 600 }}>
                {isSheetStreaming ? 'Stop Sheet Sync' : 'Start Sheet Sync'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 5 Top KPI Cards Grid */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '18px' }}>
        <Card hoverable onClick={() => router.push('/admin/clients')} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '3px solid var(--primary)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Clients</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
            {totalClients}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
            <Activity size={12} /> ↑ 12.5%
          </span>
        </Card>

        <Card hoverable onClick={() => router.push('/admin/payments/subscriptions')} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '3px solid var(--accent)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Subscription</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
            {activeSubscriptions}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
            Active subscriptions
          </span>
        </Card>

        <Card hoverable onClick={() => router.push('/admin/strategies')} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '3px solid var(--purple)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Active Strategies</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--purple-light)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
            {activeStrategies}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
            <Activity size={12} /> ↑ 8.3%
          </span>
        </Card>

        <Card hoverable onClick={() => router.push('/admin/clients')} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '3px solid var(--accent)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Live Accounts</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--accent-light)', color: 'var(--accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
            {liveAccounts}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
            <Activity size={12} /> ↑ 10.2%
          </span>
        </Card>

        <Card hoverable onClick={() => router.push('/admin/reports/client')} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '3px solid var(--warning)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total P&L (₹)</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--warning-light)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
              ₹
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: totalPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontFamily: 'var(--font-title)', whiteSpace: 'nowrap' }}>
            {totalPnl >= 0 ? '+₹' : '-₹'}{Math.abs(totalPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
          <span style={{ fontSize: '11px', color: totalPnl >= 0 ? 'var(--accent)' : 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
            <Activity size={12} /> {totalPnl >= 0 ? '↑' : '↓'} Live Net P&L
          </span>
        </Card>
      </div>

      {/* Middle Row: P&L Overview & Strategies Performance */}
      <div className="dashboard-two-col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left: P&L Area Curve Chart */}
        <Card style={{ padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                P&L Overview
              </h4>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                {chartDateRangeStr}
              </span>
            </div>
            <select 
              value={pnlPeriod} 
              onChange={(e) => {
                const val = e.target.value;
                setPnlPeriod(val);
                const n = new Date();
                if (val === 'Weekly') {
                  const startOfWeek = new Date(n.getFullYear(), n.getMonth(), n.getDate());
                  const dayIndex = startOfWeek.getDay();
                  const diffToMon = startOfWeek.getDate() - dayIndex + (dayIndex === 0 ? -6 : 1);
                  startOfWeek.setDate(diffToMon);
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);
                  setStartDate(startOfWeek);
                  setEndDate(endOfWeek);
                } else if (val === 'Monthly') {
                  setStartDate(new Date(n.getFullYear(), n.getMonth(), 1));
                  setEndDate(new Date(n.getFullYear(), n.getMonth() + 1, 0));
                } else if (val === 'Yearly') {
                  setStartDate(new Date(n.getFullYear(), 0, 1));
                  setEndDate(new Date(n.getFullYear(), 11, 31));
                }
              }}
              style={{
                width: '120px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '12px',
                outline: 'none',
                background: 'var(--bg-white)',
                fontWeight: 600,
                color: 'var(--text-heading)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          <PerformanceChart
            data={pnlHistoryData}
            labels={pnlHistoryLabels}
            strokeColor="var(--primary)"
            fillColorStart="rgba(18, 82, 171, 0.12)"
            fillColorEnd="rgba(18, 82, 171, 0)"
            height={280}
            onBarClick={(idx, label) => setSelectedBarModal({ index: idx, label })}
          />
        </Card>

        {/* Right: Strategies Performance Donut Chart */}
        <Card hoverable onClick={() => router.push('/admin/reports/strategy')} style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', marginBottom: '20px' }}>
            Strategies Performance
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', flex: 1, justifyContent: 'center' }}>
            {/* SVG Donut */}
            <div style={{ width: '130px', height: '130px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.915" fill="transparent"></circle>
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
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: '2px' }}>Strategies</span>
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
      <div className="dashboard-two-col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
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
                      <tr key={trade.id} className="clickable-row">
                        <td style={{ padding: '12px 0', fontWeight: 500, color: 'var(--text-body)' }}>{strategyName}</td>
                        <td style={{ padding: '12px 0', fontWeight: 600, color: 'var(--text-heading)' }}>{trade.symbol}</td>
                        <td style={{ padding: '12px 0' }}>
                          <span className={`badge ${isBuy ? 'badge-green' : 'badge-red'}`}>
                            {transactionType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 0', color: 'var(--text-body)' }}>{trade.quantity}</td>
                        <td style={{ padding: '12px 0', color: 'var(--text-body)' }}>{entryPriceVal.toFixed(2)}</td>
                        <td style={{ padding: '12px 0', color: 'var(--text-body)' }}>{exitPriceVal ? exitPriceVal.toFixed(2) : entryPriceVal.toFixed(2)}</td>
                        <td style={{ padding: '12px 0', fontWeight: 600, color: pnl >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                          {pnl >= 0 ? `+${pnl.toFixed(2)}` : pnl.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 0' }}>
                          <span className={`badge ${trade.status.toLowerCase() === 'open' ? 'badge-green' : 'badge-red'}`}>
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

        {/* Right: Single P&L Summary Card with Filter (Today, Week, Month, Year) */}
        <Card style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'flex-start' }}>
          {/* Card Header & Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} />
              </div>
              P&L Summary
            </h4>
            <select
              value={cardPnlFilter}
              onChange={(e) => setCardPnlFilter(e.target.value as any)}
              style={{
                width: 'auto',
                minWidth: '100px',
                fontSize: '12px',
                color: 'var(--text-heading)',
                fontWeight: 600,
                padding: '5px 10px',
                borderRadius: '8px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="today">Today</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>

          {/* Hero P&L Display Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(16, 185, 129, 0.05) 100%)',
            padding: '16px 18px',
            borderRadius: '12px',
            border: '1px solid rgba(37, 99, 235, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {cardPnlFilter.toUpperCase()} REALIZED P&L
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: cardFilteredPnl.pnlVal >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontFamily: 'var(--font-title)', margin: '2px 0 0 0' }}>
              {cardFilteredPnl.pnlVal >= 0 ? '+₹' : '-₹'}{Math.abs(cardFilteredPnl.pnlVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>

            {/* Micro Badge Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              <div style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-body)', fontWeight: 500 }}>
                Trades: <strong style={{ color: 'var(--text-heading)' }}>{cardFilteredPnl.totalCount}</strong>
              </div>
              <div style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>
                Win: {cardFilteredPnl.winCount}
              </div>
              <div style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', fontSize: '11px', color: 'var(--color-danger)', fontWeight: 600 }}>
                Loss: {cardFilteredPnl.lossCount}
              </div>
            </div>
          </div>

          {/* 2x2 Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div 
              onClick={() => router.push('/admin/payments/trades')}
              style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
              className="clickable-subbox"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Exposure</span>
                <Wallet size={13} style={{ color: 'var(--primary)' }} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>
                ₹ {totalExposure.toLocaleString('en-IN')}
              </div>
            </div>

            <div 
              onClick={() => router.push('/admin/reports/client')}
              style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
              className="clickable-subbox"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unrealized P&L</span>
                <TrendingUp size={13} style={{ color: 'var(--purple)' }} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>
                ₹ {unrealizedPnl.toLocaleString('en-IN')}
              </div>
            </div>

            <div 
              onClick={() => router.push('/admin/payments/trades')}
              style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
              className="clickable-subbox"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Realized P&L</span>
                <Clock size={13} style={{ color: 'var(--accent)' }} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: realizedPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                ₹ {realizedPnl.toLocaleString('en-IN')}
              </div>
            </div>

            <div 
              onClick={() => router.push('/admin/payments/trades')}
              style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
              className="clickable-subbox"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open Positions</span>
                <Layers size={13} style={{ color: 'var(--warning)' }} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>
                {openPositionsCount}
              </div>
            </div>
          </div>

          {/* Win Accuracy Bar */}
          <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Period Win Accuracy</span>
              <strong style={{ color: cardFilteredPnl.totalCount > 0 ? 'var(--accent, #10b981)' : 'var(--text-muted)' }}>
                {cardFilteredPnl.totalCount > 0 
                  ? `${((cardFilteredPnl.winCount / cardFilteredPnl.totalCount) * 100).toFixed(1)}%`
                  : '0.0%'}
              </strong>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${cardFilteredPnl.totalCount > 0 ? Math.min(100, Math.max(0, (cardFilteredPnl.winCount / cardFilteredPnl.totalCount) * 100)) : 0}%`,
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                borderRadius: '4px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
            <button
              onClick={() => router.push('/admin/reports/client')}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-heading)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <FileText size={13} style={{ color: 'var(--primary)' }} />
              Client Report
            </button>

            <button
              onClick={() => router.push('/admin/payments/trades')}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-heading)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Activity size={13} style={{ color: 'var(--accent)' }} />
              Trade Txns
            </button>
          </div>
        </Card>
      </div>
    </div>
      {/* Modal Popup Window for Chart Bar Trade Transactions */}
      {selectedBarModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setSelectedBarModal(null)}
        >
          <div 
            style={{
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '85vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(16,185,129,0.04))',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} color="var(--primary)" />
                  Trade Transactions — {selectedBarModal.label}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Showing {displayBarTrades.length} executed trades during this period
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* View Mode Toggle Switch */}
                <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.06)', padding: '3px', borderRadius: '8px', gap: '2px' }}>
                  <button
                    onClick={() => setModalViewMode('list')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: modalViewMode === 'list' ? 'var(--surface)' : 'transparent',
                      color: modalViewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
                      boxShadow: modalViewMode === 'list' ? 'var(--shadow-sm)' : 'none'
                    }}
                  >
                    📋 All Trades List
                  </button>
                  <button
                    onClick={() => setModalViewMode('grouped')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: modalViewMode === 'grouped' ? 'var(--surface)' : 'transparent',
                      color: modalViewMode === 'grouped' ? 'var(--primary)' : 'var(--text-muted)',
                      boxShadow: modalViewMode === 'grouped' ? 'var(--shadow-sm)' : 'none'
                    }}
                  >
                    🧩 Grouped Executions
                  </button>
                </div>

                <button
                  onClick={() => setSelectedBarModal(null)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '16px',
                    fontWeight: 700
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, minHeight: '300px' }}>
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'var(--primary)' }} />
                  <p style={{ fontSize: '13px', fontWeight: 600 }}>Loading trade transactions for {selectedBarModal.label}...</p>
                </div>
              ) : displayBarTrades.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500 }}>No executed P&L trade transactions recorded for {selectedBarModal.label}.</p>
                </div>
              ) : modalViewMode === 'list' ? (
                /* Uncompressed All Trades List Table */
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)' }}>
                      <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Client</th>
                      <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Strategy / Symbol</th>
                      <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Direction</th>
                      <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Qty</th>
                      <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Entry</th>
                      <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Exit</th>
                      <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>P&L (₹)</th>
                      <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayBarTrades.map((t: any, idx: number) => {
                      const pnlVal = getTradePnl(t);
                      const isPos = pnlVal >= 0;
                      const clientDisplayName = t.clientName || t.client?.user?.name || t.client?.name || t.clientCode || (t.clientId ? `Client #${t.clientId.slice(-4)}` : 'Client Account');
                      const isShort = (t.direction || 'LONG').toUpperCase() === 'SHORT';

                      return (
                        <tr key={t.id || idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                            {clientDisplayName}
                            {t.clientCode && (
                              <span style={{ display: 'block', fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>
                                {t.clientCode}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                            {t.strategyName || t.symbol || 'NIFTY Option'}
                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>
                              ⏰ {new Date(t.createdAt || t.entryTime).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}, {new Date(t.createdAt || t.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: isShort ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                              color: isShort ? '#ef4444' : '#10b981'
                            }}>
                              {isShort ? 'SELL / SHORT' : 'BUY / LONG'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>{t.quantity || 1}</td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>₹{Number(t.entryPrice || 0).toFixed(2)}</td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>₹{Number(t.exitPrice || 0).toFixed(2)}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: isPos ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>
                            {isPos ? `+₹${pnlVal.toFixed(2)}` : `-₹${Math.abs(pnlVal).toFixed(2)}`}
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: isPos ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: isPos ? '#10b981' : '#ef4444'
                            }}>
                              {isPos ? 'PROFIT' : 'LOSS'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                /* Grouped Trades View */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {groupedBarTrades.map((group: any[], gIdx: number) => {
                    const firstTrade = group[0];
                    const groupPnl = group.reduce((acc, t) => acc + getTradePnl(t), 0);
                    const isGroupPos = groupPnl >= 0;
                    const clientDisplayName = firstTrade.clientName || firstTrade.client?.user?.name || firstTrade.client?.name || firstTrade.clientCode || (firstTrade.clientId ? `Client #${firstTrade.clientId.slice(-4)}` : 'Client Account');
                    const tDate = new Date(firstTrade.createdAt || firstTrade.entryTime);
                    const dateTimeStr = `${tDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}, ${tDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                    return (
                      <div 
                        key={gIdx} 
                        style={{
                          borderRadius: '12px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--surface)',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }}
                      >
                        {/* Group Header */}
                        <div style={{
                          padding: '12px 16px',
                          backgroundColor: 'var(--bg-subtle, #f8fafc)',
                          borderBottom: '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-heading)' }}>
                              {firstTrade.strategyName || firstTrade.symbol || 'NIFTY Strategy'}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Client: <strong style={{ color: 'var(--text-heading)' }}>{clientDisplayName}</strong>
                            </span>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)', fontWeight: 600 }}>
                              ⏰ {dateTimeStr}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Execution Net P&L:</span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 800,
                              padding: '3px 10px',
                              borderRadius: '6px',
                              backgroundColor: isGroupPos ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: isGroupPos ? '#10b981' : '#ef4444',
                              whiteSpace: 'nowrap'
                            }}>
                              {isGroupPos ? `+₹${groupPnl.toFixed(2)}` : `-₹${Math.abs(groupPnl).toFixed(2)}`}
                            </span>
                          </div>
                        </div>

                        {/* Legs Table inside Group */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', backgroundColor: 'rgba(0,0,0,0.01)' }}>
                              <th style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>Leg / Direction</th>
                              <th style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>Qty</th>
                              <th style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>Entry Price</th>
                              <th style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>Exit Price</th>
                              <th style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>Leg P&L</th>
                              <th style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.map((t: any, tIdx: number) => {
                              const pnlVal = getTradePnl(t);
                              const isLegPos = pnlVal >= 0;
                              const isShort = (t.direction || 'LONG').toUpperCase() === 'SHORT';
                              return (
                                <tr key={t.id || tIdx} style={{ borderBottom: tIdx === group.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                  <td style={{ padding: '10px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    <span style={{
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      backgroundColor: isShort ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                      color: isShort ? '#ef4444' : '#10b981',
                                      marginRight: '8px'
                                    }}>
                                      {isShort ? 'SELL / SHORT' : 'BUY / LONG'}
                                    </span>
                                    {t.legName && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({t.legName})</span>}
                                  </td>
                                  <td style={{ padding: '10px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>{t.quantity || 1}</td>
                                  <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>₹{Number(t.entryPrice || 0).toFixed(2)}</td>
                                  <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>₹{Number(t.exitPrice || 0).toFixed(2)}</td>
                                  <td style={{ padding: '10px 16px', fontWeight: 700, color: isLegPos ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>
                                    {isLegPos ? `+₹${pnlVal.toFixed(2)}` : `-₹${Math.abs(pnlVal).toFixed(2)}`}
                                  </td>
                                  <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '10px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      backgroundColor: isLegPos ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                      color: isLegPos ? '#10b981' : '#ef4444'
                                    }}>
                                      {isLegPos ? 'PROFIT' : 'LOSS'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-subtle, #f8fafc)'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>
                Total P&L: {' '}
                <span style={{ color: displayBarTrades.reduce((acc, t) => acc + getTradePnl(t), 0) >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                  ₹{displayBarTrades.reduce((acc, t) => acc + getTradePnl(t), 0).toFixed(2)}
                </span>
              </span>

              <button
                onClick={() => {
                  setSelectedBarModal(null);
                  router.push('/admin/payments/trades');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                View All Trade Txns <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

    <style>{`
      @media (max-width: 1024px) {
        .kpi-grid { grid-template-columns: repeat(3, 1fr) !important; }
        .dashboard-two-col { grid-template-columns: 1fr !important; }
      }
      @media (max-width: 768px) {
        .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .exposure-grid { grid-template-columns: repeat(2, 1fr) !important; }
      }
      @media (max-width: 480px) {
        .kpi-grid { grid-template-columns: 1fr !important; }
        .exposure-grid { grid-template-columns: 1fr !important; }
      }
    `}</style>
    </>
  );
}


