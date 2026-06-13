'use client';

import React, { useEffect, useState } from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { Loader } from '../../../views/components/Loader';
import { Calendar, Tag, CreditCard, ShieldCheck } from 'lucide-react';

export default function ClientPaymentHistory() {
  const { activeUser } = useAppViewModel();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

    fetch(`/api/payments/history?userId=${activeUser.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPayments(data.payments);
        }
      })
      .catch(err => console.error('Failed to load transaction history:', err))
      .finally(() => setLoading(false));
  }, [activeUser]);

  if (loading || !activeUser) {
    return <Loader title="Loading history" text="Fetching transaction logs and invoice metadata..." fullscreen={false} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                  <th>Date & Time</th>
                  <th>Subscription Plan</th>
                  <th>Amount</th>
                  <th>Razorpay Payment ID</th>
                  <th>Razorpay Order ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No payment transactions found. Select a plan to start auto trading.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
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
    </div>
  );
}
