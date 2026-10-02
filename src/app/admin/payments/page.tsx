'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../../../shared/components/views/Card';
import { Loader } from '../../../shared/components/views/Loader';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Calendar, RefreshCw } from 'lucide-react';
import { API_ENDPOINTS } from '../../../core/constants';
import { api } from '../../../shared/services/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const fetchPayments = async () => {
    try {
      const res = await api.get(`${API_ENDPOINTS.PAYMENTS_HISTORY}?all=true`);
      if (res.success) {
        setPayments(res.payments || []);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchPayments();
  }, []);

  const successfulPayments = payments.filter(
    (p) =>
      p.status?.toLowerCase() === 'captured' ||
      p.status?.toLowerCase() === 'success' ||
      p.status?.toLowerCase() === 'completed'
  );

  const totalRevenue = successfulPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const sortedPayments = React.useMemo(() => {
    if (!sortKey) return payments;
    return [...payments].sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortKey === 'client') { aVal = a.user?.name || ''; bVal = b.user?.name || ''; }
      else if (sortKey === 'amount') { aVal = Number(a.amount || 0); bVal = Number(b.amount || 0); }
      else if (sortKey === 'date') { aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); }
      else if (sortKey === 'status') { aVal = a.status || ''; bVal = b.status || ''; }
      else { aVal = ''; bVal = ''; }
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [payments, sortKey, sortDir]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '--';
    }
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          Billing & Transactions Log
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>View client subscriptions, gateway payments, and automated wallet balance changes.</p>
      </div>

      {/* Grid Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Total Platform Revenue</p>
              <h3 style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)' }}>
              <CreditCard size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          Transaction Records ({payments.length})
        </h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Txn ID</th>
                {[
                  { key: 'client', label: 'Client' },
                  { key: 'desc', label: 'Description' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'date', label: 'Date' },
                  { key: 'type', label: 'Type' },
                  { key: 'status', label: 'Status' },
                ].map(col => {
                  const isActive = sortKey === col.key;
                  return (
                    <th key={col.key} onClick={() => handleSort(col.key)}
                      style={{ cursor: 'pointer', userSelect: 'none', color: isActive ? '#6366f1' : undefined, transition: 'color 0.15s' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span>{col.label}</span>
                        <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style={{ flexShrink: 0, opacity: isActive ? 1 : 0.35 }}>
                          <path d="M4 0L7 4H1L4 0Z" fill={isActive && sortDir === 'asc' ? '#6366f1' : 'rgba(148,163,184,0.8)'}/>
                          <path d="M4 12L1 8H7L4 12Z" fill={isActive && sortDir === 'desc' ? '#6366f1' : 'rgba(148,163,184,0.8)'}/>
                        </svg>
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                      <RefreshCw size={20} className="spin" style={{ marginRight: '10px' }} /> Loading billing logs...
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No transaction records found in database.
                  </td>
                </tr>
              ) : (
                sortedPayments.map((txn, idx) => {
                  const isSuccess =
                    txn.status?.toLowerCase() === 'captured' ||
                    txn.status?.toLowerCase() === 'success' ||
                    txn.status?.toLowerCase() === 'completed';
                  return (
                    <tr key={txn.id || idx}>
                      <td style={{ fontWeight: 600 }}>
                        {txn.razorpayPaymentId || txn.razorpayOrderId || txn.id.slice(0, 10)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {txn.user?.name || 'Unknown Client'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {txn.user?.email || ''}
                          </span>
                        </div>
                      </td>
                      <td>{txn.plan?.name || 'Subscription Plan'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{Number(txn.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>{formatDate(txn.createdAt)}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600,
                            fontSize: '12px',
                            color: 'var(--color-success)',
                          }}
                        >
                          <ArrowUpRight size={14} />
                          Credit
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            isSuccess
                              ? 'badge-success'
                              : txn.status?.toLowerCase() === 'failed'
                              ? 'badge-danger'
                              : 'badge-info'
                          }`}
                        >
                          {txn.status?.toUpperCase() || 'PENDING'}
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
