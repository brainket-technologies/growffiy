'use client';

import React, { useState, useMemo } from 'react';
import { useAppViewModel } from '../../../../shared/viewmodels/AppContext';
import { Card } from '../../../../shared/components/views/Card';
import { Loader } from '../../../../shared/components/views/Loader';
import { Button } from '../../../../shared/components/views/Button';
import { Modal } from '../../../../shared/components/views/Modal';
import {
  Activity, Download,
  Search, TrendingUp, TrendingDown, CheckCircle, AlertCircle, XCircle
} from 'lucide-react';

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
    try {
      const config = JSON.parse(trade.strategy?.configJson || '{}');
      const action = config?.tradeAction?.action || 'Long';
      if (action.toLowerCase() === 'short' || action.toLowerCase() === 'sell') {
        return 'SELL';
      }
    } catch (e) {}
    return 'BUY';
  };

  const formatDateTime = (timeStr: string | Date | null) => {
    if (!timeStr) return '--';
    try {
      const date = new Date(timeStr);
      return date.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return '--';
    }
  };

  const uniqueClients = useMemo(
    () => Array.from(new Set((trades || []).map(t => t?.client?.user?.name || t?.clientName).filter(Boolean))) as string[],
    [trades]
  );
  const uniqueStrategies = useMemo(
    () => Array.from(new Set((trades || []).map(t => t?.strategy?.name || t?.strategyName).filter(Boolean))) as string[],
    [trades]
  );
  const filteredTrades = useMemo(() => {
    return (trades || []).filter(trade => {
      if (!trade) return false;
      const symbol = (trade.symbol || '').toLowerCase();
      const strategy = (trade.strategy?.name || trade.strategyName || '').toLowerCase();
      const client = (trade.client?.user?.name || trade.clientName || '').toLowerCase();
      const status = (trade.status || '').toLowerCase();
      const txType = getTransactionType(trade).toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = symbol.includes(query) || strategy.includes(query) || client.includes(query);
      const matchesClient = clientFilter === 'all' || client === clientFilter.toLowerCase();
      const matchesStrategy = strategyFilter === 'all' || strategy === strategyFilter.toLowerCase();
      const matchesType = typeFilter === 'all' || txType === typeFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();

      return matchesSearch && matchesClient && matchesStrategy && matchesType && matchesStatus;
    });
  }, [trades, searchQuery, clientFilter, strategyFilter, typeFilter, statusFilter]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Trade Transaction Log ({filteredTrades.length})
          </h3>
        </div>

        {/* Filters */}
        <div style={{
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

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Client</th>
                <th>Strategy</th>
                <th>Symbol</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Entry Price</th>
                <th>Exit Price</th>
                <th>Stop Loss</th>
                <th>Target</th>
                <th>P&L (INR)</th>
                <th>Status</th>
                <th>Entry Time</th>
                <th>Exit Time</th>
                <th>SL Order ID</th>
                <th>Target Order ID</th>
                <th>Exit Reason</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.length === 0 ? (
                <tr>
                  <td colSpan={17} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    {searchQuery || clientFilter !== 'all' || strategyFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all'
                      ? 'No trades match the selected filters.'
                      : 'No trade transactions triggered yet.'}
                  </td>
                </tr>
              ) : (
                paginatedTrades.map((trade, idx) => {
                  const pnl = Number(trade.pnl || 0);
                  const entryPriceVal = Number(trade.entryPrice || 0);
                  const exitPriceVal = Number(trade.exitPrice || 0);
                  const txType = getTransactionType(trade);
                  const isBuy = txType === 'BUY';

                  return (
                    <tr
                      key={trade.id || idx}
                      onClick={() => setSelectedTrade(trade)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Click to view trade details"
                    >
                      <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '12px' }}>
                        {trade.entryOrderId || trade.id?.slice(0, 10)}
                      </td>
                      <td>{trade.client?.user?.name || trade.clientName || 'System Client'}</td>
                      <td>{trade.strategy?.name || trade.strategyName || 'Pre-Open Momentum'}</td>
                      <td style={{ fontWeight: 600 }}>{trade.symbol}</td>
                      <td>
                        <span className={`badge ${isBuy ? 'badge-blue' : 'badge-red'}`} style={{ padding: '3px 8px', fontSize: '10px' }}>
                          {txType}
                        </span>
                      </td>
                      <td>{trade.quantity || 0}</td>
                      <td>₹{entryPriceVal.toFixed(2)}</td>
                      <td>{exitPriceVal ? `₹${exitPriceVal.toFixed(2)}` : '--'}</td>
                      <td>{trade.stopLoss ? `₹${Number(trade.stopLoss).toFixed(2)}` : '--'}</td>
                      <td>{trade.target ? `₹${Number(trade.target).toFixed(2)}` : '--'}</td>
                      <td style={{ fontWeight: 700, color: pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${
                          (trade.status || '').toLowerCase() === 'open'
                            ? 'badge-info'
                            : (trade.status || '').toLowerCase() === 'failed'
                              ? 'badge-danger'
                              : (trade.status || '').toLowerCase() === 'cancelled'
                                ? 'badge-warning'
                                : 'badge-success'
                        }`}>
                          {(trade.status || '').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(trade.entryTime || trade.createdAt)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(trade.exitTime)}</td>
                      <td style={{ fontSize: '11px', fontFamily: 'monospace' }}>{trade.slOrderId || '--'}</td>
                      <td style={{ fontSize: '11px', fontFamily: 'monospace' }}>{trade.targetOrderId || '--'}</td>
                      <td>{trade.exitReason || '--'}</td>
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
        title="Trade Execution Details"
      >
        {selectedTrade && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Symbol</span>
                <strong style={{ fontSize: '15px' }}>{selectedTrade.symbol}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Strategy</span>
                <strong>{selectedTrade.strategy?.name || selectedTrade.strategyName || 'Pre-Open Momentum'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Client</span>
                <strong>{selectedTrade.client?.user?.name || selectedTrade.clientName || 'System Client'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Order Type</span>
                <span>{selectedTrade.orderType || 'MIS'} / MIS</span>
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
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Entry Price</span>
                <span>₹{Number(selectedTrade.entryPrice || 0).toFixed(2)}</span>
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
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Stop Loss</span>
                <span>{selectedTrade.stopLoss ? `₹${Number(selectedTrade.stopLoss).toFixed(2)}` : '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Target</span>
                <span>{selectedTrade.target ? `₹${Number(selectedTrade.target).toFixed(2)}` : '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>P&L</span>
                <span style={{ fontWeight: 700, color: Number(selectedTrade.pnl || 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {Number(selectedTrade.pnl || 0) >= 0 ? '+' : ''}₹{Number(selectedTrade.pnl || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Status</span>
                <span className={`badge ${selectedTrade.status ? (selectedTrade.status.toLowerCase() === 'open' ? 'badge-info' : selectedTrade.status.toLowerCase() === 'failed' ? 'badge-danger' : selectedTrade.status.toLowerCase() === 'cancelled' ? 'badge-warning' : 'badge-success') : ''}`}>
                  {(selectedTrade.status || '').toUpperCase()}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Orig Entry Price</span>
                <span>{selectedTrade.originalEntryPrice ? `₹${Number(selectedTrade.originalEntryPrice).toFixed(2)}` : '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Orig Stop Loss</span>
                <span>{selectedTrade.originalStopLoss ? `₹${Number(selectedTrade.originalStopLoss).toFixed(2)}` : '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Orig Target</span>
                <span>{selectedTrade.originalTarget ? `₹${Number(selectedTrade.originalTarget).toFixed(2)}` : '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>SL Trigger Price</span>
                <span>{selectedTrade.slTriggerPrice ? `₹${Number(selectedTrade.slTriggerPrice).toFixed(2)}` : '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Entry Order ID</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedTrade.entryOrderId || '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>SL Order ID</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedTrade.slOrderId || '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Target Order ID</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedTrade.targetOrderId || '--'}</span>
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

            <Button onClick={() => setSelectedTrade(null)} style={{ marginTop: '8px' }}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
