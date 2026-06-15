'use client';

import React, { useState, useEffect } from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { Button } from '../../../views/components/Button';
import { PerformanceChart } from '../../../views/components/PerformanceChart';
import {
  Play,
  TrendingUp,
  Filter,
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
  AlertCircle
} from 'lucide-react';

interface StrategyCondition {
  logical: 'AND' | 'OR';
  indicator: string;
  operator: string;
  value: string;
}

interface StrategyConfig {
  basicInfo: {
    name: string;
    description: string;
    tradeType: 'Intraday' | 'Swing' | 'Positional';
    exchange: 'NSE' | 'BSE';
    segment: 'Cash' | 'Equity' | 'Futures' | 'Options' | 'NSE F&O';
    timeframe: string;
    entryTime: string;
    exitTime: string;
    maxTradesPerDay: number;
    status: 'active' | 'inactive';
  };
  tradeAction: {
    action: 'Buy' | 'Sell' | 'Long' | 'Short';
    orderType: 'Market' | 'Limit' | 'SL-Limit' | 'SL-Market';
    bufferPercent: number;
  };
  stoploss: {
    type: 'Fixed %' | 'Fixed Points' | 'Trailing SL' | 'Risk %';
    orderType: 'Market' | 'Limit';
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
    timeframe: '5m',
    entryTime: '09:15',
    exitTime: '15:15',
    maxTradesPerDay: 3,
    status: 'inactive'
  },
  tradeAction: {
    action: 'Long',
    orderType: 'Market',
    bufferPercent: 0.0
  },
  stoploss: {
    type: 'Fixed %',
    orderType: 'Market',
    fixedPercent: 1.0,
    fixedPoints: 10,
    trailingSL: 0.2,
    riskPercent: 1.0
  },
  target: {
    type: 'Profit %',
    profitPercent: 2.0,
    riskRewardRatio: 2.0,
    partialExit: 100,
    trailingTarget: 0.5
  },
  riskManagement: {
    capitalAllocation: 10.0,
    riskPerTrade: 1.0,
    maxDailyLoss: 5000,
    maxDailyProfit: 15000,
    maxOpenPositions: 3,
    killSwitch: false
  },
  conditions: []
};

export default function StrategiesPage() {
  const { colors } = useAppViewModel();

  // Mode state: 'list' | 'create' | 'edit' | 'detail'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [strategies, setStrategies] = useState<any[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<any | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<StrategyConfig>(INITIAL_CONFIG);
  const [formErrors, setFormErrors] = useState<string>('');

  // Active sub-tab in Detail view
  const [detailTab, setDetailTab] = useState<'overview' | 'assignment' | 'logs'>('overview');

  // Load Strategies, Templates, Clients
  const loadData = async () => {
    setIsLoading(true);
    try {
      const resStrat = await fetch('/api/admin/strategies');
      const dataStrat = await resStrat.json();
      if (dataStrat.success) setStrategies(dataStrat.strategies || []);

      const resTmpl = await fetch('/api/admin/strategies/templates');
      const dataTmpl = await resTmpl.json();
      if (dataTmpl.success) setTemplates(dataTmpl.templates || []);

      const resClients = await fetch('/api/admin/strategies/assignments');
      const dataClients = await resClients.json();
      if (dataClients.success) setClients(dataClients.clients || []);
    } catch (e) {
      console.error('Error loading strategies data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch logs when strategy is selected or log tab is active
  useEffect(() => {
    if (selectedStrategy && detailTab === 'logs') {
      fetch(`/api/admin/strategies/logs?strategyId=${selectedStrategy.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setLogs(data.logs || []);
        });
    }
  }, [selectedStrategy, detailTab]);

  const handleCreateNew = () => {
    setFormData(INITIAL_CONFIG);
    setViewMode('create');
  };

  const handleEdit = (strategy: any) => {
    try {
      const config = JSON.parse(strategy.configJson);
      setFormData(config);
    } catch (e) {
      setFormData({
        ...INITIAL_CONFIG,
        basicInfo: {
          ...INITIAL_CONFIG.basicInfo,
          name: strategy.name,
          description: strategy.description || '',
          status: strategy.status
        }
      });
    }
    setSelectedStrategy(strategy);
    setViewMode('edit');
  };

  const handleClone = async (strategyId: string) => {
    try {
      const res = await fetch(`/api/admin/strategies/${strategyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clone' })
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (strategy: any) => {
    const newStatus = strategy.status === 'active' ? 'inactive' : 'active';
    try {
      // Modify config if exists to update status inside config as well
      let parsedConfig = INITIAL_CONFIG;
      try {
        parsedConfig = JSON.parse(strategy.configJson);
      } catch (e) {}
      parsedConfig.basicInfo.status = newStatus;

      const res = await fetch(`/api/admin/strategies/${strategy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...strategy,
          status: newStatus,
          configJson: JSON.stringify(parsedConfig)
        })
      });
      const data = await res.json();
      if (data.success) {
        loadData();
        if (selectedStrategy && selectedStrategy.id === strategy.id) {
          setSelectedStrategy({ ...selectedStrategy, status: newStatus });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (strategyId: string) => {
    if (!confirm('Are you sure you want to delete this strategy?')) return;
    try {
      const res = await fetch(`/api/admin/strategies/${strategyId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setViewMode('list');
        setSelectedStrategy(null);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadTemplate = (template: any) => {
    try {
      const config = JSON.parse(template.configJson);
      setFormData(config);
      setViewMode('create');
    } catch (e) {
      console.error('Error loading template config:', e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.basicInfo.name.trim()) {
      setFormErrors('Strategy Name is required.');
      return;
    }

    const payload = {
      name: formData.basicInfo.name,
      description: formData.basicInfo.description,
      status: formData.basicInfo.status || 'inactive',
      configJson: JSON.stringify(formData)
    };

    const url = viewMode === 'edit' ? `/api/admin/strategies/${selectedStrategy.id}` : '/api/admin/strategies';
    const method = viewMode === 'edit' ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setViewMode('list');
        loadData();
      } else {
        setFormErrors(data.error || 'Failed to save strategy.');
      }
    } catch (err) {
      setFormErrors('Network error. Failed to save.');
    }
  };

  const handleConditionChange = (index: number, field: keyof StrategyCondition, value: string) => {
    const updated = [...formData.conditions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, conditions: updated });
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { logical: 'AND', indicator: 'RSI', operator: '>', value: '' }]
    });
  };

  const removeCondition = (index: number) => {
    const updated = formData.conditions.filter((_, i) => i !== index);
    setFormData({ ...formData, conditions: updated });
  };

  // Assign client logic
  const handleAssignStrategy = async (clientId: string, remove = false) => {
    if (!selectedStrategy) return;
    try {
      const res = await fetch('/api/admin/strategies/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: selectedStrategy.id,
          clientIds: [clientId],
          action: remove ? 'remove' : 'assign'
        })
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk assignment logic
  const handleBulkAssign = async (remove = false) => {
    if (!selectedStrategy || selectedClientIds.length === 0) return;
    try {
      const res = await fetch('/api/admin/strategies/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: selectedStrategy.id,
          clientIds: selectedClientIds,
          action: remove ? 'remove' : 'assign'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedClientIds([]);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleClientSelection = (clientId: string) => {
    if (selectedClientIds.includes(clientId)) {
      setSelectedClientIds(selectedClientIds.filter(id => id !== clientId));
    } else {
      setSelectedClientIds([...selectedClientIds, clientId]);
    }
  };

  const toggleSelectAllClients = () => {
    if (selectedClientIds.length === clients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(clients.map(c => c.id));
    }
  };

  // Chart configuration
  const performanceLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Today'];
  const performanceData = [12000, 24000, -5000, 18000, 31000, 42000];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            {viewMode === 'list' && 'Strategies'}
            {viewMode === 'create' && 'Create Algo Strategy'}
            {viewMode === 'edit' && `Edit Strategy: ${selectedStrategy?.name}`}
            {viewMode === 'detail' && `${selectedStrategy?.name}`}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {viewMode === 'list' && 'Deploy, configure, and monitor advanced algorithmic strategies.'}
            {viewMode === 'create' && 'Build a new strategy block with custom entry, target, and trailing rules.'}
            {viewMode === 'edit' && 'Fine-tune strategy conditions, target, stoploss, and allocation limits.'}
            {viewMode === 'detail' && (selectedStrategy?.description || 'Overview of settings, performance history, and client deployment.')}
          </p>
        </div>

        {viewMode !== 'list' ? (
          <Button variant="secondary" onClick={() => setViewMode('list')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Back to List
          </Button>
        ) : (
          <Button onClick={handleCreateNew} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Create Strategy
          </Button>
        )}
      </div>

      {/* VIEW: STRATEGY LIST */}
      {viewMode === 'list' && (
        <>
          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <Card style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Total Strategies</p>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)' }}>
                  <TrendingUp size={16} color="#38bdf8" />
                </div>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-title)', color: '#fff' }}>
                {strategies.length}
              </h3>
            </Card>
            <Card style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Active Strategies</p>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)' }}>
                  <CheckCircle size={16} color="#22c55e" />
                </div>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-title)', color: '#22c55e' }}>
                {strategies.filter(s => s.status === 'active').length}
              </h3>
            </Card>
            <Card style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Assigned Clients</p>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.1)' }}>
                  <Users size={16} color="#eab308" />
                </div>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-title)', color: '#eab308' }}>
                {clients.filter(c => c.strategyId).length}
              </h3>
            </Card>
          </div>

          {/* Main List Table */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-title)' }}>Strategy Registry</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Filter size={16} color="var(--text-secondary)" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 12px', outline: 'none', fontSize: '12px', background: 'transparent', color: 'var(--text-primary)' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Strategy Name</th>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Segment</th>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Timeframe</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Status</th>
                    <th style={{ textAlign: 'center', padding: '12px' }}>Assigned Clients</th>
                    <th style={{ textAlign: 'right', padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {strategies
                    .filter(s => filterType === 'all' || s.status === filterType)
                    .map(strat => {
                      let segment = 'N/A';
                      let tradeType = 'N/A';
                      let timeframe = 'N/A';
                      try {
                        const parsed = JSON.parse(strat.configJson);
                        segment = parsed.basicInfo?.segment || segment;
                        tradeType = parsed.basicInfo?.tradeType || tradeType;
                        timeframe = parsed.basicInfo?.timeframe || timeframe;
                      } catch (e) {}

                      const assignedCount = clients.filter(c => c.strategyId === strat.id).length;

                      return (
                        <tr key={strat.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '14px 12px', fontWeight: 600 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span>{strat.name}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400 }}>{strat.description || 'No description'}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 12px' }}>
                            <span className="badge badge-info">{segment}</span>
                          </td>
                          <td style={{ padding: '14px 12px' }}>{tradeType}</td>
                          <td style={{ padding: '14px 12px' }}>{timeframe}</td>
                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleToggleStatus(strat)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              <span className={`badge ${strat.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                {strat.status.toUpperCase()}
                              </span>
                            </button>
                          </td>
                          <td style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 600 }}>
                            {assignedCount}
                          </td>
                          <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => {
                                  setSelectedStrategy(strat);
                                  setViewMode('detail');
                                  setDetailTab('overview');
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--color-info)', cursor: 'pointer' }}
                                title="View details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleEdit(strat)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                                title="Edit"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleClone(strat.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                title="Clone"
                              >
                                <Copy size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(strat.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {strategies.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        No strategies created yet. Click "Create Strategy" or load a template above to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* VIEW: CREATE / EDIT STRATEGY FORM */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {formErrors && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: 'var(--color-danger)', fontSize: '13px' }}>
              <AlertCircle size={16} />
              <span>{formErrors}</span>
            </div>
          )}

          {viewMode === 'create' && templates.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <TrendingUp size={16} color={colors.PRIMARY} /> Start with a Template Config (Optional)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {templates.map(tmpl => (
                  <div key={tmpl.id} onClick={() => handleLoadTemplate(tmpl)} style={{ cursor: 'pointer', padding: '12px', borderRadius: '6px', border: `1px solid var(--border-color)`, background: 'transparent', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.PRIMARY} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                    <h5 style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{tmpl.name}</h5>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{tmpl.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* LEFT: BASIC INFO & TRADE ACTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Basic Information */}
              <Card>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={18} color={colors.PRIMARY} /> Basic Strategy Info
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Strategy Name *</label>
                    <input
                      type="text"
                      value={formData.basicInfo.name}
                      onChange={(e) => setFormData({
                        ...formData,
                        basicInfo: { ...formData.basicInfo, name: e.target.value }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                      placeholder="e.g. RSI Momentum Scalper"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Description</label>
                    <textarea
                      value={formData.basicInfo.description}
                      onChange={(e) => setFormData({
                        ...formData,
                        basicInfo: { ...formData.basicInfo, description: e.target.value }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none', height: '60px', resize: 'vertical' }}
                      placeholder="Explain the strategy objective..."
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Trade Type</label>
                      <select
                        value={formData.basicInfo.tradeType}
                        onChange={(e: any) => setFormData({
                          ...formData,
                          basicInfo: { ...formData.basicInfo, tradeType: e.target.value }
                        })}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        <option value="Intraday">Intraday</option>
                        <option value="Swing">Swing</option>
                        <option value="Positional">Positional</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Exchange</label>
                      <select
                        value={formData.basicInfo.exchange}
                        onChange={(e: any) => setFormData({
                          ...formData,
                          basicInfo: { ...formData.basicInfo, exchange: e.target.value }
                        })}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        <option value="NSE">NSE</option>
                        <option value="BSE">BSE</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Segment</label>
                      <select
                        value={formData.basicInfo.segment}
                        onChange={(e: any) => setFormData({
                          ...formData,
                          basicInfo: { ...formData.basicInfo, segment: e.target.value }
                        })}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Equity">Equity</option>
                        <option value="Futures">Futures</option>
                        <option value="Options">Options</option>
                        <option value="NSE F&O">NSE F&O</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Timeframe</label>
                      <input
                        type="text"
                        value={formData.basicInfo.timeframe}
                        onChange={(e) => setFormData({
                          ...formData,
                          basicInfo: { ...formData.basicInfo, timeframe: e.target.value }
                        })}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                        placeholder="e.g. 5m, 15m, 1h, 1d"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600 }}>Entry Time</label>
                      <input
                        type="time"
                        value={formData.basicInfo.entryTime}
                        onChange={(e) => setFormData({
                          ...formData,
                          basicInfo: { ...formData.basicInfo, entryTime: e.target.value }
                        })}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600 }}>Exit Time</label>
                      <input
                        type="time"
                        value={formData.basicInfo.exitTime}
                        onChange={(e) => setFormData({
                          ...formData,
                          basicInfo: { ...formData.basicInfo, exitTime: e.target.value }
                        })}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600 }}>Max Trades/Day</label>
                      <input
                        type="number"
                        value={formData.basicInfo.maxTradesPerDay}
                        onChange={(e) => setFormData({
                          ...formData,
                          basicInfo: { ...formData.basicInfo, maxTradesPerDay: Number(e.target.value) }
                        })}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Status</label>
                    <select
                      value={formData.basicInfo.status}
                      onChange={(e: any) => setFormData({
                        ...formData,
                        basicInfo: { ...formData.basicInfo, status: e.target.value }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="active">Active (Live running)</option>
                      <option value="inactive">Inactive (Suspended)</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Trade Action config */}
              <Card>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Play size={18} color="var(--color-success)" /> Trade Action
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Action Direction</label>
                    <select
                      value={formData.tradeAction.action}
                      onChange={(e: any) => setFormData({
                        ...formData,
                        tradeAction: { ...formData.tradeAction, action: e.target.value }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="Long">Long</option>
                      <option value="Short">Short</option>
                      <option value="Buy">Buy Only</option>
                      <option value="Sell">Sell Only</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Order Type</label>
                    <select
                      value={formData.tradeAction.orderType}
                      onChange={(e: any) => setFormData({
                        ...formData,
                        tradeAction: { ...formData.tradeAction, orderType: e.target.value }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="Market">Market Order</option>
                      <option value="Limit">Limit Order</option>
                      <option value="SL-Limit">SL Limit</option>
                      <option value="SL-Market">SL Market</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Buffer Price %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tradeAction.bufferPercent}
                    onChange={(e) => setFormData({
                      ...formData,
                      tradeAction: { ...formData.tradeAction, bufferPercent: Number(e.target.value) }
                    })}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    placeholder="e.g. 0.05%"
                  />
                </div>
              </Card>
            </div>

            {/* RIGHT: DYNAMIC CONDITION BUILDER & STOPLOSS/TARGET/RISK */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Dynamic Condition Builder */}
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <FileCode size={18} color="var(--color-info)" /> Dynamic Entry Conditions
                  </h3>
                  <Button type="button" variant="secondary" onClick={addCondition} style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={12} /> Add Rule
                  </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {formData.conditions.map((cond, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      {idx > 0 && (
                        <select
                          value={cond.logical}
                          onChange={(e: any) => handleConditionChange(idx, 'logical', e.target.value)}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '11px' }}
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      )}
                      <select
                        value={cond.indicator}
                        onChange={(e) => handleConditionChange(idx, 'indicator', e.target.value)}
                        style={{ flex: 2, padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '12px' }}
                      >
                        {INDICATORS.map(ind => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                      <select
                        value={cond.operator}
                        onChange={(e) => handleConditionChange(idx, 'operator', e.target.value)}
                        style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '12px' }}
                      >
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value="==">==</option>
                        <option value=">=">&gt;=</option>
                        <option value="<=">&lt;=</option>
                        <option value="crosses-above">crosses-above</option>
                        <option value="crosses-below">crosses-below</option>
                      </select>
                      <input
                        type="text"
                        value={cond.value}
                        onChange={(e) => handleConditionChange(idx, 'value', e.target.value)}
                        style={{ flex: 2, padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '12px' }}
                        placeholder="Value (e.g. 50, EMA)"
                      />
                      <button
                        type="button"
                        onClick={() => removeCondition(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {formData.conditions.length === 0 && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px' }}>
                      No conditions set. Trades will trigger instantly on entry time.
                    </p>
                  )}
                </div>
              </Card>

              {/* Stoploss & Target Module */}
              <Card>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} color="var(--color-danger)" /> Target & Stoploss Rules
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Stoploss Type</label>
                    <select
                      value={formData.stoploss.type}
                      onChange={(e: any) => setFormData({
                        ...formData,
                        stoploss: { ...formData.stoploss, type: e.target.value }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="Fixed %">Fixed %</option>
                      <option value="Fixed Points">Fixed Points</option>
                      <option value="Trailing SL">Trailing SL</option>
                      <option value="Risk %">Risk %</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>SL Target Value</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.stoploss.type === 'Fixed Points' ? formData.stoploss.fixedPoints : formData.stoploss.type === 'Trailing SL' ? formData.stoploss.trailingSL : formData.stoploss.fixedPercent}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (formData.stoploss.type === 'Fixed Points') {
                          setFormData({ ...formData, stoploss: { ...formData.stoploss, fixedPoints: val } });
                        } else if (formData.stoploss.type === 'Trailing SL') {
                          setFormData({ ...formData, stoploss: { ...formData.stoploss, trailingSL: val } });
                        } else {
                          setFormData({ ...formData, stoploss: { ...formData.stoploss, fixedPercent: val } });
                        }
                      }}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Target Profit Type</label>
                    <select
                      value={formData.target.type}
                      onChange={(e: any) => setFormData({
                        ...formData,
                        target: { ...formData.target, type: e.target.value }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="Profit %">Profit %</option>
                      <option value="Risk Reward Ratio">Risk Reward Ratio</option>
                      <option value="Partial Exit">Partial Exit</option>
                      <option value="Trailing Target">Trailing Target</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Target Value</label>
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
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                </div>
              </Card>

              {/* Risk Management */}
              <Card>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} color="var(--color-info)" /> Risk Guard System
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Capital Allocation %</label>
                    <input
                      type="number"
                      value={formData.riskManagement.capitalAllocation}
                      onChange={(e) => setFormData({
                        ...formData,
                        riskManagement: { ...formData.riskManagement, capitalAllocation: Number(e.target.value) }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Risk Per Trade %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.riskManagement.riskPerTrade}
                      onChange={(e) => setFormData({
                        ...formData,
                        riskManagement: { ...formData.riskManagement, riskPerTrade: Number(e.target.value) }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Max Open Positions</label>
                    <input
                      type="number"
                      value={formData.riskManagement.maxOpenPositions}
                      onChange={(e) => setFormData({
                        ...formData,
                        riskManagement: { ...formData.riskManagement, maxOpenPositions: Number(e.target.value) }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Kill Switch</label>
                    <select
                      value={formData.riskManagement.killSwitch ? 'true' : 'false'}
                      onChange={(e: any) => setFormData({
                        ...formData,
                        riskManagement: { ...formData.riskManagement, killSwitch: e.target.value === 'true' }
                      })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="false">Off</option>
                      <option value="true">On (Force Suspend)</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button type="button" variant="secondary" onClick={() => setViewMode('list')}>Cancel</Button>
            <Button type="submit">Save Strategy Settings</Button>
          </div>
        </form>
      )}

      {/* VIEW: STRATEGY DETAIL / OVERVIEW PANEL / ASSIGNMENT / LOGS */}
      {viewMode === 'detail' && selectedStrategy && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Quick Header Details */}
          <Card style={{ borderLeft: `5px solid ${selectedStrategy.status === 'active' ? '#22c55e' : '#ef4444'}`, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className={`badge ${selectedStrategy.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ marginBottom: '8px' }}>
                  {selectedStrategy.status.toUpperCase()}
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-title)' }}>{selectedStrategy.name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>{selectedStrategy.description || 'No description'}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="secondary" onClick={() => handleEdit(selectedStrategy)}>
                  <Edit3 size={15} style={{ marginRight: '6px' }} /> Edit Config
                </Button>
                <Button variant={selectedStrategy.status === 'active' ? 'danger' : 'success'} onClick={() => handleToggleStatus(selectedStrategy)}>
                  {selectedStrategy.status === 'active' ? 'Suspend Run' : 'Deploy Run'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Sub-tabs selection */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '24px' }}>
            <button
              onClick={() => setDetailTab('overview')}
              style={{ padding: '10px 0', border: 'none', background: 'none', borderBottom: detailTab === 'overview' ? `2px solid ${colors.PRIMARY}` : '2px solid transparent', color: detailTab === 'overview' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: detailTab === 'overview' ? 600 : 500, cursor: 'pointer' }}
            >
              Overview & Performance
            </button>
            <button
              onClick={() => setDetailTab('assignment')}
              style={{ padding: '10px 0', border: 'none', background: 'none', borderBottom: detailTab === 'assignment' ? `2px solid ${colors.PRIMARY}` : '2px solid transparent', color: detailTab === 'assignment' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: detailTab === 'assignment' ? 600 : 500, cursor: 'pointer' }}
            >
              Client Assignment
            </button>
            <button
              onClick={() => setDetailTab('logs')}
              style={{ padding: '10px 0', border: 'none', background: 'none', borderBottom: detailTab === 'logs' ? `2px solid ${colors.PRIMARY}` : '2px solid transparent', color: detailTab === 'logs' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: detailTab === 'logs' ? 600 : 500, cursor: 'pointer' }}
            >
              Strategy Logs
            </button>
          </div>

          {/* TAB: OVERVIEW & PERFORMANCE */}
          {detailTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <Card>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px', fontFamily: 'var(--font-title)' }}>PnL Growth Curve</h3>
                <PerformanceChart
                  data={performanceData}
                  labels={performanceLabels}
                  strokeColor={colors.PRIMARY}
                  fillColorStart={`${colors.PRIMARY}25`}
                  fillColorEnd={`${colors.PRIMARY}00`}
                />
              </Card>

              <Card>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={16} /> Parameters Overview
                </h3>
                {(() => {
                  let parsed: StrategyConfig = INITIAL_CONFIG;
                  try {
                    parsed = JSON.parse(selectedStrategy.configJson);
                  } catch (e) {}
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Segment</span>
                        <span style={{ fontWeight: 600 }}>{parsed.basicInfo?.segment || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Trade Type</span>
                        <span style={{ fontWeight: 600 }}>{parsed.basicInfo?.tradeType || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Timeframe</span>
                        <span style={{ fontWeight: 600 }}>{parsed.basicInfo?.timeframe || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Entry / Exit</span>
                        <span style={{ fontWeight: 600 }}>{parsed.basicInfo?.entryTime || '09:15'} - {parsed.basicInfo?.exitTime || '15:15'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Trade Action</span>
                        <span style={{ fontWeight: 600, color: parsed.tradeAction?.action === 'Short' ? 'var(--color-danger)' : 'var(--color-success)' }}>{parsed.tradeAction?.action || 'Long'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Stoploss Rule</span>
                        <span style={{ fontWeight: 600 }}>{parsed.stoploss?.type || 'Fixed %'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Target Rule</span>
                        <span style={{ fontWeight: 600 }}>{parsed.target?.type || 'Profit %'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Risk Per Trade</span>
                        <span style={{ fontWeight: 600 }}>{parsed.riskManagement?.riskPerTrade || 1}%</span>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            </div>
          )}

          {/* TAB: CLIENT ASSIGNMENT */}
          {detailTab === 'assignment' && (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-title)' }}>Deploy clients to {selectedStrategy.name}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Check client profile to deploy strategy and enable automatic order execution.</p>
                </div>

                {selectedClientIds.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="success" onClick={() => handleBulkAssign(false)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Bulk Assign
                    </Button>
                    <Button variant="danger" onClick={() => handleBulkAssign(true)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Bulk Remove
                    </Button>
                  </div>
                )}
              </div>

              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ width: '40px', padding: '12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedClientIds.length === clients.length && clients.length > 0}
                          onChange={toggleSelectAllClients}
                        />
                      </th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Client Name</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Broker</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Client ID</th>
                      <th style={{ textAlign: 'left', padding: '12px' }}>Segment</th>
                      <th style={{ textAlign: 'right', padding: '12px' }}>Capital</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>Status</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>Strategy Status</th>
                      <th style={{ textAlign: 'right', padding: '12px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => {
                      const isAssignedToThis = client.strategyId === selectedStrategy.id;
                      return (
                        <tr key={client.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selectedClientIds.includes(client.id)}
                              onChange={() => toggleClientSelection(client.id)}
                            />
                          </td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{client.name}</td>
                          <td style={{ padding: '12px' }}>{client.broker}</td>
                          <td style={{ padding: '12px' }}><code>{client.clientId}</code></td>
                          <td style={{ padding: '12px' }}><span className="badge badge-info">{client.segment}</span></td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>₹{client.capital.toLocaleString()}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span className={`badge ${client.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                              {client.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {client.strategyId ? (
                              <span className={`badge ${isAssignedToThis ? 'badge-success' : 'badge-warning'}`}>
                                {isAssignedToThis ? 'Assigned' : `Other (${client.strategyName})`}
                              </span>
                            ) : (
                              <span className="badge badge-danger">Unassigned</span>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            {isAssignedToThis ? (
                              <Button variant="danger" onClick={() => handleAssignStrategy(client.id, true)} style={{ padding: '4px 8px', fontSize: '11px' }}>
                                Remove
                              </Button>
                            ) : (
                              <Button variant="primary" onClick={() => handleAssignStrategy(client.id, false)} style={{ padding: '4px 8px', fontSize: '11px' }}>
                                Assign
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB: STRATEGY LOGS */}
          {detailTab === 'logs' && (
            <Card>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={16} /> Strategy Live Console Logs
              </h3>
              <div style={{ background: '#090d16', color: '#38bdf8', padding: '16px', borderRadius: '8px', fontFamily: 'Courier New, Courier, monospace', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                {logs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    <span style={{ color: log.logType === 'error' ? '#ef4444' : log.logType === 'trade' ? '#22c55e' : '#38bdf8' }}>
                      [{log.logType.toUpperCase()}]
                    </span>
                    <span style={{ color: '#f8fafc' }}>{log.message}</span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <span style={{ color: '#64748b', textAlign: 'center' }}>Console empty. No execution logs yet.</span>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

    </div>
  );
}
