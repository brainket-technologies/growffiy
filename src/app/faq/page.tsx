'use client';

import React, { useEffect, useState } from 'react';
import LegalLayout from '../../shared/components/views/LegalLayout';

interface FaqItem {
  q: string;
  a: string;
}

export default function FAQPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('July 8, 2026');

  useEffect(() => {
    fetch('/api/settings/legal', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.legal_faq_content) {
          try {
            const parsed = JSON.parse(data.settings.legal_faq_content);
            if (Array.isArray(parsed)) {
              setItems(parsed);
            }
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <LegalLayout title="Frequently Asked Questions" lastUpdated={lastUpdated}>
      {!loaded ? (
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Loading...</p>
      ) : items.length === 0 ? (
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>No FAQs available at the moment.</p>
      ) : (
        items.map((item, i) => (
          <div key={i} style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>{item.q}</h3>
            <div style={{ fontSize: '14px', lineHeight: '1.75', color: '#475569' }} dangerouslySetInnerHTML={{ __html: item.a }} />
          </div>
        ))
      )}
    </LegalLayout>
  );
}
