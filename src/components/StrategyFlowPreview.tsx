'use client';
import React from 'react';
import { Clock, TrendingUp, Shield, Target, Activity, Eye } from 'lucide-react';

interface StrategyConfig {
  basicInfo?: any;
  tradeAction?: any;
  stoploss?: any;
  target?: any;
  riskManagement?: any;
  conditions?: any[];
}

interface FlowStepProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  color: string;
}

const FlowStep = ({ icon, title, children, color }: FlowStepProps) => (
  <div style={{ display: 'flex', gap: '14px', position: 'relative' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '36px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${color}, ${color}dd)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: `0 2px 8px ${color}33` }}>
        {icon}
      </div>
    </div>
    <div style={{ flex: 1, padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', marginBottom: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>{title}</div>
      {children}
    </div>
  </div>
);

const Badge = ({ label, value, color = 'var(--primary)' }: { label: string; value: string | number; color?: string }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '6px', background: `${color}11`, fontSize: '11px', fontWeight: 600, color, border: `1px solid ${color}22` }}>
    <span style={{ opacity: 0.7 }}>{label}:</span>
    <span>{value}</span>
  </div>
);

export default function StrategyFlowPreview({ config }: { config: StrategyConfig }) {
  const bi = config.basicInfo || {};
  const ta = config.tradeAction || {};
  const sl = config.stoploss || {};
  const tg = config.target || {};
  const rm = config.riskManagement || {};
  const conds = config.conditions || [];

  const hasTrailingSL = sl.trailingSL > 0;
  const hasTrailingTarget = tg.trailingTarget > 0;
  const hasKillSwitch = rm.killSwitch;
  const condCount = conds.length;

  const slLabel = sl.type === 'Fixed %' ? `${sl.fixedPercent || 1}%` :
    sl.type === 'Fixed Points' ? `${sl.fixedPoints || 10} pts` :
    sl.type === 'Risk %' ? `${sl.riskPercent || 1}%` :
    sl.type === 'Trailing SL' ? `${sl.trailingSL > 0 ? sl.trailingSL + '% (active)' : 'Disabled'}` : '—';

  const tgLabel = tg.type === 'Profit %' ? `${tg.profitPercent || 2}%` :
    tg.type === 'Risk Reward Ratio' ? `1:${tg.riskRewardRatio || 2}` :
    tg.type === 'Trailing Target' ? `${tg.trailingTarget > 0 ? tg.trailingTarget + '% (active)' : 'Disabled'}` :
    tg.type === 'Partial Exit' ? `${tg.partialExit || 100}%` : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <Eye size={14} />
        </div>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Strategy Flow</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Live preview based on current config</span>
      </div>

      <FlowStep icon={<Clock size={16} />} title="Pre-Select" color="#0ea5e9">
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Badge label="Time" value={bi.preSelectTime || '09:15'} color="#0ea5e9" />
          <Badge label="Segment" value={bi.segment || '—'} color="#0ea5e9" />
          <Badge label="Pick" value={`${bi.selectPosition || 1}${['st','nd','rd'][(bi.selectPosition||1)-1] || 'th'} stock`} color="#0ea5e9" />
          <Badge label="Conditions" value={condCount > 0 ? `${condCount} rules` : 'None (auto)'} color={condCount > 0 ? '#f59e0b' : '#94a3b8'} />
        </div>
      </FlowStep>

      <FlowStep icon={<TrendingUp size={16} />} title="Breakout Entry" color="#8b5cf6">
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Badge label="Candle" value={ta.candlePriceType || 'high'} color="#8b5cf6" />
          <Badge label="Buffer" value={ta.bufferPercent !== undefined && ta.bufferPercent !== -1 ? `${ta.bufferPercent}%` : '0%'} color="#8b5cf6" />
          <Badge label="Order" value={ta.orderType || 'Market'} color="#8b5cf6" />
          <Badge label="Action" value={ta.action || 'Long'} color={ta.action === 'Sell' || ta.action === 'Short' ? '#ef4444' : '#059669'} />
        </div>
      </FlowStep>

      <FlowStep icon={<Shield size={16} />} title="Position Sizing" color="#059669">
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Badge label="Allocation" value={`${rm.capitalAllocation || 10}%`} color="#059669" />
          <Badge label="Risk/Trade" value={`${rm.riskPerTrade || 3}%`} color="#059669" />
          <Badge label="SL Points" value={slLabel} color="#059669" />
          <Badge label="Max Pos" value={rm.maxOpenPositions || 3} color="#059669" />
          <Badge label="Kill Switch" value={hasKillSwitch ? 'ON' : 'OFF'} color={hasKillSwitch ? '#ef4444' : '#94a3b8'} />
        </div>
        <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
          Qty = floor(capitalAtRisk / slPoints)
        </div>
      </FlowStep>

      <FlowStep icon={<Target size={16} />} title="SL & Target" color="#dc2626">
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Badge label="SL Type" value={sl.type || 'Fixed %'} color="#dc2626" />
          <Badge label="SL Value" value={slLabel} color="#dc2626" />
          <Badge label="Target Type" value={tg.type || 'Profit %'} color="#059669" />
          <Badge label="Target" value={tgLabel} color="#059669" />
          <Badge label="Trailing SL" value={hasTrailingSL ? `${sl.trailingSL}%` : 'OFF'} color={hasTrailingSL ? '#f59e0b' : '#94a3b8'} />
          <Badge label="Trailing Tgt" value={hasTrailingTarget ? `${tg.trailingTarget}%` : 'OFF'} color={hasTrailingTarget ? '#f59e0b' : '#94a3b8'} />
        </div>
      </FlowStep>

      <FlowStep icon={<Activity size={16} />} title="OCO Orders" color="#f59e0b">
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Badge label="Entry" value={ta.orderType || 'Market'} color="#f59e0b" />
          <Badge label="SL" value="SL-Market (SELL)" color="#f59e0b" />
          <Badge label="Target" value="LIMIT (SELL)" color="#f59e0b" />
          <Badge label="Product" value="MIS" color="#f59e0b" />
        </div>
      </FlowStep>

      <FlowStep icon={<Eye size={16} />} title="Monitor" color="#6366f1">
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Badge label="Interval" value={`${bi.checkIntervalSec || 60}s`} color="#6366f1" />
          <Badge label="Exit Time" value={bi.exitTime || '15:15'} color="#6366f1" />
          <Badge label="Max Loss" value={`₹${rm.maxDailyLoss || 5000}`} color="#6366f1" />
          <Badge label="Max Profit" value={`₹${rm.maxDailyProfit || 15000}`} color="#6366f1" />
        </div>
      </FlowStep>
    </div>
  );
}
