'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: '12px', color: 'var(--text-muted)' }}>
      <RefreshCw size={24} className="spin" />
      <span style={{ fontSize: '15px', fontWeight: 500 }}>Loading...</span>
    </div>
  );
}
