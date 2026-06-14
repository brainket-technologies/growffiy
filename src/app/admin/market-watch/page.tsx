'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { CandlestickChart } from '../../../views/components/CandlestickChart';
import { 
  LineChart, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  BarChart3,
  Percent
} from 'lucide-react';

export default function MarketWatchPage() {
  const { stocks, colors } = useAppViewModel();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'gainers' | 'losers' | 'volume'>('all');
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string | null>(null);

  const activeSymbol = selectedStockSymbol || stocks[0]?.symbol || null;
  const selectedStock = stocks.find(s => s.symbol === activeSymbol);

  // Filter & Search Logic
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

  // Derive Market breadths & metrics dynamically
  const advancesList = stocks.filter(s => s.changePercent > 0);
  const declinesList = stocks.filter(s => s.changePercent < 0);
  const unchangedList = stocks.filter(s => s.changePercent === 0);
  
  const advances = advancesList.length;
  const declines = declinesList.length;
  const unchanged = unchangedList.length;

  const totalVolume = stocks.reduce((acc, s) => acc + s.volume, 0);

  // Sentiment analysis based on breadth
  let sentiment = 'Neutral';
  let sentimentColor = 'var(--color-warning)';
  if (advances > declines * 1.5) {
    sentiment = 'Strongly Bullish';
    sentimentColor = 'var(--color-success)';
  } else if (advances > declines) {
    sentiment = 'Bullish';
    sentimentColor = 'var(--color-success)';
  } else if (declines > advances * 1.5) {
    sentiment = 'Strongly Bearish';
    sentimentColor = 'var(--color-danger)';
  } else if (declines > advances) {
    sentiment = 'Bearish';
    sentimentColor = 'var(--color-danger)';
  }

  // Derive Index Prices based on stock movements
  const averageChangePercent = stocks.length > 0 ? (stocks.reduce((acc, s) => acc + s.changePercent, 0) / stocks.length) : 0;
  const niftyIndex = parseFloat((22450.75 * (1 + averageChangePercent / 100)).toFixed(2));
  const niftyChangePoints = parseFloat((niftyIndex - 22450.75).toFixed(2));
  const isNiftyUp = niftyChangePoints >= 0;

  // Generate simulated chart dataset for selected stock preview card
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
      {/* Title block */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          Nifty 200 Market Watch
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Real-time streaming feeds from Zerodha Kite WebSocket.</p>
      </div>

      {/* Real-time Summary Cards (Upper Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Nifty 50 Indicative */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Nifty 50 (Indicative)</p>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>
                ₹{niftyIndex.toLocaleString()}
              </h3>
              <p style={{ fontSize: '11px', fontWeight: 600, color: isNiftyUp ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isNiftyUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {isNiftyUp ? '+' : ''}{niftyChangePoints} ({isNiftyUp ? '+' : ''}{averageChangePercent.toFixed(2)}%)
              </p>
            </div>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: isNiftyUp ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', color: isNiftyUp ? 'var(--color-success)' : 'var(--color-danger)' }}>
              <Activity size={18} />
            </div>
          </div>
        </Card>

        {/* Market Breadth */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '100%' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Market Breadth</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-success)' }}>{advances}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Adv</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-danger)', marginLeft: '8px' }}>{declines}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Dec</span>
              </div>
              {/* Ratio bar */}
              <div style={{ height: '4px', display: 'flex', borderRadius: '2px', overflow: 'hidden', marginTop: '8px', backgroundColor: '#e2e8f0' }}>
                <div style={{ width: `${(advances / (advances + declines || 1)) * 100}%`, backgroundColor: 'var(--color-success)' }} />
                <div style={{ width: `${(declines / (advances + declines || 1)) * 100}%`, backgroundColor: 'var(--color-danger)' }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Sentiment */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Market Sentiment</p>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: sentimentColor, marginTop: '4px' }}>
                {sentiment}
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Based on advances / declines ratio
              </p>
            </div>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              {sentiment.includes('Bullish') ? <TrendingUp size={18} color="var(--color-success)" /> : <TrendingDown size={18} color="var(--color-danger)" />}
            </div>
          </div>
        </Card>

        {/* Volume Traded */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Market Volume</p>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>
                {(totalVolume / 100000).toFixed(1)}L
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Cumulative shares traded
              </p>
            </div>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-info)' }}>
              <BarChart3 size={18} />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Action bar */}
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

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Detailed Stocks Table */}
        <Card>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 8px' }}>Symbol</th>
                  <th style={{ padding: '12px 8px' }}>LTP (₹)</th>
                  <th style={{ padding: '12px 8px' }}>Chg (%)</th>
                  <th style={{ padding: '12px 8px' }}>Open (₹)</th>
                  <th style={{ padding: '12px 8px' }}>High (₹)</th>
                  <th style={{ padding: '12px 8px' }}>Low (₹)</th>
                  <th style={{ padding: '12px 8px' }}>Prev Close (₹)</th>
                  <th style={{ padding: '12px 8px' }}>Pre-Open (₹)</th>
                  <th style={{ padding: '12px 8px' }}>Volume</th>
                  <th style={{ padding: '12px 8px', textAnchor: 'middle' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => {
                  const isPositive = stock.changePercent >= 0;
                  const isSelected = activeSymbol === stock.symbol;
                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => setSelectedStockSymbol(stock.symbol)}
                      style={{ 
                        cursor: 'pointer', 
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <td style={{ fontWeight: 600, padding: '12px 8px' }}>{stock.symbol}</td>
                      <td style={{ fontWeight: 600, padding: '12px 8px' }}>{stock.ltp.toFixed(2)}</td>
                      <td style={{ fontWeight: 600, color: isPositive ? 'var(--color-success)' : 'var(--color-danger)', padding: '12px 8px' }}>
                        {isPositive ? `+${stock.changePercent.toFixed(2)}%` : `${stock.changePercent.toFixed(2)}%`}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{stock.open.toFixed(2)}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--color-success)' }}>{stock.high.toFixed(2)}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--color-danger)' }}>{stock.low.toFixed(2)}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{stock.prevClose.toFixed(2)}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 500 }}>{stock.iep.toFixed(2)}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '12px 8px' }}>{stock.volume.toLocaleString()}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStockSymbol(stock.symbol);
                          }}
                          style={{ 
                            background: 'var(--color-info-bg)', 
                            border: 'none', 
                            color: 'var(--color-info)', 
                            cursor: 'pointer',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'opacity 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          title="View Candlestick Chart"
                        >
                          <LineChart size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Selected Stock Live Candlestick Chart Panel */}
        {selectedStock ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <CandlestickChart
              symbol={selectedStock.symbol}
              name={selectedStock.name}
              open={selectedStock.open}
              high={selectedStock.high}
              low={selectedStock.low}
              prevClose={selectedStock.prevClose}
              ltp={selectedStock.ltp}
              volume={selectedStock.volume}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
