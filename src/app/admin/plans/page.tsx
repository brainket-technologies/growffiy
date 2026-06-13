'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../views/components/Card';
import { CreditCard, Plus, RefreshCw, Check, Calendar } from 'lucide-react';
import { Modal } from '../../../views/components/Modal';
import { Button } from '../../../views/components/Button';
import { api } from '../../../lib/api';
import { THEME_COLORS } from '../../../lib/constants';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form Fields State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [features, setFeatures] = useState('');
  const [status, setStatus] = useState('active');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/plans');
      if (res.success) {
        setPlans(res.plans || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    // Split features by new line or comma
    const featuresList = features
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    try {
      const res = await api.post('/api/plans', {
        name,
        price: parseFloat(price),
        durationDays: parseInt(durationDays, 10),
        features: featuresList,
        status
      });

      if (res.success) {
        setIsCreateModalOpen(false);
        // Reset form
        setName('');
        setPrice('');
        setDurationDays('30');
        setFeatures('');
        setStatus('active');
        fetchPlans();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create subscription plan');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'sans-serif' }}>
      <style>{`
        .plan-input-field {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .plan-input-field:focus {
          border-color: ${THEME_COLORS.PRIMARY};
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
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
          onClick={() => setIsCreateModalOpen(true)}
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
            boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
            transition: 'background 0.2s'
          }}
        >
          <Plus size={16} /> Add New Plan
        </button>
      </div>

      {/* Plans Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Active Subscription Plans ({plans.length})
          </h3>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            <RefreshCw size={20} className="spin" style={{ marginRight: '10px' }} /> Loading billing plans...
          </div>
        ) : plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <CreditCard size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontWeight: 600, fontSize: '15px' }}>No subscription plans found</p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Click the "Add New Plan" button to add your first billing tier.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Plan Name</th>
                  <th>Price (INR)</th>
                  <th>Duration (Days)</th>
                  <th>Included Features</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{plan.name}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{Number(plan.price).toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontWeight: 500 }}>{plan.durationDays} Days</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '400px' }}>
                        {plan.features && Array.isArray(plan.features) ? (
                          plan.features.map((feat: string, idx: number) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '11px',
                                backgroundColor: 'rgba(37, 99, 235, 0.06)',
                                color: 'var(--primary)',
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
                      <span className={`badge ${plan.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {plan.status}
                      </span>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="plan-input-field"
              style={{ background: 'white' }}
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
    </div>
  );
}
