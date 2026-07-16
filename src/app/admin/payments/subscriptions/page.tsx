'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../../../../shared/components/views/Card';
import { Loader } from '../../../../shared/components/views/Loader';
import { Button } from '../../../../shared/components/views/Button';
import { Modal } from '../../../../shared/components/views/Modal';
import { CreditCard, Download, Search, TrendingUp, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { API_ENDPOINTS } from '../../../../core/constants';
import { api } from '../../../../shared/services/api';

export default function SubscriptionTransactionsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

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

  const successfulPayments = useMemo(
    () => payments.filter(p => p.status?.toLowerCase() === 'captured' || p.status?.toLowerCase() === 'success' || p.status?.toLowerCase() === 'completed'),
    [payments]
  );
  const failedPayments = useMemo(
    () => payments.filter(p => p.status?.toLowerCase() === 'failed'),
    [payments]
  );
  const pendingPayments = useMemo(
    () => payments.filter(p => p.status?.toLowerCase() === 'pending' || p.status?.toLowerCase() === 'created'),
    [payments]
  );

  const totalRevenue = useMemo(
    () => successfulPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [successfulPayments]
  );
  const totalAmount = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments]
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

  const formatDateTime = (timeStr: string | Date | null) => {
    if (!timeStr) return '--';
    try {
      const date = new Date(timeStr);
      return date.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return '--';
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const clientName = (p.user?.name || '').toLowerCase();
      const clientEmail = (p.user?.email || '').toLowerCase();
      const planName = (p.plan?.name || '').toLowerCase();
      const txnId = (p.razorpayPaymentId || p.razorpayOrderId || p.id || '').toLowerCase();
      const status = (p.status || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = clientName.includes(query) || clientEmail.includes(query) || planName.includes(query) || txnId.includes(query);
      const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + pageSize);

  const handleExportCSV = () => {
    const headers = ['Txn ID', 'Client Name', 'Client Email', 'Subscription Plan', 'Amount (INR)', 'Date', 'Status'];
    const rows = filteredPayments.map(p => [
      p.razorpayPaymentId || p.razorpayOrderId || p.id,
      p.user?.name || 'Unknown Client',
      p.user?.email || '',
      p.plan?.name || 'Subscription Plan',
      Number(p.amount || 0).toFixed(2),
      formatDate(p.createdAt),
      p.status?.toUpperCase() || 'PENDING'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `subscription_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <Loader title="Loading subscription transactions" text="Fetching billing logs and payment gateway receipts..." fullscreen={false} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Subscription Plan Transactions
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>View client subscriptions, gateway payments, and invoices.</p>
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Total Transactions</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{payments.length}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} total</p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <CreditCard size={20} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Successful</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{successfulPayments.length}</h3>
              <p style={{ color: 'var(--color-success)', fontSize: '11px', marginTop: '2px', fontWeight: 600 }}>
                ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} collected
              </p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <CheckCircle size={20} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Failed</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{failedPayments.length}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                ₹{failedPayments.reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} attempted
              </p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <AlertCircle size={20} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Pending</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{pendingPayments.length}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                ₹{pendingPayments.reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} in progress
              </p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Clock size={20} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Total Revenue</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-success)' }}>
                ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>From successful payments</p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <TrendingUp size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            All Subscription Payments ({filteredPayments.length})
          </h3>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center',
          flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '12px 16px',
          borderRadius: '12px', border: '1px solid var(--border-color)'
        }}>
          <div style={{ position: 'relative', flex: '2 1 280px', minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search by client name, email, plan, txn ID..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ paddingLeft: '32px', height: '34px', fontSize: '12px', width: '100%', outline: 'none', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
            />
          </div>

          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', flex: '1 1 120px', minWidth: '110px' }}>
            <option value="all">All Status</option>
            <option value="captured">Captured</option>
            <option value="success">Success</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="created">Created</option>
          </select>
        </div>

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
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    {searchQuery || statusFilter !== 'all'
                      ? 'No payments match the selected filters.'
                      : 'No payment transactions found.'}
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((txn, idx) => {
                  const isSuccess = txn.status?.toLowerCase() === 'captured' || txn.status?.toLowerCase() === 'success' || txn.status?.toLowerCase() === 'completed';
                  const isFailed = txn.status?.toLowerCase() === 'failed';
                  const isPending = txn.status?.toLowerCase() === 'pending' || txn.status?.toLowerCase() === 'created';

                  return (
                    <tr
                      key={txn.id || idx}
                      onClick={() => setSelectedPayment(txn)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Click to view payment details"
                    >
                      <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '12px' }}>
                        {txn.razorpayPaymentId || txn.razorpayOrderId || txn.id?.slice(0, 10)}
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
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontWeight: 600, fontSize: '12px', color: 'var(--color-success)',
                        }}>
                          <TrendingUp size={14} />
                          Credit
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          isSuccess ? 'badge-success' : isFailed ? 'badge-danger' : 'badge-info'
                        }`}>
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

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>
            Showing {filteredPayments.length ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, filteredPayments.length)} of {filteredPayments.length} entries
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }}
              >
                &lt;
              </button>

              {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => {
                const pageNum = currentPage <= 5 ? i + 1 : currentPage + i - 4;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '4px 10px', borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: currentPage === pageNum ? 'var(--primary)' : 'var(--bg-white)',
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
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }}
              >
                &gt;
              </button>
            </div>

            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', cursor: 'pointer', outline: 'none', color: 'var(--text-primary)' }}
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={30}>30 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Payment Details Modal */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title="Payment Details"
      >
        {selectedPayment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="payment-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Client Name</span>
                <strong>{selectedPayment.user?.name || 'Unknown Client'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Client Email</span>
                <strong>{selectedPayment.user?.email || '--'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Subscription Plan</span>
                <strong>{selectedPayment.plan?.name || 'Subscription Plan'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Amount</span>
                <strong style={{ fontSize: '18px', color: 'var(--color-success)' }}>
                  ₹{Number(selectedPayment.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Razorpay Payment ID</span>
                <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{selectedPayment.razorpayPaymentId || '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Razorpay Order ID</span>
                <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{selectedPayment.razorpayOrderId || '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Date & Time</span>
                <span>{formatDateTime(selectedPayment.createdAt)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Payment Date</span>
                <span>{selectedPayment.paymentDate ? formatDateTime(selectedPayment.paymentDate) : '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Status</span>
                <span className={`badge ${
                  selectedPayment.status?.toLowerCase() === 'captured' || selectedPayment.status?.toLowerCase() === 'success' || selectedPayment.status?.toLowerCase() === 'completed'
                    ? 'badge-success'
                    : selectedPayment.status?.toLowerCase() === 'failed'
                      ? 'badge-danger'
                      : 'badge-info'
                }`}>
                  {selectedPayment.status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Transaction Type</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Credit (Subscription)</span>
              </div>
            </div>

            <Button onClick={() => setSelectedPayment(null)} style={{ marginTop: '8px' }}>
              Close
            </Button>
          </div>
        )}
      </Modal>
      <style>{`
        @media (max-width: 768px) {
          .payment-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
