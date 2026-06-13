'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../views/components/Card';
import { CreditCard, Plus, Trash2, ShieldCheck, RefreshCw, X, Check, Calendar, ArrowRight } from 'lucide-react';
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

  // Helper to get plan gradient based on name/duration
  const getPlanStyle = (planName: string, duration: number) => {
    const nameLower = planName.toLowerCase();
    if (nameLower.includes('yearly') || duration >= 365) {
      return {
        bg: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
        accent: '#f59e0b',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        badgeText: '#fbbf24',
        border: '1px solid rgba(245, 158, 11, 0.3)'
      };
    }
    if (nameLower.includes('quarterly') || duration >= 90) {
      return {
        bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        accent: '#6366f1',
        badgeBg: 'rgba(99, 102, 241, 0.15)',
        badgeText: '#818cf8',
        border: '1px solid rgba(99, 102, 241, 0.3)'
      };
    }
    return {
      bg: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
      accent: THEME_COLORS.PRIMARY,
      badgeBg: 'rgba(37, 99, 235, 0.08)',
      badgeText: THEME_COLORS.PRIMARY,
      border: '1px solid #e2e8f0'
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', fontFamily: 'sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&display=swap');
        
        .premium-plan-card {
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .premium-plan-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.75px', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
            Subscription Billing Tiers
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
            Configure and publish monthly, quarterly, or custom automation plans for client demat accounts.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: `linear-gradient(135deg, ${THEME_COLORS.PRIMARY} 0%, #1d4ed8 100%)`,
            color: 'white',
            border: 'none',
            padding: '12px 22px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(37,99,235,0.25)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.95'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <Plus size={16} /> Create Billing Plan
        </button>
      </div>

      {/* Grid of Plans */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#64748b' }}>
          <RefreshCw size={28} className="spin" style={{ color: THEME_COLORS.PRIMARY, marginBottom: '16px' }} />
          <p style={{ fontWeight: 600, fontSize: '15px' }}>Loading billing tiers...</p>
        </div>
      ) : plans.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          border: '1.5px dashed #cbd5e1',
          padding: '60px 20px',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <CreditCard size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>No Billing Plans Created Yet</h3>
          <p style={{ fontSize: '14px', marginTop: '6px', maxWidth: '380px', margin: '6px auto 24px' }}>
            Setup subscription tiers to monetize strategy execution. Clients will see these active tiers on their portal dashboard.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: THEME_COLORS.PRIMARY,
              color: 'white',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Create Your First Plan
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
          {plans.map((plan) => {
            const style = getPlanStyle(plan.name, plan.durationDays);
            const isDark = style.bg.includes('#1e1b4b') || style.bg.includes('#0f172a');

            return (
              <div
                key={plan.id}
                className="premium-plan-card"
                style={{
                  background: style.bg,
                  border: style.border,
                  color: isDark ? '#f8fafc' : '#1e293b'
                }}
              >
                {/* Header container */}
                <div style={{ padding: '28px 24px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '99px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        backgroundColor: style.badgeBg,
                        color: style.badgeText
                      }}
                    >
                      {plan.status === 'active' ? '● Active' : '● Inactive'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                      <Calendar size={13} />
                      {plan.durationDays} Days
                    </div>
                  </div>

                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    fontFamily: 'Outfit, sans-serif',
                    color: isDark ? 'white' : '#0f172a',
                    margin: '0 0 16px 0',
                    lineHeight: '1.2'
                  }}>
                    {plan.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 900, color: isDark ? 'white' : '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                      ₹{Number(plan.price).toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
                      / flat fee
                    </span>
                  </div>
                </div>

                {/* Features container */}
                <div style={{
                  padding: '24px',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                  borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isDark ? '#cbd5e1' : '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      marginBottom: '16px'
                    }}>
                      PLAN BENEFITS & AUDITS
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {plan.features && Array.isArray(plan.features) ? (
                        plan.features.map((feat: string, idx: number) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: isDark ? '#cbd5e1' : '#334155', lineHeight: '1.4' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: style.badgeBg,
                              color: style.badgeText,
                              flexShrink: 0,
                              marginTop: '1px'
                            }}>
                              <Check size={11} strokeWidth={3} />
                            </div>
                            <span>{feat}</span>
                          </li>
                        ))
                      ) : (
                        <li style={{ fontSize: '12px', color: '#94a3b8' }}>No benefits listed.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE PLAN MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Publish New Billing Plan"
      >
        <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '8px 0' }}>
          {formError && (
            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1.5px solid #fee2e2', color: '#b91c1c', fontSize: '13px', fontWeight: 600 }}>
              ⚠️ {formError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Premium Quarterly Bracket Plan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="plan-input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price (INR)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="₹ 14,999"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="plan-input-field"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration (Days)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 90"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="plan-input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Features List (One feature per line)</label>
            <textarea
              required
              rows={4}
              placeholder="Pre-Open Breakout Intraday Strategy&#10;1% Capital Risk Limit Sizer&#10;Telegram Alert Integrator"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              className="plan-input-field"
              style={{ fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="plan-input-field"
                style={{ background: 'white', cursor: 'pointer' }}
              >
                <option value="active">Active (Publish to landing page)</option>
                <option value="inactive">Inactive (Hide / Draft)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <button
              type="submit"
              disabled={formLoading}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                border: 'none',
                background: `linear-gradient(135deg, ${THEME_COLORS.PRIMARY} 0%, #1d4ed8 100%)`,
                color: 'white',
                fontSize: '14px',
                fontWeight: 700,
                cursor: formLoading ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {formLoading ? <RefreshCw size={14} className="spin" /> : null}
              {formLoading ? 'Publishing...' : 'Publish Billing Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
