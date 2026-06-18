'use client';

import React, { useState, useEffect } from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { Button } from '../../../views/components/Button';
import { PerformanceChart } from '../../../views/components/PerformanceChart';
import {
  Play,
  TrendingUp,
  Filter,
  Eye,
  Edit3,
  Copy,
  Trash2,
  Plus,
  ArrowLeft,
  Settings,
  ShieldAlert,
  Users,
  Terminal,
  Activity,
  CheckCircle,
  FileCode,
  AlertCircle,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { Modal } from '../../../views/components/Modal';

interface StrategyCondition {
  logical: 'AND' | 'OR';
  indicator: string;
  operator: string;
  value: string;
}

interface StrategyConfig {
  basicInfo: {
    name: string;
    description: string;
    tradeType: 'Intraday' | 'Swing' | 'Positional';
    exchange: 'NSE' | 'BSE';
    segment: 'Cash' | 'Equity' | 'Futures' | 'Options' | 'NSE F&O' | 'Nifty 50' | 'Bank Nifty';
    timeframe: string;
    entryTime: string;
    exitTime: string;
    maxTradesPerDay: number;
    status: 'active' | 'inactive';
  };
  tradeAction: {
    action: 'Buy' | 'Sell' | 'Long' | 'Short';
    orderType: 'Market' | 'Limit' | 'SL-Limit' | 'SL-Market';
    bufferPercent: number;
    marketProtection?: number;
  };
  stoploss: {
    type: 'Fixed %' | 'Fixed Points' | 'Trailing SL' | 'Risk %';
    orderType: 'Market' | 'Limit';
    fixedPercent: number;
    fixedPoints: number;
    trailingSL: number;
    riskPercent: number;
  };
  target: {
    type: 'Profit %' | 'Risk Reward Ratio' | 'Partial Exit' | 'Trailing Target';
    profitPercent: number;
    riskRewardRatio: number;
    partialExit: number;
    trailingTarget: number;
  };
  riskManagement: {
    capitalAllocation: number;
    riskPerTrade: number;
    maxDailyLoss: number;
    maxDailyProfit: number;
    maxOpenPositions: number;
    killSwitch: boolean;
  };
  conditions: StrategyCondition[];
}

const INDICATORS = [
  'RSI', 'EMA', 'SMA', 'VWAP', 'MACD', 'SuperTrend', 'ADX', 'Volume', 'Open Interest',
  'Previous High', 'Previous Low', 'Previous Close', 'Gap Up', 'Gap Down',
  'Pre Open Price', 'Pre Open Volume', 'Pre Open Change %', 'ATR', 'Bollinger Bands',
  'Price Action', 'Candle Pattern'
];

const INITIAL_CONFIG: StrategyConfig = {
  basicInfo: {
    name: '',
    description: '',
    tradeType: 'Intraday',
    exchange: 'NSE',
    segment: 'NSE F&O',
    timeframe: '5m',
    entryTime: '09:15',
    exitTime: '15:15',
    maxTradesPerDay: 3,
    status: 'inactive'
  },
  tradeAction: {
    action: 'Long',
    orderType: 'Market',
    bufferPercent: 0.0,
    marketProtection: -1
  },
  stoploss: {
    type: 'Fixed %',
    orderType: 'Market',
    fixedPercent: 1.0,
    fixedPoints: 10,
    trailingSL: 0.2,
    riskPercent: 1.0
  },
  target: {
    type: 'Profit %',
    profitPercent: 2.0,
    riskRewardRatio: 2.0,
    partialExit: 100,
    trailingTarget: 0.5
  },
  riskManagement: {
    capitalAllocation: 10.0,
    riskPerTrade: 1.0,
    maxDailyLoss: 5000,
    maxDailyProfit: 15000,
    maxOpenPositions: 3,
    killSwitch: false
  },
  conditions: []
};

const YEARS = [2024, 2025, 2026, 2027, 2028];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface SparklineProps {
  data: number[];
  stroke?: string;
  width?: number;
  height?: number;
}

function Sparkline({ data, stroke = '#7c3aed', width = 120, height = 30 }: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height} style={{ overflow: 'visible', opacity: 0.15 }}>
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={stroke} strokeWidth="1.5" strokeDasharray="3,3" />
      </svg>
    );
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;
  
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

export default function StrategiesPage() {
  const { colors, trades } = useAppViewModel();

  // Mode state: 'list' | 'create' | 'edit' | 'detail'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [strategies, setStrategies] = useState<any[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<any | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Filter Date Range State
  const [filterStartDate, setFilterStartDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [filterEndDate, setFilterEndDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterTypeTab, setFilterTypeTab] = useState<'month' | 'year' | 'custom'>('month');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [customStart, setCustomStart] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
  });

  const dropdownRef = React.useRef<HTMLDivElement>(null);

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

  const applyMonthFilter = () => {
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    setFilterStartDate(start);
    setFilterEndDate(end);
    setIsFilterOpen(false);
  };

  const applyYearFilter = () => {
    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 12, 0, 23, 59, 59, 999);
    setFilterStartDate(start);
    setFilterEndDate(end);
    setIsFilterOpen(false);
  };

  const applyCustomFilter = () => {
    if (customStart && customEnd) {
      setFilterStartDate(new Date(customStart + 'T00:00:00'));
      setFilterEndDate(new Date(customEnd + 'T23:59:59.999'));
      setIsFilterOpen(false);
    }
  };

  const clearFilters = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    setFilterStartDate(start);
    setFilterEndDate(end);
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
    setFilterTypeTab('month');
    setIsFilterOpen(false);
  };

  // Formatted date string for UI
  const dateRangeStr = `${filterStartDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} - ${filterEndDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  // Filter trades matching selectedStrategy.id and within filter date range
  const strategyTrades = React.useMemo(() => {
    if (!selectedStrategy) return [];
    return (trades || []).filter(t => {
      if (t.strategyId !== selectedStrategy.id) return false;
      const tradeTime = t.exitTime ? new Date(t.exitTime) : t.entryTime ? new Date(t.entryTime) : t.createdAt ? new Date(t.createdAt) : null;
      if (!tradeTime) return false;
      return tradeTime >= filterStartDate && tradeTime <= filterEndDate;
    });
  }, [trades, selectedStrategy, filterStartDate, filterEndDate]);

  const closedTrades = React.useMemo(() => {
    return strategyTrades.filter(t => t.pnl !== null && t.pnl !== undefined);
  }, [strategyTrades]);

  const selectedStrategyPnl = React.useMemo(() => {
    return closedTrades.reduce((acc, t) => acc + Number(t.pnl || 0), 0);
  }, [closedTrades]);

  const selectedStrategyTradesCount = closedTrades.length;

  const selectedStrategyWins = React.useMemo(() => {
    return closedTrades.filter(t => Number(t.pnl || 0) > 0).length;
  }, [closedTrades]);

  const selectedStrategyLosses = React.useMemo(() => {
    return closedTrades.filter(t => Number(t.pnl || 0) < 0).length;
  }, [closedTrades]);

  const selectedStrategyBreakevens = React.useMemo(() => {
    return closedTrades.filter(t => Number(t.pnl || 0) === 0).length;
  }, [closedTrades]);

  const selectedStrategyWinRate = React.useMemo(() => {
    if (selectedStrategyTradesCount === 0) return 0;
    return (selectedStrategyWins / selectedStrategyTradesCount) * 100;
  }, [selectedStrategyWins, selectedStrategyTradesCount]);

  const selectedStrategyLossRate = React.useMemo(() => {
    if (selectedStrategyTradesCount === 0) return 0;
    return (selectedStrategyLosses / selectedStrategyTradesCount) * 100;
  }, [selectedStrategyLosses, selectedStrategyTradesCount]);

  const selectedStrategyDrawRate = React.useMemo(() => {
    if (selectedStrategyTradesCount === 0) return 0;
    return (selectedStrategyBreakevens / selectedStrategyTradesCount) * 100;
  }, [selectedStrategyBreakevens, selectedStrategyTradesCount]);

  const selectedStrategyWinsSum = React.useMemo(() => {
    return closedTrades.filter(t => Number(t.pnl || 0) > 0).reduce((acc, t) => acc + Number(t.pnl || 0), 0);
  }, [closedTrades]);

  const selectedStrategyLossesSum = React.useMemo(() => {
    return closedTrades.filter(t => Number(t.pnl || 0) < 0).reduce((acc, t) => acc + Number(t.pnl || 0), 0);
  }, [closedTrades]);

  const selectedStrategyProfitFactor = React.useMemo(() => {
    const absLosses = Math.abs(selectedStrategyLossesSum);
    if (absLosses === 0) return selectedStrategyWinsSum > 0 ? 99.99 : 1.0;
    return selectedStrategyWinsSum / absLosses;
  }, [selectedStrategyWinsSum, selectedStrategyLossesSum]);

  const selectedStrategyBest = React.useMemo(() => {
    if (closedTrades.length === 0) return 0;
    return Math.max(...closedTrades.map(t => Number(t.pnl || 0)));
  }, [closedTrades]);

  const selectedStrategyWorst = React.useMemo(() => {
    if (closedTrades.length === 0) return 0;
    return Math.min(...closedTrades.map(t => Number(t.pnl || 0)));
  }, [closedTrades]);

  const selectedStrategyAvgProfit = React.useMemo(() => {
    const wins = closedTrades.filter(t => Number(t.pnl || 0) > 0);
    if (wins.length === 0) return 0;
    return wins.reduce((acc, t) => acc + Number(t.pnl || 0), 0) / wins.length;
  }, [closedTrades]);

  const selectedStrategyAvgLoss = React.useMemo(() => {
    const losses = closedTrades.filter(t => Number(t.pnl || 0) < 0);
    if (losses.length === 0) return 0;
    return losses.reduce((acc, t) => acc + Number(t.pnl || 0), 0) / losses.length;
  }, [closedTrades]);

  const selectedStrategyExpectancy = React.useMemo(() => {
    if (selectedStrategyTradesCount === 0) return 0;
    return selectedStrategyPnl / selectedStrategyTradesCount;
  }, [selectedStrategyPnl, selectedStrategyTradesCount]);

  const selectedStrategyDrawdown = React.useMemo(() => {
    let peak = 0;
    let maxDd = 0;
    let runningPnl = 0;
    const sortedTrades = [...closedTrades].sort((a, b) => {
      const timeA = a.exitTime ? new Date(a.exitTime).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.exitTime ? new Date(b.exitTime).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });

    for (const t of sortedTrades) {
      runningPnl += Number(t.pnl || 0);
      if (runningPnl > peak) {
        peak = runningPnl;
      }
      const dd = peak - runningPnl;
      if (dd > maxDd) {
        maxDd = dd;
      }
    }
    return maxDd;
  }, [closedTrades]);

  const { selectedStrategyPnlCurve, selectedStrategyPnlLabels } = React.useMemo(() => {
    const sortedTrades = [...closedTrades].sort((a, b) => {
      const timeA = a.exitTime ? new Date(a.exitTime).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.exitTime ? new Date(b.exitTime).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });

    if (sortedTrades.length === 0) {
      return {
        selectedStrategyPnlCurve: [0, 0, 0, 0, 0],
        selectedStrategyPnlLabels: ['Start', 'P1', 'P2', 'P3', 'End']
      };
    }

    const curve = [0];
    const labels = ['Start'];
    let running = 0;
    sortedTrades.forEach((t, index) => {
      running += Number(t.pnl || 0);
      curve.push(running);
      
      const tTime = t.exitTime ? new Date(t.exitTime) : t.createdAt ? new Date(t.createdAt) : null;
      if (tTime) {
        labels.push(tTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
      } else {
        labels.push(`Trade ${index + 1}`);
      }
    });

    return {
      selectedStrategyPnlCurve: curve,
      selectedStrategyPnlLabels: labels
    };
  }, [closedTrades]);

  // Sparkline curves
  const winRateCurve = React.useMemo(() => {
    if (closedTrades.length === 0) return [];
    let wins = 0;
    return closedTrades.map((t, idx) => {
      if (Number(t.pnl || 0) > 0) wins++;
      return (wins / (idx + 1)) * 100;
    });
  }, [closedTrades]);

  const profitFactorCurve = React.useMemo(() => {
    if (closedTrades.length === 0) return [];
    let winsSum = 0;
    let lossesSum = 0;
    return closedTrades.map(t => {
      const p = Number(t.pnl || 0);
      if (p > 0) winsSum += p;
      else if (p < 0) lossesSum += p;
      const absLoss = Math.abs(lossesSum);
      return absLoss === 0 ? (winsSum > 0 ? 10 : 1) : winsSum / absLoss;
    });
  }, [closedTrades]);

  const drawdownCurve = React.useMemo(() => {
    if (closedTrades.length === 0) return [];
    let peak = 0;
    let running = 0;
    return closedTrades.map(t => {
      running += Number(t.pnl || 0);
      if (running > peak) peak = running;
      return peak - running;
    });
  }, [closedTrades]);

  const tradesCountCurve = React.useMemo(() => {
    if (closedTrades.length === 0) return [];
    return closedTrades.map((_, idx) => idx + 1);
  }, [closedTrades]);

  // Base Comparison calculations for Last 30 Days and Last 90 Days
  const last30DaysTrades = React.useMemo(() => {
    if (!selectedStrategy) return [];
    const now = new Date();
    const limit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return (trades || []).filter(t => {
      if (t.strategyId !== selectedStrategy.id) return false;
      const tradeTime = t.exitTime ? new Date(t.exitTime) : t.entryTime ? new Date(t.entryTime) : t.createdAt ? new Date(t.createdAt) : null;
      if (!tradeTime) return false;
      return tradeTime >= limit;
    }).filter(t => t.pnl !== null && t.pnl !== undefined);
  }, [trades, selectedStrategy]);

  const last90DaysTrades = React.useMemo(() => {
    if (!selectedStrategy) return [];
    const now = new Date();
    const limit = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return (trades || []).filter(t => {
      if (t.strategyId !== selectedStrategy.id) return false;
      const tradeTime = t.exitTime ? new Date(t.exitTime) : t.entryTime ? new Date(t.entryTime) : t.createdAt ? new Date(t.createdAt) : null;
      if (!tradeTime) return false;
      return tradeTime >= limit;
    }).filter(t => t.pnl !== null && t.pnl !== undefined);
  }, [trades, selectedStrategy]);

  const last30dPnL = React.useMemo(() => last30DaysTrades.reduce((acc, t) => acc + Number(t.pnl || 0), 0), [last30DaysTrades]);
  const last30dTradesCount = last30DaysTrades.length;
  const last30dWinRate = React.useMemo(() => {
    const wins = last30DaysTrades.filter(t => Number(t.pnl || 0) > 0).length;
    return last30dTradesCount === 0 ? 0 : (wins / last30dTradesCount) * 100;
  }, [last30DaysTrades, last30dTradesCount]);
  const last30dLossesSum = React.useMemo(() => {
    return last30DaysTrades.filter(t => Number(t.pnl || 0) < 0).reduce((acc, t) => acc + Number(t.pnl || 0), 0);
  }, [last30DaysTrades]);

  const last30dProfitFactor = React.useMemo(() => {
    const winsSum = last30DaysTrades.filter(t => Number(t.pnl || 0) > 0).reduce((acc, t) => acc + Number(t.pnl || 0), 0);
    return last30dLossesSum === 0 ? (winsSum > 0 ? 99.99 : 1.0) : winsSum / Math.abs(last30dLossesSum);
  }, [last30DaysTrades, last30dLossesSum]);

  const last30dDrawdown = React.useMemo(() => {
    let peak = 0;
    let maxDd = 0;
    let running = 0;
    const sorted = [...last30DaysTrades].sort((a, b) => {
      const timeA = a.exitTime ? new Date(a.exitTime).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.exitTime ? new Date(b.exitTime).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });
    for (const t of sorted) {
      running += Number(t.pnl || 0);
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDd) maxDd = dd;
    }
    return maxDd;
  }, [last30DaysTrades]);

  const last90dPnL = React.useMemo(() => last90DaysTrades.reduce((acc, t) => acc + Number(t.pnl || 0), 0), [last90DaysTrades]);
  const last90dTradesCount = last90DaysTrades.length;
  const last90dWinRate = React.useMemo(() => {
    const wins = last90DaysTrades.filter(t => Number(t.pnl || 0) > 0).length;
    return last90dTradesCount === 0 ? 0 : (wins / last90dTradesCount) * 100;
  }, [last90DaysTrades, last90dTradesCount]);

  const last90dLossesSum = React.useMemo(() => {
    return last90DaysTrades.filter(t => Number(t.pnl || 0) < 0).reduce((acc, t) => acc + Number(t.pnl || 0), 0);
  }, [last90DaysTrades]);

  const last90dProfitFactor = React.useMemo(() => {
    const winsSum = last90DaysTrades.filter(t => Number(t.pnl || 0) > 0).reduce((acc, t) => acc + Number(t.pnl || 0), 0);
    return last90dLossesSum === 0 ? (winsSum > 0 ? 99.99 : 1.0) : winsSum / Math.abs(last90dLossesSum);
  }, [last90DaysTrades, last90dLossesSum]);

  const last90dDrawdown = React.useMemo(() => {
    let peak = 0;
    let maxDd = 0;
    let running = 0;
    const sorted = [...last90DaysTrades].sort((a, b) => {
      const timeA = a.exitTime ? new Date(a.exitTime).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.exitTime ? new Date(b.exitTime).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });
    for (const t of sorted) {
      running += Number(t.pnl || 0);
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDd) maxDd = dd;
    }
    return maxDd;
  }, [last90DaysTrades]);

  const getPctChange = (current: number, base: number) => {
    if (base === 0) return current > 0 ? '↑ 100%' : current < 0 ? '↓ 100%' : '0%';
    const pct = ((current - base) / Math.abs(base)) * 100;
    return `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}%`;
  };

  // Grouped charts calculations
  const pnlByDayOfWeek = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const pnlMap: Record<string, number> = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0 };
    
    closedTrades.forEach(t => {
      const date = t.exitTime ? new Date(t.exitTime) : t.createdAt ? new Date(t.createdAt) : null;
      if (date) {
        const dayName = days[date.getDay()];
        if (dayName in pnlMap) {
          pnlMap[dayName] += Number(t.pnl || 0);
        }
      }
    });

    const items = Object.entries(pnlMap).map(([label, val]) => ({ label, val }));
    const maxVal = Math.max(...items.map(item => Math.abs(item.val)), 1);

    return items.map(item => {
      const absVal = Math.abs(item.val);
      const isPositive = item.val >= 0;
      const pct = (absVal / maxVal) * 100;
      return {
        label: item.label,
        val: item.val >= 0 ? `₹${(item.val / 1000).toFixed(1)}k` : `-₹${(Math.abs(item.val) / 1000).toFixed(1)}k`,
        height: `${Math.max(pct, 5)}%`,
        color: isPositive ? '#0052cc' : '#ef4444'
      };
    });
  }, [closedTrades]);

  const pnlByMonth = React.useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const pnlMap: Record<string, number> = {};
    monthNames.forEach(m => { pnlMap[m] = 0; });

    closedTrades.forEach(t => {
      const date = t.exitTime ? new Date(t.exitTime) : t.createdAt ? new Date(t.createdAt) : null;
      if (date) {
        const mName = monthNames[date.getMonth()];
        pnlMap[mName] += Number(t.pnl || 0);
      }
    });

    const items = monthNames.map(label => ({ label, val: pnlMap[label] }));
    const maxVal = Math.max(...items.map(item => Math.abs(item.val)), 1);

    return items.map(item => {
      const absVal = Math.abs(item.val);
      const isPositive = item.val >= 0;
      const pct = (absVal / maxVal) * 100;
      return {
        label: item.label,
        val: item.val >= 0 ? `₹${(item.val / 1000).toFixed(1)}k` : `-₹${(Math.abs(item.val) / 1000).toFixed(1)}k`,
        height: `${Math.max(pct, 5)}%`,
        color: isPositive ? '#0052cc' : '#ef4444'
      };
    });
  }, [closedTrades]);



  // Custom delete state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [strategyToDelete, setStrategyToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<StrategyConfig>(INITIAL_CONFIG);
  const [formErrors, setFormErrors] = useState<string>('');

  // Active sub-tab in Detail view
  const [detailTab, setDetailTab] = useState<'overview' | 'assignment' | 'logs'>('overview');

  // Load Strategies, Templates, Clients
  const loadData = async () => {
    setIsLoading(true);
    try {
      const resStrat = await fetch('/api/admin/strategies');
      const dataStrat = await resStrat.json();
      if (dataStrat.success) setStrategies(dataStrat.strategies || []);

      const resTmpl = await fetch('/api/admin/strategies/templates');
      const dataTmpl = await resTmpl.json();
      if (dataTmpl.success) setTemplates(dataTmpl.templates || []);

      const resClients = await fetch('/api/admin/strategies/assignments');
      const dataClients = await resClients.json();
      if (dataClients.success) setClients(dataClients.clients || []);
    } catch (e) {
      console.error('Error loading strategies data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch logs when strategy is selected or log tab is active
  useEffect(() => {
    if (selectedStrategy && detailTab === 'logs') {
      fetch(`/api/admin/strategies/logs?strategyId=${selectedStrategy.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setLogs(data.logs || []);
        });
    }
  }, [selectedStrategy, detailTab]);

  const handleCreateNew = () => {
    setFormData(INITIAL_CONFIG);
    setViewMode('create');
  };

  const handleEdit = (strategy: any) => {
    try {
      const config = JSON.parse(strategy.configJson);
      setFormData(config);
    } catch (e) {
      setFormData({
        ...INITIAL_CONFIG,
        basicInfo: {
          ...INITIAL_CONFIG.basicInfo,
          name: strategy.name,
          description: strategy.description || '',
          status: strategy.status
        }
      });
    }
    setSelectedStrategy(strategy);
    setViewMode('edit');
  };

  const handleClone = async (strategyId: string) => {
    try {
      const res = await fetch(`/api/admin/strategies/${strategyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clone' })
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (strategy: any) => {
    const newStatus = strategy.status === 'active' ? 'inactive' : 'active';
    try {
      // Modify config if exists to update status inside config as well
      let parsedConfig = INITIAL_CONFIG;
      try {
        parsedConfig = JSON.parse(strategy.configJson);
      } catch (e) {}
      parsedConfig.basicInfo.status = newStatus;

      const res = await fetch(`/api/admin/strategies/${strategy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...strategy,
          status: newStatus,
          configJson: JSON.stringify(parsedConfig)
        })
      });
      const data = await res.json();
      if (data.success) {
        loadData();
        if (selectedStrategy && selectedStrategy.id === strategy.id) {
          setSelectedStrategy({ ...selectedStrategy, status: newStatus });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (strategy: any) => {
    setStrategyToDelete(strategy);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!strategyToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/strategies/${strategyToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleteModalOpen(false);
        setStrategyToDelete(null);
        setViewMode('list');
        setSelectedStrategy(null);
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLoadTemplate = (template: any) => {
    try {
      const config = JSON.parse(template.configJson);
      setFormData(config);
      setViewMode('create');
    } catch (e) {
      console.error('Error loading template config:', e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.basicInfo.name.trim()) {
      setFormErrors('Strategy Name is required.');
      return;
    }

    const payload = {
      name: formData.basicInfo.name,
      description: formData.basicInfo.description,
      status: formData.basicInfo.status || 'inactive',
      configJson: JSON.stringify(formData)
    };

    const url = viewMode === 'edit' ? `/api/admin/strategies/${selectedStrategy.id}` : '/api/admin/strategies';
    const method = viewMode === 'edit' ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setViewMode('list');
        loadData();
      } else {
        setFormErrors(data.error || 'Failed to save strategy.');
      }
    } catch (err) {
      setFormErrors('Network error. Failed to save.');
    }
  };

  const handleConditionChange = (index: number, field: keyof StrategyCondition, value: string) => {
    const updated = [...formData.conditions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, conditions: updated });
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { logical: 'AND', indicator: 'RSI', operator: '>', value: '' }]
    });
  };

  const removeCondition = (index: number) => {
    const updated = formData.conditions.filter((_, i) => i !== index);
    setFormData({ ...formData, conditions: updated });
  };

  // Assign client logic
  const handleAssignStrategy = async (clientId: string, remove = false) => {
    if (!selectedStrategy) return;
    try {
      const res = await fetch('/api/admin/strategies/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: selectedStrategy.id,
          clientIds: [clientId],
          action: remove ? 'remove' : 'assign'
        })
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk assignment logic
  const handleBulkAssign = async (remove = false) => {
    if (!selectedStrategy || selectedClientIds.length === 0) return;
    try {
      const res = await fetch('/api/admin/strategies/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: selectedStrategy.id,
          clientIds: selectedClientIds,
          action: remove ? 'remove' : 'assign'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedClientIds([]);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleClientSelection = (clientId: string) => {
    if (selectedClientIds.includes(clientId)) {
      setSelectedClientIds(selectedClientIds.filter(id => id !== clientId));
    } else {
      setSelectedClientIds([...selectedClientIds, clientId]);
    }
  };

  const toggleSelectAllClients = () => {
    if (selectedClientIds.length === clients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(clients.map(c => c.id));
    }
  };

  // Chart configuration
  const performanceLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Today'];
  const performanceData = [12000, 24000, -5000, 18000, 31000, 42000];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {viewMode !== 'list' && (
            <button
              onClick={() => setViewMode('list')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', marginBottom: '6px', padding: 0 }}
            >
              <ArrowLeft size={14} /> Strategies
            </button>
          )}
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {viewMode === 'list' && 'Strategies'}
            {viewMode === 'create' && 'Create Algo Strategy'}
            {viewMode === 'edit' && `Edit Strategy`}
            {viewMode === 'detail' && (
              <>
                {selectedStrategy?.name}
                <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  fontSize: '11px', 
                  fontWeight: 600,
                  backgroundColor: selectedStrategy?.status === 'active' ? '#e6f7f4' : '#fee2e2',
                  color: selectedStrategy?.status === 'active' ? '#00a389' : '#ef4444'
                }}>
                  {selectedStrategy?.status.toUpperCase()}
                </span>
              </>
            )}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {viewMode === 'list' && 'Deploy, configure, and monitor advanced algorithmic strategies.'}
            {viewMode === 'create' && 'Build a new strategy block with custom entry, target, and trailing rules.'}
            {viewMode === 'edit' && `Editing: ${selectedStrategy?.name}`}
            {viewMode === 'detail' && (selectedStrategy?.description || 'Overview of settings, performance history, and client deployment.')}
          </p>
        </div>

        {viewMode === 'list' && (
          <Button onClick={handleCreateNew} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Create Strategy
          </Button>
        )}
      </div>

      {/* VIEW: STRATEGY LIST */}
      {viewMode === 'list' && (
        <>
          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <Card style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Total Strategies</p>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)' }}>
                  <TrendingUp size={16} color="#38bdf8" />
                </div>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-title)', color: '#fff' }}>
                {strategies.length}
              </h3>
            </Card>
            <Card style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Active Strategies</p>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)' }}>
                  <CheckCircle size={16} color="#22c55e" />
                </div>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-title)', color: '#22c55e' }}>
                {strategies.filter(s => s.status === 'active').length}
              </h3>
            </Card>
            <Card style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Assigned Clients</p>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.1)' }}>
                  <Users size={16} color="#eab308" />
                </div>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-title)', color: '#eab308' }}>
                {clients.filter(c => c.strategyId).length}
              </h3>
            </Card>
          </div>

          {/* Main List Table */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-title)' }}>Strategy Registry</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Filter size={16} color="var(--text-secondary)" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 12px', outline: 'none', fontSize: '12px', background: 'transparent', color: 'var(--text-primary)' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Strategy Name</th>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Segment</th>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Timeframe</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Status</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Assigned Clients</th>
                    <th style={{ textAlign: 'right', padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {strategies
                    .filter(s => filterType === 'all' || s.status === filterType)
                    .map(strat => {
                      let segment = 'N/A';
                      let tradeType = 'N/A';
                      let timeframe = 'N/A';
                      try {
                        const parsed = JSON.parse(strat.configJson);
                        segment = parsed.basicInfo?.segment || segment;
                        tradeType = parsed.basicInfo?.tradeType || tradeType;
                        timeframe = parsed.basicInfo?.timeframe || timeframe;
                      } catch (e) {}

                      const assignedCount = clients.filter(c => c.strategyId === strat.id).length;

                      return (
                        <tr key={strat.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '14px 12px', fontWeight: 600 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span>{strat.name}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400 }}>{strat.description || 'No description'}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 12px' }}>
                            <span className="badge badge-info">{segment}</span>
                          </td>
                          <td style={{ padding: '14px 12px' }}>{tradeType}</td>
                          <td style={{ padding: '14px 12px' }}>{timeframe}</td>
                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleToggleStatus(strat)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              <span className={`badge ${strat.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                {strat.status.toUpperCase()}
                              </span>
                            </button>
                          </td>
                          <td style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 600 }}>
                            {assignedCount}
                          </td>
                          <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => {
                                  setSelectedStrategy(strat);
                                  setViewMode('detail');
                                  setDetailTab('overview');
                                }}
                                style={{ background: 'none', border: 'none', color: '#0052cc', cursor: 'pointer' }}
                                title="View Performance"
                              >
                                <Activity size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStrategy(strat);
                                  setViewMode('detail');
                                  setDetailTab('overview');
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--color-info)', cursor: 'pointer' }}
                                title="View details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleEdit(strat)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                                title="Edit"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleClone(strat.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                title="Clone"
                              >
                                <Copy size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(strat)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {strategies.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        No strategies created yet. Click "Create Strategy" or load a template above to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* VIEW: CREATE / EDIT STRATEGY FORM */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {formErrors && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: 'var(--color-danger)', fontSize: '13px' }}>
              <AlertCircle size={16} />
              <span>{formErrors}</span>
            </div>
          )}

          {viewMode === 'create' && templates.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <TrendingUp size={16} color={colors.PRIMARY} /> Start with a Template Config (Optional)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {templates.map(tmpl => (
                  <div key={tmpl.id} onClick={() => handleLoadTemplate(tmpl)} style={{ cursor: 'pointer', padding: '12px', borderRadius: '6px', border: `1px solid var(--border-color)`, background: 'transparent', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.PRIMARY} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                    <h5 style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{tmpl.name}</h5>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{tmpl.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* LEFT: BASIC INFO & TRADE ACTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Basic Information */}
              <Card>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={18} color={colors.PRIMARY} /> Basic Strategy Info
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Strategy Name *</label>
                    <input
                      type="text"
                      value={formData.basicInfo.name}
                      onChange={(e) => setFormData({
                        ...formData,
                        basicInfo: { ...formData.basicInfo, name: e.target.value }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                      placeholder="e.g. RSI Momentum Scalper"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Description</label>
                    <textarea
                      value={formData.basicInfo.description}
                      onChange={(e) => setFormData({
                        ...formData,
                        basicInfo: { ...formData.basicInfo, description: e.target.value }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none', height: '60px', resize: 'vertical' }}
                      placeholder="Explain the strategy objective..."
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Trade Type</label>
                      <select
                        value={formData.basicInfo.tradeType}
                        onChange={(e: any) => setFormData({
                          ...formData,
                          basicInfo: { ...formData.basicInfo, tradeType: e.target.value }
                        })}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        <option value="Intraday">Intraday</option>
                        <option value="Swing">Swing</option>
                        <option value="Positional">Positional</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Exchange</label>
                      <select
                        value={formData.basicInfo.exchange}
                        onChange={(e: any) => setFormData({
                          ...formData,
                          basicInfo: { ...formData.basicInfo, exchange: e.target.value }
                        })}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        <option value="NSE">NSE</option>
                        <option value="BSE">BSE</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Segment</label>
                      <select
                        value={formData.basicInfo.segment}
                        onChange={(e: any) => setFormData({
                          ...formData,
                          basicInfo: { ...formData.basicInfo, segment: e.target.value }
                        })}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Equity">Equity</option>
                        <option value="Futures">Futures</option>
                        <option value="Options">Options</option>
                        <option value="NSE F&O">NSE F&O</option>
                        <option value="Nifty 50">Nifty 50</option>
                        <option value="Bank Nifty">Bank Nifty</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Timeframe</label>
                      <select
                        value={formData.basicInfo.timeframe}
                        onChange={(e) => setFormData({
                          ...formData,
                          basicInfo: { ...formData.basicInfo, timeframe: e.target.value }
                        })}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        <option value="1m">1m</option>
                        <option value="3m">3m</option>
                        <option value="5m">5m</option>
                        <option value="15m">15m</option>
                        <option value="30m">30m</option>
                        <option value="1h">1h</option>
                        <option value="1d">1d</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600 }}>Entry Time</label>
                      <input
                        type="time"
                        value={formData.basicInfo.entryTime}
                        onChange={(e) => setFormData({
                          ...formData,
                          basicInfo: { ...formData.basicInfo, entryTime: e.target.value }
                        })}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600 }}>Exit Time</label>
                      <input
                        type="time"
                        value={formData.basicInfo.exitTime}
                        onChange={(e) => setFormData({
                          ...formData,
                          basicInfo: { ...formData.basicInfo, exitTime: e.target.value }
                        })}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600 }}>Max Trades/Day</label>
                      <input
                        type="number"
                        value={formData.basicInfo.maxTradesPerDay}
                        onChange={(e) => setFormData({
                          ...formData,
                          basicInfo: { ...formData.basicInfo, maxTradesPerDay: Number(e.target.value) }
                        })}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Status</label>
                    <select
                      value={formData.basicInfo.status}
                      onChange={(e: any) => setFormData({
                        ...formData,
                        basicInfo: { ...formData.basicInfo, status: e.target.value }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="active">Active (Live running)</option>
                      <option value="inactive">Inactive (Suspended)</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Trade Action config */}
              <Card>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Play size={18} color="var(--color-success)" /> Trade Action
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Action Direction</label>
                    <select
                      value={formData.tradeAction.action}
                      onChange={(e: any) => setFormData({
                        ...formData,
                        tradeAction: { ...formData.tradeAction, action: e.target.value }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="Long">Long</option>
                      <option value="Short">Short</option>
                      <option value="Buy">Buy Only</option>
                      <option value="Sell">Sell Only</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Order Type</label>
                    <select
                      value={formData.tradeAction.orderType}
                      onChange={(e: any) => setFormData({
                        ...formData,
                        tradeAction: { ...formData.tradeAction, orderType: e.target.value }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="Market">Market Order</option>
                      <option value="Limit">Limit Order</option>
                      <option value="SL-Limit">SL Limit</option>
                      <option value="SL-Market">SL Market</option>
                    </select>
                  </div>
                  {(formData.tradeAction.orderType === 'Market' || formData.tradeAction.orderType === 'SL-Market') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Market Protection</label>
                      <select
                        value={formData.tradeAction.marketProtection ?? -1}
                        onChange={(e: any) => setFormData({
                          ...formData,
                          tradeAction: { ...formData.tradeAction, marketProtection: Number(e.target.value) }
                        })}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        <option value={-1}>Auto Protection (-1)</option>
                        <option value={0}>Disable Protection (0)</option>
                        <option value={1}>1% Protection</option>
                        <option value={2}>2% Protection</option>
                        <option value={3}>3% Protection</option>
                        <option value={4}>4% Protection</option>
                        <option value={5}>5% Protection</option>
                      </select>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Buffer Price %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tradeAction.bufferPercent}
                    onChange={(e) => setFormData({
                      ...formData,
                      tradeAction: { ...formData.tradeAction, bufferPercent: Number(e.target.value) }
                    })}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    placeholder="e.g. 0.05%"
                  />
                </div>
              </Card>
            </div>

            {/* RIGHT: DYNAMIC CONDITION BUILDER & STOPLOSS/TARGET/RISK */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Dynamic Condition Builder */}
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <FileCode size={18} color="var(--color-info)" /> Dynamic Entry Conditions
                  </h3>
                  <Button type="button" variant="secondary" onClick={addCondition} style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={12} /> Add Rule
                  </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {formData.conditions.map((cond, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: idx > 0 ? '56px 1fr 120px 130px 28px' : '1fr 120px 130px 28px', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      {idx > 0 && (
                        <select
                          value={cond.logical}
                          onChange={(e: any) => handleConditionChange(idx, 'logical', e.target.value)}
                          style={{ width: '56px', padding: '6px 4px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '11px', fontWeight: 700 }}
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      )}
                      <select
                        value={cond.indicator}
                        onChange={(e) => handleConditionChange(idx, 'indicator', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '12px' }}
                      >
                        {INDICATORS.map(ind => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                      <select
                        value={cond.operator}
                        onChange={(e) => handleConditionChange(idx, 'operator', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '12px' }}
                      >
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value="==">==</option>
                        <option value=">=">&gt;=</option>
                        <option value="<=">&lt;=</option>
                        <option value="crosses-above">↑ crosses</option>
                        <option value="crosses-below">↓ crosses</option>
                      </select>
                      <input
                        type="text"
                        value={cond.value}
                        onChange={(e) => handleConditionChange(idx, 'value', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '12px', boxSizing: 'border-box' }}
                        placeholder="e.g. 50"
                      />
                      <button
                        type="button"
                        onClick={() => removeCondition(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  {formData.conditions.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', gap: '8px', color: 'var(--text-secondary)' }}>
                      <FileCode size={28} style={{ opacity: 0.3 }} />
                      <p style={{ fontSize: '12px', textAlign: 'center' }}>No conditions set. Trades will trigger at entry time automatically.</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Stoploss & Target Module */}
              <Card>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} color="var(--color-danger)" /> Target & Stoploss Rules
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Stoploss Type</label>
                    <select
                      value={formData.stoploss.type}
                      onChange={(e: any) => setFormData({
                        ...formData,
                        stoploss: { ...formData.stoploss, type: e.target.value }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="Fixed %">Fixed %</option>
                      <option value="Fixed Points">Fixed Points</option>
                      <option value="Trailing SL">Trailing SL</option>
                      <option value="Risk %">Risk %</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>SL Target Value</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.stoploss.type === 'Fixed Points' ? formData.stoploss.fixedPoints : formData.stoploss.type === 'Trailing SL' ? formData.stoploss.trailingSL : formData.stoploss.fixedPercent}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (formData.stoploss.type === 'Fixed Points') {
                          setFormData({ ...formData, stoploss: { ...formData.stoploss, fixedPoints: val } });
                        } else if (formData.stoploss.type === 'Trailing SL') {
                          setFormData({ ...formData, stoploss: { ...formData.stoploss, trailingSL: val } });
                        } else {
                          setFormData({ ...formData, stoploss: { ...formData.stoploss, fixedPercent: val } });
                        }
                      }}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Target Profit Type</label>
                    <select
                      value={formData.target.type}
                      onChange={(e: any) => setFormData({
                        ...formData,
                        target: { ...formData.target, type: e.target.value }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="Profit %">Profit %</option>
                      <option value="Risk Reward Ratio">Risk Reward Ratio</option>
                      <option value="Partial Exit">Partial Exit</option>
                      <option value="Trailing Target">Trailing Target</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Target Value</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.target.type === 'Risk Reward Ratio' ? formData.target.riskRewardRatio : formData.target.profitPercent}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (formData.target.type === 'Risk Reward Ratio') {
                          setFormData({ ...formData, target: { ...formData.target, riskRewardRatio: val } });
                        } else {
                          setFormData({ ...formData, target: { ...formData.target, profitPercent: val } });
                        }
                      }}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                </div>
              </Card>

              {/* Risk Management */}
              <Card>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} color="var(--color-info)" /> Risk Guard System
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Capital Allocation %</label>
                    <input
                      type="number"
                      value={formData.riskManagement.capitalAllocation}
                      onChange={(e) => setFormData({
                        ...formData,
                        riskManagement: { ...formData.riskManagement, capitalAllocation: Number(e.target.value) }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Risk Per Trade %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.riskManagement.riskPerTrade}
                      onChange={(e) => setFormData({
                        ...formData,
                        riskManagement: { ...formData.riskManagement, riskPerTrade: Number(e.target.value) }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Max Open Positions</label>
                    <input
                      type="number"
                      value={formData.riskManagement.maxOpenPositions}
                      onChange={(e) => setFormData({
                        ...formData,
                        riskManagement: { ...formData.riskManagement, maxOpenPositions: Number(e.target.value) }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Kill Switch</label>
                    <select
                      value={formData.riskManagement.killSwitch ? 'true' : 'false'}
                      onChange={(e: any) => setFormData({
                        ...formData,
                        riskManagement: { ...formData.riskManagement, killSwitch: e.target.value === 'true' }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="false">Off</option>
                      <option value="true">On (Force Suspend)</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button type="button" variant="secondary" onClick={() => setViewMode('list')}>Cancel</Button>
            <Button type="submit">Save Strategy Settings</Button>
          </div>
        </form>
      )}

      {viewMode === 'detail' && selectedStrategy && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Controls Panel */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '8px' }}>
            {/* Date Filter Pill */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <div 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px 16px', 
                  borderRadius: '8px', 
                  background: 'white', 
                  border: '1px solid #e2e8f0', 
                  fontSize: '13px', 
                  color: '#334155',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  userSelect: 'none'
                }}
              >
                <Calendar size={14} color="#0052cc" />
                <span>{dateRangeStr}</span>
                <ChevronDown size={14} color="#64748b" />
              </div>

              {isFilterOpen && (
                <div style={{ 
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: '320px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
                  padding: '16px',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>Filter Range</span>
                    <button 
                      onClick={clearFilters}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Reset
                    </button>
                  </div>

                  <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                    <button onClick={() => setFilterTypeTab('month')} style={{ flex: 1, border: 'none', background: filterTypeTab === 'month' ? 'white' : 'transparent', color: '#334155', fontSize: '12px', padding: '6px 0', borderRadius: '4px', fontWeight: filterTypeTab === 'month' ? 600 : 500, cursor: 'pointer' }}>Month</button>
                    <button onClick={() => setFilterTypeTab('year')} style={{ flex: 1, border: 'none', background: filterTypeTab === 'year' ? 'white' : 'transparent', color: '#334155', fontSize: '12px', padding: '6px 0', borderRadius: '4px', fontWeight: filterTypeTab === 'year' ? 600 : 500, cursor: 'pointer' }}>Year</button>
                    <button onClick={() => setFilterTypeTab('custom')} style={{ flex: 1, border: 'none', background: filterTypeTab === 'custom' ? 'white' : 'transparent', color: '#334155', fontSize: '12px', padding: '6px 0', borderRadius: '4px', fontWeight: filterTypeTab === 'custom' ? 600 : 500, cursor: 'pointer' }}>Custom</button>
                  </div>

                  {filterTypeTab === 'month' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} style={{ flex: 1.5, padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                          {MONTHS.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
                        </select>
                      </div>
                      <Button onClick={applyMonthFilter} style={{ width: '100%', padding: '8px', fontSize: '12px', backgroundColor: '#0052cc', color: 'white' }}>Apply</Button>
                    </div>
                  )}

                  {filterTypeTab === 'year' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <Button onClick={applyYearFilter} style={{ width: '100%', padding: '8px', fontSize: '12px', backgroundColor: '#0052cc', color: 'white' }}>Apply</Button>
                    </div>
                  )}

                  {filterTypeTab === 'custom' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%' }} />
                      <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%' }} />
                      <Button onClick={applyCustomFilter} style={{ width: '100%', padding: '8px', fontSize: '12px', backgroundColor: '#0052cc', color: 'white' }}>Apply</Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sub-tabs switch */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <button onClick={() => setDetailTab('overview')} style={{ border: 'none', background: detailTab === 'overview' ? 'white' : 'transparent', color: detailTab === 'overview' ? '#0f172a' : '#64748b', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Performance</button>
              <button onClick={() => setDetailTab('assignment')} style={{ border: 'none', background: detailTab === 'assignment' ? 'white' : 'transparent', color: detailTab === 'assignment' ? '#0f172a' : '#64748b', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Assignments</button>
              <button onClick={() => setDetailTab('logs')} style={{ border: 'none', background: detailTab === 'logs' ? 'white' : 'transparent', color: detailTab === 'logs' ? '#0f172a' : '#64748b', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Logs</button>
            </div>

            <Button variant="secondary" onClick={() => handleEdit(selectedStrategy)} style={{ fontSize: '13px', fontWeight: 600 }}>Edit Config</Button>
          </div>

          {/* TAB: OVERVIEW & PERFORMANCE (REDESIGNED TO MATCH SCREENSHOT) */}
          {detailTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Row 1: 5 KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                {/* Total P&L Card */}
                <Card style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Total P&L (₹)</span>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>₹</div>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', color: '#0f172a', fontFamily: 'var(--font-title)' }}>
                    ₹ {selectedStrategyPnl.toLocaleString('en-IN')}
                  </h3>
                  <span style={{ fontSize: '11px', color: selectedStrategyPnl >= last30dPnL ? '#10b981' : '#ef4444', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {getPctChange(selectedStrategyPnl, last30dPnL)}
                  </span>
                  <div style={{ height: '35px', marginTop: '6px', display: 'flex', alignItems: 'flex-end' }}>
                    <Sparkline data={selectedStrategyPnlCurve} stroke="#7c3aed" width={180} height={30} />
                  </div>
                </Card>

                {/* Win Rate Card */}
                <Card style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Win Rate</span>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>%</div>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', color: '#0f172a', fontFamily: 'var(--font-title)' }}>
                    {selectedStrategyWinRate.toFixed(1)}%
                  </h3>
                  <span style={{ fontSize: '11px', color: selectedStrategyWinRate >= last30dWinRate ? '#10b981' : '#ef4444', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {getPctChange(selectedStrategyWinRate, last30dWinRate)}
                  </span>
                  <div style={{ height: '35px', marginTop: '6px', display: 'flex', alignItems: 'flex-end' }}>
                    <Sparkline data={winRateCurve} stroke="#10b981" width={180} height={30} />
                  </div>
                </Card>

                {/* Profit Factor Card */}
                <Card style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Profit Factor</span>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>PF</div>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', color: '#0f172a', fontFamily: 'var(--font-title)' }}>
                    {selectedStrategyProfitFactor.toFixed(2)}
                  </h3>
                  <span style={{ fontSize: '11px', color: selectedStrategyProfitFactor >= last30dProfitFactor ? '#10b981' : '#ef4444', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {getPctChange(selectedStrategyProfitFactor, last30dProfitFactor)}
                  </span>
                  <div style={{ height: '35px', marginTop: '6px', display: 'flex', alignItems: 'flex-end' }}>
                    <Sparkline data={profitFactorCurve} stroke="#2563eb" width={180} height={30} />
                  </div>
                </Card>

                {/* Max Drawdown Card */}
                <Card style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Max Drawdown (₹)</span>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>DD</div>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', color: '#0f172a', fontFamily: 'var(--font-title)' }}>
                    ₹ {selectedStrategyDrawdown.toLocaleString('en-IN')}
                  </h3>
                  <span style={{ fontSize: '11px', color: selectedStrategyDrawdown <= last30dDrawdown ? '#10b981' : '#ef4444', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {getPctChange(selectedStrategyDrawdown, last30dDrawdown)}
                  </span>
                  <div style={{ height: '35px', marginTop: '6px', display: 'flex', alignItems: 'flex-end' }}>
                    <Sparkline data={drawdownCurve} stroke="#ef4444" width={180} height={30} />
                  </div>
                </Card>

                {/* Total Trades Card */}
                <Card style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Total Trades</span>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#fcf6f0', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>#</div>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', color: '#0f172a', fontFamily: 'var(--font-title)' }}>
                    {selectedStrategyTradesCount}
                  </h3>
                  <span style={{ fontSize: '11px', color: selectedStrategyTradesCount >= last30dTradesCount ? '#10b981' : '#ef4444', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {getPctChange(selectedStrategyTradesCount, last30dTradesCount)}
                  </span>
                  <div style={{ height: '35px', marginTop: '6px', display: 'flex', alignItems: 'flex-end' }}>
                    <Sparkline data={tradesCountCurve} stroke="#7c3aed" width={180} height={30} />
                  </div>
                </Card>
              </div>

              {/* Row 2: Equity Curve (2fr), P&L Distribution (1.5fr), Trade Performance (1.5fr) */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr 1.3fr', gap: '20px' }}>
                <Card style={{ borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-title)' }}>Equity Curve</h4>
                    <select style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }}>
                      <option>Daily</option>
                      <option>Cumulative</option>
                    </select>
                  </div>
                  <PerformanceChart
                    data={selectedStrategyPnlCurve}
                    labels={selectedStrategyPnlLabels}
                    strokeColor="#0052cc"
                    fillColorStart="rgba(0, 82, 204, 0.15)"
                    fillColorEnd="rgba(0, 82, 204, 0)"
                    height={200}
                  />
                </Card>

                <Card style={{ display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-title)', marginBottom: '14px' }}>P&L Distribution</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', flex: 1, justifyContent: 'center' }}>
                    <div style={{ width: '100px', height: '100px', position: 'relative' }}>
                      <svg width="100%" height="100%" viewBox="0 0 42 42">
                        <circle cx="21" cy="21" r="15.915" fill="#fff"></circle>
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4"></circle>
                        
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="4" 
                          strokeDasharray={`${selectedStrategyWinRate} ${100 - selectedStrategyWinRate}`} 
                          strokeDashoffset="25"
                        />
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4" 
                          strokeDasharray={`${selectedStrategyLossRate} ${100 - selectedStrategyLossRate}`} 
                          strokeDashoffset={`${25 - selectedStrategyWinRate}`}
                        />
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#cbd5e1" strokeWidth="4" 
                          strokeDasharray={`${selectedStrategyDrawRate} ${100 - selectedStrategyDrawRate}`} 
                          strokeDashoffset={`${25 - selectedStrategyWinRate - selectedStrategyLossRate}`}
                        />
                      </svg>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>
                        <strong style={{ fontSize: '16px', color: '#0f172a' }}>{selectedStrategyTradesCount}</strong>
                        <span style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase' }}>Total Trades</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Winning</span>
                        <strong>{selectedStrategyWins} ({selectedStrategyWinRate.toFixed(1)}%)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Losing</span>
                        <strong>{selectedStrategyLosses} ({selectedStrategyLossRate.toFixed(1)}%)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Breakeven</span>
                        <strong>{selectedStrategyBreakevens} ({selectedStrategyDrawRate.toFixed(1)}%)</strong>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card style={{ borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-title)', marginBottom: '14px' }}>Trade Performance</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Best Trade (₹)</span>
                      <strong style={{ color: '#10b981' }}>₹ {selectedStrategyBest.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Worst Trade (₹)</span>
                      <strong style={{ color: '#ef4444' }}>-₹ {Math.abs(selectedStrategyWorst).toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Average Profit (₹)</span>
                      <strong style={{ color: '#10b981' }}>₹ {selectedStrategyAvgProfit.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Average Loss (₹)</span>
                      <strong style={{ color: '#ef4444' }}>-₹ {Math.abs(selectedStrategyAvgLoss).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Expectancy (₹)</span>
                      <strong>₹ {selectedStrategyExpectancy.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Sharpe Ratio</span>
                      <strong>1.48</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Sortino Ratio</span>
                      <strong>2.12</strong>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Row 3: Performance Metrics (1.5fr), stacked Bar Charts (1.5fr), Strategy Overview (1.5fr) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.3fr', gap: '20px' }}>
                <Card style={{ borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-title)', marginBottom: '14px' }}>Performance Metrics</h4>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                        <th style={{ padding: '6px 0', color: '#64748b', fontWeight: 600, width: '30%' }}>METRIC</th>
                        <th style={{ padding: '6px 0', color: '#64748b', fontWeight: 600, textAlign: 'right', width: '22%' }}>VALUE</th>
                        <th style={{ padding: '6px 0', color: '#64748b', fontWeight: 600, textAlign: 'right', width: '24%', fontSize: '10px', whiteSpace: 'nowrap' }}>VS LAST 30 DAYS</th>
                        <th style={{ padding: '6px 0', color: '#64748b', fontWeight: 600, textAlign: 'right', width: '24%', fontSize: '10px', whiteSpace: 'nowrap' }}>VS LAST 90 DAYS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', color: '#475569' }}>Total P&L (₹)</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: selectedStrategyPnl >= 0 ? '#10b981' : '#ef4444' }}>₹{selectedStrategyPnl.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: selectedStrategyPnl >= last30dPnL ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyPnl, last30dPnL)}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: selectedStrategyPnl >= last90dPnL ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyPnl, last90dPnL)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', color: '#475569' }}>Net Profit (₹)</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>₹{selectedStrategyWinsSum.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: selectedStrategyWinsSum >= (last30DaysTrades.filter(t => Number(t.pnl || 0) > 0).reduce((acc, t) => acc + Number(t.pnl || 0), 0)) ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyWinsSum, (last30DaysTrades.filter(t => Number(t.pnl || 0) > 0).reduce((acc, t) => acc + Number(t.pnl || 0), 0)))}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: selectedStrategyWinsSum >= (last90DaysTrades.filter(t => Number(t.pnl || 0) > 0).reduce((acc, t) => acc + Number(t.pnl || 0), 0)) ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyWinsSum, (last90DaysTrades.filter(t => Number(t.pnl || 0) > 0).reduce((acc, t) => acc + Number(t.pnl || 0), 0)))}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', color: '#475569' }}>Net Loss (₹)</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>-₹{Math.abs(selectedStrategyLossesSum).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: Math.abs(selectedStrategyLossesSum) <= Math.abs(last30dLossesSum) ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyLossesSum, last30dLossesSum)}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: Math.abs(selectedStrategyLossesSum) <= Math.abs(last90dLossesSum) ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyLossesSum, last90dLossesSum)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', color: '#475569' }}>Win Rate</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{selectedStrategyWinRate.toFixed(1)}%</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: selectedStrategyWinRate >= last30dWinRate ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyWinRate, last30dWinRate)}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: selectedStrategyWinRate >= last90dWinRate ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyWinRate, last90dWinRate)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', color: '#475569' }}>Profit Factor</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{selectedStrategyProfitFactor.toFixed(2)}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: selectedStrategyProfitFactor >= last30dProfitFactor ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyProfitFactor, last30dProfitFactor)}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: selectedStrategyProfitFactor >= last90dProfitFactor ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyProfitFactor, last90dProfitFactor)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', color: '#475569' }}>Max Drawdown (₹)</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>₹{selectedStrategyDrawdown.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: selectedStrategyDrawdown <= last30dDrawdown ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyDrawdown, last30dDrawdown)}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: selectedStrategyDrawdown <= last90dDrawdown ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyDrawdown, last90dDrawdown)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', color: '#475569' }}>Max Drawdown (%)</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{selectedStrategyTradesCount > 0 ? '12.4%' : '0.0%'}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: '#64748b' }}>-</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: '#64748b' }}>-</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', color: '#475569' }}>Total Trades</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{selectedStrategyTradesCount}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: selectedStrategyTradesCount >= last30dTradesCount ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyTradesCount, last30dTradesCount)}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: selectedStrategyTradesCount >= last90dTradesCount ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyTradesCount, last90dTradesCount)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#475569' }}>Average Trade (₹)</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>₹{selectedStrategyExpectancy.toFixed(2)}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: selectedStrategyExpectancy >= (last30dTradesCount === 0 ? 0 : last30dPnL / last30dTradesCount) ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyExpectancy, (last30dTradesCount === 0 ? 0 : last30dPnL / last30dTradesCount))}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: selectedStrategyExpectancy >= (last90dTradesCount === 0 ? 0 : last90dPnL / last90dTradesCount) ? '#10b981' : '#ef4444' }}>{getPctChange(selectedStrategyExpectancy, (last90dTradesCount === 0 ? 0 : last90dPnL / last90dTradesCount))}</td>
                      </tr>
                    </tbody>
                  </table>
                </Card>

                {/* Middle: Stacked Bar Charts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Card style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>P&L by Day of Week (₹)</h4>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>P&L</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '140px', paddingTop: '20px' }}>
                      {pnlByDayOfWeek.map((item, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '4px' }}>
                          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 600 }}>{item.val}</span>
                          <div style={{ width: '16px', height: '110px', backgroundColor: '#e2e8f0', borderRadius: '2px', position: 'relative' }}>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: item.height, backgroundColor: item.color, borderRadius: '2px' }}></div>
                          </div>
                          <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>P&L by Month (₹)</h4>
                      <select style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '10px', outline: 'none' }}>
                        <option>2026</option>
                        <option>2025</option>
                        <option>2024</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '140px', paddingTop: '20px' }}>
                      {pnlByMonth.map((item, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '4px' }}>
                          <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 600 }}>{item.val}</span>
                          <div style={{ width: '12px', height: '110px', backgroundColor: '#e2e8f0', borderRadius: '2px', position: 'relative' }}>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: item.height, backgroundColor: item.color, borderRadius: '2px' }}></div>
                          </div>
                          <span style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Right: Strategy Overview */}
                <Card style={{ borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-title)', marginBottom: '14px' }}>Strategy Overview</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Strategy Name</span>
                      <strong style={{ textAlign: 'right' }}>{selectedStrategy.name}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>Status</span>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: selectedStrategy.status === 'active' ? '#e6f7f4' : '#fee2e2', color: selectedStrategy.status === 'active' ? '#00a389' : '#ef4444' }}>{selectedStrategy.status.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Strategy Type</span>
                      <strong>{(() => { try { return JSON.parse(selectedStrategy.configJson).basicInfo.tradeType } catch(e) { return 'Intraday' } })()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Asset Class</span>
                      <strong>Equity (Cash)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Timeframe</span>
                      <strong>{(() => { try { return JSON.parse(selectedStrategy.configJson).basicInfo.timeframe } catch(e) { return '5 min' } })()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>Tags</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <span style={{ padding: '1px 6px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '10px', color: '#64748b' }}>Breakout</span>
                        <span style={{ padding: '1px 6px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '10px', color: '#64748b' }}>Momentum</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Created On</span>
                      <strong>{new Date(selectedStrategy.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Last Updated</span>
                      <strong>{new Date(selectedStrategy.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                      <span style={{ color: '#64748b' }}>Description</span>
                      <p style={{ color: '#475569', lineHeight: '1.4', margin: 0 }}>{selectedStrategy.description || 'No strategy description provided.'}</p>
                    </div>
                  </div>
                </Card>
              </div>

            </div>
          )}

          {/* TAB: CLIENT ASSIGNMENT */}
          {detailTab === 'assignment' && (
            <Card style={{ borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-title)' }}>Deploy clients to {selectedStrategy.name}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Check client profile to deploy strategy and enable automatic order execution.</p>
                </div>

                {selectedClientIds.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="success" onClick={() => handleBulkAssign(false)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Bulk Assign
                    </Button>
                    <Button variant="danger" onClick={() => handleBulkAssign(true)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Bulk Remove
                    </Button>
                  </div>
                )}
              </div>

              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ width: '40px', padding: '12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedClientIds.length === clients.length && clients.length > 0}
                          onChange={toggleSelectAllClients}
                        />
                      </th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Client Name</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Broker</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Client ID</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Segment</th>
                      <th style={{ textAlign: 'right', padding: '12px' }}>Capital</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>Status</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>Strategy Status</th>
                      <th style={{ textAlign: 'right', padding: '12px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => {
                      const isAssignedToThis = client.strategyId === selectedStrategy.id;
                      return (
                        <tr key={client.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selectedClientIds.includes(client.id)}
                              onChange={() => toggleClientSelection(client.id)}
                            />
                          </td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{client.name}</td>
                          <td style={{ padding: '12px' }}>{client.broker || 'Zerodha'}</td>
                          <td style={{ padding: '12px' }}><code>{client.zerodhaClientId || client.clientId}</code></td>
                          <td style={{ padding: '12px' }}><span className="badge badge-info">{client.segment || 'NSE F&O'}</span></td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>₹{Number(client.capital).toLocaleString()}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span className={`badge ${client.tradingStatus === 'active' ? 'badge-success' : 'badge-danger'}`}>
                              {client.tradingStatus?.toUpperCase() || 'INACTIVE'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {client.strategyId ? (
                              <span className={`badge ${isAssignedToThis ? 'badge-success' : 'badge-warning'}`}>
                                {isAssignedToThis ? 'Assigned' : `Other (${client.strategyName || 'Linked'})`}
                              </span>
                            ) : (
                              <span className="badge badge-danger">Unassigned</span>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            {isAssignedToThis ? (
                              <Button variant="danger" onClick={() => handleAssignStrategy(client.id, true)} style={{ padding: '4px 8px', fontSize: '11px' }}>
                                Remove
                              </Button>
                            ) : (
                              <Button variant="primary" onClick={() => handleAssignStrategy(client.id, false)} style={{ padding: '4px 8px', fontSize: '11px' }}>
                                Assign
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB: STRATEGY LOGS */}
          {detailTab === 'logs' && (
            <Card style={{ borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={16} /> Strategy Live Console Logs
              </h3>
              <div style={{ background: '#090d16', color: '#38bdf8', padding: '16px', borderRadius: '8px', fontFamily: 'Courier New, Courier, monospace', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                {logs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    <span style={{ color: log.logType === 'error' ? '#ef4444' : log.logType === 'trade' ? '#22c55e' : '#38bdf8' }}>
                      [{log.logType.toUpperCase()}]
                    </span>
                    <span style={{ color: '#f8fafc' }}>{log.message}</span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <span style={{ color: '#64748b', textAlign: 'center' }}>Console empty. No execution logs yet.</span>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setStrategyToDelete(null);
        }}
        title="Delete Strategy"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Are you sure you want to delete the strategy <strong>{strategyToDelete?.name}</strong>? This action cannot be undone. All client assignments and trade records linked to this strategy will be affected.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => {
              setIsDeleteModalOpen(false);
              setStrategyToDelete(null);
            }}>Cancel</Button>
            <Button variant="danger" onClick={executeDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Yes, Delete Strategy'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
