'use client';

import React, { useState, useMemo } from 'react';
import { useAppViewModel } from '../../../../shared/viewmodels/AppContext';
import { Card } from '../../../../shared/components/views/Card';
import { Loader } from '../../../../shared/components/views/Loader';
import { Button } from '../../../../shared/components/views/Button';
import { Modal } from '../../../../shared/components/views/Modal';
import {
  Activity, Download,
  Search, TrendingUp, TrendingDown, CheckCircle, AlertCircle, XCircle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

function LegCell({ leg }: { leg: any }) {
  if (!leg) return <td style={{ color: 'var(--text-muted)', fontSize: '11px', verticalAlign: 'top' }}>N/A</td>;
  const dir = (leg.direction || '').toLowerCase();
  const isFilled = (leg.entryOrderStatus || '').toLowerCase() === 'filled';
  const color = isFilled ? (dir === 'long' ? 'var(--color-success)' : 'var(--color-danger)') : 'var(--text-muted)';
  return (
    <td style={{ fontSize: '11px', lineHeight: '1.6', verticalAlign: 'top' }}>
      <div style={{ fontWeight: 600, color, fontSize: '12px', marginBottom: '2px' }}>
        {dir === 'long' ? <ArrowUpRight size={11} style={{ display: 'inline', marginRight: 2 }} /> : <ArrowDownRight size={11} style={{ display: 'inline', marginRight: 2 }} />}
        {leg.direction || '--'} | Qty: {leg.quantity || 0}
      </div>
      <div>Entry: ₹{Number(leg.entryPrice || 0).toFixed(2)}</div>
      <div>SL: ₹{Number(leg.stopLoss || 0).toFixed(2)} | Tgt: ₹{Number(leg.target || 0).toFixed(2)}</div>
      <div style={{ marginTop: '2px', display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
        <span className={`badge ${(leg.entryOrderStatus || '').toLowerCase() === 'filled' ? 'badge-success' : (leg.entryOrderStatus || '').toLowerCase() === 'cancelled' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
          E:{(leg.entryOrderStatus || '--').toUpperCase().slice(0,4)}
        </span>
        <span className={`badge ${(leg.slOrderStatus || '').toLowerCase() === 'filled' ? 'badge-success' : (leg.slOrderStatus || '').toLowerCase() === 'cancelled' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
          SL:{(leg.slOrderStatus || '--').toUpperCase().slice(0,4)}
        </span>
        <span className={`badge ${(leg.targetOrderStatus || '').toLowerCase() === 'filled' ? 'badge-success' : (leg.targetOrderStatus || '').toLowerCase() === 'cancelled' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
          T:{(leg.targetOrderStatus || '--').toUpperCase().slice(0,4)}
        </span>
      </div>
    </td>
  );
}

function LegDetailCard({ leg, title, color }: { leg: any; title: string; color: string }) {
  if (!leg) return null;
  const eStat = (leg.entryOrderStatus || '').toLowerCase();
  return (
    <div style={{ flex: 1, padding: '14px', borderRadius: '10px', background: 'var(--surface)', border: `1px solid ${color}33` }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {color === 'var(--color-success)' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {title}
      </div>
            <div className="td-leg-detail" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Entry:</span><span style={{ fontWeight: 600 }}>₹{Number(leg.entryPrice || 0).toFixed(2)}</span>
        <span style={{ color: 'var(--text-secondary)' }}>SL:</span><span style={{ fontWeight: 600 }}>₹{Number(leg.stopLoss || 0).toFixed(2)}</span>
        <span style={{ color: 'var(--text-secondary)' }}>Target:</span><span style={{ fontWeight: 600 }}>₹{Number(leg.target || 0).toFixed(2)}</span>
        <span style={{ color: 'var(--text-secondary)' }}>Qty:</span><span style={{ fontWeight: 600 }}>{leg.quantity || 0}</span>
        <span style={{ color: 'var(--text-secondary)' }}>Timeframe:</span><span style={{ fontWeight: 600 }}>{leg.legTimeframe || '--'}</span>
        <span style={{ color: 'var(--text-secondary)' }}>Entry Order:</span>
        <span className={`badge ${eStat === 'filled' ? 'badge-success' : eStat === 'cancelled' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '9px', justifySelf: 'start' }}>
          {(leg.entryOrderStatus || '--').toUpperCase()}
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>SL Order:</span>
        <span className={`badge ${(leg.slOrderStatus || '').toLowerCase() === 'filled' ? 'badge-success' : (leg.slOrderStatus || '').toLowerCase() === 'cancelled' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '9px', justifySelf: 'start' }}>
          {(leg.slOrderStatus || '--').toUpperCase()}
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>Target Order:</span>
        <span className={`badge ${(leg.targetOrderStatus || '').toLowerCase() === 'filled' ? 'badge-success' : (leg.targetOrderStatus || '').toLowerCase() === 'cancelled' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '9px', justifySelf: 'start' }}>
          {(leg.targetOrderStatus || '--').toUpperCase()}
        </span>
      </div>
    </div>
  );
}

function ModalLegSection({ leg, title, color }: { leg: any; title: string; color: string }) {
  if (!leg) return null;
  const fields = [
    ['Direction', leg.direction || '--'],
    ['Leg Name', leg.legName || '--'],
    ['Timeframe', leg.legTimeframe || '--'],
    ['Quantity', `${leg.quantity || 0} shares`],
    ['Total Invested', `₹${(Number(leg.entryPrice || 0) * (leg.quantity || 0)).toFixed(2)}`],
    ['Orig Entry Price', leg.originalEntryPrice ? `₹${Number(leg.originalEntryPrice).toFixed(2)}` : '--'],
    ['Tick Rounded Entry', `₹${Number(leg.entryPrice || 0).toFixed(2)}`],
    ['Orig Stop Loss', leg.originalStopLoss ? `₹${Number(leg.originalStopLoss).toFixed(2)}` : '--'],
    ['Tick Rounded SL', leg.stopLoss ? `₹${Number(leg.stopLoss).toFixed(2)}` : '--'],
    ['Orig Target', leg.originalTarget ? `₹${Number(leg.originalTarget).toFixed(2)}` : '--'],
    ['Tick Rounded Target', leg.target ? `₹${Number(leg.target).toFixed(2)}` : '--'],
    ['SL Trigger Price', leg.slTriggerPrice ? `₹${Number(leg.slTriggerPrice).toFixed(2)}` : '--'],
    ['Entry Order ID', leg.entryOrderId || '--'],
    ['SL Order ID', leg.slOrderId || '--'],
    ['Target Order ID', leg.targetOrderId || '--'],
    ['Entry Order Status', leg.entryOrderStatus?.toUpperCase() || '--'],
    ['SL Order Status', leg.slOrderStatus?.toUpperCase() || '--'],
    ['Target Order Status', leg.targetOrderStatus?.toUpperCase() || '--'],
    ['Exit Time', formatDateTime(leg.exitTime)],
    ['Exit Price', leg.exitPrice ? `₹${Number(leg.exitPrice).toFixed(2)}` : '--'],
  ];
  return (
    <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: '14px', marginBottom: '20px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: 700, color, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {color === 'var(--color-success)' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        {title}
      </h4>
      <div className="td-modal-leg-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '12px' }}>
        {fields.map(([label, value]) => (
          <div key={label}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '10px', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
            <span style={{ fontWeight: label.includes('Status') ? 400 : 600 }}>{value}</span>
          </div>
        ))}
      </div>
      {leg.kiteResponse && (
        <div style={{ marginTop: '12px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Entry Kite Response</span>
          <pre style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '120px', lineHeight: '1.3', color: 'var(--text-primary)' }}>
            {JSON.stringify(leg.kiteResponse, null, 2)}
          </pre>
        </div>
      )}
      {leg.slKiteResponse && (
        <div style={{ marginTop: '8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>SL Kite Response</span>
          <pre style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '120px', lineHeight: '1.3', color: 'var(--text-primary)' }}>
            {JSON.stringify(leg.slKiteResponse, null, 2)}
          </pre>
        </div>
      )}
      {leg.targetKiteResponse && (
        <div style={{ marginTop: '8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Target Kite Response</span>
          <pre style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '120px', lineHeight: '1.3', color: 'var(--text-primary)' }}>
            {JSON.stringify(leg.targetKiteResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

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

export default function LiveTradeTransactionsPage() {
  const { trades = [], loading } = useAppViewModel();
  const [selectedTrade, setSelectedTrade] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [strategyFilter, setStrategyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const getTransactionType = (trade: any) => {
    if (!trade) return 'BUY';
    const dir = (trade.direction || '').toLowerCase();
    if (dir === 'short' || dir === 'sell') return 'SELL';
    try {
      const config = JSON.parse(trade.strategy?.configJson || '{}');
      const leg = config?.legs?.[0]?.tradeAction;
      const action = (leg?.action || config?.tradeAction?.action || '').toLowerCase();
      if (action === 'short' || action === 'sell') return 'SELL';
    } catch (e) {}
    return 'BUY';
  };

  function mergeOcoTrades(trades: any[]): any[] {
    const ocoMap = new Map<string, any[]>();
    const solo: any[] = [];
    for (const t of trades) {
      if (t.dualLegGroupId) {
        const arr = ocoMap.get(t.dualLegGroupId) || [];
        arr.push(t);
        ocoMap.set(t.dualLegGroupId, arr);
      } else {
        solo.push(t);
      }
    }
    const merged: any[] = [];
    for (const [, group] of ocoMap) {
      const sorted = [...group].sort((a, b) => {
        const aIdx = parseInt(a.legName?.replace('Leg ', '') || '0');
        const bIdx = parseInt(b.legName?.replace('Leg ', '') || '0');
        return aIdx - bIdx;
      });
      const hasActive = group.some((t: any) => t.status === 'open');
      const filledLeg = sorted.find((l: any) => (l.entryOrderStatus || '').toLowerCase() === 'filled');
      merged.push({
        _isOcoMerged: true,
        dualLegGroupId: group[0].dualLegGroupId,
        legs: sorted,
        symbol: group[0].symbol,
        clientName: group[0].client?.user?.name || group[0].clientName || 'System Client',
        strategyName: group[0].strategy?.name || group[0].strategyName || 'Pre-Open Momentum',
        entryTime: sorted[0]?.entryTime || group[0].entryTime,
        createdAt: group[0].createdAt,
        status: hasActive ? 'active' : (filledLeg ? filledLeg.status : 'cancelled'),
        strategy: group[0].strategy,
        client: group[0].client,
      });
    }
    return [...merged, ...solo];
  }

  function getOcoStatus(merged: any): { label: string; color: string } {
    const legs: any[] = merged.legs || [];
    const filled = legs.filter((l: any) => (l.entryOrderStatus || '').toLowerCase() === 'filled');
    const pending = legs.filter((l: any) => (l.entryOrderStatus || '').toLowerCase() === 'pending');
    const cancelled = legs.filter((l: any) => (l.status || '').toLowerCase() === 'cancelled');
    if (filled.length === 1 && cancelled.length === legs.length - 1) {
      const activeLeg = filled[0];
      if ((activeLeg.status || '').toLowerCase() === 'open') {
        return { label: `${activeLeg.legName || 'LEG'} ACTIVE`, color: 'var(--color-success)' };
      } else {
        const s = (activeLeg.status || '').toUpperCase();
        return { label: `${activeLeg.legName || 'LEG'} ${s}`, color: s.includes('HIT') ? 'var(--color-danger)' : 'var(--text-secondary)' };
      }
    }
    if (filled.length > 0) {
      const names = filled.map((l: any) => l.legName || 'LEG').join('+');
      return { label: `${names} FILLED`, color: 'var(--color-success)' };
    }
    if (pending.length > 0) {
      return { label: `${pending.length} PENDING`, color: 'var(--warning)' };
    }
    if (cancelled.length === legs.length && legs.length > 0) {
      return { label: 'ALL CANCELLED', color: 'var(--text-muted)' };
    }
    return { label: (merged.status || '').toUpperCase(), color: 'var(--text-secondary)' };
  }

  const getOrderStatusBadgeClass = (status: string) => {
    if (!status) return 'badge-blue';
    const s = status.toUpperCase();
    if (s === 'COMPLETE') return 'badge-green';
    if (s === 'CANCELLED' || s === 'REJECTED') return 'badge-red';
    return 'badge-blue';
  };

  const uniqueClients = useMemo(
    () => Array.from(new Set((trades || []).map(t => t?.client?.user?.name || t?.clientName).filter(Boolean))) as string[],
    [trades]
  );
  const uniqueStrategies = useMemo(
    () => Array.from(new Set((trades || []).map(t => t?.strategy?.name || t?.strategyName).filter(Boolean))) as string[],
    [trades]
  );
  const mergedRows = useMemo(() => {
    const merged = mergeOcoTrades(trades || []);
    return merged.sort((a, b) => {
      const dateA = new Date(a.entryTime || a.createdAt || 0).getTime();
      const dateB = new Date(b.entryTime || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [trades]);

  const maxLegCount = useMemo(() => {
    let max = 0;
    for (const row of mergedRows) {
      if (row._isOcoMerged && row.legs) {
        max = Math.max(max, row.legs.length);
      }
    }
    return max;
  }, [mergedRows]);

  const filteredTrades = useMemo(() => {
    return mergedRows.filter(row => {
      if (!row) return false;
      const symbol = (row.symbol || '').toLowerCase();
      const strategy = (row.strategyName || '').toLowerCase();
      const client = (row.clientName || '').toLowerCase();
      const status = (row.status || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = symbol.includes(query) || strategy.includes(query) || client.includes(query);
      const matchesClient = clientFilter === 'all' || client === clientFilter.toLowerCase();
      const matchesStrategy = strategyFilter === 'all' || strategy === strategyFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();
      const matchesType = typeFilter === 'all'; // type filter only applies to solo rows

      return matchesSearch && matchesClient && matchesStrategy && matchesType && matchesStatus;
    });
  }, [mergedRows, searchQuery, clientFilter, strategyFilter, typeFilter, statusFilter]);

  const openTrades = useMemo(() => trades.filter(t => (t.status || '').toLowerCase() === 'open'), [trades]);
  const closedTrades = useMemo(() => trades.filter(t => (t.status || '').toLowerCase() === 'closed' || (t.status || '').toLowerCase() === 'success'), [trades]);
  const failedTrades = useMemo(() => trades.filter(t => (t.status || '').toLowerCase() === 'failed'), [trades]);
  const cancelledTrades = useMemo(() => trades.filter(t => (t.status || '').toLowerCase() === 'cancelled'), [trades]);

  const totalPnl = useMemo(() => trades.reduce((sum, t) => sum + Number(t.pnl || 0), 0), [trades]);
  const openInvestment = useMemo(
    () => openTrades.reduce((sum, t) => sum + Number(t.entryPrice || 0) * Number(t.quantity || 0), 0),
    [openTrades]
  );
  const closedPnl = useMemo(
    () => closedTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0),
    [closedTrades]
  );

  const totalPages = Math.ceil(filteredTrades.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTrades = filteredTrades.slice(startIndex, startIndex + pageSize);

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Client Name', 'Strategy', 'Type', 'Symbol', 'Quantity', 'Entry Price', 'Exit Price', 'P&L (INR)', 'Status', 'Date Time'];
    const rows = filteredTrades.map(t => {
      const txType = getTransactionType(t);
      return [
        t.entryOrderId || t.id?.slice(0, 10),
        t.client?.user?.name || t.clientName || 'System Client',
        t.strategy?.name || t.strategyName || 'Pre-Open Momentum',
        txType,
        t.symbol,
        t.quantity || 0,
        Number(t.entryPrice || 0).toFixed(2),
        t.exitPrice ? Number(t.exitPrice).toFixed(2) : '--',
        Number(t.pnl || 0).toFixed(2),
        t.status?.toUpperCase() || 'OPEN',
        formatDateTime(t.entryTime || t.createdAt)
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
    link.setAttribute('download', `live_trade_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <Loader title="Loading trade transactions" text="Compiling broker logs and transaction records..." fullscreen={false} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="td-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Live Trade Transactions
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>View logs of all trades, quantities, symbols, and P&L statements.</p>
        </div>
        <Button variant="secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="td-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Total Trades</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{trades.length}</h3>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <Activity size={20} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Active (Open)</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{openTrades.length}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>₹{openInvestment.toLocaleString('en-IN', { minimumFractionDigits: 2 })} invested</p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <TrendingUp size={20} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Closed (Success)</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{closedTrades.length}</h3>
              <p style={{ color: closedPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '11px', marginTop: '2px', fontWeight: 600 }}>
                {closedPnl >= 0 ? '+' : ''}₹{closedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <CheckCircle size={20} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Failed / Cancelled</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{failedTrades.length + cancelledTrades.length}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                {failedTrades.length} failed, {cancelledTrades.length} cancelled
              </p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <AlertCircle size={20} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Total P&L</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: totalPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>Across all transactions</p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: totalPnl >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: totalPnl >= 0 ? '#10b981' : '#ef4444' }}>
              {totalPnl >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <div className="td-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Trade Transaction Log ({filteredTrades.length})
          </h3>
        </div>

        {/* Filters */}
        <div className="td-filters" style={{
          display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center',
          flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '12px 16px',
          borderRadius: '12px', border: '1px solid var(--border-color)'
        }}>
          <div style={{ position: 'relative', flex: '2 1 200px', minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search by symbol, strategy, client..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ paddingLeft: '32px', height: '34px', fontSize: '12px', width: '100%', outline: 'none', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
            />
          </div>

          <select value={clientFilter} onChange={(e) => { setClientFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', flex: '1 1 130px', minWidth: '120px' }}>
            <option value="all">All Clients</option>
            {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={strategyFilter} onChange={(e) => { setStrategyFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', flex: '1 1 140px', minWidth: '130px' }}>
            <option value="all">All Strategies</option>
            {uniqueStrategies.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', flex: '1 1 100px', minWidth: '90px' }}>
            <option value="all">All Types</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>

          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', flex: '1 1 110px', minWidth: '100px' }}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: mergedRows.some(r => r._isOcoMerged) ? `${700 + (maxLegCount * 160)}px` : undefined }}>
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Date & Time</th>
                <th style={{ whiteSpace: 'nowrap' }}>Client</th>
                <th style={{ whiteSpace: 'nowrap' }}>Strategy</th>
                <th style={{ whiteSpace: 'nowrap' }}>Symbol</th>
                <th style={{ whiteSpace: 'nowrap' }}>Type</th>
                {Array.from({ length: maxLegCount }).map((_, i) => (
                  <th key={`leg-hdr-${i}`} style={{ minWidth: '155px', whiteSpace: 'nowrap' }}>
                    Leg {i + 1} <span style={{ fontWeight: 400, fontSize: 10, color: 'var(--text-muted)' }}>Entry/SL/Tgt/Qty</span>
                  </th>
                ))}
                <th style={{ whiteSpace: 'nowrap' }}>Exit Reason</th>
                <th style={{ whiteSpace: 'nowrap' }}>Exit Price</th>
                <th style={{ whiteSpace: 'nowrap' }}>Exit Time</th>
                <th style={{ whiteSpace: 'nowrap' }}>OCO Status</th>
                <th style={{ whiteSpace: 'nowrap' }}>P&L (₹)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.length === 0 ? (
                <tr>
                  <td colSpan={4 + maxLegCount + 6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    {searchQuery || clientFilter !== 'all' || strategyFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all'
                      ? 'No trades match the selected filters.'
                      : 'No trade transactions triggered yet.'}
                  </td>
                </tr>
              ) : (
                paginatedTrades.map((row: any, idx: number) => {
                  if (row._isOcoMerged) {
                    const oco = getOcoStatus(row);
                    const totalPnl = (row.legs || []).reduce((sum: number, l: any) => sum + Number(l.pnl || 0), 0);
                    const activeLeg = (row.legs || []).find((l: any) => (l.entryOrderStatus || '').toLowerCase() === 'filled');
                    return (
                      <tr key={row.dualLegGroupId}
                        onClick={() => { setSelectedTrade(row); }}
                        style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDateTime(row.entryTime)}</td>
                        <td style={{ fontWeight: 500, fontSize: '12px', whiteSpace: 'nowrap' }}>{row.clientName}</td>
                        <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{row.strategyName}</td>
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{row.symbol}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {(row.legs || []).map((l: any, i: number) => {
                            const tx = (l.direction || '').toLowerCase() === 'short' ? 'SELL' : 'BUY';
                            return (
                              <span key={i} className={`badge ${tx === 'BUY' ? 'badge-blue' : 'badge-red'}`} style={{ fontSize: '9px', marginRight: 2 }}>
                                {tx}
                              </span>
                            );
                          })}
                        </td>
                        {Array.from({ length: maxLegCount }).map((_, i) => {
                          const leg = (row.legs || [])[i];
                          return <LegCell key={`leg-${i}`} leg={leg} />;
                        })}
                        <td style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{activeLeg?.exitReason || '--'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{activeLeg?.exitPrice ? `₹${Number(activeLeg.exitPrice).toFixed(2)}` : '--'}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDateTime(activeLeg?.exitTime)}</td>
                        <td>
                          <span className={`badge ${oco.color === 'var(--color-success)' ? 'badge-success' : oco.color === 'var(--warning)' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
                            {oco.label}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '13px', color: totalPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)', whiteSpace: 'nowrap' }}>
                          {totalPnl >= 0 ? `+₹${totalPnl.toFixed(2)}` : `-₹${Math.abs(totalPnl).toFixed(2)}`}
                        </td>
                      </tr>
                    );
                  }
                  // Solo trade (non-OCO)
                  const pnl = Number(row.pnl || 0);
                  const entryPriceVal = Number(row.entryPrice || 0);
                  const txType = (row.direction || '').toLowerCase() === 'short' ? 'SELL' : 'BUY';
                  return (
                    <tr key={row.id || idx}
                      onClick={() => setSelectedTrade(row)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDateTime(row.entryTime || row.createdAt)}</td>
                      <td style={{ fontWeight: 500, fontSize: '12px', whiteSpace: 'nowrap' }}>{row.client?.user?.name || row.clientName || 'System Client'}</td>
                      <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{row.strategy?.name || row.strategyName || 'Pre-Open Momentum'}</td>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{row.symbol}</td>
                      <td>
                        <span className={`badge ${txType === 'BUY' ? 'badge-blue' : 'badge-red'}`} style={{ padding: '3px 8px', fontSize: '10px' }}>{txType}</span>
                      </td>
                      <td colSpan={maxLegCount} style={{ fontSize: '11px', verticalAlign: 'top' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span>{row.legName ? `${row.legName}` : '--'}</span>
                          <span>Qty: {row.quantity || 0}</span>
                          <span>Entry: ₹{entryPriceVal.toFixed(2)}</span>
                          {row.stopLoss && <span>SL: ₹{Number(row.stopLoss).toFixed(2)}</span>}
                          {row.target && <span>Tgt: ₹{Number(row.target).toFixed(2)}</span>}
                          {row.entryOrderId && <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>E:{row.entryOrderId.slice(0,8)}</span>}
                          <span className={`badge ${getOrderStatusBadgeClass(row.entryOrderStatus)}`} style={{ fontSize: '8px' }}>{row.entryOrderStatus || '--'}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{row.exitReason || '--'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{row.exitPrice ? `₹${Number(row.exitPrice).toFixed(2)}` : '--'}</td>
                      <td style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDateTime(row.exitTime)}</td>
                      <td>
                        <span className={`badge ${(row.status || '').toLowerCase() === 'open' ? 'badge-info' : (row.status || '').toLowerCase() === 'failed' ? 'badge-danger' : (row.status || '').toLowerCase() === 'cancelled' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
                          {(row.status || '').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '13px', color: pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)', whiteSpace: 'nowrap' }}>
                        {pnl >= 0 ? `+₹${pnl.toFixed(2)}` : `-₹${Math.abs(pnl).toFixed(2)}`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>
            Showing {filteredTrades.length ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, filteredTrades.length)} of {filteredTrades.length} entries
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
                      color: currentPage === pageNum ? 'white' : 'var(--text-body)',
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
              style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: 'pointer', outline: 'none', color: 'var(--text-primary)' }}
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={30}>30 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Trade Details Modal */}
      <Modal
        isOpen={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
        title={selectedTrade?._isOcoMerged ? 'OCO Trade Details — All Legs' : 'Trade Execution Details'}
      >
        {selectedTrade && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="td-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Symbol</span>
                <strong style={{ fontSize: '15px' }}>{selectedTrade.symbol}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Strategy</span>
                <strong>{selectedTrade.strategyName || selectedTrade.strategy?.name || 'Pre-Open Momentum'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Client</span>
                <strong>{selectedTrade.clientName || selectedTrade.client?.user?.name || 'System Client'}</strong>
              </div>
              {selectedTrade._isOcoMerged ? (
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>OCO Group</span>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{selectedTrade.dualLegGroupId || '--'}</span>
                </div>
              ) : (
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Order Type</span>
                  <span>{selectedTrade.orderType || 'MIS'} / MIS</span>
                </div>
              )}
            </div>

            {selectedTrade._isOcoMerged ? (
              <>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  {(selectedTrade.legs || []).map((leg: any, i: number) => {
                    const legColor = (leg.direction || '').toLowerCase() === 'long' ? 'var(--color-success)' : 'var(--color-danger)';
                    return <LegDetailCard key={i} leg={leg} title={`Leg ${i + 1} (${leg.direction || ''})`} color={legColor} />;
                  })}
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '12px' }}>Full Details</h4>
                  {(selectedTrade.legs || []).map((leg: any, i: number) => {
                    const legColor = (leg.direction || '').toLowerCase() === 'long' ? 'var(--color-success)' : 'var(--color-danger)';
                    return <ModalLegSection key={i} leg={leg} title={`Leg ${i + 1} — ${leg.direction || ''}`} color={legColor} />;
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="td-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Leg</span>
                    <span>{selectedTrade.legName ? `${selectedTrade.legName} (${selectedTrade.direction || ''} / ${selectedTrade.legTimeframe || ''})` : '--'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Quantity</span>
                    <span>{selectedTrade.quantity || 0} shares</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Total Invested</span>
                    <span>₹{(Number(selectedTrade.entryPrice || 0) * Number(selectedTrade.quantity || 0)).toFixed(2)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Entry Time</span>
                    <span>{formatDateTime(selectedTrade.entryTime || selectedTrade.createdAt)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Exit Time</span>
                    <span>{formatDateTime(selectedTrade.exitTime)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Orig Entry Price</span>
                    <span>{selectedTrade.originalEntryPrice ? `₹${Number(selectedTrade.originalEntryPrice).toFixed(2)}` : '--'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Tick Rounded Entry</span>
                    <span>₹{Number(selectedTrade.entryPrice || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Orig Stop Loss</span>
                    <span>{selectedTrade.originalStopLoss ? `₹${Number(selectedTrade.originalStopLoss).toFixed(2)}` : '--'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Tick Rounded SL</span>
                    <span>{selectedTrade.stopLoss ? `₹${Number(selectedTrade.stopLoss).toFixed(2)}` : '--'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Orig Target</span>
                    <span>{selectedTrade.originalTarget ? `₹${Number(selectedTrade.originalTarget).toFixed(2)}` : '--'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Tick Rounded Target</span>
                    <span>{selectedTrade.target ? `₹${Number(selectedTrade.target).toFixed(2)}` : '--'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>SL Trigger Price</span>
                    <span>{selectedTrade.slTriggerPrice ? `₹${Number(selectedTrade.slTriggerPrice).toFixed(2)}` : '--'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Exit Price</span>
                    <span>{selectedTrade.exitPrice ? `₹${Number(selectedTrade.exitPrice).toFixed(2)}` : '--'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>P&L</span>
                    <span style={{ fontWeight: 700, color: Number(selectedTrade.pnl || 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {Number(selectedTrade.pnl || 0) >= 0 ? '+' : ''}₹{Number(selectedTrade.pnl || 0).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Entry Order</span>
                    <strong style={{ fontSize: '13px', fontFamily: 'monospace', display: 'block' }}>{selectedTrade.entryOrderId || '--'}</strong>
                    {selectedTrade.entryOrderStatus && (
                      <span className={`badge ${getOrderStatusBadgeClass(selectedTrade.entryOrderStatus)}`} style={{ fontSize: '10px', marginTop: '4px', display: 'inline-block' }}>{selectedTrade.entryOrderStatus}</span>
                    )}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>SL Order</span>
                    <strong style={{ fontSize: '13px', fontFamily: 'monospace', display: 'block' }}>{selectedTrade.slOrderId === 'REJECTED' ? '--' : (selectedTrade.slOrderId || '--')}</strong>
                    {selectedTrade.slOrderStatus && (
                      <span className={`badge ${getOrderStatusBadgeClass(selectedTrade.slOrderStatus)}`} style={{ fontSize: '10px', marginTop: '4px', display: 'inline-block' }}>{selectedTrade.slOrderStatus}</span>
                    )}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Target Order</span>
                    <strong style={{ fontSize: '13px', fontFamily: 'monospace', display: 'block' }}>{selectedTrade.targetOrderId === 'REJECTED' ? '--' : (selectedTrade.targetOrderId || '--')}</strong>
                    {selectedTrade.targetOrderStatus && (
                      <span className={`badge ${getOrderStatusBadgeClass(selectedTrade.targetOrderStatus)}`} style={{ fontSize: '10px', marginTop: '4px', display: 'inline-block' }}>{selectedTrade.targetOrderStatus}</span>
                    )}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Exit Reason</span>
                    <span>{selectedTrade.exitReason || '--'}</span>
                  </div>
                </div>

                {selectedTrade.status && selectedTrade.status.toLowerCase() === 'failed' && (
                  <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <XCircle size={18} color="var(--color-danger)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <h5 style={{ color: '#991b1b', fontWeight: 600, fontSize: '13px' }}>Kite Rejection Reason:</h5>
                      <p style={{ color: '#b91c1c', fontSize: '13px', marginTop: '4px', lineHeight: '1.4' }}>
                        {selectedTrade.kiteResponse?.message || selectedTrade.kiteResponse?.status || 'No specific error message received from Zerodha API.'}
                      </p>
                    </div>
                  </div>
                )}

                {selectedTrade.kiteResponse && (
                  <div style={{ marginTop: '16px' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                      {selectedTrade.exitReason ? 'Exit Order JSON Response' : 'Entry Order JSON Response'}
                    </span>
                    <pre style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '180px', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                      {JSON.stringify(selectedTrade.kiteResponse, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedTrade.slKiteResponse && (
                  <div style={{ marginTop: '16px' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>SL Order JSON Response</span>
                    <pre style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '180px', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                      {JSON.stringify(selectedTrade.slKiteResponse, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedTrade.targetKiteResponse && (
                  <div style={{ marginTop: '16px' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Target Order JSON Response</span>
                    <pre style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '180px', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                      {JSON.stringify(selectedTrade.targetKiteResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}
            <Button onClick={() => setSelectedTrade(null)} style={{ marginTop: '8px' }}>
              Close
            </Button>
          </div>
        )}
      </Modal>
      <style>{`
        @media (max-width: 480px) {
          .td-header { flex-direction: column !important; align-items: flex-start !important; }
          .td-header h1 { font-size: 20px !important; }
          .td-summary { grid-template-columns: 1fr !important; }
          .td-filters { flex-direction: column !important; align-items: stretch !important; }
          .td-filters > div, .td-filters > .td-filters-inner { width: 100% !important; min-width: 0 !important; }
          .td-filters-inner { flex-wrap: wrap !important; }
          .table-responsive table { font-size: 12px !important; min-width: 0 !important; }
          .table-responsive td, .table-responsive th { padding: 8px 6px !important; }
          .td-modal-grid { grid-template-columns: 1fr !important; }
          .td-leg-detail { grid-template-columns: 1fr !important; }
          .td-modal-leg-section { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .td-modal-grid { grid-template-columns: 1fr !important; }
          .td-leg-detail { grid-template-columns: 1fr !important; }
          .td-modal-leg-section { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
