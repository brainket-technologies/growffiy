'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../shared/components/views/Card';
import { CreditCard, Plus, RefreshCw, Check, Calendar, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { Modal } from '../../../shared/components/views/Modal';
import { Button } from '../../../shared/components/views/Button';
import { api } from '../../../shared/services/api';
import { THEME_COLORS, API_ENDPOINTS } from '../../../core/constants';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');

  // Modals Open State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [features, setFeatures] = useState('');
  const [status, setStatus] = useState('active');
  const [productTypeId, setProductTypeId] = useState('');
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPlans = async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const res = await api.get(API_ENDPOINTS.PLANS);
      if (res.success) {
        setPlans(res.plans || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch plans:', err);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPlans();
    fetch('/api/admin/product-types')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.productTypes) {
          setProductTypes(data.productTypes);
        }
      })
      .catch(err => console.error('Failed to fetch product types:', err));
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    const featuresList = features
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    try {
      const res = await api.post(API_ENDPOINTS.PLANS, {
        name,
        price: parseFloat(price),
        durationDays: parseInt(durationDays, 10),
        features: featuresList,
        status,
        productTypeId: productTypeId || null
      });

      if (res.success) {
        setIsCreateModalOpen(false);
        resetForm();
        fetchPlans();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create subscription plan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setFormLoading(true);
    setFormError(null);

    const featuresList = features
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    try {
      const res = await api.put(`${API_ENDPOINTS.PLANS}/${selectedPlan.id}`, {
        name,
        price: parseFloat(price),
        durationDays: parseInt(durationDays, 10),
        features: featuresList,
        status,
        productTypeId: productTypeId || null
      });

      if (res.success) {
        setIsEditModalOpen(false);
        resetForm();
        fetchPlans();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to update subscription plan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    setFormLoading(true);
    setFormError(null);

    try {
      const res = await api.delete(`${API_ENDPOINTS.PLANS}/${selectedPlan.id}`);
      if (res.success) {
        setIsDeleteModalOpen(false);
        setSelectedPlan(null);
        fetchPlans();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete subscription plan');
    } finally {
      setFormLoading(false);
    }
  };

  const togglePlanStatus = async (plan: any) => {
    const nextStatus = plan.status === 'active' ? 'inactive' : 'active';
    
    // Optimistic Update: update UI state immediately
    setPlans(prevPlans =>
      prevPlans.map(p => p.id === plan.id ? { ...p, status: nextStatus } : p)
    );

    try {
      const res = await api.put(`${API_ENDPOINTS.PLANS}/${plan.id}`, {
        name: plan.name,
        price: plan.price,
        durationDays: plan.durationDays,
        features: plan.features,
        status: nextStatus,
        productTypeId: plan.productTypeId || null
      });
      if (!res.success) {
        // Revert on failure
        setPlans(prevPlans =>
          prevPlans.map(p => p.id === plan.id ? { ...p, status: plan.status } : p)
        );
      }
    } catch (err) {
      console.error('Failed to toggle plan status:', err);
      // Revert on failure
      setPlans(prevPlans =>
        prevPlans.map(p => p.id === plan.id ? { ...p, status: plan.status } : p)
      );
    }
  };

  const openEditModal = (plan: any) => {
    setSelectedPlan(plan);
    setName(plan.name);
    setPrice(String(plan.price));
    setDurationDays(String(plan.durationDays));
    setFeatures(Array.isArray(plan.features) ? plan.features.join('\n') : '');
    setStatus(plan.status);
    setProductTypeId(plan.productTypeId || '');
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (plan: any) => {
    setSelectedPlan(plan);
    setFormError(null);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setDurationDays('30');
    setFeatures('');
    setStatus('active');
    setProductTypeId('');
    setSelectedPlan(null);
    setFormError(null);
  };

  // Filter plans in-memory
  const filteredPlans = plans.filter(plan => {
    const nameStr = (plan.name || '').toLowerCase();
    const featuresStr = (Array.isArray(plan.features) ? plan.features.join(' ') : '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = nameStr.includes(query) || featuresStr.includes(query);

    const matchesStatus = statusFilter === 'all' 
      ? true 
      : plan.status === statusFilter;

    const matchesDuration = durationFilter === 'all'
      ? true
      : String(plan.durationDays) === durationFilter;

    return matchesSearch && matchesStatus && matchesDuration;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'sans-serif', maxWidth: '100%', overflowX: 'hidden' }}>
      <style>{`
        .plan-input-field {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          font-size: 14px;
          color: var(--text-heading);
          background: var(--bg-white);
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .plan-input-field:focus {
          border-color: ${THEME_COLORS.PRIMARY};
          box-shadow: 0 0 0 3px rgba(14,165,233,0.12);
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .form-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Subscription Plans
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Configure billing duration tiers and automated subscription pricing levels.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(14,165,233,0.2)',
            transition: 'background 0.2s'
          }}
        >
          <Plus size={16} /> Add New Plan
        </button>
      </div>

      {/* Plans Table */}
      <Card style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            All Active & Configured Plans ({filteredPlans.length})
          </h3>
        </div>

        {/* Search and Filter Row */}
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
              placeholder="Search plans by name or feature..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            <Filter size={14} /> Filters:
          </div>

          {/* Status Filter */}
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

          {/* Duration Filter */}
          <select
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value)}
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
            <option value="all">All Durations</option>
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
            <option value="365">365 Days</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            <RefreshCw size={20} className="spin" style={{ marginRight: '10px' }} /> Loading billing plans...
          </div>
        ) : filteredPlans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <CreditCard size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontWeight: 600, fontSize: '15px' }}>No subscription plans found</p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Click the "Add New Plan" button or adjust filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Plan Name</th>
                  <th>Product Type</th>
                  <th>Price (INR)</th>
                  <th>Duration (Days)</th>
                  <th>Included Features</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <tr key={plan.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{plan.name}</td>
                    <td>
                      {plan.productType?.name ? (
                        <span className="badge badge-purple" style={{ textTransform: 'none', fontSize: '11px', padding: '4px 10px' }}>
                          {plan.productType.name}
                        </span>
                      ) : (
                        <span className="badge" style={{ textTransform: 'none', fontSize: '11px', padding: '4px 10px' }}>
                          None
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{Number(plan.price).toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontWeight: 500 }}>{plan.durationDays} Days</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '360px' }}>
                        {plan.features && Array.isArray(plan.features) ? (
                          plan.features.map((feat: string, idx: number) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '11px',
                                backgroundColor: 'var(--primary-light)',
                                color: 'var(--primary-dark)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontWeight: 500,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {feat}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No features</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        onClick={() => togglePlanStatus(plan)}
                        className={`badge ${plan.status === 'active' ? 'badge-success' : 'badge-danger'}`}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Click to toggle status"
                      >
                        {plan.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditModal(plan)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--primary)',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px',
                            transition: 'background 0.2s'
                          }}
                          title="Edit Plan"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(plan)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--danger)',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px',
                            transition: 'background 0.2s'
                          }}
                          title="Delete Plan"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CREATE PLAN MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Subscription Plan"
      >
        <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          {formError && (
            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: 500 }}>
              ⚠️ {formError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Plan Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly Starter Plan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="plan-input-field"
            />
          </div>

          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Price (INR)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="4999"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="plan-input-field"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Duration (Days)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="30"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="plan-input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Features List (One feature per line)</label>
            <textarea
              required
              rows={4}
              placeholder="Pre-Open Momentum Strategy&#10;1% Capital Risk Guard&#10;Kite API Integration"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              className="plan-input-field"
              style={{ fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Product Type</label>
            <select
              value={productTypeId}
              onChange={(e) => setProductTypeId(e.target.value)}
              className="plan-input-field"
            >
              <option value="">No Product Type (Optional)</option>
              {productTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="plan-input-field"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT PLAN MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Subscription Plan"
      >
        <form onSubmit={handleEditPlan} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          {formError && (
            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: 500 }}>
              ⚠️ {formError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Plan Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly Starter Plan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="plan-input-field"
            />
          </div>

          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Price (INR)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="4999"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="plan-input-field"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Duration (Days)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="30"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="plan-input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Features List (One feature per line)</label>
            <textarea
              required
              rows={4}
              placeholder="Pre-Open Momentum Strategy&#10;1% Capital Risk Guard&#10;Kite API Integration"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              className="plan-input-field"
              style={{ fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Product Type</label>
            <select
              value={productTypeId}
              onChange={(e) => setProductTypeId(e.target.value)}
              className="plan-input-field"
            >
              <option value="">No Product Type (Optional)</option>
              {productTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="plan-input-field"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={formLoading}>
              {formLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Subscription Plan"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          {formError && (
            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: 500 }}>
              ⚠️ {formError}
            </div>
          )}
          
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Are you sure you want to delete the plan <strong>{selectedPlan?.name}</strong>? This action cannot be undone.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeletePlan} disabled={formLoading}>
              {formLoading ? 'Deleting...' : 'Yes, Delete Plan'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
