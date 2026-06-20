'use client';

import React from 'react';
import { useAppViewModel } from '../../../../shared/viewmodels/AppContext';
import { Card } from '../../../../shared/components/views/Card';
import { Button } from '../../../../shared/components/views/Button';
import { Loader } from '../../../../shared/components/views/Loader';
import { Users, DollarSign, ArrowUpRight, Award, Download } from 'lucide-react';

export default function ClientReportPage() {
  const { clients = [], trades = [], loading } = useAppViewModel();

  if (loading) {
    return <Loader title="Loading client report" text="Compiling client balances and algorithmic performance..." fullscreen={false} />;
  }

  // Calculate client analytics
  const clientStats = clients.map((client) => {
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

  const totalCapital = clientStats.reduce((sum, c) => sum + c.capital, 0);
  const totalClientPnl = clientStats.reduce((sum, c) => sum + c.totalPnl, 0);
  const bestClient = clientStats.length > 0
    ? [...clientStats].sort((a, b) => b.totalPnl - a.totalPnl)[0]
    : null;

  const handleExportCSV = () => {
    const headers = ['Client Name', 'Email', 'Capital Deployed', 'Strategy', 'Total Trades', 'Active Trades', 'Net P&L (INR)', 'Trading Status', 'Subscription Status'];
    const rows = clientStats.map(c => [
      c.name,
      c.email,
      c.capital.toFixed(2),
      c.strategyName,
      c.totalTrades,
      c.openTrades,
      c.totalPnl.toFixed(2),
      c.tradingStatus.toUpperCase(),
      c.subscriptionStatus.toUpperCase()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `client_performance_report_${new Date().toISOString().split('T')[0]}.csv`);
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
            Client Performance Report
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Detailed summary of clients, their capital deployment, active strategies, and P&L results.</p>
        </div>
        <Button variant="secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Download size={14} /> Export CSV
        </Button>
      </div>

      {/* Grid Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Total Deployed Capital</p>
              <h3 style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: 'var(--text-primary)' }}>
                ₹{totalCapital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <DollarSign size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Net Client P&L</p>
              <h3 style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: totalClientPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {totalClientPnl >= 0 ? '+' : ''}₹{totalClientPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: totalClientPnl >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: totalClientPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              <ArrowUpRight size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Top Earning Client</p>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: 'var(--text-primary)' }}>
                {bestClient ? bestClient.name : 'N/A'}
              </h3>
              {bestClient && (
                <p style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '4px', fontWeight: 600 }}>
                  +₹{bestClient.totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Net
                </p>
              )}
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Award size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          All Client Accounts Summary
        </h3>
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
              {clientStats.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No client records found.
                  </td>
                </tr>
              ) : (
                clientStats.map((c, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.email}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{c.capital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>{c.strategyName}</td>
                    <td>{c.totalTrades} / {c.openTrades}</td>
                    <td>
                      <span className={`badge ${c.tradingStatus === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {c.tradingStatus.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${c.subscriptionStatus === 'active' ? 'badge-success' : 'badge-warning'}`}>
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
      </Card>
    </div>
  );
}
