'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '../../../../../views/components/Card';
import { Button } from '../../../../../views/components/Button';
import { PerformanceChart } from '../../../../../views/components/PerformanceChart';
import { 
  ArrowLeft, 
  Calendar, 
  ChevronRight, 
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
  Percent
} from 'lucide-react';
import { useAppViewModel } from '../../../../../viewmodels/AppContext';
import { api } from '../../../../../lib/api';
import { API_ENDPOINTS, APP_ROUTES } from '../../../../../lib/constants';

const formatDateTime = (timeStr: string | Date | null) => {
  if (!timeStr) return '--';
  try {
    const date = new Date(timeStr);
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  // Metric calculation
  const totalTradesCount = clientTrades.length;
  const closedTrades = clientTrades.filter(t => t.status.toLowerCase() !== 'open');
  const openTradesCount = clientTrades.filter(t => t.status.toLowerCase() === 'open').length;
  
  const winningTrades = closedTrades.filter(t => Number(t.pnl || 0) > 0);
  const losingTrades = closedTrades.filter(t => Number(t.pnl || 0) < 0);
  const breakevenTrades = closedTrades.filter(t => Number(t.pnl || 0) === 0);

  const winCount = winningTrades.length;
  const lossCount = losingTrades.length;
  const drawCount = breakevenTrades.length + openTradesCount; // Open trades are considered neutral/breakeven here

  const winRate = closedTrades.length ? (winCount / closedTrades.length) * 100 : 0;
  const lossRate = closedTrades.length ? (lossCount / closedTrades.length) * 100 : 0;
  const drawRate = totalTradesCount ? (drawCount / totalTradesCount) * 100 : 0;

  const totalPnl = clientTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
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
  if (clientTrades.length > 0) {
    let runningSum = 0;
    const sortedTrades = [...clientTrades].sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
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
  if (clientTrades.length > 0) {
    const times = clientTrades
      .map(t => new Date(t.createdAt).getTime())
      .filter(t => !isNaN(t));
    if (times.length > 0) {
      const minDate = new Date(Math.min(...times));
      const maxDate = new Date(Math.max(...times));
      dateRangeStr = `${minDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} - ${maxDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
  }

  // Filter transaction list
  const filteredTransactions = clientTrades.filter(t => {
    const strategyName = (t.strategy?.name || t.strategyName || '').toLowerCase();
    const symbolStr = (t.symbol || '').toLowerCase();
    const typeStr = (t.orderType || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = strategyName.includes(query) || symbolStr.includes(query);
    const matchesStrategy = strategyFilter === 'all' || strategyName.includes(strategyFilter.toLowerCase());
    const matchesType = typeFilter === 'all' || typeStr === typeFilter.toLowerCase();

    return matchesSearch && matchesStrategy && matchesType;
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => router.push(APP_ROUTES.ADMIN_CLIENTS)}>Clients</span>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-heading)', fontWeight: 500 }}>Client Performance</span>
        </div>
        
        {/* Date Selector Pill */}
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
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
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
        <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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
        <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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
        <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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
        <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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
        <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Trades</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              <path d={getSparklinePath(true)} fill="none" stroke="#6366f1" strokeWidth="1.5" />
            </svg>
          </div>
        </Card>
      </div>

      {/* Charts & Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '4.5fr 3.5fr 3fr', gap: '20px' }}>
        {/* P&L Overview (chart) */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
              P&L Overview
            </h4>
            <select style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '11px', fontWeight: 600, outline: 'none' }}>
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
            <div style={{ width: '100px', height: '100px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.915" fill="#fff"></circle>
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4.5"></circle>
                
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
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>
                <strong style={{ fontSize: '16px', color: 'var(--text-heading)' }}>{totalTradesCount}</strong>
                <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Trades</span>
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
              onChange={(e) => setStrategyFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'white' }}
            >
              <option value="all">All Strategies</option>
              <option value="Breakout">Breakout</option>
              <option value="Momentum">Momentum</option>
              <option value="Fade">Fade</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'white' }}
            >
              <option value="all">All Types</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>

            <Button variant="secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px', fontSize: '12px', padding: '0 12px' }}>
              <Download size={14} /> Export
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
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
                <th>P&L (₹)</th>
                <th>P&L (%)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
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
                  
                  const isBuy = trade.orderType?.toUpperCase() === 'BUY';
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
                      <td>
                        <span className={`badge ${isBuy ? 'badge-blue' : 'badge-red'}`} style={{ padding: '3px 8px', fontSize: '10px' }}>
                          {trade.orderType}
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
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
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
                    background: currentPage === i + 1 ? 'var(--primary)' : 'white', 
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
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
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
              style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', outline: 'none' }}
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Trade Details Modal */}
      {selectedTrade && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }} onClick={() => setSelectedTrade(null)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', margin: 0, fontFamily: 'var(--font-title)' }}>
                  Trade Details
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {selectedTrade.id}</span>
              </div>
              <button 
                onClick={() => setSelectedTrade(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Top Row Strategy & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Strategy</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {selectedTrade.strategy?.name || selectedTrade.strategyName || 'Pre-Open Momentum'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Execution Status</span>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`badge ${
                      selectedTrade.status.toLowerCase() === 'open' 
                        ? 'badge-info' 
                        : selectedTrade.status.toLowerCase() === 'failed' 
                          ? 'badge-danger' 
                          : selectedTrade.status.toLowerCase() === 'cancelled'
                            ? 'badge-warning'
                            : 'badge-success'
                    }`} style={{ fontSize: '11px', padding: '4px 12px' }}>
                      {selectedTrade.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Quantity Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '16px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Symbol</span>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-heading)', marginTop: '2px' }}>{selectedTrade.symbol}</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</span>
                  <div style={{ marginTop: '2px' }}>
                    <span className={`badge ${selectedTrade.orderType?.toUpperCase() === 'BUY' ? 'badge-blue' : 'badge-red'}`} style={{ padding: '2px 8px', fontSize: '9px' }}>
                      {selectedTrade.orderType}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quantity</span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{selectedTrade.quantity}</div>
                </div>

                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Entry Price</span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    ₹{Number(selectedTrade.entryPrice || 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Exit Price</span>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedTrade.exitPrice ? `₹${Number(selectedTrade.exitPrice).toFixed(2)}` : '--'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net P&L</span>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 800, 
                    marginTop: '2px',
                    color: Number(selectedTrade.pnl || 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                  }}>
                    {Number(selectedTrade.pnl || 0) >= 0 ? `+₹${Number(selectedTrade.pnl || 0).toFixed(2)}` : `-₹${Math.abs(Number(selectedTrade.pnl || 0)).toFixed(2)}`}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stop Loss</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {selectedTrade.stopLoss ? `₹${Number(selectedTrade.stopLoss).toFixed(2)}` : '--'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {selectedTrade.target ? `₹${Number(selectedTrade.target).toFixed(2)}` : '--'}
                  </div>
                </div>
                <div></div>
              </div>

              {/* Time stamps */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Entry Time</span>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {formatDateTime(selectedTrade.entryTime || selectedTrade.createdAt)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Exit Time</span>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {selectedTrade.exitTime ? formatDateTime(selectedTrade.exitTime) : '--'}
                  </div>
                </div>
              </div>

              {/* Kite API Response Logs */}
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Kite Response / Execution logs</span>
                <div style={{ 
                  marginTop: '6px', 
                  backgroundColor: '#0f172a', 
                  color: '#e2e8f0', 
                  padding: '16px', 
                  borderRadius: '10px', 
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  maxHeight: '180px',
                  whiteSpace: 'pre-wrap',
                  border: '1px solid #1e293b'
                }}>
                  {selectedTrade.kiteResponse 
                    ? JSON.stringify(selectedTrade.kiteResponse, null, 2) 
                    : 'No broker response received.'
                  }
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ 
              padding: '16px 24px', 
              borderTop: '1px solid var(--border-color)', 
              display: 'flex', 
              justifyContent: 'flex-end',
              background: '#f8fafc',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px'
            }}>
              <Button onClick={() => setSelectedTrade(null)} variant="secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
