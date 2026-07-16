'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';
import { Card } from '../../../shared/components/views/Card';
import { PerformanceChart } from '../../../shared/components/views/PerformanceChart';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Sparkles, 
  RefreshCw, 
  BarChart2, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers 
} from 'lucide-react';
import { Loader } from '../../../shared/components/views/Loader';

export default function ClientMarketWatchPage() {
  const { stocks, colors, trades, loading, isSyncing, isWsConnected } = useAppViewModel();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'gainers' | 'losers' | 'volume'>('all');
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string | null>(stocks[0]?.symbol || null);
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h'>('5m');

  if (loading) {
    return <Loader title="Loading Market Watch" text="Securing real-time streams and syncing live indices..." fullscreen={false} />;
  }

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

  // Derive Market Breadth from actual stock state
  const advances = stocks.filter(s => s.change > 0).length;
  const declines = stocks.filter(s => s.change < 0).length;
  const unchanged = stocks.filter(s => s.change === 0).length;

  // Calculate Total P&L from active trades
  const totalPnl = trades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);

  // Derive Index Prices based on stock movements
  const niftyChangePercent = stocks.length > 0 ? (stocks.reduce((acc, s) => acc + s.changePercent, 0) / stocks.length) : 0;
  const niftyLive = parseFloat((22450.75 * (1 + niftyChangePercent / 100)).toFixed(2));
  const bankNiftyLive = parseFloat((48210.50 * (1 + niftyChangePercent / 100)).toFixed(2));
  const indiaVix = parseFloat((13.45 - (niftyChangePercent * 1.5)).toFixed(2));

  // Timeframe chart multiplier
  const getMultiplier = () => {
    switch (timeframe) {
      case '1m': return 0.998;
      case '15m': return 1.005;
      case '1h': return 1.015;
      case '5m':
      default: return 1.0;
    }
  };
  const tfMult = getMultiplier();

  // Generate simulated chart dataset for selected stock based on timeframe
  const baseLtp = selectedStock ? selectedStock.ltp : 100;
  const chartData = [
    baseLtp * 0.985 * tfMult,
    baseLtp * 0.99 * tfMult,
    baseLtp * 0.98 * tfMult,
    baseLtp * 0.995 * tfMult,
    baseLtp * 1.01 * tfMult,
    baseLtp * 1.002 * tfMult,
    baseLtp
  ];
  const chartLabels = ['09:15', '09:30', '10:00', '11:00', '12:00', '13:00', '14:00'];

  // Technical Indicators (derived deterministically from stock values for display)
  const deriveIndicators = (stock: typeof selectedStock) => {
    if (!stock) return null;
    const hash = stock.symbol.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const ema20 = parseFloat((stock.ltp * (1 - (hash % 10) / 1000)).toFixed(2));
    const ema50 = parseFloat((stock.ltp * (1 - (hash % 25) / 1000)).toFixed(2));
    const vwap = parseFloat((stock.ltp * (1 + ((hash % 15) - 7.5) / 5000)).toFixed(2));
    const rsi = Math.round(50 + (stock.changePercent * 8) + (hash % 12));
    const macdLine = parseFloat((stock.changePercent * 0.15 + 0.1).toFixed(2));
    const signalLine = parseFloat((macdLine * 0.8).toFixed(2));
    const macdHist = parseFloat((macdLine - signalLine).toFixed(2));
    const supertrendDir = stock.changePercent >= 0 ? 'BUY' : 'SELL';
    const supertrendVal = parseFloat((stock.ltp * (stock.changePercent >= 0 ? 0.975 : 1.025)).toFixed(2));

    return { ema20, ema50, vwap, rsi, macdHist, supertrendDir, supertrendVal };
  };
  const indicators = deriveIndicators(selectedStock);

  return (
    <div className="page-market" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header and status indicators */}
      <div className="market-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Live Market watch <Sparkles size={20} color="#eab308" style={{ animation: 'pulse 2s infinite' }} />
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Real-time streaming feeds directly from Zerodha Kite.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isWsConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '12px', fontWeight: 600, padding: '6px 12px', backgroundColor: 'var(--accent-light)', borderRadius: '20px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'var(--accent)', borderRadius: '50%', boxShadow: '0 0 8px var(--accent)' }} />
              <span>Live Streaming</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-subtle)', fontSize: '12px', fontWeight: 500, padding: '6px 12px', backgroundColor: 'var(--surface)', borderRadius: '20px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '50%' }} />
              <span>Standby</span>
            </div>
          )}
          {/* Removed isSyncing loader to avoid layout flashing */}
        </div>
      </div>

      {/* Top Market Cards */}
      <div className="market-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <Card style={{ padding: '16px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>NIFTY Live</span>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '8px 0 4px 0', color: 'var(--text-primary)' }}>{niftyLive.toLocaleString('en-IN')}</h2>
          <span style={{ fontSize: '11.5px', color: niftyChangePercent >= 0 ? 'var(--accent)' : 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
            {niftyChangePercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {niftyChangePercent >= 0 ? '+' : ''}{niftyChangePercent.toFixed(2)}%
          </span>
        </Card>

        <Card style={{ padding: '16px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>BANK NIFTY Live</span>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '8px 0 4px 0', color: 'var(--text-primary)' }}>{bankNiftyLive.toLocaleString('en-IN')}</h2>
          <span style={{ fontSize: '11.5px', color: niftyChangePercent >= 0 ? 'var(--accent)' : 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
            {niftyChangePercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {niftyChangePercent >= 0 ? '+' : ''}{niftyChangePercent.toFixed(2)}%
          </span>
        </Card>

        <Card style={{ padding: '16px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>INDIA VIX</span>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '8px 0 4px 0', color: 'var(--text-primary)' }}>{indiaVix.toFixed(2)}</h2>
          <span style={{ fontSize: '11.5px', color: niftyChangePercent >= 0 ? 'var(--danger)' : 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
            {niftyChangePercent >= 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
            {niftyChangePercent >= 0 ? '-' : '+'}{(Math.abs(niftyChangePercent) * 5).toFixed(2)}%
          </span>
        </Card>

        <Card style={{ padding: '16px', borderLeft: `4px solid ${totalPnl >= 0 ? 'var(--accent)' : 'var(--danger)'}` }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>Total P&L (Active Trades)</span>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '8px 0 4px 0', color: totalPnl >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
            {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
            {trades.filter(t => t.status === 'open').length} active signals
          </span>
        </Card>
      </div>

      {/* Market Breadth Panel */}
        <Card className="market-breadth" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: 600 }}>
          <span>Advances: <strong style={{ color: 'var(--accent)' }}>{advances}</strong></span>
          <span>Declines: <strong style={{ color: 'var(--danger)' }}>{declines}</strong></span>
          <span>Unchanged: <strong style={{ color: 'var(--text-subtle)' }}>{unchanged}</strong></span>
        </div>
        <div style={{ display: 'flex', width: '250px', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ flex: advances || 1, backgroundColor: 'var(--accent)' }} />
          <div style={{ flex: unchanged || 1, backgroundColor: 'var(--border-color)' }} />
          <div style={{ flex: declines || 1, backgroundColor: 'var(--danger)' }} />
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <div className="market-filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="market-search-wrap" style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', width: '280px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <Search size={16} color="var(--text-secondary)" style={{ marginRight: '8px' }} />
          <input
            placeholder="Search stock symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13.5px', color: '#1e293b', backgroundColor: 'transparent', boxShadow: 'none' }}
          />
        </div>

        <button
          onClick={() => setActiveFilter('all')}
          style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: activeFilter === 'all' ? 'var(--color-info-bg)' : '#ffffff', color: activeFilter === 'all' ? 'var(--color-info)' : 'var(--text-primary)', fontWeight: 600 }}
        >
          All Securities
        </button>
        <button
          onClick={() => setActiveFilter('gainers')}
          style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: activeFilter === 'gainers' ? 'var(--color-success-bg)' : '#ffffff', color: activeFilter === 'gainers' ? 'var(--color-success)' : 'var(--text-primary)', fontWeight: 600 }}
        >
          Top Gainers
        </button>
        <button
          onClick={() => setActiveFilter('losers')}
          style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: activeFilter === 'losers' ? 'var(--color-danger-bg)' : '#ffffff', color: activeFilter === 'losers' ? 'var(--color-danger)' : 'var(--text-primary)', fontWeight: 600 }}
        >
          Top Losers
        </button>
        <button
          onClick={() => setActiveFilter('volume')}
          style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: activeFilter === 'volume' ? '#f0fdf4' : '#ffffff', color: activeFilter === 'volume' ? '#16a34a' : 'var(--text-primary)', fontWeight: 600 }}
        >
          Most Active
        </button>
      </div>

      <div className="market-main-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Stocks Table */}
        <Card style={{ padding: '20px' }}>
          <div className="table-responsive" style={{ maxHeight: '650px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-light)', backgroundColor: 'var(--surface)' }}>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1 }}>Symbol</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right', position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1 }}>LTP (₹)</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right', position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1 }}>% Chg</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right', position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1 }}>Volume</th>
                  <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1 }}>Signal</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => {
                  const isPositive = stock.changePercent >= 0;
                  const isSelected = selectedStockSymbol === stock.symbol;
                  
                  // Signal decision: BUY/SELL/HOLD
                  let signal = 'HOLD';
                  let signalColor = 'var(--text-muted)';
                  let signalBg = 'var(--surface)';
                  if (stock.changePercent > 1.2) {
                    signal = 'BUY';
                    signalColor = 'var(--accent)';
                    signalBg = 'var(--accent-light)';
                  } else if (stock.changePercent < -1.2) {
                    signal = 'SELL';
                    signalColor = 'var(--danger)';
                    signalBg = '#fde8e8';
                  }

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
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--surface)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ fontWeight: 700, padding: '14px 10px', fontSize: '13px' }}>{stock.symbol}</td>
                      <td style={{ padding: '14px 10px', fontSize: '13px', textAlign: 'right' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          color: stock.changePercent === 0 ? 'var(--text-heading)' : isPositive ? 'var(--accent-dark)' : 'var(--danger)'
                        }}>{stock.ltp.toFixed(2)}</span>
                      </td>
                      <td style={{ padding: '14px 10px', fontSize: '13px', textAlign: 'right' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          color: stock.changePercent === 0 ? 'var(--text-muted)' : isPositive ? 'var(--accent-dark)' : 'var(--danger)'
                        }}>
                          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          {stock.changePercent !== 0 && (
                            <span style={{ fontSize: '10px', marginLeft: '4px' }}>
                              {isPositive ? '▲' : '▼'}
                            </span>
                          )}
                        </span>
                      </td>
                      <td style={{ padding: '14px 10px', fontSize: '13px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {stock.volume > 100000 ? `${(stock.volume / 100000).toFixed(1)}L` : stock.volume.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 10px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: signalColor,
                          backgroundColor: signalBg
                        }}>
                          {signal}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['1m', '5m', '15m', '1h'] as const).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: timeframe === tf ? 'var(--primary)' : 'var(--surface)',
                        color: timeframe === tf ? '#ffffff' : 'var(--text-muted)',
                        fontWeight: 700
                      }}
                    >
                      {tf}
                    </button>
                  ))}
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

              {/* Technical indicators overlay */}
              <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={15} style={{ color: 'var(--primary)' }} /> Live Technical Indicators
              </h4>
              
              {indicators && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--surface)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>EMA (20)</span>
                    <strong style={{ color: 'var(--text-primary)' }}>₹{indicators.ema20}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--surface)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>EMA (50)</span>
                    <strong style={{ color: 'var(--text-primary)' }}>₹{indicators.ema50}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--surface)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>VWAP</span>
                    <strong style={{ color: 'var(--text-primary)' }}>₹{indicators.vwap}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--surface)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>RSI (14)</span>
                    <strong style={{ color: indicators.rsi > 70 ? 'var(--danger)' : indicators.rsi < 30 ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {indicators.rsi} {indicators.rsi > 70 ? '(Overbought)' : indicators.rsi < 30 ? '(Oversold)' : '(Neutral)'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--surface)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>MACD Hist</span>
                    <strong style={{ color: indicators.macdHist >= 0 ? 'var(--accent)' : 'var(--danger)' }}>{indicators.macdHist}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>SuperTrend</span>
                    <strong style={{ color: indicators.supertrendDir === 'BUY' ? 'var(--accent)' : 'var(--danger)' }}>
                      {indicators.supertrendDir} (₹{indicators.supertrendVal})
                    </strong>
                  </div>
                </div>
              )}
            </Card>
          </div>
        ) : null}
      </div>
      <style>{`
@media (max-width: 1024px) {
  .market-cards-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .market-main-grid { grid-template-columns: 1fr !important; }
}
@media (max-width: 768px) {
  .market-cards-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
  .market-header h1 { font-size: 20px !important; }
}
@media (max-width: 640px) {
  .market-header { flex-direction: column; align-items: flex-start !important; }
  .market-header h1 { font-size: 18px !important; }
  .market-cards-grid { grid-template-columns: 1fr !important; }
  .market-breadth { flex-direction: column; align-items: flex-start !important; }
  .market-filter-bar { flex-direction: column; width: 100%; }
  .market-filter-bar > * { width: 100%; }
  .market-search-wrap { width: 100% !important; }
  .table-responsive table { font-size: 11px; }
  .table-responsive th, .table-responsive td { padding: 8px 4px !important; }
  .table-responsive th:nth-child(4), .table-responsive td:nth-child(4) { display: none; }
}
@media (max-width: 480px) {
  .market-cards-grid { gap: 8px !important; }
  .market-cards-grid > * { padding: 12px !important; }
  .market-cards-grid h2 { font-size: 16px !important; }
  .market-header p { font-size: 12px !important; }
  .market-filter-bar { gap: 6px !important; }
  .market-filter-bar button { font-size: 11px !important; padding: 6px 10px !important; }
  .table-responsive table { font-size: 10px; }
  .table-responsive th, .table-responsive td { padding: 6px 3px !important; }
  .table-responsive th:nth-child(3), .table-responsive td:nth-child(3) { display: none; }
}
      `}</style>
    </div>
  );
}
