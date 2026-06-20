'use client';

import React, { useEffect, useState } from 'react';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';
import { Card } from '../../../shared/components/views/Card';
import { Loader } from '../../../shared/components/views/Loader';
import { LifeBuoy, Send, CheckCircle2, AlertCircle, MessageSquare, Mail, Phone } from 'lucide-react';
import { API_ENDPOINTS } from '../../../core/constants';

export default function ClientSupportPage() {
  const { colors, activeUser } = useAppViewModel();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [supportEmail, setSupportEmail] = useState('support@growffiy.com');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');
  const [supportTimings, setSupportTimings] = useState('Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)');

  const fetchSettings = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.SETTINGS_PUBLIC);
      const data = await res.json();
      if (data.success) {
        setSupportEmail(data.supportEmail || 'support@growffiy.com');
        setSupportPhone(data.supportPhone || '+91 98765 43210');
        setSupportTimings(data.supportTimings || 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)');
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('growffiy_logged_in_user_id');
      if (!storedId) {
        window.location.href = '/websites/login';
        return;
      }
    }
    fetchSettings();
  }, []);


  const loadTickets = async () => {
    if (!activeUser) return;
    try {
      const res = await fetch(`${API_ENDPOINTS.SUPPORT_TICKETS}?userId=${activeUser.id}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to fetch support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeUser) {
      loadTickets();
    }
  }, [activeUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || !subject || !message) return;

    setCreating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(API_ENDPOINTS.SUPPORT_TICKETS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser.id,
          subject,
          message,
          category
        })
      });
      const data = await res.json();


      if (res.ok && data.success) {
        setSuccessMsg('Support ticket created successfully! We will get back to you soon.');
        setSubject('');
        setMessage('');
        loadTickets();
      } else {
        throw new Error(data.error || 'Failed to submit support ticket.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setCreating(false);
    }
  };

  if (loading || !activeUser) {
    return <Loader title="Loading support desk" text="Connecting to helpdesk queue and fetching tickets..." fullscreen={false} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
          Help & Support Desk
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Get direct technical and billing assistance for your algorithmic trading setup.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Create Ticket & Contact details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: 'var(--font-title)' }}>
              Raise Support Ticket
            </h3>
            {errorMsg && (
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px', fontWeight: 500 }}>
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', fontSize: '13px', marginBottom: '16px', fontWeight: 500 }}>
                {successMsg}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-body)', display: 'block', marginBottom: '6px' }}>Help Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '14px', backgroundColor: 'white' }}
                >
                  <option value="General">General Inquiry</option>
                  <option value="Tech Support">Technical (API/Execution)</option>
                  <option value="Billing">Billing & Subscription</option>
                  <option value="Demat Issues">Demat Link Issues</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-body)', display: 'block', marginBottom: '6px' }}>Subject</label>
                <input
                  type="text"
                  placeholder="Brief summary of the issue..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-body)', display: 'block', marginBottom: '6px' }}>Detailed Message</label>
                <textarea
                  rows={5}
                  placeholder="Explain the issue in detail, including trade symbols or error logs if any..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: creating ? 0.7 : 1
                }}
              >
                <Send size={16} />
                {creating ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </Card>

          <Card>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
              <LifeBuoy color="var(--primary)" size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                Direct Support Info
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Mail size={16} color="var(--text-muted)" />
                <span style={{ fontSize: '14px', color: 'var(--text-body)' }}>{supportEmail}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Phone size={16} color="var(--text-muted)" />
                <span style={{ fontSize: '14px', color: 'var(--text-body)' }}>{supportPhone}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <MessageSquare size={16} color="var(--text-muted)" />
                <span style={{ fontSize: '14px', color: 'var(--text-body)' }}>{supportTimings}</span>
              </div>
            </div>
          </Card>
        </div>


        {/* Ticket List */}
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', fontFamily: 'var(--font-title)' }}>
            My Active & Past Tickets
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                <LifeBuoy size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p>No support tickets raised yet. Need help? Raise a ticket on the left.</p>
              </div>
            ) : (
              tickets.map((t) => (
                <div key={t.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                      {t.category}
                    </span>
                    <span className={`badge ${t.status === 'open' ? 'badge-info' : 'badge-success'}`}>
                      {t.status}
                    </span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '4px' }}>
                      {t.subject}
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-body)' }}>{t.message}</p>
                  </div>

                  {t.reply ? (
                    <div style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #d1fae5', display: 'flex', gap: '10px' }}>
                      <MessageSquare size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>Support Reply:</p>
                        <p style={{ fontSize: '13px', color: '#065f46', marginTop: '2px' }}>{t.reply}</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-subtle)', marginTop: '4px' }}>
                      <AlertCircle size={12} />
                      <span>Waiting for admin reply (Standard SLA: 12hr)</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
