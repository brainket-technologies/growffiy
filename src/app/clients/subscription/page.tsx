'use client';

import React, { useEffect, useState } from 'react';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';
import { Card } from '../../../shared/components/views/Card';
import { Loader } from '../../../shared/components/views/Loader';
import { Check, ShieldCheck, Sparkles, CreditCard, Zap, Shield, RefreshCw, QrCode, Smartphone, Copy, Upload, X } from 'lucide-react';
import { API_ENDPOINTS } from '../../../core/constants';
import { Modal } from '../../../shared/components/views/Modal';


export default function ClientSubscriptionPlans() {
  const { colors, activeUser } = useAppViewModel();
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Manual Payment (UPI & QR) Modal States
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [selectedPlanForManual, setSelectedPlanForManual] = useState<any>(null);
  const [manualPaymentInfo, setManualPaymentInfo] = useState<{
    upiId: string;
    upiName: string;
    qrCode: string;
    paymentNote: string;
  }>({ upiId: '', upiName: '', qrCode: '', paymentNote: '' });
  const [utrInput, setUtrInput] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('growffiy_logged_in_user_id');
      if (!storedId) {
        window.location.href = '/login';
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
      // 1. Get Settings (checks online vs manual mode)
      const settingsRes = await fetch(API_ENDPOINTS.SETTINGS_PUBLIC);
      const settingsData = await settingsRes.json();

      // Check if Admin configured Manual Payment
      if (settingsData.paymentMethod === 'manual') {
        setPurchasingPlanId(null);
        setManualPaymentInfo({
          upiId: settingsData.manualUpiId || '',
          upiName: settingsData.manualUpiName || '',
          qrCode: settingsData.manualQrCode || '',
          paymentNote: settingsData.manualPaymentNote || ''
        });
        setSelectedPlanForManual(plan);
        setUtrInput('');
        setScreenshotFile(null);
        setManualModalOpen(true);
        return;
      }

      // Online Razorpay Flow
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

      const brandName = settingsData.appName || (typeof window !== 'undefined' ? localStorage.getItem('growffiy_brand_name') : null) || 'Growffiy';
      const brandLogo = settingsData.appLogo || (typeof window !== 'undefined' ? localStorage.getItem('growffiy_brand_logo') : null) || undefined;

      const options = {
        key: settingsData.razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: brandName,
        image: brandLogo,
        description: `${plan.name} Subscription`,
        order_id: orderData.orderId,
        prefill: {
          name: activeUser.name || 'Client',
          email: activeUser.email || '',
        },
        theme: {
          color: '#1252AB'
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForManual || !activeUser) return;
    if (!utrInput.trim()) {
      setErrorMsg('Please enter the 12-digit UTR / Reference Number.');
      return;
    }
    if (!screenshotFile) {
      setErrorMsg('Please upload your payment screenshot / receipt.');
      return;
    }
    setSubmittingManual(true);
    setErrorMsg(null);

    try {
      let res;
      if (screenshotFile) {
        const formData = new FormData();
        formData.append('planId', selectedPlanForManual.id);
        formData.append('userId', activeUser.id);
        formData.append('utrNumber', utrInput.trim());
        formData.append('screenshot', screenshotFile);

        res = await fetch('/api/payments/manual', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/payments/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: selectedPlanForManual.id,
            userId: activeUser.id,
            utrNumber: utrInput.trim()
          })
        });
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setManualModalOpen(false);
        setSuccessMsg('✓ Payment submitted successfully! Your plan will be activated after verification.');
        setTimeout(() => {
          window.location.href = '/clients';
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to submit payment reference.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting payment.');
    } finally {
      setSubmittingManual(false);
    }
  };

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
        {(loadingPlans || !activeUser) ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', gridColumn: '1 / -1' }}>
            <RefreshCw size={20} className="spin" /> Loading subscription plans...
          </div>
        ) : plans.map((plan) => {
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

      {/* Manual Payment Modal */}
      {manualModalOpen && selectedPlanForManual && (
        <Modal
          isOpen={manualModalOpen}
          onClose={() => setManualModalOpen(false)}
          title="Manual Payment via UPI / QR Code"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '4px 0' }}>
            {/* Plan Info Banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 18px',
              borderRadius: '12px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-light)'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Selected Plan
                </span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-heading)' }}>
                  {selectedPlanForManual.name} ({selectedPlanForManual.durationDays} Days)
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-dark)' }}>
                ₹{Number(selectedPlanForManual.price).toFixed(0)}
              </div>
            </div>

            {/* QR Code & UPI Container */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '12px',
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-card)'
            }}>
              {manualPaymentInfo.qrCode ? (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}>
                  <img
                    src={manualPaymentInfo.qrCode}
                    alt="UPI QR Code"
                    style={{ width: '180px', height: '180px', objectFit: 'contain', display: 'block', borderRadius: '6px' }}
                  />
                </div>
              ) : (
                <div style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '12px',
                  border: '2px dashed var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-subtle)',
                  gap: '8px'
                }}>
                  <QrCode size={44} style={{ opacity: 0.3 }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scan & Pay</span>
                </div>
              )}

              {manualPaymentInfo.upiId && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-color)',
                  maxWidth: '100%'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {manualPaymentInfo.upiId}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(manualPaymentInfo.upiId);
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    title="Copy UPI ID"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: copiedUpi ? 'var(--accent)' : 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px'
                    }}
                  >
                    {copiedUpi ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              )}

              {manualPaymentInfo.upiName && (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Payee: <strong style={{ color: 'var(--text-heading)' }}>{manualPaymentInfo.upiName}</strong>
                </div>
              )}

              {manualPaymentInfo.paymentNote && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, maxWidth: '380px' }}>
                  {manualPaymentInfo.paymentNote}
                </p>
              )}
            </div>

            {/* Submission Form */}
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                  Transaction UTR / Reference Number (12 digits) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 428901234567 or UPI Ref ID"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Find this 12-digit reference number in your UPI app (Google Pay, PhonePe, Paytm, etc.).
                </span>
              </div>

              {/* Payment Screenshot Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                  Payment Screenshot / Receipt <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{
                  position: 'relative',
                  border: screenshotFile ? '1.5px solid #16a34a' : '1.5px dashed var(--border-color)',
                  borderRadius: '10px',
                  padding: '14px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setScreenshotFile(e.target.files[0]);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                  {screenshotFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#16a34a', fontWeight: 600, fontSize: '13px' }}>
                      <Check size={16} />
                      <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Selected: {screenshotFile.name} ({(screenshotFile.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setScreenshotFile(null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                      <Upload size={20} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-heading)' }}>
                        Click or Drag to Upload Payment Screenshot
                      </span>
                      <span style={{ fontSize: '11px' }}>PNG, JPG or WEBP up to 5MB</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingManual || !utrInput.trim() || !screenshotFile}
                  style={{
                    flex: 2,
                    height: '42px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: submittingManual || !utrInput.trim() || !screenshotFile ? 'not-allowed' : 'pointer',
                    opacity: submittingManual || !utrInput.trim() || !screenshotFile ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {submittingManual ? 'Submitting...' : 'Submit Payment Reference'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
