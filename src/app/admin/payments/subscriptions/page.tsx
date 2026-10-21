'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../../../../shared/components/views/Card';
import { Loader } from '../../../../shared/components/views/Loader';
import { Button } from '../../../../shared/components/views/Button';
import { Modal } from '../../../../shared/components/views/Modal';
import { CreditCard, Download, Search, TrendingUp, CheckCircle, AlertCircle, Clock, RefreshCw, Smartphone, Eye, Check, X, FileText, Trash2 } from 'lucide-react';
import { API_ENDPOINTS } from '../../../../core/constants';
import { api } from '../../../../shared/services/api';

export default function SubscriptionTransactionsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState<{ id: string; action: 'approve' | 'reject' | 'delete' } | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Tabs: 'all' = All Payments, 'manual' = Manual Requests
  const [activeTab, setActiveTab] = useState<'all' | 'manual'>('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [sortKey, setSortKey] = useState<string | null>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const isManualPayment = (p: any) => {
    return Boolean(
      p.razorpayOrderId?.startsWith('MANUAL_UPI_') ||
      p.screenshotUrl ||
      p.paymentMethod === 'manual' ||
      (p.status === 'pending' && !p.razorpayPaymentId?.startsWith('pay_'))
    );
  };

  const fetchPayments = async (forceFresh = false) => {
    try {
      const url = forceFresh
        ? `${API_ENDPOINTS.PAYMENTS_HISTORY}?all=true&fresh=true&_t=${Date.now()}`
        : `${API_ENDPOINTS.PAYMENTS_HISTORY}?all=true`;
      const res = await api.get(url);
      if (res.success) {
        setPayments(res.payments || []);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentActionDirect = async (txn: any, action: 'approve' | 'reject' | 'delete') => {
    const actionLabel = action === 'approve' ? 'APPROVE' : action === 'reject' ? 'REJECT' : 'DELETE';
    const confirmMsg = action === 'approve'
      ? `Are you sure you want to approve this payment of ₹${Number(txn.amount || 0).toLocaleString('en-IN')} for ${txn.user?.name || 'this client'} and activate their subscription?`
      : action === 'reject'
        ? `Are you sure you want to reject this payment request from ${txn.user?.name || 'client'}?`
        : `Are you sure you want to permanently DELETE this payment record (${txn.razorpayPaymentId || txn.id})?`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    setProcessingAction({ id: txn.id, action });
    try {
      const res = await api.post('/api/admin/payments/action', {
        paymentId: txn.id,
        action
      });
      if (res.success) {
        // 1. Immediate optimistic UI update so row and counters update without delay!
        setPayments(prevPayments => {
          if (action === 'delete') {
            return prevPayments.filter(p => p.id !== txn.id);
          }
          return prevPayments.map(p => {
            if (p.id === txn.id) {
              return {
                ...p,
                status: action === 'approve' ? 'success' : 'failed'
              };
            }
            return p;
          });
        });

        if (selectedPayment && selectedPayment.id === txn.id) {
          if (action === 'delete') {
            setSelectedPayment(null);
          } else {
            setSelectedPayment((prev: any) => ({
              ...prev,
              status: action === 'approve' ? 'captured' : 'failed'
            }));
          }
        }

        // 2. Fresh server sync in background with cache-busting
        await fetchPayments(true);

        const successText = res.message || (
          action === 'approve'
            ? 'Payment approved & subscription activated!'
            : action === 'reject'
              ? 'Payment request rejected.'
              : 'Payment record deleted.'
        );
        showToast(successText, 'success');
      } else {
        showToast(res.error || `Failed to ${actionLabel} payment`, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error occurred while processing payment action', 'error');
    } finally {
      setActionLoading(false);
      setProcessingAction(null);
    }
  };

  const handlePaymentAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (!selectedPayment) return;
    await handlePaymentActionDirect(selectedPayment, action);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const manualPaymentsCount = useMemo(
    () => payments.filter(isManualPayment).length,
    [payments]
  );

  const pendingManualCount = useMemo(
    () => payments.filter(p => isManualPayment(p) && (p.status?.toLowerCase() === 'pending' || p.status?.toLowerCase() === 'created')).length,
    [payments]
  );

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
        month: 'short',
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
    const list = payments.filter(p => {
      const status = (p.status || '').toLowerCase();
      const isPending = status === 'pending' || status === 'created';

      // Tab filter: Manual Requests tab only displays pending requests requiring action
      if (activeTab === 'manual') {
        if (!isManualPayment(p) || !isPending) {
          return false;
        }
      }

      const clientName = (p.user?.name || '').toLowerCase();
      const clientEmail = (p.user?.email || '').toLowerCase();
      const planName = (p.plan?.name || '').toLowerCase();
      const txnId = (p.razorpayPaymentId || p.razorpayOrderId || p.id || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = clientName.includes(query) || clientEmail.includes(query) || planName.includes(query) || txnId.includes(query);
      const matchesStatus = activeTab === 'manual' || statusFilter === 'all' || status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    if (!sortKey) return list;
    return list.sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortKey === 'client') { aVal = a.user?.name || ''; bVal = b.user?.name || ''; }
      else if (sortKey === 'plan') { aVal = a.plan?.name || ''; bVal = b.plan?.name || ''; }
      else if (sortKey === 'amount') { aVal = Number(a.amount || 0); bVal = Number(b.amount || 0); }
      else if (sortKey === 'date') { aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); }
      else if (sortKey === 'status') { aVal = a.status || ''; bVal = b.status || ''; }
      else { aVal = ''; bVal = ''; }
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [payments, activeTab, searchQuery, statusFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + pageSize);

  const handleExportCSV = () => {
    const headers = ['Txn ID', 'Client Name', 'Client Email', 'Subscription Plan', 'Amount (INR)', 'Payment Mode', 'Date', 'Status'];
    const rows = filteredPayments.map(p => [
      p.razorpayPaymentId || p.razorpayOrderId || p.id,
      p.user?.name || 'Unknown Client',
      p.user?.email || '',
      p.plan?.name || 'Subscription Plan',
      Number(p.amount || 0).toFixed(2),
      isManualPayment(p) ? 'Manual UPI' : 'Online Gateway',
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
    link.setAttribute('download', `subscription_transactions_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 0.8s linear infinite !important;
        }
      `}</style>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          padding: '12px 20px',
          borderRadius: '10px',
          backgroundColor: toastMessage.type === 'error' ? '#EF4444' : '#10B981',
          color: 'white',
          fontWeight: 600,
          fontSize: '14px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Subscription Plan Transactions
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Manage online gateway payments and review manual UPI approvals.</p>
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Pending Approvals</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: pendingPayments.length > 0 ? '#F59E0B' : 'var(--text-primary)' }}>
                {pendingPayments.length}
              </h3>
              <p style={{ color: '#D97706', fontSize: '11px', marginTop: '2px', fontWeight: 600 }}>
                {pendingManualCount} manual requests pending
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Pending Requests</p>
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: pendingManualCount > 0 ? '#EF4444' : 'var(--text-primary)' }}>{pendingManualCount}</h3>
              <p style={{ color: pendingManualCount > 0 ? '#EF4444' : 'var(--text-secondary)', fontSize: '11px', marginTop: '2px', fontWeight: pendingManualCount > 0 ? 600 : 400 }}>
                {pendingManualCount > 0 ? `${pendingManualCount} awaiting action` : 'All requests processed'}
              </p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Smartphone size={20} />
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>From approved subscriptions</p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <TrendingUp size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* 2 Tabs: All Payments vs Manual Requests */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        padding: '6px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        width: 'fit-content',
        gap: '8px'
      }}>
        <button
          type="button"
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            background: activeTab === 'all' ? 'var(--bg-white)' : 'transparent',
            color: activeTab === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: activeTab === 'all' ? 700 : 500,
            cursor: 'pointer',
            boxShadow: activeTab === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <CreditCard size={15} />
          All Payments
          <span style={{
            fontSize: '11px',
            padding: '2px 7px',
            borderRadius: '10px',
            background: activeTab === 'all' ? 'rgba(99, 102, 241, 0.12)' : 'var(--border-color)',
            color: activeTab === 'all' ? '#6366f1' : 'var(--text-secondary)',
            fontWeight: 700
          }}>
            {payments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('manual'); setCurrentPage(1); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            background: activeTab === 'manual' ? 'var(--bg-white)' : 'transparent',
            color: activeTab === 'manual' ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: activeTab === 'manual' ? 700 : 500,
            cursor: 'pointer',
            boxShadow: activeTab === 'manual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Smartphone size={15} />
          Manual Requests
          {pendingManualCount > 0 ? (
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '10px',
              background: '#EF4444',
              color: 'white',
              fontWeight: 800,
              boxShadow: '0 1px 4px rgba(239, 68, 68, 0.4)'
            }}>
              {pendingManualCount} Pending
            </span>
          ) : (
            <span style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '10px',
              background: activeTab === 'manual' ? 'rgba(139, 92, 246, 0.12)' : 'var(--border-color)',
              color: activeTab === 'manual' ? '#8B5CF6' : 'var(--text-secondary)',
              fontWeight: 700
            }}>
              0
            </span>
          )}
        </button>
      </div>

      {/* Transactions Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
              {activeTab === 'manual' ? 'Pending Manual Requests' : 'All Subscription Payments'} ({filteredPayments.length})
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {activeTab === 'manual'
                ? 'Review pending client UPI reference numbers, inspect uploaded receipts, and accept or reject requests.'
                : 'Complete log of all subscription payments made via Razorpay gateway and manual UPI transfers.'}
            </p>
          </div>
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
              placeholder={activeTab === 'manual' ? 'Search by client, UTR number, plan...' : 'Search by client name, email, plan, txn ID...'}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ paddingLeft: '32px', height: '34px', fontSize: '12px', width: '100%', outline: 'none', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-white)', color: 'var(--text-primary)' }}
            />
          </div>

          {activeTab === 'all' && (
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', height: '34px', outline: 'none', background: 'var(--bg-white)', flex: '1 1 120px', minWidth: '110px' }}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="captured">Captured / Approved</option>
              <option value="success">Success</option>
              <option value="failed">Rejected / Failed</option>
            </select>
          )}
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>{activeTab === 'manual' ? 'UTR / Txn Ref' : 'Txn ID'}</th>
                {[
                  { key: 'client', label: 'Client' },
                  { key: 'plan', label: 'Plan' },
                  { key: 'amount', label: 'Amount' },
                  ...(activeTab === 'manual' ? [{ key: 'proof', label: 'Payment Slip' }] : []),
                  { key: 'date', label: 'Date' },
                  ...(activeTab === 'all' ? [{ key: 'type', label: 'Method' }] : []),
                  { key: 'status', label: 'Status' },
                  ...(activeTab === 'manual' ? [{ key: 'actions', label: 'Actions' }] : []),
                ].map(col => {
                  const isSortable = !['proof', 'actions', 'type'].includes(col.key);
                  const isActive = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => isSortable && handleSort(col.key)}
                      style={{
                        cursor: isSortable ? 'pointer' : 'default',
                        userSelect: 'none',
                        color: isActive ? '#6366f1' : undefined,
                        transition: 'color 0.15s'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span>{col.label}</span>
                        {isSortable && (
                          <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style={{ flexShrink: 0, opacity: isActive ? 1 : 0.35 }}>
                            <path d="M4 0L7 4H1L4 0Z" fill={isActive && sortDir === 'asc' ? '#6366f1' : 'rgba(148,163,184,0.8)'}/>
                            <path d="M4 12L1 8H7L4 12Z" fill={isActive && sortDir === 'desc' ? '#6366f1' : 'rgba(148,163,184,0.8)'}/>
                          </svg>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'manual' ? 8 : 7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                      <RefreshCw size={20} className="spin" style={{ marginRight: '10px' }} /> Loading subscription transactions...
                    </div>
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'manual' ? 8 : 7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                    {searchQuery || statusFilter !== 'all'
                      ? 'No payments match the selected filters.'
                      : activeTab === 'manual'
                        ? 'No manual payment requests pending approval.'
                        : 'No payment transactions found.'}
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((txn, idx) => {
                  const isSuccess = txn.status?.toLowerCase() === 'captured' || txn.status?.toLowerCase() === 'success' || txn.status?.toLowerCase() === 'completed';
                  const isFailed = txn.status?.toLowerCase() === 'failed';
                  const isPending = txn.status?.toLowerCase() === 'pending' || txn.status?.toLowerCase() === 'created';
                  const isManual = isManualPayment(txn);

                  return (
                    <tr
                      key={txn.id || idx}
                      onClick={() => setSelectedPayment(txn)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Click to view payment details and receipt"
                    >
                      <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '12px', color: isManual ? '#8B5CF6' : 'inherit' }}>
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
                      <td>
                        <span style={{ fontWeight: 500 }}>{txn.plan?.name || 'Subscription Plan'}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{Number(txn.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Payment Slip column for manual tab */}
                      {activeTab === 'manual' && (
                        <td>
                          {txn.screenshotUrl ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPayment(txn);
                              }}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                              title="Click to view full screenshot"
                            >
                              <img
                                src={txn.screenshotUrl}
                                alt="Slip"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (!target.dataset.triedFallback && target.src.includes('/uploads/')) {
                                    target.dataset.triedFallback = 'true';
                                    target.src = target.src.replace('/uploads/', '/api/uploads/');
                                  }
                                }}
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '6px',
                                  objectFit: 'cover',
                                  border: '1px solid var(--border-color)',
                                  backgroundColor: '#fff'
                                }}
                              />
                              <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Eye size={12} /> View
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>No slip</span>
                          )}
                        </td>
                      )}

                      <td>{formatDate(txn.createdAt)}</td>

                      {/* Payment Method column for All tab */}
                      {activeTab === 'all' && (
                        <td>
                          {isManual ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              fontWeight: 600, fontSize: '11px', color: '#8B5CF6',
                              background: 'rgba(139, 92, 246, 0.1)', padding: '3px 8px', borderRadius: '6px'
                            }}>
                              <Smartphone size={12} /> Manual UPI
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              fontWeight: 600, fontSize: '11px', color: '#10B981',
                              background: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '6px'
                            }}>
                              <CreditCard size={12} /> Razorpay
                            </span>
                          )}
                        </td>
                      )}

                      <td>
                        <span className={`badge ${
                          isSuccess ? 'badge-success' : isFailed ? 'badge-danger' : 'badge-warning'
                        }`} style={{ fontWeight: 700 }}>
                          {isSuccess ? 'APPROVED' : isFailed ? 'REJECTED' : 'PENDING'}
                        </span>
                      </td>

                      {/* Accept & Reject & Delete Action Buttons for Manual Requests */}
                      {activeTab === 'manual' && (
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {(() => {
                              const isApproving = processingAction?.id === txn.id && processingAction?.action === 'approve';
                              const isRejecting = processingAction?.id === txn.id && processingAction?.action === 'reject';
                              const isDeleting = processingAction?.id === txn.id && processingAction?.action === 'delete';
                              const isRowBusy = processingAction?.id === txn.id;

                              return (
                                <>
                                  {isPending ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePaymentActionDirect(txn, 'approve');
                                        }}
                                        disabled={actionLoading}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: '32px',
                                          height: '32px',
                                          backgroundColor: '#10B981',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '8px',
                                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                                          opacity: actionLoading ? (isApproving ? 1 : 0.6) : 1,
                                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                                          transition: 'all 0.15s'
                                        }}
                                        title="Approve / Accept payment"
                                      >
                                        {isApproving ? (
                                          <RefreshCw size={14} className="animate-spin" />
                                        ) : (
                                          <Check size={16} strokeWidth={2.5} />
                                        )}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePaymentActionDirect(txn, 'reject');
                                        }}
                                        disabled={actionLoading}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: '32px',
                                          height: '32px',
                                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                          color: '#EF4444',
                                          border: '1px solid rgba(239, 68, 68, 0.3)',
                                          borderRadius: '8px',
                                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                                          opacity: actionLoading ? (isRejecting ? 1 : 0.6) : 1,
                                          transition: 'all 0.15s'
                                        }}
                                        title="Reject payment request"
                                      >
                                        {isRejecting ? (
                                          <RefreshCw size={14} className="animate-spin" />
                                        ) : (
                                          <X size={16} strokeWidth={2.5} />
                                        )}
                                      </button>
                                    </>
                                  ) : isSuccess ? (
                                    <span style={{ color: '#10B981', fontWeight: 700, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <CheckCircle size={14} /> Approved
                                    </span>
                                  ) : (
                                    <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <AlertCircle size={14} /> Rejected
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePaymentActionDirect(txn, 'delete');
                                    }}
                                    disabled={actionLoading}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '32px',
                                      height: '32px',
                                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                      color: '#EF4444',
                                      border: '1px solid rgba(239, 68, 68, 0.25)',
                                      borderRadius: '8px',
                                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                                      opacity: actionLoading ? (isDeleting ? 1 : 0.6) : 1,
                                      transition: 'all 0.15s'
                                    }}
                                    title="Delete this payment record"
                                  >
                                    {isDeleting ? (
                                      <RefreshCw size={13} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={14} />
                                    )}
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                      )}
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
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>UTR / Payment Reference</span>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>{selectedPayment.razorpayPaymentId || '--'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Order ID / Gateway Ref</span>
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
                      : 'badge-warning'
                }`} style={{ fontWeight: 700 }}>
                  {selectedPayment.status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Transaction Type</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Credit (Subscription)</span>
              </div>
            </div>

            {/* Payment Screenshot Preview (For manual payments) */}
            {selectedPayment.screenshotUrl && (
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                  📸 Payment Screenshot / Proof Uploaded:
                </span>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={selectedPayment.screenshotUrl}
                    alt="Payment Receipt"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.triedFallback && target.src.includes('/uploads/')) {
                        target.dataset.triedFallback = 'true';
                        target.src = target.src.replace('/uploads/', '/api/uploads/');
                      } else {
                        target.style.display = 'none';
                        const fallbackDiv = target.parentElement?.querySelector('.img-fallback-msg') as HTMLElement;
                        if (fallbackDiv) fallbackDiv.style.display = 'block';
                      }
                    }}
                    style={{
                      maxHeight: '260px',
                      maxWidth: '100%',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      objectFit: 'contain',
                      display: 'block',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      window.open(selectedPayment.screenshotUrl, '_blank');
                    }}
                    title="Click to view full image in new tab"
                  />
                  <div className="img-fallback-msg" style={{ display: 'none', padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '12px', marginTop: '6px' }}>
                    ⚠️ Screenshot image could not be loaded from storage. <a href={selectedPayment.screenshotUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', fontWeight: 600, color: '#991b1b' }}>Open link</a>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    Click image to expand in full screen
                  </span>
                </div>
              </div>
            )}

            {actionMessage && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', fontSize: '13px', fontWeight: 600 }}>
                {actionMessage}
              </div>
            )}

            {/* Action Buttons for Pending Payments */}
            {selectedPayment.status?.toLowerCase() === 'pending' ? (
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handlePaymentAction('approve')}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? (processingAction?.action === 'approve' ? 1 : 0.6) : 1,
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  {processingAction?.action === 'approve' ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Approving & Activating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Approve & Activate Subscription
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handlePaymentAction('reject')}
                  disabled={actionLoading}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                    border: '1px solid #EF4444',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? (processingAction?.action === 'reject' ? 1 : 0.6) : 1
                  }}
                >
                  {processingAction?.action === 'reject' ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Rejecting...
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} /> Reject Payment
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handlePaymentAction('delete')}
                  disabled={actionLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? (processingAction?.action === 'delete' ? 1 : 0.6) : 1
                  }}
                  title="Permanently delete this payment record"
                >
                  {processingAction?.action === 'delete' ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {processingAction?.action === 'delete' ? 'Deleting...' : 'Delete'}
                </button>

                <Button onClick={() => setSelectedPayment(null)} disabled={actionLoading} style={{ border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-body)' }}>
                  Close
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => handlePaymentAction('delete')}
                  disabled={actionLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer'
                  }}
                  title="Permanently delete this payment record"
                >
                  <Trash2 size={16} /> Delete Record
                </button>

                <Button onClick={() => setSelectedPayment(null)}>
                  Close
                </Button>
              </div>
            )}
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
