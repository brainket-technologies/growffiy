'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../../../shared/components/views/Card';
import { Loader } from '../../../shared/components/views/Loader';
import { Modal } from '../../../shared/components/views/Modal';
import { Button } from '../../../shared/components/views/Button';
import { 
  LifeBuoy, Mail, Phone, MessageSquare, AlertCircle, 
  Send, CheckCircle2, User, Clock, Search, Filter, 
  Eye, X, Inbox, AlertTriangle, ArrowRight, UserCheck
} from 'lucide-react';
import { API_ENDPOINTS } from '../../../core/constants';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal Detail State
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');

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

  const handleSendReplyInModal = async (ticketId: string) => {
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
        setReplyText('');
        // Close modal and refresh list
        setActiveTicket(null);
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
        // Update local status if modal is open
        if (activeTicket && activeTicket.id === ticketId) {
          setActiveTicket((prev: any) => prev ? { ...prev, status: newStatus } : null);
        }
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  // Filter & Search Logic
  const filteredTickets = tickets.filter(t => {
    const query = searchQuery.toLowerCase();
    const userName = (t.user?.name || '').toLowerCase();
    const userEmail = (t.user?.email || '').toLowerCase();
    const userId = (t.user?.userId || '').toLowerCase();
    const subject = (t.subject || '').toLowerCase();
    const message = (t.message || '').toLowerCase();

    const matchesSearch = 
      userName.includes(query) || 
      userEmail.includes(query) || 
      userId.includes(query) || 
      subject.includes(query) || 
      message.includes(query);

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate Quick Stats
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in-progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  // Unique Categories for dropdown selection filter
  const categories = Array.from(new Set(tickets.map(t => t.category))).filter(Boolean);

  if (loading) {
    return <Loader title="Loading helpdesk" text="Fetching support tickets from all clients..." fullscreen={false} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Page Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', letterSpacing: '-0.5px' }}>
            Help & Support Desk
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            View, filter, manage status, and reply to client technical and general inquiries.
          </p>
        </div>
      </div>

      {/* Live Stats Overview Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <Card style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)' }}>
            <Inbox size={22} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Tickets</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>{totalCount}</span>
          </div>
        </Card>

        <Card style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Open (Unresolved)</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--danger)', fontFamily: 'var(--font-title)' }}>{openCount}</span>
          </div>
        </Card>

        <Card style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            <Clock size={22} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>In Progress</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--warning)', fontFamily: 'var(--font-title)' }}>{inProgressCount}</span>
          </div>
        </Card>

        <Card style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--success)' }}>
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resolved Tickets</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-title)' }}>{resolvedCount}</span>
          </div>
        </Card>
      </div>

      {/* Main Support Workspace Card */}
      <Card style={{ padding: '24px' }}>
        
        {/* Table Search & Filter Bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '16px', 
          marginBottom: '20px', 
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '20px'
        }}>
          {/* Left search */}
          <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by client name, email, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '38px',
                height: '42px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1.5px solid var(--border)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Right filters */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Filter size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  height: '42px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border)',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-white)',
                  cursor: 'pointer',
                  color: 'var(--text-heading)',
                  outline: 'none'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Filter size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  height: '42px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border)',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-white)',
                  cursor: 'pointer',
                  color: 'var(--text-heading)',
                  outline: 'none'
                }}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ticket List in Table Format */}
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ticket Details</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <LifeBuoy size={42} style={{ margin: '0 auto 16px', opacity: 0.35, color: 'var(--primary)', display: 'block' }} />
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)' }}>No matching support tickets found</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Try resetting your filter or search keywords.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr 
                    key={t.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setActiveTicket(t);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafbff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Client Info Column */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '38px', 
                          height: '38px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
                          color: 'white',
                          fontSize: '13px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {t.user?.name ? t.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'CL'}
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>
                            {t.user?.name || 'Unknown User'}
                          </p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            ID: {t.user?.userId || 'N/A'} | {t.user?.email || ''}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Ticket Details Column */}
                    <td style={{ padding: '16px', maxWidth: '350px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 700, 
                          color: 'var(--primary)', 
                          textTransform: 'uppercase', 
                          backgroundColor: 'rgba(14, 165, 233, 0.08)', 
                          padding: '3px 8px', 
                          borderRadius: '6px',
                          border: '1px solid rgba(14, 165, 233, 0.15)'
                        }}>
                          {t.category}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '3px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {t.subject}
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {t.message}
                      </p>
                    </td>

                    {/* Date Column */}
                    <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        style={{
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          border: '1px solid transparent',
                          cursor: 'pointer',
                          outline: 'none',
                          backgroundColor: t.status === 'open' ? 'rgba(239, 68, 68, 0.1)' : t.status === 'resolved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: t.status === 'open' ? 'var(--danger)' : t.status === 'resolved' ? 'var(--success)' : 'var(--warning)',
                          fontWeight: 700,
                        }}
                      >
                        <option value="open">🔴 Open</option>
                        <option value="in-progress">🟡 In Progress</option>
                        <option value="resolved">🟢 Resolved</option>
                      </select>
                    </td>

                    {/* Actions Column */}
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTicket(t);
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                      >
                        <Eye size={13} /> View Ticket
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Ticket Details & Reply Dialog / Modal */}
      {activeTicket && (
        <Modal
          isOpen={!!activeTicket}
          onClose={() => {
            setActiveTicket(null);
            setReplyText('');
          }}
          title={`Support Ticket: ${activeTicket.subject}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header Details Panel */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Client Requestor</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', marginTop: '2px' }}>
                  {activeTicket.user?.name || 'Unknown Client'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {activeTicket.user?.email || ''}
                </p>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Update Status</span>
                <select
                  value={activeTicket.status}
                  onChange={(e) => handleStatusChange(activeTicket.id, e.target.value)}
                  style={{
                    marginTop: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    outline: 'none',
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-white)'
                  }}
                >
                  <option value="open">🔴 Open</option>
                  <option value="in-progress">🟡 In Progress</option>
                  <option value="resolved">🟢 Resolved</option>
                </select>
              </div>
            </div>

            {/* Conversation Flow */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Client Message bubble */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '85%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <User size={12} />
                  <span>Client Message</span>
                  <span>•</span>
                  <span>{new Date(activeTicket.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ 
                  padding: '16px', 
                  borderRadius: '16px 16px 16px 0', 
                  backgroundColor: 'var(--surface)', 
                  color: 'var(--text-primary)', 
                  fontSize: '13.5px', 
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  border: '1px solid var(--border)'
                }}>
                  {activeTicket.message}
                </div>
              </div>

              {/* Admin reply bubble (if exists) */}
              {activeTicket.reply ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '85%', alignSelf: 'flex-end', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--success)' }}>
                    <UserCheck size={12} />
                    <span style={{ fontWeight: 600 }}>Administrator Reply</span>
                  </div>
                  <div style={{ 
                    padding: '16px', 
                    borderRadius: '16px 16px 0 16px', 
                    backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                    color: 'var(--success-dark)', 
                    fontSize: '13.5px', 
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    {activeTicket.reply}
                  </div>
                </div>
              ) : null}

            </div>

            {/* Reply Input Box */}
            <div style={{ borderTop: '1.5px solid var(--border-light)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)' }}>
                {activeTicket.reply ? 'Send a new reply' : 'Compose Support Response'}
              </span>
              <textarea
                placeholder="Type your official support response here... Sending a reply will automatically resolve this ticket."
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1.5px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    setActiveTicket(null);
                    setReplyText('');
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleSendReplyInModal(activeTicket.id)}
                  disabled={submittingReply === activeTicket.id || !replyText.trim()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Send size={14} />
                  {submittingReply === activeTicket.id ? 'Submitting...' : 'Send Reply & Resolve'}
                </Button>
              </div>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
