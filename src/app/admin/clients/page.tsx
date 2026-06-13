'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { Button } from '../../../views/components/Button';
import { Modal } from '../../../views/components/Modal';
import Link from 'next/link';
import { Plus, Eye, Trash2 } from 'lucide-react';

export default function ClientsPage() {
  const { clients, addClient, deleteClient } = useAppViewModel();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{ userId: string; password: string } | null>(null);

  // Add Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [zerodhaClientId, setZerodhaClientId] = useState('');
  const [zerodhaApiKey, setZerodhaApiKey] = useState('');
  const [zerodhaApiSecret, setZerodhaApiSecret] = useState('');
  const [capital, setCapital] = useState('50000');

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addClient({
      name,
      email,
      zerodhaClientId,
      zerodhaApiKey,
      zerodhaApiSecret,
      capital: Number(capital),
      riskPercentage: 1.00,
    });
    if (result && result.success) {
      setGeneratedCreds(result.credentials);
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setZerodhaClientId('');
      setZerodhaApiKey('');
      setZerodhaApiSecret('');
      setCapital('50000');
    }
  };

  const toggleClientStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateClient(id, { tradingStatus: nextStatus });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Client Management
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Configure API configurations, trading allocations, and active status.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> Add New Client
        </Button>
      </div>

      {/* Main Clients Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            All Active & Configured Clients ({clients.length})
          </h3>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Zerodha Client ID</th>
                <th>Capital (INR)</th>
                <th>Trading Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No client accounts registered. Click "Add New Client" to connect a Zerodha terminal.
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const isTrading = client.tradingStatus === 'active';
                  return (
                    <tr key={client.id}>
                      <td style={{ fontWeight: 600 }}>{client.user?.name || client.name}</td>
                      <td>{client.user?.email || client.email}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{client.zerodhaClientId || '--'}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(client.capital).toLocaleString()}</td>
                      <td>
                        <span
                          className={`badge ${isTrading ? 'badge-success' : 'badge-red'}`}
                          style={{ cursor: 'pointer' }}
                        >
                          {client.tradingStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Link
                            href={`/admin/clients/${client.id}`}
                            style={{
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                            title="View / Edit Client Details"
                          >
                            <Eye size={18} />
                          </Link>
                          <button
                            onClick={() => deleteClient(client.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                              transition: 'background-color 0.2s',
                            }}
                            title="Delete Client"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Client Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Client">
        <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Client Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vikash sharma"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. vikash@gmail.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Zerodha Client ID</label>
            <input
              type="text"
              required
              value={zerodhaClientId}
              onChange={(e) => setZerodhaClientId(e.target.value)}
              placeholder="e.g. RZJ500"
            />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              * Client login User ID & Password will be automatically generated.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Kite API Key</label>
              <input
                type="text"
                required
                value={zerodhaApiKey}
                onChange={(e) => setZerodhaApiKey(e.target.value)}
                placeholder="4y7j026qyv9lkacw"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Kite API Secret</label>
              <input
                type="text"
                required
                value={zerodhaApiSecret}
                onChange={(e) => setZerodhaApiSecret(e.target.value)}
                placeholder="xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Allocated Capital (INR)</label>
            <input
              type="number"
              required
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Client</Button>
          </div>
        </form>
      </Modal>

      {/* Credentials Show Modal */}
      <Modal isOpen={!!generatedCreds} onClose={() => setGeneratedCreds(null)} title="Client Credentials Generated">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Client account has been successfully created. Share these credentials with the client so they can log in to their dashboard panel:
          </p>
          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Login User ID</span>
              <code style={{ display: 'block', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', border: '1px solid #e2e8f0' }}>
                {generatedCreds?.userId}
              </code>
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Password</span>
              <code style={{ display: 'block', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', border: '1px solid #e2e8f0' }}>
                {generatedCreds?.password}
              </code>
            </div>
          </div>
          <Button onClick={() => setGeneratedCreds(null)} style={{ marginTop: '8px' }}>
            Close & Continue
          </Button>
        </div>
      </Modal>
    </div>
  );
}
