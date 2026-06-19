'use client';
import React, { useState } from 'react';
import { Card } from '../views/components/Card';
import { Button } from '../views/components/Button';
import { FlaskConical, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../lib/api';

interface StrategyConfig {
  basicInfo?: any;
  tradeAction?: any;
  stoploss?: any;
  target?: any;
  riskManagement?: any;
  conditions?: any[];
}

export default function StrategyTestPanel({ config }: { config: StrategyConfig }) {
  const [symbol, setSymbol] = useState('TATASTEEL');
  const [ltp, setLtp] = useState('');
  const [candlePrice, setCandlePrice] = useState('');
  const [availableCapital, setAvailableCapital] = useState('50000');
  const [openPositions, setOpenPositions] = useState('0');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const runTest = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const candleType = config.tradeAction?.candlePriceType || 'high';
      const defaultCandle = candleType === 'open' ? '198.00' : candleType === 'high' ? '199.20' : candleType === 'low' ? '197.50' : '198.80';
      const res = await api.post('/api/admin/strategies/test', {
        configJson: JSON.stringify(config),
        mockData: {
          symbol: symbol || 'TATASTEEL',
          ltp: Number(ltp) || 200,
          candlePrice: Number(candlePrice) || Number(defaultCandle),
          availableCapital: Number(availableCapital) || 50000,
          openPositions: Number(openPositions) || 0,
        }
      });
      if (res.success) setResults(res.results);
      else setError(res.error || 'Test failed');
    } catch (err: any) {
      setError(err.message || 'Error running test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <FlaskConical size={14} />
        </div>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Test Strategy</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Static values se simulate karein</span>
      </div>

      <Card style={{ padding: '18px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Symbol</label>
            <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="TATASTEEL" style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>LTP (₹)</label>
            <input type="number" step="0.05" value={ltp} onChange={(e) => setLtp(e.target.value)} placeholder="200.00" style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Candle {config.tradeAction?.candlePriceType || 'high'} (₹)</label>
            <input type="number" step="0.05" value={candlePrice} onChange={(e) => setCandlePrice(e.target.value)} placeholder="199.20" style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Capital (₹)</label>
            <input type="number" value={availableCapital} onChange={(e) => setAvailableCapital(e.target.value)} placeholder="50000" style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Open Positions</label>
            <input type="number" value={openPositions} onChange={(e) => setOpenPositions(e.target.value)} placeholder="0" style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button type="button" variant="primary" onClick={runTest} disabled={loading} style={{ width: '100%', padding: '9px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
              {loading ? 'Testing...' : 'Run Test'}
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: '13px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {results && (
        <Card style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {results.wouldTrade ? <CheckCircle2 size={16} color="#059669" /> : <XCircle size={16} color="#dc2626" />}
            {results.wouldTrade ? 'Trade will EXECUTE' : 'Trade will SKIP'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
            <ResultRow label="Breakout" value={results.breakoutPassed ? '✅ PASS' : '❌ FAIL'} color={results.breakoutPassed ? '#059669' : '#dc2626'} />
            <ResultRow label="Entry Price" value={`₹${results.entryPrice}`} />
            <ResultRow label="SL Points" value={`₹${results.slPoints}`} />
            <ResultRow label="Capital at Risk" value={`₹${results.capitalAtRisk}`} />
            <ResultRow label="Quantity" value={results.quantity.toString()} />
            <ResultRow label="Stop Loss" value={`₹${results.stopLoss}`} />
            <ResultRow label="Target" value={`₹${results.target}`} />
            <ResultRow label="Order Type" value={results.orderType} />
            <ResultRow label="Product" value={results.productType} />
            <ResultRow label="Candle Type" value={results.candleType} />
          </div>
          <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.1)', fontSize: '11px', color: 'var(--text-muted)' }}>
            {results.reasons?.join(' | ')}
          </div>
        </Card>
      )}
    </div>
  );
}

const ResultRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderRadius: '6px', background: 'var(--bg-secondary)', alignItems: 'center' }}>
    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    <span style={{ fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</span>
  </div>
);
