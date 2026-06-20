'use client';
import React, { useState } from 'react';
import { Card } from './views/Card';
import { Button } from './views/Button';
import { api } from '../services/api';
import { CheckCircle2, XCircle, Info, Calculator, FlaskConical, Loader2, GitBranch, AlertTriangle, ArrowRight } from 'lucide-react';

interface StrategyConfig {
  basicInfo?: any;
  tradeAction?: any;
  stoploss?: any;
  target?: any;
  riskManagement?: any;
  conditions?: any[];
}

const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(226,232,240,0.5)' }}>
    {icon}
    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{title}</span>
    {subtitle && <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: 'auto' }}>{subtitle}</span>}
  </div>
);

const CalcRow = ({ label, value, formula, color, passed }: { label: string; value: string; formula: string; color?: string; passed?: boolean | null }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '8px 12px', borderRadius: '8px',
    background: passed === true ? 'rgba(240,253,244,0.5)' : passed === false ? 'rgba(254,242,242,0.5)' : '#fff',
    border: passed === true ? '1px solid rgba(5,150,105,0.1)' : passed === false ? '1px solid rgba(239,68,68,0.1)' : '1px solid rgba(226,232,240,0.5)'
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
        {passed === true && <CheckCircle2 size={11} color="#059669" />}
        {passed === false && <XCircle size={11} color="#dc2626" />}
        <span style={{ fontSize: '12px', fontWeight: 600, color: color || '#334155' }}>{label}</span>
      </div>
      <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.5', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{formula}</div>
    </div>
    <div style={{
      fontSize: '13px', fontWeight: 700, marginLeft: '12px', whiteSpace: 'nowrap',
      color: passed === true ? '#059669' : passed === false ? '#dc2626' : '#0f172a'
    }}>{value}</div>
  </div>
);

const PassBadge = ({ label, passed }: { label: string; passed: boolean }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
    background: passed ? 'rgba(5,150,105,0.08)' : 'rgba(239,68,68,0.08)',
    border: `1px solid ${passed ? 'rgba(5,150,105,0.18)' : 'rgba(239,68,68,0.18)'}`,
    color: passed ? '#059669' : '#dc2626'
  }}>
    {passed ? <CheckCircle2 size={9} /> : <XCircle size={9} />}{label}
  </div>
);

const EngineTag = ({ label, color = '#1252AB' }: { label: string; color?: string }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '4px',
    background: `${color}0d`, border: `1px solid ${color}1a`,
    fontSize: '8px', fontWeight: 700, color, letterSpacing: '0.3px', textTransform: 'uppercase'
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
  const riskPct = rm.riskPerTrade || 3;
  const slPct = sl.fixedPercent || 1;
  const targetPct = tg.profitPercent || 2;
  const bp = ta.bufferPercent !== undefined && ta.bufferPercent > 0 ? ta.bufferPercent : 0;

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Mock Inputs */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.12)', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
        <SectionHeader icon={<Info size={13} color="#1E88FF" />} title="Mock Inputs" subtitle="Ye values test ke liye use hongi" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <InputField label="Symbol" value={symbol} onChange={setSymbol} placeholder="TATASTEEL" />
          <InputField label={`LTP (₹)`} value={ltp} onChange={setLtp} placeholder="200.00" />
          <InputField label={`Candle ${candleType.toUpperCase()} (₹)`} value={candlePrice} onChange={setCandlePrice} placeholder={defaultCandle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
          <InputField label="Available Capital (₹)" value={availableCapital} onChange={setAvailableCapital} placeholder="50000" />
          <InputField label="DB Capital Limit (₹)" value={dbCapital} onChange={setDbCapital} placeholder="50000" />
          <InputField label="Open Positions" value={openPositions} onChange={setOpenPositions} placeholder="0" />
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button type="button" variant="primary" onClick={runTest} disabled={loading} style={{ width: '100%', padding: '9px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', borderRadius: '8px' }}>
              {loading ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />}
              {loading ? 'Testing...' : 'Run Test'}
            </Button>
          </div>
        </div>
      </div>

      {/* Engine Formula Preview */}
      <div style={{ background: 'linear-gradient(135deg, rgba(18,82,171,0.02), rgba(139,92,246,0.02))', borderRadius: '12px', border: '1px solid rgba(18,82,171,0.08)', padding: '16px 18px' }}>
        <SectionHeader icon={<Calculator size={13} color="#1252AB" />} title="Engine Calculation Preview" subtitle="Jo formula engine actual me use karta hai" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <FormulaLine
            label="capitalAtRisk"
            value={`₹${(cap * riskPct / 100).toFixed(0)}`}
            detail={`${cap.toLocaleString('en-IN')} × (${riskPct}/100), capped at ₹${dbCap.toLocaleString('en-IN')}`}
            color="#059669"
          />
          <FormulaLine
            label="SL Points"
            value={`₹${(sl.type === 'Fixed Points' ? (sl.fixedPoints || 10) : mockCandlePrice * (slPct/100)).toFixed(2)}`}
            detail={`${sl.type || 'Fixed %'}: ${slPct}% of entry (₹${mockCandlePrice.toFixed(2)})`}
            color="#dc2626"
          />
          <FormulaLine
            label="Quantity"
            value={`${Math.floor((cap * riskPct / 100) / ((sl.type === 'Fixed Points' ? (sl.fixedPoints || 10) : mockCandlePrice * (slPct/100)))) || 1}`}
            detail={`floor(₹${(cap * riskPct / 100).toFixed(0)} / ₹${((sl.type === 'Fixed Points' ? (sl.fixedPoints || 10) : mockCandlePrice * (slPct/100))).toFixed(2)})`}
            color="#f59e0b"
          />
          <FormulaLine
            label="Breakout"
            value={isSLMarket ? 'auto PASS' : !hasPriceAction ? 'auto PASS' : `${mockLtp} ≥ ${(bp > 0 ? mockCandlePrice * (1 + bp/100) : mockCandlePrice).toFixed(2)} ?`}
            detail={isSLMarket ? 'SL-Market → auto pass' : !hasPriceAction ? 'No Price Action condition → auto pass' : ''}
            color={isSLMarket || !hasPriceAction || mockLtp >= (bp > 0 ? mockCandlePrice * (1 + bp/100) : mockCandlePrice) ? '#059669' : '#dc2626'}
          />
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(254,242,242,0.5)', border: '1px solid rgba(239,68,68,0.15)', fontSize: '12px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Overall Verdict */}
          <div style={{
            background: results.wouldTrade ? 'rgba(240,253,244,0.5)' : 'rgba(254,242,242,0.5)',
            borderRadius: '12px',
            border: `1px solid ${results.wouldTrade ? 'rgba(5,150,105,0.15)' : 'rgba(239,68,68,0.15)'}`,
            padding: '18px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {results.wouldTrade ? <CheckCircle2 size={24} color="#059669" /> : <XCircle size={24} color="#dc2626" />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: results.wouldTrade ? '#059669' : '#dc2626' }}>
                  {results.wouldTrade ? 'TRADE HOGI ✅' : 'TRADE NAHI HOGI ❌'}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  {results.wouldTrade
                    ? 'Sabhi engine conditions pass — OCO order place hoga'
                    : 'Koi condition fail hui — trade skip hogi'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
              <PassBadge label={`Breakout: ${results.breakoutPassed ? 'PASS' : 'FAIL'}`} passed={results.breakoutPassed} />
              <PassBadge label={`Qty: ${results.quantity || 0}`} passed={(results.quantity || 0) > 0} />
              <PassBadge label={`MaxPos: ${results.openPositions || 0}/${rm.maxOpenPositions || 3}`} passed={(results.openPositions || 0) < (rm.maxOpenPositions || 3)} />
              {results.reasons?.slice(0, 2).map((r: string, i: number) => (
                <span key={i} style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '4px', background: '#f8fafc', color: '#64748b', border: '1px solid rgba(226,232,240,0.5)' }}>{r}</span>
              ))}
            </div>
          </div>

          {/* Decision Chain */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.12)', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
            <SectionHeader icon={<GitBranch size={13} color="#1252AB" />} title="Decision Chain" subtitle="Algo engine exact checks" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <ChainNode label="Auto-Trade Enabled?" detail="AppSettings → auto_trade_enabled = true check" passed={true} isLast={false} />
              <ChainNode label="Trading Day?" detail="Weekday (Mon-Fri) + holidays + special days check" passed={true} isLast={false} />
              <ChainNode
                label={isSLMarket ? 'SL-Market → Breakout Auto-PASS' : hasPriceAction ? `LTP (${results.currentLtp}) ≥ Entry (${results.breakoutEntryPrice})?` : 'No Price Action → Breakout Auto-PASS'}
                detail={results.breakoutPassed ? 'Breakout confirmed ✅' : 'Breakout not met ❌'}
                passed={results.breakoutPassed}
                isLast={!results.breakoutPassed}
              />
              {results.breakoutPassed && <>
                <ChainNode label={`Capital at Risk = ₹${results.capitalAtRisk?.toFixed(0)}`}
                  detail={`Capital (${cap.toLocaleString('en-IN')}) × riskPerTrade (${riskPct}%), capped at ₹${dbCap.toLocaleString('en-IN')}`}
                  passed={results.capitalAtRisk > 0} isLast={results.capitalAtRisk <= 0}
                />
                {results.capitalAtRisk > 0 && <>
                  <ChainNode label={`SL Points = ₹${results.slPoints?.toFixed(2)}`}
                    detail={`${sl.type || 'Fixed %'}: ${slPct}% of entry = ₹${results.slPoints?.toFixed(2)}`}
                    passed={results.slPoints > 0} isLast={false}
                  />
                  <ChainNode label={`Quantity = ${results.quantity}`}
                    detail={`floor(${results.capitalAtRisk?.toFixed(0)} / ${results.slPoints?.toFixed(2)}) = ${results.quantity}`}
                    passed={(results.quantity || 0) > 0} isLast={(results.quantity || 0) <= 0}
                  />
                  {(results.quantity || 0) > 0 && <>
                    {results.isSLMarket && <ChainNode label="SL-Market: trigger price set" detail={`SL @ ₹${results.stopLoss?.toFixed(2)}, entry @ ₹${results.entryPrice?.toFixed(2)}`} passed={true} isLast={false} />}
                    <ChainNode label="OCO Orders → Market"
                      detail={`BUY ${results.orderType} + SELL SL-M @ ₹${results.stopLoss?.toFixed(2)} + SELL LIMIT @ ₹${results.target?.toFixed(2)}`}
                      passed={true} isLast={true}
                    />
                  </>}
                </>}
              </>}
            </div>
          </div>

          {/* Detailed Calculations */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.12)', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
            <SectionHeader icon={<Calculator size={13} color="#1E88FF" />} title="Detailed Calculations" subtitle="Engine ke exact formulas" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <CalcRow label="Candle Price" value={`₹${results.candlePrice || '—'}`}
                formula={`${results.candleType || 'high'}.toUpperCase() → first 5m candle (${bi.preSelectTime || '09:15'} → ${bi.entryTime || '09:20'})`}
                color="#7c3aed" passed={null}
              />
              <CalcRow label="Breakout Entry Price" value={`₹${results.breakoutEntryPrice || '—'}`}
                formula={bp > 0 ? `Candle ${results.candleType} (${results.candlePrice}) × (1 + ${bp}/100)` : `Candle ${results.candleType} (${results.candlePrice}) — no buffer`}
                color="#7c3aed" passed={results.breakoutPassed ?? false}
              />
              <CalcRow label="Breakout Check" value={results.breakoutPassed ? 'PASS ✅' : 'FAIL ❌'}
                formula={results.isSLMarket ? `SL-Market → auto-pass` : !results.hasPriceAction ? `No Price Action condition → auto-pass` : `LTP (${results.currentLtp}) >= Entry (${results.breakoutEntryPrice})`}
                color={results.breakoutPassed ? '#059669' : '#dc2626'} passed={results.breakoutPassed}
              />
              <CalcRow label="SL Points" value={`₹${results.slPoints?.toFixed(2) || '—'}`}
                formula={`${sl.type || 'Fixed %'}: entry (₹${results.entryPrice?.toFixed(2)}) × ${slPct}% = ₹${results.slPoints?.toFixed(2)}`}
                color="#dc2626" passed={results.slPoints > 0}
              />
              <CalcRow label="Capital at Risk" value={`₹${(results.capitalAtRisk || 0).toFixed(0)}`}
                formula={`Available (${cap.toLocaleString('en-IN')}) × riskPerTrade (${riskPct}%) = ₹${(cap * riskPct/100).toFixed(0)}, capped at ₹${dbCap.toLocaleString('en-IN')}`}
                color="#059669" passed={results.capitalAtRisk > 0}
              />
              <CalcRow label="Quantity" value={results.quantity?.toString() || '0'}
                formula={`floor(₹${(results.capitalAtRisk || 0).toFixed(0)} / ₹${(results.slPoints || 0).toFixed(2)}) = ${results.quantity || 0}`}
                color="#f59e0b" passed={(results.quantity || 0) > 0}
              />
              {rm.misMarginRate > 0 && (
                <CalcRow label="Buying Power" value={results.quantity <= Math.floor(cap / (results.entryPrice * rm.misMarginRate)) ? '✅ OK' : '❌ Capped'}
                  formula={`misMarginRate=${rm.misMarginRate}: min(qty, floor(${cap} / (${results.entryPrice} × ${rm.misMarginRate})))`}
                  color="#f59e0b" passed={null}
                />
              )}
              <CalcRow label="Stop Loss" value={`₹${results.stopLoss?.toFixed(2) || '—'}`}
                formula={`Entry (₹${results.entryPrice?.toFixed(2)}) − SL Points (₹${results.slPoints?.toFixed(2)}) = ₹${results.stopLoss?.toFixed(2)}`}
                color="#dc2626" passed={true}
              />
              <CalcRow label="Target" value={`₹${results.target?.toFixed(2) || '—'}`}
                formula={tg.type === 'Risk Reward Ratio' ? `Entry + SL × ${tg.riskRewardRatio||2} RR` : `Entry × (1 + ${targetPct}%)`}
                color="#059669" passed={true}
              />
            </div>
          </div>

          {/* Reasons */}
          {results.reasons && results.reasons.length > 0 && (
            <div style={{ background: 'linear-gradient(135deg, rgba(18,82,171,0.02), rgba(139,92,246,0.02))', borderRadius: '12px', border: '1px solid rgba(18,82,171,0.08)', padding: '16px 18px' }}>
              <SectionHeader icon={<AlertTriangle size={12} color="#1252AB" />} title="Engine Decision Summary" subtitle="Jo engine log karega" />
              {results.reasons.map((r: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px', fontSize: '11px', color: '#475569' }}>
                  <ArrowRight size={11} style={{ marginTop: '2px', flexShrink: 0, color: '#94a3b8' }} />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const InputField = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
    <label style={{ fontSize: '10px', fontWeight: 600, color: '#64748b' }}>{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(226,232,240,0.6)', background: '#f8fafc', color: '#0f172a', outline: 'none', fontSize: '12px' }}
    />
  </div>
);

const FormulaLine = ({ label, value, detail, color }: { label: string; value: string; detail: string; color: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 10px', borderRadius: '6px', background: '#fff', border: '1px solid rgba(226,232,240,0.4)' }}>
    <div>
      <span style={{ fontSize: '11px', fontWeight: 600, color }}>{label}</span>
      <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '8px' }}>{detail}</span>
    </div>
    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{value}</span>
  </div>
);

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
      {!isLast && <div style={{ width: '1.5px', flex: 1, background: 'rgba(226,232,240,0.5)', marginTop: '3px' }} />}
    </div>
    <div style={{ flex: 1, paddingBottom: isLast ? '0' : '8px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: passed ? '#059669' : '#dc2626' }}>{label}</div>
      <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.4', marginTop: '1px' }}>{detail}</div>
    </div>
  </div>
);
