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
  user: {
    name: string;
    email: string;
  };
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
        // Remove the processed request from the list
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
          <table className="table-compact">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>PAN</th>
                <th>Aadhaar</th>
                <th>DOB</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No pending KYC requests.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id}>
                    <td style={{ fontWeight: 600 }}>{request.user.name}</td>
                    <td>{request.user.email}</td>
                    <td>{request.panNumber || '--'}</td>
                    <td>{request.aadhaarNumber || '--'}</td>
                    <td>{request.dob || '--'}</td>
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
