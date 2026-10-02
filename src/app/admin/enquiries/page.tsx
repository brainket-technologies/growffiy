'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../shared/components/views/Card';
import { MessageSquare, RefreshCw, Mail, Phone, Calendar, ClipboardList } from 'lucide-react';
import { api } from '../../../shared/services/api';

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  enquiry: string;
  message: string;
  time: string;
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const fetchEnquiries = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/enquiries?page=${page}&limit=${itemsPerPage}`);
      if (res.success) {
        setEnquiries(res.enquiries || []);
        if (res.pagination) {
          setCurrentPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages);
          setTotalItems(res.pagination.total);
        }
      }
    } catch (error) {
      console.error('Error fetching enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries(currentPage);
  }, [currentPage]);

  const sortedEnquiries = React.useMemo(() => {
    if (!sortKey) return enquiries;
    return [...enquiries].sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortKey === 'time') { aVal = new Date(a.time).getTime() || 0; bVal = new Date(b.time).getTime() || 0; }
      else if (sortKey === 'name') { aVal = a.name || ''; bVal = b.name || ''; }
      else if (sortKey === 'contact') { aVal = a.email || ''; bVal = b.email || ''; }
      else if (sortKey === 'type') { aVal = a.enquiry || ''; bVal = b.enquiry || ''; }
      else if (sortKey === 'message') { aVal = a.message || ''; bVal = b.message || ''; }
      else { aVal = ''; bVal = ''; }
      
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [enquiries, sortKey, sortDir]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            User Enquiries & Leads
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>View consultation requests, questions, and contact details submitted by users.</p>
        </div>
        <div>
          <button
            onClick={() => fetchEnquiries(currentPage)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: '#0e4194',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(14,65,148,0.2)',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#0b3579')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#0e4194')}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Enquiries Panel */}
      <Card style={{ padding: '0px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(14, 165, 233, 0.03)', borderBottom: '1px solid var(--border-color)' }}>
                {[
                  { key: 'time', label: 'Submitted Time' },
                  { key: 'name', label: 'Name' },
                  { key: 'contact', label: 'Contact Details' },
                  { key: 'type', label: 'Enquiry Type' },
                  { key: 'message', label: 'Message / Requirements' }
                ].map(col => {
                  const isActive = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        padding: '16px 24px',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'background 0.15s, color 0.15s',
                        background: isActive ? 'rgba(99,102,241,0.08)' : undefined,
                        color: isActive ? '#6366f1' : 'var(--text-secondary)',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', width: '100%' }}>
                        <span style={{ flex: 1 }}>{col.label}</span>
                        <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style={{ flexShrink: 0, opacity: isActive ? 1 : 0.35 }}>
                          <path d="M4 0L7 4H1L4 0Z" fill={isActive && sortDir === 'asc' ? '#6366f1' : 'rgba(148,163,184,0.8)'}/>
                          <path d="M4 12L1 8H7L4 12Z" fill={isActive && sortDir === 'desc' ? '#6366f1' : 'rgba(148,163,184,0.8)'}/>
                        </svg>
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading && enquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                      <RefreshCw size={20} className="spin" style={{ marginRight: '10px' }} /> Fetching enquiries...
                    </div>
                  </td>
                </tr>
              ) : sortedEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <ClipboardList size={32} style={{ color: '#94a3b8' }} />
                      <span>No enquiries or leads submitted yet.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedEnquiries.map((enquiry) => (
                  <tr key={enquiry.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(14, 165, 233, 0.01)')} onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '18px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={13} style={{ color: '#0e4194' }} />
                        {enquiry.time}
                      </div>
                    </td>
                    <td style={{ padding: '18px 24px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {enquiry.name}
                    </td>
                    <td style={{ padding: '18px 24px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <a href={`mailto:${enquiry.email}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E88FF', textDecoration: 'none' }}>
                          <Mail size={13} />
                          {enquiry.email}
                        </a>
                        <a href={`tel:${enquiry.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', textDecoration: 'none' }}>
                          <Phone size={13} style={{ color: '#16a34a' }} />
                          {enquiry.phone}
                        </a>
                      </div>
                    </td>
                    <td style={{ padding: '18px 24px', fontSize: '13px' }}>
                      <span style={{
                        display: 'inline-flex',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: 'rgba(14, 165, 233, 0.1)',
                        color: '#0052e0',
                        fontWeight: 600,
                        fontSize: '11px'
                      }}>
                        {enquiry.enquiry}
                      </span>
                    </td>
                    <td style={{ padding: '18px 24px', fontSize: '13px', color: 'var(--text-primary)', maxWidth: '300px', wordBreak: 'break-word' }}>
                      {enquiry.message || <em style={{ color: 'var(--text-secondary)' }}>No message provided</em>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: '#fafbfc' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Showing Page {currentPage} of {totalPages} ({totalItems} Enquiries)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                  color: currentPage === 1 ? '#94a3b8' : 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                  color: currentPage === totalPages ? '#94a3b8' : 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
