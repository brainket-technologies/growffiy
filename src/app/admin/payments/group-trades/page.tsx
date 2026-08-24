'use client';

import React, { useState, useMemo } from 'react';
import { useAppViewModel } from '../../../../shared/viewmodels/AppContext';
import { Card } from '../../../../shared/components/views/Card';
import { Loader } from '../../../../shared/components/views/Loader';
import { Button } from '../../../../shared/components/views/Button';
import { Modal } from '../../../../shared/components/views/Modal';
import {
  Activity, ArrowUpRight, ArrowDownRight, Users, Calendar,
  Briefcase, TrendingUp, TrendingDown, Layers, BarChart2
} from 'lucide-react';

export default function GroupTradesPage() {
  const { trades, clients, loading } = useAppViewModel();
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Group trades dynamically based on execution block
  // We group by: Strategy, Symbol, Entry Price, and Entry Date (YYYY-MM-DD HH:MM)
  const groupedTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const map = new Map<string, any>();

    trades.forEach((t: any) => {
      // Exclude cancelled/failed trades from active group overview if no execution occurred
      if ((t.status || '').toLowerCase() === 'cancelled' || (t.status || '').toLowerCase() === 'failed') {
        return;
      }

      const strategyName = t.strategy?.name || t.strategyName || 'Pre-Open Breakout';
      const symbol = t.symbol || 'N/A';
      
      const d = new Date(t.createdAt || t.entryTime || new Date());
      const dateYMD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // Unique key for the batch execution on that day
      const groupKey = `${strategyName}_${symbol}_${dateYMD}`;

      // Calculate dynamic P&L
      let pnlVal = Number(t.pnl || 0);
      if ((t.pnl === null || t.pnl === undefined || t.pnl === 0) && t.entryPrice && t.exitPrice) {
        const isShort = (t.direction || '').toLowerCase() === 'short';
        const entry = Number(t.entryPrice);
        const exit = Number(t.exitPrice);
        const qty = Number(t.quantity || 0);
        pnlVal = isShort ? (entry - exit) * qty : (exit - entry) * qty;
      }

      const qty = Number(t.quantity || 0);
      const entryVal = Number(t.entryPrice || 0);
      const exitVal = t.exitPrice ? Number(t.exitPrice) : 0;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          dateTime: t.createdAt || t.entryTime || new Date(),
          strategy: strategyName,
          symbol: symbol,
          direction: t.direction || 'LONG',
          entryPriceSum: entryVal * qty,
          exitPriceSum: exitVal * qty,
          exitedQty: exitVal > 0 ? qty : 0,
          exitReason: t.exitReason || null,
          ocoStatus: t.status || t.ocoStatus || 'CLOSED',
          totalQty: qty,
          totalPnl: pnlVal,
          clientsList: [{
            clientName: t.client?.user?.name || t.clientName || 'Unknown Client',
            email: t.client?.user?.email || 'N/A',
            qty: qty,
            pnl: pnlVal,
            status: t.status || 'CLOSED',
            direction: t.direction || 'LONG',
            entryPrice: entryVal,
            exitPrice: t.exitPrice ? Number(t.exitPrice) : null
          }]
        });
      } else {
        const group = map.get(groupKey);
        group.totalQty += qty;
        group.totalPnl += pnlVal;
        group.entryPriceSum += entryVal * qty;
        if (exitVal > 0) {
          group.exitPriceSum += exitVal * qty;
          group.exitedQty += qty;
        }
        if (t.exitReason && !group.exitReason) {
          group.exitReason = t.exitReason;
        }
        group.clientsList.push({
          clientName: t.client?.user?.name || t.clientName || 'Unknown Client',
          email: t.client?.user?.email || 'N/A',
          qty: qty,
          pnl: pnlVal,
          status: t.status || 'CLOSED',
          direction: t.direction || 'LONG',
          entryPrice: entryVal,
          exitPrice: t.exitPrice ? Number(t.exitPrice) : null
        });
      }
    });

    // Map through groups to calculate weighted average entry and exit prices
    const result = Array.from(map.values()).map(group => {
      return {
        ...group,
        entryPrice: group.totalQty > 0 ? (group.entryPriceSum / group.totalQty) : 0,
        exitPrice: group.exitedQty > 0 ? (group.exitPriceSum / group.exitedQty) : null
      };
    });

    return result.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [trades]);

  const totalTradesCount = groupedTrades.length;
  const totalPages = Math.ceil(totalTradesCount / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTrades = useMemo(() => {
    return groupedTrades.slice(startIndex, startIndex + pageSize);
  }, [groupedTrades, startIndex, pageSize]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalPnl = 0;
    let totalClientsActive = 0;
    const uniqueStrategies = new Set<string>();

    groupedTrades.forEach(g => {
      totalPnl += g.totalPnl;
      totalClientsActive += g.clientsList.length;
      uniqueStrategies.add(g.strategy);
    });

    return {
      totalPnl,
      totalGroups: groupedTrades.length,
      clientsCount: totalClientsActive,
      strategiesCount: uniqueStrategies.size
    };
  }, [groupedTrades]);

  if (loading) {
    return <Loader title="Loading Master Trades" text="Aggregating batch client executions..." fullscreen={true} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '12px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'Outfit, sans-serif' }}>
          Trades Execution Groups
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          Monitor grouped strategy executions across all subscribed clients in real-time.
        </p>
      </div>

      {/* Grid Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', padding: '10px', borderRadius: '10px' }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Trade Batches</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', marginTop: '2px' }}>{stats.totalGroups}</div>
          </div>
        </Card>

        <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: stats.totalPnl >= 0 ? '#16a34a' : '#ef4444', padding: '10px', borderRadius: '10px' }}>
            {stats.totalPnl >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Aggregated P&L</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: stats.totalPnl >= 0 ? '#16a34a' : '#ef4444', marginTop: '2px' }}>
              {stats.totalPnl >= 0 ? `+₹${stats.totalPnl.toFixed(2)}` : `-₹${Math.abs(stats.totalPnl).toFixed(2)}`}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '10px', borderRadius: '10px' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Active Executions</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', marginTop: '2px' }}>{stats.clientsCount} Clients</div>
          </div>
        </Card>

        <Card style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', padding: '10px', borderRadius: '10px' }}>
            <Briefcase size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Strategies Active</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', marginTop: '2px' }}>{stats.strategiesCount}</div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="dashboard-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '1.5px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Date & Time</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Strategy</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Symbol</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Direction</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Total Qty</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Avg Entry</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Exit Price</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Exit Reason</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>OCO Status</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Total P&L</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Clients Executed</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No executed trades found in the log.
                  </td>
                </tr>
              ) : (
                paginatedTrades.map((g: any, index) => {
                  const pnlColor = g.totalPnl > 0.01 ? '#10b981' : g.totalPnl < -0.01 ? '#ef4444' : '#888888';
                  const isShort = (g.direction || '').toLowerCase() === 'short';
                  
                  return (
                    <tr
                      key={g.key}
                      onClick={() => setSelectedGroup(g)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      className="hover-row"
                    >
                      <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                          {new Date(g.dateTime).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                        <span style={{
                          background: 'rgba(37, 99, 235, 0.08)',
                          color: '#2563eb',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '10.5px'
                        }}>
                          {g.strategy}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)' }}>
                        {g.symbol}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600 }}>
                        <span style={{ color: isShort ? '#ef4444' : '#10b981' }}>
                          {g.direction}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600 }}>
                        {g.totalQty}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                        ₹{g.entryPrice.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                        {g.exitPrice ? `₹${g.exitPrice.toFixed(2)}` : '--'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {g.exitReason || '--'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '11px' }}>
                        <span className={`badge ${(g.ocoStatus || '').toLowerCase().includes('closed') || (g.ocoStatus || '').toLowerCase() === 'success' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '9px' }}>
                          {g.ocoStatus?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: 700 }}>
                        <span style={{ color: pnlColor }}>
                          {g.totalPnl > 0.01 ? `+₹${g.totalPnl.toFixed(2)}` : g.totalPnl < -0.01 ? `-₹${Math.abs(g.totalPnl).toFixed(2)}` : '₹0.00'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                          <Users size={14} style={{ color: '#2563eb' }} />
                          <span>{g.clientsList.length} Clients</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Panel */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--surface)', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Showing <span style={{ fontWeight: 600 }}>{startIndex + 1}</span> to <span style={{ fontWeight: 600 }}>{Math.min(startIndex + pageSize, totalTradesCount)}</span> of <span style={{ fontWeight: 600 }}>{totalTradesCount}</span> batches
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }}
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
                        border: '1px solid var(--border)',
                        background: currentPage === pageNum ? 'var(--primary)' : 'var(--bg-card)',
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
                  style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }}
                >
                  &gt;
                </button>
              </div>

              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', outline: 'none', color: 'var(--text-primary)' }}
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={15}>15 / page</option>
                <option value={30}>30 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Drilldown Modal */}
      {selectedGroup && (
        <Modal
          isOpen={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
          title={`Group Trade Detail: ${selectedGroup.symbol} (${selectedGroup.strategy})`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Group Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', background: 'var(--surface)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Symbol</span>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>{selectedGroup.symbol}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Direction</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: (selectedGroup.direction || '').toLowerCase() === 'short' ? '#ef4444' : '#10b981', marginTop: '2px' }}>{selectedGroup.direction}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Qty</span>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>{selectedGroup.totalQty} Shares</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Group P&L</span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: selectedGroup.totalPnl >= 0 ? '#10b981' : '#ef4444', marginTop: '2px' }}>
                  {selectedGroup.totalPnl >= 0 ? `+₹${selectedGroup.totalPnl.toFixed(2)}` : `-₹${Math.abs(selectedGroup.totalPnl).toFixed(2)}`}
                </div>
              </div>
            </div>

            {/* Individual Client Table */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '10px' }}>
                Client-Wise Executions ({selectedGroup.clientsList.length})
              </h4>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px 14px' }}>Client Name</th>
                      <th style={{ padding: '10px 14px' }}>Email</th>
                      <th style={{ padding: '10px 14px' }}>Qty</th>
                      <th style={{ padding: '10px 14px' }}>Entry Price</th>
                      <th style={{ padding: '10px 14px' }}>Exit Price</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                      <th style={{ padding: '10px 14px' }}>Individual P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroup.clientsList.map((cli: any, idx: number) => {
                      const cliPnlColor = cli.pnl > 0.01 ? '#10b981' : cli.pnl < -0.01 ? '#ef4444' : '#888888';
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)', fontSize: '12px' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{cli.clientName}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{cli.email}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>{cli.qty}</td>
                          <td style={{ padding: '10px 14px' }}>₹{cli.entryPrice.toFixed(2)}</td>
                          <td style={{ padding: '10px 14px' }}>{cli.exitPrice ? `₹${cli.exitPrice.toFixed(2)}` : '--'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span className={`badge ${(cli.status || '').toLowerCase().includes('closed') || (cli.status || '').toLowerCase() === 'success' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
                              {cli.status?.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>
                            <span style={{ color: cliPnlColor }}>
                              {cli.pnl > 0.01 ? `+₹${cli.pnl.toFixed(2)}` : cli.pnl < -0.01 ? `-₹${Math.abs(cli.pnl).toFixed(2)}` : '₹0.00'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <Button variant="secondary" onClick={() => setSelectedGroup(null)}>
                Close Detail
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* Hover row animation style */}
      <style>{`
        .hover-row:hover {
          background-color: var(--surface-light) !important;
        }
      `}</style>

    </div>
  );
}
