'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { Button } from '../../../views/components/Button';
import { Modal } from '../../../views/components/Modal';
import { Plus, User, Play, ShieldAlert, Award, FileText, CheckCircle2 } from 'lucide-react';

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient, colors } = useAppViewModel();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [zerodhaClientId, setZerodhaClientId] = useState('');
  const [capital, setCapital] = useState('50000');

  const selectedClient = clients.find((c) => c.id === (selectedClientId || clients[0]?.id));

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addClient({
      name,
      email,
      userId,
      zerodhaClientId,
      capital: Number(capital),
      riskPercentage: 1.00,
    });
    if (success) {
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setUserId('');
      setZerodhaClientId('');
      setCapital('50000');
    }
  };

  const toggleClientStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateClient(id, { tradingStatus: nextStatus });
  };

  const processStages = [
    { num: '01', title: 'Clients Profile', desc: 'Add/manage client profiles & API mappings' },
    { num: '02', title: 'Strategy Design', desc: 'Set parameters, stop loss & profit targets' },
    { num: '03', title: 'Pre-Open Scan', desc: 'Detect breakout signals automatically' },
    { num: '04', title: 'Trade Execution', desc: 'Auto-order placement via Kite API' },
    { num: '05', title: 'Risk Management', desc: 'Enforce capital checks & risk sizing rules' },
    { num: '06', title: 'Reports & Logs', desc: 'Realtime updates & visual performance analytics' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column - Clients List */}
        <Card style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            All Clients ({clients.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {clients.map((client) => {
              const isActive = client.id === selectedClient?.id;
              const isTrading = client.tradingStatus === 'active';
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'var(--color-info-bg)' : '#f8fafc',
                    border: `1px solid ${isActive ? 'var(--color-info)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                      {client.user?.name || client.name}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      ID: {client.zerodhaClientId || 'Not Connect'}
                    </p>
                  </div>
                  <span className={`badge ${isTrading ? 'badge-success' : 'badge-danger'}`}>
                    {client.tradingStatus}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right Column - Client Details & Flow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Strategy Process Flow */}
          <Card>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: 'var(--font-title)' }}>
              Auto Trading Process Flow
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              {processStages.map((stage, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#fafbfc',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-info)' }}>{stage.num}</p>
                  <p style={{ fontSize: '11px', fontWeight: 600, margin: '4px 0 2px' }}>{stage.title}</p>
                  <p style={{ fontSize: '9px', color: 'var(--text-secondary)', lineHeight: '1.2' }}>{stage.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Client Details Card */}
          {selectedClient ? (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                    Client Profile Details
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Configure parameters for client account execution</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button
                    variant={selectedClient.tradingStatus === 'active' ? 'secondary' : 'success'}
                    onClick={() => toggleClientStatus(selectedClient.id, selectedClient.tradingStatus)}
                  >
                    {selectedClient.tradingStatus === 'active' ? 'Disable Trading' : 'Enable Trading'}
                  </Button>
                  <Button variant="danger" onClick={() => deleteClient(selectedClient.id)}>
                    Delete Account
                  </Button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Account Details */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Account Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p><strong>Name:</strong> {selectedClient.user?.name || selectedClient.name}</p>
                    <p><strong>Email:</strong> {selectedClient.user?.email || selectedClient.email}</p>
                    <p><strong>Demat ID:</strong> {selectedClient.zerodhaClientId || '--'}</p>
                    <p><strong>Assigned Strategy:</strong> Pre-Open Breakout</p>
                  </div>
                </div>

                {/* Risk and Allocations */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Trading Parameters
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p><strong>Allocated Capital:</strong> ₹{Number(selectedClient.capital).toLocaleString()}</p>
                    <p><strong>Risk Per Trade:</strong> {Number(selectedClient.riskPercentage).toFixed(2)}%</p>
                    <p><strong>Max Daily Loss Limit:</strong> 3.00%</p>
                    <p><strong>KYC Status:</strong> <span className="badge badge-success">Verified</span></p>
                  </div>
                </div>
              </div>

              {/* Zerodha Token Status */}
              <div style={{ marginTop: '20px', padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <strong>API Access Token:</strong> Active. Valid for next 12 hours.
                </span>
              </div>
            </Card>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                Please add a client profile to get started.
              </div>
            </Card>
          )}
        </div>
      </div>

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
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>User ID</label>
              <input
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Zerodha Client ID</label>
              <input
                type="text"
                required
                value={zerodhaClientId}
                onChange={(e) => setZerodhaClientId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
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
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Client</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
