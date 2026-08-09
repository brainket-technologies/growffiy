'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../shared/components/views/Card';
import { Modal } from '../../../shared/components/views/Modal';
import { Button } from '../../../shared/components/views/Button';
import { Star, RefreshCw, Plus, Edit2, Trash2, CheckCircle, XCircle, Search, Filter, MessageSquare, Award } from 'lucide-react';
import { api } from '../../../shared/services/api';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string | null;
  avatar: string | null;
  rating: number;
  stat: string | null;
  text: string;
  status: string;
  createdAt: string;
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Modals Open State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [avatar, setAvatar] = useState('');
  const [rating, setRating] = useState(5);
  const [stat, setStat] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState('active');

  // Fetch Testimonials
  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/testimonials');
      if (res.success || res.testimonials) {
        setTestimonials(res.testimonials || []);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    setRole('');
    setLocation('');
    setAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80');
    setRating(5);
    setStat('+38.4% PnL');
    setText('');
    setStatus('active');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (t: Testimonial) => {
    setEditingId(t.id);
    setName(t.name);
    setRole(t.role);
    setLocation(t.location || '');
    setAvatar(t.avatar || '');
    setRating(t.rating);
    setStat(t.stat || '');
    setText(t.text);
    setStatus(t.status);
    setIsModalOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim() || !role.trim()) {
      alert('Please fill in Name, Role, and Review Text.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = { name, role, location, avatar, rating, stat, text, status };
      if (editingId) {
        await api.put(`/api/admin/testimonials/${editingId}`, payload);
      } else {
        await api.post('/api/admin/testimonials', payload);
      }
      setIsModalOpen(false);
      fetchTestimonials();
    } catch (error: any) {
      console.error('Error saving testimonial:', error);
      alert(error.message || 'Failed to save testimonial');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete testimonial by "${clientName}"?`)) return;

    try {
      await api.delete(`/api/admin/testimonials/${id}`);
      fetchTestimonials();
    } catch (error: any) {
      console.error('Error deleting testimonial:', error);
      alert(error.message || 'Failed to delete testimonial');
    }
  };

  // Quick Toggle Status Handler
  const handleToggleStatus = async (t: Testimonial) => {
    const newStatus = t.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/api/admin/testimonials/${t.id}`, { status: newStatus });
      fetchTestimonials();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  // Filtered List
  const filteredTestimonials = testimonials.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.location && t.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesRating = ratingFilter === 'all' || t.rating === parseInt(ratingFilter, 10);

    return matchesSearch && matchesStatus && matchesRating;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Testimonials & Client Reviews
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage client reviews, ratings, and performance tags displayed on the home page slider.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchTestimonials}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Button onClick={handleOpenAddModal}>
            <Plus size={16} /> Add Testimonial
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card style={{ padding: '24px' }}>
        {/* Search and Filter Bar */}
        <div style={{
          display: 'flex',
          gap: '14px',
          marginBottom: '20px',
          alignItems: 'center',
          background: 'var(--bg-secondary)',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border-light)'
        }}>
          {/* Search Box (Wide & Spacious) */}
          <div style={{ position: 'relative', flex: '1 1 50%', minWidth: '240px' }}>
            <Search size={15} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-subtle)'
            }} />
            <input
              type="text"
              placeholder="Search reviews by client name, role, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontSize: '13px',
                backgroundColor: 'var(--bg-card, #ffffff)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontWeight: 600, flexShrink: 0 }}>
            <Filter size={14} /> Filters:
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              outline: 'none',
              fontSize: '13px',
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              width: '140px',
              flexShrink: 0
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              outline: 'none',
              fontSize: '13px',
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              width: '130px',
              flexShrink: 0
            }}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
          </select>
        </div>

        {/* Table View */}
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client Info</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role &amp; City</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rating &amp; Badge</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Review Text</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && testimonials.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Loading testimonials...
                  </td>
                </tr>
              ) : filteredTestimonials.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    No matching testimonials found.
                  </td>
                </tr>
              ) : (
                filteredTestimonials.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                    {/* Client Info */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={t.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80'}
                          alt={t.name}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1E88FF' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{t.name}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Location */}
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-primary)' }}>
                      <div style={{ fontWeight: 600 }}>{t.role}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.location || 'India'}</div>
                    </td>

                    {/* Rating & Badge */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '6px' }}>
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
                        ))}
                      </div>
                      {t.stat && (
                        <span style={{
                          background: 'rgba(30, 136, 255, 0.1)',
                          color: '#1E88FF',
                          borderRadius: '12px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'inline-block'
                        }}>
                          {t.stat}
                        </span>
                      )}
                    </td>

                    {/* Review Text */}
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '320px' }}>
                      <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{t.text}"
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 20px' }}>
                      <button
                        onClick={() => handleToggleStatus(t)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: 'none',
                          background: t.status === 'active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: t.status === 'active' ? '#10B981' : '#EF4444'
                        }}
                      >
                        {t.status === 'active' ? <CheckCircle size={13} /> : <XCircle size={13} />}
                        {t.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenEditModal(t)}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#1E88FF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Testimonial Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                padding: '10px 18px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
            <Button onClick={handleSubmit} disabled={formLoading}>
              {formLoading ? 'Saving...' : editingId ? 'Update Testimonial' : 'Save Testimonial'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Client Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rajesh Verma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontSize: '13px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Role / Profession *</label>
              <input
                type="text"
                required
                placeholder="e.g. Intraday Trader"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontSize: '13px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Location</label>
              <input
                type="text"
                placeholder="e.g. Mumbai / Delhi"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontSize: '13px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Performance Tag / Stat</label>
              <input
                type="text"
                placeholder="e.g. +38.4% PnL"
                value={stat}
                onChange={(e) => setStat(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontSize: '13px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Avatar Image URL</label>
            <input
              type="text"
              placeholder="https://..."
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontSize: '13px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Star Rating</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontSize: '13px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value={5}>5 Stars (⭐⭐⭐⭐⭐)</option>
                <option value={4}>4 Stars (⭐⭐⭐⭐)</option>
                <option value={3}>3 Stars (⭐⭐⭐)</option>
                <option value={2}>2 Stars (⭐⭐)</option>
                <option value={1}>1 Star (⭐)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontSize: '13px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="active">Active (Show on Home Page)</option>
                <option value="inactive">Inactive (Hide from Home Page)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Review Text *</label>
            <textarea
              required
              rows={4}
              placeholder="Enter client testimonial text..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontSize: '13px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                resize: 'vertical'
              }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
