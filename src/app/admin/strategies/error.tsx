'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an analytics service
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h2>Something went wrong in the Strategies page!</h2>
      <div style={{ padding: '20px', background: '#fee', border: '1px solid #f00', borderRadius: '8px', color: '#900', margin: '20px 0', wordBreak: 'break-all' }}>
        <strong>Error Message:</strong> {error.message}
        <br/><br/>
        <strong>Digest:</strong> {error.digest || 'N/A'}
        <br/><br/>
        <strong>Stack:</strong> {error.stack || 'N/A'}
      </div>
      <button
        onClick={() => reset()}
        style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Try again
      </button>
    </div>
  );
}
