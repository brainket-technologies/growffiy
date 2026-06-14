'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../../../views/components/Card';
import { Loader } from '../../../views/components/Loader';
import { LifeBuoy, Mail, Phone, MessageSquare, AlertCircle, Send, CheckCircle2, User, Clock } from 'lucide-react';
import { API_ENDPOINTS } from '../../../lib/constants';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  const [replies, setReplies] = useState<{ [key: string]: string }>({});

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

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSendReply = async (ticketId: string) => {
    const replyText = replies[ticketId];
    if (!replyText || !replyText.trim()) return;

    setSubmittingReply(ticketId);
    try {
      const res = await fetch(API_ENDPOINTS.SUPPORT_TICKETS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          reply: replyText,
          status: 'resolved'
        })
      });
      const data = await res.json();
      if (data.success) {
        setReplies(prev => ({ ...prev, [ticketId]: '' }));
        fetchTickets();
      } else {
        alert(data.error || 'Failed to submit reply');
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
        body: JSON.stringify({
          ticketId,
          status: newStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  if (loading) {
    return <Loader title="Loading helpdesk" text="Fetching support tickets from all clients..." fullscreen={false} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          Help & Support Desk
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>View, manage, and reply to customer support tickets raised by clients.</p>
      </div>

      {/* Support Tickets Feed - Full Width */}
      <Card>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
          Active Client Tickets ({tickets.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
              <LifeBuoy size={40} style={{ marginBottom: '16px', opacity: 0.4, color: 'var(--primary)' }} />
              <p style={{ fontSize: '15px', fontWeight: 500 }}>All quiet! No support tickets raised yet.</p>
            </div>
          ) : (
            tickets.map((t) => (
              <div 
                key={t.id} 
                style={{ 
                  padding: '20px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Top Row: User Details, Category, Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <User size={16} />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {t.user?.name || 'Unknown User'}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        ID: {t.user?.userId || 'N/A'} | {t.user?.email || ''}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', backgroundColor: 'rgba(14, 165, 233, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                      {t.category}
                    </span>
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: t.status === 'open' ? '#fee2e2' : t.status === 'resolved' ? '#d1fae5' : '#fef3c7',
                        color: t.status === 'open' ? '#991b1b' : t.status === 'resolved' ? '#065f46' : '#78350f',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Middle Row: Subject & Message */}
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    {t.subject}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {t.message}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    <Clock size={12} />
                    <span>Created on: {new Date(t.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Bottom Row: Reply */}
                {t.reply ? (
                  <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #d1fae5', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <MessageSquare size={14} style={{ color: '#059669' }} />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>Administrator Reply:</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#065f46', lineHeight: '1.5' }}>
                      {t.reply}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <textarea
                      placeholder="Type your reply here..."
                      rows={3}
                      value={replies[t.id] || ''}
                      onChange={(e) => setReplies(prev => ({ ...prev, [t.id]: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleSendReply(t.id)}
                        disabled={submittingReply === t.id || !replies[t.id]?.trim()}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          opacity: (submittingReply === t.id || !replies[t.id]?.trim()) ? 0.6 : 1
                        }}
                      >
                        <Send size={12} />
                        {submittingReply === t.id ? 'Sending...' : 'Send Reply & Resolve'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
