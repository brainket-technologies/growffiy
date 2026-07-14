'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../../shared/components/views/Card';
import { api } from '../../../../shared/services/api';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { STAFF_MODULE_DEFS, getDefaultPermissions, type StaffModulePermission } from '../../../../core/constants';

export default function AddStaffPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', userId: '', password: '' });
  const [permissions, setPermissions] = useState<StaffModulePermission[]>(getDefaultPermissions());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);

  const togglePerm = (module: string, permission: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.module === module && p.permission === permission ? { ...p, granted: !p.granted } : p
      )
    );
  };

  const toggleAllModule = (module: string) => {
    const related = permissions.filter((p) => p.module === module);
    const allGranted = related.every((p) => p.granted);
    setPermissions((prev) =>
      prev.map((p) => (p.module === module ? { ...p, granted: !allGranted } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const activePerms = permissions.filter((p) => p.granted);
      const res = await api.post('/api/admin/staff', { ...form, permissions: activePerms });
      if (res.success) {
        setSuccess(res.staff);
      } else {
        setError(res.error || 'Failed to create staff');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Link href="/admin/staff" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={18} /></Link>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)' }}>Staff Created</h2>
        </div>
        <Card>
          <div style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-heading)' }}>Staff added successfully!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Share these credentials with the staff member:</p>
            <div className="creds-box" style={{
              display: 'inline-block', textAlign: 'left', backgroundColor: 'var(--surface)',
              padding: '16px 24px', borderRadius: 10, border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: 13, marginBottom: 4, color: 'var(--text-body)' }}><strong>Name:</strong> {success.name}</p>
              <p style={{ fontSize: 13, marginBottom: 4, color: 'var(--text-body)' }}><strong>User ID:</strong> {success.userId}</p>
              <p style={{ fontSize: 13, marginBottom: 4, color: 'var(--text-body)' }}><strong>Password:</strong> {success.password || form.password}</p>
              <p style={{ fontSize: 13, color: 'var(--text-body)' }}><strong>Login URL:</strong> /staff/login</p>
            </div>
            <div className="action-buttons" style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link href="/admin/staff" style={{
                padding: '10px 20px', borderRadius: 8, backgroundColor: 'var(--surface)',
                color: 'var(--text-body)', fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid var(--border)',
              }}>Back to Staff List</Link>
              <Link href={`/admin/staff/${success.id}`} style={{
                padding: '10px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #1252AB, #1d4ed8)',
                color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}>Edit Permissions</Link>
            </div>
          </div>
        </Card>

        <style>{`
@media (max-width: 640px) {
  .page-header h2 { font-size: 18px; }
  .creds-box { padding: 12px 16px !important; }
  .creds-box p { font-size: 12px !important; }
  .action-buttons { flex-direction: column; align-items: stretch; }
  .action-buttons a { text-align: center; }
}
`}</style>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href="/admin/staff" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={18} /></Link>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)' }}>Add Staff Member</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── Staff Details Card ── */}
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--text-heading)' }}>Staff Details</h3>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Full Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Email *</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Mobile</label>
              <input type="text" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="form-input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>User ID *</label>
              <input type="text" required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="form-input" />
            </div>
            <div className="form-grid-full" style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Password *</label>
              <input type="text" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="form-input" />
            </div>
          </div>
        </Card>

        {/* ── Permissions Table Card ── */}
        <Card style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--text-heading)' }}>Module Permissions</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            Enable specific actions per module for this staff member.
          </p>

          <div className="perm-table" style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {/* Table Header */}
            <div className="perm-header" style={{
              display: 'grid',
              gridTemplateColumns: '220px 1fr',
              backgroundColor: 'var(--surface)',
              borderBottom: '2px solid var(--border)',
            }}>
              <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Module
              </div>
              <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Permissions
              </div>
            </div>

            {/* Table Rows */}
            {STAFF_MODULE_DEFS.map((def, idx) => {
              const modulePerms = permissions.filter((p) => p.module === def.key);
              const grantedCount = modulePerms.filter((p) => p.granted).length;
              const allGranted = grantedCount === modulePerms.length;
              const anyGranted = grantedCount > 0;
              const isLast = idx === STAFF_MODULE_DEFS.length - 1;

              return (
                <div
                  key={def.key}
                  className="perm-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '220px 1fr',
                    borderBottom: isLast ? 'none' : '1px solid var(--border-light)',
                    backgroundColor: anyGranted ? 'rgba(18, 82, 171, 0.04)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Module Name Cell */}
                  <div style={{
                    padding: '12px 16px',
                    borderRight: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 4,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: anyGranted ? 'var(--primary)' : 'var(--text-heading)' }}>
                      {def.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {grantedCount}/{modulePerms.length} enabled
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleAllModule(def.key)}
                        style={{
                          fontSize: 10, fontWeight: 600,
                          color: allGranted ? 'var(--danger)' : 'var(--primary)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '1px 6px', borderRadius: 4,
                          backgroundColor: allGranted ? 'rgba(239,68,68,0.08)' : 'rgba(18,82,171,0.08)',
                        }}
                      >
                        {allGranted ? '− All' : '+ All'}
                      </button>
                    </div>
                  </div>

                  {/* Permissions Cell */}
                  <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                    {def.permissions.map((perm) => {
                      const p = permissions.find((x) => x.module === def.key && x.permission === perm.key);
                      const isGranted = p?.granted || false;
                      return (
                        <label
                          key={perm.key}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '5px 11px', borderRadius: 20,
                            border: `1.5px solid ${isGranted ? 'var(--primary)' : 'var(--border)'}`,
                            backgroundColor: isGranted ? 'var(--primary-light)' : 'var(--surface)',
                            cursor: 'pointer', fontSize: 12,
                            fontWeight: isGranted ? 600 : 400,
                            color: isGranted ? 'var(--primary)' : 'var(--text-body)',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap',
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isGranted}
                            onChange={() => togglePerm(def.key, perm.key)}
                            style={{ width: 13, height: 13, cursor: 'pointer', accentColor: 'var(--primary)', margin: 0 }}
                          />
                          {perm.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--danger-light)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: 'var(--danger)', fontSize: 13, marginTop: 16 }}>
            ⚠ {error}
          </div>
        )}

        <div className="action-buttons" style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button type="submit" disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px',
            borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1252AB, #1d4ed8)',
            color: 'white', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            <Save size={16} /> {loading ? 'Creating...' : 'Create Staff'}
          </button>
          <Link href="/admin/staff" style={{
            display: 'flex', alignItems: 'center', padding: '10px 20px', borderRadius: 8,
            border: '1.5px solid var(--border)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>Cancel</Link>
        </div>
      </form>

      <style>{`
@media (max-width: 640px) {
  .page-header h2 { font-size: 18px; }
  .page-header { gap: 8px; }
  .form-grid { grid-template-columns: 1fr !important; }
  .form-grid-full { grid-column: 1 !important; }
  .form-grid label { font-size: 11px !important; }
  .action-buttons { flex-direction: column; }
  .action-buttons button, .action-buttons a { width: 100%; justify-content: center; }
  .perm-table { overflow-x: auto; -webkit-overflow-scrolling: touch; }
}
@media (max-width: 1024px) {
  .perm-header, .perm-row { grid-template-columns: 1fr !important; }
  .perm-header div:first-child, .perm-row > div:first-child { border-right: none !important; border-bottom: 1px solid var(--border-light); }
}
`}</style>
    </div>
  );
}
