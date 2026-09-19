'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';
import { Card } from '../../../shared/components/views/Card';
import { Loader } from '../../../shared/components/views/Loader';
import { API_ENDPOINTS } from '../../../core/constants';
import { LifeBuoy, Plus, Send, MessageSquare, Clock, Search, User, UserCheck, ChevronRight } from 'lucide-react';
import { Modal } from '../../../shared/components/views/Modal';

// Parse ticket messages safely (JSON array or legacy plain text)
function parseMessages(ticket: any): Array<{ sender: 'user' | 'admin', text: string, timestamp: string }> {
  try {
    const parsed = JSON.parse(ticket.message);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  // Legacy fallback
  const msgs: Array<{ sender: 'user' | 'admin', text: string, timestamp: string }> = [];
  if (ticket.message) msgs.push({ sender: 'user', text: ticket.message, timestamp: ticket.createdAt });
  if (ticket.reply) msgs.push({ sender: 'admin', text: ticket.reply, timestamp: ticket.updatedAt || ticket.createdAt });
  return msgs;
}

export default function ClientSupportPage() {
  const { activeUser } = useAppViewModel();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [category, setCategory] = useState('General');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Chat modal
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('growffiy_logged_in_user_id')) window.location.href = '/login';
    }
  }, []);

  const loadTickets = async () => {
    if (!activeUser) return;
    try {
      const res = await fetch(`${API_ENDPOINTS.SUPPORT_TICKETS}?userId=${activeUser.id}`);
      const data = await res.json();
      if (data.success) setTickets(data.tickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (activeUser) loadTickets(); }, [activeUser]);

  useEffect(() => {
    if (activeTicket) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeTicket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || !subject || !messageText) return;
    setCreating(true);
    setErrorMsg(null);
    try {
      const res = await fetch(API_ENDPOINTS.SUPPORT_TICKETS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser.id, subject, message: messageText, category })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubject(''); setMessageText(''); setShowForm(false);
        loadTickets();
      } else {
        throw new Error(data.error || 'Failed to create ticket.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCreating(false);
    }
  };

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    return (
      t.subject?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    );
  });

  if (loading || !activeUser) {
    return <Loader title="Loading" text="Please wait..." fullscreen={false} />;
  }

  const statusStyle = (s: string) => {
    if (s === 'open') return { bg: 'rgba(239,68,68,0.1)', color: 'var(--danger)' };
    if (s === 'resolved') return { bg: 'rgba(16,185,129,0.1)', color: 'var(--success)' };
    return { bg: 'rgba(245,158,11,0.1)', color: 'var(--warning)' };
  };

  return (
    <div className="page-support" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div className="support-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', margin: 0 }}>Support</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Manage your support tickets.</p>
        </div>
        <button className="support-new-ticket-btn" onClick={() => { setShowForm(true); setErrorMsg(null); }}
          style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {/* New Ticket Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Support Ticket">
        {errorMsg && <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', fontSize: '13px', marginBottom: '14px' }}>{errorMsg}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border)', background: 'var(--bg-white)', color: 'var(--text-heading)', fontSize: '14px', outline: 'none' }}>
            <option value="General">General</option>
            <option value="Tech Support">Technical</option>
            <option value="Billing">Billing</option>
            <option value="Demat Issues">Demat Issues</option>
          </select>
          <input type="text" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border)', background: 'var(--bg-white)', color: 'var(--text-heading)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          <textarea rows={4} placeholder="Describe your issue..." value={messageText} onChange={(e) => setMessageText(e.target.value)} required
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border)', background: 'var(--bg-white)', color: 'var(--text-heading)', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          <button type="submit" disabled={creating}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '14px', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Send size={15} /> {creating ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      </Modal>

      {/* Ticket List */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', margin: 0 }}>
            All Tickets ({filtered.length})
          </h3>
          <div className="support-search-wrap" style={{ position: 'relative', minWidth: '260px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <LifeBuoy size={32} style={{ opacity: 0.4, marginBottom: '10px', display: 'block', margin: '0 auto 10px' }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>No tickets yet.</p>
            <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Click "New Ticket" to get help from our support team.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((t) => {
              const ss = statusStyle(t.status);
              const msgs = parseMessages(t);
              const hasAdminReply = msgs.some(m => m.sender === 'admin');
              const lastMsg = msgs[msgs.length - 1];
              return (
                <div key={t.id} onClick={() => setActiveTicket(t)}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s', background: 'var(--bg-white)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-white)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: hasAdminReply ? 'rgba(16,185,129,0.1)' : 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: hasAdminReply ? 'var(--success)' : 'var(--primary)', flexShrink: 0 }}>
                    <MessageSquare size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', background: 'rgba(14,165,233,0.08)', padding: '2px 7px', borderRadius: '5px' }}>{t.category}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', background: ss.bg, color: ss.color }}>{t.status.toUpperCase()}</span>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</p>
                    {lastMsg && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600 }}>{lastMsg.sender === 'admin' ? '🛡 Support: ' : 'You: '}</span>{lastMsg.text}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <Clock size={11} /> {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Chat Detail Modal */}
      {activeTicket && (
        <Modal isOpen={!!activeTicket} onClose={() => setActiveTicket(null)} title={`Ticket: ${activeTicket.subject}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Ticket info bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', background: 'rgba(14,165,233,0.08)', padding: '2px 8px', borderRadius: '5px' }}>{activeTicket.category}</span>
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>{activeTicket.subject}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', ...statusStyle(activeTicket.status) }}>{activeTicket.status.toUpperCase()}</span>
            </div>

            {/* Chat bubbles */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '16px', minHeight: '200px', maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {parseMessages(activeTicket).map((msg, i) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-start' : 'flex-end', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: isAdmin ? 'var(--success)' : 'var(--primary)' }}>
                      {isAdmin ? <UserCheck size={11} /> : <User size={11} />}
                      <span style={{ fontWeight: 600 }}>{isAdmin ? '🛡 Support Team' : 'You'}</span>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(msg.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{
                      maxWidth: '80%',
                      padding: '12px 16px',
                      borderRadius: isAdmin ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                      backgroundColor: isAdmin ? 'rgba(16,185,129,0.1)' : 'var(--primary)',
                      border: isAdmin ? '1px solid rgba(16,185,129,0.25)' : 'none',
                      color: isAdmin ? '#065f46' : 'white',
                      fontSize: '13.5px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              {parseMessages(activeTicket).length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0' }}>No messages yet.</p>
              )}
              <div ref={chatEndRef} />
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
              {activeTicket.status === 'resolved' ? '✅ This ticket is resolved. Our team will respond to new queries.' : 'Our support team will reply to your queries shortly.'}
            </p>
          </div>
        </Modal>
      )}

      <style>{`
@media (max-width: 1024px) { .page-support { padding: 0 16px; } }
@media (max-width: 768px) { .page-support h1 { font-size: 18px !important; } }
@media (max-width: 640px) {
  .support-header { flex-direction: column; align-items: flex-start !important; gap: 12px; }
  .support-new-ticket-btn { width: 100%; justify-content: center; }
  .support-search-wrap { width: 100% !important; min-width: unset !important; }
}
      `}</style>
    </div>
  );
}
