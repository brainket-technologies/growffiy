'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';
import { Card } from '../../../shared/components/views/Card';
import { Loader } from '../../../shared/components/views/Loader';
import { Search, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = [2024, 2025, 2026];

export default function ClientTradesPage() {
  const { trades, clients, loading, activeUser } = useAppViewModel();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  if (loading || !activeUser) {
    return <Loader title="Loading trades" text="Fetching your trade transactions..." fullscreen={false} />;
  }

  const matchedClient = clients.find(c =>
    c.user?.userId?.toLowerCase() === activeUser.id.toLowerCase() ||
    c.user?.email?.toLowerCase() === activeUser.email?.toLowerCase() ||
    c.id === activeUser.id
  );

  const clientTrades = trades.filter(t =>
    matchedClient ? t.clientId === matchedClient.id : t.clientId === activeUser.id
  );

  const filtered = clientTrades.filter(t => {
    const matchSearch = search ? t.symbol?.toLowerCase().includes(search.toLowerCase()) : true;
    const matchStatus = statusFilter !== 'all' ? t.status === statusFilter : true;
    const matchType = typeFilter !== 'all' ? t.orderType?.toLowerCase() === typeFilter.toLowerCase() : true;

    let matchDate = true;
    const tradeDate = new Date(t.createdAt);
    if (dateFilter === 'today') {
      matchDate = tradeDate.toDateString() === new Date().toDateString();
    } else if (dateFilter === 'month') {
      matchDate = tradeDate.getMonth() === selectedMonth && tradeDate.getFullYear() === selectedYear;
    } else if (dateFilter === 'year') {
      matchDate = tradeDate.getFullYear() === selectedYear;
    } else if (dateFilter === 'custom') {
      if (customStart) matchDate = matchDate && tradeDate >= new Date(customStart);
      if (customEnd) matchDate = matchDate && tradeDate <= new Date(customEnd + 'T23:59:59');
    }

    return matchSearch && matchStatus && matchType && matchDate;
  });

  const totalPnl = filtered.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
  const openCount = filtered.filter(t => t.status === 'open').length;
  const closedCount = filtered.filter(t => t.status === 'closed').length;

  const totalPages = Math.ceil(filtered.length / 10);
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const indexOfLastItem = activePage * 10;
  const indexOfFirstItem = indexOfLastItem - 10;
  const currentTrades = filtered.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '100%', overflowX: 'hidden' }}>
      <style>{`
        @media (max-width: 1024px) {
          .clients-trades-filters { flex-wrap: wrap !important; }
          .clients-trades-filters > div:first-child { flex: 1 1 100% !important; }
          .pagination-container { flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
        }
        @media (max-width: 640px) {
          .clients-trades-stats { grid-template-columns: 1fr 1fr !important; }
          .clients-trades-stats .card-value { font-size: 22px !important; }
          .clients-trades-filters { flex-direction: column !important; align-items: stretch !important; gap: 8px !important; padding: 12px !important; }
          .clients-trades-filters > div:first-child { flex: 1 1 auto !important; }
          .clients-trades-filters select, .clients-trades-filters input[type="date"] { width: 100% !important; min-width: unset !important; }
          .clients-trades-filters > div:first-child input { width: 100% !important; }
          .table-responsive table thead th:nth-child(2), .table-responsive table tbody td:nth-child(2),
          .table-responsive table thead th:nth-child(5), .table-responsive table tbody td:nth-child(5),
          .table-responsive table thead th:nth-child(6), .table-responsive table tbody td:nth-child(6) { display: none; }
          .table-responsive table { font-size: 12px !important; }
          .table-responsive table th, .table-responsive table td { padding: 6px 4px !important; }
          .pagination-container { flex-direction: column !important; align-items: center !important; gap: 8px !important; }
          .pagination-controls { flex-wrap: wrap !important; justify-content: center !important; }
          h1 { font-size: 20px !important; }
          .clients-trades-title p { font-size: 13px !important; }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="clients-trades-title">
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)', margin: 0 }}>Live Trades</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Your executed trade transactions.</p>
        </div>
      </div>

      <div className="clients-trades-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--primary)' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Trades</span>
          <span className="card-value" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>{filtered.length}</span>
        </Card>
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--warning)' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Open</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--warning)', fontFamily: 'var(--font-title)' }}>{openCount}</span>
        </Card>
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--accent)' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Closed</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-title)' }}>{closedCount}</span>
        </Card>
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--danger)' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>P&L</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: totalPnl >= 0 ? 'var(--accent)' : 'var(--danger)', fontFamily: 'var(--font-title)' }}>
            {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toFixed(2)}
          </span>
        </Card>
      </div>

      <Card style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Trade Transactions ({filtered.length})
          </h3>
        </div>

        <div className="clients-trades-filters" style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', flexWrap: 'nowrap', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <div style={{ position: 'relative', flex: '4 1 500px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search by symbol..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', backgroundColor: 'var(--bg-white)', color: 'var(--text-primary)' }} />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#ffffff', cursor: 'pointer', minWidth: '120px' }}>
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#ffffff', cursor: 'pointer', minWidth: '100px' }}>
            <option value="all">All Types</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
          <select value={dateFilter} onChange={e => { setDateFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#ffffff', cursor: 'pointer', minWidth: '120px' }}>
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
            <option value="custom">Custom</option>
          </select>
          {dateFilter === 'month' && (
            <select value={selectedMonth} onChange={e => { setSelectedMonth(Number(e.target.value)); setCurrentPage(1); }}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#ffffff', cursor: 'pointer', minWidth: '100px' }}>
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          )}
          {(dateFilter === 'month' || dateFilter === 'year') && (
            <select value={selectedYear} onChange={e => { setSelectedYear(Number(e.target.value)); setCurrentPage(1); }}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: '#ffffff', cursor: 'pointer', minWidth: '100px' }}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          {dateFilter === 'custom' && (
            <>
              <input type="date" value={customStart} onChange={e => { setCustomStart(e.target.value); setCurrentPage(1); }}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: 'var(--bg-white)', color: 'var(--text-primary)' }} />
              <span style={{ color: 'var(--text-subtle)', fontSize: '13px' }}>to</span>
              <input type="date" value={customEnd} onChange={e => { setCustomEnd(e.target.value); setCurrentPage(1); }}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', background: 'var(--bg-white)', color: 'var(--text-primary)' }} />
            </>
          )}
        </div>

        <div className="table-responsive">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Leg</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>P&L</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {currentTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No trades match the search or filter criteria.
                  </td>
                </tr>
              ) : (
                currentTrades.map((t) => {
                  const pnl = Number(t.pnl || 0);
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.symbol}</td>
                      <td style={{ fontSize: '12px' }}>{t.legName ? `${t.legName} (${t.direction || ''})` : '--'}</td>
                      <td>{t.orderType || '--'}</td>
                      <td>{t.quantity || '--'}</td>
                      <td>₹{Number(t.entryPrice || 0).toFixed(2)}</td>
                      <td>{t.exitPrice ? `₹${Number(t.exitPrice).toFixed(2)}` : '--'}</td>
                      <td style={{ fontWeight: 600, color: pnl >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                        {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${t.status === 'open' ? 'badge-info' : t.status === 'closed' ? 'badge-success' : ''}`}
                          style={{ textTransform: 'none', fontSize: '11px', padding: '4px 10px' }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} /> {new Date(t.createdAt).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="pagination-info">
              Showing <span style={{ fontWeight: 600 }}>{indexOfFirstItem + 1}</span> to{' '}
              <span style={{ fontWeight: 600 }}>{Math.min(indexOfLastItem, filtered.length)}</span> of{' '}
              <span style={{ fontWeight: 600 }}>{filtered.length}</span> trades
            </div>
            <div className="pagination-controls">
              <button className="pagination-btn" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={activePage === 1} title="Previous Page">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                if (totalPages > 7 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - activePage) > 1) {
                  if (pageNum === 2 && activePage > 3) return <span key="ellipsis-start" style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>;
                  if (pageNum === totalPages - 1 && activePage < totalPages - 2) return <span key="ellipsis-end" style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>;
                  return null;
                }
                return (
                  <button key={pageNum} className={`pagination-btn ${activePage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}>
                    {pageNum}
                  </button>
                );
              })}
              <button className="pagination-btn" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={activePage === totalPages} title="Next Page">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
