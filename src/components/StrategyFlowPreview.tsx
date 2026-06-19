'use client';
import React from 'react';
import { Clock, TrendingUp, Shield, Target, Activity, Eye, ArrowDown, GitBranch, Zap, AlertTriangle, CheckCircle, XCircle, Calculator } from 'lucide-react';

interface StrategyConfig {
  basicInfo?: any;
  tradeAction?: any;
  stoploss?: any;
  target?: any;
  riskManagement?: any;
  conditions?: any[];
}

const Connector = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3px 0', marginLeft: '18px' }}>
    <div style={{ width: '2px', height: '18px', background: 'linear-gradient(to bottom, var(--border-color), var(--primary))', opacity: 0.35 }} />
    <ArrowDown size={12} style={{ color: 'var(--primary)', opacity: 0.4, marginTop: '-1px' }} />
  </div>
);

const PassBadge = ({ label, passed }: { label: string; passed: boolean }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    padding: '2px 9px', borderRadius: '5px', fontSize: '10px', fontWeight: 600,
    background: passed ? 'rgba(5,150,105,0.07)' : 'rgba(239,68,68,0.07)',
    border: `1px solid ${passed ? 'rgba(5,150,105,0.18)' : 'rgba(239,68,68,0.18)'}`,
    color: passed ? '#059669' : '#dc2626'
  }}>
    {passed ? <CheckCircle size={10} /> : <XCircle size={10} />}{label}
  </div>
);

const TimingTag = ({ time }: { time: string }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    padding: '2px 8px', borderRadius: '4px',
    background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.15)',
    fontSize: '9px', fontWeight: 700, color: '#0ea5e9'
  }}>
    <Clock size={9} />{time}
  </div>
);

const StageTag = ({ label, color }: { label: string; color: string }) => (
  <div style={{
    padding: '2px 8px', borderRadius: '3px',
    background: `${color}12`, border: `1px solid ${color}22`,
    fontSize: '8px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.4px'
  }}>{label}</div>
);

const FormulaBox = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    padding: '6px 10px', borderRadius: '6px',
    background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.07)',
    fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '6px'
  }}>
    {children}
  </div>
);

export default function StrategyFlowPreview({ config }: { config: StrategyConfig }) {
  const bi = config.basicInfo || {};
  const ta = config.tradeAction || {};
  const sl = config.stoploss || {};
  const tg = config.target || {};
  const rm = config.riskManagement || {};
  const conds = config.conditions || [];

  const isLong = ta.action === 'Long' || ta.action === 'Buy';
  const isShort = ta.action === 'Short' || ta.action === 'Sell';
  const hasKillSwitch = rm.killSwitch;
  const hasTrailingSL = sl.trailingSL > 0;
  const hasTrailingTarget = tg.trailingTarget > 0;
  const hasConditions = conds.length > 0;
  const hasPriceAction = conds.some((c: any) => c.indicator === 'Price Action');
  const isSLMarket = ta.orderType === 'SL-Market';
  const hasBuyingPower = rm.misMarginRate > 0;

  const entryTime = bi.entryTime || '09:20';
  const exitTime = bi.exitTime || '15:15';
  const preSelectTime = bi.preSelectTime || '09:15';
  const segment = bi.segment || 'NSE';
  const selectPos = bi.selectPosition || 1;
  const checkInterval = bi.checkIntervalSec || 60;
  const candleType = ta.candlePriceType || 'high';
  const bufferPct = ta.bufferPercent !== undefined && ta.bufferPercent > 0 ? ta.bufferPercent : 0;

  return (
    <div style={{
      background: 'var(--bg-primary)', borderRadius: '14px',
      border: '1px solid var(--border-color)', padding: '22px 18px',
      display: 'flex', flexDirection: 'column', gap: '0'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 2px 6px rgba(99,102,241,0.2)' }}>
            <Eye size={14} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Strategy Execution Flow</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Exact engine flow — config se real values</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <PassBadge label={isLong ? 'Long' : 'Short'} passed={isLong} />
          <PassBadge label={`Kill Switch ${hasKillSwitch ? 'ON' : 'OFF'}`} passed={hasKillSwitch} />
          {hasPriceAction && <PassBadge label="Price Action" passed={true} />}
        </div>
      </div>

      {/* Stage 1: Market Pre-Open */}
      <div style={{ position: 'relative', paddingLeft: '48px' }}>
        <div style={{ position: 'absolute', left: '16px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, #0ea5e9, #8b5cf6)', opacity: 0.12 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '-32px', top: '12px', width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 0 4px rgba(14,165,233,0.1), 0 2px 6px rgba(14,165,233,0.15)', zIndex: 2 }}>
            <Clock size={14} />
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.03), transparent)', borderRadius: '10px', border: '1px solid rgba(14,165,233,0.08)', padding: '14px 16px', marginBottom: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <StageTag label="Stage 1" color="#0ea5e9" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>Market Pre-Open Data</span>
              <TimingTag time={`08:00 — ${preSelectTime}`} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '8px' }}>
              Token refresh at 08:00 → NSE pre-open fetch → Segment filter <strong style={{color:'var(--text-primary)'}}>{segment}</strong> apply → Price change % sort → Top <strong style={{color:'var(--text-primary)'}}>{selectPos}</strong> pick
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <PassBadge label={`Segment: ${segment}`} passed={true} />
              <PassBadge label={`Pick: #${selectPos}`} passed={true} />
              {hasConditions
                ? <PassBadge label={`${conds.length} Condition(s)`} passed={true} />
                : <PassBadge label="No Conditions (all pass)" passed={true} />
              }
              {hasPriceAction && <PassBadge label="Price Action condition present" passed={true} />}
            </div>
          </div>
        </div>
      </div>

      <Connector />

      {/* Stage 2: Breakout Entry */}
      <div style={{ position: 'relative', paddingLeft: '48px' }}>
        <div style={{ position: 'absolute', left: '16px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, #8b5cf6, #059669)', opacity: 0.12 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '-32px', top: '12px', width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 0 4px rgba(139,92,246,0.1), 0 2px 6px rgba(139,92,246,0.15)', zIndex: 2 }}>
            <Zap size={14} />
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.03), transparent)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.08)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <StageTag label="Stage 2" color="#8b5cf6" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>Breakout Entry Check</span>
              <TimingTag time={entryTime} />
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '8px' }}>
              Har pre-selected stock ke liye <strong style={{color:'var(--text-primary)'}}>{entryTime}</strong> par:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', background: 'rgba(14,165,233,0.03)', border: '1px solid rgba(14,165,233,0.06)' }}>
                <span style={{ fontWeight: 600, fontSize: '11px', color: 'var(--text-primary)', minWidth: '85px' }}>① Candle:</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Get <strong style={{color:'#8b5cf6'}}>{candleType.toUpperCase()}</strong> of first 5m candle</span>
              </div>
              {bufferPct > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', background: 'rgba(14,165,233,0.03)', border: '1px solid rgba(14,165,233,0.06)' }}>
                  <span style={{ fontWeight: 600, fontSize: '11px', color: 'var(--text-primary)', minWidth: '85px' }}>② Buffer:</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>+{bufferPct}% added to entry price</span>
                </div>
              )}
              <div style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.08)' }}>
                <span style={{ fontWeight: 600, fontSize: '11px', color: 'var(--text-primary)' }}>③ Breakout Logic (exact engine):</span>
                <FormulaBox>
                  if isSLMarket ({isSLMarket ? 'YES' : 'NO'}) → auto PASS<br />
                  else if !hasPriceAction ({!hasPriceAction ? 'YES' : 'NO'}) → auto PASS<br />
                  else → currentLtp &gt;= breakoutEntryPrice ?
                </FormulaBox>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {isSLMarket
                    ? <PassBadge label="SL-Market → Always PASS" passed={true} />
                    : !hasPriceAction
                      ? <PassBadge label="No Price Action → Always PASS" passed={true} />
                      : <PassBadge label="LTP >= Entry Price → PASS" passed={true} />
                  }
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <PassBadge label={`Candle: ${candleType.toUpperCase()}`} passed={true} />
              <PassBadge label={`Order: ${ta.orderType || 'Market'}`} passed={true} />
              {bufferPct > 0
                ? <PassBadge label={`Buffer: +${bufferPct}%`} passed={true} />
                : <PassBadge label={`Buffer: 0%`} passed={false} />
              }
            </div>
          </div>
        </div>
      </div>

      <Connector />

      {/* Stage 3: Position Sizing & Risk */}
      <div style={{ position: 'relative', paddingLeft: '48px' }}>
        <div style={{ position: 'absolute', left: '16px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, #059669, #dc2626)', opacity: 0.12 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '-32px', top: '12px', width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 0 4px rgba(5,150,105,0.1), 0 2px 6px rgba(5,150,105,0.15)', zIndex: 2 }}>
            <Shield size={14} />
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.03), transparent)', borderRadius: '10px', border: '1px solid rgba(5,150,105,0.08)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <StageTag label="Stage 3" color="#059669" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>Position Sizing & Risk Checks</span>
            </div>

            <FormulaBox>
              capitalAtRisk = clientCapital × (riskPerTrade/100) = Available Capital × {rm.riskPerTrade || 3}%<br />
              <span style={{color: 'var(--text-muted)'}}>─ Capped at DB capital limit</span><br />
              quantity = floor(capitalAtRisk / slPoints)<br />
              {hasBuyingPower && <>then capped by: min(qty, floor(capital / (entryPrice × misMarginRate)))<br /></>}
              SL = {isLong ? 'Entry −' : 'Entry +'} slPoints &nbsp; Target = Entry × (1 + {tg.profitPercent || 2}%)
            </FormulaBox>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
              <div style={{ padding: '7px 10px', borderRadius: '6px', background: 'rgba(5,150,105,0.03)', border: '1px solid rgba(5,150,105,0.06)' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>Risk Per Trade</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{rm.riskPerTrade || 3}%</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>of available capital</div>
              </div>
              <div style={{ padding: '7px 10px', borderRadius: '6px', background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.06)' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>SL Points ({sl.type || 'Fixed %'})</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {sl.type === 'Fixed Points' ? `${sl.fixedPoints || 10} pts` : `${sl.fixedPercent || 1}%`}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>of entry price</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <PassBadge label={`Max ${rm.maxOpenPositions || 3} positions`} passed={true} />
              {hasKillSwitch
                ? <PassBadge label="Kill switch ON" passed={true} />
                : <PassBadge label="Kill switch OFF" passed={false} />
              }
              {hasBuyingPower
                ? <PassBadge label={`MIS margin: ${rm.misMarginRate}×`} passed={true} />
                : <PassBadge label="MIS margin: disabled" passed={false} />
              }
              <PassBadge label={`Daily loss: ₹${rm.maxDailyLoss || 5000}`} passed={true} />
            </div>
          </div>
        </div>
      </div>

      <Connector />

      {/* Stage 4: SL & Target */}
      <div style={{ position: 'relative', paddingLeft: '48px' }}>
        <div style={{ position: 'absolute', left: '16px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, #dc2626, #f59e0b)', opacity: 0.12 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '-32px', top: '12px', width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 0 4px rgba(220,38,38,0.1), 0 2px 6px rgba(220,38,38,0.15)', zIndex: 2 }}>
            <Target size={14} />
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.03), transparent)', borderRadius: '10px', border: '1px solid rgba(220,38,38,0.08)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <StageTag label="Stage 4" color="#dc2626" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>OCO — SL & Target Orders</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(220,38,38,0.03)', border: '1px solid rgba(220,38,38,0.08)' }}>
                <div style={{ fontSize: '9px', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Stop Loss</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1px' }}>
                  {sl.type || 'Fixed %'}: {sl.fixedPercent || 1}%
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  SL-Market SELL @ Entry − {sl.fixedPercent || 1}%
                </div>
                {hasTrailingSL
                  ? <PassBadge label={`Trail: ${sl.trailingSL}%`} passed={true} />
                  : <PassBadge label="Trail: OFF" passed={false} />
                }
              </div>
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(5,150,105,0.03)', border: '1px solid rgba(5,150,105,0.08)' }}>
                <div style={{ fontSize: '9px', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Target</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1px' }}>
                  {tg.type || 'Profit %'}: {tg.profitPercent || 2}%
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  LIMIT SELL @ Entry × (1 + {tg.profitPercent || 2}%)
                </div>
                {hasTrailingTarget
                  ? <PassBadge label={`Trail: ${tg.trailingTarget}%`} passed={true} />
                  : <PassBadge label="Trail: OFF" passed={false} />
                }
              </div>
            </div>

            <div style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.06)', fontSize: '10px', color: 'var(--text-secondary)' }}>
              <strong style={{color:'var(--text-primary)'}}>Order Placement:</strong> Entry {ta.orderType || 'Market'} | SL-Market SELL | LIMIT SELL | Product: MIS
            </div>
          </div>
        </div>
      </div>

      <Connector />

      {/* Stage 5: Monitor */}
      <div style={{ position: 'relative', paddingLeft: '48px' }}>
        <div style={{ position: 'absolute', left: '16px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, #f59e0b, #6366f1)', opacity: 0.12 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '-32px', top: '12px', width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 0 4px rgba(245,158,11,0.1), 0 2px 6px rgba(245,158,11,0.15)', zIndex: 2 }}>
            <Activity size={14} />
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.03), transparent)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.08)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <StageTag label="Stage 5" color="#f59e0b" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>Monitor (every {checkInterval}s)</span>
              <TimingTag time={`${entryTime} — ${exitTime}`} />
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{width:'5px',height:'5px',borderRadius:'50%',background:'#6366f1'}} /> Check SL/Target order status via Kite API</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{width:'5px',height:'5px',borderRadius:'50%',background:'#f59e0b'}} /> Trailing SL: {hasTrailingSL ? `+${sl.trailingSL}% per move` : 'OFF'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{width:'5px',height:'5px',borderRadius:'50%',background:'#f59e0b'}} /> Trailing Target: {hasTrailingTarget ? `+${tg.trailingTarget}% per move` : 'OFF'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{width:'5px',height:'5px',borderRadius:'50%',background:'#dc2626'}} /> Max loss: ₹{rm.maxDailyLoss || 5000} | Max profit: ₹{rm.maxDailyProfit || 15000}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{width:'5px',height:'5px',borderRadius:'50%',background:'#059669'}} /> Force exit at {exitTime}</div>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {hasTrailingSL
                ? <PassBadge label={`Trail SL: ${sl.trailingSL}%`} passed={true} />
                : <PassBadge label="Trail SL" passed={false} />
              }
              {hasTrailingTarget
                ? <PassBadge label={`Trail Tgt: ${tg.trailingTarget}%`} passed={true} />
                : <PassBadge label="Trail Target" passed={false} />
              }
            </div>
          </div>
        </div>
      </div>

      {/* Stage 6: Exit */}
      <div style={{ position: 'relative', paddingLeft: '48px', marginTop: '0' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '-32px', top: '12px', width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 0 4px rgba(99,102,241,0.1), 0 2px 6px rgba(99,102,241,0.15)', zIndex: 2 }}>
            <AlertTriangle size={14} />
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.03), transparent)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.08)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <StageTag label="Exit" color="#6366f1" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>Square Off</span>
              <TimingTag time={exitTime} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              SELL MARKET at {exitTime} (ya pehle agar SL/Target hit ho jaye).
              Daily loss/profit limit cross → early exit trigger.
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Legend:</span>
        <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{color:'#059669'}}>✅</span> PASS</span>
        <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{color:'#dc2626'}}>❌</span> FAIL</span>
        <span style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={9} /> Timing</span>
      </div>
    </div>
  );
}
