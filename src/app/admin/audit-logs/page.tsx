'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../shared/components/views/Card';
import { ShieldCheck, RefreshCw, Trash2 } from 'lucide-react';
import { Modal } from '../../../shared/components/views/Modal';
import { Button } from '../../../shared/components/views/Button';
import { API_ENDPOINTS } from '../../../core/constants';
import { api } from '../../../shared/services/api';

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const itemsPerPage = 10;

  const executeClearLogs = async () => {
    setIsClearModalOpen(false);
    setLoading(true);
    try {
      await api.delete(API_ENDPOINTS.AUDIT_LOGS);
      localStorage.removeItem('growffiy_audit_logs');
      setAuditLogs([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalLogs(0);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (page = 1, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`${API_ENDPOINTS.AUDIT_LOGS}?page=${page}&limit=${itemsPerPage}`);
      if (res.success) {
        setAuditLogs(res.auditLogs || []);
        if (res.pagination) {
          setCurrentPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages);
          setTotalLogs(res.pagination.total);
        }
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      const localLogs = JSON.parse(localStorage.getItem('growffiy_audit_logs') || '[]');
      setAuditLogs(localLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage));
      setTotalLogs(localLogs.length);
      setTotalPages(Math.ceil(localLogs.length / itemsPerPage));
      setCurrentPage(page);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (!isLive || currentPage !== 1) return;
    const interval = setInterval(() => {
      fetchLogs(currentPage, true);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLive, currentPage]);

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
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={isLive}
              onChange={(e) => setIsLive(e.target.checked)}
              style={{
                cursor: 'pointer',
                accentColor: '#58a6ff',
                width: '14px',
                height: '14px'
              }}
            />
            Live Feed (Auto-refresh)
          </label>
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
            onClick={() => fetchLogs()}
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

      {/* Terminal Audit Log View */}
      <div
        style={{
          backgroundColor: '#090d13',
          border: '1px solid #30363d',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Terminal Title Bar */}
        <div
          style={{
            backgroundColor: '#161b22',
            borderBottom: '1px solid #30363d',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56', display: 'inline-block' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e', display: 'inline-block' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f', display: 'inline-block' }} />
            <span
              style={{
                marginLeft: '12px',
                color: '#8b949e',
                fontSize: '12px',
                fontFamily: 'monospace',
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}
            >
              growffiy-system-console.log
            </span>
          </div>
          <span style={{ color: '#58a6ff', fontSize: '11px', fontFamily: 'monospace', fontWeight: 600 }}>
            sh - {totalLogs} events
          </span>
        </div>

        {/* Terminal Console Body */}
        <div
          style={{
            padding: '24px',
            fontFamily: "'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'Courier New', monospace",
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#c9d1d9',
            minHeight: '400px',
            maxHeight: '650px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {loading && auditLogs.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#8b949e', gap: '10px' }}>
              <span className="spin" style={{ display: 'inline-block' }}>⚙️</span> Loading console event buffer...
            </div>
          ) : auditLogs.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#8b949e' }}>
              growffiy:~$ [No log records registered in active session buffer]
            </div>
          ) : (
            (() => {
              const AuditLogTerminalList = () => {
                const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

                const toggleExpand = (logKey: string) => {
                  setExpandedLogs(prev => ({ ...prev, [logKey]: !prev[logKey] }));
                };

                const parseDetails = (detailsStr: string) => {
                  if (!detailsStr) return { payload: '', result: '', label: '' };
                  const parts = detailsStr.split(' | ');
                  let payload = '';
                  let result = '';
                  let label = 'Result';
                  
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {auditLogs.map((log, idx) => {
                      const isApiLog = log.action.startsWith('API SUCCESS:') || log.action.startsWith('API ERROR:');
                      const isSuccess = log.action.startsWith('API SUCCESS:') || !log.action.startsWith('API ERROR:');
                      const hasPayload = log.details && log.details.includes(' | Payload: ');
                      const logKey = `${log.time}-${log.action}-${idx}`;
                      const isExpanded = !!expandedLogs[logKey];

                      let method = 'EXEC';
                      let path = log.action;
                      if (isApiLog) {
                        const cleanAction = log.action.replace('API SUCCESS: ', '').replace('API ERROR: ', '');
                        const actionParts = cleanAction.split(' ');
                        method = actionParts[0];
                        path = actionParts.slice(1).join(' ');
                      }

                      // Determine colors based on types and status
                      const timestampColor = '#8b949e';
                      const actorColor = '#58a6ff';
                      const typeColor = 
                        log.type === 'security' ? '#ff7b72' : 
                        log.type === 'system' ? '#7ee787' : '#d2a8ff';
                      
                      const actionColor = 
                        !isSuccess ? '#ff7b72' : 
                        method === 'POST' ? '#79c0ff' : 
                        method === 'DELETE' ? '#ff7b72' : 
                        method === 'PUT' ? '#d2a8ff' : '#a5d6ff';

                      return (
                        <div
                          key={idx}
                          style={{
                            borderBottom: '1px solid #21262d',
                            paddingBottom: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                        >
                          {/* Log Main Title String */}
                          <div
                            onClick={() => (isApiLog || hasPayload) && toggleExpand(logKey)}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              cursor: (isApiLog || hasPayload) ? 'pointer' : 'default',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              transition: 'background-color 0.2s',
                              backgroundColor: isExpanded ? '#161b22' : 'transparent',
                              gap: '12px'
                            }}
                            onMouseEnter={(e) => {
                              if (isApiLog || hasPayload) e.currentTarget.style.backgroundColor = '#161b22';
                            }}
                            onMouseLeave={(e) => {
                              if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                              {/* Timestamp */}
                              <span style={{ color: timestampColor }}>[{log.time}]</span>
                              
                              {/* Type badge */}
                              <span style={{ color: typeColor, fontWeight: 'bold' }}>[{log.type.toUpperCase()}]</span>
                              
                              {/* Actor */}
                              <span style={{ color: actorColor }}>{log.user}:</span>

                              {/* Method Tag if API */}
                              {isApiLog && (
                                <span
                                  style={{
                                    backgroundColor: 
                                      method === 'GET' ? '#1f6feb' : 
                                      method === 'POST' ? '#238636' : 
                                      method === 'PUT' ? '#9e6a03' : '#da3633',
                                    color: 'white',
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {method}
                                </span>
                              )}

                              {/* Action Path / Description */}
                              <span style={{ color: actionColor, fontWeight: 500 }}>
                                {isApiLog ? path : log.action}
                              </span>

                              {/* Success/Failed status */}
                              {!isSuccess && (
                                <span style={{ color: '#ff7b72', fontSize: '11px', fontWeight: 'bold' }}>(FAILED)</span>
                              )}
                              
                              {(isApiLog || hasPayload) && (
                                <span style={{ color: '#8b949e', fontSize: '11px', textDecoration: 'underline', marginLeft: '6px' }}>
                                  {isExpanded ? '[Collapse]' : '[Expand]'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Log ASCII Details Tree */}
                          <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '16px', color: '#8b949e' }}>
                            {/* Details Row */}
                            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                              <span style={{ color: '#30363d', marginRight: '6px' }}>├──</span>
                              <span style={{ color: '#c9d1d9', wordBreak: 'break-all' }}>
                                {hasPayload ? log.details.split(' | ')[0] : log.details}
                              </span>
                            </div>

                            {/* Collapsed/Expanded Inspector Area */}
                            {isExpanded && (isApiLog || hasPayload) ? (
                              (() => {
                                const { payload, result, label } = parseDetails(log.details);
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', marginTop: '2px' }}>
                                    {/* Payload display */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                      <span style={{ color: '#30363d', marginRight: '6px' }}>├──</span>
                                      <span style={{ color: '#8b949e', marginRight: '6px' }}>Payload:</span>
                                      <div
                                        style={{
                                          backgroundColor: '#0d1117',
                                          border: '1px solid #30363d',
                                          borderRadius: '6px',
                                          padding: '8px 12px',
                                          marginTop: '4px',
                                          width: '100%',
                                          fontSize: '12px',
                                          color: '#79c0ff',
                                          whiteSpace: 'pre-wrap',
                                          wordBreak: 'break-all'
                                        }}
                                      >
                                        {payload || '{}'}
                                      </div>
                                    </div>

                                    {/* Response / Error display */}
                                    {result && (
                                      <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '4px' }}>
                                        <span style={{ color: '#30363d', marginRight: '6px' }}>└──</span>
                                        <span style={{ color: label === 'Error' ? '#ff7b72' : '#7ee787', marginRight: '6px' }}>{label}:</span>
                                        <div
                                          style={{
                                            backgroundColor: '#0d1117',
                                            border: '1px solid #30363d',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                            marginTop: '4px',
                                            width: '100%',
                                            fontSize: '12px',
                                            color: label === 'Error' ? '#ff7b72' : '#85e89d',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-all'
                                          }}
                                        >
                                          {result}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            ) : (
                              // Default closed branch terminator
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ color: '#30363d', marginRight: '6px' }}>└──</span>
                                <span style={{ fontSize: '11px', color: '#566270' }}>Event ID: {idx + totalLogs} | Session Buffer OK</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              };

              return <AuditLogTerminalList />;
            })()
          )}
        </div>

        {/* Terminal Status / Pagination Bar */}
        {totalPages > 1 && (
          <div
            style={{
              backgroundColor: '#161b22',
              borderTop: '1px solid #30363d',
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <span style={{ fontSize: '12px', color: '#8b949e', fontFamily: 'monospace' }}>
              Showing <strong style={{ color: '#c9d1d9' }}>{((currentPage - 1) * itemsPerPage) + 1}</strong>-
              <strong style={{ color: '#c9d1d9' }}>{Math.min(currentPage * itemsPerPage, totalLogs)}</strong> of{' '}
              <strong style={{ color: '#c9d1d9' }}>{totalLogs}</strong> events
            </span>
            <div style={{ display: 'flex', gap: '8px', fontFamily: 'monospace' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid #30363d',
                  background: '#21262d',
                  color: currentPage === 1 ? '#484f58' : '#c9d1d9',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                &lt; Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                if (totalPages > 5 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} style={{ padding: '0 4px', color: '#484f58', alignSelf: 'center' }}>...</span>;
                  }
                  return null;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: pageNum === currentPage ? '1px solid #58a6ff' : '1px solid #30363d',
                      background: pageNum === currentPage ? '#1f6feb' : '#21262d',
                      color: '#c9d1d9',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid #30363d',
                  background: '#21262d',
                  color: currentPage === totalPages ? '#484f58' : '#c9d1d9',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next &gt;
              </button>
            </div>
          </div>
        )}
      </div>

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
