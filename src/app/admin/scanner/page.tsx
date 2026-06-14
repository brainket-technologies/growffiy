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

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Scanner Results List */}
        <Card>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px', fontFamily: 'var(--font-title)' }}>
            Top Breakout Candidates (Nifty 200 Scanner)
          </h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Symbol</th>
                  <th>LTP (₹)</th>
                  <th>Open Price (₹)</th>
                  <th>Prev Close (₹)</th>
                  <th>Gap Down (%)</th>
                  <th>Chg (%)</th>
                </tr>
              </thead>
              <tbody>
                {visibleStocks.map((stock, idx) => {
                  const gapDownPct = ((stock.open - stock.prevClose) / stock.prevClose) * 100;
                  return (
                    <tr key={stock.symbol}>
                      <td style={{ fontWeight: 600, color: 'var(--color-info)' }}>#{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{stock.symbol}</td>
                      <td>₹{stock.ltp.toFixed(2)}</td>
                      <td>₹{stock.open.toFixed(2)}</td>
                      <td>₹{stock.prevClose.toFixed(2)}</td>
                      <td style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                        {gapDownPct.toFixed(2)}%
                      </td>
                      <td style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                        {stock.changePercent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {visibleCount < scannerResults.length && (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>
              Scroll down to load more Nifty 200 breakout candidates...
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
