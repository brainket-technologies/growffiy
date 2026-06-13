'use client';

import React from 'react';
import { Card } from '../../../views/components/Card';
import { Button } from '../../../views/components/Button';
import { FileText, Download, BarChart2, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const reportsList = [
    { name: 'Daily Trade Log - 13 June', date: '2026-06-13', size: '14.2 KB', type: 'CSV' },
    { name: 'Weekly Performance Report - W23', date: '2026-06-10', size: '124.5 KB', type: 'PDF' },
    { name: 'Monthly Tax P&L Statement - May', date: '2026-06-01', size: '89.1 KB', type: 'PDF' },
    { name: 'Zerodha Order Book Sync - W22', date: '2026-05-28', size: '32.6 KB', type: 'CSV' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          Performance & Audit Reports
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Download statement records, tax reports, and algorithmic order books.</p>
      </div>

      {/* Grid Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Trading Days</p>
              <h3 style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: 'var(--text-primary)' }}>184</h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Calendar size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Profit Factor</p>
              <h3 style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: 'var(--text-primary)' }}>2.14</h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <BarChart2 size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Downloadable Statements */}
      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          Generated Reports File Log
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reportsList.map((rep, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: 'var(--text-secondary)' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{rep.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Date: {rep.date} | File Size: {rep.size} | Type: {rep.type}
                  </p>
                </div>
              </div>
              <Button variant="secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                <Download size={14} /> Download
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
