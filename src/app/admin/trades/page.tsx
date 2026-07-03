'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';
import { Card } from '../../../shared/components/views/Card';
import { Button } from '../../../shared/components/views/Button';
import { RefreshCw, XCircle, Search, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Modal } from '../../../shared/components/views/Modal';

const formatDateTime = (timeStr: string | Date | null) => {
  if (!timeStr) return '--';
  try {
    const date = new Date(timeStr);
    return date.toLocaleString('en-US', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
  } catch { return '--'; }
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
    const leg1 = group.find((t: any) => (t.legName === 'Leg 1') || (t.direction || '').toLowerCase() === 'long');
    const leg2 = group.find((t: any) => (t.legName === 'Leg 2') || (t.direction || '').toLowerCase() === 'short');
    const hasActive = group.some((t: any) => t.status === 'open');
    merged.push({
      _isOcoMerged: true,
      dualLegGroupId: group[0].dualLegGroupId,
      leg1, leg2,
      symbol: group[0].symbol,
      clientName: group[0].client?.user?.name || group[0].clientName || 'System Client',
      strategyName: group[0].strategy?.name || group[0].strategyName || 'Pre-Open Momentum',
      entryTime: leg1?.entryTime || leg2?.entryTime || group[0].entryTime,
      createdAt: group[0].createdAt,
      status: hasActive ? 'active' : 'cancelled',
      strategy: group[0].strategy,
      client: group[0].client,
    });
  }
  return [...merged, ...solo];
}

function getOcoStatus(merged: any): { label: string; color: string } {
  const l1e = (merged.leg1?.entryOrderStatus || '').toLowerCase();
  const l2e = (merged.leg2?.entryOrderStatus || '').toLowerCase();
  const l1s = (merged.leg1?.status || '').toLowerCase();
  const l2s = (merged.leg2?.status || '').toLowerCase();
  if (l1e === 'filled' && l2e === 'cancelled') return { label: 'LEG 1 ACTIVE', color: 'var(--color-success)' };
  if (l2e === 'filled' && l1e === 'cancelled') return { label: 'LEG 2 ACTIVE', color: 'var(--color-success)' };
  if (l1e === 'pending' && l2e === 'pending') return { label: 'BOTH PENDING', color: 'var(--warning)' };
  if (l1e === 'filled' && l2e === 'filled') return { label: 'BOTH FILLED', color: 'var(--color-success)' };
  if (l1s === 'cancelled' && l2s === 'cancelled') return { label: 'ALL CANCELLED', color: 'var(--text-muted)' };
  return { label: (merged.status || '').toUpperCase(), color: 'var(--text-secondary)' };
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '12px' }}>
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

function LegCell({ leg, color }: { leg: any; color: string }) {
  if (!leg) return <td style={{ color: 'var(--text-muted)', fontSize: '11px' }}>N/A</td>;
  const eStat = (leg.entryOrderStatus || '').toLowerCase();
  return (
    <td style={{ fontSize: '11px', lineHeight: '1.7', verticalAlign: 'top' }}>
      <div style={{ fontWeight: 600, color, fontSize: '12px' }}>
        {color === 'var(--color-success)' ? <ArrowUpRight size={11} style={{ display: 'inline', marginRight: 2 }} /> : <ArrowDownRight size={11} style={{ display: 'inline', marginRight: 2 }} />}
        {leg.direction || ''}
      </div>
      <div>Entry: ₹{Number(leg.entryPrice || 0).toFixed(2)}</div>
      <div>SL: ₹{Number(leg.stopLoss || 0).toFixed(2)}</div>
      <div>Tgt: ₹{Number(leg.target || 0).toFixed(2)}</div>
      <div>
        <span className={`badge ${eStat === 'filled' ? 'badge-success' : eStat === 'cancelled' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '9px', marginTop: '2px' }}>
          {eStat.toUpperCase()}
        </span>
      </div>
    </td>
  );
}

export default function LiveTradingPage() {
  const { trades = [], isTradingActive } = useAppViewModel();
  const [selectedTrade, setSelectedTrade] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [strategyFilter, setStrategyFilter] = useState('all');
  const [symbolFilter, setSymbolFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const uniqueClients = Array.from(new Set((trades || []).map(t => t && (t.client?.user?.name || t.clientName)).filter(Boolean))) as string[];
  const uniqueStrategies = Array.from(new Set((trades || []).map(t => t && (t.strategy?.name || t.strategyName)).filter(Boolean))) as string[];
  const uniqueSymbols = Array.from(new Set((trades || []).map(t => t && t.symbol).filter(Boolean))) as string[];

  const mergedRows = React.useMemo(() => mergeOcoTrades(trades || []), [trades]);

  const filteredRows = mergedRows.filter(row => {
    const symbol = (row.symbol || '').toLowerCase();
    const strategy = (row.strategyName || '').toLowerCase();
    const client = (row.clientName || '').toLowerCase();
    const status = (row.status || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = symbol.includes(query) || strategy.includes(query) || client.includes(query);
    const matchesClient = clientFilter === 'all' || client === clientFilter.toLowerCase();
    const matchesStrategy = strategyFilter === 'all' || strategy === strategyFilter.toLowerCase();
    const matchesSymbol = symbolFilter === 'all' || symbol === symbolFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();

    return matchesSearch && matchesClient && matchesStrategy && matchesSymbol && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  const handleExportCSV = () => {
    const headers = ['Date & Time', 'Client', 'Strategy', 'Symbol', 'Type', 'Leg', 'Qty', 'Entry Price', 'SL', 'Target', 'Exit Price', 'P&L', 'Status', 'Entry Order Status', 'SL Order Status', 'Target Order Status'];
    const rows = (trades || []).map(t => {
      if (!t) return [];
      return [
        formatDateTime(t.entryTime || t.createdAt),
        t.client?.user?.name || t.clientName || 'System Client',
        t.strategy?.name || t.strategyName || '',
        t.symbol,
        t.direction || '',
        t.legName || '',
        t.quantity || 0,
        Number(t.entryPrice || 0).toFixed(2),
        t.stopLoss ? Number(t.stopLoss).toFixed(2) : '',
        t.target ? Number(t.target).toFixed(2) : '',
        t.exitPrice ? Number(t.exitPrice).toFixed(2) : '',
        Number(t.pnl || 0).toFixed(2),
        (t.status || '').toUpperCase(),
        (t.entryOrderStatus || '').toUpperCase(),
        (t.slOrderStatus || '').toUpperCase(),
        (t.targetOrderStatus || '').toUpperCase(),
      ];
    }).filter(r => r.length > 0);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `trades_${new Date().toISOString().split('T')[0]}.csv`;
    a.style.visibility = 'hidden'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleRowClick = (row: any) => {
    if (row._isOcoMerged) setSelectedTrade(row);
    else setSelectedTrade(row);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Live Trading Terminal
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Monitor real-time executions, active signals, and overall market connectivity.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: isTradingActive ? 'var(--color-success-bg)' : 'var(--surface)', color: isTradingActive ? 'var(--color-success)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isTradingActive ? 'var(--color-success)' : 'var(--text-muted)', display: 'inline-block' }} />
            {isTradingActive ? 'ENGINE LIVE & SCANNING' : 'ENGINE STOPPED'}
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Live Open & Recent Orders
            {filteredRows.some(r => r._isOcoMerged) && <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '8px' }}>(OCO pairs merged)</span>}
          </h4>
          <button onClick={() => window.location.reload()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative', flex: '2 1 200px', minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input type="text" placeholder="Search transactions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '32px', height: '34px', fontSize: '12px', width: '100%', outline: 'none' }} />
          </div>
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', flex: '1 1 130px', minWidth: '130px' }}>
            <option value="all">All Clients</option>
            {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={strategyFilter} onChange={e => setStrategyFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', flex: '1 1 140px', minWidth: '140px' }}>
            <option value="all">All Strategies</option>
            {uniqueStrategies.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={symbolFilter} onChange={e => setSymbolFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', flex: '1 1 120px', minWidth: '120px' }}>
            <option value="all">All Symbols</option>
            {uniqueSymbols.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', flex: '1 1 120px', minWidth: '120px' }}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button variant="secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px', fontSize: '12px', padding: '0 12px' }}>
            <Download size={14} /> Export
          </Button>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Client</th>
                <th>Strategy</th>
                <th>Symbol</th>
                <th style={{ minWidth: '130px' }}>Leg 1 (BUY) <span style={{fontWeight:400,fontSize:10,color:'var(--text-muted)'}}>Entry/SL/Tgt</span></th>
                <th style={{ minWidth: '130px' }}>Leg 2 (SELL) <span style={{fontWeight:400,fontSize:10,color:'var(--text-muted)'}}>Entry/SL/Tgt</span></th>
                <th>OCO Status</th>
                <th>P&L (₹)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No active trades match the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row: any, idx: number) => {
                  if (row._isOcoMerged) {
                    const oco = getOcoStatus(row);
                    const leg1Color = (row.leg1?.entryOrderStatus || '').toLowerCase() === 'filled' ? 'var(--color-success)' : 'var(--text-muted)';
                    const leg2Color = (row.leg2?.entryOrderStatus || '').toLowerCase() === 'filled' ? 'var(--color-danger)' : 'var(--text-muted)';
                    const pnlL1 = Number(row.leg1?.pnl || 0);
                    const pnlL2 = Number(row.leg2?.pnl || 0);
                    const totalPnl = pnlL1 + pnlL2;
                    return (
                      <tr key={row.dualLegGroupId}
                        onClick={() => handleRowClick(row)}
                        style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDateTime(row.entryTime)}</td>
                        <td style={{ fontWeight: 500, fontSize: '12px' }}>{row.clientName}</td>
                        <td style={{ fontSize: '12px' }}>{row.strategyName}</td>
                        <td style={{ fontWeight: 600 }}>{row.symbol}</td>
                        <LegCell leg={row.leg1} color={leg1Color} />
                        <LegCell leg={row.leg2} color={leg2Color} />
                        <td>
                          <span className={`badge ${oco.color === 'var(--color-success)' ? 'badge-success' : oco.color === 'var(--warning)' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                            {oco.label}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '13px', color: totalPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {totalPnl >= 0 ? `+₹${totalPnl.toFixed(2)}` : `-₹${Math.abs(totalPnl).toFixed(2)}`}
                        </td>
                      </tr>
                    );
                  }
                  // Solo trade (non-OCO)
                  const pnl = Number(row.pnl || 0);
                  const entryPriceVal = Number(row.entryPrice || 0);
                  const exitPriceVal = Number(row.exitPrice || 0);
                  const quantityVal = Number(row.quantity || 0);
                  let pnlPercent = 0;
                  if (entryPriceVal > 0 && quantityVal > 0) pnlPercent = (pnl / (entryPriceVal * quantityVal)) * 100;
                  const clientName = row.client?.user?.name || row.clientName || 'System Client';
                  const strategyName = row.strategy?.name || row.strategyName || 'Pre-Open Momentum';
                  return (
                    <tr key={row.id}
                      onClick={() => handleRowClick(row)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDateTime(row.entryTime || row.createdAt)}</td>
                      <td style={{ fontWeight: 500, fontSize: '12px' }}>{clientName}</td>
                      <td style={{ fontSize: '12px' }}>{strategyName}</td>
                      <td style={{ fontWeight: 600 }}>{row.symbol}</td>
                      <td colSpan={2} style={{ fontSize: '11px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span className={`badge ${(row.direction || '').toLowerCase() === 'long' ? 'badge-success' : 'badge-red'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                            {row.direction || '--'}
                          </span>
                          <span>Qty: {quantityVal}</span>
                          <span>Entry: ₹{entryPriceVal.toFixed(2)}</span>
                          {row.stopLoss && <span>SL: ₹{Number(row.stopLoss).toFixed(2)}</span>}
                          {row.target && <span>Tgt: ₹{Number(row.target).toFixed(2)}</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${(row.status || '').toLowerCase() === 'open' ? 'badge-info' : (row.status || '').toLowerCase() === 'failed' ? 'badge-danger' : (row.status || '').toLowerCase() === 'cancelled' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '10px' }}>
                          {(row.status || '').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '13px', color: pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
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
          <span>Showing {filteredRows.length ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, filteredRows.length)} of {filteredRows.length} entries</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>&lt;</button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: currentPage === i + 1 ? 'var(--primary)' : 'var(--bg-white)', color: currentPage === i + 1 ? 'white' : 'var(--text-body)', fontWeight: 600, cursor: 'pointer' }}>{i + 1}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>&gt;</button>
            </div>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: 'pointer', outline: 'none' }}>
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={30}>30 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Modal */}
      <Modal isOpen={!!selectedTrade} onClose={() => setSelectedTrade(null)} title={selectedTrade?._isOcoMerged ? 'OCO Trade Details — Both Legs' : 'Order Execution Details'}>
        {selectedTrade && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Common info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
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
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>OCO Group</span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{selectedTrade.dualLegGroupId || '--'}</span>
              </div>
            </div>

            {selectedTrade._isOcoMerged ? (
              <>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <LegDetailCard leg={selectedTrade.leg1} title="Leg 1 (LONG/BUY)" color="var(--color-success)" />
                  <LegDetailCard leg={selectedTrade.leg2} title="Leg 2 (SHORT/SELL)" color="var(--color-danger)" />
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '12px' }}>Full Details</h4>
                  <ModalLegSection leg={selectedTrade.leg1} title="Leg 1 — Long (BUY)" color="var(--color-success)" />
                  <ModalLegSection leg={selectedTrade.leg2} title="Leg 2 — Short (SELL)" color="var(--color-danger)" />
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Order Product / Type</span><span>{selectedTrade.orderType} / MIS</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Leg</span><span>{selectedTrade.legName ? `${selectedTrade.legName} (${selectedTrade.direction || ''} / ${selectedTrade.legTimeframe || ''})` : '--'}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Quantity</span><span>{selectedTrade.quantity || 0} shares</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Total Invested</span><span>₹{(Number(selectedTrade.entryPrice || 0) * (selectedTrade.quantity || 0)).toFixed(2)}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Entry Time</span><span>{formatDateTime(selectedTrade.entryTime || selectedTrade.createdAt)}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Orig Entry Price</span><span>₹{selectedTrade.originalEntryPrice ? Number(selectedTrade.originalEntryPrice).toFixed(2) : '--'}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Tick Rounded Entry</span><span>₹{Number(selectedTrade.entryPrice || 0).toFixed(2)}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Orig Stop Loss</span><span>₹{selectedTrade.originalStopLoss ? Number(selectedTrade.originalStopLoss).toFixed(2) : '--'}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Tick Rounded SL</span><span>₹{selectedTrade.stopLoss ? Number(selectedTrade.stopLoss).toFixed(2) : '--'}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Orig Target</span><span>₹{selectedTrade.originalTarget ? Number(selectedTrade.originalTarget).toFixed(2) : '--'}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Tick Rounded Target</span><span>₹{selectedTrade.target ? Number(selectedTrade.target).toFixed(2) : '--'}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>SL Trigger Price</span><span>{selectedTrade.slTriggerPrice ? `₹${Number(selectedTrade.slTriggerPrice).toFixed(2)}` : '--'}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Entry Order ID</span><span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{selectedTrade.entryOrderId || '--'}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>SL Order ID</span><span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{selectedTrade.slOrderId || '--'}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Target Order ID</span><span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{selectedTrade.targetOrderId || '--'}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Entry Order Status</span><span className={`badge ${(selectedTrade.entryOrderStatus || '').toLowerCase() === 'filled' ? 'badge-success' : (selectedTrade.entryOrderStatus || '').toLowerCase() === 'cancelled' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '10px' }}>{(selectedTrade.entryOrderStatus || '--').toUpperCase()}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>SL Order Status</span><span className={`badge ${(selectedTrade.slOrderStatus || '').toLowerCase() === 'filled' ? 'badge-success' : (selectedTrade.slOrderStatus || '').toLowerCase() === 'cancelled' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '10px' }}>{(selectedTrade.slOrderStatus || '--').toUpperCase()}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Target Order Status</span><span className={`badge ${(selectedTrade.targetOrderStatus || '').toLowerCase() === 'filled' ? 'badge-success' : (selectedTrade.targetOrderStatus || '').toLowerCase() === 'cancelled' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '10px' }}>{(selectedTrade.targetOrderStatus || '--').toUpperCase()}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Exit Time</span><span>{formatDateTime(selectedTrade.exitTime)}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Exit Price</span><span>{selectedTrade.exitPrice ? `₹${Number(selectedTrade.exitPrice).toFixed(2)}` : '--'}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Status</span><span className={`badge ${selectedTrade.status ? (selectedTrade.status.toLowerCase() === 'open' ? 'badge-info' : selectedTrade.status.toLowerCase() === 'failed' ? 'badge-red' : 'badge-success') : ''}`}>{(selectedTrade.status || '').toUpperCase()}</span></div>
                </div>
                {/* Kite Responses for solo trade */}
                {selectedTrade.kiteResponse && (
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Entry Kite Response</span>
                    <pre style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '150px', lineHeight: '1.4', color: 'var(--text-primary)' }}>{JSON.stringify(selectedTrade.kiteResponse, null, 2)}</pre>
                  </div>
                )}
                {selectedTrade.slKiteResponse && (
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>SL Kite Response</span>
                    <pre style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '150px', lineHeight: '1.4', color: 'var(--text-primary)' }}>{JSON.stringify(selectedTrade.slKiteResponse, null, 2)}</pre>
                  </div>
                )}
                {selectedTrade.targetKiteResponse && (
                  <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Target Kite Response</span>
                    <pre style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto', maxHeight: '150px', lineHeight: '1.4', color: 'var(--text-primary)' }}>{JSON.stringify(selectedTrade.targetKiteResponse, null, 2)}</pre>
                  </div>
                )}
              </>
            )}
            <Button onClick={() => setSelectedTrade(null)} style={{ marginTop: '8px' }}>Close</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
