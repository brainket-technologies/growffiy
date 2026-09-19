'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card } from '../../../shared/components/views/Card';
import { Loader } from '../../../shared/components/views/Loader';
import { Modal } from '../../../shared/components/views/Modal';
import { Button } from '../../../shared/components/views/Button';
import { 
  LifeBuoy, MessageSquare, AlertCircle, 
  Send, CheckCircle2, User, Clock, Search, Filter, 
  Eye, Inbox, AlertTriangle, UserCheck
} from 'lucide-react';
import { API_ENDPOINTS } from '../../../core/constants';

// --- Utility: Parse ticket messages safely ---
function parseMessages(ticket: any): Array<{ sender: 'user' | 'admin', text: string, timestamp: string }> {
  try {
    const parsed = JSON.parse(ticket.message);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  // Legacy fallback: convert plain text to message array
  const msgs: Array<{ sender: 'user' | 'admin', text: string, timestamp: string }> = [];
  if (ticket.message) {
    msgs.push({ sender: 'user', text: ticket.message, timestamp: ticket.createdAt });
  }
  if (ticket.reply) {
    msgs.push({ sender: 'admin', text: ticket.reply, timestamp: ticket.updatedAt || ticket.createdAt });
  }
  return msgs;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.SUPPORT_TICKETS}?all=true`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  useEffect(() => {
    if (activeTicket) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeTicket]);

  const handleSendReplyInModal = async (ticketId: string) => {
    if (!replyText || !replyText.trim()) return;

    setSubmittingReply(ticketId);
    try {
      const res = await fetch(API_ENDPOINTS.SUPPORT_TICKETS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, reply: replyText, status: 'resolved' })
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        // Update active ticket locally with the new message
        const updatedTicket = data.ticket;
        setActiveTicket(updatedTicket);
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updatedTicket } : t));
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        setErrorModal({ isOpen: true, message: data.error || 'Failed to submit reply' });
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSubmittingReply(null);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.SUPPORT_TICKETS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        if (activeTicket && activeTicket.id === ticketId) {
          setActiveTicket((prev: any) => prev ? { ...prev, status: newStatus } : null);
        }
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const query = searchQuery.toLowerCase();
    const userName = (t.user?.name || '').toLowerCase();
    const userEmail = (t.user?.email || '').toLowerCase();
    const subject = (t.subject || '').toLowerCase();

    const matchesSearch = userName.includes(query) || userEmail.includes(query) || subject.includes(query);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in-progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
  const categories = Array.from(new Set(tickets.map(t => t.category))).filter(Boolean);

  const statusColor = (status: string) => {
    if (status === 'resolved') return { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--success)' };
    if (status === 'in-progress') return { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--warning)' };
    return { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--danger)' };
  };

  if (loading) {
    return <Loader title="Loading helpdesk" text="Fetching support tickets from all clients..." fullscreen={false} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', letterSpacing: '-0.5px' }}>
          Help & Support Desk
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          View, filter, manage status, and reply to client inquiries.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {[
          { label: 'Total Tickets', value: totalCount, icon: <Inbox size={22} />, color: 'var(--primary)', bg: 'rgba(14,165,233,0.1)', border: 'var(--primary)' },
          { label: 'Open', value: openCount, icon: <AlertTriangle size={22} />, color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)', border: 'var(--danger)' },
          { label: 'In Progress', value: inProgressCount, icon: <Clock size={22} />, color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)', border: 'var(--warning)' },
          { label: 'Resolved', value: resolvedCount, icon: <CheckCircle2 size={22} />, color: 'var(--success)', bg: 'rgba(16,185,129,0.1)', border: 'var(--success)' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: `4px solid ${s.border}` }}>
            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</span>
              <span style={{ fontSize: '22px', fontWeight: 800, color: s.color, fontFamily: 'var(--font-title)' }}>{s.value}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Ticket Table */}
      <Card style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
          <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search by name, email, subject..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '38px', height: '42px', fontSize: '13px', borderRadius: '8px', border: '1.5px solid var(--border)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { value: statusFilter, onChange: setStatusFilter, options: [['all', 'All Statuses'], ['open', '🔴 Open'], ['in-progress', '🟡 In Progress'], ['resolved', '🟢 Resolved']] },
              { value: categoryFilter, onChange: setCategoryFilter, options: [['all', 'All Categories'], ...categories.map((c: any) => [c, c])] },
            ].map((sel, i) => (
              <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Filter size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <select value={sel.value} onChange={(e) => sel.onChange(e.target.value)}
                  style={{ padding: '8px 12px 8px 32px', height: '42px', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--bg-white)', cursor: 'pointer', outline: 'none' }}>
                  {sel.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                {['Client', 'Ticket Details', 'Date', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: i === 4 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <LifeBuoy size={42} style={{ margin: '0 auto 16px', opacity: 0.35, color: 'var(--primary)', display: 'block' }} />
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)' }}>No matching support tickets</p>
                </td></tr>
              ) : filteredTickets.map((t) => {
                const sc = statusColor(t.status);
                // Get first user message for preview
                let previewMsg = t.message;
                try {
                  const parsed = JSON.parse(t.message);
                  if (Array.isArray(parsed) && parsed.length > 0) previewMsg = parsed[0].text;
                } catch {}
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.2s', cursor: 'pointer' }}
                    onClick={() => setActiveTicket(t)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, #1252AB 100%)', color: 'white', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {t.user?.name ? t.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'CL'}
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>{t.user?.name || 'Unknown'}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.user?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', maxWidth: '350px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', backgroundColor: 'rgba(14,165,233,0.08)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(14,165,233,0.15)' }}>{t.category}</span>
                      <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-heading)', margin: '6px 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewMsg}</p>
                    </td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <Clock size={13} /><span>{new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                      <select value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', border: '1px solid transparent', cursor: 'pointer', outline: 'none', backgroundColor: sc.bg, color: sc.text, fontWeight: 700 }}>
                        <option value="open">🔴 Open</option>
                        <option value="in-progress">🟡 In Progress</option>
                        <option value="resolved">🟢 Resolved</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <Button onClick={(e) => { e.stopPropagation(); setActiveTicket(t); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <Eye size={13} /> View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Chat Modal */}
      {activeTicket && (
        <Modal isOpen={!!activeTicket} onClose={() => { setActiveTicket(null); setReplyText(''); }} title={`Ticket: ${activeTicket.subject}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Client Info + Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, #1252AB 100%)', color: 'white', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeTicket.user?.name ? activeTicket.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'CL'}
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>{activeTicket.user?.name || 'Unknown'}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{activeTicket.user?.email}</p>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', backgroundColor: 'rgba(14,165,233,0.08)', padding: '2px 8px', borderRadius: '6px', marginTop: '4px', display: 'inline-block' }}>{activeTicket.category}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Update Status</span>
                <select value={activeTicket.status} onChange={(e) => handleStatusChange(activeTicket.id, e.target.value)}
                  style={{ fontSize: '12px', fontWeight: 700, padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', cursor: 'pointer', backgroundColor: 'var(--bg-white)' }}>
                  <option value="open">🔴 Open</option>
                  <option value="in-progress">🟡 In Progress</option>
                  <option value="resolved">🟢 Resolved</option>
                </select>
              </div>
            </div>

            {/* Chat Area */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '16px', maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {parseMessages(activeTicket).map((msg, i) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: isAdmin ? 'var(--success)' : 'var(--text-muted)' }}>
                      {!isAdmin ? <User size={11} /> : <UserCheck size={11} />}
                      <span style={{ fontWeight: 600 }}>{isAdmin ? 'Admin' : (activeTicket.user?.name || 'Client')}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: isAdmin ? '16px 16px 0 16px' : '16px 16px 16px 0',
                      backgroundColor: isAdmin ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-white)',
                      border: `1px solid ${isAdmin ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
                      color: isAdmin ? '#065f46' : 'var(--text-primary)',
                      fontSize: '13.5px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
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

            {/* Reply Input */}
            <div style={{ borderTop: '1.5px solid var(--border-light)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)' }}>Send Reply (Admin → Client)</span>
              <textarea placeholder="Type your official support response..." rows={3} value={replyText} onChange={(e) => setReplyText(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', fontSize: '13.5px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button variant="secondary" onClick={() => { setActiveTicket(null); setReplyText(''); }}>Close</Button>
                <Button onClick={() => handleSendReplyInModal(activeTicket.id)} disabled={submittingReply === activeTicket.id || !replyText.trim()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Send size={14} />
                  {submittingReply === activeTicket.id ? 'Sending...' : 'Send Reply & Resolve'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {errorModal?.isOpen && (
        <Modal isOpen={errorModal.isOpen} onClose={() => setErrorModal(null)} title="Error">
          <div style={{ padding: '10px 0' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{errorModal.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button onClick={() => setErrorModal(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
