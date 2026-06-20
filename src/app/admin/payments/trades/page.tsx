'use client';

import React from 'react';
import { useAppViewModel } from '../../../../shared/viewmodels/AppContext';
import { Card } from '../../../../shared/components/views/Card';
import { Loader } from '../../../../shared/components/views/Loader';
import { Button } from '../../../../shared/components/views/Button';
import { Activity, ArrowUpRight, ArrowDownLeft, Download } from 'lucide-react';

export default function LiveTradeTransactionsPage() {
  const { trades = [], loading } = useAppViewModel();

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

  const successfulTrades = trades.filter((t) => t.status?.toLowerCase() === 'closed' || t.status?.toLowerCase() === 'success');
  const totalTradePnl = trades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Client Name', 'Strategy', 'Type', 'Symbol', 'Quantity', 'Entry Price', 'Exit Price', 'P&L (INR)', 'Status', 'Date Time'];
    const rows = trades.map(t => {
      const txType = getTransactionType(t);
      return [
        t.entryOrderId || t.id.slice(0, 10),
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Live Trade Transactions
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>View logs of all trades, quantities, symbols, and P&L statements.</p>
        </div>
        <Button variant="secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Grid Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Total Trade Execution P&L</p>
              <h3 style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: totalTradePnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {totalTradePnl >= 0 ? '+' : ''}₹{totalTradePnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: totalTradePnl >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: totalTradePnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              <Activity size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          Trade Transaction Log ({trades.length})
        </h3>
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
                <th>P&L (INR)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No trade transactions triggered yet.
                  </td>
                </tr>
              ) : (
                trades.map((trade, idx) => {
                  const pnl = Number(trade.pnl || 0);
                  const entryPriceVal = Number(trade.entryPrice || 0);
                  const exitPriceVal = Number(trade.exitPrice || 0);
                  const txType = getTransactionType(trade);
                  const isBuy = txType === 'BUY';

                  return (
                    <tr key={trade.id || idx}>
                      <td style={{ fontWeight: 600 }}>
                        {trade.entryOrderId || trade.id.slice(0, 10)}
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
