'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '../../../../../shared/components/views/Card';
import { Button } from '../../../../../shared/components/views/Button';
import { PerformanceChart } from '../../../../../shared/components/views/PerformanceChart';
import { Modal } from '../../../../../shared/components/views/Modal';
import { 
  ArrowLeft, 
  Calendar, 
  ChevronRight, 
  ChevronDown,
  Search, 
  Filter, 
  Download, 
  Mail, 
  Phone, 
  User, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Activity, 
  Copy,
  CheckCircle,
  FileSpreadsheet,
  Percent,
  XCircle
} from 'lucide-react';
import { useAppViewModel } from '../../../../../shared/viewmodels/AppContext';
import { api } from '../../../../../shared/services/api';
import { API_ENDPOINTS, APP_ROUTES } from '../../../../../core/constants';

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

export default function ClientPerformancePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { clients, trades, colors } = useAppViewModel();

  const [client, setClient] = useState<any>(null);
  const [clientTrades, setClientTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<any | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [strategyFilter, setStrategyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusQuickFilter, setStatusQuickFilter] = useState<'all' | 'profit' | 'loss'>('all');
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  
  // Date filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<'month' | 'year' | 'custom' | 'all'>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const res = await api.get(`${API_ENDPOINTS.CLIENTS}/${id}`);
        if (res.success && res.client) {
          setClient(res.client);
          
          // Filter trades belonging to this client
          const allTrades = await api.get(API_ENDPOINTS.TRADES);
          if (allTrades.success && allTrades.trades) {
            const filtered = allTrades.trades.filter((t: any) => t.clientId === id);
            setClientTrades(filtered);
          }
        } else {
          setError('Client not found');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading client data');
      } finally {
        setLoading(false);
      }
    };
    fetchClientData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <div className="live-dot" style={{ width: '16px', height: '16px', backgroundColor: 'var(--primary)' }}></div>
        <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading client performance metrics...</div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ padding: '16px', borderRadius: '50%', backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
          <TrendingDown size={36} />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>Performance Data Unavailable</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>{error || 'Client details could not be found.'}</p>
        </div>
        <Button onClick={() => router.push(APP_ROUTES.ADMIN_CLIENTS)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Back to Clients
        </Button>
      </div>
    );
  }

  const clientName = client.user?.name || client.name || 'Unknown Client';
  const clientEmail = client.user?.email || client.email || '--';
  const clientPhone = client.user?.mobile || '--';
  const clientCode = client.zerodhaClientId || 'Not Configured';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(clientCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Filter trades by date range if specified
  const dateFilteredTrades = clientTrades.filter(t => {
    if (!t.createdAt) return false;
    const tDate = new Date(t.createdAt);
    if (startDate && tDate < startDate) return false;
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (tDate > endOfDay) return false;
    }
    return true;
  });

  // Metric calculation
  const totalTradesCount = dateFilteredTrades.length;
  const closedTrades = dateFilteredTrades.filter(t => t.status.toLowerCase() !== 'open');
  const openTradesCount = dateFilteredTrades.filter(t => t.status.toLowerCase() === 'open').length;
  
  const winningTrades = closedTrades.filter(t => Number(t.pnl || 0) > 0);
  const losingTrades = closedTrades.filter(t => Number(t.pnl || 0) < 0);
  const breakevenTrades = closedTrades.filter(t => Number(t.pnl || 0) === 0);
 
  const winCount = winningTrades.length;
  const lossCount = losingTrades.length;
  const drawCount = breakevenTrades.length + openTradesCount; // Open trades are considered neutral/breakeven here
 
  const winRate = closedTrades.length ? (winCount / closedTrades.length) * 100 : 0;
  const lossRate = closedTrades.length ? (lossCount / closedTrades.length) * 100 : 0;
  const drawRate = totalTradesCount ? (drawCount / totalTradesCount) * 100 : 0;
 
  const totalPnl = dateFilteredTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
  const netProfit = winningTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
  const netLoss = Math.abs(losingTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0));

  const avgProfit = winCount ? netProfit / winCount : 0;
  const avgLoss = lossCount ? netLoss / lossCount : 0;
  const profitFactor = netLoss ? netProfit / netLoss : netProfit ? 99.9 : 0;

  const bestTrade = winningTrades.length ? Math.max(...winningTrades.map(t => Number(t.pnl || 0))) : 0;
  const worstTrade = losingTrades.length ? Math.min(...losingTrades.map(t => Number(t.pnl || 0))) : 0;
  const expectancy = totalTradesCount ? totalPnl / totalTradesCount : 0;

  // Real equity curve calculation
  let pnlHistoryData = [0];
  let pnlHistoryLabels = ['Start'];
  if (dateFilteredTrades.length > 0) {
    let runningSum = 0;
    const sortedTrades = [...dateFilteredTrades].sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
    sortedTrades.forEach((t) => {
      runningSum += Number(t.pnl || 0);
      pnlHistoryData.push(runningSum);
      
      const date = t.createdAt ? new Date(t.createdAt) : new Date();
      pnlHistoryLabels.push(date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }));
    });
  } else {
    pnlHistoryData = [0];
    pnlHistoryLabels = ['Start'];
  }

  // Max Drawdown calculation from running equity curve relative to client capital
  let maxDrawdownValue = 0;
  let maxDrawdownPercent = 0;
  const clientCapital = Number(client.capital || 0);

  if (pnlHistoryData.length > 0 && clientCapital > 0) {
    let peak = clientCapital;
    let maxDdV = 0;
    pnlHistoryData.forEach((pnlVal) => {
      const currentEquity = clientCapital + pnlVal;
      if (currentEquity > peak) {
        peak = currentEquity;
      }
      const dd = peak - currentEquity;
      if (dd > maxDdV) {
        maxDdV = dd;
      }
    });
    maxDrawdownValue = maxDdV;
    maxDrawdownPercent = (maxDdV / clientCapital) * 100;
  }

  // Sharpe ratio approximation
  let sharpeRatio = 0;
  if (closedTrades.length > 1) {
    const pnls = closedTrades.map(t => Number(t.pnl || 0));
    const mean = pnls.reduce((a, b) => a + b, 0) / pnls.length;
    const variance = pnls.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (pnls.length - 1);
    const stdDev = Math.sqrt(variance);
    sharpeRatio = stdDev > 0 ? mean / stdDev : 0;
  }

  // Capital percentage calculations
  const totalPnlPercent = clientCapital > 0 ? (totalPnl / clientCapital) * 100 : 0;
  const netProfitPercent = clientCapital > 0 ? (netProfit / clientCapital) * 100 : 0;
  const netLossPercent = clientCapital > 0 ? (netLoss / clientCapital) * 100 : 0;

  // Dynamic date range string
  let dateRangeStr = 'All Time';
  if (startDate && endDate) {
    dateRangeStr = `${startDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  } else if (dateFilteredTrades.length > 0) {
    const times = dateFilteredTrades
      .map(t => new Date(t.createdAt).getTime())
      .filter(t => !isNaN(t));
    if (times.length > 0) {
      const minDate = new Date(Math.min(...times));
      const maxDate = new Date(Math.max(...times));
      dateRangeStr = `${minDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} - ${maxDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
  }

  // Get unique strategies from dateFilteredTrades
  const uniqueStrategies = Array.from(
    new Set(
      dateFilteredTrades
        .map(t => t.strategy?.name || t.strategyName || '')
        .filter(Boolean)
    )
  ) as string[];

  // Filter transaction list
  const filteredTransactions = dateFilteredTrades.filter(t => {
    const strategyName = (t.strategy?.name || t.strategyName || '').toLowerCase();
    const symbolStr = (t.symbol || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    // Dynamically calculate transaction type from strategy config action
    let txType = t.direction === 'SHORT' ? 'SELL' : 'BUY';
    if (txType !== 'SELL') {
      try {
        const config = JSON.parse(t.strategy?.configJson || '{}');
        const leg = config?.legs?.[0]?.tradeAction;
        const action = leg?.action || config?.tradeAction?.action || 'Long';
        if (action.toLowerCase() === 'short' || action.toLowerCase() === 'sell') {
          txType = 'SELL';
        }
      } catch (e) {}
    }

    const matchesSearch = strategyName.includes(query) || symbolStr.includes(query);
    const matchesStrategy = strategyFilter === 'all' || strategyName.includes(strategyFilter.toLowerCase());
    const matchesType = typeFilter === 'all' || txType === typeFilter.toUpperCase();

    const pnlVal = Number(t.pnl || 0);
    const matchesQuickFilter = 
      statusQuickFilter === 'all' 
        ? true 
        : statusQuickFilter === 'profit' 
          ? pnlVal > 0 
          : pnlVal < 0;

    return matchesSearch && matchesStrategy && matchesType && matchesQuickFilter;
  });

  // Paginated transactions
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

  // SVG mini-sparkline paths for metrics
  const getSparklinePath = (up: boolean) => {
    return up 
      ? "M0,15 Q15,5 30,12 T60,2 T90,10" 
      : "M0,5 Q15,15 30,8 T60,18 T90,10";
  };

  const handleExportExcel = () => {
    const headers = ['Date & Time', 'Strategy', 'Type', 'Symbol', 'Quantity', 'Entry Price', 'Exit Price', 'P&L (INR)', 'Status'];
    const rows = filteredTransactions.map(t => {
      const entryPriceVal = Number(t.entryPrice || 0);
      const exitPriceVal = Number(t.exitPrice || 0);
      const pnlVal = Number(t.pnl || 0);
      
      let txType = t.direction === 'SHORT' ? 'SELL' : 'BUY';
      if (txType !== 'SELL') {
        try {
          const config = JSON.parse(t.strategy?.configJson || '{}');
          const leg = config?.legs?.[0]?.tradeAction;
          const action = leg?.action || config?.tradeAction?.action || 'Long';
          if (action.toLowerCase() === 'short' || action.toLowerCase() === 'sell') {
            txType = 'SELL';
          }
        } catch (e) {}
      }

      return [
        formatDateTime(t.createdAt),
        t.strategy?.name || t.strategyName || '--',
        txType,
        t.symbol || '--',
        t.quantity || 0,
        entryPriceVal,
        exitPriceVal,
        pnlVal,
        t.status || 'FAILED'
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
    link.setAttribute('download', `${clientName.replace(/\s+/g, '_')}_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tradesHtml = filteredTransactions.map(t => {
      const entryPriceVal = Number(t.entryPrice || 0);
      const exitPriceVal = Number(t.exitPrice || 0);
      const pnlVal = Number(t.pnl || 0);
      
      let txType = t.direction === 'SHORT' ? 'SELL' : 'BUY';
      if (txType !== 'SELL') {
        try {
          const config = JSON.parse(t.strategy?.configJson || '{}');
          const leg = config?.legs?.[0]?.tradeAction;
          const action = leg?.action || config?.tradeAction?.action || 'Long';
          if (action.toLowerCase() === 'short' || action.toLowerCase() === 'sell') {
            txType = 'SELL';
          }
        } catch (e) {}
      }

      const pnlColor = pnlVal >= 0 ? '#16a34a' : '#ef4444';

      return `
        <tr>
          <td>${formatDateTime(t.createdAt)}</td>
          <td>${t.strategy?.name || t.strategyName || '--'}</td>
          <td><span style="font-weight: 600; color: ${txType === 'BUY' ? '#2563eb' : '#dc2626'}">${txType}</span></td>
          <td>${t.symbol || '--'}</td>
          <td>${t.quantity || 0}</td>
          <td>₹${entryPriceVal.toLocaleString('en-IN')}</td>
          <td>₹${exitPriceVal > 0 ? exitPriceVal.toLocaleString('en-IN') : '--'}</td>
          <td style="color: ${pnlColor}; font-weight: 600;">₹${pnlVal.toLocaleString('en-IN')}</td>
          <td>${t.status || 'FAILED'}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${clientName} - Performance Report</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #334155; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; }
            .meta { font-size: 13px; color: #64748b; margin-top: 6px; }
            .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
            .metric-card { border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
            .metric-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
            .metric-val { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th { background: #f8fafc; color: #475569; font-weight: 600; text-align: left; padding: 8px 12px; border-bottom: 1.5px solid #cbd5e1; }
            td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
            tr:last-child td { border-bottom: none; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Growffiy Client Performance Report</h1>
            <div class="meta">
              <strong>Client:</strong> ${clientName} (${clientCode}) | <strong>Date Range:</strong> ${dateRangeStr}
            </div>
          </div>
          
          <div class="metrics">
            <div class="metric-card">
              <div class="metric-label">Total P&L</div>
              <div class="metric-val" style="color: ${totalPnl >= 0 ? '#16a34a' : '#ef4444'}">₹${totalPnl.toLocaleString('en-IN')}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Win Rate</div>
              <div class="metric-val">${winRate.toFixed(1)}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Winning / Losing Trades</div>
              <div class="metric-val" style="font-size: 14px; margin-top: 8px;">${winCount} Win / ${lossCount} Loss</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total Executed Trades</div>
              <div class="metric-val">${totalTradesCount}</div>
            </div>
          </div>

          <h2>Transaction History</h2>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Strategy</th>
                <th>Type</th>
                <th>Symbol</th>
                <th>Qty</th>
                <th>Entry Price</th>
                <th>Exit Price</th>
                <th>P&L</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              \${tradesHtml || '<tr><td colspan="9" style="text-align:center; padding: 20px; color:#94a3b8;">No transactions found.</td></tr>'}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const applyMonthFilter = () => {
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0);
    setStartDate(start);
    setEndDate(end);
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const applyYearFilter = () => {
    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31);
    setStartDate(start);
    setEndDate(end);
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
    setStartDate(null);
    setEndDate(null);
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
    setFilterType('all');
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => router.push(APP_ROUTES.ADMIN_CLIENTS)}>Clients</span>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-heading)', fontWeight: 500 }}>Client Performance</span>
        </div>
        
        {/* Date Selector Dropdown Pill */}
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
              border: '1px solid var(--border-color)', 
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
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              padding: '16px',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-heading)' }}>Date Filter</span>
                <button 
                  onClick={clearFilters}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Reset to Default
                </button>
              </div>

              {/* Filter Selector Tabs */}
              <div style={{ display: 'flex', background: 'var(--border-light)', padding: '2px', borderRadius: '6px' }}>
                <button 
                  onClick={() => setFilterType('month')}
                  style={{ flex: 1, border: 'none', background: filterType === 'month' ? 'var(--bg-card)' : 'transparent', color: 'var(--text-body)', fontSize: '12px', padding: '6px 0', borderRadius: '4px', fontWeight: filterType === 'month' ? 600 : 500, cursor: 'pointer' }}
                >
                  Month
                </button>
                <button 
                  onClick={() => setFilterType('year')}
                  style={{ flex: 1, border: 'none', background: filterType === 'year' ? 'var(--bg-card)' : 'transparent', color: 'var(--text-body)', fontSize: '12px', padding: '6px 0', borderRadius: '4px', fontWeight: filterType === 'year' ? 600 : 500, cursor: 'pointer' }}
                >
                  Year
                </button>
                <button 
                  onClick={() => setFilterType('custom')}
                  style={{ flex: 1, border: 'none', background: filterType === 'custom' ? 'var(--bg-card)' : 'transparent', color: 'var(--text-body)', fontSize: '12px', padding: '6px 0', borderRadius: '4px', fontWeight: filterType === 'custom' ? 600 : 500, cursor: 'pointer' }}
                >
                  Custom
                </button>
              </div>

              {/* Dropdown Content based on Tab */}
              {filterType === 'month' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      style={{ flex: 1, fontSize: '12px', padding: '6px', borderRadius: '6px' }}
                    >
                      {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <select 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      style={{ flex: 1, fontSize: '12px', padding: '6px', borderRadius: '6px' }}
                    >
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                        <option key={month} value={idx}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={applyMonthFilter} style={{ width: '100%', padding: '8px' }}>Apply Filter</Button>
                </div>
              )}

              {filterType === 'year' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    style={{ width: '100%', fontSize: '12px', padding: '6px', borderRadius: '6px' }}
                  >
                    {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <Button onClick={applyYearFilter} style={{ width: '100%', padding: '8px' }}>Apply Filter</Button>
                </div>
              )}

              {filterType === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="date" 
                      value={customStart} 
                      onChange={(e) => setCustomStart(e.target.value)}
                      style={{ flex: 1, fontSize: '12px', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>to</span>
                    <input 
                      type="date" 
                      value={customEnd} 
                      onChange={(e) => setCustomEnd(e.target.value)}
                      style={{ flex: 1, fontSize: '12px', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                  <Button onClick={applyCustomFilter} style={{ width: '100%', padding: '8px' }}>Apply Filter</Button>
                </div>
              )}
              
              {filterType === 'all' && (
                <div style={{ padding: '8px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  Showing entire performance trade history.
                  <Button onClick={clearFilters} style={{ width: '100%', padding: '8px', marginTop: '8px' }}>Reset to All Time</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Client Profile Header Panel */}
      <Card style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
              color: 'var(--primary-dark)',
              fontSize: '20px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-title)'
            }}>
              {clientName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                  {clientName}
                </h2>
                <span className={`badge ${client.tradingStatus === 'active' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '10px', padding: '3px 10px' }}>
                  {client.tradingStatus.toUpperCase()}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={13} /> {clientEmail}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={13} /> {clientPhone}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                  Client ID: {clientCode}
                  <button 
                    onClick={copyToClipboard}
                    style={{ background: 'none', border: 'none', padding: 0, marginLeft: '6px', cursor: 'pointer', display: 'inline-flex', alignContent: 'center', color: copySuccess ? 'var(--accent)' : 'var(--text-subtle)' }}
                    title="Copy Client ID"
                  >
                    <Copy size={12} />
                  </button>
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <Button 
              onClick={() => router.push(`/admin/clients/${id}`)}
              style={{ 
                padding: '8px 20px', 
                fontSize: '13px', 
                fontWeight: 600,
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                color: 'white'
              }}
            >
              Actions
            </Button>
          </div>
        </div>
      </Card>

      {/* Metrics Row Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        {/* Total P&L Card */}
        <Card 
          style={{ 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            position: 'relative',
            cursor: 'pointer',
            border: statusQuickFilter === 'all' ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
            transition: 'all 0.2s ease'
          }}
          onClick={() => { setStatusQuickFilter('all'); setCurrentPage(1); }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total P&L (₹)</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ₹
            </div>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '8px', color: totalPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontFamily: 'var(--font-title)' }}>
            ₹{totalPnl.toLocaleString('en-IN')}
          </h3>
          <span style={{ fontSize: '11px', color: totalPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            {totalPnl >= 0 ? '↑' : '↓'} {Math.abs(totalPnlPercent).toFixed(2)}% of cap.
          </span>
          <div style={{ position: 'absolute', bottom: '8px', right: '12px', width: '90px', height: '24px' }}>
            <svg width="90" height="24">
              <path d={getSparklinePath(totalPnl >= 0)} fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
            </svg>
          </div>
        </Card>

        {/* Net Profit Card */}
        <Card 
          style={{ 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            position: 'relative',
            cursor: 'pointer',
            border: statusQuickFilter === 'profit' ? '1.5px solid var(--accent)' : '1px solid var(--border-light)',
            transition: 'all 0.2s ease'
          }}
          onClick={() => { setStatusQuickFilter(prev => prev === 'profit' ? 'all' : 'profit'); setCurrentPage(1); }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Net Profit (₹)</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ↑
            </div>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '8px', color: 'var(--color-success)', fontFamily: 'var(--font-title)' }}>
            ₹{netProfit.toLocaleString('en-IN')}
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            ↑ {netProfitPercent.toFixed(2)}% of cap.
          </span>
          <div style={{ position: 'absolute', bottom: '8px', right: '12px', width: '90px', height: '24px' }}>
            <svg width="90" height="24">
              <path d={getSparklinePath(true)} fill="none" stroke="var(--primary)" strokeWidth="1.5" />
            </svg>
          </div>
        </Card>

        {/* Net Loss Card */}
        <Card 
          style={{ 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            position: 'relative',
            cursor: 'pointer',
            border: statusQuickFilter === 'loss' ? '1.5px solid var(--danger)' : '1px solid var(--border-light)',
            transition: 'all 0.2s ease'
          }}
          onClick={() => { setStatusQuickFilter(prev => prev === 'loss' ? 'all' : 'loss'); setCurrentPage(1); }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Net Loss (₹)</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ↓
            </div>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '8px', color: 'var(--color-danger)', fontFamily: 'var(--font-title)' }}>
            ₹{netLoss.toLocaleString('en-IN')}
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            ↓ {netLossPercent.toFixed(2)}% of cap.
          </span>
          <div style={{ position: 'absolute', bottom: '8px', right: '12px', width: '90px', height: '24px' }}>
            <svg width="90" height="24">
              <path d={getSparklinePath(false)} fill="none" stroke="var(--danger)" strokeWidth="1.5" />
            </svg>
          </div>
        </Card>

        {/* Win Rate Card */}
        <Card 
          style={{ 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            position: 'relative',
            cursor: 'pointer',
            border: statusQuickFilter === 'profit' ? '1.5px solid var(--accent)' : '1px solid var(--border-light)',
            transition: 'all 0.2s ease'
          }}
          onClick={() => { setStatusQuickFilter(prev => prev === 'profit' ? 'all' : 'profit'); setCurrentPage(1); }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Win Rate</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              %
            </div>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            {winRate.toFixed(1)}%
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginTop: '4px' }}>
            {winCount} winning trades
          </span>
          <div style={{ position: 'absolute', bottom: '8px', right: '12px', width: '90px', height: '24px' }}>
            <svg width="90" height="24">
              <path d={getSparklinePath(winRate >= 50)} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
            </svg>
          </div>
        </Card>

        {/* Total Trades Card */}
        <Card 
          style={{ 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            position: 'relative',
            cursor: 'pointer',
            border: statusQuickFilter === 'all' ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
            transition: 'all 0.2s ease'
          }}
          onClick={() => { setStatusQuickFilter('all'); setCurrentPage(1); }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Trades</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#1252AB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              #
            </div>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            {totalTradesCount}
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginTop: '4px' }}>
            {closedTrades.length} closed, {openTradesCount} open
          </span>
          <div style={{ position: 'absolute', bottom: '8px', right: '12px', width: '90px', height: '24px' }}>
            <svg width="90" height="24">
              <path d={getSparklinePath(true)} fill="none" stroke="#1252AB" strokeWidth="1.5" />
            </svg>
          </div>
        </Card>
      </div>

      {/* Charts & Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '4.5fr 3.5fr 3fr', gap: '20px' }}>
        {/* P&L Overview (chart) */}
        <Card style={{ padding: '20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
              P&L Overview
            </h4>
            <select
              style={{
                width: '120px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '11px',
                fontWeight: 600,
                outline: 'none',
                background: 'var(--bg-white)',
                color: 'var(--text-heading)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <option value="Daily">Daily</option>
              <option value="Cumulative">Cumulative</option>
            </select>
          </div>
          <PerformanceChart 
            data={pnlHistoryData}
            labels={pnlHistoryLabels}
            strokeColor="var(--primary)"
            fillColorStart="rgba(18, 82, 171, 0.12)"
            fillColorEnd="rgba(18, 82, 171, 0)"
            height={200}
          />
        </Card>

        {/* Performance Summary Box */}
        <Card style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', marginBottom: '16px' }}>
            Performance Summary
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Average Profit (₹)</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>₹{avgProfit.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Max Drawdown</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>₹{maxDrawdownValue.toLocaleString('en-IN')} ({maxDrawdownPercent.toFixed(1)}%)</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Average Loss (₹)</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>₹{avgLoss.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Best Trade (₹)</span>
              <strong style={{ fontSize: '13px', color: 'var(--color-success)' }}>₹{bestTrade.toLocaleString('en-IN')}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Profit Factor</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{profitFactor.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Worst Trade (₹)</span>
              <strong style={{ fontSize: '13px', color: 'var(--color-danger)' }}>₹{worstTrade.toLocaleString('en-IN')}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Sharpe Ratio</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{sharpeRatio.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Expectancy (₹)</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>₹{expectancy.toFixed(2)}</strong>
            </div>
          </div>
        </Card>

        {/* Trade Distribution Donut Chart */}
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', marginBottom: '16px' }}>
            Trade Distribution
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', flex: 1, justifyContent: 'center' }}>
             {/* SVG Donut */}
            <div style={{ width: '130px', height: '130px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.915" fill="transparent"></circle>
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--border-light)" strokeWidth="4.5"></circle>
                
                {/* Winning segment (Green) */}
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--color-success)" strokeWidth="4.5" 
                  strokeDasharray={`${winRate} ${100 - winRate}`} 
                  strokeDashoffset="25"
                />
                {/* Losing segment (Red) */}
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--color-danger)" strokeWidth="4.5" 
                  strokeDasharray={`${lossRate} ${100 - lossRate}`} 
                  strokeDashoffset={`${25 - winRate}`}
                />
                {/* Breakeven / Open segment (Gray) */}
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--text-subtle)" strokeWidth="4.5" 
                  strokeDasharray={`${drawRate} ${100 - drawRate}`} 
                  strokeDashoffset={`${25 - winRate - lossRate}`}
                />
              </svg>
              {/* Center total number */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: '1.3' }}>
                <strong style={{ fontSize: '22px', color: 'var(--text-heading)', fontWeight: 800 }}>{totalTradesCount}</strong>
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Total Trades</span>
              </div>
            </div>

            {/* Labels Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', fontSize: '11px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
                  Winning
                </span>
                <strong>{winCount} ({winRate.toFixed(1)}%)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }} />
                  Losing
                </span>
                <strong>{lossCount} ({lossRate.toFixed(1)}%)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-subtle)' }} />
                  Breakeven / Open
                </span>
                <strong>{drawCount} ({drawRate.toFixed(1)}%)</strong>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions Section */}
      <Card>
        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Transactions
          </h4>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'nowrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', height: '34px', fontSize: '12px', width: '180px' }}
              />
            </div>
            
            <select
              value={strategyFilter}
              onChange={(e) => { setStrategyFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', color: 'var(--text-body)' }}
            >
              <option value="all">All Strategies</option>
              {uniqueStrategies.map((stratName) => (
                <option key={stratName} value={stratName}>
                  {stratName}
                </option>
              ))}
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', color: 'var(--text-body)' }}
            >
              <option value="all">All Types</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>

            <div style={{ position: 'relative' }}>
              <Button 
                variant="secondary" 
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px', fontSize: '12px', padding: '0 12px' }}
              >
                <Download size={14} /> Export
              </Button>
              {isExportDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '40px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 10,
                  minWidth: '130px',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '4px 0'
                }}>
                  <button 
                    onClick={() => { handleExportExcel(); setIsExportDropdownOpen(false); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: 'var(--text-body)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      width: '100%',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-light)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    Export to Excel
                  </button>
                  <button 
                    onClick={() => { handleExportPDF(); setIsExportDropdownOpen(false); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: 'var(--text-body)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      width: '100%',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-light)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    Export to PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Strategy</th>
                <th>Leg</th>
                <th>Type</th>
                <th>Symbol</th>
                <th>Qty</th>
                <th>Entry Price</th>
                <th>Exit Price</th>
                <th>P&L (₹)</th>
                <th>P&L (%)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No transactions executed during this period.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((trade) => {
                  const pnl = Number(trade.pnl || 0);
                  const entryPriceVal = Number(trade.entryPrice || 0);
                  const exitPriceVal = Number(trade.exitPrice || 0);
                  
                  // Calculate P&L %
                  let pnlPercent = 0;
                  if (entryPriceVal > 0) {
                    pnlPercent = (pnl / (entryPriceVal * trade.quantity)) * 100;
                  }
                  
                  // Dynamically calculate transaction type from strategy config action
                  let transactionType = 'BUY';
                  const tDir = (trade.direction || '').toLowerCase();
                  if (tDir === 'short' || tDir === 'sell') transactionType = 'SELL';
                  if (transactionType !== 'SELL') {
                    try {
                      const config = JSON.parse(trade.strategy?.configJson || '{}');
                      const leg = config?.legs?.[0]?.tradeAction;
                      const action = leg?.action || config?.tradeAction?.action || 'Long';
                      if (action.toLowerCase() === 'short' || action.toLowerCase() === 'sell') {
                        transactionType = 'SELL';
                      }
                    } catch (e) {}
                  }
                  const isBuy = transactionType === 'BUY';
                  const strategyName = trade.strategy?.name || trade.strategyName || 'Pre-Open Momentum';

                  return (
                    <tr 
                      key={trade.id}
                      onClick={() => {
                        console.log('Selected trade:', trade);
                        setSelectedTrade(trade);
                      }}
                      style={{ cursor: 'pointer' }}
                      title="Click to view full trade details"
                    >
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {formatDateTime(trade.entryTime || trade.createdAt)}
                      </td>
                      <td style={{ fontWeight: 500 }}>{strategyName}</td>
                      <td style={{ fontSize: '12px' }}>{trade.legName ? `${trade.legName} (${trade.direction || ''})` : '--'}</td>
                      <td>
                        <span className={`badge ${isBuy ? 'badge-blue' : 'badge-red'}`} style={{ padding: '3px 8px', fontSize: '10px' }}>
                          {transactionType}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{trade.symbol}</td>
                      <td>{trade.quantity}</td>
                      <td>₹{entryPriceVal.toFixed(2)}</td>
                      <td>{exitPriceVal ? `₹${exitPriceVal.toFixed(2)}` : '--'}</td>
                      <td style={{ fontWeight: 600, color: pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {pnl >= 0 ? `+₹${pnl.toFixed(2)}` : `-₹${Math.abs(pnl).toFixed(2)}`}
                      </td>
                      <td style={{ fontWeight: 600, color: pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {pnlPercent >= 0 ? `+${pnlPercent.toFixed(2)}%` : `${pnlPercent.toFixed(2)}%`}
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

        {/* Table Pagination Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>
            Showing {filteredTransactions.length ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, filteredTransactions.length)} of {filteredTransactions.length} entries
          </span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Page selection controls */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                &lt;
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  style={{ 
                    padding: '4px 10px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-color)', 
                    background: currentPage === i + 1 ? 'var(--primary)' : 'var(--bg-white)', 
                    color: currentPage === i + 1 ? 'white' : 'var(--text-body)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {i + 1}
                </button>
              ))}
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                &gt;
              </button>
            </div>
            
            {/* Page size dropdown */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: 'pointer', outline: 'none' }}
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Trade Details / Failure Reason Modal */}
      <Modal 
        isOpen={!!selectedTrade} 
        onClose={() => setSelectedTrade(null)} 
        title="Order Execution details"
      >
        {selectedTrade && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Symbol</span>
                <strong style={{ fontSize: '15px' }}>{selectedTrade.symbol}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Strategy Name</span>
                <strong>{selectedTrade.strategy?.name || selectedTrade.strategyName || 'Pre-Open Momentum'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Client Name</span>
                <strong>{clientName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Order Product / Type</span>
                <span>{selectedTrade.orderType} / MIS</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Leg</span>
                <span>{selectedTrade.legName ? `${selectedTrade.legName} (${selectedTrade.direction || ''} / ${selectedTrade.legTimeframe || ''})` : '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Quantity</span>
                <span>{selectedTrade.quantity} shares</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Total Invested</span>
                <span>₹{(Number(selectedTrade.entryPrice || 0) * selectedTrade.quantity).toFixed(2)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Entry Time</span>
                <span>{formatDateTime(selectedTrade.entryTime || selectedTrade.createdAt)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Orig Entry Price</span>
                <span>₹{selectedTrade.originalEntryPrice ? Number(selectedTrade.originalEntryPrice).toFixed(2) : '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Tick Rounded Entry Price</span>
                <span>₹{Number(selectedTrade.entryPrice || 0).toFixed(2)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Orig Stop Loss</span>
                <span>₹{selectedTrade.originalStopLoss ? Number(selectedTrade.originalStopLoss).toFixed(2) : '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Tick Rounded Stop Loss</span>
                <span>₹{selectedTrade.stopLoss ? Number(selectedTrade.stopLoss).toFixed(2) : '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Orig Target</span>
                <span>₹{selectedTrade.originalTarget ? Number(selectedTrade.originalTarget).toFixed(2) : '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Tick Rounded Target</span>
                <span>₹{selectedTrade.target ? Number(selectedTrade.target).toFixed(2) : '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>SL Trigger Price</span>
                <span>{selectedTrade.slTriggerPrice ? `₹${Number(selectedTrade.slTriggerPrice).toFixed(2)}` : '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Exit Time</span>
                <span>{formatDateTime(selectedTrade.exitTime)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Exit Price</span>
                <span>{selectedTrade.exitPrice ? `₹${Number(selectedTrade.exitPrice).toFixed(2)}` : '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Status</span>
                <span className={`badge ${selectedTrade.status.toLowerCase() === 'open' ? 'badge-info' : selectedTrade.status.toLowerCase() === 'failed' ? 'badge-red' : 'badge-success'}`}>
                  {selectedTrade.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Failure/Kite Response Details */}
            {selectedTrade.status.toLowerCase() === 'failed' && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <XCircle size={18} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <h5 style={{ color: '#991b1b', fontWeight: 600, fontSize: '13px' }}>Kite Rejection Reason:</h5>
                  <p style={{ color: '#b91c1c', fontSize: '13px', marginTop: '4px', lineHeight: '1.4' }}>
                    {selectedTrade.kiteResponse?.message || selectedTrade.kiteResponse?.status || 'No specific error message received from Zerodha API.'}
                  </p>
                </div>
              </div>
            )}

            {/* Raw JSON logs */}
            {selectedTrade.kiteResponse && (
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Raw Zerodha API Response Logs
                </span>
                <pre style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  fontSize: '11px', 
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  maxHeight: '180px',
                  lineHeight: '1.4',
                  color: 'var(--text-primary)'
                }}>
                  {JSON.stringify(selectedTrade.kiteResponse, null, 2)}
                </pre>
              </div>
            )}

            {/* SL Kite Response */}
            {selectedTrade.slKiteResponse && (
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  SL Order Kite Response Logs
                </span>
                <pre style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '180px', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                  {JSON.stringify(selectedTrade.slKiteResponse, null, 2)}
                </pre>
              </div>
            )}

            {/* Target Kite Response */}
            {selectedTrade.targetKiteResponse && (
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Target Order Kite Response Logs
                </span>
                <pre style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '180px', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                  {JSON.stringify(selectedTrade.targetKiteResponse, null, 2)}
                </pre>
              </div>
            )}

            <Button onClick={() => setSelectedTrade(null)} style={{ marginTop: '8px' }}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
