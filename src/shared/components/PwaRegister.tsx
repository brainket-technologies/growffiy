'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Growffi PWA ServiceWorker registered with scope: ', registration.scope);
        })
        .catch((err) => {
          console.warn('Growffi PWA ServiceWorker registration failed: ', err);
        });
    }
  }, []);

  return null;
}
