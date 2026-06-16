'use client';

import React from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { Button } from '../../../views/components/Button';
import { Activity, Play, Square, RefreshCw, AlertTriangle } from 'lucide-react';

export default function LiveTradingPage() {
  const { trades, isTradingActive, toggleTrading } = useAppViewModel();

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

      {/* Connection & Terminal Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <Card>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <Activity size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '15px' }}>Terminal Status</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Kite WebSocket: Connected (Delay: 12ms) | Feed: Active
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#d97706' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '15px' }}>Risk Guard</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Daily Loss Limit: Enforced at 3% max portfolio drawdown.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Trades Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Client</th>
                <th>Order Type</th>
                <th>Qty</th>
                <th>Entry Price</th>
                <th>Exit Price</th>
                <th>P&L (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No active trades. Deploy strategies to generate live market orders.
                  </td>
                </tr>
              ) : (
                trades.map((trade) => {
                  const pnl = Number(trade.pnl || 0);
                  const clientName = trade.client?.user?.name || trade.clientName || 'System Client';
                  return (
                    <tr key={trade.id}>
                      <td style={{ fontWeight: 600 }}>{trade.symbol}</td>
                      <td>{clientName}</td>
                      <td>{trade.orderType}</td>
                      <td>{trade.quantity}</td>
                      <td>₹{Number(trade.entryPrice || 0).toFixed(2)}</td>
                      <td>{trade.exitPrice ? `₹${Number(trade.exitPrice).toFixed(2)}` : '--'}</td>
                      <td style={{ fontWeight: 600, color: pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {pnl >= 0 ? `+₹${pnl.toFixed(2)}` : `-₹${Math.abs(pnl).toFixed(2)}`}
                      </td>
                      <td>
                        <span className={`badge ${trade.status === 'open' ? 'badge-info' : 'badge-success'}`}>
                          {trade.status}
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
