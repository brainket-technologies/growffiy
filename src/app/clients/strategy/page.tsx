// ============================================================
// ⚠️  CLIENT DEMO STRATEGY PAGE — NOT CONNECTED TO TRADING
// ============================================================
// This page is for CLIENT-SIDE demo strategy configuration ONLY.
// It uses the `demo_stttgry` DB table.
//
// 🚫 This page has NO connection to:
//   - Live trading engine or algo bot
//   - Broker APIs (Zerodha/Kite)
//   - Real order placement or execution
//
// ✅ It is purely for demo/configuration purposes.
//    For real strategy management, see: /admin/strategies
// ============================================================

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';
import { Card } from '../../../shared/components/views/Card';
import { Button } from '../../../shared/components/views/Button';
import { Loader } from '../../../shared/components/views/Loader';
import {
  Play,
  TrendingUp,
  Eye,
  Edit3,
  Copy,
  Trash2,
  Plus,
  ArrowLeft,
  Settings,
  ShieldAlert,
  Users,
  Terminal,
  Activity,
  CheckCircle,
  FileCode,
  AlertCircle,
  Save,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import StrategyFlowPreview from '../../../shared/components/StrategyFlowPreview';
import StrategyTestPanel from '../../../shared/components/StrategyTestPanel';

interface StrategyCondition {
  logical: 'AND' | 'OR';
  indicator: string;
  operator: string;
  value: string;
}

interface LegTradeAction {
  action: 'Long' | 'Short' | 'Buy' | 'Sell';
  orderType: 'Market' | 'Limit' | 'SL-Limit' | 'SL-Market';
  bufferPercent: number;
  marketProtection?: number;
  candlePriceType: 'open' | 'high' | 'low' | 'close';
}

interface LegConfig {
  name: string;
  enabled: boolean;
  entryTime: string;
  timeframe: string;
  tradeAction: LegTradeAction;
}

interface StrategyConfig {
  basicInfo: {
    name: string;
    description: string;
    tradeType: 'Intraday' | 'Swing' | 'Positional';
    exchange: 'NSE' | 'BSE';
    segment: 'Cash' | 'Equity' | 'Futures' | 'Options' | 'NSE F&O' | 'Nifty 50' | 'Bank Nifty';
    preSelectTime: string;
    exitTime: string;
    maxTradesPerDay: number;
    selectPosition: number;
    checkIntervalSec: number;
    status: 'active' | 'inactive';
  };
  legs: LegConfig[];
  stoploss: {
    type: 'Fixed %' | 'Fixed Points' | 'Trailing SL' | 'Risk %';
    orderType: 'Market' | 'Limit' | 'SL';
    fixedPercent: number;
    fixedPoints: number;
    trailingSL: number;
    riskPercent: number;
  };
  target: {
    type: 'Profit %' | 'Risk Reward Ratio' | 'Partial Exit' | 'Trailing Target';
    profitPercent: number;
    riskRewardRatio: number;
    partialExit: number;
    trailingTarget: number;
  };
  riskManagement: {
    capitalAllocation: number;
    riskPerTrade: number;
    misMarginRate: number;
    maxDailyLoss: number;
    maxDailyProfit: number;
    maxOpenPositions: number;
    killSwitch: boolean;
  };
  conditions: StrategyCondition[];
}

const INDICATORS = [
  'RSI', 'EMA', 'SMA', 'VWAP', 'MACD', 'SuperTrend', 'ADX', 'Volume', 'Open Interest',
  'Previous High', 'Previous Low', 'Previous Close', 'Gap Up', 'Gap Down',
  'Pre Open Price', 'Pre Open Volume', 'Pre Open Change %', 'ATR', 'Bollinger Bands',
  'Price Action', 'Candle Pattern'
];

const INITIAL_CONFIG: StrategyConfig = {
  basicInfo: {
    name: '',
    description: '',
    tradeType: 'Intraday',
    exchange: 'NSE',
    segment: 'NSE F&O',
    preSelectTime: '09:15',
    exitTime: '15:15',
    maxTradesPerDay: 3,
    selectPosition: 1,
    checkIntervalSec: 60,
    status: 'inactive'
  },
  legs: [{
    name: 'Leg 1',
    enabled: true,
    entryTime: '09:20:30',
    timeframe: '5m',
    tradeAction: {
      action: 'Long',
      orderType: 'SL-Market',
      bufferPercent: 0.1,
      marketProtection: -1,
      candlePriceType: 'high'
    }
  }],
  stoploss: {
    type: 'Fixed %',
    orderType: 'Market',
    fixedPercent: 1,
    fixedPoints: 10,
    trailingSL: -1,
    riskPercent: 1.0
  },
  target: {
    type: 'Profit %',
    profitPercent: 2,
    riskRewardRatio: 2.0,
    partialExit: 100,
    trailingTarget: -1
  },
  riskManagement: {
    capitalAllocation: -1,
    riskPerTrade: 3,
    misMarginRate: 0.20,
    maxDailyLoss: -1,
    maxDailyProfit: -1,
    maxOpenPositions: 3,
    killSwitch: false
  },
  conditions: []
};

const TEMPLATES = [
  {
    id: 'tmpl-1',
    name: 'Intraday Momentum Trend Follower',
    description: 'RSI-based momentum filter combined with double EMA cross-over for strong trend capturing.',
    config: {
      ...INITIAL_CONFIG,
      basicInfo: {
        ...INITIAL_CONFIG.basicInfo,
        name: 'Intraday Momentum Trend Follower',
        description: 'RSI-based momentum filter combined with double EMA cross-over for strong trend capturing.'
      }
    }
  },
  {
    id: 'tmpl-2',
    name: 'Opening Range Breakout (ORB)',
    description: 'Triggers trades when price breaks above or below the opening 15-minute high or low.',
    config: {
      ...INITIAL_CONFIG,
      basicInfo: {
        ...INITIAL_CONFIG.basicInfo,
        name: 'Opening Range Breakout (ORB)',
        description: 'Triggers trades when price breaks above or below the opening 15-minute high or low.'
      }
    }
  }
];

export interface ClientStrategyPageProps {
  initialViewMode?: 'list' | 'create' | 'edit';
}

export default function ClientStrategyPage({ initialViewMode = 'list' }: ClientStrategyPageProps) {
  const { colors, activeUser } = useAppViewModel();
  const router = useRouter();
  const pathname = usePathname();
  const isOnAddPage = pathname === '/clients/strategy/add';
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'detail' | 'preview-flow' | 'preview-test'>(initialViewMode);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  
  const [strategies, setStrategies] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState<boolean>(false);

  const [selectedStrategy, setSelectedStrategy] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [formErrors, setFormErrors] = useState<string>('');
  const [formData, setFormData] = useState<StrategyConfig>(INITIAL_CONFIG);

  const loadStrategies = async () => {
    if (!activeUser?.id) return;
    setDbLoading(true);
    try {
      const res = await fetch(`/api/clients/demo-strategies?userId=${activeUser.id}`);
      const data = await res.json();
      if (data.success) {
        setStrategies(data.strategies || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (activeUser?.id) {
      loadStrategies();
    } else {
      setDbLoading(false);
    }
  }, [activeUser?.id]);

  const handleCreateNew = () => {
    setFormData(INITIAL_CONFIG);
    setViewMode('create');
  };

  const handleEdit = (strat: any) => {
    try {
      const config = JSON.parse(strat.configJson);
      setFormData(config);
      setSelectedStrategy(strat);
      setViewMode('edit');
    } catch (e) {
      console.error(e);
    }
  };

  const handleClone = async (strat: any) => {
    try {
      const res = await fetch('/api/clients/demo-strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser.id,
          name: `${strat.name} (Copy)`,
          description: strat.description,
          status: strat.status,
          configJson: strat.configJson
        })
      });
      const data = await res.json();
      if (data.success) {
        setStrategies([data.strategy, ...strategies]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (strat: any) => {
    if (confirm(`Are you sure you want to delete "${strat.name}"?`)) {
      try {
        const res = await fetch(`/api/clients/demo-strategies/${strat.id}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
          setStrategies(strategies.filter(s => s.id !== strat.id));
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleToggleStatus = async (strat: any) => {
    const nextStatus = strat.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/clients/demo-strategies/${strat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setStrategies(strategies.map(s => s.id === strat.id ? data.strategy : s));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.basicInfo.name.trim()) {
      setFormErrors('Strategy Name is required');
      return;
    }

    try {
      if (viewMode === 'create') {
        const res = await fetch('/api/clients/demo-strategies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: activeUser.id,
            name: formData.basicInfo.name,
            description: formData.basicInfo.description,
            status: formData.basicInfo.status || 'inactive',
            configJson: JSON.stringify(formData)
          })
        });
        const data = await res.json();
        if (data.success) {
          setStrategies([data.strategy, ...strategies]);
        }
      } else {
        const res = await fetch(`/api/clients/demo-strategies/${selectedStrategy.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.basicInfo.name,
            description: formData.basicInfo.description,
            status: formData.basicInfo.status,
            configJson: JSON.stringify(formData)
          })
        });
        const data = await res.json();
        if (data.success) {
          setStrategies(strategies.map(s => s.id === selectedStrategy.id ? data.strategy : s));
        }
      }
      if (isOnAddPage) {
        router.push('/clients/strategy');
      } else {
        setViewMode('list');
      }
    } catch (err: any) {
      setFormErrors(err.message || 'Failed to save strategy');
    }
  };

  const handleLoadTemplate = (tmpl: any) => {
    setFormData({
      ...tmpl.config,
      basicInfo: {
        ...tmpl.config.basicInfo,
        name: tmpl.name,
        description: tmpl.description
      }
    });
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        { logical: 'AND', indicator: 'RSI', operator: '>', value: '50' }
      ]
    });
  };

  const removeCondition = (idx: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== idx)
    });
  };

  const handleConditionChange = (idx: number, field: keyof StrategyCondition, val: string) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.map((cond, i) => {
        if (i === idx) {
          return { ...cond, [field]: val };
        }
        return cond;
      })
    });
  };

  const addLeg = () => {
    setFormData({
      ...formData,
      legs: [
        ...formData.legs,
        {
          name: `Leg ${formData.legs.length + 1}`,
          enabled: true,
          entryTime: '09:20:00',
          timeframe: '5m',
          tradeAction: {
            action: 'Long',
            orderType: 'Market',
            bufferPercent: 0.1,
            candlePriceType: 'close'
          }
        }
      ]
    });
  };

  const removeLeg = (idx: number) => {
    setFormData({
      ...formData,
      legs: formData.legs.filter((_, i) => i !== idx)
    });
  };

  const handleLegChange = (legIdx: number, path: string, val: any) => {
    setFormData({
      ...formData,
      legs: formData.legs.map((leg, idx) => {
        if (idx !== legIdx) return leg;
        if (path.startsWith('tradeAction.')) {
          const field = path.split('.')[1];
          return {
            ...leg,
            tradeAction: { ...leg.tradeAction, [field]: val }
          };
        }
        return { ...leg, [path]: val };
      })
    });
  };

  if (!activeUser) {
    return <Loader title="Loading profile" text="Please wait..." fullscreen={false} />;
  }

  if (dbLoading) {
    return <Loader title="Loading strategies" text="Syncing configuration details from the server..." fullscreen={false} />;
  }

  return (
    <div className="client-strategy-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '100%', overflowX: 'hidden' }}>
      <style>{`
        .client-strategy-container input,
        .client-strategy-container select,
        .client-strategy-container textarea {
          padding: 10px 14px !important;
          border-radius: 8px !important;
          border: 1px solid var(--border) !important;
          background-color: var(--bg-white) !important;
          color: var(--text-heading) !important;
          outline: none !important;
          font-size: 13px !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }
        .client-strategy-container input:focus,
        .client-strategy-container select:focus,
        .client-strategy-container textarea:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px rgba(18, 82, 171, 0.12) !important;
        }
        .client-strategy-container label {
          font-size: 12.5px !important;
          font-weight: 700 !important;
          color: var(--text-secondary) !important;
          margin-bottom: 4px !important;
        }
        .client-strategy-container table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .client-strategy-container table th {
          padding: 12px;
          border-bottom: 1px solid var(--border-color);
          text-align: left;
          color: var(--text-secondary);
          font-weight: 700;
        }
        .client-strategy-container table td {
          padding: 12px;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary);
        }
        .client-strategy-container table tr:hover {
          background-color: var(--bg-secondary);
        }
      `}</style>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px', color: 'var(--text-heading)' }}>
            {viewMode === 'list' && 'Strategies'}
            {viewMode === 'create' && 'Create Algo Strategy'}
            {viewMode === 'edit' && 'Edit Algo Strategy'}
            {viewMode === 'preview-flow' && 'Strategy Flow Preview'}
            {viewMode === 'preview-test' && 'Strategy Test Panel'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            {viewMode === 'list' && 'Configure and monitor your advanced algorithmic strategies.'}
            {viewMode === 'create' && 'Build a new strategy block with custom entry, target, and trailing rules.'}
            {viewMode === 'edit' && 'Update your strategy block configuration.'}
          </p>
        </div>

        {(viewMode === 'create' || viewMode === 'edit') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', padding: '2px', background: 'var(--bg-secondary)' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, status: 'active' } })}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: formData.basicInfo.status === 'active' ? 'var(--accent)' : 'transparent',
                  color: formData.basicInfo.status === 'active' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, status: 'inactive' } })}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: formData.basicInfo.status === 'inactive' ? 'var(--danger)' : 'transparent',
                  color: formData.basicInfo.status === 'inactive' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                Inactive
              </button>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditorMode(viewMode);
                setViewMode('preview-flow');
              }}
            >
              <Activity size={16} /> Flow Preview
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditorMode(viewMode);
                setViewMode('preview-test');
              }}
            >
              <Terminal size={16} /> Test Strategy
            </Button>
          </div>
        )}
      </div>

      {viewMode === 'list' && (
        <>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <Card hoverable style={{ padding: '20px 22px', borderTop: '3px solid var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Strategies</span>
                <TrendingUp size={18} color="var(--accent)" />
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: 'var(--text-heading)' }}>
                {strategies.length}
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>All time registered</span>
            </Card>

            <Card hoverable style={{ padding: '20px 22px', borderTop: '3px solid #8b5cf6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Strategies</span>
                <CheckCircle size={18} color="#8b5cf6" />
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: 'var(--text-heading)' }}>
                {strategies.filter(s => s.status === 'active').length}
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Currently running</span>
            </Card>

            <Card hoverable style={{ padding: '20px 22px', borderTop: '3px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Assigned Clients</span>
                <Users size={18} color="#f59e0b" />
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: 'var(--text-heading)' }}>
                2
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Across all strategies</span>
            </Card>
          </div>

          {/* Strategies Table */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-heading)' }}>All Strategies</h4>
            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '20px',
              alignItems: 'center',
              background: 'var(--bg-secondary)',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              <input
                type="text"
                placeholder="Search strategies..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  outline: 'none',
                  minWidth: '130px',
                  flexShrink: 0
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ padding: '12px' }}>Strategy</th>
                    <th style={{ padding: '12px' }}>Segment</th>
                    <th style={{ padding: '12px' }}>Type</th>
                    <th style={{ padding: '12px' }}>Timeframe</th>
                    <th style={{ padding: '12px' }}>Clients</th>
                    <th style={{ padding: '12px' }}>Trades</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {strategies.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                        No strategies found. Click <strong>Add Strategy</strong> in the sidebar to get started.
                      </td>
                    </tr>
                  ) : (
                    strategies
                      .filter(s => {
                        const matchesStatus = filterType === 'all' || s.status === filterType;
                        const matchesQuery = searchQuery === '' || s.name.toLowerCase().includes(searchQuery.toLowerCase());
                        return matchesStatus && matchesQuery;
                      })
                      .map(strat => {
                        let segment = 'NSE F&O', tradeType = 'Intraday', timeframe = 'N/A';
                        try {
                          const parsed = JSON.parse(strat.configJson);
                          segment = parsed.basicInfo?.segment || segment;
                          tradeType = parsed.basicInfo?.tradeType || tradeType;
                          timeframe = parsed.basicInfo?.timeframe || timeframe;
                        } catch (e) {}

                        return (
                          <tr key={strat.id}>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{strat.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{strat.description}</div>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#0284c7', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{segment}</span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{tradeType}</span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{timeframe}</span>
                            </td>
                            <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>2</td>
                            <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-heading)' }}>46</td>
                            <td style={{ padding: '12px' }}>
                              <button
                                onClick={() => handleToggleStatus(strat)}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  borderRadius: '20px',
                                  border: '1px solid',
                                  cursor: 'pointer',
                                  borderColor: strat.status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.3)',
                                  background: strat.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.08)',
                                  color: strat.status === 'active' ? '#10b981' : 'var(--text-secondary)'
                                }}
                              >
                                {strat.status === 'active' ? '● ACTIVE' : '○ INACTIVE'}
                              </button>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => handleEdit(strat)} title="Edit" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}><Edit3 size={13} /></button>
                                <button onClick={() => handleClone(strat)} title="Clone" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}><Copy size={13} /></button>
                                <button onClick={() => handleDelete(strat)} title="Delete" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {(viewMode === 'create' || viewMode === 'edit') && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {formErrors && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#ef4444', fontSize: '13px' }}>
              <AlertCircle size={16} />
              <span>{formErrors}</span>
            </div>
          )}

          {viewMode === 'create' && (
            <Card style={{ padding: '20px', borderLeft: '4px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-heading)' }}>
                <TrendingUp size={16} color="var(--accent)" /> Start with a Template Config (Optional)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {TEMPLATES.map(tmpl => (
                  <div
                    key={tmpl.id}
                    onClick={() => handleLoadTemplate(tmpl)}
                    style={{
                      cursor: 'pointer',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-white)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <h5 style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      {tmpl.name}
                    </h5>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '6px', marginBottom: 0, lineHeight: '1.4' }}>{tmpl.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Basic Info */}
              <Card style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', color: 'var(--text-heading)' }}>
                  <Settings size={16} color="var(--accent)" /> Basic Strategy Info
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label>Strategy Name *</label>
                    <input
                      type="text"
                      value={formData.basicInfo.name}
                      onChange={(e) => setFormData({
                        ...formData,
                        basicInfo: { ...formData.basicInfo, name: e.target.value }
                      })}
                      placeholder="e.g. Pre-Open Momentum Breakout"
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label>Description</label>
                    <textarea
                      value={formData.basicInfo.description}
                      onChange={(e) => setFormData({
                        ...formData,
                        basicInfo: { ...formData.basicInfo, description: e.target.value }
                      })}
                      placeholder="Explain the strategy objective..."
                    />
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '10px', display: 'block' }}>MARKET SELECTION</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label>Trade Type</label>
                        <select
                          value={formData.basicInfo.tradeType}
                          onChange={(e: any) => setFormData({
                            ...formData,
                            basicInfo: { ...formData.basicInfo, tradeType: e.target.value }
                          })}
                        >
                          <option value="Intraday">Intraday</option>
                          <option value="Swing">Swing</option>
                          <option value="Positional">Positional</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label>Exchange</label>
                        <select
                          value={formData.basicInfo.exchange}
                          onChange={(e: any) => setFormData({
                            ...formData,
                            basicInfo: { ...formData.basicInfo, exchange: e.target.value }
                          })}
                        >
                          <option value="NSE">NSE</option>
                          <option value="BSE">BSE</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label>Segment</label>
                        <select
                          value={formData.basicInfo.segment}
                          onChange={(e: any) => setFormData({
                            ...formData,
                            basicInfo: { ...formData.basicInfo, segment: e.target.value }
                          })}
                        >
                          <option value="Cash">Cash</option>
                          <option value="Equity">Equity</option>
                          <option value="Futures">Futures</option>
                          <option value="Options">Options</option>
                          <option value="NSE F&O">NSE F&O</option>
                          <option value="Nifty 50">Nifty 50</option>
                          <option value="Bank Nifty">Bank Nifty</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '10px', display: 'block' }}>TIMING</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label>Entry Time</label>
                        <input
                          type="time"
                          value={formData.basicInfo.preSelectTime}
                          onChange={(e) => setFormData({
                            ...formData,
                            basicInfo: { ...formData.basicInfo, preSelectTime: e.target.value }
                          })}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label>Exit Time</label>
                        <input
                          type="time"
                          value={formData.basicInfo.exitTime}
                          onChange={(e) => setFormData({
                            ...formData,
                            basicInfo: { ...formData.basicInfo, exitTime: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Dynamic Entry Conditions */}
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-heading)' }}>
                    <FileCode size={16} color="var(--accent)" /> Dynamic Entry Conditions
                  </h3>
                  <Button type="button" variant="secondary" onClick={addCondition} style={{ padding: '6px 12px', fontSize: '12px' }}>
                    + Add Rule
                  </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {formData.conditions.map((cond, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {idx > 0 && (
                        <select
                          value={cond.logical}
                          onChange={(e: any) => handleConditionChange(idx, 'logical', e.target.value)}
                          style={{ fontSize: '12px' }}
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      )}
                      <select
                        value={cond.indicator}
                        onChange={(e) => handleConditionChange(idx, 'indicator', e.target.value)}
                        style={{ flex: 1, fontSize: '12px' }}
                      >
                        {INDICATORS.map(ind => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                      <select
                        value={cond.operator}
                        onChange={(e) => handleConditionChange(idx, 'operator', e.target.value)}
                        style={{ fontSize: '12px' }}
                      >
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value="==">==</option>
                        <option value=">=">&gt;=</option>
                        <option value="<=">&lt;=</option>
                      </select>
                      <input
                        type="text"
                        value={cond.value}
                        onChange={(e) => handleConditionChange(idx, 'value', e.target.value)}
                        style={{ width: '80px', fontSize: '12px' }}
                        placeholder="50"
                      />
                      <button type="button" onClick={() => removeCondition(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {formData.conditions.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      No conditions set. Runs at Entry Time.
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Legs Configuration */}
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-heading)' }}>
                    <Play size={16} color="#10b981" /> Legs
                  </h3>
                  <Button type="button" variant="secondary" onClick={addLeg} style={{ padding: '6px 12px', fontSize: '12px' }}>
                    + Add Leg
                  </Button>
                </div>
                {formData.legs.map((leg, legIdx) => (
                  <div key={legIdx} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '12px', background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <input
                        type="text"
                        value={leg.name}
                        onChange={(e) => handleLegChange(legIdx, 'name', e.target.value)}
                        style={{ fontWeight: 700, fontSize: '14px', border: 'none', background: 'transparent', outline: 'none', width: '120px', color: 'var(--text-heading)' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleLegChange(legIdx, 'enabled', !leg.enabled)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          {leg.enabled ? <ToggleRight size={24} color="#10b981" /> : <ToggleLeft size={24} color="var(--text-secondary)" />}
                        </button>
                        {formData.legs.length > 1 && (
                          <button type="button" onClick={() => removeLeg(legIdx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label>Entry Time</label>
                        <input type="time" value={leg.entryTime} onChange={(e) => handleLegChange(legIdx, 'entryTime', e.target.value)}
                          style={{ width: '100%', fontSize: '12px' }} />
                      </div>
                      <div>
                        <label>Timeframe</label>
                        <select value={leg.timeframe} onChange={(e) => handleLegChange(legIdx, 'timeframe', e.target.value)}
                          style={{ width: '100%', fontSize: '12px' }}>
                          <option value="1m">1m</option>
                          <option value="5m">5m</option>
                          <option value="15m">15m</option>
                        </select>
                      </div>
                      <div>
                        <label>Action</label>
                        <select value={leg.tradeAction.action} onChange={(e) => handleLegChange(legIdx, 'tradeAction.action', e.target.value)}
                          style={{ width: '100%', fontSize: '12px' }}>
                          <option value="Long">Long</option>
                          <option value="Short">Short</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </Card>

              {/* Stoploss & Target */}
              <Card>
                <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', color: 'var(--text-heading)' }}>
                  <ShieldAlert size={16} color="#ef4444" /> Target & Stoploss Rules
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label>Stoploss Type</label>
                    <select
                      value={formData.stoploss.type}
                      onChange={(e: any) => setFormData({
                        ...formData,
                        stoploss: { ...formData.stoploss, type: e.target.value }
                      })}
                    >
                      <option value="Fixed %">Fixed %</option>
                      <option value="Fixed Points">Fixed Points</option>
                      <option value="Trailing SL">Trailing SL</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label>SL Target Value</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.stoploss.type === 'Fixed Points' ? formData.stoploss.fixedPoints : formData.stoploss.fixedPercent}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (formData.stoploss.type === 'Fixed Points') {
                          setFormData({ ...formData, stoploss: { ...formData.stoploss, fixedPoints: val } });
                        } else {
                          setFormData({ ...formData, stoploss: { ...formData.stoploss, fixedPercent: val } });
                        }
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label>Target Profit Type</label>
                    <select
                      value={formData.target.type}
                      onChange={(e: any) => setFormData({
                        ...formData,
                        target: { ...formData.target, type: e.target.value }
                      })}
                    >
                      <option value="Profit %">Profit %</option>
                      <option value="Risk Reward Ratio">Risk Reward Ratio</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label>Target Value</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.target.type === 'Risk Reward Ratio' ? formData.target.riskRewardRatio : formData.target.profitPercent}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (formData.target.type === 'Risk Reward Ratio') {
                          setFormData({ ...formData, target: { ...formData.target, riskRewardRatio: val } });
                        } else {
                          setFormData({ ...formData, target: { ...formData.target, profitPercent: val } });
                        }
                      }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <Button type="button" variant="secondary" onClick={() => isOnAddPage ? router.push('/clients/strategy') : setViewMode('list')}>Cancel</Button>
            <Button type="submit"><Save size={16} /> Save Strategy</Button>
          </div>
        </form>
      )}

      {viewMode === 'preview-flow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <button
              type="button"
              onClick={() => setViewMode(editorMode)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', marginBottom: '6px', padding: 0 }}
            >
              <ArrowLeft size={14} /> Back to Strategy Editor
            </button>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)' }}>Strategy Flow Preview</h1>
          </div>
          <Card style={{ padding: '24px' }}>
            <StrategyFlowPreview config={formData as any} />
          </Card>
        </div>
      )}

      {viewMode === 'preview-test' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <button
              type="button"
              onClick={() => setViewMode(editorMode)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', marginBottom: '6px', padding: 0 }}
            >
              <ArrowLeft size={14} /> Back to Strategy Editor
            </button>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)' }}>Strategy Test Panel</h1>
          </div>
          <Card style={{ padding: '24px' }}>
            <StrategyTestPanel config={formData as any} />
          </Card>
        </div>
      )}
    </div>
  );
}
