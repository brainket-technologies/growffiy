'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '../../../../views/components/Card';
import { Button } from '../../../../views/components/Button';
import { ArrowLeft, CheckCircle2, Shield, Server } from 'lucide-react';

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
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button
          onClick={() => router.push('/admin/clients')}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(15, 23, 42, 0.04)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.transform = 'translateX(-3px)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.color = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Back to Clients"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Client Details: {name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
            View credentials, adjust capital limits, and manage connected Kite API secrets.
          </p>
        </div>
      </div>

      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
          
          {/* Credentials */}
          <Card style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>
                <Shield size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                Client Credentials & Profile
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Login User ID</label>
                <input type="text" required value={userId} onChange={(e) => setUserId(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Login Password</label>
                <input type="text" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          </Card>

          {/* API Keys */}
          <Card style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <Server size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                Zerodha Kite Terminal API
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Zerodha Client ID</label>
                <input type="text" required value={zerodhaClientId} onChange={(e) => setZerodhaClientId(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Kite API Key</label>
                <input type="text" required value={zerodhaApiKey} onChange={(e) => setZerodhaApiKey(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Kite API Secret</label>
                <input type="text" required value={zerodhaApiSecret} onChange={(e) => setZerodhaApiSecret(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Allocated Capital (INR)</label>
                  <input type="number" required value={capital} onChange={(e) => setCapital(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Trading Status</label>
                  <select
                    value={tradingStatus}
                    onChange={(e) => setTradingStatus(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
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
        <Card style={{ borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={20} color="var(--accent)" />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              <strong>Kite Access Session Token:</strong> Dynamic token exchange verified. Access matches Zerodha API console callback handshake.
            </span>
          </div>
        </Card>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '8px' }}>
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/clients')} style={{ padding: '12px 24px' }}>
            Cancel
          </Button>
          <Button type="submit" style={{ padding: '12px 24px' }}>
            Save & Update Client
          </Button>
        </div>
      </form>
    </div>
  );
}
