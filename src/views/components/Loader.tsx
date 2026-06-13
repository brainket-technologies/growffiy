'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';

interface LoaderProps {
  title?: string;
  text?: string;
  fullscreen?: boolean;
}

export function Loader({ 
  title = 'Authenticating session', 
  text = 'Setting up secure demat workspace and loading analytics...', 
  fullscreen = true 
}: LoaderProps) {
  return (
    <div style={{
      position: fullscreen ? 'fixed' : 'relative',
      top: fullscreen ? 0 : 'auto',
      left: fullscreen ? 0 : 'auto',
      width: fullscreen ? '100vw' : '100%',
      height: fullscreen ? '100vh' : '100%',
      minHeight: fullscreen ? '100vh' : '300px',
      zIndex: fullscreen ? 99999 : 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: fullscreen ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' : 'transparent',
      fontFamily: 'var(--font-body)',
      textAlign: 'center',
      padding: '40px 24px'
    }}>
      <style>{`
        @keyframes loader-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner-outer-ring {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        .spinner-track {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2.5px solid var(--primary-light);
          border-radius: 50%;
          box-sizing: border-box;
        }
        .spinner-arc {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2.5px solid transparent;
          border-top: 2.5px solid var(--primary);
          border-radius: 50%;
          animation: loader-spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          box-sizing: border-box;
        }
        .spinner-center-icon {
          width: 52px;
          height: 52px;
          background-color: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
          box-sizing: border-box;
        }
        .loader-title {
          font-family: var(--font-title);
          font-size: 20px;
          font-weight: 700;
          color: var(--text-heading);
          margin-bottom: 8px;
        }
        .loader-desc {
          font-size: 13px;
          color: var(--text-muted);
          max-width: 320px;
          line-height: 1.5;
        }
      `}</style>
      
      <div className="spinner-outer-ring">
        <div className="spinner-track"></div>
        <div className="spinner-arc"></div>
        <div className="spinner-center-icon">
          <TrendingUp size={24} color="white" strokeWidth={2.5} />
        </div>
      </div>
      
      <h3 className="loader-title">{title}</h3>
      {text && <p className="loader-desc">{text}</p>}
    </div>
  );
}
