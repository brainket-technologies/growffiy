'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { PerformanceChart } from '../../../views/components/PerformanceChart';
import { LineChart, Search, Sparkles } from 'lucide-react';

export default function MarketWatchPage() {
  const { stocks, colors } = useAppViewModel();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'gainers' | 'losers' | 'volume'>('all');
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string | null>(stocks[0]?.symbol || null);

  const selectedStock = stocks.find(s => s.symbol === (selectedStockSymbol || stocks[0]?.symbol));

  // Filter logic
  let filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeFilter === 'gainers') {
    filteredStocks.sort((a, b) => b.changePercent - a.changePercent);
  } else if (activeFilter === 'losers') {
    filteredStocks.sort((a, b) => a.changePercent - b.changePercent);
  } else if (activeFilter === 'volume') {
    filteredStocks.sort((a, b) => b.volume - a.volume);
  }

  // Generate simulated chart dataset for selected stock
  const baseLtp = selectedStock ? selectedStock.ltp : 100;
  const chartData = [
    baseLtp * 0.985,
    baseLtp * 0.99,
    baseLtp * 0.98,
    baseLtp * 0.995,
    baseLtp * 1.01,
    baseLtp * 1.002,
    baseLtp
  ];
  const chartLabels = ['09:15', '09:30', '10:00', '11:00', '12:00', '13:00', '14:00'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          Nifty 200 Market Watch
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Real-time streaming feeds from Zerodha Kite WebSocket.</p>
      </div>

      {/* Filter Options */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', width: '250px' }}>
          <Search size={16} color="var(--text-secondary)" style={{ marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search stock symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
          />
        </div>

        <button
          onClick={() => setActiveFilter('all')}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: activeFilter === 'all' ? 'var(--color-info-bg)' : '#ffffff', color: activeFilter === 'all' ? 'var(--color-info)' : 'var(--text-primary)', fontWeight: 500 }}
        >
          Nifty 200 (All)
        </button>
        <button
          onClick={() => setActiveFilter('gainers')}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: activeFilter === 'gainers' ? 'var(--color-success-bg)' : '#ffffff', color: activeFilter === 'gainers' ? 'var(--color-success)' : 'var(--text-primary)', fontWeight: 500 }}
        >
          Top Gainers
        </button>
        <button
          onClick={() => setActiveFilter('losers')}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: activeFilter === 'losers' ? 'var(--color-danger-bg)' : '#ffffff', color: activeFilter === 'losers' ? 'var(--color-danger)' : 'var(--text-primary)', fontWeight: 500 }}
        >
          Top Losers
        </button>
        <button
          onClick={() => setActiveFilter('volume')}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: activeFilter === 'volume' ? '#eff6ff' : '#ffffff', color: activeFilter === 'volume' ? 'var(--color-info)' : 'var(--text-primary)', fontWeight: 500 }}
        >
          Most Active
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Stocks Table */}
        <Card>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company Name</th>
                  <th>LTP (₹)</th>
                  <th>Prev Close (₹)</th>
                  <th>Chg (%)</th>
                  <th>Volume</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => {
                  const isPositive = stock.changePercent >= 0;
                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => setSelectedStockSymbol(stock.symbol)}
                      style={{ cursor: 'pointer', backgroundColor: selectedStockSymbol === stock.symbol ? '#f8fafc' : 'transparent' }}
                    >
                      <td style={{ fontWeight: 600 }}>{stock.symbol}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{stock.name}</td>
                      <td style={{ fontWeight: 600 }}>{stock.ltp.toFixed(2)}</td>
                      <td>{stock.prevClose.toFixed(2)}</td>
                      <td style={{ fontWeight: 600, color: isPositive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {isPositive ? `+${stock.changePercent}%` : `${stock.changePercent}%`}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stock.volume.toLocaleString()}</td>
                      <td>
                        <button
                          style={{ background: 'none', border: 'none', color: 'var(--color-info)', cursor: 'pointer' }}
                        >
                          <LineChart size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Selected Stock Live Chart */}
        {selectedStock ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
                    {selectedStock.symbol}
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{selectedStock.name}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>₹{selectedStock.ltp.toFixed(2)}</h3>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: selectedStock.changePercent >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {selectedStock.changePercent >= 0 ? `+${selectedStock.changePercent}%` : `${selectedStock.changePercent}%`}
                  </p>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                <PerformanceChart
                  data={chartData}
                  labels={chartLabels}
                  strokeColor={selectedStock.changePercent >= 0 ? colors.SUCCESS : colors.DANGER}
                  fillColorStart={selectedStock.changePercent >= 0 ? `${colors.SUCCESS}25` : `${colors.DANGER}25`}
                  fillColorEnd={selectedStock.changePercent >= 0 ? `${colors.SUCCESS}00` : `${colors.DANGER}00`}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                <div>Open: <strong style={{ float: 'right' }}>₹{selectedStock.open.toFixed(2)}</strong></div>
                <div>Prev Close: <strong style={{ float: 'right' }}>₹{selectedStock.prevClose.toFixed(2)}</strong></div>
                <div>High: <strong style={{ float: 'right' }}>₹{selectedStock.high.toFixed(2)}</strong></div>
                <div>Low: <strong style={{ float: 'right' }}>₹{selectedStock.low.toFixed(2)}</strong></div>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
