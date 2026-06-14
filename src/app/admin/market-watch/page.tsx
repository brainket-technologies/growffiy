'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../viewmodels/AppContext';
import { Card } from '../../../views/components/Card';
import { CandlestickChart } from '../../../views/components/CandlestickChart';
import { 
  LineChart, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileSpreadsheet, 
  Loader2
} from 'lucide-react';

type CategoryType = 'NIFTY 50' | 'Nifty Bank' | 'Emerge' | 'Securities in F&O' | 'Others' | 'All';

export default function MarketWatchPage() {
  const { stocks, loading, isSyncing, isWsConnected } = useAppViewModel();

  const [category, setCategory] = useState<CategoryType>('Securities in F&O');
  const [symbolQuery, setSymbolQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'gainers' | 'losers'>('all');
  const [sortField, setSortField] = useState<string>('changePercent');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [denom, setDenom] = useState<'lakhs' | 'crores' | 'billions'>('crores');
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string | null>(null);

  // Derive active stock
  const activeSymbol = selectedStockSymbol || stocks[0]?.symbol || null;
  const selectedStock = stocks.find(s => s.symbol === activeSymbol);

  // Dynamic denomination config
  const getDenomConfig = () => {
    switch (denom) {
      case 'lakhs':
        return { factor: 100, label: 'Lakhs' };
      case 'billions':
        return { factor: 0.01, label: 'Billions' };
      case 'crores':
      default:
        return { factor: 1, label: 'Crores' };
    }
  };
  const { factor, label } = getDenomConfig();

  // Category filtering matching preopen page
  const filterByCategory = (stock: any, cat: CategoryType) => {
    const nifty50 = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'BHARTIARTL', 'ITC', 'HINDUNILVR', 'LT', 'SUNPHARMA', 'NTPC', 'MARUTI', 'JSWSTEEL', 'TATAMOTORS', 'BAJFINANCE', 'ONGC', 'COALINDIA', 'POWERGRID', 'ADANIENT', 'ADANIPORTS'];
    const niftyBank = ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'FEDERALBNK', 'BANDHANBNK', 'YESBANK', 'PNB', 'CANBK'];
    const emerge = ['RVNL', 'ZEEL', 'GMRINFRA', 'NATIONALUM', 'BHEL', 'BIOCON', 'DELTACORP', 'IDEA'];
    
    if (cat === 'NIFTY 50') {
      return nifty50.includes(stock.symbol);
    }
    if (cat === 'Nifty Bank') {
      return niftyBank.includes(stock.symbol);
    }
    if (cat === 'Emerge') {
      return emerge.includes(stock.symbol);
    }
    if (cat === 'Securities in F&O') {
      return true;
    }
    if (cat === 'Others') {
      return !nifty50.includes(stock.symbol) && !niftyBank.includes(stock.symbol) && !emerge.includes(stock.symbol);
    }
    return true;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      const defaultAsc = ['symbol'].includes(field);
      setSortAsc(defaultAsc);
    }
  };

  const filteredStocks = stocks.filter(stock => {
    const matchesCat = filterByCategory(stock, category);
    const matchesSymbol = stock.symbol.toLowerCase().includes(symbolQuery.trim().toLowerCase());
    return matchesCat && matchesSymbol;
  });

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    let valA: any = 0;
    let valB: any = 0;

    if (sortField === 'symbol') {
      valA = a.symbol;
      valB = b.symbol;
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    if (sortField === 'chng') {
      valA = a.iep - a.prevClose;
      valB = b.iep - b.prevClose;
    } else {
      valA = a[sortField] ?? 0;
      valB = b[sortField] ?? 0;
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Derive Advance / Decline counts dynamically from watch list
  const advances = stocks.filter(s => s.changePercent > 0).length;
  const declines = stocks.filter(s => s.changePercent < 0).length;
  const unchanged = stocks.filter(s => s.changePercent === 0).length;

  // Derive top performers
  const topGainer = [...stocks].sort((a, b) => b.changePercent - a.changePercent)[0];
  const topLoser = [...stocks].sort((a, b) => a.changePercent - b.changePercent)[0];

  const handleClear = () => {
    setCategory('Securities in F&O');
    setSymbolQuery('');
    setDenom('crores');
    setSortField('changePercent');
    setSortAsc(false);
    setActiveFilter('all');
  };

  const downloadCSV = () => {
    const headers = ['SYMBOL', 'PREV. CLOSE', 'OPEN', 'HIGH', 'LOW', 'LTP', 'CHNG', '%CHNG', 'PRE-OPEN (IEP)', 'VOLUME', `VALUE (₹ ${label})`, `FFM CAP (₹ ${label})`];
    const rows = sortedStocks.map(stock => {
      const chng = stock.ltp - stock.prevClose;
      const isPositive = chng >= 0;
      const valueVal = (stock.value || 0) * factor;
      const ffmCapVal = (stock.ffmCap || 0) * factor;
      return [
        stock.symbol,
        stock.prevClose.toFixed(2),
        stock.open.toFixed(2),
        stock.high.toFixed(2),
        stock.low.toFixed(2),
        stock.ltp.toFixed(2),
        `${isPositive ? '+' : ''}${chng.toFixed(2)}`,
        `${isPositive ? '+' : ''}${stock.changePercent.toFixed(2)}%`,
        stock.iep.toFixed(2),
        stock.volume || 0,
        valueVal.toFixed(2),
        ffmCapVal.toFixed(2)
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nse_live_watch_${category.toLowerCase().replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return ' ↕';
    return sortAsc ? ' ↑' : ' ↓';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          Nifty 200 Market Watch
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Real-time streaming feeds from Zerodha Kite WebSocket.</p>
      </div>

      {/* Top Gainer, Top Loser & Breadth Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Top Gainer Card */}
        {topGainer && (
          <Card style={{ padding: '16px', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={15} color="#10b981" /> Today's Top Gainer
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>{topGainer.symbol}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>LTP: <strong>₹{topGainer.ltp.toFixed(2)}</strong></span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prev Close: <strong>₹{topGainer.prevClose.toFixed(2)}</strong></span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <ArrowUpRight size={16} /> +{topGainer.changePercent.toFixed(2)}%
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Chg: +₹{topGainer.change.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Top Loser Card */}
        {topLoser && (
          <Card style={{ padding: '16px', borderLeft: '4px solid #ef4444' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingDown size={15} color="#ef4444" /> Today's Top Loser
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>{topLoser.symbol}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>LTP: <strong>₹{topLoser.ltp.toFixed(2)}</strong></span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prev Close: <strong>₹{topLoser.prevClose.toFixed(2)}</strong></span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <ArrowDownRight size={16} /> {topLoser.changePercent.toFixed(2)}%
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Chg: ₹{topLoser.change.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Watchlist Breadth Card */}
        <Card style={{ padding: '16px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>Live Session Breadth</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12.5px', fontWeight: 600 }}>
              <span style={{ color: '#10b981' }}>Adv: {advances}</span>
              <span style={{ color: '#ef4444' }}>Dec: {declines}</span>
              <span style={{ color: '#64748b' }}>Unch: {unchanged}</span>
            </div>
            <div style={{ display: 'flex', width: '100px', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ flex: advances || 1, backgroundColor: '#10b981' }} />
              <div style={{ flex: unchanged || 1, backgroundColor: '#cbd5e1' }} />
              <div style={{ flex: declines || 1, backgroundColor: '#ef4444' }} />
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Main List & Controls */}
        <Card style={{ padding: '24px' }}>
          {/* Filters Control Bar */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '16px', 
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-light)' 
          }}>
            {/* Category Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', height: '38px' }}>
              <span style={{ padding: '0 12px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', height: '100%', borderRight: '1px solid #cbd5e1' }}>
                Category
              </span>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                style={{ 
                  border: 'none', 
                  outline: 'none', 
                  padding: '0 12px', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  height: '100%'
                }}
              >
                <option value="NIFTY 50">NIFTY 50</option>
                <option value="Nifty Bank">Nifty Bank</option>
                <option value="Emerge">Emerge</option>
                <option value="Securities in F&O">Securities in F&O</option>
                <option value="Others">Others</option>
                <option value="All">All</option>
              </select>
            </div>

            {/* Symbol Search */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', height: '38px', minWidth: '200px' }}>
              <span style={{ padding: '0 12px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', height: '100%', borderRight: '1px solid #cbd5e1' }}>
                Symbol
              </span>
              <input 
                type="text" 
                placeholder="Enter symbol" 
                value={symbolQuery}
                onChange={(e) => setSymbolQuery(e.target.value)}
                style={{ 
                  border: 'none', 
                  outline: 'none', 
                  padding: '0 12px', 
                  fontSize: '13px', 
                  color: '#1e293b',
                  width: '100%',
                  height: '100%'
                }}
              />
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => {
                  setActiveFilter('all');
                  setSortField('changePercent');
                  setSortAsc(false);
                }}
                style={{ padding: '0 16px', height: '38px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '13px', fontWeight: 600, backgroundColor: activeFilter === 'all' ? 'var(--color-info-bg)' : '#ffffff', color: activeFilter === 'all' ? 'var(--color-info)' : '#475569' }}
              >
                All Watch
              </button>
              <button
                onClick={() => {
                  setActiveFilter('gainers');
                  setSortField('changePercent');
                  setSortAsc(false);
                }}
                style={{ padding: '0 16px', height: '38px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '13px', fontWeight: 600, backgroundColor: activeFilter === 'gainers' ? '#e6f4ea' : '#ffffff', color: activeFilter === 'gainers' ? '#10b981' : '#475569' }}
              >
                Top Gainers
              </button>
              <button
                onClick={() => {
                  setActiveFilter('losers');
                  setSortField('changePercent');
                  setSortAsc(true);
                }}
                style={{ padding: '0 16px', height: '38px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '13px', fontWeight: 600, backgroundColor: activeFilter === 'losers' ? '#fde8e8' : '#ffffff', color: activeFilter === 'losers' ? '#ef4444' : '#475569' }}
              >
                Top Losers
              </button>
            </div>

            {/* Clear Button */}
            <button 
              onClick={handleClear}
              style={{
                border: '1px solid #ea580c',
                color: '#ea580c',
                backgroundColor: 'transparent',
                borderRadius: '4px',
                padding: '0 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                height: '38px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fff7ed';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Clear
            </button>

            {/* CSV Download Button */}
            <button 
              onClick={downloadCSV}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: 'auto',
                height: '38px'
              }}
            >
              <FileSpreadsheet size={18} style={{ color: '#16a34a' }} />
              <span style={{ color: '#2563eb', textDecoration: 'underline' }}>Download (.csv)</span>
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-title)', margin: 0 }}>
                Nifty 200 Watchlist Candidates
              </h3>
              {isWsConnected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '11px', fontWeight: 600 }}>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '6px', 
                    height: '6px', 
                    backgroundColor: '#10b981', 
                    borderRadius: '50%', 
                    boxShadow: '0 0 8px #10b981'
                  }} />
                  <span>Live Feed</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '6px', 
                    height: '6px', 
                    backgroundColor: '#cbd5e1', 
                    borderRadius: '50%'
                  }} />
                  <span>Standby</span>
                </div>
              )}
              {isSyncing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0ea5e9', fontSize: '11px', fontWeight: 500 }}>
                  <Loader2 size={13} style={{ animation: 'spin 1.2s linear infinite' }} />
                  <span>Syncing ticks...</span>
                </div>
              )}
            </div>
            
            {/* Change Denomination Options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              <span>Change denomination</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input type="radio" name="denom" value="lakhs" checked={denom === 'lakhs'} onChange={() => setDenom('lakhs')} style={{ cursor: 'pointer' }} />
                Lakhs
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input type="radio" name="denom" value="crores" checked={denom === 'crores'} onChange={() => setDenom('crores')} style={{ cursor: 'pointer' }} />
                Crores
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input type="radio" name="denom" value="billions" checked={denom === 'billions'} onChange={() => setDenom('billions')} style={{ cursor: 'pointer' }} />
                Billions
              </label>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive" style={{ overflowX: 'auto', maxHeight: '550px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-light)', backgroundColor: '#f8fafc' }}>
                  <th onClick={() => handleSort('symbol')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>SYMBOL{renderSortIndicator('symbol')}</th>
                  <th onClick={() => handleSort('prevClose')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>PREV. CLOSE{renderSortIndicator('prevClose')}</th>
                  <th onClick={() => handleSort('open')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>OPEN{renderSortIndicator('open')}</th>
                  <th onClick={() => handleSort('high')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>HIGH{renderSortIndicator('high')}</th>
                  <th onClick={() => handleSort('low')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>LOW{renderSortIndicator('low')}</th>
                  <th onClick={() => handleSort('ltp')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>LTP{renderSortIndicator('ltp')}</th>
                  <th onClick={() => handleSort('change')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>CHNG{renderSortIndicator('change')}</th>
                  <th onClick={() => handleSort('changePercent')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>%CHNG{renderSortIndicator('changePercent')}</th>
                  <th onClick={() => handleSort('iep')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>PRE-OPEN{renderSortIndicator('iep')}</th>
                  <th onClick={() => handleSort('volume')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>VOLUME{renderSortIndicator('volume')}</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8fafc', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map((stock) => {
                  const chng = stock.ltp - stock.prevClose;
                  const isPositive = chng >= 0;
                  const isSelected = activeSymbol === stock.symbol;
                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => setSelectedStockSymbol(stock.symbol)}
                      style={{ 
                        borderBottom: '1px solid var(--border-light)',
                        backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 10px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{stock.symbol}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', color: '#475569', textAlign: 'right' }}>{stock.prevClose.toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', color: '#475569', textAlign: 'right' }}>{stock.open.toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', color: '#10b981', textAlign: 'right', fontWeight: 500 }}>{stock.high.toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', color: '#ef4444', textAlign: 'right', fontWeight: 500 }}>{stock.low.toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13.5px', fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>{stock.ltp.toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', fontWeight: 600, color: isPositive ? '#10b981' : '#ef4444', textAlign: 'right' }}>
                        {isPositive ? `+${chng.toFixed(2)}` : chng.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', fontWeight: 700, color: isPositive ? '#10b981' : '#ef4444', textAlign: 'right' }}>
                        {isPositive ? `+${stock.changePercent.toFixed(2)}%` : `${stock.changePercent.toFixed(2)}%`}
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', color: '#475569', textAlign: 'right' }}>{stock.iep.toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '12.5px', color: '#64748b', textAlign: 'right' }}>{stock.volume.toLocaleString()}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStockSymbol(stock.symbol);
                          }}
                          style={{ 
                            background: '#eff6ff', 
                            border: 'none', 
                            color: '#2563eb', 
                            cursor: 'pointer',
                            padding: '6px 10px',
                            borderRadius: '4px',
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
