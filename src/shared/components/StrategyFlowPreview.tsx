'use client';
import React from 'react';
import { Clock, TrendingUp, Shield, Target, Activity, Eye, ArrowDown, Zap, AlertTriangle, CheckCircle, XCircle, Layers } from 'lucide-react';

interface StrategyConfig {
  basicInfo?: any;
  tradeAction?: any;
  stoploss?: any;
  target?: any;
  riskManagement?: any;
  conditions?: any[];
}

const Connector = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2px 0', marginLeft: '20px' }}>
    <div style={{ width: '2px', height: '16px', background: 'linear-gradient(to bottom, rgba(148,163,184,0.2), rgba(99,102,241,0.3))' }} />
    <ArrowDown size={10} style={{ color: 'rgba(99,102,241,0.3)', marginTop: '-1px' }} />
  </div>
);

const PassBadge = ({ label, passed }: { label: string; passed: boolean }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
    background: passed ? 'rgba(5,150,105,0.08)' : 'rgba(239,68,68,0.08)',
    border: `1px solid ${passed ? 'rgba(5,150,105,0.2)' : 'rgba(239,68,68,0.2)'}`,
    color: passed ? '#059669' : '#dc2626'
  }}>
    {passed ? <CheckCircle size={9} /> : <XCircle size={9} />}{label}
  </div>
);

const TimingTag = ({ time }: { time: string }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    padding: '3px 9px', borderRadius: '5px',
    background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)',
    fontSize: '9px', fontWeight: 700, color: '#0ea5e9'
  }}>
    <Clock size={8} />{time}
  </div>
);

const StageTag = ({ label, color }: { label: string; color: string }) => (
  <div style={{
    padding: '3px 9px', borderRadius: '4px',
    background: `${color}10`, border: `1px solid ${color}20`,
    fontSize: '8px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.4px'
  }}>{label}</div>
);

const FormulaBox = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    padding: '8px 12px', borderRadius: '6px',
    background: 'rgba(15,23,42,0.03)', border: '1px solid rgba(15,23,42,0.05)',
    fontSize: '10px', fontFamily: 'ui-monospace, SFMono-Regular, monospace',
    color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '6px'
  }}>
    {children}
  </div>
);

const StageCard = ({ children, color, accent }: { children: React.ReactNode; color: string; accent: string }) => (
  <div style={{
    borderRadius: '12px',
    background: '#fff',
    border: '1px solid rgba(148,163,184,0.12)',
    padding: '16px 18px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '3px', height: '100%',
      background: `linear-gradient(to bottom, ${color}, ${accent})`,
      opacity: 0.3
    }} />
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Stage 1 */}
      <div style={{ position: 'relative', paddingLeft: '52px' }}>
        <div style={{ position: 'absolute', left: '20px', top: '0', bottom: '0', width: '2px', background: 'rgba(148,163,184,0.1)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: '-36px', top: '14px',
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            boxShadow: '0 0 0 5px rgba(14,165,233,0.08), 0 2px 6px rgba(14,165,233,0.15)',
            zIndex: 2
          }}>
            <Clock size={14} />
          </div>
          <StageCard color="#0ea5e9" accent="#0284c7">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <StageTag label="Stage 1" color="#0ea5e9" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Market Pre-Open Data</span>
              <div style={{ marginLeft: 'auto' }}><TimingTag time={`08:00 — ${preSelectTime}`} /></div>
            </div>
            <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.6', marginBottom: '10px' }}>
              Token refresh → NSE pre-open fetch → Segment filter <strong>{segment}</strong> → Price change % sort → Top <strong>#{selectPos}</strong> stock
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              <PassBadge label={`Segment: ${segment}`} passed={true} />
              <PassBadge label={`Pick: #${selectPos}`} passed={true} />
              {hasConditions
                ? <PassBadge label={`${conds.length} Condition(s)`} passed={true} />
                : <PassBadge label="No Conditions (all pass)" passed={true} />
              }
              {hasPriceAction && <PassBadge label="Price Action active" passed={true} />}
            </div>
          </StageCard>
        </div>
      </div>

      <Connector />

      {/* Stage 2: Breakout Entry */}
      <div style={{ position: 'relative', paddingLeft: '52px' }}>
        <div style={{ position: 'absolute', left: '20px', top: '0', bottom: '0', width: '2px', background: 'rgba(148,163,184,0.1)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: '-36px', top: '14px',
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            boxShadow: '0 0 0 5px rgba(139,92,246,0.08), 0 2px 6px rgba(139,92,246,0.15)',
            zIndex: 2
          }}>
            <Zap size={14} />
          </div>
          <StageCard color="#8b5cf6" accent="#7c3aed">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <StageTag label="Stage 2" color="#8b5cf6" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Breakout Entry Check</span>
              <div style={{ marginLeft: 'auto' }}><TimingTag time={entryTime} /></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px', borderRadius: '6px', background: 'rgba(241,245,249,0.5)', border: '1px solid rgba(226,232,240,0.5)' }}>
                <span style={{ fontWeight: 600, fontSize: '11px', color: '#475569', minWidth: '80px' }}>① Candle:</span>
                <span style={{ fontSize: '11px', color: '#475569' }}>Get <strong style={{color:'#7c3aed'}}>{candleType.toUpperCase()}</strong> of first 5m candle <span style={{color:'#94a3b8'}}>({preSelectTime} → {entryTime})</span></span>
              </div>
              {bufferPct > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px', borderRadius: '6px', background: 'rgba(241,245,249,0.5)', border: '1px solid rgba(226,232,240,0.5)' }}>
                  <span style={{ fontWeight: 600, fontSize: '11px', color: '#475569', minWidth: '80px' }}>② Buffer:</span>
                  <span style={{ fontSize: '11px', color: '#475569' }}>Entry price + <strong>{bufferPct}%</strong></span>
                </div>
              )}
              <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(255,251,235,0.5)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <span style={{ fontWeight: 600, fontSize: '11px', color: '#92400e' }}>③ Breakout Logic (exact engine):</span>
                <FormulaBox>
                  <div>if <span style={{fontWeight:600,color:'#7c3aed'}}>isSLMarket</span> ({isSLMarket ? <span style={{color:'#059669'}}>YES →</span> : <span style={{color:'#dc2626'}}>NO →</span>}) <span style={{color:'#059669',fontWeight:600}}>auto PASS</span></div>
                  <div>else if <span style={{fontWeight:600,color:'#7c3aed'}}>!hasPriceAction</span> ({!hasPriceAction ? <span style={{color:'#059669'}}>YES →</span> : <span style={{color:'#dc2626'}}>NO →</span>}) <span style={{color:'#059669',fontWeight:600}}>auto PASS</span></div>
                  <div>else → <span style={{fontWeight:600}}>currentLtp {isLong ? '>=' : '<='} breakoutEntryPrice</span> ?</div>
                </FormulaBox>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {isSLMarket
                    ? <PassBadge label="SL-Market → Always PASS" passed={true} />
                    : !hasPriceAction
                      ? <PassBadge label="No Price Action → Always PASS" passed={true} />
                      : <PassBadge label="LTP >= Entry → PASS check" passed={true} />
                  }
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <PassBadge label={`Candle: ${candleType.toUpperCase()}`} passed={true} />
              <PassBadge label={`Order: ${ta.orderType || 'Market'}`} passed={true} />
              {bufferPct > 0
                ? <PassBadge label={`Buffer: +${bufferPct}%`} passed={true} />
                : <PassBadge label="No buffer" passed={false} />
              }
            </div>
          </StageCard>
        </div>
      </div>

      <Connector />

      {/* Stage 3 */}
      <div style={{ position: 'relative', paddingLeft: '52px' }}>
        <div style={{ position: 'absolute', left: '20px', top: '0', bottom: '0', width: '2px', background: 'rgba(148,163,184,0.1)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: '-36px', top: '14px',
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #059669, #047857)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            boxShadow: '0 0 0 5px rgba(5,150,105,0.08), 0 2px 6px rgba(5,150,105,0.15)',
            zIndex: 2
          }}>
            <Shield size={14} />
          </div>
          <StageCard color="#059669" accent="#047857">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <StageTag label="Stage 3" color="#059669" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Position Sizing & Risk Checks</span>
            </div>

            <FormulaBox>
              <div>capitalAtRisk = clientCapital × (<span style={{fontWeight:600}}>{rm.riskPerTrade || 3}%</span>)</div>
              <div style={{color:'#94a3b8'}}>── capped at DB capital limit</div>
              <div>quantity = floor(capitalAtRisk / slPoints)</div>
              {hasBuyingPower && <div style={{color:'#f59e0b'}}>then: min(qty, floor(capital / (entryPrice × misMarginRate)))</div>}
            </FormulaBox>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(241,245,249,0.5)', border: '1px solid rgba(226,232,240,0.5)' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>RISK PER TRADE</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{rm.riskPerTrade || 3}%</div>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>of available capital</div>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(241,245,249,0.5)', border: '1px solid rgba(226,232,240,0.5)' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>SL POINTS ({sl.type || 'Fixed %'})</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {sl.type === 'Fixed Points' ? `${sl.fixedPoints || 10} pts` : `${sl.fixedPercent || 1}%`}
                </div>
                <div style={{ fontSize: '9px', color: '#94a3b8' }}>of entry price</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <PassBadge label={`Max ${rm.maxOpenPositions || 3} positions`} passed={true} />
              {hasKillSwitch
                ? <PassBadge label="Kill switch ON" passed={true} />
                : <PassBadge label="Kill switch OFF" passed={false} />
              }
              {hasBuyingPower
                ? <PassBadge label={`MIS margin: ${rm.misMarginRate}x`} passed={true} />
                : <PassBadge label="MIS margin: disabled" passed={false} />
              }
              <PassBadge label={`Daily loss: ₹${rm.maxDailyLoss || 5000}`} passed={true} />
            </div>
          </StageCard>
        </div>
      </div>

      <Connector />

      {/* Stage 4 */}
      <div style={{ position: 'relative', paddingLeft: '52px' }}>
        <div style={{ position: 'absolute', left: '20px', top: '0', bottom: '0', width: '2px', background: 'rgba(148,163,184,0.1)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: '-36px', top: '14px',
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            boxShadow: '0 0 0 5px rgba(220,38,38,0.08), 0 2px 6px rgba(220,38,38,0.15)',
            zIndex: 2
          }}>
            <Target size={14} />
          </div>
          <StageCard color="#dc2626" accent="#b91c1c">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <StageTag label="Stage 4" color="#dc2626" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>OCO — SL & Target Orders</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(254,242,242,0.5)', border: '1px solid rgba(220,38,38,0.08)' }}>
                <div style={{ fontSize: '9px', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Stop Loss</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '1px' }}>
                  {sl.type || 'Fixed %'}: {sl.fixedPercent || 1}%
                </div>
                <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '5px' }}>
                  {isLong ? 'Entry −' : 'Entry +'} SL pts → SL-Market SELL
                </div>
                {hasTrailingSL
                  ? <PassBadge label={`Trail: ${sl.trailingSL}%`} passed={true} />
                  : <PassBadge label="Trailing: OFF" passed={false} />
                }
              </div>
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(240,253,244,0.5)', border: '1px solid rgba(5,150,105,0.08)' }}>
                <div style={{ fontSize: '9px', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '3px' }}>Target</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '1px' }}>
                  {tg.type || 'Profit %'}: {tg.profitPercent || 2}%
                </div>
                <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '5px' }}>
                  {isLong ? 'Entry × ' : 'Entry × '}(1 + {tg.profitPercent || 2}%) → LIMIT SELL
                </div>
                {hasTrailingTarget
                  ? <PassBadge label={`Trail: ${tg.trailingTarget}%`} passed={true} />
                  : <PassBadge label="Trailing: OFF" passed={false} />
                }
              </div>
            </div>

            <div style={{ padding: '7px 10px', borderRadius: '6px', background: 'rgba(241,245,249,0.5)', border: '1px solid rgba(226,232,240,0.5)', fontSize: '10px', color: '#64748b' }}>
              <strong style={{color:'#334155'}}>Order Setup:</strong> Entry {ta.orderType || 'Market'} | SL-Market SELL | LIMIT SELL | Product: MIS
            </div>
          </StageCard>
        </div>
      </div>

      <Connector />

      {/* Stage 5 */}
      <div style={{ position: 'relative', paddingLeft: '52px' }}>
        <div style={{ position: 'absolute', left: '20px', top: '0', bottom: '0', width: '2px', background: 'rgba(148,163,184,0.1)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: '-36px', top: '14px',
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            boxShadow: '0 0 0 5px rgba(245,158,11,0.08), 0 2px 6px rgba(245,158,11,0.15)',
            zIndex: 2
          }}>
            <Activity size={14} />
          </div>
          <StageCard color="#f59e0b" accent="#d97706">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <StageTag label="Stage 5" color="#f59e0b" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Position Monitor</span>
              <div style={{ marginLeft: 'auto' }}><TimingTag time={`${entryTime} — ${exitTime}`} /></div>
            </div>

            <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.8', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'#6366f1'}} />
                Check {isSLMarket ? 'SL/Target' : ''} order status via Kite API (every {checkInterval}s)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'#f59e0b'}} />
                Trailing SL: {hasTrailingSL ? `+${sl.trailingSL}% per move (moves up only)` : 'OFF'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'#f59e0b'}} />
                Trailing Target: {hasTrailingTarget ? `+${tg.trailingTarget}% per move (moves up only)` : 'OFF'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'#dc2626'}} />
                Circuit breakers: Max loss ₹{rm.maxDailyLoss || 5000} | Max profit ₹{rm.maxDailyProfit || 15000}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'#059669'}} />
                Force square-off at <strong>{exitTime}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {hasTrailingSL
                ? <PassBadge label={`Trail SL: ${sl.trailingSL}%`} passed={true} />
                : <PassBadge label="Trail SL: OFF" passed={false} />
              }
              {hasTrailingTarget
                ? <PassBadge label={`Trail Tgt: ${tg.trailingTarget}%`} passed={true} />
                : <PassBadge label="Trail Target: OFF" passed={false} />
              }
            </div>
          </StageCard>
        </div>
      </div>

      {/* Stage 6: Exit */}
      <div style={{ position: 'relative', paddingLeft: '52px', marginTop: '0' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: '-36px', top: '14px',
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            boxShadow: '0 0 0 5px rgba(99,102,241,0.08), 0 2px 6px rgba(99,102,241,0.15)',
            zIndex: 2
          }}>
            <AlertTriangle size={14} />
          </div>
          <StageCard color="#6366f1" accent="#4f46e5">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <StageTag label="Exit" color="#6366f1" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Square Off</span>
              <div style={{ marginLeft: 'auto' }}><TimingTag time={exitTime} /></div>
            </div>
            <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.6' }}>
              SELL MARKET at {exitTime}. Pehle bhi exit ho sakta hai agar SL trigger ho, Target hit ho,
              ya daily loss/profit limit cross ho jaye.
            </div>
          </StageCard>
        </div>
      </div>
    </div>
  );
}
