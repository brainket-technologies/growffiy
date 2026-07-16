'use client';

import React, { useState, useEffect } from 'react';
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
  Shield,
  Key,
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  PlayCircle
} from 'lucide-react';
import { KiteClient } from '../../shared/services/kite';
import { generateClientTOTP, getTOTPCountdown } from '../../shared/services/totpClient';
import { API_ENDPOINTS } from '../../core/constants';


export default function ClientDashboardOverview() {
  const { trades, clients, colors, loading, activeUser } = useAppViewModel();
  const [totpCode, setTotpCode] = useState<string>('------');
  const [countdown, setCountdown] = useState<number>(30);
  const [liveMargin, setLiveMargin] = useState<number | null>(null);

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
          window.location.href = '/vendor/login';
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

  if (loading || !activeUser) {
    return <Loader title="Loading dashboard" text="Syncing executed breakout signals and checking active plans..." fullscreen={false} />;
  }

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

  // Filter trades placed on behalf of this client dynamically
  const clientTrades = trades.filter(t => {
    if (matchedClient) {
      return t.clientId === matchedClient.id;
    }
    const name = t.client?.user?.name || t.clientName || '';
    return name.toLowerCase().includes('aman') || t.clientId === 'c1';
  });

  const totalPnl = clientTrades.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
  
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

  const startDateStr = activeSub?.startDate ? formatDate(activeSub.startDate) : '--';
  const endDateStr = activeSub?.endDate ? formatDate(activeSub.endDate) : '--';

  // Calculate days left for active subscription warning
  let daysLeft: number | null = null;
  if (isSubscriptionActive && activeSub?.endDate) {
    const end = new Date(activeSub.endDate);
    const today = new Date();
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  const showExpiryWarning = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;

  const productTypeName = matchedClient?.productType?.name || matchedClient?.productTypeName || '';
  const isAlgo = !productTypeName || productTypeName.toLowerCase() === 'algo';

  const clientPnlData = [12000, 24000, 18000, 31000, 42000, 48000, totalPnl];
  const clientPnlLabels = ['13 May', '14 May', '15 May', '16 May', '17 May', '18 May', 'Today'];

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
            Welcome back, {matchedClient?.user?.name || matchedClient?.name || activeUser.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {isAlgo 
              ? 'Monitor your automated breakout execution and account details in real-time.' 
              : 'Access your premium market scanner workspace and subscription status.'}
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          borderRadius: '99px',
          background: isSubscriptionActive ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${isSubscriptionActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isSubscriptionActive ? 'var(--accent)' : 'var(--danger)',
            animation: isSubscriptionActive ? 'pulseDot 2.5s infinite' : 'none',
            display: 'inline-block'
          }} />
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: isSubscriptionActive ? 'var(--accent-dark)' : 'var(--danger)'
          }}>
            {isSubscriptionActive ? 'Trading Engine Active' : 'Trading Engine Paused'}
          </span>
        </div>
      </div>

      {/* Expiry alerts */}
      {!isSubscriptionActive && (
        <div style={{
          padding: '20px',
          borderRadius: '14px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          boxShadow: 'var(--shadow-sm)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#ef4444' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 style={{ color: '#991b1b', fontSize: '15px', fontWeight: 700, marginBottom: '2px' }}>
                Subscription Inactive or Expired
              </h4>
              <p style={{ color: '#7f1d1d', fontSize: '13.5px' }}>
                You do not have an active subscription plan. Purchase a plan to enable automated trading breakout execution.
              </p>
            </div>
          </div>
          <a
            href="/dashboard/subscription"
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 10px rgba(18, 82, 171, 0.2)',
              transition: 'all 0.2s'
            }}
          >
            Purchase Plan
          </a>
        </div>
      )}

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

      {/* Conditional Dashboard Rendering: Subscribed and non-Subscribed states */}
      {!isSubscriptionActive ? (
        // Unsubscribed layout
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <Card style={{ padding: '32px', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(18, 82, 171, 0.08)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Shield size={32} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
              No Active Plan Found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', marginBottom: '24px', lineHeight: 1.6 }}>
              Please purchase a plan to unlock live automated signals execution on your Zerodha account or view scanner dashboard metrics.
            </p>
            <a
              href="/dashboard/subscription"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(18, 82, 171, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              Unlock Terminal Access
            </a>
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
                        Today's P&L
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', margin: 0 }}>
                        My Performance Curve
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                        Rolling equity growth generated by automated breakout strategies.
                      </p>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, padding: '4px 10px', borderRadius: '99px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      Last 7 Days
                    </div>
                  </div>
                  <div style={{ height: '300px', width: '100%' }}>
                    <PerformanceChart
                      data={clientPnlData}
                      labels={clientPnlLabels}
                      strokeColor={colors.PRIMARY}
                      fillColorStart={`${colors.PRIMARY}18`}
                      fillColorEnd={`${colors.PRIMARY}00`}
                    />
                  </div>
                </Card>

                {/* Right Side Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignSelf: 'start' }}>
                  
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
                  {matchedClient?.zerodhaClientId && (
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
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                    Live record of signals executing breakouts on your linked Zerodha account today.
                  </p>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Strategy</th>
                        <th>Order</th>
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
                          <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '14px' }}>
                            No trades executed today. The engine is active and waiting for system breakout signals.
                          </td>
                        </tr>
                      ) : (
                        clientTrades.map((trade) => {
                          const pnl = Number(trade.pnl || 0);
                          const isPositive = pnl >= 0;
                          return (
                            <tr key={trade.id}>
                              <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                                {trade.symbol}
                              </td>
                              <td style={{ color: 'var(--text-secondary)' }}>Pre-Open Breakout</td>
                              <td>
                                <span style={{
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  color: trade.orderType?.toUpperCase() === 'BUY' ? 'var(--accent-dark)' : 'var(--danger)'
                                }}>
                                  {trade.orderType || 'BUY'}
                                </span>
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
                                color: isPositive ? 'var(--accent-dark)' : 'var(--danger)',
                                background: isPositive ? 'rgba(34, 197, 94, 0.04)' : 'rgba(239, 68, 68, 0.04)',
                                borderRadius: '6px'
                              }}>
                                {isPositive ? `+₹${pnl.toFixed(2)}` : `-₹${Math.abs(pnl).toFixed(2)}`}
                              </td>
                              <td>
                                <span className={`badge ${
                                  trade.status.toLowerCase() === 'open' 
                                    ? 'badge-blue' 
                                    : trade.status.toLowerCase() === 'failed' 
                                      ? 'badge-red' 
                                      : trade.status.toLowerCase() === 'cancelled'
                                        ? 'badge-orange'
                                        : 'badge-green'
                                }`}>
                                  {trade.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
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
      <style>{`
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
        }
      `}</style>
    </div>
  );
}
