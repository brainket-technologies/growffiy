'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppViewModel } from '../../../../shared/viewmodels/AppContext';
import { Card } from '../../../../shared/components/views/Card';
import { Button } from '../../../../shared/components/views/Button';
import { Loader } from '../../../../shared/components/views/Loader';
import { Users, DollarSign, Award, Download, Search, TrendingUp, TrendingDown, Calendar, ChevronDown } from 'lucide-react';

export default function ClientReportPage() {
  const { clients = [], trades = [], loading } = useAppViewModel();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [canExport, setCanExport] = useState(true);

  const now = new Date();
  const initialStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const initialEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState<Date>(initialStart);
  const [endDate, setEndDate] = useState<Date>(initialEnd);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<'month' | 'year' | 'custom'>('month');

  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());

  const formatDateToYMD = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [customStart, setCustomStart] = useState<string>(formatDateToYMD(initialStart));
  const [customEnd, setCustomEnd] = useState<string>(formatDateToYMD(initialEnd));

  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const applyMonthFilter = () => {
    setStartDate(new Date(selectedYear, selectedMonth, 1));
    setEndDate(new Date(selectedYear, selectedMonth + 1, 0));
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const applyYearFilter = () => {
    setStartDate(new Date(selectedYear, 0, 1));
    setEndDate(new Date(selectedYear, 11, 31));
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const applyCustomFilter = () => {
    if (customStart && customEnd) {
      setStartDate(new Date(customStart));
      setEndDate(new Date(customEnd));
      setIsFilterOpen(false);
      setCurrentPage(1);
    }
  };

  const clearFilters = () => {
    setStartDate(initialStart);
    setEndDate(initialEnd);
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
    setFilterType('month');
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  let dateRangeStr = '';
  if (startDate && endDate) {
    const sStr = startDate.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const eStr = endDate.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    dateRangeStr = `${sStr} - ${eStr}`;
  }

  const dateFilteredTrades = useMemo(() => {
    return (trades || []).filter(t => {
      const d = new Date(t.createdAt || t.entryTime || new Date());
      const dTime = d.getTime();
      const startOfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0).getTime();
      const endOfDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59).getTime();

      return (dTime >= startOfDay && dTime <= endOfDay);
    });
  }, [trades, startDate, endDate]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const perms: { module: string; permission: string; granted: boolean }[] = JSON.parse(
        localStorage.getItem('growffiy_staff_permissions') || '[]'
      );
      // Check if logged in user is admin, if not check staff permission for clientExport
      const role = localStorage.getItem('growffiy_logged_in_user_role');
      if (role === 'staff') {
        const hasExport = perms.some(p => p.module === 'reports' && p.permission === 'clientExport' && p.granted);
        setCanExport(hasExport);
      }
    }
  }, []);

  const clientStats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    return clients.map((client) => {
      const clientTrades = dateFilteredTrades.filter((t) => t && (t.clientId === client.id || t.clientName === client.user?.name));
      const totalPnl = clientTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
      const todayPnl = clientTrades.reduce((sum, t) => {
        const dStr = t.createdAt || t.entryTime || t.exitTime;
        if (!dStr) return sum;
        const d = new Date(dStr);
        if (d >= startOfToday) {
          return sum + Number(t.pnl || 0);
        }
        return sum;
      }, 0);
      const capital = Number(client.capital || 0);
      const totalPnlPercent = capital > 0 ? (totalPnl / capital) * 100 : 0;
      const openTrades = clientTrades.filter((t) => t.status?.toLowerCase() === 'open').length;

      // Extract assigned strategies
      let assignedStrategies: string[] = [];
      if (client.assignments && Array.isArray(client.assignments) && client.assignments.length > 0) {
        assignedStrategies = client.assignments
          .map((a: any) => (a.strategy?.name || a.strategyName || '').trim())
          .filter(Boolean);
      }
      if (client.strategy?.name) {
        assignedStrategies.push(client.strategy.name.trim());
      }
      // Deduplicate
      assignedStrategies = Array.from(new Set(assignedStrategies));

      // Fallback: If no assignment records found in client model, check traded strategies from trades history
      if (assignedStrategies.length === 0) {
        const allClientTrades = (trades || []).filter((t: any) => t && (t.clientId === client.id || t.clientName === client.user?.name));
        const tradedStrats = Array.from(
          new Set(
            allClientTrades
              .map((t: any) => (t.strategy?.name || t.strategyName || '').trim())
              .filter(Boolean)
          )
        );
        if (tradedStrats.length > 0) {
          assignedStrategies = tradedStrats;
        }
      }

      const strategyName = assignedStrategies.length > 0
        ? assignedStrategies.join(', ')
        : 'None Assigned';

      return {
        id: client.id,
        name: client.user?.name || 'Unknown Client',
        email: client.user?.email || '',
        capital,
        strategyName,
        strategyNames: assignedStrategies,
        tradingStatus: client.tradingStatus || 'inactive',
        subscriptionStatus: client.subscriptionStatus || 'pending',
        totalTrades: clientTrades.length,
        openTrades,
        totalPnl,
        todayPnl,
        totalPnlPercent,
      };
    });
  }, [clients, dateFilteredTrades, trades]);

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
      if (sortBy === 'todayPnl') return b.todayPnl - a.todayPnl;
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
    const headers = ['Client Name', 'Email', 'Capital Deployed', 'Strategy', 'Total Trades', 'Active Trades', 'Today P&L (INR)', 'Net P&L (INR)', 'Trading Status', 'Subscription Status'];
    const rows = filteredList.map(c => [
      c.name, c.email, c.capital.toFixed(2), c.strategyName,
      c.totalTrades, c.openTrades, c.todayPnl.toFixed(2), c.totalPnl.toFixed(2),
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
    <>
      <style>{`
.table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.table-responsive table { min-width: 600px; font-size: 13px; }
.table-responsive th, .table-responsive td { white-space: nowrap; padding: 8px 10px; }
@media (max-width: 640px) {
  .cp-gap { gap: 16px !important; }
  .cp-gap > div:first-child h1 { font-size: 20px !important; }
  .cp-gap > div:first-child p { font-size: 13px !important; }
  .cp-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
  .cp-filters { flex-direction: column !important; align-items: stretch !important; }
  .cp-filters > div, .cp-filters > select { min-width: 0 !important; width: 100% !important; flex: 1 1 auto !important; }
  .cp-pagi { flex-direction: column !important; align-items: center !important; gap: 8px !important; }
  .cp-pagi > span:first-child { font-size: 11px !important; }
  .cp-pagi > div:first-child { gap: 8px !important; flex-wrap: wrap !important; justify-content: center !important; }
  .cp-pagi select { font-size: 11px !important; padding: 4px 6px !important; }
}
@media (min-width: 641px) and (max-width: 1024px) {
  .cp-grid { grid-template-columns: repeat(2, 1fr) !important; }
}
      `}</style>
      <div className="cp-gap" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="cp-title" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Client Performance Report
          </h1>
          <p className="cp-desc" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Detailed summary of clients, their capital deployment, active strategies, and P&L results.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                borderRadius: '8px', 
                background: 'var(--bg-white)', 
                border: '1px solid var(--border)', 
                fontSize: '13px', 
                color: 'var(--text-body)',
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                userSelect: 'none'
              }}
            >
              <Calendar size={14} color="var(--primary)" />
              <span>{dateRangeStr}</span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </div>

            {isFilterOpen && (
              <div style={{ 
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                background: 'var(--bg-white)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
                padding: '16px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-heading)' }}>Date Filter</span>
                  <button 
                    onClick={clearFilters}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Reset to Default
                  </button>
                </div>

                <div style={{ display: 'flex', background: 'var(--surface)', padding: '2px', borderRadius: '6px' }}>
                  <button 
                    onClick={() => setFilterType('month')}
                    style={{ flex: 1, border: 'none', background: filterType === 'month' ? 'var(--bg-white)' : 'transparent', color: 'var(--text-body)', fontSize: '12px', padding: '6px 0', borderRadius: '4px', fontWeight: filterType === 'month' ? 600 : 500, cursor: 'pointer' }}
                  >
                    Month
                  </button>
                  <button 
                    onClick={() => setFilterType('year')}
                    style={{ flex: 1, border: 'none', background: filterType === 'year' ? 'var(--bg-white)' : 'transparent', color: 'var(--text-body)', fontSize: '12px', padding: '6px 0', borderRadius: '4px', fontWeight: filterType === 'year' ? 600 : 500, cursor: 'pointer' }}
                  >
                    Year
                  </button>
                  <button 
                    onClick={() => setFilterType('custom')}
                    style={{ flex: 1, border: 'none', background: filterType === 'custom' ? 'var(--bg-white)' : 'transparent', color: 'var(--text-body)', fontSize: '12px', padding: '6px 0', borderRadius: '4px', fontWeight: filterType === 'custom' ? 600 : 500, cursor: 'pointer' }}
                  >
                    Custom Date
                  </button>
                </div>

                {filterType === 'month' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                      >
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <select 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        style={{ flex: 1.5, padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                      >
                        {MONTHS.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
                      </select>
                    </div>
                    <Button onClick={applyMonthFilter} style={{ width: '100%', padding: '8px', fontSize: '12px', backgroundColor: 'var(--primary)', color: 'white' }}>
                      Apply Month Filter
                    </Button>
                  </div>
                )}

                {filterType === 'year' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                    >
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <Button onClick={applyYearFilter} style={{ width: '100%', padding: '8px', fontSize: '12px', backgroundColor: 'var(--primary)', color: 'white' }}>
                      Apply Year Filter
                    </Button>
                  </div>
                )}

                {filterType === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Start Date</label>
                      <input 
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', width: '100%' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>End Date</label>
                      <input 
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', width: '100%' }}
                      />
                    </div>
                    <Button onClick={applyCustomFilter} style={{ width: '100%', padding: '8px', fontSize: '12px', backgroundColor: 'var(--primary)', color: 'white' }}>
                      Apply Custom Filter
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          {canExport && (
            <Button variant="secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} /> Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="cp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Total Clients</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{clientStats.length}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                {activeClients.length} active, {subscribedClients.length} subscription
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
        <div className="cp-filters" style={{
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
            <option value="todayPnl">Sort by Today P&L</option>
            <option value="pnl">Sort by Net P&L</option>
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
                <th style={{ width: '110px', textAlign: 'center' }}>Orders (Tot/Act)</th>
                <th>Status</th>
                <th>Subscription</th>
                <th>Today P&L (INR)</th>
                <th>Net P&L (INR)</th>
                <th>Net P&L (%)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
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
                    <td>
                      {c.strategyNames && c.strategyNames.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {c.strategyNames.map((sName: string, sIdx: number) => (
                            <span
                              key={sIdx}
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                                color: '#6366f1',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {sName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None Assigned</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>{c.totalTrades} / {c.openTrades}</td>
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
                    <td style={{ fontWeight: 700 }}>
                      <span style={{ color: c.todayPnl > 0 ? '#16a34a' : c.todayPnl < 0 ? '#ef4444' : 'var(--text-secondary)', fontWeight: 700 }}>
                        {c.todayPnl > 0 ? `+₹${c.todayPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : c.todayPnl < 0 ? `-₹${Math.abs(c.todayPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : `+₹0.00`}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      <span style={{ color: c.totalPnl > 0 ? '#16a34a' : c.totalPnl < 0 ? '#ef4444' : 'var(--text-secondary)', fontWeight: 700 }}>
                        {c.totalPnl > 0 ? `+₹${c.totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : c.totalPnl < 0 ? `-₹${Math.abs(c.totalPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : `+₹0.00`}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      <span style={{ color: c.totalPnlPercent > 0 ? '#16a34a' : c.totalPnlPercent < 0 ? '#ef4444' : 'var(--text-secondary)', fontWeight: 700 }}>
                        {c.totalPnlPercent > 0 ? `+${c.totalPnlPercent.toFixed(2)}%` : c.totalPnlPercent < 0 ? `${c.totalPnlPercent.toFixed(2)}%` : `0.00%`}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="cp-pagi" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
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
    </div></>
  );
}
