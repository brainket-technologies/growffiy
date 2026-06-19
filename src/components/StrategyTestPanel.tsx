'use client';
import React, { useState } from 'react';
import { Card } from '../views/components/Card';
import { Button } from '../views/components/Button';
import { FlaskConical, Loader2, CheckCircle2, XCircle, Info, Calculator, TrendingUp, Shield, Target, Activity, ArrowRight, AlertTriangle, Zap, GitBranch, Clock, Eye } from 'lucide-react';
import { api } from '../lib/api';

interface StrategyConfig {
  basicInfo?: any;
  tradeAction?: any;
  stoploss?: any;
  target?: any;
  riskManagement?: any;
  conditions?: any[];
}

const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
    {icon}
    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>{title}</span>
    {subtitle && <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>{subtitle}</span>}
  </div>
);

const CalcRow = ({ label, value, formula, color, passed }: { label: string; value: string; formula: string; color?: string; passed?: boolean | null }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '8px 12px', borderRadius: '8px',
    background: passed === true ? 'rgba(5,150,105,0.04)' : passed === false ? 'rgba(239,68,68,0.04)' : 'rgba(99,102,241,0.02)',
    border: passed === true ? '1px solid rgba(5,150,105,0.1)' : passed === false ? '1px solid rgba(239,68,68,0.1)' : '1px solid var(--border-color)'
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
        {passed === true && <CheckCircle2 size={11} color="#059669" />}
        {passed === false && <XCircle size={11} color="#dc2626" />}
        <span style={{ fontSize: '12px', fontWeight: 600, color: color || 'var(--text-primary)' }}>{label}</span>
      </div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.5', fontFamily: 'monospace' }}>{formula}</div>
    </div>
    <div style={{
      fontSize: '13px', fontWeight: 700, marginLeft: '12px', whiteSpace: 'nowrap',
      color: passed === true ? '#059669' : passed === false ? '#dc2626' : 'var(--text-primary)'
    }}>{value}</div>
  </div>
);

const PassBadge = ({ label, passed }: { label: string; passed: boolean }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
    background: passed ? 'rgba(5,150,105,0.06)' : 'rgba(239,68,68,0.06)',
    border: `1px solid ${passed ? 'rgba(5,150,105,0.15)' : 'rgba(239,68,68,0.15)'}`,
    color: passed ? '#059669' : '#dc2626'
  }}>
    {passed ? <CheckCircle2 size={10} /> : <XCircle size={10} />}{label}
  </div>
);

const EngineBadge = ({ label, color = '#6366f1' }: { label: string; color?: string }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '4px',
    background: `${color}0d`, border: `1px solid ${color}1a`,
    fontSize: '9px', fontWeight: 700, color, letterSpacing: '0.3px', textTransform: 'uppercase'
  }}>{label}</div>
);

export default function StrategyTestPanel({ config }: { config: StrategyConfig }) {
  const [symbol, setSymbol] = useState('TATASTEEL');
  const [ltp, setLtp] = useState('');
  const [candlePrice, setCandlePrice] = useState('');
  const [availableCapital, setAvailableCapital] = useState('50000');
  const [dbCapital, setDbCapital] = useState('50000');
  const [openPositions, setOpenPositions] = useState('0');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const bi = config.basicInfo || {};
  const ta = config.tradeAction || {};
  const sl = config.stoploss || {};
  const tg = config.target || {};
  const rm = config.riskManagement || {};
  const conds = config.conditions || [];

  const candleType = ta.candlePriceType || 'high';
  const defaultCandle = candleType === 'open' ? '198.00' : candleType === 'high' ? '199.20' : candleType === 'low' ? '197.50' : '198.80';
  const isLong = ta.action === 'Long' || ta.action === 'Buy';
  const hasPriceAction = conds.some((c: any) => c.indicator === 'Price Action');
  const isSLMarket = ta.orderType === 'SL-Market';

  const runTest = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const res = await api.post('/api/admin/strategies/test', {
        configJson: JSON.stringify(config),
        mockData: {
          symbol: symbol || 'TATASTEEL',
          ltp: Number(ltp) || 200,
          candlePrice: Number(candlePrice) || Number(defaultCandle),
          availableCapital: Number(availableCapital) || 50000,
          dbCapital: Number(dbCapital) || Number(availableCapital) || 50000,
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

  const mockLtp = Number(ltp) || 200;
  const mockCandlePrice = Number(candlePrice) || Number(defaultCandle);
  const cap = Number(availableCapital) || 50000;
  const dbCap = Number(dbCapital) || cap;
  const riskPct = rm.riskPerTrade || 3;
  const slPct = sl.fixedPercent || 1;
  const targetPct = tg.profitPercent || 2;
  const bp = ta.bufferPercent !== undefined && ta.bufferPercent > 0 ? ta.bufferPercent : 0;

  const capAtRisk = cap * (riskPct / 100);
  const cappedAtRisk = Math.min(capAtRisk, dbCap);
  const mockSlPts = (() => {
    if (sl.type === 'Fixed Points') return sl.fixedPoints || 10;
    if (sl.type === 'Risk %') return mockCandlePrice * ((sl.riskPercent || 1) / 100);
    return mockCandlePrice * (slPct / 100);
  })();

  const mockBreakout = isSLMarket || !hasPriceAction || mockLtp >= (bp > 0 ? mockCandlePrice * (1 + bp/100) : mockCandlePrice);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 2px 6px rgba(245,158,11,0.2)' }}>
          <FlaskConical size={14} />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Test Strategy</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Static values se engine logic simulate karein</div>
        </div>
      </div>

      {/* Mock Inputs */}
      <Card style={{ padding: '16px 18px' }}>
        <SectionHeader icon={<Info size={12} color="#0ea5e9" />} title="Mock Inputs" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>Symbol</label>
            <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="TATASTEEL" style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>LTP (₹)</label>
            <input type="number" step="0.05" value={ltp} onChange={(e) => setLtp(e.target.value)} placeholder="200.00" style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>Candle {candleType.toUpperCase()} (₹)</label>
            <input type="number" step="0.05" value={candlePrice} onChange={(e) => setCandlePrice(e.target.value)} placeholder={defaultCandle} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>Available Capital (₹)</label>
            <input type="number" value={availableCapital} onChange={(e) => setAvailableCapital(e.target.value)} placeholder="50000" style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>DB Capital Limit (₹)</label>
            <input type="number" value={dbCapital} onChange={(e) => setDbCapital(e.target.value)} placeholder="50000" style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>Open Positions</label>
            <input type="number" value={openPositions} onChange={(e) => setOpenPositions(e.target.value)} placeholder="0" style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button type="button" variant="primary" onClick={runTest} disabled={loading} style={{ width: '100%', padding: '9px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', borderRadius: '8px' }}>
              {loading ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />}
              {loading ? 'Testing...' : 'Run Test'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Engine Formula Preview */}
      <Card style={{ padding: '14px 16px', background: 'rgba(99,102,241,0.02)', border: '1px solid rgba(99,102,241,0.08)' }}>
        <SectionHeader icon={<Calculator size={12} color="#6366f1" />} title="Engine Calculation Preview" subtitle="Jo formula engine actual me use karta hai" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-secondary)' }}>
            <span>capitalAtRisk = {cap} × ({riskPct}/100) = <strong style={{color:'var(--text-primary)'}}>₹{capAtRisk.toFixed(0)}</strong></span>
            <EngineBadge label="riskPerTrade" color="#059669" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-secondary)' }}>
            <span>Cap with DB limit: min({capAtRisk.toFixed(0)}, {dbCap}) = <strong style={{color:'var(--text-primary)'}}>₹{cappedAtRisk.toFixed(0)}</strong></span>
            <EngineBadge label="DB cap" color="#f59e0b" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-secondary)' }}>
            <span>SL Points = {sl.type || 'Fixed %'} → ₹{mockSlPts.toFixed(2)}</span>
            <EngineBadge label={sl.type || 'Fixed %'} color="#dc2626" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-secondary)' }}>
            <span>Qty = floor({cappedAtRisk.toFixed(0)} / {mockSlPts.toFixed(2)}) = <strong style={{color:'var(--text-primary)'}}>{Math.floor(cappedAtRisk / mockSlPts) || 1}</strong></span>
            <EngineBadge label="position sizing" color="#8b5cf6" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-secondary)' }}>
            <span>Breakout = {isSLMarket ? 'SL-Market → auto PASS' : !hasPriceAction ? 'No Price Action → auto PASS' : `${mockLtp} >= ${(bp > 0 ? mockCandlePrice * (1 + bp/100) : mockCandlePrice).toFixed(2)} → ${mockBreakout ? 'PASS' : 'FAIL'}`}</span>
            <EngineBadge label="breakout" color={mockBreakout ? '#059669' : '#dc2626'} />
          </div>
        </div>
      </Card>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: '12px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Overall Verdict */}
          <Card style={{ padding: '16px 18px', border: `1px solid ${results.wouldTrade ? 'rgba(5,150,105,0.2)' : 'rgba(239,68,68,0.2)'}`, background: results.wouldTrade ? 'rgba(5,150,105,0.02)' : 'rgba(239,68,68,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {results.wouldTrade ? <CheckCircle2 size={22} color="#059669" /> : <XCircle size={22} color="#dc2626" />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: results.wouldTrade ? '#059669' : '#dc2626' }}>
                  {results.wouldTrade ? 'TRADE HOGI ✅' : 'TRADE NAHI HOGI ❌'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {results.wouldTrade ? 'Sabhi engine conditions pass — OCO order place hoga' : 'Koi condition fail hui — trade skip hogi'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
              <PassBadge label={`Breakout: ${results.breakoutPassed ? 'PASS' : 'FAIL'}`} passed={results.breakoutPassed} />
              <PassBadge label={`Qty: ${results.quantity || 0}`} passed={(results.quantity || 0) > 0} />
              <PassBadge label={`MaxPos: ${results.openPositions || 0}/${rm.maxOpenPositions || 3}`} passed={(results.openPositions || 0) < (rm.maxOpenPositions || 3)} />
              {results.reasons?.slice(0, 2).map((r: string, i: number) => (
                <span key={i} style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>{r}</span>
              ))}
            </div>
          </Card>

          {/* Decision Chain */}
          <Card style={{ padding: '16px 18px' }}>
            <SectionHeader icon={<GitBranch size={13} color="#6366f1" />} title="Decision Chain — Algo Engine Exact Checks" subtitle="Har condition engine jaisa check karega" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <ChainNode label="Auto-Trade Enabled?" detail="AppSettings me auto_trade_enabled = true" passed={true} isLast={false} />
              <ChainNode label="Trading Day?" detail="Weekday check + holidays + special days" passed={true} isLast={false} />
              <ChainNode label={isSLMarket ? "SL-Market Order → Breakout Auto-PASS" : hasPriceAction ? `Price Action Condition: LTP ${results.currentLtp} ≥ Entry ${results.breakoutEntryPrice}?` : "No Price Action Condition → Breakout Auto-PASS"}
                detail={results.breakoutPassed ? 'Breakout confirmed ✅' : 'Breakout not met ❌'}
                passed={results.breakoutPassed}
                isLast={!results.breakoutPassed}
              />
              {results.breakoutPassed && <>
                <ChainNode label={`Capital at Risk = ₹${results.capitalAtRisk?.toFixed(0)}`}
                  detail={`Available (${(Number(availableCapital)||50000).toLocaleString('en-IN')}) × riskPerTrade (${riskPct}%) = ₹${results.capitalAtRisk?.toFixed(0)}`}
                  passed={results.capitalAtRisk > 0} isLast={results.capitalAtRisk <= 0}
                />
                {results.capitalAtRisk > 0 && <>
                  <ChainNode label={`SL Points = ₹${results.slPoints?.toFixed(2)}`}
                    detail={`${sl.type || 'Fixed %'}: ${slPct}% of entry = ${results.slPoints?.toFixed(2)}`}
                    passed={results.slPoints > 0} isLast={false}
                  />
                  <ChainNode label={`Quantity = ${results.quantity}`}
                    detail={`floor(${results.capitalAtRisk?.toFixed(0)} / ${results.slPoints?.toFixed(2)}) = ${results.quantity}`}
                    passed={(results.quantity || 0) > 0} isLast={(results.quantity || 0) <= 0}
                  />
                  {(results.quantity || 0) > 0 && <>
                    {results.isSLMarket && <ChainNode label="SL-Market: Trigger price setting" detail={`SL trigger @ ₹${results.stopLoss?.toFixed(2)}, entry @ ₹${results.entryPrice?.toFixed(2)}`} passed={true} isLast={false} />}
                    <ChainNode label="OCO Orders → Market par place"
                      detail={`BUY ${results.orderType} + SELL SL-M @ ₹${results.stopLoss?.toFixed(2)} + SELL LIMIT @ ₹${results.target?.toFixed(2)}`}
                      passed={true} isLast={true}
                    />
                  </>}
                </>}
              </>}
            </div>
          </Card>

          {/* Detailed Calculations */}
          <Card style={{ padding: '16px 18px' }}>
            <SectionHeader icon={<Calculator size={13} color="#0ea5e9" />} title="Detailed Calculations — (Exact Engine Formulas)" subtitle="Har value engine ke formula se" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <CalcRow label="Candle Price" value={`₹${results.candlePrice || '—'}`}
                formula={`${results.candleType || 'high'}.toUpperCase() of first 5m candle (preSelectTime → entryTime)`}
                color="#8b5cf6" passed={null}
              />
              <CalcRow label="Breakout Entry Price" value={`₹${results.breakoutEntryPrice || '—'}`}
                formula={bp > 0 ? `Candle ${results.candleType} (${results.candlePrice}) × (1 + ${bp}/100)` : `Candle ${results.candleType} (${results.candlePrice}) — no buffer`}
                color="#8b5cf6" passed={results.breakoutPassed ?? false}
              />
              <CalcRow label="Breakout Check" value={results.breakoutPassed ? 'PASS ✅' : 'FAIL ❌'}
                formula={results.isSLMarket ? `SL-Market order → auto-pass` : !results.hasPriceAction ? `No Price Action condition → auto-pass` : `LTP (${results.currentLtp}) >= Entry (${results.breakoutEntryPrice})`}
                color={results.breakoutPassed ? '#059669' : '#dc2626'} passed={results.breakoutPassed}
              />
              <CalcRow label="SL Points" value={`₹${results.slPoints?.toFixed(2) || '—'}`}
                formula={`${sl.type || 'Fixed %'}: entryPrice (${results.entryPrice?.toFixed(2)}) × ${slPct}% = ₹${results.slPoints?.toFixed(2)}`}
                color="#dc2626" passed={results.slPoints > 0}
              />
              <CalcRow label="Capital at Risk" value={`₹${(results.capitalAtRisk || 0).toFixed(0)}`}
                formula={`Available Capital (${cap.toLocaleString('en-IN')}) × riskPerTrade (${riskPct}%) = ₹${(cap * riskPct/100).toFixed(0)}, capped at DB limit ₹${dbCap.toLocaleString('en-IN')}`}
                color="#059669" passed={results.capitalAtRisk > 0}
              />
              <CalcRow label="Quantity" value={results.quantity?.toString() || '0'}
                formula={`floor(₹${(results.capitalAtRisk || 0).toFixed(0)} / ₹${(results.slPoints || 0).toFixed(2)}) = ${results.quantity || 0}`}
                color="#f59e0b" passed={(results.quantity || 0) > 0}
              />
              {results.misMarginRate && results.misMarginRate > 0 && (
                <CalcRow label="Buying Power Capped" value={results.quantity <= Math.floor(cap / (results.entryPrice * results.misMarginRate)) ? '✅ OK' : '❌ Capped'}
                  formula={`misMarginRate=${results.misMarginRate}: min(qty, floor(${cap} / (${results.entryPrice} × ${results.misMarginRate})))`}
                  color="#f59e0b" passed={null}
                />
              )}
              <CalcRow label="Stop Loss Price" value={`₹${results.stopLoss?.toFixed(2) || '—'}`}
                formula={`Entry (₹${results.entryPrice?.toFixed(2)}) − SL Points (₹${results.slPoints?.toFixed(2)}) = ₹${results.stopLoss?.toFixed(2)}`}
                color="#dc2626" passed={true}
              />
              <CalcRow label="Target Price" value={`₹${results.target?.toFixed(2) || '—'}`}
                formula={tg.type === 'Risk Reward Ratio' ? `Entry (₹${results.entryPrice?.toFixed(2)}) + SL Points (₹${results.slPoints?.toFixed(2)}) × ${tg.riskRewardRatio||2} RR` : `Entry (₹${results.entryPrice?.toFixed(2)}) × (1 + ${targetPct}%)`}
                color="#059669" passed={true}
              />
              <CalcRow label="Order Type" value={results.orderType || 'Market'}
                formula={`Config: ${ta.orderType || 'Market'} | Engine places: Entry (${results.orderType}) + SL-M + LIMIT Target`}
                color="#6366f1" passed={null}
              />
            </div>
          </Card>

          {/* Engine reasons */}
          {results.reasons && results.reasons.length > 0 && (
            <Card style={{ padding: '14px 16px', background: 'rgba(99,102,241,0.02)', border: '1px solid rgba(99,102,241,0.08)' }}>
              <SectionHeader icon={<Info size={12} color="#6366f1" />} title="Engine Decision Summary" subtitle="Jo engine log karega" />
              {results.reasons.map((r: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <ArrowRight size={11} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--text-muted)' }} />
                  <span>{r}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

const ChainNode = ({ label, detail, passed, isLast }: { label: string; detail: string; passed: boolean; isLast: boolean }) => (
  <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px' }}>
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
        background: passed ? 'rgba(5,150,105,0.1)' : 'rgba(239,68,68,0.1)',
        border: `2px solid ${passed ? '#059669' : '#dc2626'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {passed ? <CheckCircle2 size={10} color="#059669" /> : <XCircle size={10} color="#dc2626" />}
      </div>
      {!isLast && <div style={{ width: '1.5px', flex: 1, background: 'var(--border-color)', marginTop: '3px' }} />}
    </div>
    <div style={{ flex: 1, paddingBottom: isLast ? '0' : '8px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: passed ? '#059669' : '#dc2626' }}>{label}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '1px' }}>{detail}</div>
    </div>
  </div>
);
