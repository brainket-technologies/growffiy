'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/views/Card';
import { Button } from '@/shared/components/views/Button';
import { Loader } from '@/shared/components/views/Loader';
import { RefreshCw } from 'lucide-react';

interface KYCRequest {
  id: string;
  panNumber: string;
  aadhaarNumber: string;
  dob: string;
  subscriptionStatus: string;
  accessToken: string | null;
  zerodhaApiKey: string | null;
  kiteSessionActive: boolean;
  liveMargin: number | null;
  user: {
    name: string;
    email: string;
    userId: string;
  };
}

function StatusBadge({ value, trueLabel = 'Active', falseLabel = 'Inactive', warn = false }: {
  value: boolean | string;
  trueLabel?: string;
  falseLabel?: string;
  warn?: boolean;
}) {
  const isTrue = value === true || value === 'active' || value === 'verified';
  const isWarn = warn && (value === 'under_review' || value === 'pending');
  const bg = isTrue ? '#dcfce7' : isWarn ? '#fef9c3' : '#fee2e2';
  const color = isTrue ? '#166534' : isWarn ? '#854d0e' : '#991b1b';
  const label = isTrue ? trueLabel : isWarn ? 'Under Review' : falseLabel;
  return (
    <span style={{
      background: bg, color, padding: '2px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap'
    }}>
      {label}
    </span>
  );
}

export default function KYCRequestsPage() {
  const [requests, setRequests] = useState<KYCRequest[]>([]);
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

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/kyc');
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error('Error fetching KYC requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (clientId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setRequests((prev) => prev.filter((r) => r.id !== clientId));
        alert(`Request ${status} successfully.`);
      } else {
        alert(`Failed to update status: ${data.error}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('An error occurred.');
    }
  };

  const sortedRequests = React.useMemo(() => {
    if (!sortKey) return requests;
    return [...requests].sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortKey === 'name') { aVal = a.user?.name || ''; bVal = b.user?.name || ''; }
      else if (sortKey === 'email') { aVal = a.user?.email || ''; bVal = b.user?.email || ''; }
      else if (sortKey === 'pan') { aVal = a.panNumber || ''; bVal = b.panNumber || ''; }
      else if (sortKey === 'aadhaar') { aVal = a.aadhaarNumber || ''; bVal = b.aadhaarNumber || ''; }
      else if (sortKey === 'dob') { aVal = a.dob || ''; bVal = b.dob || ''; }
      else if (sortKey === 'subscription') { aVal = a.subscriptionStatus || ''; bVal = b.subscriptionStatus || ''; }
      else if (sortKey === 'session') { aVal = a.kiteSessionActive ? 1 : 0; bVal = b.kiteSessionActive ? 1 : 0; }
      else if (sortKey === 'margin') { aVal = Number(a.liveMargin || 0); bVal = Number(b.liveMargin || 0); }
      else { aVal = ''; bVal = ''; }
      
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [requests, sortKey, sortDir]);

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Pending KYC Requests</h1>

      <Card style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table-compact" style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                {[
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'pan', label: 'PAN' },
                  { key: 'aadhaar', label: 'Aadhaar' },
                  { key: 'dob', label: 'DOB' },
                  { key: 'subscription', label: 'Subscription' },
                  { key: 'session', label: 'Kite Session' },
                  { key: 'margin', label: 'Live Margin' },
                ].map(col => {
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
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                      <RefreshCw size={20} className="spin" style={{ marginRight: '10px' }} /> Loading KYC Requests...
                    </div>
                  </td>
                </tr>
              ) : sortedRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No pending KYC requests.
                  </td>
                </tr>
              ) : (
                sortedRequests.map((request) => (
                  <tr key={request.id}>
                    <td style={{ fontWeight: 600 }}>{request.user.name}</td>
                    <td>{request.user.email}</td>
                    <td style={{ fontFamily: 'monospace' }}>{request.panNumber || '--'}</td>
                    <td style={{ fontFamily: 'monospace' }}>{request.aadhaarNumber || '--'}</td>
                    <td>{request.dob || '--'}</td>
                    <td>
                      <StatusBadge
                        value={request.subscriptionStatus}
                        trueLabel="Active"
                        falseLabel={request.subscriptionStatus || 'Pending'}
                        warn={request.subscriptionStatus === 'pending'}
                      />
                    </td>
                    <td>
                      <StatusBadge
                        value={request.kiteSessionActive}
                        trueLabel="Live"
                        falseLabel="No Session"
                      />
                    </td>
                    <td>
                      {request.liveMargin !== null
                        ? <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{Number(request.liveMargin).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                      }
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Button variant="success" onClick={() => handleUpdateStatus(request.id, 'verified')}>
                          Accept
                        </Button>
                        <Button variant="danger" onClick={() => handleUpdateStatus(request.id, 'rejected')}>
                          Reject
                        </Button>
                      </div>
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
