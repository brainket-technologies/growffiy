'use client';

import React, { useEffect, useState } from 'react';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';
import { Card } from '../../../shared/components/views/Card';
import { Loader } from '../../../shared/components/views/Loader';
import { Check, ShieldCheck, Sparkles, CreditCard, Zap, Shield } from 'lucide-react';
import { API_ENDPOINTS } from '../../../core/constants';


export default function ClientSubscriptionPlans() {
  const { colors, activeUser } = useAppViewModel();
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('growffiy_logged_in_user_id');
      if (!storedId) {
        window.location.href = '/vendor/login';
        return;
      }
    }

    // Don't load plans until we have product type info to avoid flash
    if (!activeUser?.client?.productTypeId) {
      setLoadingPlans(false);
      setPlans([]);
      return;
    }

    // Load available plans from DB
    fetch(API_ENDPOINTS.PLANS)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          let activePlans = data.plans.filter((p: any) => p.status === 'active');

          // Filter plans to show ONLY those matching client's product type
          if (activeUser?.client?.productTypeId) {
            activePlans = activePlans.filter((p: any) =>
              p.productTypeId === activeUser.client.productTypeId
            );
          }

          setPlans(activePlans);
        } else {
          setErrorMsg('Failed to load subscription plans.');
        }
      })
      .catch(() => setErrorMsg('Network error while loading subscription plans.'))
      .finally(() => setLoadingPlans(false));

    // Dynamic Razorpay checkout script integration
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [activeUser]);

  const handlePurchase = async (plan: any) => {
    if (!activeUser) return;
    setPurchasingPlanId(plan.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Get Razorpay Public Key ID
      const settingsRes = await fetch(API_ENDPOINTS.SETTINGS_PUBLIC);
      const settingsData = await settingsRes.json();
      if (!settingsData.success || !settingsData.razorpayKeyId) {
        throw new Error('Razorpay payment gateway not configured by Admin.');
      }

      // 2. Create Razorpay order ID in backend
      const orderRes = await fetch(API_ENDPOINTS.PAYMENTS_ORDER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          userId: activeUser.id
        })
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize payment order.');
      }

      // 3. Trigger Razorpay checkout form
      const options = {
        key: settingsData.razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Growffiy',
        description: `${plan.name} Subscription`,
        order_id: orderData.orderId,
        prefill: {
          name: activeUser.name || 'Client',
          email: activeUser.email || '',
        },
        theme: {
          color: '#1E88FF' // Match primary color
        },
        handler: async function (response: any) {
          try {
            setLoadingPlans(true);
            const verifyRes = await fetch(API_ENDPOINTS.PAYMENTS_VERIFY, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              setSuccessMsg('✓ Payment successful! Your subscription is now active.');
              setTimeout(() => {
                window.location.href = '/clients';
              }, 2000);
            } else {
              throw new Error(verifyData.error || 'Payment signature verification failed.');
            }
          } catch (verifyErr: any) {
            setErrorMsg(verifyErr.message || 'Verification failed. Please contact support.');
            setLoadingPlans(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPurchasingPlanId(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment setup failed. Please try again.');
      setPurchasingPlanId(null);
    }
  };


  if (loadingPlans || !activeUser) {
    return <Loader title="Loading plans" text="Fetching active subscription pricing configurations..." fullscreen={false} />;
  }

  return (
    <div className="page-subscription" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto', padding: '12px' }}>

      {/* Header section with badge */}
      <div style={{ textAlign: 'center', margin: '12px 0 8px 0' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#e0f2fe',
          color: 'var(--primary)',
          fontSize: '12px',
          fontWeight: 700,
          padding: '6px 16px',
          borderRadius: '999px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '16px'
        }}>
          <Zap size={14} fill="currentColor" /> Premium Trading Strategies
        </span>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 800,
          color: 'var(--text-heading)',
          fontFamily: 'var(--font-title)',
          letterSpacing: '-0.75px',
          marginBottom: '12px'
        }}>
          Flexible Subscription Plans
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
          Choose a plan that fits your trading capital requirements and gain access to automated momentum breakout trading execution.
        </p>
      </div>

      {errorMsg && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: 'var(--danger-light)',
          color: 'var(--danger)',
          fontSize: '14px',
          fontWeight: 600,
          border: '1.5px solid rgba(239, 68, 68, 0.2)',
          boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: 'var(--accent-light)',
          color: 'var(--accent-dark)',
          fontSize: '14px',
          fontWeight: 600,
          border: '1.5px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.05)'
        }}>
          {successMsg}
        </div>
      )}

      <style>{`
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 32px;
          margin-top: 12px;
        }
        .premium-plan-card {
          position: relative;
          background: var(--bg-card);
          border-radius: 20px;
          border: 1.5px solid var(--border);
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .premium-plan-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: var(--border);
          transition: all 0.4s ease;
        }
        .premium-plan-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: #bae6fd;
        }
        .premium-plan-card:hover::before {
          background: var(--primary);
        }
        .premium-plan-card-featured {
          border-color: rgba(14, 165, 233, 0.35);
          box-shadow: 0 10px 15px -3px rgba(14, 165, 233, 0.08), 0 4px 6px -2px rgba(14, 165, 233, 0.04);
        }
        .premium-plan-card-featured::before {
          background: linear-gradient(90deg, #1E88FF, #1252AB) !important;
        }
        .premium-plan-card-featured:hover {
          border-color: rgba(14, 165, 233, 0.6);
          box-shadow: 0 25px 35px -5px rgba(14, 165, 233, 0.15), 0 12px 15px -5px rgba(14, 165, 233, 0.08);
        }
        .premium-btn {
          width: 100%;
          padding: 15px;
          border-radius: 12px;
          background: var(--primary);
          color: white;
          border: none;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 14px rgba(14, 165, 233, 0.35);
          transition: all 0.3s;
        }
        .premium-btn:hover:not(:disabled) {
          background: var(--primary-dark);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(14, 165, 233, 0.5);
        }
        .premium-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }
        .premium-btn-featured {
          background: linear-gradient(135deg, #1E88FF 0%, #1252AB 100%) !important;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35) !important;
        }
        .premium-btn-featured:hover:not(:disabled) {
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.5) !important;
        }
        .feature-list-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 14.5px;
          color: var(--text-body);
          line-height: 1.5;
        }
        .feature-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--primary-light);
          color: var(--primary);
          flex-shrink: 0;
          margin-top: 1px;
        }
        .feature-icon-wrapper-featured {
          background: #e0e7ff;
          color: #1252AB;
        }
      `}</style>

      {/* Grid of pricing plans */}
      <div className="plans-grid">
        {plans.map((plan) => {
          const isPurchasing = purchasingPlanId === plan.id;
          const isFeatured = plan.durationDays >= 90; // Highlight quarterly and yearly
          return (
            <div key={plan.id} className={`premium-plan-card ${isFeatured ? 'premium-plan-card-featured' : ''}`}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--text-heading)', letterSpacing: '-0.5px' }}>
                    {plan.name}
                  </h3>
                  {isFeatured && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#e0e7ff',
                      color: '#1252AB',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: '999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      <Sparkles size={11} fill="currentColor" /> Best Value
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '42px', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-1.5px' }}>
                    ₹{Number(plan.price).toLocaleString('en-IN')}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 500 }}>
                    / {plan.durationDays} Days
                  </span>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', marginBottom: '32px', lineHeight: 1.6 }}>
                  Gain automated signals and demat breakout execution for this duration.
                </p>

                {/* Features list */}
                <div style={{ borderTop: '1.5px dashed var(--surface)', paddingTop: '28px', marginBottom: '36px', flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
                    What's included:
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {plan.features.map((feature: string, idx: number) => (
                      <li key={idx} className="feature-list-item">
                        <div className={`feature-icon-wrapper ${isFeatured ? 'feature-icon-wrapper-featured' : ''}`}>
                          <Check size={13} strokeWidth={3} />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handlePurchase(plan)}
                  disabled={purchasingPlanId !== null}
                  className={`premium-btn ${isFeatured ? 'premium-btn-featured' : ''}`}
                >
                  {isPurchasing ? (
                    <>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite'
                      }} />
                      <span>Initializing Secure Order...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      <span>Subscribe Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13.5px', marginTop: '16px' }}>
        <ShieldCheck size={18} style={{ color: 'var(--color-success)' }} />
        <span>Secure 256-bit SSL encrypted payments powered by <strong>Razorpay</strong>.</span>
      </div>


      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <style>{`
@media (max-width: 1024px) {
  .plans-grid { gap: 24px; }
}
@media (max-width: 768px) {
  .page-subscription { gap: 24px !important; padding: 8px !important; }
  .page-subscription h1 { font-size: 26px !important; }
  .plans-grid { gap: 20px; }
}
@media (max-width: 640px) {
  .plans-grid { grid-template-columns: 1fr !important; gap: 20px; }
  .page-subscription .premium-plan-card { padding: 28px 20px; }
  .page-subscription h1 { font-size: 24px !important; }
}
      `}</style>
    </div>
  );
}
