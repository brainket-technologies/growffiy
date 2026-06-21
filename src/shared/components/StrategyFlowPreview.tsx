'use client';
import React from 'react';
import { Clock, TrendingUp, Shield, Target, Activity, Eye, ArrowDown, Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface StrategyConfig {
  basicInfo?: any;
  tradeAction?: any;
  stoploss?: any;
  target?: any;
  riskManagement?: any;
  conditions?: any[];
}

function Connector() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3px 0', marginLeft: '22px' }}>
      <div style={{ width: '2px', height: '14px', background: 'var(--border)', borderRadius: '1px' }} />
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
      {passed ? <CheckCircle size={9} /> : <XCircle size={9} />}{label}
    </div>
  );
}

function TimingTag({ time }: { time: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '2px 9px', borderRadius: '999px', fontSize: '9px', fontWeight: 600, lineHeight: '20px',
      background: 'var(--surface)', border: '1px solid var(--border)',
      color: 'var(--text-secondary)',
    }}>
      <Clock size={8} />{time}
    </div>
  );
}

function StageTag({ label }: { label: string }) {
  return (
    <div style={{
      padding: '2px 8px', borderRadius: '4px',
      background: 'var(--surface)', border: '1px solid var(--border)',
      fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)',
      letterSpacing: '0.4px',
    }}>
      {label}
    </div>
  );
}

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: '8px',
      background: 'var(--surface)',
      fontSize: '10px', fontFamily: 'ui-monospace, SFMono-Regular, monospace',
      color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '8px',
    }}>
      {children}
    </div>
  );
}

function StageCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: '12px',
      background: 'var(--bg-card)',
      padding: '18px 20px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {children}
    </div>
  );
}

function StageCircle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'absolute', left: '-50px', top: '14px',
      width: '32px', height: '32px', borderRadius: '50%',
      background: 'var(--surface)',
      border: '1.5px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-secondary)',
      zIndex: 2,
    }}>
      {children}
    </div>
  );
}

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
      <div style={{ position: 'relative', paddingLeft: '54px' }}>
        <div style={{ position: 'absolute', left: '20px', top: '0', bottom: '0', width: '2px', background: 'var(--border-light)' }} />
        <div style={{ position: 'relative' }}>
          <StageCircle><Clock size={12} /></StageCircle>
          <StageCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <StageTag label="Stage 1" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Market Pre-Open Data</span>
              <div style={{ marginLeft: 'auto' }}><TimingTag time={`08:00 — ${preSelectTime}`} /></div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-body)', lineHeight: '1.7', marginBottom: '10px' }}>
              Token refresh → NSE pre-open fetch → Segment filter <strong style={{color:'var(--text-heading)'}}>{segment}</strong> → Price change % sort → Top <strong style={{color:'var(--text-heading)'}}>#{selectPos}</strong> stock
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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

      {/* Stage 2 */}
      <div style={{ position: 'relative', paddingLeft: '54px' }}>
        <div style={{ position: 'absolute', left: '20px', top: '0', bottom: '0', width: '2px', background: 'var(--border-light)' }} />
        <div style={{ position: 'relative' }}>
          <StageCircle><Zap size={12} /></StageCircle>
          <StageCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <StageTag label="Stage 2" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Breakout Entry Check</span>
              <div style={{ marginLeft: 'auto' }}><TimingTag time={entryTime} /></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-body)', minWidth: '80px' }}>① Candle:</span>
                <span style={{ fontSize: '12px', color: 'var(--text-body)' }}>
                  Get <strong style={{color:'var(--text-heading)'}}>{candleType.toUpperCase()}</strong> of first 5m candle{' '}
                  <span style={{color:'var(--text-subtle)'}}>({preSelectTime} → {entryTime})</span>
                </span>
              </div>
              {bufferPct > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-body)', minWidth: '80px' }}>② Buffer:</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-body)' }}>Entry price + <strong>{bufferPct}%</strong></span>
                </div>
              )}
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-heading)' }}>③ Breakout Logic:</span>
                <FormulaBox>
                  <div>if <span style={{fontWeight:600,color:'var(--text-heading)'}}>isSLMarket</span> ({isSLMarket ? <span style={{color:'var(--accent-dark)',fontWeight:600}}>YES →</span> : <span style={{color:'var(--danger)'}}>NO →</span>}) <span style={{color:'var(--accent-dark)',fontWeight:600}}>auto PASS</span></div>
                  <div>else if <span style={{fontWeight:600,color:'var(--text-heading)'}}>!hasPriceAction</span> ({!hasPriceAction ? <span style={{color:'var(--accent-dark)',fontWeight:600}}>YES →</span> : <span style={{color:'var(--danger)'}}>NO →</span>}) <span style={{color:'var(--accent-dark)',fontWeight:600}}>auto PASS</span></div>
                  <div>else → <span style={{fontWeight:600}}>currentLtp {isLong ? '>=' : '<='} breakoutEntryPrice</span> ?</div>
                </FormulaBox>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {isSLMarket
                    ? <PassBadge label="SL-Market → Always PASS" passed={true} />
                    : !hasPriceAction
                      ? <PassBadge label="No Price Action → Always PASS" passed={true} />
                      : <PassBadge label="LTP >= Entry → PASS check" passed={true} />
                  }
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
      <div style={{ position: 'relative', paddingLeft: '54px' }}>
        <div style={{ position: 'absolute', left: '20px', top: '0', bottom: '0', width: '2px', background: 'var(--border-light)' }} />
        <div style={{ position: 'relative' }}>
          <StageCircle><Shield size={12} /></StageCircle>
          <StageCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <StageTag label="Stage 3" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Position Sizing & Risk Checks</span>
            </div>

            <FormulaBox>
              <div>capitalAtRisk = clientCapital × (<span style={{fontWeight:600}}>{rm.riskPerTrade || 3}%</span>)</div>
              <div style={{color:'var(--text-subtle)'}}>── capped at DB capital limit</div>
              <div>quantity = floor(capitalAtRisk / slPoints)</div>
              {hasBuyingPower && <div style={{color:'var(--text-secondary)'}}>then: min(qty, floor(capital / (entryPrice × misMarginRate)))</div>}
            </FormulaBox>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-subtle)', fontWeight: 600, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Risk Per Trade</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)' }}>{rm.riskPerTrade || 3}%</div>
                <div style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>of available capital</div>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-subtle)', fontWeight: 600, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>SL ({sl.type || 'Fixed %'})</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)' }}>
                  {sl.type === 'Fixed Points' ? `${sl.fixedPoints || 10} pts` : `${sl.fixedPercent || 1}%`}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>of entry price</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
      <div style={{ position: 'relative', paddingLeft: '54px' }}>
        <div style={{ position: 'absolute', left: '20px', top: '0', bottom: '0', width: '2px', background: 'var(--border-light)' }} />
        <div style={{ position: 'relative' }}>
          <StageCircle><Target size={12} /></StageCircle>
          <StageCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <StageTag label="Stage 4" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>OCO — SL & Target Orders</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>Stop Loss</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '2px' }}>
                  {sl.type || 'Fixed %'}: {sl.fixedPercent || 1}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-subtle)', marginBottom: '6px' }}>
                  {isLong ? 'Entry −' : 'Entry +'} SL pts → SL-Market SELL
                </div>
                {hasTrailingSL
                  ? <PassBadge label={`Trail: ${sl.trailingSL}%`} passed={true} />
                  : <PassBadge label="Trailing: OFF" passed={false} />
                }
              </div>
              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>Target</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '2px' }}>
                  {tg.type || 'Profit %'}: {tg.profitPercent || 2}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-subtle)', marginBottom: '6px' }}>
                  {isLong ? 'Entry × ' : 'Entry × '}(1 + {tg.profitPercent || 2}%) → LIMIT SELL
                </div>
                {hasTrailingTarget
                  ? <PassBadge label={`Trail: ${tg.trailingTarget}%`} passed={true} />
                  : <PassBadge label="Trailing: OFF" passed={false} />
                }
              </div>
            </div>

            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border-light)', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <strong style={{color:'var(--text-heading)'}}>Order Setup:</strong>{' '}
              Entry {ta.orderType || 'Market'} | SL-Market SELL | LIMIT SELL | Product: MIS
            </div>
          </StageCard>
        </div>
      </div>

      <Connector />

      {/* Stage 5 */}
      <div style={{ position: 'relative', paddingLeft: '54px' }}>
        <div style={{ position: 'absolute', left: '20px', top: '0', bottom: '0', width: '2px', background: 'var(--border-light)' }} />
        <div style={{ position: 'relative' }}>
          <StageCircle><Activity size={12} /></StageCircle>
          <StageCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <StageTag label="Stage 5" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Position Monitor</span>
              <div style={{ marginLeft: 'auto' }}><TimingTag time={`${entryTime} — ${exitTime}`} /></div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-body)', lineHeight: '2', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'var(--text-subtle)'}} />
                Check {isSLMarket ? 'SL/Target' : ''} order status via Kite API (every {checkInterval}s)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'var(--text-subtle)'}} />
                Trailing SL: {hasTrailingSL ? `+${sl.trailingSL}% per move` : 'OFF'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'var(--text-subtle)'}} />
                Trailing Target: {hasTrailingTarget ? `+${tg.trailingTarget}% per move` : 'OFF'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'var(--text-subtle)'}} />
                Circuit breakers: Max loss ₹{rm.maxDailyLoss || 5000} | Max profit ₹{rm.maxDailyProfit || 15000}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'var(--text-subtle)'}} />
                Force square-off at <strong style={{color:'var(--text-heading)'}}>{exitTime}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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

      <Connector />

      {/* Stage 6: Exit */}
      <div style={{ position: 'relative', paddingLeft: '54px', marginTop: '0' }}>
        <div style={{ position: 'absolute', left: '20px', top: '0', height: '30px', width: '2px', background: 'var(--border-light)' }} />
        <div style={{ position: 'relative' }}>
          <StageCircle><AlertTriangle size={12} /></StageCircle>
          <StageCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <StageTag label="Exit" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Square Off</span>
              <div style={{ marginLeft: 'auto' }}><TimingTag time={exitTime} /></div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-body)', lineHeight: '1.7' }}>
              SELL MARKET at {exitTime}. Pehle bhi exit ho sakta hai agar SL trigger ho, Target hit ho,
              ya daily loss/profit limit cross ho jaye.
            </div>
          </StageCard>
        </div>
      </div>
    </div>
  );
}
