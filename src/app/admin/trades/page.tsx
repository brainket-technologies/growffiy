'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { Button } from '../../../views/components/Button';
import { Activity, Play, Square, RefreshCw, AlertTriangle, Info, XCircle } from 'lucide-react';
import { Modal } from '../../../views/components/Modal';

export default function LiveTradingPage() {
  const { trades, isTradingActive, toggleTrading } = useAppViewModel();
  const [selectedTrade, setSelectedTrade] = useState<any | null>(null);

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
            Live Open & Recent Orders (Click row to see failure reason/details)
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
                    <tr 
                      key={trade.id} 
                      onClick={() => setSelectedTrade(trade)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
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
                        <span className={`badge ${
                          trade.status === 'open' 
                            ? 'badge-info' 
                            : trade.status === 'failed' 
                              ? 'badge-red' 
                              : 'badge-success'
                        }`}>
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
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Client Name</span>
                <strong>{selectedTrade.client?.user?.name || selectedTrade.clientName || 'System Client'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Order Product / Type</span>
                <span>{selectedTrade.orderType} / MIS</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Quantity</span>
                <span>{selectedTrade.quantity} shares</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Entry Price</span>
                <span>₹{Number(selectedTrade.entryPrice || 0).toFixed(2)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Status</span>
                <span className={`badge ${selectedTrade.status === 'open' ? 'badge-info' : selectedTrade.status === 'failed' ? 'badge-red' : 'badge-success'}`}>
                  {selectedTrade.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Failure/Kite Response Details */}
            {selectedTrade.status === 'failed' && (
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
