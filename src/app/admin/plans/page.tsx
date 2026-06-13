'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../views/components/Card';
import { CreditCard, Plus, Trash2, ShieldCheck, RefreshCw, X, Check } from 'lucide-react';
import { Modal } from '../../../views/components/Modal';
import { Button } from '../../../views/components/Button';
import { api } from '../../../lib/api';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Subscription Plans Management
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Configure monthly, quarterly, and custom automated billing tier levels.</p>
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
          <Plus size={16} /> Create Plan
        </button>
      </div>

      {/* Grid of Plans */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
          <RefreshCw size={24} className="spin" style={{ marginRight: '10px' }} /> Loading billing plans...
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <CreditCard size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontWeight: 600, fontSize: '15px' }}>No subscription plans found</p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Click the "Create Plan" button to add your first billing tier.</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {plans.map((plan) => (
            <Card key={plan.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <span className={`badge ${plan.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ marginBottom: '8px' }}>
                    {plan.status}
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
                    {plan.name}
                  </h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                    ₹{Number(plan.price).toLocaleString('en-IN')}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    for {plan.durationDays} Days
                  </p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Included Features
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {plan.features && Array.isArray(plan.features) ? (
                    plan.features.map((feat: string, idx: number) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#10b981' }}>
                          <Check size={10} strokeWidth={3} />
                        </div>
                        <span>{feat}</span>
                      </li>
                    ))
                  ) : (
                    <li style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No features defined.</li>
                  )}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      )}

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
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-color)',
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
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
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-color)',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
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
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-color)',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
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
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-color)',
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-color)',
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
                background: 'white'
              }}
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
