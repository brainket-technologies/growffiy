'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../../../shared/components/views/Card';
import { Loader } from '../../../shared/components/views/Loader';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';
import { API_ENDPOINTS } from '../../../core/constants';
import { api } from '../../../shared/services/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <Loader title="Loading billing logs" text="Fetching transaction records and gateway reports..." fullscreen={false} />;
  }

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
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
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
                <th>Client</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No transaction records found in database.
                  </td>
                </tr>
              ) : (
                payments.map((txn, idx) => {
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
