'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { Button } from '../../../views/components/Button';
import { Zap, Play, CheckCircle2 } from 'lucide-react';

export default function PreOpenScannerPage() {
  const { scannerResults, isTradingActive, toggleTrading } = useAppViewModel();
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(30);
  const [denom, setDenom] = useState<'lakhs' | 'crores' | 'billions'>('crores');

  // Infinite Scroll Handler
  React.useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 120
      ) {
        setVisibleCount(prev => Math.min(prev + 30, scannerResults.length));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scannerResults.length]);

  const getDenomConfig = () => {
    switch (denom) {
      case 'lakhs':
        return { factor: 100, label: 'Lakhs' };
      case 'billions':
        return { factor: 0.01, label: 'Billions' };
      case 'crores':
      default:
        return { factor: 1, label: 'Crores' };
    }
  };
  const { factor, label } = getDenomConfig();

  const runManualScan = () => {
    setIsScanning(true);
    setScanMessage(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanMessage(`Scanner complete. Selected ${scannerResults[0]?.symbol || 'None'} as trade breakout candidate.`);
    }, 1500);
  };

  const visibleStocks = scannerResults.slice(0, visibleCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Pre-Open Breakout Scanner
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Automated scanner identifying top losers for breakout entry criteria.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={runManualScan} isLoading={isScanning}>
            <Zap size={16} /> Run Scan Now
          </Button>
        </div>
      </div>

      {scanMessage && (
        <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <CheckCircle2 size={18} />
          <span>{scanMessage}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Scanner Results List */}
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-title)', margin: 0 }}>
              Top Breakout Candidates (Nifty 200 Scanner)
            </h3>
            
            {/* Change Denomination Options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              <span>Change denomination</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input type="radio" name="denom" value="lakhs" checked={denom === 'lakhs'} onChange={() => setDenom('lakhs')} style={{ cursor: 'pointer' }} />
                Lakhs
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input type="radio" name="denom" value="crores" checked={denom === 'crores'} onChange={() => setDenom('crores')} style={{ cursor: 'pointer' }} />
                Crores
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input type="radio" name="denom" value="billions" checked={denom === 'billions'} onChange={() => setDenom('billions')} style={{ cursor: 'pointer' }} />
                Billions
              </label>
            </div>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1100px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-light)', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>SYMBOL</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>PREV. CLOSE</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>IEP</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>CHNG</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>%CHNG</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>FINAL</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>FINAL QUANTITY</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>VALUE (₹ {label})</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>FFM CAP (₹ {label})</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>NM 52W H</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>NM 52W L</th>
                </tr>
              </thead>
              <tbody>
                {visibleStocks.map((stock) => {
                  const chng = stock.iep - stock.prevClose;
                  const isPositive = chng >= 0;
                  const valueVal = (stock.value || 0) * factor;
                  const ffmCapVal = (stock.ffmCap || 0) * factor;

                  return (
                    <tr key={stock.symbol} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ fontWeight: 700, padding: '12px 10px', fontSize: '13px' }}>{stock.symbol}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px' }}>{stock.prevClose.toFixed(2)}</td>
                      <td style={{ fontWeight: 700, padding: '12px 10px', fontSize: '13px' }}>{stock.iep.toFixed(2)}</td>
                      <td style={{ 
                        padding: '12px 10px', 
                        fontSize: '13px', 
                        fontWeight: 600,
                        color: chng === 0 ? '#94a3b8' : isPositive ? '#10b981' : '#ef4444' 
                      }}>
                        {isPositive ? '+' : ''}{chng.toFixed(2)}
                      </td>
                      <td style={{ 
                        padding: '12px 10px', 
                        fontSize: '13px', 
                        fontWeight: 700,
                        color: stock.changePercent === 0 ? '#94a3b8' : isPositive ? '#10b981' : '#ef4444' 
                      }}>
                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </td>
                      <td style={{ fontWeight: 700, padding: '12px 10px', fontSize: '13px' }}>{stock.final.toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px' }}>{(stock.finalQuantity || 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px' }}>{valueVal.toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px' }}>{ffmCapVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px' }}>{(stock.nm52wH || stock.high).toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px' }}>{(stock.nm52wL || stock.low).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {visibleCount < scannerResults.length && (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>
              Scroll down to load more F&O breakout candidates...
            </div>
          )}
        </Card>

        {/* Strategy Parameters */}
        <Card>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', fontFamily: 'var(--font-title)' }}>
            Breakout Rules
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Scanner Filter</p>
              <p style={{ color: 'var(--text-secondary)' }}>Identify stocks with maximum Gap Down open inside Nifty 200.</p>
            </div>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Signal Entry</p>
              <p style={{ color: 'var(--text-secondary)' }}>Buy SLM above the 5-Minute high candle with +0.1% buffer.</p>
            </div>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Stop Loss</p>
              <p style={{ color: 'var(--text-secondary)' }}>Hard stop loss set at -0.5% below Entry Price.</p>
            </div>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Target</p>
              <p style={{ color: 'var(--text-secondary)' }}>Target set at +1.5% profit, matching a 1:3 Risk/Reward ratio.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
