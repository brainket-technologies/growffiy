'use client';

import React, { useState, useMemo } from 'react';
import { useAppViewModel } from '../../../../shared/viewmodels/AppContext';
import { Card } from '../../../../shared/components/views/Card';
import { Button } from '../../../../shared/components/views/Button';
import { Loader } from '../../../../shared/components/views/Loader';
import { Users, DollarSign, Award, Download, Search, TrendingUp, TrendingDown } from 'lucide-react';

export default function ClientReportPage() {
  const { clients = [], trades = [], loading } = useAppViewModel();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const clientStats = useMemo(() => {
    return clients.map((client) => {
      const clientTrades = trades.filter((t) => t && (t.clientId === client.id || t.clientName === client.user?.name));
      const totalPnl = clientTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
      const openTrades = clientTrades.filter((t) => t.status?.toLowerCase() === 'open').length;

      return {
        id: client.id,
        name: client.user?.name || 'Unknown Client',
        email: client.user?.email || '',
        capital: Number(client.capital || 0),
        strategyName: client.strategy?.name || 'None Assigned',
        tradingStatus: client.tradingStatus || 'inactive',
        subscriptionStatus: client.subscriptionStatus || 'pending',
        totalTrades: clientTrades.length,
        openTrades,
        totalPnl,
      };
    });
  }, [clients, trades]);

  const totalCapital = useMemo(() => clientStats.reduce((sum, c) => sum + c.capital, 0), [clientStats]);
  const totalClientPnl = useMemo(() => clientStats.reduce((sum, c) => sum + c.totalPnl, 0), [clientStats]);
  const bestClient = useMemo(() => clientStats.length > 0 ? [...clientStats].sort((a, b) => b.totalPnl - a.totalPnl)[0] : null, [clientStats]);
  const activeClients = useMemo(() => clientStats.filter(c => c.tradingStatus === 'active'), [clientStats]);
  const subscribedClients = useMemo(() => clientStats.filter(c => c.subscriptionStatus === 'active'), [clientStats]);

  const filteredList = useMemo(() => {
    let list = clientStats.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.tradingStatus === statusFilter;
      const matchesSub = subscriptionFilter === 'all' || c.subscriptionStatus === subscriptionFilter;
      return matchesSearch && matchesStatus && matchesSub;
    });

    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'capital') return b.capital - a.capital;
      if (sortBy === 'pnl') return b.totalPnl - a.totalPnl;
      if (sortBy === 'trades') return b.totalTrades - a.totalTrades;
      return 0;
    });

    return list;
  }, [clientStats, searchQuery, statusFilter, subscriptionFilter, sortBy]);

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedList = filteredList.slice(startIndex, startIndex + pageSize);

  const handleExportCSV = () => {
    const headers = ['Client Name', 'Email', 'Capital Deployed', 'Strategy', 'Total Trades', 'Active Trades', 'Net P&L (INR)', 'Trading Status', 'Subscription Status'];
    const rows = filteredList.map(c => [
      c.name, c.email, c.capital.toFixed(2), c.strategyName,
      c.totalTrades, c.openTrades, c.totalPnl.toFixed(2),
      c.tradingStatus.toUpperCase(), c.subscriptionStatus.toUpperCase()
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `client_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <Loader title="Loading client report" text="Compiling client balances and algorithmic performance..." fullscreen={false} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Client Performance Report
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Detailed summary of clients, their capital deployment, active strategies, and P&L results.</p>
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Total Clients</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{clientStats.length}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                {activeClients.length} active, {subscribedClients.length} subscribed
              </p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <Users size={20} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Total Deployed Capital</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
                ₹{totalCapital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                Across {clientStats.length} clients
              </p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <DollarSign size={20} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Net Client P&L</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: totalClientPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {totalClientPnl >= 0 ? '+' : ''}₹{totalClientPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>Aggregate across all clients</p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: totalClientPnl >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: totalClientPnl >= 0 ? '#10b981' : '#ef4444' }}>
              {totalClientPnl >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Top Earning Client</p>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {bestClient ? bestClient.name : 'N/A'}
              </h3>
              {bestClient && (
                <p style={{ color: 'var(--color-success)', fontSize: '11px', marginTop: '2px', fontWeight: 600 }}>
                  +₹{bestClient.totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Net
                </p>
              )}
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Award size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            All Client Accounts Summary ({filteredList.length})
          </h3>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center',
          flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '12px 16px',
          borderRadius: '12px', border: '1px solid var(--border-color)'
        }}>
          <div style={{ position: 'relative', flex: '2 1 220px', minWidth: '180px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input type="text" placeholder="Search by client name or email..." value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ paddingLeft: '32px', height: '34px', fontSize: '12px', width: '100%', outline: 'none', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', color: 'var(--text-primary)' }} />
          </div>

          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', flex: '1 1 120px', minWidth: '100px' }}>
            <option value="all">Trading Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <select value={subscriptionFilter} onChange={(e) => { setSubscriptionFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', flex: '1 1 140px', minWidth: '110px' }}>
            <option value="all">Subscription: All</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', flex: '1 1 120px', minWidth: '100px' }}>
            <option value="name">Sort by Name</option>
            <option value="capital">Sort by Capital</option>
            <option value="pnl">Sort by P&L</option>
            <option value="trades">Sort by Trades</option>
          </select>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Capital Deployed</th>
                <th>Assigned Strategy</th>
                <th>Total / Active Orders</th>
                <th>Status</th>
                <th>Subscription</th>
                <th>Net P&L (INR)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    {searchQuery || statusFilter !== 'all' || subscriptionFilter !== 'all'
                      ? 'No clients match the selected filters.'
                      : 'No client records found.'}
                  </td>
                </tr>
              ) : (
                paginatedList.map((c, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.email}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ₹{c.capital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>{c.strategyName}</td>
                    <td>{c.totalTrades} / {c.openTrades}</td>
                    <td>
                      <span className={`badge ${c.tradingStatus === 'active' ? 'badge-success' : c.tradingStatus === 'suspended' ? 'badge-warning' : 'badge-danger'}`}>
                        {c.tradingStatus.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${c.subscriptionStatus === 'active' ? 'badge-success' : c.subscriptionStatus === 'pending' ? 'badge-info' : 'badge-warning'}`}>
                        {c.subscriptionStatus.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: c.totalPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {c.totalPnl >= 0 ? '+' : ''}₹{c.totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>
            Showing {filteredList.length ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, filteredList.length)} of {filteredList.length} entries
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }}>&lt;</button>
              {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => {
                const pageNum = currentPage <= 5 ? i + 1 : currentPage + i - 4;
                if (pageNum > totalPages) return null;
                return (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                    style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-color)',
                      background: currentPage === pageNum ? 'var(--primary)' : 'var(--bg-white)',
                      color: currentPage === pageNum ? 'white' : 'var(--text-body)', fontWeight: 600, cursor: 'pointer' }}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }}>&gt;</button>
            </div>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: 'pointer', outline: 'none', color: 'var(--text-primary)' }}>
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={30}>30 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}
