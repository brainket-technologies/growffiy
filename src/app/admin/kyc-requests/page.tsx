'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/views/Card';
import { Button } from '@/shared/components/views/Button';
import { Loader } from '@/shared/components/views/Loader';

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

  if (loading) return <Loader title="Loading KYC Requests" />;

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Pending KYC Requests</h1>

      <Card style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table-compact" style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>PAN</th>
                <th>Aadhaar</th>
                <th>DOB</th>
                <th>Subscription</th>
                <th>Kite Session</th>
                <th>Live Margin</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No pending KYC requests.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
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
