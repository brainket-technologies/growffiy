'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { Button } from '../../../views/components/Button';
import { 
  Activity, 
  RefreshCw, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Filter, 
  Download 
} from 'lucide-react';
import { Modal } from '../../../views/components/Modal';

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

export default function LiveTradingPage() {
  const { trades = [], isTradingActive } = useAppViewModel();
  const [selectedTrade, setSelectedTrade] = useState<any | null>(null);

  // Filter local states
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [strategyFilter, setStrategyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [symbolFilter, setSymbolFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Dynamic filter lists safely extracted
  const uniqueClients = Array.from(new Set((trades || []).map(t => t && (t.client?.user?.name || t.clientName)).filter(Boolean))) as string[];
  const uniqueStrategies = Array.from(new Set((trades || []).map(t => t && (t.strategy?.name || t.strategyName)).filter(Boolean))) as string[];
  const uniqueSymbols = Array.from(new Set((trades || []).map(t => t && t.symbol).filter(Boolean))) as string[];

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

  const filteredTrades = (trades || []).filter(trade => {
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
    const matchesSymbol = symbolFilter === 'all' || symbol === symbolFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();

    return matchesSearch && matchesClient && matchesStrategy && matchesType && matchesSymbol && matchesStatus;
  });

  // Paginated trades
  const totalPages = Math.ceil(filteredTrades.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTrades = filteredTrades.slice(startIndex, startIndex + pageSize);

  const handleExportCSV = () => {
    const headers = ['Date & Time', 'Client', 'Strategy', 'Type', 'Symbol', 'Qty', 'Entry Price', 'Exit Price', 'P&L (INR)', 'Status'];
    const rows = filteredTrades.map(trade => {
      if (!trade) return [];
      const pnl = Number(trade.pnl || 0);
      const entryPriceVal = Number(trade.entryPrice || 0);
      const exitPriceVal = Number(trade.exitPrice || 0);
      const clientName = trade.client?.user?.name || trade.clientName || 'System Client';
      const strategyName = trade.strategy?.name || trade.strategyName || 'Pre-Open Momentum';
      const txType = getTransactionType(trade);
      return [
        formatDateTime(trade.entryTime || trade.createdAt),
        clientName,
        strategyName,
        txType,
        trade.symbol,
        trade.quantity || 0,
        entryPriceVal.toFixed(2),
        exitPriceVal ? exitPriceVal.toFixed(2) : '--',
        pnl.toFixed(2),
        (trade.status || '').toUpperCase()
      ];
    }).filter(row => row.length > 0);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trades_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: isTradingActive ? 'var(--color-success-bg)' : '#f1f5f9',
              color: isTradingActive ? 'var(--color-success)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isTradingActive ? 'var(--color-success)' : 'var(--text-muted)',
                display: 'inline-block',
              }}
            />
            {isTradingActive ? 'ENGINE LIVE & SCANNING' : 'ENGINE STOPPED'}
          </div>
        </div>
      </div>


      {/* Live Trades Table */}
      <Card>
        {/* Table Header and Control bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Live Open & Recent Orders
          </h4>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Filters Panel matching reference layout */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px', 
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'var(--bg-secondary)',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          {/* Search box */}
          <div style={{ position: 'relative', flex: '2 1 200px', minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', height: '34px', fontSize: '12px', width: '100%', outline: 'none' }}
            />
          </div>

          {/* Client Filter */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'white', flex: '1 1 130px', minWidth: '130px', width: 'auto' }}
          >
            <option value="all">All Clients</option>
            {uniqueClients.map(client => (
              <option key={client} value={client}>{client}</option>
            ))}
          </select>

          {/* Strategy Filter */}
          <select
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'white', flex: '1 1 140px', minWidth: '140px', width: 'auto' }}
          >
            <option value="all">All Strategies</option>
            {uniqueStrategies.map(strategy => (
              <option key={strategy} value={strategy}>{strategy}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'white', flex: '1 1 110px', minWidth: '110px', width: 'auto' }}
          >
            <option value="all">All Types</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>

          {/* Symbol Filter */}
          <select
            value={symbolFilter}
            onChange={(e) => setSymbolFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'white', flex: '1 1 120px', minWidth: '120px', width: 'auto' }}
          >
            <option value="all">All Symbols</option>
            {uniqueSymbols.map(sym => (
              <option key={sym} value={sym}>{sym}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'white', flex: '1 1 120px', minWidth: '120px', width: 'auto' }}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Export Action */}
          <Button variant="secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '34px', fontSize: '12px', padding: '0 12px', flex: '0 0 auto' }}>
            <Download size={14} /> Export
          </Button>
        </div>

        {/* Live Trades Table */}
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Client</th>
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
              {paginatedTrades.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No active trades match the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedTrades.map((trade) => {
                  if (!trade) return null;
                  const pnl = Number(trade.pnl || 0);
                  const entryPriceVal = Number(trade.entryPrice || 0);
                  const exitPriceVal = Number(trade.exitPrice || 0);
                  const quantityVal = Number(trade.quantity || 0);

                  // Calculate P&L %
                  let pnlPercent = 0;
                  if (entryPriceVal > 0 && quantityVal > 0) {
                    pnlPercent = (pnl / (entryPriceVal * quantityVal)) * 100;
                  }

                  const clientName = trade.client?.user?.name || trade.clientName || 'System Client';
                  const strategyName = trade.strategy?.name || trade.strategyName || 'Pre-Open Momentum';
                  const txType = getTransactionType(trade);
                  const isBuy = txType === 'BUY';

                  return (
                    <tr 
                      key={trade.id} 
                      onClick={() => setSelectedTrade(trade)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Click row to see failure reason/details"
                    >
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {formatDateTime(trade.entryTime || trade.createdAt)}
                      </td>
                      <td style={{ fontWeight: 500 }}>{clientName}</td>
                      <td>{strategyName}</td>
                      <td>
                        <span className={`badge ${isBuy ? 'badge-blue' : 'badge-red'}`} style={{ padding: '3px 8px', fontSize: '10px' }}>
                          {txType}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{trade.symbol}</td>
                      <td>{quantityVal}</td>
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
            Showing {filteredTrades.length ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, filteredTrades.length)} of {filteredTrades.length} entries
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
              <option value={15}>15 / page</option>
              <option value={30}>30 / page</option>
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
                <strong>{selectedTrade.client?.user?.name || selectedTrade.clientName || 'System Client'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Order Product / Type</span>
                <span>{selectedTrade.orderType} / MIS</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Quantity</span>
                <span>{selectedTrade.quantity || 0} shares</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Total Invested</span>
                <span>₹{(Number(selectedTrade.entryPrice || 0) * (selectedTrade.quantity || 0)).toFixed(2)}</span>
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
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Status</span>
                <span className={`badge ${selectedTrade.status ? (selectedTrade.status.toLowerCase() === 'open' ? 'badge-info' : selectedTrade.status.toLowerCase() === 'failed' ? 'badge-red' : 'badge-success') : ''}`}>
                  {(selectedTrade.status || '').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Failure/Kite Response Details */}
            {selectedTrade.status && selectedTrade.status.toLowerCase() === 'failed' && (
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

            <Button onClick={() => setSelectedTrade(null)} style={{ marginTop: '8px' }}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
