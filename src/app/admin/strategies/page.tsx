'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { Button } from '../../../views/components/Button';
import { PerformanceChart } from '../../../views/components/PerformanceChart';
import { Play, TrendingUp, Filter, BarChart2, Eye, Edit3 } from 'lucide-react';

interface StrategyItem {
  id: string;
  name: string;
  type: string;
  timeframe: string;
  status: 'active' | 'inactive';
  deployedOn: string;
  pnl: number;
  winRate: number;
  trades: number;
}

const STRATEGIES_LIST: StrategyItem[] = [
  { id: 's1', name: 'Opening Breakout', type: 'Breakout', timeframe: '5m', status: 'active', deployedOn: '10 Apr 2026', pnl: 645230, winRate: 59.5, trades: 1842 },
  { id: 's2', name: 'Pre-Open Momentum', type: 'Momentum', timeframe: '5m', status: 'active', deployedOn: '09 Apr 2026', pnl: 412850, winRate: 56.2, trades: 1287 },
  { id: 's3', name: 'Gap Up Fade', type: 'Mean Reversion', timeframe: '15m', status: 'active', deployedOn: '08 Apr 2026', pnl: 320400, winRate: 54.1, trades: 1056 },
  { id: 's4', name: 'Opening Range', type: 'Breakout', timeframe: '15m', status: 'active', deployedOn: '07 Apr 2026', pnl: 310780, winRate: 58.7, trades: 786 },
  { id: 's5', name: 'Pre-Open Reversal', type: 'Reversal', timeframe: '15m', status: 'inactive', deployedOn: '07 Apr 2026', pnl: 145300, winRate: 53.2, trades: 763 },
  { id: 's6', name: 'Trend Following', type: 'Trend', timeframe: '1h', status: 'active', deployedOn: '06 Apr 2026', pnl: 289100, winRate: 61.3, trades: 2143 },
];

export default function StrategiesPage() {
  const { colors } = useAppViewModel();
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(STRATEGIES_LIST[0].id);
  const [filterType, setFilterType] = useState<string>('all');

  const selectedStrategy = STRATEGIES_LIST.find((s) => s.id === selectedStrategyId);

  const filteredStrategies = STRATEGIES_LIST.filter(
    (s) => filterType === 'all' || s.type.toLowerCase().includes(filterType.toLowerCase())
  );

  // Bottom drawer chart details
  const stratChartData = [24000, 38000, 31000, 48000, 52000, 62000, selectedStrategy ? selectedStrategy.pnl : 100000];
  const stratChartLabels = ['13 May', '14 May', '15 May', '16 May', '17 May', '18 May', 'Today'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            System Strategies
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Deploy, toggle and monitor the performance of your automated trading strategies.</p>
        </div>
        <Button>
          <TrendingUp size={16} /> Deploy New Strategy
        </Button>
      </div>

      {/* Stats Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        <Card>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Total Deployed</p>
          <h3 style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', fontFamily: 'var(--font-title)' }}>
            {STRATEGIES_LIST.length}
          </h3>
        </Card>
        <Card>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Active Strategies</p>
          <h3 style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: 'var(--color-success)', fontFamily: 'var(--font-title)' }}>
            {STRATEGIES_LIST.filter((s) => s.status === 'active').length}
          </h3>
        </Card>
        <Card>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Win Rate Average</p>
          <h3 style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: 'var(--color-info)', fontFamily: 'var(--font-title)' }}>
            57.0%
          </h3>
        </Card>
      </div>

      {/* Strategies List Table */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-title)' }}>Deployed Models</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Filter size={16} color="var(--text-secondary)" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 12px', outline: 'none', fontSize: '12px' }}
            >
              <option value="all">All Types</option>
              <option value="breakout">Breakout</option>
              <option value="momentum">Momentum</option>
              <option value="mean reversion">Mean Reversion</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Strategy Name</th>
                <th>Type</th>
                <th>Timeframe</th>
                <th>Status</th>
                <th>Deployed On</th>
                <th>Win Rate</th>
                <th>Trades</th>
                <th>Total P&L</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStrategies.map((strat) => (
                <tr
                  key={strat.id}
                  onClick={() => setSelectedStrategyId(strat.id)}
                  style={{ cursor: 'pointer', backgroundColor: selectedStrategyId === strat.id ? '#f8fafc' : 'transparent' }}
                >
                  <td style={{ fontWeight: 600 }}>{strat.name}</td>
                  <td>{strat.type}</td>
                  <td>
                    <span className="badge badge-info">{strat.timeframe}</span>
                  </td>
                  <td>
                    <span className={`badge ${strat.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {strat.status}
                    </span>
                  </td>
                  <td>{strat.deployedOn}</td>
                  <td>{strat.winRate}%</td>
                  <td>{strat.trades}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                    ₹{strat.pnl.toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--color-info)', cursor: 'pointer' }}>
                        <Eye size={15} />
                      </button>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <Edit3 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Expandable Bottom Drawer Detail */}
      {selectedStrategy && (
        <Card style={{ borderTop: `4px solid ${colors.PRIMARY}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
                Detail Performance: {selectedStrategy.name}
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cumulative performance of deployed instances</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="secondary">Edit Parameters</Button>
              <Button variant={selectedStrategy.status === 'active' ? 'danger' : 'success'}>
                {selectedStrategy.status === 'active' ? 'Suspend Run' : 'Deploy Run'}
              </Button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px' }}>
            {/* Chart */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>P&L Curve</h4>
              <PerformanceChart
                data={stratChartData}
                labels={stratChartLabels}
                strokeColor={colors.PRIMARY}
                fillColorStart={`${colors.PRIMARY}25`}
                fillColorEnd={`${colors.PRIMARY}00`}
              />
            </div>

            {/* Strategy Parameters */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Configuration Settings</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <p><strong>Strategy Type:</strong> {selectedStrategy.type}</p>
                <p><strong>Execution:</strong> MIS Intraday</p>
                <p><strong>Timeframe:</strong> {selectedStrategy.timeframe}</p>
                <p><strong>Risk Size:</strong> 1% capital risk per trade</p>
                <p><strong>Target buffer:</strong> 1.50% profit taker</p>
                <p><strong>Stop loss:</strong> 0.50% hard cutoff</p>
              </div>
            </div>

            {/* Distribution */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Trade Distribution</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Winning Trades</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                    {Math.round(selectedStrategy.trades * (selectedStrategy.winRate / 100))}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Losing Trades</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>
                    {Math.round(selectedStrategy.trades * ((100 - selectedStrategy.winRate) / 100))}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                  <span>Total executed</span>
                  <span style={{ fontWeight: 600 }}>{selectedStrategy.trades}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
