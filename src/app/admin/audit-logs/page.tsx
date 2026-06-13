'use client';

import React from 'react';
import { Card } from '../../../views/components/Card';
import { ShieldCheck, RefreshCw } from 'lucide-react';

export default function AuditLogsPage() {
  const auditLogs = [
    { action: 'Auto Trading Started', user: 'Firoz Mohammad', details: 'Algorithmic terminal engine powered on', time: '13 June 2026, 12:40 PM', type: 'info' },
    { action: 'API Environment Variables Configured', user: 'System Deployer', details: 'Added DATABASE_URL and DIRECT_URL configs', time: '13 June 2026, 12:30 PM', type: 'system' },
    { action: 'Admin Login Successful', user: 'Firoz Mohammad', details: 'Session active from IP 192.168.1.102', time: '13 June 2026, 12:28 PM', type: 'security' },
    { action: 'Client Added', user: 'Firoz Mohammad', details: 'Created client profile for Sumit Joshi', time: '12 June 2026, 04:15 PM', type: 'action' },
    { action: 'Kite Token Refreshed', user: 'Automation Job', details: 'Successfully fetched new Kite session token', time: '12 June 2026, 08:30 AM', type: 'system' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            System Audit Logs
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>View real-time security events, administrator actions, and engine executions.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      {/* Audit Log Timeline */}
      <Card>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
          <ShieldCheck color="var(--primary)" size={20} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Activity Logs History
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {auditLogs.map((log, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: idx !== auditLogs.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}
            >
              <div>
                <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{log.action}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {log.details}
                </p>
                <p style={{ fontSize: '10px', color: 'var(--text-subtle)', marginTop: '4px' }}>
                  Actor: <strong>{log.user}</strong>
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.time}</span>
                <div style={{ marginTop: '6px' }}>
                  <span className={`badge ${
                    log.type === 'security' ? 'badge-red' :
                    log.type === 'system' ? 'badge-blue' :
                    log.type === 'action' ? 'badge-purple' : 'badge-green'
                  }`}>
                    {log.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
