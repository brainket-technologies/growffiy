'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { Button } from '../../../views/components/Button';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  Activity, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Flame, 
  Coins, 
  Target 
} from 'lucide-react';
import { Loader } from '../../../views/components/Loader';

export default function ClientPreOpenScannerPage() {
  const { preOpenStocks: stocks, loading, isSyncing, isWsConnected, preOpenDate } = useAppViewModel();
  if (loading) {
    return <Loader title="Loading Pre-Open Market" text="Fetching indicative quotes and syncing pre-market feeds..." fullscreen={false} />;
  }
  const [selectedFoTab, setSelectedFoTab] = useState<'oi' | 'longBuild' | 'shortBuild' | 'shortCover' | 'longUnwind'>('oi');

  // Derive Market Breadth from actual stock state
  const advancesList = stocks.filter(s => s.change > 0);
  const declinesList = stocks.filter(s => s.change < 0);
  const unchangedList = stocks.filter(s => s.change === 0);
  
  const advances = advancesList.length;
  const declines = declinesList.length;
  const unchanged = unchangedList.length;
  const adRatio = declines > 0 ? parseFloat((advances / declines).toFixed(2)) : advances;

  // Sentiment analysis based on breadth
  let sentiment = 'Neutral';
  let sentimentColor = '#eab308';
  if (advances > declines * 1.5) {
    sentiment = 'Strongly Bullish';
    sentimentColor = '#10b981';
  } else if (advances > declines) {
    sentiment = 'Bullish';
    sentimentColor = '#10b981';
  } else if (declines > advances * 1.5) {
    sentiment = 'Strongly Bearish';
    sentimentColor = '#ef4444';
  } else if (declines > advances) {
    sentiment = 'Bearish';
    sentimentColor = '#ef4444';
  }

  // Derive Index Prices based on stock movements
  const niftyChangePercent = stocks.length > 0 ? (stocks.reduce((acc, s) => acc + s.changePercent, 0) / stocks.length) : 0;
  const niftyIndicative = parseFloat((22450.75 * (1 + niftyChangePercent / 100)).toFixed(2));
  const bankNiftyIndicative = parseFloat((48210.50 * (1 + niftyChangePercent / 100)).toFixed(2));
  const finNiftyIndicative = parseFloat((21340.20 * (1 + niftyChangePercent / 100)).toFixed(2));
  const sensexIndicative = parseFloat((73950.40 * (1 + niftyChangePercent / 100)).toFixed(2));

  // Gap Analysis list: Stocks with highest gap open (absolute gap percent)
  const gapAnalysisList = [...stocks]
    .map(s => {
      const gapPercent = s.prevClose > 0 ? parseFloat((((s.open - s.prevClose) / s.prevClose) * 100).toFixed(2)) : 0;
      return { ...s, gapPercent };
    })
    .sort((a, b) => Math.abs(b.gapPercent) - Math.abs(a.gapPercent))
    .slice(0, 5);

  // Top Gainers and Losers (Pre-Open)
  const topGainers = [...stocks]
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5)
    .map(s => {
      const buyQty = Math.round((s.volume * 0.45) / 100) * 100 || 12400;
      const sellQty = Math.round((s.volume * 0.35) / 100) * 100 || 8200;
      return { ...s, buyQty, sellQty };
    });

  const topLosers = [...stocks]
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5)
    .map(s => {
      const buyQty = Math.round((s.volume * 0.30) / 100) * 100 || 5400;
      const sellQty = Math.round((s.volume * 0.55) / 100) * 100 || 14800;
      return { ...s, buyQty, sellQty };
    });

  // Most Active Stocks (Volume based)
  const mostActive = [...stocks]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5)
    .map(s => {
      const buyQty = Math.round((s.volume * 0.51) / 100) * 100;
      const sellQty = Math.round((s.volume * 0.49) / 100) * 100;
      return { ...s, buyQty, sellQty };
    });

  // Strategy Signals: candidates for Breakout
  const gapUpCandidates = [...stocks]
    .filter(s => s.changePercent > 1.5)
    .slice(0, 4);

  const gapDownCandidates = [...stocks]
    .filter(s => s.changePercent < -1.5)
    .slice(0, 4);

  // F&O derivatives data mock (deterministic based on stock properties)
  const getFoMockData = () => {
    return [...stocks]
      .slice(10, 15)
      .map(s => {
        const hash = s.symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const oiChange = parseFloat(((hash % 15) + 1.5).toFixed(1));
        const priceChange = s.changePercent;
        return {
          symbol: s.symbol,
          price: s.ltp,
          priceChg: priceChange,
          oiChg: oiChange,
          volume: s.volume
        };
      });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            Pre-Open Market Scanner 
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>(9:00 AM - 9:15 AM)</span>
            {preOpenDate && <span style={{ fontSize: '14px', fontWeight: 600, color: '#2563eb', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '6px', border: '1px solid #bfdbfe', marginLeft: '6px' }}>{preOpenDate}</span>}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Indicative opening session dashboard, sentiment, and gap analysis.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 600, padding: '6px 12px', backgroundColor: '#e6f4ea', borderRadius: '20px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' }} />
            <span>NSE Data Live</span>
          </div>
          {isSyncing && (
            <RefreshCw size={15} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
          )}
        </div>
      </div>

      {/* Top Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <Card style={{ padding: '16px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>NIFTY 50 Indicative</span>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '8px 0 4px 0', color: 'var(--text-primary)' }}>{niftyIndicative.toLocaleString('en-IN')}</h2>
          <span style={{ fontSize: '11.5px', color: niftyChangePercent >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
            {niftyChangePercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {niftyChangePercent >= 0 ? '+' : ''}{niftyChangePercent.toFixed(2)}%
          </span>
        </Card>

        <Card style={{ padding: '16px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>BANK NIFTY Indicative</span>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '8px 0 4px 0', color: 'var(--text-primary)' }}>{bankNiftyIndicative.toLocaleString('en-IN')}</h2>
          <span style={{ fontSize: '11.5px', color: niftyChangePercent >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
            {niftyChangePercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {niftyChangePercent >= 0 ? '+' : ''}{niftyChangePercent.toFixed(2)}%
          </span>
        </Card>

        <Card style={{ padding: '16px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>FINNIFTY Indicative</span>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '8px 0 4px 0', color: 'var(--text-primary)' }}>{finNiftyIndicative.toLocaleString('en-IN')}</h2>
          <span style={{ fontSize: '11.5px', color: niftyChangePercent >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
            {niftyChangePercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {niftyChangePercent >= 0 ? '+' : ''}{niftyChangePercent.toFixed(2)}%
          </span>
        </Card>

        <Card style={{ padding: '16px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>Sensex Indicative</span>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '8px 0 4px 0', color: 'var(--text-primary)' }}>{sensexIndicative.toLocaleString('en-IN')}</h2>
          <span style={{ fontSize: '11.5px', color: niftyChangePercent >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
            {niftyChangePercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {niftyChangePercent >= 0 ? '+' : ''}{niftyChangePercent.toFixed(2)}%
          </span>
        </Card>
      </div>

      {/* Sentiment, Market Breadth & Gap Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px', alignItems: 'stretch' }}>
        {/* Sentiment & Breadth */}
        <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: 600, margin: 0, borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>Pre-Open Sentiment</h3>
          
          <div style={{ textAlign: 'center', padding: '12px', borderRadius: '12px', backgroundColor: `${sentimentColor}15`, color: sentimentColor }}>
            <span style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Bias</span>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '6px 0 0 0' }}>{sentiment}</h2>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Pre-Open Breadth</span>
            <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', margin: '8px 0 12px 0' }}>
              <div style={{ flex: advances || 1, backgroundColor: '#10b981' }} title={`Advances: ${advances}`} />
              <div style={{ flex: unchanged || 1, backgroundColor: '#cbd5e1' }} title={`Unchanged: ${unchanged}`} />
              <div style={{ flex: declines || 1, backgroundColor: '#ef4444' }} title={`Declines: ${declines}`} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '12px', textAlign: 'center' }}>
              <div>
                <div style={{ color: '#10b981', fontWeight: 700 }}>{advances}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Advances</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 700 }}>{unchanged}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Unchanged</div>
              </div>
              <div>
                <div style={{ color: '#ef4444', fontWeight: 700 }}>{declines}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Declines</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '12px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Advance/Decline Ratio:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{adRatio}</strong>
            </div>
          </div>
        </Card>

        {/* Gap Analysis */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: 600, margin: '0 0 12px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>Pre-Open Gap Analysis</h3>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Symbol</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Prev Close</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Indicative Open</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Gap %</th>
                </tr>
              </thead>
              <tbody>
                {gapAnalysisList.map((s) => {
                  const isUp = s.gapPercent >= 0;
                  return (
                    <tr key={s.symbol} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{s.symbol}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.prevClose.toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>₹{s.open.toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: isUp ? '#10b981' : '#ef4444' }}>
                        {isUp ? '+' : ''}{s.gapPercent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Gainers, Losers, and Most Active */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {/* Top Gainers */}
        <Card style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 10px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} /> Top Gainers (Pre-Open)
          </h3>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '6px' }}>Symbol</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Chg %</th>
                </tr>
              </thead>
              <tbody>
                {topGainers.map(s => (
                  <tr key={s.symbol} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '6px', fontWeight: 700 }}>{s.symbol}</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>₹{s.ltp.toFixed(2)}</td>
                    <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>+{s.changePercent.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Losers */}
        <Card style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 10px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={16} /> Top Losers (Pre-Open)
          </h3>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '6px' }}>Symbol</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Chg %</th>
                </tr>
              </thead>
              <tbody>
                {topLosers.map(s => (
                  <tr key={s.symbol} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '6px', fontWeight: 700 }}>{s.symbol}</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>₹{s.ltp.toFixed(2)}</td>
                    <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>{s.changePercent.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Most Active */}
        <Card style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 10px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={16} /> Most Active Stocks
          </h3>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '6px' }}>Symbol</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Vol</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Buy/Sell Qty</th>
                </tr>
              </thead>
              <tbody>
                {mostActive.map(s => (
                  <tr key={s.symbol} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '6px', fontWeight: 700 }}>{s.symbol}</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>{s.volume.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '6px', textAlign: 'right', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span style={{ color: '#10b981' }}>{s.buyQty}</span>/<span style={{ color: '#ef4444' }}>{s.sellQty}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Global Markets & F&O Build Up */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
        {/* Global Markets */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: 600, margin: '0 0 12px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={16} /> Global Markets
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
              <span>Dow Jones</span>
              <strong>39,087.38 <span style={{ color: '#10b981', marginLeft: '6px' }}>+0.41%</span></strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
              <span>Nasdaq</span>
              <strong>16,274.94 <span style={{ color: '#10b981', marginLeft: '6px' }}>+0.83%</span></strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
              <span>GIFT Nifty</span>
              <strong>22,485.50 <span style={{ color: '#10b981', marginLeft: '6px' }}>+0.35%</span></strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
              <span>Nikkei 225</span>
              <strong>38,787.38 <span style={{ color: '#ef4444', marginLeft: '6px' }}>-0.26%</span></strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
              <span>Hang Seng</span>
              <strong>18,047.56 <span style={{ color: '#10b981', marginLeft: '6px' }}>+1.12%</span></strong>
            </div>
          </div>
        </Card>

        {/* F&O Derivatives Build Up */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            <h3 style={{ fontSize: '14.5px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coins size={16} /> F&O Section
            </h3>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['oi', 'longBuild', 'shortBuild', 'shortCover', 'longUnwind'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSelectedFoTab(tab)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: selectedFoTab === tab ? 'var(--primary)' : '#f1f5f9',
                    color: selectedFoTab === tab ? '#ffffff' : '#64748b',
                    fontWeight: 600
                  }}
                >
                  {tab === 'oi' ? 'OI Chg' : tab === 'longBuild' ? 'Long Build' : tab === 'shortBuild' ? 'Short Build' : tab === 'shortCover' ? 'Short Cover' : 'Long Unwind'}
                </button>
              ))}
            </div>
          </div>

          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Symbol</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>LTP</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Price Chg %</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>OI Chg %</th>
                </tr>
              </thead>
              <tbody>
                {getFoMockData().map((s, idx) => {
                  let indicatorColor = '#64748b';
                  if (selectedFoTab === 'longBuild' || priceChgSign(s.priceChg, true)) indicatorColor = '#10b981';
                  if (selectedFoTab === 'shortBuild' || priceChgSign(s.priceChg, false)) indicatorColor = '#ef4444';
                  return (
                    <tr key={s.symbol + idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{s.symbol}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.price.toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: s.priceChg >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {s.priceChg >= 0 ? '+' : ''}{s.priceChg.toFixed(2)}%
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: indicatorColor }}>
                        +{s.oiChg}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Strategy Signals & Watchlist Candidates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Buy Candidates */}
        <Card style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: 600, margin: '0 0 12px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={16} /> Breakout Candidates (Gap Up / Bullish)
          </h3>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Symbol</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Indicative Open</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Prev Close</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Signal Status</th>
                </tr>
              </thead>
              <tbody>
                {gapUpCandidates.map(s => (
                  <tr key={s.symbol} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '8px', fontWeight: 700 }}>{s.symbol}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.open.toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.prevClose.toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>BUY SIGNAL</td>
                  </tr>
                ))}
                {gapUpCandidates.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No Gap Up candidates matching breakout criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Sell Candidates */}
        <Card style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: 600, margin: '0 0 12px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={16} /> Breakdown Candidates (Gap Down / Bearish)
          </h3>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Symbol</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Indicative Open</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Prev Close</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Signal Status</th>
                </tr>
              </thead>
              <tbody>
                {gapDownCandidates.map(s => (
                  <tr key={s.symbol} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '8px', fontWeight: 700 }}>{s.symbol}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.open.toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>₹{s.prevClose.toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>SELL SIGNAL</td>
                  </tr>
                ))}
                {gapDownCandidates.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No Gap Down candidates matching breakdown criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function priceChgSign(change: number, isBuildUp: boolean) {
  if (isBuildUp) return change >= 0;
  return change < 0;
}
