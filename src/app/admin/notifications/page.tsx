'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../shared/components/views/Card';
import { Button } from '../../../shared/components/views/Button';
import { Modal } from '../../../shared/components/views/Modal';
import { Send, Users, CheckCircle, Plus } from 'lucide-react';
import { api } from '../../../shared/services/api';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';

export default function AdminNotificationsPage() {
  const { clients } = useAppViewModel();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState('all'); // 'all' or 'specific'
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/api/admin/notifications');
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!title.trim() || !message.trim()) {
      setErrorMsg('Title and message are required.');
      return;
    }

    if (targetType === 'specific' && selectedUsers.length === 0) {
      setErrorMsg('Please select at least one user.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        broadcast: targetType === 'all',
        userIds: targetType === 'specific' ? selectedUsers : [],
      };

      const res = await api.post('/api/admin/notifications', payload);
      if (res.success) {
        setSuccessMsg(res.message || 'Notification sent successfully!');
        setTitle('');
        setMessage('');
        setSelectedUsers([]);
        setTargetType('all');
        fetchHistory(); // Refresh history
        setIsModalOpen(false);
      } else {
        setErrorMsg(res.error || 'Failed to send notification.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Notifications
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage and view push notifications and alerts.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> New Notification
        </Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Send Notification">
        <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {successMsg && (
            <div style={{ padding: '12px', background: '#ecfdf5', color: '#065f46', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <CheckCircle size={18} /> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div style={{ padding: '12px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Notification Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Market Update, System Maintenance..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontSize: '14px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Message Body</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the notification message..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                outline: 'none',
                fontSize: '14px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                resize: 'vertical'
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Target Audience</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="radio"
                  name="targetType"
                  value="all"
                  checked={targetType === 'all'}
                  onChange={() => setTargetType('all')}
                  style={{ cursor: 'pointer' }}
                />
                Broadcast to All Users
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="radio"
                  name="targetType"
                  value="specific"
                  checked={targetType === 'specific'}
                  onChange={() => setTargetType('specific')}
                  style={{ cursor: 'pointer' }}
                />
                Specific Users
              </label>
            </div>
          </div>

          {targetType === 'specific' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Select Users</label>
              <div style={{ 
                maxHeight: '250px', 
                overflowY: 'auto', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px',
                background: 'var(--bg-secondary)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '10px', textAlign: 'left', width: '40px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedUsers.length === clients.length && clients.length > 0}
                          onChange={(e) => setSelectedUsers(e.target.checked ? clients.map(c => c.userId) : [])}
                        />
                      </th>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Name</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => (
                      <tr key={client.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '10px' }}>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(client.userId)}
                            onChange={() => handleUserToggle(client.userId)}
                          />
                        </td>
                        <td style={{ padding: '10px', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {client.user?.name || client.name}
                        </td>
                        <td style={{ padding: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                          {client.user?.email || client.email}
                        </td>
                      </tr>
                    ))}
                    {clients.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                          No clients found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {selectedUsers.length} user(s) selected
              </div>
            </div>
          )}

          <div style={{ marginTop: '12px' }}>
            <Button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px', justifyContent: 'center' }}>
              {loading ? 'Sending...' : <><Send size={16} /> Send Notification</>}
            </Button>
          </div>
        </form>
      </Modal>
      
      <div style={{ marginTop: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Recent Notifications</h2>
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>User</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Title</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Message</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody id="notifications-table-body">
                {historyLoading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Loading history...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No recent notifications.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item.user?.name || item.user?.email || 'Unknown User'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {item.title}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.body}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          fontWeight: 600,
                          backgroundColor: item.isRead ? '#ecfdf5' : '#fff7ed',
                          color: item.isRead ? '#065f46' : '#9a3412'
                        }}>
                          {item.isRead ? 'Read' : 'Unread'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
