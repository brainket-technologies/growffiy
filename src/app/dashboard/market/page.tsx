'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { PerformanceChart } from '../../../views/components/PerformanceChart';
import { LineChart, Search, TrendingUp, Sparkles, TrendingDown, RefreshCw, BarChart2 } from 'lucide-react';

export default function ClientMarketWatchPage() {
  const { stocks, colors, isSyncing, isWsConnected } = useAppViewModel();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'gainers' | 'losers' | 'volume'>('all');
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string | null>(stocks[0]?.symbol || null);

  const selectedStock = stocks.find(s => s.symbol === (selectedStockSymbol || stocks[0]?.symbol));

  // Filter and sort logic
  let filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeFilter === 'gainers') {
    filteredStocks = [...filteredStocks].sort((a, b) => b.changePercent - a.changePercent);
  } else if (activeFilter === 'losers') {
    filteredStocks = [...filteredStocks].sort((a, b) => a.changePercent - b.changePercent);
  } else if (activeFilter === 'volume') {
    filteredStocks = [...filteredStocks].sort((a, b) => b.volume - a.volume);
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
      {/* Header and status indicators */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Live Market watch <Sparkles size={20} color="#eab308" style={{ animation: 'pulse 2s infinite' }} />
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Real-time streaming feeds directly from Zerodha Kite.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isWsConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 600, padding: '6px 12px', backgroundColor: '#e6f4ea', borderRadius: '20px' }}>
              <span style={{ 
                display: 'inline-block', 
                width: '8px', 
                height: '8px', 
                backgroundColor: '#10b981', 
                borderRadius: '50%', 
                boxShadow: '0 0 8px #10b981'
              }} />
              <span>Live Streaming</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', fontWeight: 500, padding: '6px 12px', backgroundColor: '#f1f5f9', borderRadius: '20px' }}>
              <span style={{ 
                display: 'inline-block', 
                width: '8px', 
                height: '8px', 
                backgroundColor: '#cbd5e1', 
                borderRadius: '50%'
              }} />
              <span>Standby</span>
            </div>
          )}

          {isSyncing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0ea5e9', fontSize: '12px', fontWeight: 500 }}>
              <RefreshCw size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
              <span>Syncing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', width: '280px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <Search size={16} color="var(--text-secondary)" style={{ marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search stock symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13.5px', color: '#1e293b' }}
          />
        </div>

        <button
          onClick={() => setActiveFilter('all')}
          style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: activeFilter === 'all' ? 'var(--color-info-bg)' : '#ffffff', color: activeFilter === 'all' ? 'var(--color-info)' : 'var(--text-primary)', fontWeight: 600, transition: 'all 0.2s' }}
        >
          All Securities
        </button>
        <button
          onClick={() => setActiveFilter('gainers')}
          style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: activeFilter === 'gainers' ? 'var(--color-success-bg)' : '#ffffff', color: activeFilter === 'gainers' ? 'var(--color-success)' : 'var(--text-primary)', fontWeight: 600, transition: 'all 0.2s' }}
        >
          Top Gainers
        </button>
        <button
          onClick={() => setActiveFilter('losers')}
          style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: activeFilter === 'losers' ? 'var(--color-danger-bg)' : '#ffffff', color: activeFilter === 'losers' ? 'var(--color-danger)' : 'var(--text-primary)', fontWeight: 600, transition: 'all 0.2s' }}
        >
          Top Losers
        </button>
        <button
          onClick={() => setActiveFilter('volume')}
          style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: activeFilter === 'volume' ? '#f0fdf4' : '#ffffff', color: activeFilter === 'volume' ? '#16a34a' : 'var(--text-primary)', fontWeight: 600, transition: 'all 0.2s' }}
        >
          Most Active
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Stocks Table */}
        <Card style={{ padding: '20px' }}>
          <div className="table-responsive" style={{ maxHeight: '650px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-light)', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Symbol</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Company Name</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>LTP (₹)</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Prev Close</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>% Chg</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Volume</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>Chart</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => {
                  const isPositive = stock.changePercent >= 0;
                  const isSelected = selectedStockSymbol === stock.symbol;
                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => setSelectedStockSymbol(stock.symbol)}
                      style={{ 
                        cursor: 'pointer', 
                        backgroundColor: isSelected ? 'var(--color-info-bg)' : 'transparent',
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ fontWeight: 700, padding: '14px 10px', fontSize: '13px' }}>{stock.symbol}</td>
                      <td style={{ color: 'var(--text-secondary)', padding: '14px 10px', fontSize: '13px' }}>{stock.name}</td>
                      <td style={{ fontWeight: 700, padding: '14px 10px', fontSize: '13px', textAlign: 'right' }}>{stock.ltp.toFixed(2)}</td>
                      <td style={{ padding: '14px 10px', fontSize: '13px', textAlign: 'right', color: 'var(--text-muted)' }}>{stock.prevClose.toFixed(2)}</td>
                      <td style={{ 
                        fontWeight: 700, 
                        padding: '14px 10px', 
                        fontSize: '13px', 
                        textAlign: 'right',
                        color: isPositive ? 'var(--color-success)' : 'var(--color-danger)' 
                      }}>
                        {isPositive ? `+${stock.changePercent.toFixed(2)}%` : `${stock.changePercent.toFixed(2)}%`}
                      </td>
                      <td style={{ padding: '14px 10px', fontSize: '13px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {stock.volume.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                        <button
                          style={{ background: 'none', border: 'none', color: isSelected ? 'var(--color-info)' : 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <BarChart2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredStocks.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No stocks found matching the search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Selected Stock Live Chart & Statistics */}
        {selectedStock ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-title)', margin: 0 }}>
                    {selectedStock.symbol}
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{selectedStock.name}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>₹{selectedStock.ltp.toFixed(2)}</h3>
                  <p style={{ 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    margin: '4px 0 0 0',
                    color: selectedStock.changePercent >= 0 ? 'var(--color-success)' : 'var(--color-danger)' 
                  }}>
                    {selectedStock.changePercent >= 0 ? `+${selectedStock.changePercent.toFixed(2)}%` : `${selectedStock.changePercent.toFixed(2)}%`}
                  </p>
                </div>
              </div>

              {/* Sparkline/Line Chart */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                <PerformanceChart
                  data={chartData}
                  labels={chartLabels}
                  strokeColor={selectedStock.changePercent >= 0 ? colors.SUCCESS : colors.DANGER}
                  fillColorStart={selectedStock.changePercent >= 0 ? `${colors.SUCCESS}25` : `${colors.DANGER}25`}
                  fillColorEnd={selectedStock.changePercent >= 0 ? `${colors.SUCCESS}00` : `${colors.DANGER}00`}
                />
              </div>

              {/* Details and Technical Indicators */}
              <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>Market Statistics</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Open</span>
                  <strong style={{ color: 'var(--text-primary)' }}>₹{selectedStock.open.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Day High</span>
                  <strong style={{ color: 'var(--text-primary)' }}>₹{selectedStock.high.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Day Low</span>
                  <strong style={{ color: 'var(--text-primary)' }}>₹{selectedStock.low.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Previous Close</span>
                  <strong style={{ color: 'var(--text-primary)' }}>₹{selectedStock.prevClose.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Free Float Market Cap</span>
                  <strong style={{ color: 'var(--text-primary)' }}>₹{selectedStock.ffmCap.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Traded Value</span>
                  <strong style={{ color: 'var(--text-primary)' }}>₹{selectedStock.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr</strong>
                </div>
              </div>
            </Card>

            {/* Quick Stats Panel */}
            <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#fafafa' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <TrendingUp size={16} color="var(--color-success)" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Technical Analysis Standpoint</span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                This stock is currently trading {selectedStock.changePercent >= 0 ? 'above' : 'below'} its previous close by {Math.abs(selectedStock.changePercent).toFixed(2)}%. Daily average volume stands strong indicating {selectedStock.volume > 1000000 ? 'heavy institutional' : 'retail/speculative'} participant levels.
              </p>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
