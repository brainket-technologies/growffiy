'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';
import { Card } from '../../../shared/components/views/Card';
import { Calendar, ShieldCheck, RefreshCw } from 'lucide-react';
import { API_ENDPOINTS } from '../../../core/constants';

export default function ClientPaymentHistory() {
  const { activeUser } = useAppViewModel();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('growffiy_logged_in_user_id');
      if (!storedId) {
        window.location.href = '/login';
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (!activeUser) return;

    fetch(`${API_ENDPOINTS.PAYMENTS_HISTORY}?userId=${activeUser.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.payments)) {
          const successPayments = data.payments.filter((p: any) => (p.status || '').toLowerCase() === 'success');
          setPayments(successPayments);
        }
      })
      .catch(err => console.error('Failed to load transaction history:', err))
      .finally(() => setLoading(false));
  }, [activeUser]);

  const sortedPayments = useMemo(() => {
    if (!sortKey) return payments;
    return [...payments].sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortKey === 'date') { aVal = new Date(a.createdAt || 0).getTime(); bVal = new Date(b.createdAt || 0).getTime(); }
      else if (sortKey === 'plan') { aVal = a.plan?.name || ''; bVal = b.plan?.name || ''; }
      else if (sortKey === 'amount') { aVal = Number(a.amount || 0); bVal = Number(b.amount || 0); }
      else if (sortKey === 'paymentId') { aVal = a.razorpayPaymentId || ''; bVal = b.razorpayPaymentId || ''; }
      else if (sortKey === 'orderId') { aVal = a.razorpayOrderId || ''; bVal = b.razorpayOrderId || ''; }
      else if (sortKey === 'status') { aVal = a.status || ''; bVal = b.status || ''; }
      else { aVal = ''; bVal = ''; }
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [payments, sortKey, sortDir]);

  const COLS = [
    { key: 'date', label: 'Date & Time' },
    { key: 'plan', label: 'Subscription Plan' },
    { key: 'amount', label: 'Amount' },
    { key: 'paymentId', label: 'Razorpay Payment ID' },
    { key: 'orderId', label: 'Razorpay Order ID' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="page-payments" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
          Payment History
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Review and manage subscription invoicing logs for auto-breakout access.</p>
      </div>

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-title)' }}>
            Transaction Logs
          </h3>
          
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  {COLS.map(col => {
                    const isActive = sortKey === col.key;
                    return (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        style={{
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'background 0.15s, color 0.15s',
                          background: isActive ? 'rgba(99,102,241,0.08)' : undefined,
                          color: isActive ? '#6366f1' : undefined,
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', width: '100%' }}>
                          <span style={{ flex: 1 }}>{col.label}</span>
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
                {(loading || !activeUser) ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                        <RefreshCw size={20} className="spin" /> Loading payment history...
                      </div>
                    </td>
                  </tr>
                ) : sortedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No payment transactions found. Select a plan to start auto trading.
                    </td>
                  </tr>
                ) : (
                  sortedPayments.map((p) => {
                    const formattedDate = new Date(p.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    let badgeClass = 'badge-info';
                    if (p.status === 'success') badgeClass = 'badge-success';
                    if (p.status === 'failed') badgeClass = 'badge-danger';
                    
                    return (
                      <tr key={p.id}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none' }}>
                          <Calendar size={14} style={{ color: 'var(--text-subtle)' }} />
                          <span>{formattedDate}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{p.plan?.name || 'Subscription Plan'}</td>
                        <td style={{ fontWeight: 700 }}>₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                          {p.razorpayPaymentId || '--'}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-subtle)' }}>
                          {p.razorpayOrderId}
                        </td>
                        <td>
                          <span className={`badge ${badgeClass}`} style={{ textTransform: 'capitalize' }}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
        <ShieldCheck size={16} />
        <span>For any transaction queries or custom corporate billing requests, write to support.</span>
      </div>
      <style>{`
@media (max-width: 1024px) {
  .table-responsive table { font-size: 12px; }
}
@media (max-width: 768px) {
  .page-payments { gap: 16px !important; }
  .page-payments h1 { font-size: 20px !important; }
}
@media (max-width: 640px) {
  .page-payments h1 { font-size: 18px !important; }
  .table-responsive table { font-size: 11px; }
  .table-responsive th, .table-responsive td { padding: 8px 4px !important; }
  .table-responsive th:nth-child(4), .table-responsive td:nth-child(4) { display: none; }
  .table-responsive th:nth-child(5), .table-responsive td:nth-child(5) { display: none; }
}
@media (max-width: 480px) {
  .page-payments { gap: 12px !important; padding: 0 4px !important; }
  .table-responsive table { font-size: 10px; }
  .table-responsive th, .table-responsive td { padding: 6px 3px !important; }
  table th:nth-child(2), table td:nth-child(2) { display: none; }
}
      `}</style>
    </div>
  );
}

