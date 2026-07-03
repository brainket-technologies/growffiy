'use client';
import React, { useState } from 'react';
import { Card } from './views/Card';
import { Button } from './views/Button';
import { api } from '../services/api';
import { CheckCircle2, XCircle, Info, Calculator, FlaskConical, Loader2, GitBranch, AlertTriangle, ArrowRight } from 'lucide-react';

interface StrategyConfig {
  basicInfo?: any;
  tradeAction?: any;
  legs?: any[];
  stoploss?: any;
  target?: any;
  riskManagement?: any;
  conditions?: any[];
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
      paddingBottom: '10px', borderBottom: '1px solid var(--border-light)',
    }}>
      {icon}
      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>{title}</span>
      {subtitle && <span style={{ fontSize: '10px', color: 'var(--text-subtle)', marginLeft: 'auto' }}>{subtitle}</span>}
    </div>
  );
}

function PassBadge({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '2px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, lineHeight: '20px',
      background: passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
      color: passed ? '#059669' : '#dc2626',
    }}>
      {passed ? <CheckCircle2 size={9} /> : <XCircle size={9} />}{label}
    </div>
  );
}

function CalcRow({ label, value, formula, color, passed }: { label: string; value: string; formula: string; color?: string; passed?: boolean | null }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '10px 14px', borderRadius: '8px',
      background: 'var(--surface)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          {passed === true && <CheckCircle2 size={12} color="#059669" />}
          {passed === false && <XCircle size={12} color="#dc2626" />}
          <span style={{ fontSize: '12px', fontWeight: 600, color: color || 'var(--text-heading)' }}>{label}</span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.5', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>{formula}</div>
      </div>
      <div style={{
        fontSize: '13px', fontWeight: 700, marginLeft: '14px', whiteSpace: 'nowrap',
        color: passed === true ? '#059669' : passed === false ? '#dc2626' : 'var(--text-heading)',
      }}>
        {value}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</label>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{
          padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text-heading)', outline: 'none',
          fontSize: '13px', fontWeight: 500,
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-light)'; }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

function FormulaLine({ label, value, detail, color }: { label: string; value: string; detail: string; color: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 12px', borderRadius: '8px',
      background: 'var(--bg-card)', border: '1px solid var(--border-light)',
    }}>
      <div>
        <span style={{ fontSize: '11px', fontWeight: 600, color }}>{label}</span>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginLeft: '8px' }}>{detail}</span>
      </div>
      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>{value}</span>
    </div>
  );
}

function ChainNode({ label, detail, passed, isLast }: { label: string; detail: string; passed: boolean; isLast: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '22px' }}>
        <div style={{
          width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
          background: 'var(--surface)',
          border: `2px solid ${passed ? '#059669' : '#dc2626'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {passed ? <CheckCircle2 size={11} color="#059669" /> : <XCircle size={11} color="#dc2626" />}
        </div>
        {!isLast && <div style={{ width: '1.5px', flex: 1, background: 'var(--border-light)', marginTop: '4px' }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: isLast ? '0' : '10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: passed ? '#059669' : '#dc2626' }}>{label}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: '2px' }}>{detail}</div>
      </div>
    </div>
  );
}

const cardSx: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: '12px',
  padding: '20px 22px',
  boxShadow: 'var(--shadow-sm)',
};

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
  const legs = config.legs && config.legs.length > 0 ? config.legs : [];
  const leg0 = legs[0] || {};
  const ta = leg0.tradeAction || config.tradeAction || {};
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
  const dirLabel = isLong ? 'LONG' : 'SHORT';
  const entryTime = leg0.entryTime || bi.entryTime || '09:20';
  const legName = leg0.legName || 'Leg 1';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Mock Inputs */}
      <div style={cardSx}>
        <SectionHeader icon={<Info size={14} color="var(--primary)" />} title="Mock Inputs" subtitle="Test ke liye values" />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <PassBadge label={`Leg: ${legName}`} passed={true} />
          <PassBadge label={`Direction: ${dirLabel}`} passed={true} />
          <PassBadge label={`Entry: ${entryTime}`} passed={true} />
          <PassBadge label={`Candle: ${candleType.toUpperCase()}`} passed={true} />
          {bp > 0 && <PassBadge label={`Buffer: ${isLong ? '+' : '−'}${bp}%`} passed={true} />}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <InputField label="Symbol" value={symbol} onChange={setSymbol} placeholder="TATASTEEL" />
          <InputField label={`LTP (₹)`} value={ltp} onChange={setLtp} placeholder="200.00" />
          <InputField label={`Candle ${candleType.toUpperCase()} (₹)`} value={candlePrice} onChange={setCandlePrice} placeholder={defaultCandle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
          <InputField label="Available Capital (₹)" value={availableCapital} onChange={setAvailableCapital} placeholder="50000" />
          <InputField label="DB Capital Limit (₹)" value={dbCapital} onChange={setDbCapital} placeholder="50000" />
          <InputField label="Open Positions" value={openPositions} onChange={setOpenPositions} placeholder="0" />
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button type="button" variant="primary" onClick={runTest} disabled={loading}
              style={{ width: '100%', padding: '9px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '8px' }}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />}
              {loading ? 'Testing...' : 'Run Test'}
            </Button>
          </div>
        </div>
      </div>

      {/* Engine Formula Preview */}
      <div style={cardSx}>
        <SectionHeader icon={<Calculator size={14} color="var(--primary)" />} title="Engine Calculation Preview" subtitle="Jo formula engine use karega" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <FormulaLine label="capitalAtRisk" value={`₹${(cap * riskPct / 100).toFixed(0)}`}
            detail={`${cap.toLocaleString('en-IN')} × (${riskPct}/100), capped at ₹${dbCap.toLocaleString('en-IN')}`}
            color="var(--text-heading)"
          />
          <FormulaLine label="SL Points" value={`₹${(sl.type === 'Fixed Points' ? (sl.fixedPoints || 10) : mockCandlePrice * (slPct/100)).toFixed(2)}`}
            detail={`${sl.type || 'Fixed %'}: ${slPct}% of entry (₹${mockCandlePrice.toFixed(2)})`}
            color="var(--text-heading)"
          />
          <FormulaLine label="Quantity" value={`${Math.floor((cap * riskPct / 100) / ((sl.type === 'Fixed Points' ? (sl.fixedPoints || 10) : mockCandlePrice * (slPct/100)))) || 1}`}
            detail={`floor(${(cap * riskPct / 100).toFixed(0)} / ${((sl.type === 'Fixed Points' ? (sl.fixedPoints || 10) : mockCandlePrice * (slPct/100))).toFixed(2)})`}
            color="var(--text-heading)"
          />
          <FormulaLine label="Breakout" value={isSLMarket ? 'auto PASS' : !hasPriceAction ? 'auto PASS' : `${mockLtp} ${isLong ? '≥' : '≤'} ${(bp > 0 ? (isLong ? mockCandlePrice * (1 + bp/100) : mockCandlePrice * (1 - bp/100)) : mockCandlePrice).toFixed(2)} ?`}
            detail={isSLMarket ? 'SL-Market → auto pass' : !hasPriceAction ? 'No Price Action condition → auto pass' : ''}
            color="var(--text-heading)"
          />
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          fontSize: '12px', fontWeight: 500, color: '#dc2626',
        }}>
          {error}
        </div>
      )}

      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease' }}>
          {/* Overall Verdict */}
          <div style={{
            background: results.wouldTrade ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            borderRadius: '12px',
            border: `1px solid ${results.wouldTrade ? 'rgba(5,150,105,0.15)' : 'rgba(239,68,68,0.15)'}`,
            padding: '20px 22px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {results.wouldTrade ? <CheckCircle2 size={26} color="#059669" /> : <XCircle size={26} color="#dc2626" />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: results.wouldTrade ? '#059669' : '#dc2626' }}>
                  {results.wouldTrade ? 'TRADE HOGI ✅' : 'TRADE NAHI HOGI ❌'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {results.wouldTrade ? 'Sabhi conditions pass — OCO order place hoga' : 'Koi condition fail hui — trade skip hogi'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
              <PassBadge label={`${dirLabel}: ${results.breakoutPassed ? 'PASS' : 'FAIL'}`} passed={results.breakoutPassed} />
              <PassBadge label={`Qty: ${results.quantity || 0}`} passed={(results.quantity || 0) > 0} />
              <PassBadge label={`MaxPos: ${results.openPositions || 0}/${rm.maxOpenPositions || 3}`} passed={(results.openPositions || 0) < (rm.maxOpenPositions || 3)} />
              {results.reasons?.slice(0, 2).map((r: string, i: number) => (
                <span key={i} style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '999px', background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>{r}</span>
              ))}
            </div>
          </div>

          {/* Decision Chain */}
          <div style={cardSx}>
            <SectionHeader icon={<GitBranch size={14} color="var(--primary)" />} title="Decision Chain" subtitle="Algo engine checks" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <ChainNode label="Auto-Trade Enabled?" detail="AppSettings → auto_trade_enabled = true check" passed={true} isLast={false} />
              <ChainNode label="Trading Day?" detail="Weekday (Mon-Fri) + holidays + special days check" passed={true} isLast={false} />
              <ChainNode
                label={isSLMarket ? 'SL-Market → Breakout Auto-PASS' : hasPriceAction ? `LTP (${results.currentLtp}) ${isLong ? '≥' : '≤'} Entry (${results.breakoutEntryPrice})?` : 'No Price Action → Breakout Auto-PASS'}
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
                      detail={`${dirLabel}: ${results.orderType} + SL-Market ${isLong ? 'SELL' : 'BUY'} @ ₹${results.stopLoss?.toFixed(2)} + LIMIT ${isLong ? 'SELL' : 'BUY'} @ ₹${results.target?.toFixed(2)}`}
                      passed={true} isLast={true}
                    />
                  </>}
                </>}
              </>}
            </div>
          </div>

          {/* Detailed Calculations */}
          <div style={cardSx}>
            <SectionHeader icon={<Calculator size={14} color="var(--primary)" />} title="Detailed Calculations" subtitle="Engine ke exact formulas" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { l: 'Active Leg', v: `${legName} (${dirLabel})`, f: `Entry: ${entryTime}, Timeframe: ${leg0.timeframe || '5m'}`, c: 'var(--text-heading)', p: null },
                { l: 'Candle Price', v: `₹${results.candlePrice || '—'}`, f: `${results.candleType || 'high'}.toUpperCase() → first 5m candle (${bi.preSelectTime || '09:15'} → ${entryTime})`, c: 'var(--text-heading)', p: null },
                { l: 'Breakout Entry Price', v: `₹${results.breakoutEntryPrice || '—'}`, f: bp > 0 ? `Candle ${results.candleType} (${results.candlePrice}) × (1 ${isLong ? '+' : '−'} ${bp}/100)` : `Candle ${results.candleType} (${results.candlePrice}) — no buffer`, c: 'var(--text-heading)', p: results.breakoutPassed ?? false },
                { l: 'Breakout Check', v: results.breakoutPassed ? 'PASS ✅' : 'FAIL ❌', f: results.isSLMarket ? 'SL-Market → auto-pass' : !results.hasPriceAction ? 'No Price Action condition → auto-pass' : `LTP (${results.currentLtp}) ${isLong ? '>=' : '<='} Entry (${results.breakoutEntryPrice})`, c: results.breakoutPassed ? 'var(--accent-dark)' : 'var(--danger)', p: results.breakoutPassed },
                { l: 'SL Points', v: `₹${results.slPoints?.toFixed(2) || '—'}`, f: `${sl.type || 'Fixed %'}: entry (₹${results.entryPrice?.toFixed(2)}) × ${slPct}% = ₹${results.slPoints?.toFixed(2)}`, c: 'var(--text-heading)', p: results.slPoints > 0 },
                { l: 'Capital at Risk', v: `₹${(results.capitalAtRisk || 0).toFixed(0)}`, f: `Available (${cap.toLocaleString('en-IN')}) × riskPerTrade (${riskPct}%) = ₹${(cap * riskPct/100).toFixed(0)}, capped at ₹${dbCap.toLocaleString('en-IN')}`, c: 'var(--text-heading)', p: results.capitalAtRisk > 0 },
                { l: 'Quantity', v: results.quantity?.toString() || '0', f: `floor(₹${(results.capitalAtRisk || 0).toFixed(0)} / ₹${(results.slPoints || 0).toFixed(2)}) = ${results.quantity || 0}`, c: 'var(--text-heading)', p: (results.quantity || 0) > 0 },
              ].map((row, i) => (
                <CalcRow key={i} label={row.l} value={row.v} formula={row.f} color={row.c} passed={row.p} />
              ))}
              {rm.misMarginRate > 0 && (
                <CalcRow label="Buying Power" value={results.quantity <= Math.floor(cap / (results.entryPrice * rm.misMarginRate)) ? '✅ OK' : '❌ Capped'}
                  formula={`misMarginRate=${rm.misMarginRate}: min(qty, floor(${cap} / (${results.entryPrice} × ${rm.misMarginRate})))`}
                  color="var(--text-heading)" passed={null}
                />
              )}
              <CalcRow label="Stop Loss" value={`₹${results.stopLoss?.toFixed(2) || '—'}`}
                formula={`${isLong ? 'Entry −' : 'Entry +'} SL Points = ₹${results.stopLoss?.toFixed(2)} → SL-Market ${isLong ? 'SELL' : 'BUY'}`}
                color="var(--text-heading)" passed={true}
              />
              <CalcRow label="Target" value={`₹${results.target?.toFixed(2) || '—'}`}
                formula={tg.type === 'Risk Reward Ratio' ? `Entry + SL × ${tg.riskRewardRatio||2} RR → LIMIT ${isLong ? 'SELL' : 'BUY'}` : `Entry × (1 + ${targetPct}%) → LIMIT ${isLong ? 'SELL' : 'BUY'}`}
                color="var(--text-heading)" passed={true}
              />
            </div>
          </div>

          {/* Reasons */}
          {results.reasons && results.reasons.length > 0 && (
            <div style={cardSx}>
              <SectionHeader icon={<AlertTriangle size={14} color="var(--primary)" />} title="Engine Decision Summary" subtitle="Jo engine log karega" />
              {results.reasons.map((r: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px', fontSize: '12px', color: 'var(--text-body)' }}>
                  <ArrowRight size={12} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--text-subtle)' }} />
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
