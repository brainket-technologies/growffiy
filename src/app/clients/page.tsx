'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppViewModel } from '../../shared/viewmodels/AppContext';
import { Card } from '../../shared/components/views/Card';
import { PerformanceChart } from '../../shared/components/views/PerformanceChart';
import { Loader } from '../../shared/components/views/Loader';
import {
  User,
  Award,
  ShieldCheck,
  Activity,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronLeft,
  ChevronRight,
  Shield,
  Key,
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  PlayCircle,
  ArrowUpRight,
  X,
  Layers
} from 'lucide-react';
import { KiteClient } from '../../shared/services/kite';
import { generateClientTOTP, getTOTPCountdown } from '../../shared/services/totpClient';
import { API_ENDPOINTS } from '../../core/constants';import { Modal } from '../../shared/components/views/Modal';
import { Button } from '../../shared/components/views/Button';
import { api } from '../../shared/services/api';


export default function ClientDashboardOverview() {
  const { trades, clients, colors, loading, activeUser, updateClient } = useAppViewModel();
  const [totpCode, setTotpCode] = useState<string>('------');
  const [countdown, setCountdown] = useState<number>(30);
  const [liveMargin, setLiveMargin] = useState<number | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);
  const [showZerodhaConnect, setShowZerodhaConnect] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [performancePeriod, setPerformancePeriod] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Weekly');
  const [selectedBarModal, setSelectedBarModal] = useState<{ label: string; index: number } | null>(null);
  const [modalTrades, setModalTrades] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalViewMode, setModalViewMode] = useState<'list' | 'grouped'>('list');
  const [alertModal, setAlertModal] = useState<{
    title: string;
    message: React.ReactNode;
    onConfirm?: () => void;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSetting = localStorage.getItem('growffiy_show_zerodha_connect');
      if (storedSetting !== null) {
        setShowZerodhaConnect(storedSetting !== 'false');
      }
    }
    const checkSetting = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.SETTINGS);
        if (res.success && res.settings) {
          const isEnabled = res.settings.show_zerodha_connect !== 'false';
          setShowZerodhaConnect(isEnabled);
          localStorage.setItem('growffiy_show_zerodha_connect', String(isEnabled));
        }
      } catch {}
    };
    checkSetting();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('growffiy_logged_in_user_id');
      const storedRole = localStorage.getItem('growffiy_logged_in_user_role');
      if (!storedId || storedRole !== 'client') {
        if (storedRole === 'admin') {
          window.location.href = '/admin';
        } else {
          localStorage.removeItem('growffiy_logged_in_user_id');
          localStorage.removeItem('growffiy_logged_in_user_role');
          window.location.href = '/login';
        }
      }
    }
  }, []);

  // Find dynamic configuration matches for this client from active clients database list
  const matchedClient = activeUser?.client || clients.find(c => 
    c.zerodhaClientId?.toLowerCase() === activeUser?.id?.toLowerCase() || 
    c.user?.userId?.toLowerCase() === activeUser?.id?.toLowerCase() ||
    c.user?.name?.toLowerCase() === activeUser?.name?.toLowerCase()
  );

  const hasAccessToken = !!(matchedClient?.accessToken);

  const kycStatusLower = matchedClient?.kycStatus?.toLowerCase() || '';
  const isKycApproved = kycStatusLower === 'approved' || kycStatusLower === 'verified';
  const isKycSubmitted = kycStatusLower === 'submitted';
  const isKycFailed = kycStatusLower === 'failed' || kycStatusLower === 'rejected';

  const getTradePnl = (t: any) => {
    if (!t) return 0;
    if (t.pnl !== undefined && t.pnl !== null && Number(t.pnl) !== 0) return Number(t.pnl);
    const entry = Number(t.entryPrice || 0);
    const exit = Number(t.exitPrice || 0);
    const qty = Number(t.quantity || 1);
    if (entry > 0 && exit > 0) {
      const isShort = (t.direction || 'LONG').toUpperCase() === 'SHORT';
      return isShort ? (entry - exit) * qty : (exit - entry) * qty;
    }
    return 0;
  };

  const handleSimulateConnection = async (connect: boolean) => {
    if (!matchedClient?.id) return;

    const apiKeyToUse = matchedClient.zerodhaApiKey || process.env.NEXT_PUBLIC_ZERODHA_API_KEY || '4y7j026qyv9lkacw';
    const clientId = matchedClient.zerodhaClientId || matchedClient.id;

    if (connect) {
      console.log('%c[KITE CONNECT API LOG] 🚀 Initiating Zerodha Connection...', 'color: #1252ab; font-weight: bold; font-size: 13px;');
      console.log('📌 Zerodha Client ID:', clientId);
      console.log('📌 App API Key:', apiKeyToUse);
      console.log('🌐 1. OAuth Connect URL:', KiteClient.getLoginUrl(apiKeyToUse, clientId));
      console.log('🌐 2. Session Exchange Endpoint: POST https://api.kite.trade/session/token');
      console.log('🌐 3. Profile Fetch Endpoint: GET https://api.kite.trade/user/profile');
      console.log('🌐 4. Live Margins Endpoint: GET https://api.kite.trade/user/margins');

      if (matchedClient.zerodhaTotpSecret) {
        console.log('[KITE CONNECT API LOG] Executing Auto-Login via TOTP Endpoint:', `${API_ENDPOINTS.CLIENTS}/${matchedClient.id}/autologin`);
        setAlertModal({
          title: 'Auto-Login in Progress',
          message: 'Connecting to Zerodha using Auto-Login...',
        });
        try {
          const res = await api.post(`${API_ENDPOINTS.CLIENTS}/${matchedClient.id}/autologin`, {}).catch(err => ({
            success: false,
            error: err.message || 'Auto-login failed'
          }));
          if (res.success) {
            console.log('%c[KITE CONNECT API LOG] ✅ Zerodha Session Connected Successfully!', 'color: #16a34a; font-weight: bold;');
            console.log('🔑 Generated Access Token:', res.accessToken || 'active');
            setAlertModal({
              title: 'Connected',
              message: 'Zerodha Kite Connect session established successfully via Auto-Login!',
              onConfirm: () => window.location.reload()
            });
          } else {
            console.warn('[KITE CONNECT API LOG] ⚠️ Auto-login failed, prompting manual OAuth login fallback:', res.error);
            setAlertModal({
              title: 'Auto-Login Failed',
              message: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p>{res.error || 'Failed to auto-login.'}</p>
                  <p style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-heading)', marginTop: '4px' }}>
                    Would you like to log in manually via Zerodha OAuth instead?
                  </p>
                </div>
              ),
              onConfirm: () => {
                console.log('[KITE CONNECT API LOG] Redirecting to Zerodha OAuth Page:', KiteClient.getLoginUrl(apiKeyToUse, clientId));
                window.location.href = KiteClient.getLoginUrl(apiKeyToUse, clientId);
              }
            });
          }
        } catch (err: any) {
          console.error('[KITE CONNECT API LOG] ❌ Auto-login error:', err);
          setAlertModal({
            title: 'Auto-Login Error',
            message: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p>{err.message || 'Error occurred during auto-login.'}</p>
                <p style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-heading)', marginTop: '4px' }}>
                  Would you like to log in manually via Zerodha OAuth instead?
                </p>
              </div>
            ),
            onConfirm: () => {
              console.log('[KITE CONNECT API LOG] Redirecting to Zerodha OAuth Page:', KiteClient.getLoginUrl(apiKeyToUse, clientId));
              window.location.href = KiteClient.getLoginUrl(apiKeyToUse, clientId);
            }
          });
        }
      } else {
        setAlertModal({
          title: 'Connect to Zerodha',
          message: 'Do you want to authorize your account via the standard Zerodha Kite OAuth login page?',
          onConfirm: () => {
            console.log('[KITE CONNECT API LOG] Redirecting user to Zerodha OAuth Page:', KiteClient.getLoginUrl(apiKeyToUse, clientId));
            window.location.href = KiteClient.getLoginUrl(apiKeyToUse, clientId);
          }
        });
      }
    } else {
      console.log('%c[KITE CONNECT API LOG] 🛑 Initiating Zerodha Session Disconnect...', 'color: #ef4444; font-weight: bold; font-size: 13px;');
      console.log('📌 Target Client ID:', clientId);
      console.log('🌐 Invalidate Token API Endpoint:', `PUT ${API_ENDPOINTS.CLIENTS}/${matchedClient.id} | Payload: { accessToken: null }`);
      console.log('🌐 Zerodha Logout Endpoint: DELETE https://api.kite.trade/session/token');

      setAlertModal({
        title: 'Disconnect Zerodha',
        message: 'Are you sure you want to disconnect your Zerodha Kite session?',
        onConfirm: async () => {
          setIsDisconnecting(true);
          try {
            const success = await updateClient(matchedClient.id, { accessToken: null });
            if (success) {
              console.log('%c[KITE CONNECT API LOG] 🔴 Zerodha Session Disconnected & Token Invalidated', 'color: #ef4444; font-weight: bold;');
              setLiveMargin(null);
              setAlertModal({
                title: 'Success',
                message: 'Zerodha session disconnected.',
                onConfirm: () => window.location.reload()
              });
            } else {
              console.error('[KITE CONNECT API LOG] ❌ Failed to disconnect Zerodha session');
              setAlertModal({
                title: 'Error',
                message: 'Failed to disconnect session.'
              });
            }
          } catch (err: any) {
            console.error('[KITE CONNECT API LOG] ❌ Error during disconnect:', err);
            setAlertModal({
              title: 'Error',
              message: 'Error updating connection: ' + err.message
            });
          } finally {
            setIsDisconnecting(false);
          }
        }
      });
    }
  };

  useEffect(() => {
    if (!matchedClient?.zerodhaTotpSecret) return;

    const updateTotp = async () => {
      try {
        const code = await generateClientTOTP(matchedClient.zerodhaTotpSecret);
        setTotpCode(code);
        setCountdown(getTOTPCountdown());
      } catch (err) {
        console.error('Failed to generate TOTP:', err);
      }
    };

    updateTotp();
    const interval = setInterval(updateTotp, 1000);
    return () => clearInterval(interval);
  }, [matchedClient?.zerodhaTotpSecret]);

  useEffect(() => {
    if (!matchedClient?.id) return;

    fetch(`${API_ENDPOINTS.CLIENTS}/${matchedClient.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.margin?.equity?.net !== undefined) {
          setLiveMargin(Number(data.margin.equity.net));
        }
      })
      .catch(err => console.error('Failed to fetch live margins:', err));
  }, [matchedClient?.id]);

  // Fallbacks: if matchedClient is found, use its details, otherwise fallback to static presets
  const capital = matchedClient ? Number(matchedClient.capital) : 250000;

  let zerodhaSession: any = null;
  if (matchedClient?.zerodhaSession) {
    try {
      zerodhaSession = typeof matchedClient.zerodhaSession === 'string'
        ? JSON.parse(matchedClient.zerodhaSession)
        : matchedClient.zerodhaSession;
    } catch (e) {
      console.error('Failed to parse zerodhaSession:', e);
    }
  }

  const activeStrategy = matchedClient?.strategy?.name || 'Pre-Open Breakout';

  const pageSize = 10;

  // Filter trades placed on behalf of this client dynamically
  const clientTrades = trades.filter(t => {
    let belongsToClient = false;
    if (matchedClient) {
      belongsToClient = t.clientId === matchedClient.id;
    } else {
      const name = t.client?.user?.name || t.clientName || '';
      belongsToClient = name.toLowerCase().includes('aman') || t.clientId === 'c1';
    }
    if (!belongsToClient) return false;

    const rawStatus = (t.status || '').toLowerCase();
    const isClosed = rawStatus === 'closed' || rawStatus === 'success' || (Number(t.entryPrice || 0) > 0 && Number(t.exitPrice || 0) > 0);
    return isClosed;
  });

  const totalTradesCount = clientTrades.length;
  const totalPages = Math.ceil(totalTradesCount / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTrades = clientTrades.slice(startIndex, startIndex + pageSize);

  const totalPnl = clientTrades.reduce((sum, t) => sum + getTradePnl(t), 0);
  
  // Find the active subscription dynamically
  const now = new Date();
  const activeSub = activeUser?.subscriptions?.find((sub: any) => {
    const start = new Date(sub.startDate);
    const end = new Date(sub.endDate);
    return sub.status === 'active' && start <= now && end >= now;
  }) || activeUser?.subscriptions?.find((sub: any) => sub.status === 'active');

  const queuedSubs = activeUser?.subscriptions?.filter((sub: any) => {
    const start = new Date(sub.startDate);
    return sub.status === 'active' && start > now;
  }) || [];

  const isSubscriptionActive = matchedClient?.subscriptionStatus === 'active' || !!activeSub;
  const activePlanName = activeSub?.plan?.name || (isSubscriptionActive ? 'Active Plan' : 'No Active Plan');
  const activePlanStatus = activeSub?.status || matchedClient?.subscriptionStatus || 'pending';

  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }); // e.g. "14 June 2026"
  };

  const formatDateTime = (timeStr: string | Date | null | undefined) => {
    if (!timeStr) return '--';
    try {
      const date = new Date(timeStr);
      return date.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      return '--';
    }
  };

  const getSubDates = () => {
    if (!activeSub) {
      const start = new Date();
      const end = new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
      return { start, end };
    }
    const start = new Date(activeSub.startDate);
    let end: Date;
    if (activeSub.plan?.durationDays) {
      end = new Date(start.getTime() + Number(activeSub.plan.durationDays) * 24 * 60 * 60 * 1000);
    } else if (activeSub.endDate) {
      end = new Date(activeSub.endDate);
    } else {
      end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    return { start, end };
  };

  const { start: subStartDate, end: subEndDate } = getSubDates();
  const startDateStr = subStartDate ? formatDate(subStartDate) : '--';
  const endDateStr = subEndDate ? formatDate(subEndDate) : '--';

  // Calculate days left for active subscription warning
  let daysLeft: number | null = null;
  if (isSubscriptionActive && subEndDate) {
    const today = new Date();
    const end = new Date(subEndDate);
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  const showExpiryWarning = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;

  const productTypeName = matchedClient?.productType?.name || matchedClient?.productTypeName || '';
  const isAlgo = !productTypeName || productTypeName.toLowerCase() === 'algo';

  const completionPercentage = useMemo(() => {
    const step1Done = !!matchedClient?.productTypeId;
    if (!step1Done) return 10;

    const step2Done = isSubscriptionActive;
    const hasClientKyc = !isKycFailed && (isKycApproved || isKycSubmitted || (!!matchedClient?.panNumber && !!matchedClient?.aadhaarNumber && !!matchedClient?.dob));

    if (isAlgo) {
      let pct = 20; // Step 1 complete
      if (step2Done) {
        pct += 20; // Step 2 complete
        const step3Done = !!matchedClient?.zerodhaClientId && !!matchedClient?.zerodhaPassword && !!matchedClient?.zerodhaTotpSecret;
        if (step3Done) {
          pct += 20; // Step 3 complete
          const step4Done = !!matchedClient?.accessToken;
          if (step4Done) {
            pct += 20; // Step 4 complete
            if (hasClientKyc) {
              pct += 20; // Step 5 complete
            }
          }
        }
      }
      return pct;
    } else {
      let pct = 30; // Step 1 complete
      if (step2Done) {
        pct += 35; // Step 2 complete
        if (hasClientKyc) {
          pct += 35; // Step 3 complete
        }
      }
      return pct;
    }
  }, [isAlgo, isSubscriptionActive, matchedClient, isKycApproved, isKycSubmitted, isKycFailed]);

  const activeStep = useMemo(() => {
    const step1Done = !!matchedClient?.productTypeId;
    if (!step1Done) return 1;

    const step2Done = isSubscriptionActive;
    if (!step2Done) return 2;

    const hasKyc = !isKycFailed && (isKycApproved || isKycSubmitted || (!!matchedClient?.panNumber && !!matchedClient?.aadhaarNumber && !!matchedClient?.dob));

    if (isAlgo) {
      if (!matchedClient?.zerodhaClientId || !matchedClient?.zerodhaPassword || !matchedClient?.zerodhaTotpSecret) return 3; // Need to connect broker
      if (!matchedClient?.accessToken) return 4; // Need to authorize Zerodha (Step 4)
      if (!hasKyc) return 5; // Need to submit KYC
      return 6; // All complete
    } else {
      if (!hasKyc) return 3; // Need to submit KYC
      return 4; // All complete
    }
  }, [isAlgo, isSubscriptionActive, matchedClient, isKycApproved, isKycSubmitted, isKycFailed]);

  const stepperSteps = useMemo(() => {
    const step1Done = !!matchedClient?.productTypeId;
    const step2Done = step1Done && isSubscriptionActive;
    const hasClientKyc = !isKycFailed && (isKycApproved || isKycSubmitted || (!!matchedClient?.panNumber && !!matchedClient?.aadhaarNumber && !!matchedClient?.dob));

    if (isAlgo) {
      const step3Done = step2Done && !!matchedClient?.zerodhaClientId && !!matchedClient?.zerodhaPassword && !!matchedClient?.zerodhaTotpSecret;
      const step4Done = step3Done && !!matchedClient?.accessToken;
      const step5Done = step4Done && hasClientKyc;

      return [
        { id: 1, label: 'Platform Preferences', completed: step1Done },
        { id: 2, label: 'Choose Plan', completed: step2Done },
        { id: 3, label: 'Zerodha API', completed: step3Done },
        { id: 4, label: 'Live Trading', completed: step4Done },
        { id: 5, label: 'Submit KYC', completed: step5Done }
      ];
    } else {
      const step3Done = step2Done && hasClientKyc;

      return [
        { id: 1, label: 'Platform Preferences', completed: step1Done },
        { id: 2, label: 'Choose Plan', completed: step2Done },
        { id: 3, label: 'Submit KYC', completed: step3Done }
      ];
    }
  }, [isAlgo, isSubscriptionActive, matchedClient, isKycApproved, isKycSubmitted, isKycFailed]);

  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [showZPassword, setShowZPassword] = useState(false);
  const [showZSecret, setShowZSecret] = useState(false);
  const [showZTotp, setShowZTotp] = useState(false);

  useEffect(() => {
    if (activeStep === 2) {
      setLoadingPlans(true);
      fetch(API_ENDPOINTS.PLANS)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            let activePlans = data.plans.filter((p: any) => p.status === 'active');
            if (matchedClient?.productTypeId) {
              activePlans = activePlans.filter((p: any) => p.productTypeId === matchedClient.productTypeId);
            }
            setPlans(activePlans);
          }
        })
        .catch(err => console.error("Error loading plans:", err))
        .finally(() => setLoadingPlans(false));

      // Dynamic Razorpay script load
      if (!(window as any).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [activeStep, matchedClient?.productTypeId]);

  const handlePurchasePlan = async (plan: any) => {
    if (!activeUser) return;
    setPurchasingPlanId(plan.id);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      const settingsRes = await fetch(API_ENDPOINTS.SETTINGS_PUBLIC);
      const settingsData = await settingsRes.json();
      if (!settingsData.success || !settingsData.razorpayKeyId) {
        throw new Error('Razorpay payment gateway not configured by Admin.');
      }

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

      const options = {
        key: settingsData.razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: settingsData.appName || 'Growffi',
        description: `${plan.name} Subscription`,
        order_id: orderData.orderId,
        prefill: {
          name: activeUser.name || 'Client',
          email: activeUser.email || '',
        },
        theme: {
          color: '#2563eb'
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
              setPaymentSuccess('✓ Payment successful! Your subscription is now active.');
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } else {
              throw new Error(verifyData.error || 'Payment signature verification failed.');
            }
          } catch (verifyErr: any) {
            setPaymentError(verifyErr.message || 'Verification failed. Please contact support.');
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
      setPaymentError(err.message || 'Payment setup failed. Please try again.');
      setPurchasingPlanId(null);
    }
  };

  const showHelpModal = (field: string) => {
    let title = '';
    let message: React.ReactNode = null;

    switch (field) {
      case 'clientId':
        title = 'Zerodha Client ID';
        message = (
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p><strong>What is this:</strong> Your Zerodha Kite username / login ID.</p>
            <p style={{ marginTop: '8px' }}><strong>Where to find it:</strong> Open your Kite App or visit <a href="https://kite.zerodha.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>kite.zerodha.com</a>.</p>
          </div>
        );
        break;
      case 'apiKey':
        title = 'Kite API Key';
        message = (
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p><strong>What is this:</strong> A unique API key from Zerodha Developer Console.</p>
            <p style={{ marginTop: '8px' }}><strong>Where to find it:</strong> Login to <a href="https://developers.kite.trade/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>developers.kite.trade</a>.</p>
          </div>
        );
        break;
      case 'totp':
        title = 'Zerodha TOTP Secret';
        message = (
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p><strong>What is this:</strong> The 2FA secret key that enables automated login without manual OTP entry.</p>
            <p style={{ marginTop: '8px' }}><strong>Where to find it:</strong> Go to Kite &rarr; Profile &rarr; Password & Security &rarr; Enable 2FA TOTP &rarr; "Can't scan? Copy the key".</p>
          </div>
        );
        break;
      default:
        break;
    }
    if (title) setAlertModal({ title, message });
  };

  const [personalModalOpen, setPersonalModalOpen] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [emailVal, setEmailVal] = useState('');
  const [passVal, setPassVal] = useState('');
  const [personalSubmitting, setPersonalSubmitting] = useState(false);

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedClient) return;
    setPersonalSubmitting(true);
    try {
      const updateData: any = {
        name: nameVal,
        email: emailVal,
      };
      if (passVal) {
        updateData.password = passVal;
      }
      const success = await updateClient(matchedClient.id, updateData);
      if (success) {
        setPersonalModalOpen(false);
        setAlertModal({
          title: 'Profile Updated',
          message: 'Your personal details have been updated successfully!'
        });
      } else {
        setAlertModal({
          title: 'Error',
          message: 'Failed to update personal details.'
        });
      }
    } catch (err: any) {
      setAlertModal({
        title: 'Error',
        message: err.message || 'An error occurred during update.'
      });
    } finally {
      setPersonalSubmitting(false);
    }
  };

  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [panVal, setPanVal] = useState('');
  const [aadhaarVal, setAadhaarVal] = useState('');
  const [dobVal, setDobVal] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedClient) return;
    setKycSubmitting(true);
    try {
      const success = await updateClient(matchedClient.id, {
        panNumber: panVal,
        aadhaarNumber: aadhaarVal,
        dob: dobVal,
        kycStatus: 'submitted'
      });
      if (success) {
        setKycModalOpen(false);
        setAlertModal({
          title: 'KYC Submitted',
          message: 'Your KYC verification request has been successfully submitted and is under review!'
        });
      } else {
        setAlertModal({
          title: 'Error',
          message: 'Failed to submit KYC details.'
        });
      }
    } catch (err: any) {
      setAlertModal({
        title: 'Error',
        message: err.message || 'An error occurred during submission.'
      });
    } finally {
      setKycSubmitting(false);
    }
  };

  const [availableProductTypes, setAvailableProductTypes] = useState<any[]>([]);
  const [availableStrategies, setAvailableStrategies] = useState<any[]>([]);
  const [selectedProductType, setSelectedProductType] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    const fetchOnboardingData = async () => {
      try {
        const ptRes = await api.get('/api/admin/product-types');
        if (ptRes.success) setAvailableProductTypes(ptRes.productTypes || []);
        
        const stRes = await api.get('/api/admin/strategies');
        if (stRes.success) setAvailableStrategies(stRes.strategies || []);
      } catch (err) {
        console.error('Failed to load onboarding options:', err);
      }
    };
    fetchOnboardingData();
  }, []);

  useEffect(() => {
    if (matchedClient) {
      setSelectedProductType(matchedClient.productTypeId || '');
      setSelectedStrategy(matchedClient.strategyId || '');
    }
  }, [matchedClient]);

  const handleSavePreferences = async () => {
    if (!matchedClient) return;
    setSavingPreferences(true);
    try {
      const selectedPtObj = availableProductTypes.find(pt => pt.id === selectedProductType);
      const isAlgoSelection = selectedPtObj?.name?.toLowerCase() === 'algo';

      const success = await updateClient(matchedClient.id, {
        productTypeId: selectedProductType || null,
        strategyId: isAlgoSelection ? (selectedStrategy || null) : null
      });
      if (success) {
        setAlertModal({
          title: 'Preferences Updated',
          message: 'Your product type and trading strategy preference have been saved successfully!',
          onConfirm: () => {
            window.location.reload();
          }
        });
      } else {
        setAlertModal({
          title: 'Error',
          message: 'Failed to update preferences.'
        });
      }
    } catch (err: any) {
      setAlertModal({
        title: 'Error',
        message: err.message || 'An error occurred.'
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  const rawClientTrades = trades.filter(t => {
    if (matchedClient) {
      return t.clientId === matchedClient.id;
    }
    const name = t.client?.user?.name || t.clientName || '';
    return name.toLowerCase().includes('aman') || t.clientId === 'c1';
  });



  const { clientPnlData, clientPnlLabels } = useMemo(() => {
    const now = new Date();

    if (performancePeriod === 'Weekly') {
      const data = [0, 0, 0, 0, 0, 0, 0];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const labels: string[] = [];

      const dates: Date[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        dates.push(d);
        const dayName = dayNames[d.getDay()];
        const dayNum = String(d.getDate()).padStart(2, '0');
        labels.push(`${dayName} ${dayNum}`);
      }

      rawClientTrades.forEach(t => {
        const dStr = t.createdAt || t.entryTime || t.exitTime;
        if (!dStr) return;
        const d = new Date(dStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateYMD = `${year}-${month}-${day}`;

        const idx = dates.findIndex(dt => {
          const dtY = dt.getFullYear();
          const dtM = String(dt.getMonth() + 1).padStart(2, '0');
          const dtD = String(dt.getDate()).padStart(2, '0');
          return `${dtY}-${dtM}-${dtD}` === dateYMD;
        });
        if (idx !== -1) {
          data[idx] += getTradePnl(t);
        }
      });

      return { clientPnlData: data, clientPnlLabels: labels };
    }

    if (performancePeriod === 'Monthly') {
      const year = now.getFullYear();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthsData = new Array(12).fill(0);
      const monthsLabels = monthNames;

      rawClientTrades.forEach(t => {
        const dStr = t.createdAt || t.entryTime || t.exitTime;
        if (!dStr) return;
        const d = new Date(dStr);
        if (d.getFullYear() === year) {
          const mIdx = d.getMonth();
          monthsData[mIdx] += getTradePnl(t);
        }
      });

      return { clientPnlData: monthsData, clientPnlLabels: monthsLabels };
    }

    if (performancePeriod === 'Yearly') {
      const years = [2024, 2025, 2026];
      const labels = years.map(String);
      const data = Array(years.length).fill(0);

      rawClientTrades.forEach(t => {
        const dStr = t.createdAt || t.entryTime || t.exitTime;
        if (!dStr) return;
        const d = new Date(dStr);
        const y = d.getFullYear();
        const yIdx = years.indexOf(y);
        if (yIdx !== -1) {
          data[yIdx] += getTradePnl(t);
        }
      });

      return { clientPnlData: data, clientPnlLabels: labels };
    }

    return { clientPnlData: [0], clientPnlLabels: ['Start'] };
  }, [rawClientTrades, performancePeriod]);

  // Dynamic Date Range Subtitle for P&L Overview Chart
  const chartDateRangeStr = useMemo(() => {
    const now = new Date();
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    if (performancePeriod === 'Weekly') {
      const dates: Date[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dates.push(d);
      }
      return `${fmt(dates[0])} - ${fmt(dates[6])}`;
    }
    if (performancePeriod === 'Monthly') {
      const year = now.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31);
      return `${fmt(startOfYear)} - ${fmt(endOfYear)}`;
    }
    if (performancePeriod === 'Yearly') {
      return '2024 - 2026';
    }
    return '';
  }, [performancePeriod]);

  const selectedBarTrades = useMemo(() => {
    if (!selectedBarModal) return [];
    const now = new Date();
    const { index } = selectedBarModal;

    if (performancePeriod === 'Weekly') {
      const dates: Date[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        dates.push(d);
      }
      const targetDate = dates[index];
      if (!targetDate) return [];

      const startOfDay = new Date(targetDate);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      return rawClientTrades.filter(t => {
        const dStr = t.createdAt || t.entryTime || t.exitTime;
        if (!dStr) return false;
        const d = new Date(dStr);
        return d >= startOfDay && d <= endOfDay;
      });
    }

    if (performancePeriod === 'Monthly') {
      const year = now.getFullYear();
      return rawClientTrades.filter(t => {
        const dStr = t.createdAt || t.entryTime || t.exitTime;
        if (!dStr) return false;
        const d = new Date(dStr);
        return d.getFullYear() === year && d.getMonth() === index;
      });
    }

    if (performancePeriod === 'Yearly') {
      const years = [2024, 2025, 2026];
      const targetYear = years[index];
      return rawClientTrades.filter(t => {
        const dStr = t.createdAt || t.entryTime || t.exitTime;
        if (!dStr) return false;
        const d = new Date(dStr);
        return d.getFullYear() === targetYear;
      });
    }

    return rawClientTrades;
  }, [rawClientTrades, selectedBarModal, performancePeriod]);

  const activeBarTrades = selectedBarTrades;

  const displayBarTrades = useMemo(() => {
    return activeBarTrades.filter(t => Math.abs(getTradePnl(t)) > 0.001);
  }, [activeBarTrades]);

  const groupedBarTrades = useMemo(() => {
    if (displayBarTrades.length === 0) return [];

    const map = new Map<string, any[]>();
    displayBarTrades.forEach((t: any) => {
      const d = new Date(t.createdAt || t.entryTime || t.exitTime);
      const timeKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}_${d.getHours()}:${d.getMinutes()}`;
      const groupKey = t.dualLegGroupId || `${t.strategyName || t.symbol || 'Trade'}_${timeKey}_${t.clientName || t.clientCode || 'Client'}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(t);
    });

    return Array.from(map.values());
  }, [displayBarTrades]);

  const [cardPnlFilter, setCardPnlFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');

  const cardFilteredPnl = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    let cutoff = startOfDay;
    if (cardPnlFilter === 'week') {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (cardPnlFilter === 'month') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (cardPnlFilter === 'year') {
      cutoff = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    }

    const filtered = rawClientTrades.filter(t => {
      const dStr = t.createdAt || t.entryTime;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= cutoff;
    });

    const sumPnl = filtered.reduce((acc, t) => acc + getTradePnl(t), 0);
    const totalCount = filtered.length;
    const winCount = filtered.filter(t => getTradePnl(t) > 0).length;
    const lossCount = filtered.filter(t => getTradePnl(t) < 0).length;

    return {
      pnlVal: sumPnl,
      totalCount,
      winCount,
      lossCount,
    };
  }, [rawClientTrades, cardPnlFilter]);

  const totalExposure = useMemo(() => {
    return rawClientTrades.filter(t => (t.status || '').toLowerCase() === 'open').reduce((acc, t) => acc + (Number(t.entryPrice || 0) * Number(t.quantity || 1)), 0);
  }, [rawClientTrades]);

  const unrealizedPnl = useMemo(() => {
    return rawClientTrades.filter(t => (t.status || '').toLowerCase() === 'open').reduce((acc, t) => acc + getTradePnl(t), 0);
  }, [rawClientTrades]);

  const clientRealizedPnl = useMemo(() => {
    const closed = rawClientTrades.filter(t => (t.status || '').toLowerCase() !== 'open');
    if (closed.length === 0) return totalPnl;
    return closed.reduce((acc, t) => acc + getTradePnl(t), 0);
  }, [rawClientTrades, totalPnl]);

  const openPositionsCount = useMemo(() => {
    return rawClientTrades.filter(t => (t.status || '').toLowerCase() === 'open').length;
  }, [rawClientTrades]);

  const cardWinAccuracy = useMemo(() => {
    const total = cardFilteredPnl.winCount + cardFilteredPnl.lossCount;
    if (total === 0) return 0;
    return Number(((cardFilteredPnl.winCount / total) * 100).toFixed(1));
  }, [cardFilteredPnl]);

  if (loading || !activeUser) {
    return <Loader title="Loading dashboard" text="Syncing executed breakout signals and checking active plans..." fullscreen={false} />;
  }

  const stats = [
    { name: 'Today P&L', value: totalPnl >= 0 ? `+₹${totalPnl.toFixed(2)}` : `-₹${Math.abs(totalPnl).toFixed(2)}`, color: totalPnl >= 0 ? colors.SUCCESS : colors.DANGER },
    { name: 'Zerodha Live Balance', value: `₹${(liveMargin !== null ? liveMargin : capital).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: colors.PRIMARY },
  ];

  return (
    <div className="client-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1400px', margin: '0 auto', padding: '12px' }}>
      
      {/* Premium Welcome Header with status badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '24px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--surface) 100%)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', letterSpacing: '-0.5px' }}>
            Welcome, {matchedClient?.user?.name || matchedClient?.name || activeUser.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {isAlgo 
              ? 'Monitor your automated breakout execution and account details in real-time.' 
              : 'Access your premium market scanner workspace and subscription status.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Engine Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 16px',
            borderRadius: '99px',
            background: isSubscriptionActive ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: isSubscriptionActive ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isSubscriptionActive ? '#22c55e' : '#ef4444',
              animation: isSubscriptionActive ? 'pulseDot 2.5s infinite' : 'none',
              display: 'inline-block'
            }} />
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: isSubscriptionActive ? '#16a34a' : '#dc2626'
            }}>
              Trading Engine {isSubscriptionActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* KYC Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '99px',
            background: isKycApproved 
              ? 'rgba(34, 197, 94, 0.08)' 
              : isKycSubmitted
                ? 'rgba(245, 158, 11, 0.08)'
                : 'rgba(239, 68, 68, 0.08)',
            border: isKycApproved
              ? '1px solid rgba(34, 197, 94, 0.2)'
              : isKycSubmitted
                ? '1px solid rgba(245, 158, 11, 0.2)'
                : '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: isKycApproved
                ? '#16a34a'
                : isKycSubmitted
                  ? '#d97706'
                  : '#dc2626'
            }}>
              {isKycApproved 
                ? '✓ KYC Approved' 
                : isKycSubmitted
                  ? '⏳ KYC Verification'
                  : '⚠ KYC Pending'}
            </span>
          </div>

          {showZerodhaConnect && matchedClient && (
            <div>
              {hasAccessToken ? (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => handleSimulateConnection(false)}
                  disabled={isDisconnecting}
                  style={{
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect Zerodha'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => handleSimulateConnection(true)}
                  style={{
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: 'var(--primary, #1252ab)',
                    color: '#ffffff',
                    border: 'none'
                  }}
                >
                  Connect Zerodha
                </Button>
              )}
            </div>
          )}
        </div>
      </div>



      {isSubscriptionActive && showExpiryWarning && (
        <div style={{
          padding: '20px',
          borderRadius: '14px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          boxShadow: 'var(--shadow-sm)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Clock size={20} />
            </div>
            <div>
              <h4 style={{ color: '#b45309', fontSize: '15px', fontWeight: 700, marginBottom: '2px' }}>
                Subscription Expiring Soon
              </h4>
              <p style={{ color: '#78350f', fontSize: '13.5px' }}>
                Your active plan will expire in <strong>{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</strong>. Please renew to ensure uninterrupted trade execution.
              </p>
            </div>
          </div>
          <a
            href="/dashboard/subscription"
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: 'var(--warning)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 10px rgba(245, 158, 11, 0.2)',
              transition: 'all 0.2s'
            }}
          >
            Renew Plan
          </a>
        </div>
      )}

      {((isAlgo && activeStep < 6) || (!isAlgo && activeStep < 4)) ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px', maxWidth: '780px', margin: '0 auto', width: '100%' }}>
          
          {/* Profile Completeness & Quick Actions Card */}
          <Card style={{ padding: '30px', borderRadius: '20px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '4px', fontFamily: 'Outfit, sans-serif' }}>
                  Profile Onboarding Status
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {isAlgo 
                    ? 'Complete your verification, KYC, and broker details to enable automated executions.' 
                    : 'Complete your verification and KYC to activate your strategy scanner.'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#2563eb', fontFamily: 'Outfit, sans-serif' }}>
                  {completionPercentage}%
                </span>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px', 
                  color: completionPercentage === 100 ? '#15803d' : '#475569', 
                  backgroundColor: completionPercentage === 100 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(71, 85, 105, 0.1)', 
                  padding: '4px 10px', 
                  borderRadius: '20px' 
                }}>
                  {completionPercentage === 100 ? 'Setup Ready' : 'Setup Incomplete'}
                </span>
              </div>
            </div>

            {/* Horizontal timeline stepper */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              margin: '20px 0 36px',
              padding: '0 10px',
              flexWrap: 'wrap',
              gap: '16px'
            }} className="horizontal-stepper-wrap">
              {/* Stepper progress background line */}
              <div style={{
                position: 'absolute',
                top: '22px',
                left: '50px',
                right: '50px',
                height: '3px',
                backgroundColor: 'var(--border-light, #e2e8f0)',
                zIndex: 1
              }} className="stepper-bg-line" />

              {stepperSteps.map((step) => {
                const isActive = activeStep === step.id;
                const isCompleted = step.completed;
                
                return (
                  <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2, flex: 1, minWidth: '100px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? '#22c55e' : isActive ? '#2563eb' : '#94a3b8',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '15px',
                      border: '4px solid var(--surface, #fff)',
                      boxShadow: isCompleted ? '0 4px 10px rgba(34, 197, 94, 0.2)' : isActive ? '0 4px 10px rgba(37, 99, 235, 0.2)' : 'none'
                    }}>
                      {isCompleted ? '✓' : step.id}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: isCompleted ? '#166534' : isActive ? 'var(--text-heading)' : 'var(--text-secondary)', marginTop: '8px', opacity: (isActive || isCompleted) ? 1 : 0.6 }}>
                      {step.id}. {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Inline Dynamic Active Step Wizard Form Container */}
            <div style={{ marginTop: '24px' }}>
              
              {/* Step 1: Preferences Selection Form */}
              {activeStep === 1 && (
                <div>
                  <h5 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '18px', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', fontSize: '11px', fontWeight: 700 }}>1</span>
                    Active Step: Configure Platform Preferences
                  </h5>
                  
                  <div style={{ marginBottom: '24px' }}>
                    {/* Product Type Selection */}
                    <div style={{ marginBottom: '28px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Select Product Type
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
                        {availableProductTypes.map((pt) => {
                          const isSelected = selectedProductType === pt.id;
                          const displayName = pt.name === 'algo' ? 'Algo Trading Middleware' : pt.name === 'basic' ? 'Basic Algo Tool' : pt.name === 'scanner' ? 'Market Scanner Tool' : pt.name;
                          const description = pt.name === 'algo' ? 'Automated API trading and order execution via connected brokers.' : 'Premium stock breakout gap scanner spreadsheet workspace.';
                          
                          return (
                            <div
                              key={pt.id}
                              onClick={() => setSelectedProductType(pt.id)}
                              style={{
                                padding: '16px 20px',
                                borderRadius: '14px',
                                border: isSelected ? '2px solid #2563eb' : '1.5px solid var(--border)',
                                backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.02)' : 'var(--surface)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                boxShadow: isSelected ? '0 8px 20px -6px rgba(37, 99, 235, 0.08)' : 'none',
                                position: 'relative'
                              }}
                            >
                              <div style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                border: isSelected ? '2px solid #2563eb' : '1.5px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'var(--surface)',
                                transition: 'all 0.2s ease'
                              }}>
                                {isSelected && (
                                  <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: '#2563eb'
                                  }} />
                                )}
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', paddingRight: '16px' }}>
                                {displayName}
                              </span>
                              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                {description}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Strategy Card Grid Selector (Only active strategies) */}
                    {availableProductTypes.find(pt => pt.id === selectedProductType)?.name?.toLowerCase() === 'algo' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Choose Trading Strategy (Active Only)
                        </label>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                          {availableStrategies.filter(s => s.status === 'active').map((s) => {
                            const isSelected = selectedStrategy === s.id;
                            
                            // Strategy specific or default mock stats to display rich metrics
                            const isPreOpen = s.name.toLowerCase().includes('pre-open') || s.id.toLowerCase().includes('pre-open');
                            const winRate = isPreOpen ? '74%' : '68%';
                            const lossRate = isPreOpen ? '26%' : '32%';
                            const riskLevel = isPreOpen ? 'Moderate-High' : 'Moderate';
                            const returnRate = isPreOpen ? '+8.5%' : '+6.2%';

                            return (
                              <div
                                key={s.id}
                                onClick={() => setSelectedStrategy(s.id)}
                                style={{
                                  padding: '20px',
                                  borderRadius: '16px',
                                  border: isSelected ? '2px solid #2563eb' : '1.5px solid var(--border)',
                                  backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.02)' : 'var(--surface)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: isSelected ? '0 10px 25px -5px rgba(37, 99, 235, 0.1)' : 'var(--shadow-sm)',
                                  position: 'relative'
                                }}
                              >
                                <div style={{
                                  position: 'absolute',
                                  top: '16px',
                                  right: '16px',
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  border: isSelected ? '2px solid #2563eb' : '1.5px solid var(--border)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: 'var(--surface)',
                                  transition: 'all 0.2s ease'
                                }}>
                                  {isSelected && (
                                    <div style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      backgroundColor: '#2563eb'
                                    }} />
                                  )}
                                </div>

                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', width: '100%' }}>
                                  {/* Left details */}
                                  <div style={{ flex: '1', minWidth: '220px' }}>
                                    <h6 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '6px', paddingRight: '20px' }}>
                                      {s.name}
                                    </h6>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                                      {s.description || 'Scans and executes high-probability breakout setups automatically.'}
                                    </p>
                                  </div>

                                  {/* Right metrics panel */}
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '10px 14px',
                                    minWidth: '180px',
                                    paddingLeft: '16px',
                                    borderLeft: '1px solid var(--border-light, #e2e8f0)',
                                    alignSelf: 'stretch',
                                    alignContent: 'center'
                                  }} className="strategy-card-metrics">
                                    <div>
                                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Win Rate</span>
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>{winRate}</span>
                                    </div>
                                    <div>
                                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Loss Rate</span>
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b' }}>{lossRate}</span>
                                    </div>
                                    <div>
                                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg. Monthly</span>
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb' }}>{returnRate}</span>
                                    </div>
                                    <div>
                                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Risk Profile</span>
                                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-heading)' }}>{riskLevel}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleSavePreferences}
                      disabled={savingPreferences}
                      style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}
                    >
                      {savingPreferences ? 'Saving Settings...' : 'Save Preferences & Continue'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Choose Plan (Both Algo & Scanner) */}
              {activeStep === 2 && (
                <div>
                  <h5 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '8px', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', fontSize: '11px', fontWeight: 700 }}>2</span>
                    Active Step: Choose Pricing Subscription Plan
                  </h5>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                    Select and purchase an active pricing plan for your chosen product type to unlock the next steps.
                  </p>

                  {paymentError && (
                    <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#ef4444', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
                      ⚠️ {paymentError}
                    </div>
                  )}

                  {paymentSuccess && (
                    <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#065f46', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
                      {paymentSuccess}
                    </div>
                  )}

                  {loadingPlans ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading available plans...</span>
                    </div>
                  ) : plans.length === 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No active subscription plans configured for this product type.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      {plans.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            padding: '24px',
                            borderRadius: '16px',
                            border: '1.5px solid var(--border)',
                            backgroundColor: 'var(--surface)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: 'var(--shadow-sm)',
                            position: 'relative'
                          }}
                        >
                          <div>
                            <h6 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '8px' }}>
                              {p.name}
                            </h6>
                            <div style={{ fontSize: '26px', fontWeight: 900, color: '#2563eb', marginBottom: '12px', fontFamily: 'Outfit, sans-serif' }}>
                              ₹{p.price}
                              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '4px' }}>
                                / {p.durationDays === 30 ? 'month' : p.durationDays === 90 ? 'quarter' : `${p.durationDays} days`}
                              </span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '20px' }}>
                              {p.description || 'Access strategy scanner tools, alerts and signals.'}
                            </p>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Button
                              type="button"
                              variant="primary"
                              disabled={purchasingPlanId === p.id}
                              onClick={() => handlePurchasePlan(p)}
                              style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}
                            >
                              {purchasingPlanId === p.id ? 'Initializing Checkout...' : 'Purchase Plan Now'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 (Algo): Connect Broker API */}
              {activeStep === 3 && isAlgo && (
                <div>
                  <h5 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '8px', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', fontSize: '11px', fontWeight: 700 }}>3</span>
                    Active Step: Link Zerodha Kite API Credentials
                  </h5>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Provide your Zerodha broker account Client ID and API keys below to establish execution connectivity.
                  </p>
                  
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!matchedClient) return;
                    const success = await updateClient(matchedClient.id, {
                      zerodhaClientId: (e.currentTarget.elements.namedItem('zClientId') as HTMLInputElement).value,
                      zerodhaApiKey: (e.currentTarget.elements.namedItem('zApiKey') as HTMLInputElement).value,
                      zerodhaApiSecret: (e.currentTarget.elements.namedItem('zApiSecret') as HTMLInputElement).value,
                      zerodhaPassword: (e.currentTarget.elements.namedItem('zPassword') as HTMLInputElement).value,
                      zerodhaTotpSecret: (e.currentTarget.elements.namedItem('zTotpSecret') as HTMLInputElement).value
                    });
                    if (success) {
                      setAlertModal({
                        title: 'Zerodha API Connected',
                        message: 'Your Zerodha Kite API configuration has been updated successfully! Moving to next step.',
                        onConfirm: () => {
                          window.location.reload();
                        }
                      });
                    }
                  }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div className="form-grid-2">
                      
                      {/* Client ID */}
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Zerodha Client ID *
                          <button
                            type="button"
                            onClick={() => showHelpModal('clientId')}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                          </button>
                        </label>
                        <div className="premium-input-wrapper">
                          <span className="premium-input-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          </span>
                          <input
                            type="text"
                            name="zClientId"
                            required
                            defaultValue={matchedClient?.zerodhaClientId || ''}
                            placeholder="e.g. ABC123"
                            className="premium-input"
                          />
                        </div>
                      </div>

                      {/* API Key */}
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Kite API Key *
                          <button
                            type="button"
                            onClick={() => showHelpModal('apiKey')}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                          </button>
                        </label>
                        <div className="premium-input-wrapper">
                          <span className="premium-input-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                          </span>
                          <input
                            type="text"
                            name="zApiKey"
                            required
                            defaultValue={matchedClient?.zerodhaApiKey || ''}
                            placeholder="Kite API Key"
                            className="premium-input"
                          />
                        </div>
                      </div>

                      {/* API Secret */}
                      <div className="form-group">
                        <label className="form-label">
                          Kite API Secret *
                        </label>
                        <div className="premium-input-wrapper">
                          <span className="premium-input-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          </span>
                          <input
                            name="zApiSecret"
                            required
                            type={showZSecret ? 'text' : 'password'}
                            defaultValue={matchedClient?.zerodhaApiSecret || ''}
                            placeholder="Kite API Secret"
                            className="premium-input"
                            style={{ paddingRight: '42px' }}
                          />
                          <span
                            onClick={() => setShowZSecret(!showZSecret)}
                            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            {showZSecret ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="form-group">
                        <label className="form-label">
                          Zerodha Password (For Auto-Login) *
                        </label>
                        <div className="premium-input-wrapper">
                          <span className="premium-input-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          </span>
                          <input
                            name="zPassword"
                            required
                            type={showZPassword ? 'text' : 'password'}
                            defaultValue={matchedClient?.zerodhaPassword || ''}
                            placeholder="Zerodha Password"
                            className="premium-input"
                            style={{ paddingRight: '42px' }}
                          />
                          <span
                            onClick={() => setShowZPassword(!showZPassword)}
                            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            {showZPassword ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* TOTP Secret */}
                      <div className="form-group form-span-2">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Zerodha TOTP Secret (For Auto-Login) *
                          <button
                            type="button"
                            onClick={() => showHelpModal('totp')}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                          </button>
                        </label>
                        <div className="premium-input-wrapper">
                          <span className="premium-input-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                          </span>
                          <input
                            name="zTotpSecret"
                            required
                            type={showZTotp ? 'text' : 'password'}
                            defaultValue={matchedClient?.zerodhaTotpSecret || ''}
                            placeholder="e.g. JBSWY3DPEHPK3PXP"
                            className="premium-input"
                            style={{ paddingRight: '42px' }}
                          />
                          <span
                            onClick={() => setShowZTotp(!showZTotp)}
                            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            {showZTotp ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            )}
                          </span>
                        </div>
                      </div>

                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                      <Button type="submit" variant="primary" style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}>
                        Connect API Keys & Continue
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Step 4 (Algo): Connect Zerodha Account */}
              {activeStep === 4 && isAlgo && (
                <div>
                  <h5 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '10px', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', fontSize: '11px', fontWeight: 700 }}>4</span>
                    Active Step: Connect Zerodha Account
                  </h5>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
                    To link your Zerodha account, you will be redirected to the secure **Zerodha Kite OAuth portal**:
                  </p>
                  <ul style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>1. You will be redirected to Zerodha's official login page (<strong>kite.zerodha.com</strong>).</li>
                    <li>2. Log in using your broker Client ID and Password.</li>
                    <li>3. Enter your 2FA TOTP or mobile OTP key code to verify identity.</li>
                    <li>4. Review and click the <strong>Authorize / Login</strong> button to grant terminal execution access.</li>
                  </ul>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => handleSimulateConnection(true)}
                      style={{ padding: '12px 28px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}
                    >
                      Connect Zerodha Account ✓
                    </Button>
                  </div>
                </div>
              )}

              {/* KYC Verification Form (Step 5 for Algo, Step 3 for Scanner) */}
              {((activeStep === 5 && isAlgo) || (activeStep === 3 && !isAlgo)) && (
                <div>
                  <h5 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '8px', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', fontSize: '11px', fontWeight: 700 }}>{activeStep}</span>
                    Active Step: Submit KYC Verification Details
                  </h5>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Please submit your verification details below to finalize terminal registration.
                  </p>

                  {isKycFailed && (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      marginBottom: '16px',
                      color: '#b91c1c',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>Your previous KYC verification submission was rejected or failed. Please check and re-submit your correct verification details.</span>
                    </div>
                  )}
                  
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!matchedClient) return;
                    const success = await updateClient(matchedClient.id, {
                      panNumber: (e.currentTarget.elements.namedItem('panNo') as HTMLInputElement).value.toUpperCase(),
                      aadhaarNumber: (e.currentTarget.elements.namedItem('aadhaarNo') as HTMLInputElement).value,
                      dob: (e.currentTarget.elements.namedItem('dobVal') as HTMLInputElement).value,
                      kycStatus: 'submitted'
                    });
                    if (success) {
                      setAlertModal({
                        title: 'KYC Details Submitted',
                        message: 'Your KYC credentials have been submitted successfully!',
                        onConfirm: () => {
                          window.location.reload();
                        }
                      });
                    }
                  }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>PAN Card Number *</label>
                        <input name="panNo" required maxLength={10} placeholder="e.g. ABCDE1234F" defaultValue={matchedClient?.panNumber || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '13px', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>Aadhaar Number *</label>
                        <input name="aadhaarNo" required maxLength={12} placeholder="e.g. 123456789012" defaultValue={matchedClient?.aadhaarNumber || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '13px', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>Date of Birth *</label>
                        <input name="dobVal" type="date" required defaultValue={matchedClient?.dob ? (typeof matchedClient.dob === 'string' ? matchedClient.dob.split('T')[0] : new Date(matchedClient.dob).toISOString().split('T')[0]) : ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '13px', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                      <Button type="submit" variant="primary" style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}>
                        Submit KYC & Complete Profile
                      </Button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </Card>
        </div>
      ) : (
        // Subscribed layouts
        <>
          {isAlgo ? (
            // Subscribed Algo client layout
            <>
              {/* Stats and Live TOTP Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                
                {/* Today's P&L Card */}
                <Card hoverable style={{
                  background: totalPnl >= 0 
                    ? 'linear-gradient(135deg, var(--bg-card) 0%, rgba(34, 197, 94, 0.03) 100%)' 
                    : 'linear-gradient(135deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.03) 100%)',
                  padding: '24px',
                  borderRadius: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Total P&L
                      </p>
                      <h3 style={{
                        fontSize: '28px',
                        fontWeight: 800,
                        marginTop: '12px',
                        color: totalPnl >= 0 ? 'var(--accent)' : 'var(--danger)',
                        fontFamily: 'var(--font-title)',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '4px'
                      }}>
                        {totalPnl >= 0 ? `+₹${totalPnl.toFixed(2)}` : `-₹${Math.abs(totalPnl).toFixed(2)}`}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {totalPnl >= 0 ? (
                          <>
                            <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
                            <span style={{ color: 'var(--accent-dark)', fontWeight: 600 }}>Positive breakout day</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown size={14} style={{ color: 'var(--danger)' }} />
                            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Engine auto-risk managed</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div style={{
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: totalPnl >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: totalPnl >= 0 ? 'var(--accent-dark)' : 'var(--danger)'
                    }}>
                      {totalPnl >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    </div>
                  </div>
                </Card>

                {/* Zerodha Balance Card */}
                <Card hoverable style={{ padding: '24px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Zerodha Live Balance
                      </p>
                      <h3 style={{
                        fontSize: '28px',
                        fontWeight: 800,
                        marginTop: '12px',
                        color: 'var(--text-heading)',
                        fontFamily: 'var(--font-title)'
                      }}>
                        ₹{(liveMargin !== null ? liveMargin : capital).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} style={{ color: 'var(--accent)' }} />
                        <span>Live balance fetched successfully</span>
                      </p>
                    </div>
                    <div style={{
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(18, 82, 171, 0.1)',
                      color: 'var(--primary)'
                    }}>
                      <Wallet size={24} />
                    </div>
                  </div>
                </Card>

                {/* Zerodha Live TOTP Card with SVG circular animation */}
                {matchedClient?.zerodhaTotpSecret && (
                  <Card hoverable style={{ padding: '24px', borderRadius: '16px', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Zerodha Live TOTP
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                          <h3 style={{
                            fontSize: '32px',
                            fontWeight: 800,
                            color: 'var(--text-heading)',
                            fontFamily: 'monospace',
                            letterSpacing: '4px',
                            margin: 0
                          }}>
                            {totpCode}
                          </h3>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: countdown <= 5 ? 'var(--danger)' : 'var(--accent)',
                            display: 'inline-block'
                          }} />
                          <span>Autorefreshing rolling key</span>
                        </p>
                      </div>

                      {/* Animated Circular Progress for TOTP Countdown */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative' }}>
                        <div style={{ position: 'relative', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="48" height="48" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
                            {/* Background Circle */}
                            <circle cx="24" cy="24" r="18" fill="transparent" stroke="var(--border-light)" strokeWidth="3" />
                            {/* Progress Circle */}
                            <circle
                              cx="24"
                              cy="24"
                              r="18"
                              fill="transparent"
                              stroke={countdown <= 5 ? 'var(--danger)' : 'var(--primary)'}
                              strokeWidth="3.5"
                              strokeDasharray={2 * Math.PI * 18}
                              strokeDashoffset={2 * Math.PI * 18 * (1 - countdown / 30)}
                              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
                            />
                          </svg>
                          <span style={{
                            position: 'absolute',
                            width: '48px',
                            textAlign: 'center',
                            fontSize: '11px',
                            fontWeight: 800,
                            color: countdown <= 5 ? 'var(--danger)' : 'var(--text-heading)',
                            top: '50%',
                            transform: 'translateY(-50%)'
                          }}>
                            {countdown}s
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Main content grid */}
              <div className="client-grid-main" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px', alignItems: 'start' }}>
                
                {/* Performance Graph */}
                <Card style={{ padding: '24px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', margin: 0 }}>
                        P&L Overview
                      </h3>
                      {chartDateRangeStr && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', fontWeight: 500 }}>
                          {chartDateRangeStr}
                        </p>
                      )}
                    </div>

                    {/* Time Period Dropdown Select */}
                    <div style={{ width: 'auto', flexShrink: 0 }}>
                      <select
                        value={performancePeriod}
                        onChange={(e) => setPerformancePeriod(e.target.value as any)}
                        style={{
                          width: 'auto',
                          minWidth: '115px',
                          fontSize: '12px',
                          color: 'var(--text-heading)',
                          fontWeight: 600,
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ width: '100%' }}>
                    <PerformanceChart
                      data={clientPnlData}
                      labels={clientPnlLabels}
                      strokeColor="var(--primary)"
                      fillColorStart="rgba(18, 82, 171, 0.12)"
                      fillColorEnd="rgba(18, 82, 171, 0)"
                      height={290}
                      onBarClick={(idx, label) => setSelectedBarModal({ index: idx, label })}
                    />
                  </div>
                </Card>

                {/* Right Side Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignSelf: 'start' }}>
                  
                  {/* Single P&L Summary Card with Filter (Today, Week, Month, Year) */}
                  <Card style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'flex-start' }}>
                    {/* Card Header & Filter Pills */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TrendingUp size={16} />
                        </div>
                        P&L Summary
                      </h4>
                      <select
                        value={cardPnlFilter}
                        onChange={(e) => setCardPnlFilter(e.target.value as any)}
                        style={{
                          width: 'auto',
                          minWidth: '100px',
                          fontSize: '12px',
                          color: 'var(--text-heading)',
                          fontWeight: 600,
                          padding: '5px 10px',
                          borderRadius: '8px',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="today">Today</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                      </select>
                    </div>

                    {/* Hero P&L Display Banner */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(16, 185, 129, 0.05) 100%)',
                      padding: '16px 18px',
                      borderRadius: '12px',
                      border: '1px solid rgba(37, 99, 235, 0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                        {cardPnlFilter.toUpperCase()} REALIZED P&L
                      </span>
                      <h2 style={{ fontSize: '26px', fontWeight: 800, color: cardFilteredPnl.pnlVal >= 0 ? '#10b981' : '#ef4444', fontFamily: 'var(--font-title)', margin: '2px 0 0 0' }}>
                        {cardFilteredPnl.pnlVal >= 0 ? '+₹' : '-₹'}{Math.abs(cardFilteredPnl.pnlVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </h2>

                      {/* Win Accuracy Bar */}
                      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Period Win Accuracy</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{cardWinAccuracy}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ width: `${cardWinAccuracy}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '99px', transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Subscription card */}
                  <Card style={{ padding: '18px', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                      Active Subscription
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(18, 82, 171, 0.02) 0%, rgba(18, 82, 171, 0.08) 100%)',
                        border: '1px solid rgba(18, 82, 171, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <span style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                            Active Plan Name
                          </span>
                          <h4 style={{ fontSize: '16px', fontWeight: 800, marginTop: '2px', color: 'var(--primary)' }}>
                            {activePlanName}
                          </h4>
                        </div>
                        <span className="badge badge-green" style={{ boxShadow: '0 2px 8px rgba(34, 197, 94, 0.1)' }}>
                          Active
                        </span>
                      </div>

                      {queuedSubs.length > 0 && (
                        <div style={{
                          padding: '12px',
                          borderRadius: '12px',
                          border: '1px dashed rgba(18, 82, 171, 0.3)',
                          backgroundColor: 'rgba(18, 82, 171, 0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Shield size={10} /> Upcoming Queued Plan
                          </span>
                          {queuedSubs.map((sub: any) => (
                            <div key={sub.id} style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600 }}>{sub.plan?.name}</span>
                              <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 700, background: 'var(--primary-light)', padding: '2px 6px', borderRadius: '10px' }}>
                                Starts {formatDate(sub.startDate)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '2px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <PlayCircle size={13} style={{ color: 'var(--text-subtle)' }} /> Start Date:
                          </span>
                          <strong style={{ color: 'var(--text-heading)' }}>{startDateStr}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={13} style={{ color: 'var(--text-subtle)' }} /> Expiry Date:
                          </span>
                          <strong style={{ color: 'var(--text-heading)' }}>{endDateStr}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Activity size={13} style={{ color: 'var(--text-subtle)' }} /> Kite Connection:
                          </span>
                          <strong>
                            {matchedClient?.accessToken ? (
                              <span style={{ color: 'var(--accent-dark)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--accent)' }} /> Connected
                              </span>
                            ) : matchedClient?.zerodhaApiKey ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: 600 }}>Expired</span>
                                <button
                                  onClick={() => {
                                    if (typeof window !== 'undefined' && matchedClient?.zerodhaApiKey) {
                                      window.location.href = KiteClient.getLoginUrl(matchedClient.zerodhaApiKey, matchedClient.id);
                                    }
                                  }}
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '5px',
                                    backgroundColor: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    boxShadow: '0 2px 4px rgba(18, 82, 171, 0.15)'
                                  }}
                                >
                                  <RefreshCw size={9} /> Reconnect
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--danger)' }}>Disconnected</span>
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Zerodha details card */}
                  {showZerodhaConnect && matchedClient?.zerodhaClientId && (
                    <Card style={{ padding: '18px', borderRadius: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                        Zerodha Demat Account
                      </h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Key size={13} style={{ color: 'var(--text-subtle)' }} /> Client ID:
                          </span>
                          <strong style={{ color: 'var(--text-heading)' }}>{matchedClient.zerodhaClientId}</strong>
                        </div>
                        
                        {zerodhaSession ? (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <User size={13} style={{ color: 'var(--text-subtle)' }} /> Account Holder:
                              </span>
                              <strong style={{ color: 'var(--text-heading)' }}>{zerodhaSession.user_name || 'N/A'}</strong>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Mail size={13} style={{ color: 'var(--text-subtle)' }} /> Email:
                              </span>
                              <strong style={{ wordBreak: 'break-all', marginLeft: '12px', textAlign: 'right', color: 'var(--text-heading)' }}>
                                {zerodhaSession.email || 'N/A'}
                              </strong>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '2px' }}>
                              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ShieldCheck size={13} style={{ color: 'var(--text-subtle)' }} /> Broker:
                              </span>
                              <strong style={{ color: 'var(--text-heading)' }}>{zerodhaSession.broker || 'Zerodha'}</strong>
                            </div>
                          </>
                        ) : (
                          <div style={{
                            padding: '10px',
                            borderRadius: '8px',
                            backgroundColor: '#fee2e2',
                            color: '#ef4444',
                            fontSize: '12px',
                            textAlign: 'center',
                            fontWeight: 600,
                            marginTop: '2px'
                          }}>
                            ⚠️ Session disconnected. Please reconnect your account.
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              </div>

              {/* Client Trades List Table */}
              <Card style={{ padding: '24px', borderRadius: '16px', marginTop: '8px' }}>
                <div style={{ marginBottom: '20px' }} className="trades-header-wrap">
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', margin: 0 }}>
                    My Executed Trades
                  </h3>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Qty</th>
                        <th>Entry Time</th>
                        <th>Entry Price</th>
                        <th>Exit Time</th>
                        <th>Exit Price</th>
                        <th>P&L (₹)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientTrades.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '14px' }}>
                            No trades executed today. The engine is active and waiting for system breakout signals.
                          </td>
                        </tr>
                      ) : (
                        paginatedTrades.map((trade) => {
                          const pnlVal = Number(trade.pnl || 0);
                          const rawStatus = (trade.status || 'EXECUTED').toUpperCase();
                          const isProfit = pnlVal > 0 || rawStatus.includes('TARGET') || rawStatus === 'PROFIT';
                          const isLoss = pnlVal < 0 || rawStatus.includes('SL') || rawStatus === 'LOSS';

                          const displayStatus = isProfit ? 'PROFIT' : isLoss ? 'LOSS' : rawStatus;

                          let statusColor = '#4f46e5';
                          if (isProfit) {
                            statusColor = '#10b981';
                          } else if (isLoss) {
                            statusColor = '#ef4444';
                          } else if (displayStatus === 'CANCELLED') {
                            statusColor = '#6b7280';
                          } else if (displayStatus === 'REJECTED' || displayStatus === 'FAILED') {
                            statusColor = '#d97706';
                          } else if (displayStatus === 'OPEN') {
                            statusColor = '#0284c7';
                          }

                          return (
                            <tr key={trade.id}>
                              <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                                {trade.symbol}
                              </td>
                              <td style={{ fontWeight: 500 }}>{trade.quantity}</td>
                              <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                                {formatDateTime(trade.entryTime)}
                              </td>
                              <td style={{ fontWeight: 500 }}>₹{Number(trade.entryPrice || 0).toFixed(2)}</td>
                              <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                                {formatDateTime(trade.exitTime)}
                              </td>
                              <td style={{ fontWeight: 500 }}>
                                {trade.exitPrice ? `₹${Number(trade.exitPrice).toFixed(2)}` : '--'}
                              </td>
                              <td style={{
                                fontWeight: 700,
                                fontSize: '13px',
                                color: pnlVal > 0 ? '#10b981' : pnlVal < 0 ? '#ef4444' : '#000000'
                              }}>
                                {pnlVal > 0 ? `+₹${pnlVal.toFixed(2)}` : pnlVal < 0 ? `-₹${Math.abs(pnlVal).toFixed(2)}` : `₹0.00`}
                              </td>
                              <td style={{ fontWeight: 700, fontSize: '12.5px', letterSpacing: '0.3px' }}>
                                <span style={{ color: statusColor }}>
                                  {displayStatus}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls matching Live Trades 1:1 */}
                {totalTradesCount > 0 && (
                  <div className="pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                    <div className="pagination-info">
                      Showing <span style={{ fontWeight: 600 }}>{startIndex + 1}</span> to{' '}
                      <span style={{ fontWeight: 600 }}>{Math.min(startIndex + pageSize, totalTradesCount)}</span> of{' '}
                      <span style={{ fontWeight: 600 }}>{totalTradesCount}</span> trades
                    </div>
                    <div className="pagination-controls">
                      <button className="pagination-btn" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1} title="Previous Page">
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        if (totalPages > 7 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                          if (pageNum === 2 && currentPage > 3) return <span key="ellipsis-start" style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>;
                          if (pageNum === totalPages - 1 && currentPage < totalPages - 2) return <span key="ellipsis-end" style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>;
                          return null;
                        }
                        return (
                          <button key={pageNum} className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                            onClick={() => setCurrentPage(pageNum)}>
                            {pageNum}
                          </button>
                        );
                      })}
                      <button className="pagination-btn" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages} title="Next Page">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </>
          ) : (
            // Subscribed Scanner / non-Algo client layout (Hides Zerodha/graph/trades, shows spreadsheet button)
            <div className="client-grid-main" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px', alignItems: 'start' }}>
              
              {/* Premium Scanner Sheet Redirect Card */}
              <Card style={{
                padding: '36px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(18, 82, 171, 0.04) 100%)',
                border: '1px solid var(--border-light)'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(18, 82, 171, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px'
                }}>
                  <TrendingUp size={28} />
                </div>
                
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', marginBottom: '12px' }}>
                  Premium Market Scanner Workspace
                </h2>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px', maxWidth: '600px' }}>
                  Welcome to your momentum scanning platform. Access live signals, multi-indicator filters, and real-time gap breakout scans directly in your dedicated spreadsheet workspace.
                </p>
                
                <a
                  href="https://docs.google.com/spreadsheets/d/1NtcJiesrNTcYQLL3cr76f1aI5M-TuZijsXJPmnOCdC8/edit?gid=0#gid=0"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 28px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(18, 82, 171, 0.25)',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  Open Scanner Spreadsheet <ExternalLink size={16} />
                </a>
              </Card>

              {/* Subscription details card (keeps layout balanced and shows plan metadata) */}
              <Card style={{ padding: '24px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                  Active Subscription
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(18, 82, 171, 0.02) 0%, rgba(18, 82, 171, 0.08) 100%)',
                    border: '1px solid rgba(18, 82, 171, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                        Active Plan Name
                      </span>
                      <h4 style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px', color: 'var(--primary)' }}>
                        {activePlanName}
                      </h4>
                    </div>
                    <span className="badge badge-green">Active</span>
                  </div>

                  {queuedSubs.length > 0 && (
                    <div style={{
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px dashed rgba(18, 82, 171, 0.3)',
                      backgroundColor: 'rgba(18, 82, 171, 0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Shield size={11} /> Upcoming Queued Plan
                      </span>
                      {queuedSubs.map((sub: any) => (
                        <div key={sub.id} style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600 }}>{sub.plan?.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, background: 'var(--primary-light)', padding: '2px 8px', borderRadius: '12px' }}>
                            Starts {formatDate(sub.startDate)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px 2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PlayCircle size={14} style={{ color: 'var(--text-subtle)' }} /> Start Date:
                      </span>
                      <strong style={{ color: 'var(--text-heading)' }}>{startDateStr}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} style={{ color: 'var(--text-subtle)' }} /> Expiry Date:
                      </span>
                      <strong style={{ color: 'var(--text-heading)' }}>{endDateStr}</strong>
                    </div>
                  </div>
                </div>
              </Card>

            </div>
          )}
        </>
      )}
      {personalModalOpen && (
        <Modal
          isOpen={personalModalOpen}
          onClose={() => setPersonalModalOpen(false)}
          title="Update Personal Profile Details"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              <Button
                variant="secondary"
                onClick={() => setPersonalModalOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handlePersonalSubmit}
                disabled={personalSubmitting || !nameVal || !emailVal}
                type="button"
              >
                {personalSubmitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Enter your full name"
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border)',
                  fontSize: '14px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="Enter email address"
                value={emailVal}
                onChange={(e) => setEmailVal(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border)',
                  fontSize: '14px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '6px' }}>
                New Password (leave blank to keep unchanged)
              </label>
              <input
                type="password"
                placeholder="Enter new password (optional)"
                value={passVal}
                onChange={(e) => setPassVal(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border)',
                  fontSize: '14px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
        </Modal>
      )}

      {kycModalOpen && (
        <Modal
          isOpen={kycModalOpen}
          onClose={() => setKycModalOpen(false)}
          title="Submit KYC Verification Request"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              <Button
                variant="secondary"
                onClick={() => setKycModalOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleKycSubmit}
                disabled={kycSubmitting || !panVal || !aadhaarVal || !dobVal}
                type="button"
              >
                {kycSubmitting ? 'Submitting...' : 'Submit KYC'}
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '6px' }}>
                PAN Card Number
              </label>
              <input
                type="text"
                required
                placeholder="Enter 10-digit PAN (e.g. ABCDE1234F)"
                value={panVal}
                onChange={(e) => setPanVal(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border)',
                  fontSize: '14px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-primary)'
                }}
                maxLength={10}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '6px' }}>
                Aadhaar Card Number
              </label>
              <input
                type="text"
                required
                placeholder="Enter 12-digit Aadhaar Number"
                value={aadhaarVal}
                onChange={(e) => setAadhaarVal(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border)',
                  fontSize: '14px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-primary)'
                }}
                maxLength={12}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '6px' }}>
                Date of Birth (DOB)
              </label>
              <input
                type="date"
                required
                value={dobVal}
                onChange={(e) => setDobVal(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border)',
                  fontSize: '14px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
        </Modal>
      )}

      {alertModal && (
        <Modal
          isOpen={!!alertModal}
          onClose={() => setAlertModal(null)}
          title={alertModal.title}
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              {alertModal.onConfirm && (
                <Button
                  variant="secondary"
                  onClick={() => setAlertModal(null)}
                >
                  Cancel
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => {
                  if (alertModal.onConfirm) {
                    alertModal.onConfirm();
                  }
                  setAlertModal(null);
                }}
              >
                {alertModal.onConfirm ? 'Confirm' : 'OK'}
              </Button>
            </div>
          }
        >
          <div>{alertModal.message}</div>
        </Modal>
      )}

      {/* Modal Popup Window for Chart Bar Trade Transactions */}
      {selectedBarModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setSelectedBarModal(null)}
        >
          <div 
            style={{
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '85vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(37,99,235,0.05), rgba(16,185,129,0.04))',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} color="var(--primary)" />
                  Trade Transactions — {selectedBarModal.label}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Showing {displayBarTrades.length} executed trades during this period
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* View Mode Toggle Switch */}
                <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.06)', padding: '3px', borderRadius: '8px', gap: '2px' }}>
                  <button
                    onClick={() => setModalViewMode('list')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: modalViewMode === 'list' ? 'var(--surface)' : 'transparent',
                      color: modalViewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
                      boxShadow: modalViewMode === 'list' ? 'var(--shadow-sm)' : 'none'
                    }}
                  >
                    📋 All Trades List
                  </button>
                  <button
                    onClick={() => setModalViewMode('grouped')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: modalViewMode === 'grouped' ? 'var(--surface)' : 'transparent',
                      color: modalViewMode === 'grouped' ? 'var(--primary)' : 'var(--text-muted)',
                      boxShadow: modalViewMode === 'grouped' ? 'var(--shadow-sm)' : 'none'
                    }}
                  >
                    🧩 Grouped Executions
                  </button>
                </div>

                <button
                  onClick={() => setSelectedBarModal(null)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '16px',
                    fontWeight: 700
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, minHeight: '300px' }}>
              {displayBarTrades.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500 }}>No executed P&L trade transactions recorded for {selectedBarModal.label}.</p>
                </div>
              ) : modalViewMode === 'list' ? (
                /* Uncompressed All Trades List Table */
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)' }}>
                      <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Strategy / Symbol</th>
                      <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Direction</th>
                      <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Qty</th>
                      <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Entry</th>
                      <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Exit</th>
                      <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>P&L (₹)</th>
                      <th style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayBarTrades.map((t: any, idx: number) => {
                      const pnlVal = getTradePnl(t);
                      const isPos = pnlVal >= 0;
                      const isShort = (t.direction || 'LONG').toUpperCase() === 'SHORT';

                      return (
                        <tr key={t.id || idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                            {t.strategyName || t.symbol || 'NIFTY Option'}
                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>
                              ⏰ {new Date(t.createdAt || t.entryTime).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}, {new Date(t.createdAt || t.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: isShort ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                              color: isShort ? '#ef4444' : '#10b981'
                            }}>
                              {isShort ? 'SELL / SHORT' : 'BUY / LONG'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>{t.quantity || 1}</td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>₹{Number(t.entryPrice || 0).toFixed(2)}</td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>₹{Number(t.exitPrice || 0).toFixed(2)}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: isPos ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>
                            {isPos ? `+₹${pnlVal.toFixed(2)}` : `-₹${Math.abs(pnlVal).toFixed(2)}`}
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: isPos ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: isPos ? '#10b981' : '#ef4444'
                            }}>
                              {isPos ? 'PROFIT' : 'LOSS'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                /* Grouped Trades View */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {groupedBarTrades.map((group: any[], gIdx: number) => {
                    const firstTrade = group[0];
                    const groupPnl = group.reduce((acc, t) => acc + getTradePnl(t), 0);
                    const isGroupPos = groupPnl >= 0;
                    const tDate = new Date(firstTrade.createdAt || firstTrade.entryTime);
                    const dateTimeStr = `${tDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}, ${tDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                    return (
                      <div 
                        key={gIdx} 
                        style={{
                          borderRadius: '12px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--surface)',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }}
                      >
                        {/* Group Header */}
                        <div style={{
                          padding: '12px 16px',
                          backgroundColor: 'var(--bg-subtle, #f8fafc)',
                          borderBottom: '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-heading)' }}>
                              {firstTrade.strategyName || firstTrade.symbol || 'NIFTY Strategy'}
                            </span>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)', fontWeight: 600 }}>
                              ⏰ {dateTimeStr}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Execution Net P&L:</span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 800,
                              padding: '3px 10px',
                              borderRadius: '6px',
                              backgroundColor: isGroupPos ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: isGroupPos ? '#10b981' : '#ef4444',
                              whiteSpace: 'nowrap'
                            }}>
                              {isGroupPos ? `+₹${groupPnl.toFixed(2)}` : `-₹${Math.abs(groupPnl).toFixed(2)}`}
                            </span>
                          </div>
                        </div>

                        {/* Legs Table inside Group */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', backgroundColor: 'rgba(0,0,0,0.01)' }}>
                              <th style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>Leg / Direction</th>
                              <th style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>Qty</th>
                              <th style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>Entry Price</th>
                              <th style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>Exit Price</th>
                              <th style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>Leg P&L</th>
                              <th style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.map((t: any, tIdx: number) => {
                              const pnlVal = getTradePnl(t);
                              const isLegPos = pnlVal >= 0;
                              const isShort = (t.direction || 'LONG').toUpperCase() === 'SHORT';
                              return (
                                <tr key={t.id || tIdx} style={{ borderBottom: tIdx === group.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                  <td style={{ padding: '10px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    <span style={{
                                      padding: '3px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      backgroundColor: isShort ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                      color: isShort ? '#ef4444' : '#10b981',
                                      marginRight: '8px'
                                    }}>
                                      {isShort ? 'SELL / SHORT' : 'BUY / LONG'}
                                    </span>
                                    {t.legName && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({t.legName})</span>}
                                  </td>
                                  <td style={{ padding: '10px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>{t.quantity || 1}</td>
                                  <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>₹{Number(t.entryPrice || 0).toFixed(2)}</td>
                                  <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>₹{Number(t.exitPrice || 0).toFixed(2)}</td>
                                  <td style={{ padding: '10px 16px', fontWeight: 700, color: isLegPos ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>
                                    {isLegPos ? `+₹${pnlVal.toFixed(2)}` : `-₹${Math.abs(pnlVal).toFixed(2)}`}
                                  </td>
                                  <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '10px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      backgroundColor: isLegPos ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                      color: isLegPos ? '#10b981' : '#ef4444'
                                    }}>
                                      {isLegPos ? 'PROFIT' : 'LOSS'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-subtle, #f8fafc)'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>
                Total P&L: {' '}
                <span style={{ color: displayBarTrades.reduce((acc, t) => acc + getTradePnl(t), 0) >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                  ₹{displayBarTrades.reduce((acc, t) => acc + getTradePnl(t), 0).toFixed(2)}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .form-span-2 {
          grid-column: span 2;
        }
        @media (max-width: 600px) {
          .form-grid-2 { grid-template-columns: 1fr !important; gap: 16px !important; }
          .form-span-2 { grid-column: span 1 !important; }
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .premium-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .premium-input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          pointer-events: none;
          z-index: 2;
          display: flex;
          align-items: center;
        }
        .premium-input {
          width: 100% !important;
          height: 42px !important;
          padding: 10px 14px 10px 42px !important;
          border-radius: 8px !important;
          border: 1px solid var(--border) !important;
          background-color: var(--surface) !important;
          color: var(--text-primary) !important;
          font-size: 13.5px !important;
          outline: none !important;
          transition: all 0.2s ease !important;
        }
        .premium-input:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
        }

        .client-dashboard { gap: 28px; }
        .client-grid-main { display: grid !important; }

        @media (max-width: 1024px) {
          .client-grid-main { grid-template-columns: 1fr !important; }
          .client-dashboard { gap: 20px !important; }
        }

        @media (max-width: 768px) {
          .client-dashboard { gap: 18px !important; }
          .client-dashboard > div:first-child { padding: 18px !important; }
          .client-dashboard > div:first-child h1 { font-size: 20px !important; }
          .client-dashboard [style*="gap: 24px"] { gap: 16px !important; }
          .trades-header-wrap { margin-bottom: 14px !important; }
        }

        @media (max-width: 640px) {
          .client-dashboard { gap: 14px !important; padding: 6px !important; }
          .client-dashboard > div:first-child { padding: 14px !important; }
          .client-dashboard > div:first-child h1 { font-size: 17px !important; }
          .client-dashboard > div:first-child p { font-size: 12px !important; }
          .client-dashboard h3 { font-size: 20px !important; }
          .client-dashboard h3[style*="font-size: 32px"] { font-size: 24px !important; letter-spacing: 2px !important; }
          .client-dashboard [style*="padding: 24px"][style*="border-radius: 16px"] { padding: 16px !important; }
          .client-dashboard [style*="padding: 32px"] { padding: 20px !important; }
          .client-dashboard [style*="padding: 18px"] { padding: 14px !important; }
          .client-dashboard [style*="padding: 20px"] { padding: 14px !important; }
          .client-dashboard [style*="gap: 24px"] { gap: 14px !important; }
          .client-dashboard [style*="height: 300px"] { height: 200px !important; }
          .client-dashboard h2 { font-size: 18px !important; }
          .client-dashboard h4 { font-size: 14px !important; }
          .client-dashboard table { font-size: 11px !important; }
          .client-dashboard table th,
          .client-dashboard table td { padding: 6px 4px !important; }
          .client-dashboard [style*="gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'"],
          .client-dashboard [style*="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))"] {
            grid-template-columns: 1fr !important;
          }
          .client-dashboard [style*="gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'"],
          .client-dashboard [style*="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))"] {
            grid-template-columns: 1fr !important;
          }
          .horizontal-stepper-wrap {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 4px !important;
            padding: 0 !important;
          }
          .horizontal-stepper-wrap > div {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            flex: 1 !important;
            min-width: 0 !important;
          }
          .horizontal-stepper-wrap > div > div {
            width: 32px !important;
            height: 32px !important;
            font-size: 11px !important;
            border-width: 2px !important;
            line-height: 28px !important;
          }
          .horizontal-stepper-wrap > div > span {
            font-size: 8.5px !important;
            margin-top: 4px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            width: 100% !important;
          }
          .stepper-bg-line {
            display: block !important;
            top: 16px !important;
            left: 20px !important;
            right: 20px !important;
          }
        }
        @media (max-width: 480px) {
          .strategy-card-metrics {
            border-left: none !important;
            padding-left: 0 !important;
            margin-top: 12px !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
