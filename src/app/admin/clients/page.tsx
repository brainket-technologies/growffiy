'use client';

import React, { useState, useEffect } from 'react';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';
import { Card } from '../../../shared/components/views/Card';
import { Button } from '../../../shared/components/views/Button';
import { Modal } from '../../../shared/components/views/Modal';
import Link from 'next/link';
import { Plus, Eye, Trash2, Search, Filter, Download, TrendingUp, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { api } from '../../../shared/services/api';
import { API_ENDPOINTS } from '../../../core/constants';

export default function ClientsPage() {
  const { clients, addClient, deleteClient, updateClient } = useAppViewModel();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{ userId: string; password: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string; nextStatus: string } | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);
  const [credentialsModal, setCredentialsModal] = useState<{
    isOpen: boolean;
    client: any;
    totpCode?: string;
    totpRemaining?: number;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const fetchTotp = async (clientId: string) => {
    try {
      const res = await api.get(`/api/clients/${clientId}/totp`);
      if (res.success) {
        setCredentialsModal(prev => {
          if (prev && prev.client.id === clientId) {
            return {
              ...prev,
              totpCode: res.code,
              totpRemaining: res.secondsRemaining
            };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error fetching TOTP:', err);
    }
  };

  useEffect(() => {
    if (!credentialsModal?.isOpen || !credentialsModal?.client?.id) return;

    const timer = setInterval(() => {
      setCredentialsModal(prev => {
        if (prev && prev.totpRemaining !== undefined) {
          if (prev.totpRemaining <= 1) {
            fetchTotp(prev.client.id);
            return { ...prev, totpRemaining: 30 };
          }
          return { ...prev, totpRemaining: prev.totpRemaining - 1 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [credentialsModal?.isOpen, credentialsModal?.client?.id]);

  const handleKiteLoginClick = (client: any) => {
    setCredentialsModal({
      isOpen: true,
      client
    });
    if (client.zerodhaTotpSecret) {
      fetchTotp(client.id);
    }
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionFilter, setConnectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [capitalFilter, setCapitalFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Add Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [zerodhaClientId, setZerodhaClientId] = useState('');
  const [zerodhaApiKey, setZerodhaApiKey] = useState('');
  const [zerodhaApiSecret, setZerodhaApiSecret] = useState('');
  const [zerodhaPassword, setZerodhaPassword] = useState('');
  const [zerodhaTotpSecret, setZerodhaTotpSecret] = useState('');
  const [capital, setCapital] = useState('');
  const [strategies, setStrategies] = useState<any[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [selectedProductTypeId, setSelectedProductTypeId] = useState('');

  // Fetch strategies & product types
  useEffect(() => {
    fetch('/api/admin/strategies')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.strategies) {
          setStrategies(data.strategies);
        }
      })
      .catch(err => console.error('Failed to load strategies:', err));

    fetch('/api/admin/product-types')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.productTypes) {
          setProductTypes(data.productTypes);
        }
      })
      .catch(err => console.error('Failed to load product types:', err));
  }, []);

  // Autofill prevention state
  const [focusedFields, setFocusedFields] = useState<Record<string, boolean>>({});

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
      strategyId: selectedStrategyId || null,
      productTypeId: selectedProductTypeId || null,
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
      setCapital('');
      setSelectedStrategyId('');
      setSelectedProductTypeId('');
      setFocusedFields({});
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

    const matchesProductType = productTypeFilter === 'all'
      ? true
      : client.productTypeId === productTypeFilter;

    return matchesSearch && matchesConnection && matchesStatus && matchesCapital && matchesProductType;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const indexOfLastItem = activePage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '100%', overflowX: 'hidden' }}>
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
          <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--warning)', fontFamily: 'var(--font-title)' }}>{connectedCount}</span>
        </Card>
      </div>

      {/* Main Clients Table */}
      <Card style={{ maxWidth: '100%', overflow: 'hidden' }}>
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
          flexWrap: 'wrap',
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
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
            onChange={(e) => { setConnectionFilter(e.target.value); setCurrentPage(1); }}
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
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
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
            value={productTypeFilter}
            onChange={(e) => { setProductTypeFilter(e.target.value); setCurrentPage(1); }}
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
            <option value="all">All Product Types</option>
            {productTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>

          <select
            value={capitalFilter}
            onChange={(e) => { setCapitalFilter(e.target.value); setCurrentPage(1); }}
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
          <table className="table-compact">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Zerodha Client ID</th>
                <th>Product Type</th>
                <th>Strategy</th>
                <th>Capital (INR)</th>
                <th>Kite Session</th>
                <th>Subscribed</th>
                <th>Trading Status</th>
                <th style={{ textAlign: 'right', minWidth: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentClients.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No client accounts match the search or filter criteria.
                  </td>
                </tr>
              ) : (
                currentClients.map((client) => {
                  const isTrading = client.tradingStatus === 'active';
                  return (
                    <tr key={client.id}>
                      <td style={{ fontWeight: 600 }}>{client.user?.name || client.name}</td>
                      <td>{client.user?.email || client.email}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{client.zerodhaClientId || '--'}</td>
                      <td>
                        {client.productType?.name ? (
                          <span 
                            className="badge badge-purple"
                            style={{ 
                              textTransform: 'none', 
                              fontSize: '11px',
                              padding: '4px 10px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {client.productType.name}
                          </span>
                        ) : (
                          <span 
                            className="badge"
                            style={{ 
                              textTransform: 'none', 
                              fontSize: '11px',
                              padding: '4px 10px'
                            }}
                          >
                            None
                          </span>
                        )}
                      </td>
                      <td>
                        {client.strategy?.name ? (
                          <span 
                            className="badge badge-purple"
                            style={{ 
                              textTransform: 'none', 
                              fontSize: '11px',
                              padding: '4px 10px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {client.strategy.name}
                          </span>
                        ) : (
                          <span 
                            className="badge"
                            style={{ 
                              textTransform: 'none', 
                              fontSize: '11px',
                              padding: '4px 10px'
                            }}
                          >
                            None
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: Number(client.capital) === -1 ? '#10b981' : 'inherit' }}>{Number(client.capital) === -1 ? 'Live Balance' : `₹${Number(client.capital).toLocaleString()}`}</td>
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
                        {client.subscriptionStatus === 'active' ? (
                          <span className="badge badge-green">Active</span>
                        ) : client.subscriptionStatus === 'expired' ? (
                          <span className="badge badge-red">Expired</span>
                        ) : (
                          <span className="badge badge-yellow">Pending</span>
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
                      <td style={{ textAlign: 'right', minWidth: '150px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {client.zerodhaApiKey ? (
                            <button
                              onClick={() => handleKiteLoginClick(client)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ff5722',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                flexShrink: 0,
                              }}
                              title="Login to Zerodha Kite"
                            >
                              <ExternalLink size={17} style={{ width: '17px', height: '17px', flexShrink: 0 }} />
                            </button>
                          ) : (
                            <div
                              style={{
                                color: 'var(--text-muted)',
                                padding: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                opacity: 0.4,
                                cursor: 'not-allowed',
                                flexShrink: 0,
                              }}
                              title="Zerodha API Key not configured"
                            >
                              <ExternalLink size={17} style={{ width: '17px', height: '17px', flexShrink: 0 }} />
                            </div>
                          )}
                          <Link
                            href={`/admin/clients/${client.id}/performance`}
                            style={{
                              color: 'var(--accent)',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              flexShrink: 0,
                            }}
                            title="View Client Performance Curve"
                          >
                            <TrendingUp size={17} style={{ width: '17px', height: '17px', flexShrink: 0 }} />
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
                              flexShrink: 0,
                            }}
                            title="View / Edit Client Details"
                          >
                            <Eye size={17} style={{ width: '17px', height: '17px', flexShrink: 0 }} />
                          </Link>
                           <button
                            onClick={() => setDeleteConfirmModal({ isOpen: true, id: client.id, name: client.user?.name || client.name })}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                              transition: 'background-color 0.2s',
                              display: 'inline-flex',
                              alignItems: 'center',
                              flexShrink: 0,
                            }}
                            title="Delete Client"
                          >
                            <Trash2 size={17} style={{ width: '17px', height: '17px', flexShrink: 0 }} />
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

        {/* Pagination Container */}
        {filteredClients.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing <span style={{ fontWeight: 600 }}>{indexOfFirstItem + 1}</span> to{' '}
              <span style={{ fontWeight: 600 }}>{Math.min(indexOfLastItem, filteredClients.length)}</span> of{' '}
              <span style={{ fontWeight: 600 }}>{filteredClients.length}</span> clients
            </div>
            
            <div className="pagination-controls">
              {/* Rows Per Page Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-body)',
                    fontSize: '12px',
                    width: 'auto',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={activePage === 1}
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                if (
                  totalPages > 7 &&
                  pageNum !== 1 &&
                  pageNum !== totalPages &&
                  Math.abs(pageNum - activePage) > 1
                ) {
                  if (pageNum === 2 && activePage > 3) {
                    return <span key="ellipsis-start" style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>;
                  }
                  if (pageNum === totalPages - 1 && activePage < totalPages - 2) {
                    return <span key="ellipsis-end" style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${activePage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={activePage === totalPages}
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Add Client Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Client">
        <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} autoComplete="off">
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Client Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Full Name"
              autoComplete="off"
              readOnly={!focusedFields['name']}
              onFocus={() => setFocusedFields(prev => ({ ...prev, name: true }))}
              onBlur={() => setFocusedFields(prev => ({ ...prev, name: false }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Email Address"
              autoComplete="off"
              readOnly={!focusedFields['email']}
              onFocus={() => setFocusedFields(prev => ({ ...prev, email: true }))}
              onBlur={() => setFocusedFields(prev => ({ ...prev, email: false }))}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Zerodha Client ID</label>
            <input
              type="text"
              required
              value={zerodhaClientId}
              onChange={(e) => setZerodhaClientId(e.target.value)}
              placeholder="Enter Client ID"
              autoComplete="off"
              readOnly={!focusedFields['zerodhaClientId']}
              onFocus={() => setFocusedFields(prev => ({ ...prev, zerodhaClientId: true }))}
              onBlur={() => setFocusedFields(prev => ({ ...prev, zerodhaClientId: false }))}
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
                placeholder="Enter API Key"
                autoComplete="off"
                readOnly={!focusedFields['zerodhaApiKey']}
                onFocus={() => setFocusedFields(prev => ({ ...prev, zerodhaApiKey: true }))}
                onBlur={() => setFocusedFields(prev => ({ ...prev, zerodhaApiKey: false }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Kite API Secret</label>
              <input
                type="text"
                required
                value={zerodhaApiSecret}
                onChange={(e) => setZerodhaApiSecret(e.target.value)}
                placeholder="Enter API Secret"
                autoComplete="off"
                readOnly={!focusedFields['zerodhaApiSecret']}
                onFocus={() => setFocusedFields(prev => ({ ...prev, zerodhaApiSecret: true }))}
                onBlur={() => setFocusedFields(prev => ({ ...prev, zerodhaApiSecret: false }))}
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
                placeholder="Enter Password"
                autoComplete="new-password"
                readOnly={!focusedFields['zerodhaPassword']}
                onFocus={() => setFocusedFields(prev => ({ ...prev, zerodhaPassword: true }))}
                onBlur={() => setFocusedFields(prev => ({ ...prev, zerodhaPassword: false }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Zerodha TOTP Secret (Optional)</label>
              <input
                type="text"
                value={zerodhaTotpSecret}
                onChange={(e) => setZerodhaTotpSecret(e.target.value)}
                placeholder="Enter TOTP Secret"
                autoComplete="off"
                readOnly={!focusedFields['zerodhaTotpSecret']}
                onFocus={() => setFocusedFields(prev => ({ ...prev, zerodhaTotpSecret: true }))}
                onBlur={() => setFocusedFields(prev => ({ ...prev, zerodhaTotpSecret: false }))}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Allocated Capital (INR)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                required
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                placeholder="Enter -1 for Live Balance"
                autoComplete="off"
                readOnly={!focusedFields['capital']}
                onFocus={() => setFocusedFields(prev => ({ ...prev, capital: true }))}
                onBlur={() => setFocusedFields(prev => ({ ...prev, capital: false }))}
                style={{ flex: 1, border: capital === '-1' ? '1px solid rgba(16,185,129,0.3)' : undefined, color: capital === '-1' ? '#10b981' : undefined }}
              />
              {capital === '-1' && (
                <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>Live Balance</span>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Select Strategy</label>
            <select
              value={selectedStrategyId}
              onChange={(e) => setSelectedStrategyId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontSize: '13px',
                backgroundColor: 'var(--bg-white)',
                color: 'var(--text-heading)',
                cursor: 'pointer'
              }}
            >
              <option value="">Select a Strategy (Optional)</option>
              {strategies.map((strat) => (
                <option key={strat.id} value={strat.id}>
                  {strat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Select Product Type</label>
            <select
              value={selectedProductTypeId}
              onChange={(e) => setSelectedProductTypeId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontSize: '13px',
                backgroundColor: 'var(--bg-white)',
                color: 'var(--text-heading)',
                cursor: 'pointer'
              }}
            >
              <option value="">Select Product Type (Optional)</option>
              {productTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
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
          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Login User ID</span>
              <code style={{ display: 'block', backgroundColor: 'var(--surface)', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)', border: '1px solid var(--border)' }}>
                {generatedCreds?.userId}
              </code>
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Password</span>
              <code style={{ display: 'block', backgroundColor: 'var(--surface)', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)', border: '1px solid var(--border)' }}>
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
      {/* Confirm Delete Client Modal */}
      <Modal 
        isOpen={!!deleteConfirmModal?.isOpen} 
        onClose={() => setDeleteConfirmModal(null)} 
        title="Delete Client Account"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Are you sure you want to permanently delete client <strong style={{ color: 'var(--text-heading)' }}>{deleteConfirmModal?.name}</strong>? This action is permanent and cannot be undone. All client trades and configuration will be deleted.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setDeleteConfirmModal(null)}>Cancel</Button>
            <Button 
              onClick={async () => {
                if (deleteConfirmModal) {
                  await deleteClient(deleteConfirmModal.id);
                  setDeleteConfirmModal(null);
                }
              }}
              style={{ backgroundColor: 'var(--danger)', color: 'white' }}
            >
              Yes, Delete Client
            </Button>
          </div>
        </div>
      </Modal>

      {/* Credentials Copy & Login Modal */}
      <Modal 
        isOpen={!!credentialsModal?.isOpen} 
        onClose={() => {
          setCredentialsModal(null);
          setShowPassword(false);
          setCopiedField(null);
        }} 
        title="Zerodha Account Credentials"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Copy the credentials below to log into Zerodha Kite for <strong style={{ color: 'var(--text-heading)' }}>{credentialsModal?.client?.user?.name || credentialsModal?.client?.name}</strong>:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* User ID Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Zerodha Client ID
                </span>
                {copiedField === 'userId' && (
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 500 }}>Copied!</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <code style={{ flex: 1, display: 'block', backgroundColor: 'var(--surface)', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
                  {credentialsModal?.client?.zerodhaClientId || '--'}
                </code>
                <Button 
                  onClick={() => handleCopy(credentialsModal?.client?.zerodhaClientId || '', 'userId')}
                  style={{ padding: '0 16px', fontSize: '12px' }}
                >
                  Copy
                </Button>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Zerodha Password
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '11px', fontWeight: 500 }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                  {copiedField === 'password' && (
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 500 }}>Copied!</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  readOnly
                  value={credentialsModal?.client?.zerodhaPassword || ''}
                  style={{ flex: 1, display: 'block', backgroundColor: 'var(--surface)', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-heading)', border: '1px solid var(--border)', fontFamily: 'monospace', outline: 'none' }}
                />
                <Button 
                  onClick={() => handleCopy(credentialsModal?.client?.zerodhaPassword || '', 'password')}
                  style={{ padding: '0 16px', fontSize: '12px' }}
                >
                  Copy
                </Button>
              </div>
            </div>

            {/* TOTP Field */}
            {credentialsModal?.client?.zerodhaTotpSecret && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Real-time TOTP Code
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {credentialsModal.totpRemaining !== undefined && (
                      <span style={{ fontSize: '11px', color: credentialsModal.totpRemaining <= 5 ? 'var(--danger)' : 'var(--text-muted)' }}>
                        Expires in {credentialsModal.totpRemaining}s
                      </span>
                    )}
                    {copiedField === 'totp' && (
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 500 }}>Copied!</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <code style={{ flex: 1, display: 'block', backgroundColor: 'var(--surface)', padding: '10px 14px', borderRadius: '8px', fontSize: '18px', fontWeight: 700, color: '#ff5722', border: '1px solid var(--border)', fontFamily: 'monospace', letterSpacing: '2px', textAlign: 'center' }}>
                    {credentialsModal.totpCode || 'Loading...'}
                  </code>
                  <Button 
                    onClick={() => handleCopy(credentialsModal.totpCode || '', 'totp')}
                    disabled={!credentialsModal.totpCode}
                    style={{ padding: '0 16px', fontSize: '12px' }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <Button 
              variant="secondary" 
              onClick={() => {
                setCredentialsModal(null);
                setShowPassword(false);
                setCopiedField(null);
              }}
            >
              Close
            </Button>
            <a
              href={`https://kite.zerodha.com/connect/login?api_key=${credentialsModal?.client?.zerodhaApiKey}&v=3&redirect_params=state%3D${credentialsModal?.client?.id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setCredentialsModal(null);
                setShowPassword(false);
                setCopiedField(null);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ff5722',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              Open Zerodha Login
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}
