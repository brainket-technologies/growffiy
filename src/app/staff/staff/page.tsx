'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../shared/components/views/Card';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { api } from '../../../shared/services/api';
import Link from 'next/link';

export default function StaffListPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/api/admin/staff');
      if (res.success) setStaffList(res.staff || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete staff "${name}"?`)) return;
    try {
      const res = await api.delete(`/api/admin/staff/${id}`);
      if (res.success) fetchStaff();
    } catch (e) {
      console.error(e);
    }
  };

  const [loggedInStaffId, setLoggedInStaffId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('growffiy_logged_in_user_id') || 
                       localStorage.getItem('growffiy_staff_user_id') ||
                       localStorage.getItem('growffiy_logged_in_staff_id');
      console.log("Logged in staff ID determined as:", storedId);
      setLoggedInStaffId(storedId);
    }
  }, []);

  const filtered = staffList.filter((s) => {
    // Hide currently logged-in staff user
    if (loggedInStaffId && s.id === loggedInStaffId) return false;
    
    return s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.userId?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="staff-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Staff Management</h2>
        <Link
          href="/staff/staff/add"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
            borderRadius: 10, background: 'linear-gradient(135deg, #1252AB, #1d4ed8)',
            color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}
        >
          <Plus size={16} /> Add Staff
        </Link>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <div className="staff-search" style={{ position: 'relative', maxWidth: 300 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text" placeholder="Search staff..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8,
                border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none',
              }}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>No staff found.</p>
        ) : (
          <div className="table-responsive"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#64748b' }}>Name</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#64748b' }}>Email</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#64748b' }}>User ID</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#64748b' }}>Status</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#64748b' }}>Modules</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, color: '#64748b' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const grantedPerms = (s.permissions || []).filter((p: any) => p.granted);
                const viewModules: string[] = [...new Set<string>(grantedPerms.map((p: any) => p.module))];
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 500 }}>{s.name}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{s.email}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{s.userId}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                        background: s.status === 'active' ? '#dcfce7' : '#fef2f2',
                        color: s.status === 'active' ? '#16a34a' : '#dc2626',
                      }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {viewModules.length === 0 ? <span style={{ color: '#94a3b8' }}>None</span> :
                          viewModules.slice(0, 3).map((m: string) => (
                            <span key={m} style={{
                              padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                              background: '#e0e7ff', color: '#4338ca',
                            }}>{m}</span>
                          ))
                        }
                        {viewModules.length > 3 && <span style={{ color: '#94a3b8', fontSize: 10 }}>+{viewModules.length - 3}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/staff/staff/${s.id}`} style={{ color: '#1252AB' }}>
                          <Edit2 size={14} />
                        </Link>
                        <button onClick={() => handleDelete(s.id, s.name)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </Card>

      <style>{`
@media (max-width: 640px) {
  .staff-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .staff-header h2 { font-size: 18px; }
  .staff-search { max-width: 100% !important; }
  .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .table-responsive table { font-size: 12px; }
}
@media (max-width: 1024px) {
  .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
}
`}</style>
    </div>
  );
}
