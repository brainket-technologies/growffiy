'use client';

import React, { useEffect, useState } from 'react';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';
import { Card } from '../../../shared/components/views/Card';
import { Loader } from '../../../shared/components/views/Loader';
import { API_ENDPOINTS } from '../../../core/constants';
import { LifeBuoy, Plus, Send, X, MessageSquare, Clock, Search } from 'lucide-react';
import { Modal } from '../../../shared/components/views/Modal';

export default function ClientSupportPage() {
  const { activeUser } = useAppViewModel();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('growffiy_logged_in_user_id')) window.location.href = '/vendor/login';
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
        body: JSON.stringify({ userId: activeUser.id, subject, message, category })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Ticket created!');
        setSubject('');
        setMessage('');
        setShowForm(false);
        loadTickets();
      } else {
        throw new Error(data.error || 'Failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCreating(false);
    }
  };

  const filtered = tickets.filter(t =>
    t.subject?.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase()) ||
    t.message?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading || !activeUser) {
    return <Loader title="Loading" text="Please wait..." fullscreen={false} />;
  }

  const statusStyle = (s: string) => {
    if (s === 'open') return { bg: 'var(--danger-light)', color: 'var(--danger)' };
    if (s === 'resolved') return { bg: 'var(--accent-light)', color: 'var(--accent)' };
    return { bg: 'var(--surface)', color: 'var(--text-subtle)' };
  };

  return (
    <div className="page-support" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="support-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', margin: 0 }}>Support</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Manage your support tickets.</p>
        </div>
        <button className="support-new-ticket-btn" onClick={() => { setShowForm(true); setErrorMsg(null); setSuccessMsg(null); }}
          style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> New Ticket
        </button>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Support Ticket">
        {errorMsg && <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '13px', marginBottom: '14px' }}>{errorMsg}</div>}
        {successMsg && <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '13px', marginBottom: '14px' }}>{successMsg}</div>}
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
          <textarea rows={4} placeholder="Describe your issue..." value={message} onChange={(e) => setMessage(e.target.value)} required
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border)', background: 'var(--bg-white)', color: 'var(--text-heading)', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          <button type="submit" disabled={creating}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '14px', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Send size={15} /> {creating ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      </Modal>

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

        <div className="table-responsive">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Category</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Date</th>
                <th>Reply</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                    <LifeBuoy size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>No tickets found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const ss = statusStyle(t.status);
                  return (
                    <tr key={t.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: '4px' }}>{t.category}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{t.subject}</td>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: ss.bg, color: ss.color }}>{t.status}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '12px' }}>
                          <Clock size={11} /> {new Date(t.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        {t.reply ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '12px', fontWeight: 500 }}>
                            <MessageSquare size={12} /> Replied
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)', fontSize: '12px' }}>--</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <style>{`
@media (max-width: 1024px) {
  .page-support { padding: 0 16px; }
}
@media (max-width: 640px) {
  .support-header { flex-direction: column; align-items: flex-start !important; gap: 12px; }
  .support-new-ticket-btn { width: 100%; justify-content: center; }
  .support-search-wrap { width: 100% !important; min-width: unset !important; }
  .table-responsive th:nth-child(1), .table-responsive td:nth-child(1) { display: none; }
  .table-responsive th:nth-child(5), .table-responsive td:nth-child(5) { display: none; }
}
      `}</style>
    </div>
  );
}
