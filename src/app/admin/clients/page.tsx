'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { Button } from '../../../views/components/Button';
import { Modal } from '../../../views/components/Modal';
import Link from 'next/link';
import { Plus, Eye, Trash2, Search, Filter, Download, TrendingUp } from 'lucide-react';

export default function ClientsPage() {
  const { clients, addClient, deleteClient, updateClient } = useAppViewModel();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{ userId: string; password: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string; nextStatus: string } | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionFilter, setConnectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [capitalFilter, setCapitalFilter] = useState('all');

  // Add Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [zerodhaClientId, setZerodhaClientId] = useState('');
  const [zerodhaApiKey, setZerodhaApiKey] = useState('');
  const [zerodhaApiSecret, setZerodhaApiSecret] = useState('');
  const [zerodhaPassword, setZerodhaPassword] = useState('');
  const [zerodhaTotpSecret, setZerodhaTotpSecret] = useState('');
  const [capital, setCapital] = useState('50000');

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addClient({
      name,
      email,
      zerodhaClientId,
      zerodhaApiKey,
      zerodhaApiSecret,
      zerodhaPassword,
      zerodhaTotpSecret,
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
      setZerodhaPassword('');
      setZerodhaTotpSecret('');
      setCapital('50000');
    }
  };

  const toggleClientStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setConfirmModal({ isOpen: true, id, nextStatus });
  };

  // Filter clients logic
  const filteredClients = clients.filter(client => {
    const nameStr = (client.user?.name || client.name || '').toLowerCase();
    const emailStr = (client.user?.email || client.email || '').toLowerCase();
    const idStr = (client.zerodhaClientId || '').toLowerCase();
    const capitalStr = String(client.capital);
    const query = searchQuery.toLowerCase();

    const matchesSearch = 
      nameStr.includes(query) || 
      emailStr.includes(query) || 
      idStr.includes(query) || 
      capitalStr.includes(query);
    
    const matchesConnection = connectionFilter === 'all' 
      ? true 
      : connectionFilter === 'connected' 
        ? !!client.accessToken 
        : !client.accessToken;

    const matchesStatus = statusFilter === 'all'
      ? true
      : client.tradingStatus === statusFilter;

    const matchesCapital = capitalFilter === 'all'
      ? true
      : capitalFilter === 'under_50k'
        ? Number(client.capital) < 50000
        : capitalFilter === '50k_100k'
          ? Number(client.capital) >= 50000 && Number(client.capital) <= 100000
          : Number(client.capital) > 100000;

    return matchesSearch && matchesConnection && matchesStatus && matchesCapital;
  });

  const totalCount = clients.length;
  const activeCount = clients.filter(c => c.tradingStatus === 'active').length;
  const inactiveCount = clients.filter(c => c.tradingStatus === 'inactive').length;
  const connectedCount = clients.filter(c => !!c.accessToken).length;

  const handleExportToExcel = () => {
    const headers = ['Name', 'Email', 'Zerodha Client ID', 'Capital (INR)', 'Connection Status', 'Trading Status'];
    const rows = filteredClients.map(client => [
      client.user?.name || client.name,
      client.user?.email || client.email,
      client.zerodhaClientId || '',
      client.capital,
      client.accessToken ? 'Connected' : 'Disconnected',
      client.tradingStatus
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={handleExportToExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} /> Export Excel
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} /> Add New Client
          </Button>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--primary)' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Clients</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>{totalCount}</span>
        </Card>
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--accent)' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Clients</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-title)' }}>{activeCount}</span>
        </Card>
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--text-subtle)' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inactive Clients</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-secondary)', fontFamily: 'var(--font-title)' }}>{inactiveCount}</span>
        </Card>
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Connected Sessions</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#d97706', fontFamily: 'var(--font-title)' }}>{connectedCount}</span>
        </Card>
      </div>

      {/* Main Clients Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            All Active & Configured Clients ({filteredClients.length})
          </h3>
        </div>

        {/* Search and Filter Inputs Row */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px', 
          alignItems: 'center',
          flexWrap: 'nowrap',
          background: 'var(--bg-secondary)',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border-light)'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--text-subtle)' 
            }} />
            <input
              type="text"
              placeholder="Search by name, email, or client ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontSize: '13px',
                backgroundColor: '#ffffff',
              }}
            />
          </div>

          {/* Filter Dropdowns on same line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            <Filter size={14} /> Filters:
          </div>
          
          <select
            value={connectionFilter}
            onChange={(e) => setConnectionFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              outline: 'none',
              fontSize: '13px',
              background: '#ffffff',
              cursor: 'pointer',
              minWidth: '130px',
              width: 'auto'
            }}
          >
            <option value="all">All Connections</option>
            <option value="connected">Connected</option>
            <option value="disconnected">Disconnected</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              outline: 'none',
              fontSize: '13px',
              background: '#ffffff',
              cursor: 'pointer',
              minWidth: '120px',
              width: 'auto'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={capitalFilter}
            onChange={(e) => setCapitalFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              outline: 'none',
              fontSize: '13px',
              background: '#ffffff',
              cursor: 'pointer',
              minWidth: '130px',
              width: 'auto'
            }}
          >
            <option value="all">All Capitals</option>
            <option value="under_50k">&lt; ₹50,000</option>
            <option value="50k_100k">₹50,000 - ₹1,00,000</option>
            <option value="above_100k">&gt; ₹1,00,000</option>
          </select>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Zerodha Client ID</th>
                <th>Capital (INR)</th>
                <th>Kite Session</th>
                <th>Trading Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No client accounts match the search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const isTrading = client.tradingStatus === 'active';
                  return (
                    <tr key={client.id}>
                      <td style={{ fontWeight: 600 }}>{client.user?.name || client.name}</td>
                      <td>{client.user?.email || client.email}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{client.zerodhaClientId || '--'}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(client.capital).toLocaleString()}</td>
                      <td>
                        {client.accessToken ? (
                          <span className="badge badge-green">Connected</span>
                        ) : client.zerodhaClientId ? (
                          <span className="badge badge-red">Expired</span>
                        ) : (
                          <span className="badge">Disconnected</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${isTrading ? 'badge-success' : 'badge-red'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleClientStatus(client.id, client.tradingStatus)}
                        >
                          {client.tradingStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Link
                            href={`/admin/clients/${client.id}/performance`}
                            style={{
                              color: 'var(--accent)',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                            title="View Client Performance Curve"
                          >
                            <TrendingUp size={18} />
                          </Link>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Zerodha Password (Optional)</label>
              <input
                type="password"
                value={zerodhaPassword}
                onChange={(e) => setZerodhaPassword(e.target.value)}
                placeholder="Zerodha Password"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Zerodha TOTP Secret (Optional)</label>
              <input
                type="text"
                value={zerodhaTotpSecret}
                onChange={(e) => setZerodhaTotpSecret(e.target.value)}
                placeholder="e.g. JBSWY3DPEHPK3PXP"
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
      {/* Confirm Status Change Modal */}
      <Modal 
        isOpen={!!confirmModal?.isOpen} 
        onClose={() => setConfirmModal(null)} 
        title="Confirm Status Change"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Are you sure you want to change the trading status of this client to <strong style={{ textTransform: 'uppercase', color: 'var(--text-heading)' }}>{confirmModal?.nextStatus}</strong>?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button 
              onClick={async () => {
                if (confirmModal) {
                  await updateClient(confirmModal.id, { tradingStatus: confirmModal.nextStatus });
                  setConfirmModal(null);
                }
              }}
            >
              Yes, Change Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
