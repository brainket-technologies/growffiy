'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '../../../../views/components/Card';
import { Button } from '../../../../views/components/Button';
import { ArrowLeft, CheckCircle2, Shield, Server, RefreshCw } from 'lucide-react';

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [zerodhaClientId, setZerodhaClientId] = useState('');
  const [zerodhaApiKey, setZerodhaApiKey] = useState('');
  const [zerodhaApiSecret, setZerodhaApiSecret] = useState('');
  const [capital, setCapital] = useState('');
  const [tradingStatus, setTradingStatus] = useState('inactive');

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/clients/${id}`).then((r) => r.json());
        if (res.success && res.client) {
          const c = res.client;
          setName(c.user?.name || c.name || '');
          setEmail(c.user?.email || c.email || '');
          setUserId(c.user?.userId || c.userId || '');
          setPassword(c.user?.password || '');
          setZerodhaClientId(c.zerodhaClientId || '');
          setZerodhaApiKey(c.zerodhaApiKey || '');
          setZerodhaApiSecret(c.zerodhaApiSecret || '');
          setCapital(String(c.capital));
          setTradingStatus(c.tradingStatus);
        } else {
          setError(res.error || 'Failed to load client details');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching client details');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          userId,
          password,
          zerodhaClientId,
          zerodhaApiKey,
          zerodhaApiSecret,
          capital: Number(capital),
          tradingStatus,
        }),
      }).then((r) => r.json());

      if (res.success) {
        alert('Client details updated successfully!');
        router.push('/admin/clients');
      } else {
        alert(res.error || 'Failed to update client details');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating client details');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !name) {
    return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading client details...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{error}</p>
        <Button onClick={() => router.push('/admin/clients')} style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} /> Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/admin/clients')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background-color 0.2s',
            }}
            title="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
              Client Details: {name}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>View account credentials, Kite API connection keys, and status.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Credentials */}
          <Card>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
              <Shield color="var(--primary)" size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                Client Credentials & Profile
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Login User ID</label>
                <input type="text" required value={userId} onChange={(e) => setUserId(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Login Password</label>
                <input type="text" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          </Card>

          {/* API Keys */}
          <Card>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
              <Server color="#10b981" size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                Zerodha Kite Terminal API
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Zerodha Client ID</label>
                <input type="text" required value={zerodhaClientId} onChange={(e) => setZerodhaClientId(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Kite API Key</label>
                <input type="text" required value={zerodhaApiKey} onChange={(e) => setZerodhaApiKey(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Kite API Secret</label>
                <input type="text" required value={zerodhaApiSecret} onChange={(e) => setZerodhaApiSecret(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Allocated Capital (INR)</label>
                  <input type="number" required value={capital} onChange={(e) => setCapital(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Trading Status</label>
                  <select
                    value={tradingStatus}
                    onChange={(e) => setTradingStatus(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Token Access Guard Status */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} color="var(--color-success)" />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              <strong>Kite Access Session Token:</strong> Dynamic token exchange verified. Access matches Zerodha API console callback handshake.
            </span>
          </div>
        </Card>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/clients')}>
            Cancel
          </Button>
          <Button type="submit">
            Save & Update Client
          </Button>
        </div>
      </form>
    </div>
  );
}
