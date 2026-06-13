'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../views/components/Card';
import { ShieldCheck, RefreshCw, Trash2 } from 'lucide-react';
import { Modal } from '../../../views/components/Modal';
import { Button } from '../../../views/components/Button';
import { API_ENDPOINTS } from '../../../lib/constants';
import { api } from '../../../lib/api';

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const executeClearLogs = async () => {
    setIsClearModalOpen(false);
    setLoading(true);
    try {
      await api.delete(API_ENDPOINTS.AUDIT_LOGS);
      localStorage.removeItem('growffiy_audit_logs');
      setAuditLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_ENDPOINTS.AUDIT_LOGS);
      if (res.success) {
        const localLogs = JSON.parse(localStorage.getItem('growffiy_audit_logs') || '[]');
        const apiLogs = res.auditLogs || [];
        
        // Merge and deduplicate by action, details, and type
        const merged = [...localLogs, ...apiLogs].reduce((acc: any[], item: any) => {
          const exists = acc.some(x => 
            x.action === item.action && 
            x.details === item.details && 
            (x.time === item.time || Math.abs(new Date(x.time).getTime() - new Date(item.time).getTime()) < 60000)
          );
          if (!exists) acc.push(item);
          return acc;
        }, []);

        // Sort by time descending
        const sorted = merged.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setAuditLogs(sorted);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      const localLogs = JSON.parse(localStorage.getItem('growffiy_audit_logs') || '[]');
      setAuditLogs(localLogs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setIsClearModalOpen(true)}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--danger)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              opacity: loading ? 0.5 : 1
            }}
          >
            <Trash2 size={14} /> Clear Logs
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
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
              opacity: loading ? 0.5 : 1
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Logs
          </button>
        </div>
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
          {loading && auditLogs.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '36px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Loading audit log records...
            </div>
          ) : auditLogs.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              No system logs recorded.
            </div>
          ) : (
            (() => {
              // Internal React component style block
              const AuditLogList = () => {
                const [expandedLogs, setExpandedLogs] = useState<Record<number, boolean>>({});

                const toggleExpand = (index: number) => {
                  setExpandedLogs(prev => ({ ...prev, [index]: !prev[index] }));
                };

                const parseDetails = (detailsStr: string) => {
                  if (!detailsStr) return { payload: '', result: '', label: '' };
                  const parts = detailsStr.split(' | ');
                  let payload = '';
                  let result = '';
                  let label = '';
                  
                  parts.forEach(part => {
                    if (part.startsWith('Payload: ')) {
                      payload = part.replace('Payload: ', '');
                    } else if (part.startsWith('Response: ')) {
                      result = part.replace('Response: ', '');
                      label = 'Response';
                    } else if (part.startsWith('Error: ')) {
                      result = part.replace('Error: ', '');
                      label = 'Error';
                    }
                  });
                  return { payload, result, label };
                };

                return (
                  <>
                    {auditLogs.map((log, idx) => {
                      const isApiLog = log.action.startsWith('API SUCCESS:') || log.action.startsWith('API ERROR:');
                      const hasPayload = log.details && log.details.includes(' | Payload: ');
                      const isSuccess = log.action.startsWith('API SUCCESS:') || !log.action.startsWith('API ERROR:');
                      const isExpanded = !!expandedLogs[idx];

                      let method = '';
                      let path = '';
                      if (isApiLog) {
                        const cleanAction = log.action.replace('API SUCCESS: ', '').replace('API ERROR: ', '');
                        const actionParts = cleanAction.split(' ');
                        method = actionParts[0];
                        path = actionParts.slice(1).join(' ');
                      }

                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            paddingBottom: '16px',
                            borderBottom: idx !== auditLogs.length - 1 ? '1px solid var(--border-light)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: '280px' }}>
                              {isApiLog ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      color: 'white',
                                      backgroundColor: 
                                        method === 'GET' ? '#3b82f6' : 
                                        method === 'POST' ? '#10b981' : 
                                        method === 'PUT' ? '#f59e0b' : '#ef4444'
                                    }}>{method}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                                      {path}
                                    </span>
                                    <span style={{
                                      fontSize: '9px',
                                      fontWeight: 600,
                                      color: isSuccess ? 'var(--accent-dark)' : 'var(--danger)',
                                      backgroundColor: isSuccess ? 'var(--accent-light)' : 'var(--danger-light)',
                                      padding: '1px 6px',
                                      borderRadius: '4px'
                                    }}>{isSuccess ? 'Success' : 'Failed'}</span>
                                    <button
                                      onClick={() => toggleExpand(idx)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--primary)',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '2px 6px',
                                        textDecoration: 'underline'
                                      }}
                                    >
                                      {isExpanded ? 'Hide Details' : 'Show Details'}
                                    </button>
                                  </div>
                                </div>
                              ) : hasPayload ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{log.action}</p>
                                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    {log.details.split(' | ')[0]}
                                  </p>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <button
                                      onClick={() => toggleExpand(idx)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--primary)',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '0',
                                        textDecoration: 'underline'
                                      }}
                                    >
                                      {isExpanded ? 'Hide Details' : 'Show Details'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{log.action}</p>
                                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    {log.details}
                                  </p>
                                </div>
                              )}
                              
                              <p style={{ fontSize: '10px', color: 'var(--text-subtle)', marginTop: '6px' }}>
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

                          {(isApiLog || hasPayload) && isExpanded && (() => {
                            const { payload, result, label } = parseDetails(log.details);
                            return (
                              <div style={{
                                marginTop: '4px',
                                padding: '12px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                overflowX: 'auto',
                                color: '#334155'
                              }}>
                                <div>
                                  <strong style={{ color: '#64748b' }}>Payload:</strong>
                                  <pre style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '4px' }}>
                                    {payload}
                                  </pre>
                                </div>
                                {result && (
                                  <div>
                                    <strong style={{ color: '#64748b' }}>{label}:</strong>
                                    <pre style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '4px' }}>
                                      {result}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </>
                );
              };

              return <AuditLogList />;
            })()
          )}
        </div>
      </Card>
      {/* Clear Logs Custom Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Clear Audit Logs"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Are you sure you want to clear all system logs? This action is permanent and cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsClearModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={executeClearLogs}>Yes, Clear All Logs</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
