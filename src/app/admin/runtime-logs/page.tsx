'use client';
import { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../shared/components/views/Modal';
import { Button } from '../../../shared/components/views/Button';

export default function RuntimeLogsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/runtime-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Failed to fetch runtime logs', e);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleClearLogs = async () => {
    try {
      await fetch('/api/admin/runtime-logs', { method: 'DELETE' });
      setLogs([]);
      setIsClearModalOpen(false);
    } catch (e) {
      console.error('Failed to clear logs', e);
    }
  };

  const getLogColor = (line: string) => {
    if (line.includes('[ERROR]')) return '#ff7b72'; // Red for errors
    if (line.includes('[WARN]')) return '#d2a8ff';  // Purple/Yellow for warnings
    if (line.includes('AlgoEngine Scheduler:')) return '#79c0ff'; // Blue for scheduler events
    return '#c9d1d9'; // Default white/grey
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            App Runtime Logs
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Live console output from the backend Node.js server.
          </p>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#0d1117', 
        border: '1px solid #30363d', 
        borderRadius: '12px',
        overflow: 'hidden',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
      }}>
        {/* Terminal Header */}
        <div style={{ 
          backgroundColor: '#161b22', 
          borderBottom: '1px solid #30363d',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
            <span style={{ marginLeft: '12px', color: '#8b949e', fontSize: '13px', fontFamily: 'monospace' }}>
              node-server.log
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#c9d1d9' }}>
              <input 
                type="checkbox" 
                checked={autoScroll} 
                onChange={(e) => setAutoScroll(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Auto-scroll
            </label>
            <button 
              onClick={() => setIsClearModalOpen(true)}
              style={{ color: '#ff7b72', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div 
          ref={terminalRef}
          style={{ 
            flex: 1, 
            padding: '20px', 
            overflowY: 'auto',
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: '13px',
            lineHeight: '1.6',
            backgroundColor: '#0d1117'
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#8b949e', fontStyle: 'italic' }}>Waiting for logs...</div>
          ) : (
            logs.map((line, idx) => (
              <div key={idx} style={{ color: getLogColor(line), whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {line}
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Clear Runtime Logs"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Are you sure you want to clear all runtime logs from the server?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsClearModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleClearLogs}>Clear Logs</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
