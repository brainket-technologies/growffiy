'use client';

import React, { useState } from 'react';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';
import { Card } from '../../../shared/components/views/Card';
import { Button } from '../../../shared/components/views/Button';
import { Loader } from '../../../shared/components/views/Loader';
import { Zap, CheckCircle2, Download, Loader2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ShieldAlert, Search } from 'lucide-react';

type CategoryType = 'Nifty 50' | 'Bank Nifty' | 'F&O' | 'SME' | 'Others' | 'All';

export default function PreOpenScannerPage() {
  const { scannerResults, isTradingActive, toggleTrading, loading, isSyncing, isWsConnected, preOpenDate, refreshAllData } = useAppViewModel();

  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(30);
  const [denom, setDenom] = useState<'lakhs' | 'crores' | 'billions'>('crores');
  const [category, setCategory] = useState<CategoryType>('F&O');
  const [symbolQuery, setSymbolQuery] = useState('');
  const [sortField, setSortField] = useState<string>('changePercent');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'gainers' | 'losers'>('all');

  // Infinite Scroll Handler
  React.useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 120
      ) {
        setVisibleCount(prev => Math.min(prev + 30, scannerResults.length));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scannerResults.length]);

  if (loading) {
    return <Loader title="Loading Pre-Open Scanner" text="Fetching indicative quotes and syncing pre-market feeds..." fullscreen={false} />;
  }

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

  const runManualScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch('/api/stocks?refresh=true');
      const data = await res.json();
      if (data.success) {
        await refreshAllData();
      } else {
        setScanMessage('Failed to scan: ' + (data.error || 'Server error'));
      }
    } catch (e: any) {
      setScanMessage('Scan request failed: ' + (e.message || 'Unknown network error'));
    } finally {
      setIsScanning(false);
    }
  };

  const filterByCategory = (stock: any, cat: CategoryType) => {
    if (cat === 'Nifty 50') return !!stock.isNifty50;
    if (cat === 'Bank Nifty') return !!stock.isBankNifty;
    if (cat === 'SME') return !!stock.isSme;
    if (cat === 'F&O') return !!stock.isFo;
    if (cat === 'Others') return !stock.isNifty50 && !stock.isBankNifty && !stock.isSme && !stock.isFo;
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

  const filteredStocks = scannerResults.filter(stock => {
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

  const visibleStocks = sortedStocks.slice(0, visibleCount);

  // Derive Advance / Decline counts dynamically from the filtered pre-open list
  const advances = filteredStocks.filter(s => s.iep - s.prevClose > 0).length;
  const declines = filteredStocks.filter(s => s.iep - s.prevClose < 0).length;
  const unchanged = filteredStocks.filter(s => s.iep - s.prevClose === 0).length;

  // Derive top pre-open performers from the filtered pre-open list
  const topGainer = [...filteredStocks].sort((a, b) => b.changePercent - a.changePercent)[0];
  const topLoser = [...filteredStocks].sort((a, b) => a.changePercent - b.changePercent)[0];

  const handleClear = () => {
    setCategory('F&O');
    setSymbolQuery('');
    setDenom('crores');
    setSortField('changePercent');
    setSortAsc(false);
    setActiveFilter('all');
  };

  const downloadCSV = () => {
    const headers = ['SYMBOL', 'PREV. CLOSE', 'IEP', 'CHNG', '%CHNG', 'FINAL', 'FINAL QUANTITY', `VALUE (₹ ${label})`, `FFM CAP (₹ ${label})`, 'NM 52W H', 'NM 52W L'];
    const rows = sortedStocks.map(stock => {
      const chng = stock.iep - stock.prevClose;
      const isPositive = chng >= 0;
      const valueVal = (stock.value || 0) * factor;
      const ffmCapVal = (stock.ffmCap || 0) * factor;
      return [
        stock.symbol,
        stock.prevClose.toFixed(2),
        stock.iep.toFixed(2),
        `${isPositive ? '+' : ''}${chng.toFixed(2)}`,
        `${isPositive ? '+' : ''}${stock.changePercent.toFixed(2)}%`,
        stock.final.toFixed(2),
        stock.finalQuantity || 0,
        valueVal.toFixed(2),
        ffmCapVal.toFixed(2),
        (stock.nm52wH || stock.high).toFixed(2),
        (stock.nm52wL || stock.low).toFixed(2)
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nse_pre_open_${category.toLowerCase().replace(/ /g, '_')}.csv`);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Pre-Open Scanner {preOpenDate && <span style={{ fontSize: '15px', fontWeight: 600, color: '#2563eb', backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>{preOpenDate}</span>}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Automated scanner identifying top losers for breakout entry criteria.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={runManualScan} isLoading={isScanning}>
            <Zap size={16} /> Run Scan Now
          </Button>
        </div>
      </div>



      {scanMessage && (
        <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <CheckCircle2 size={18} />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Top Performance & Breadth Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Top Gainer Card */}
        {topGainer && (
          <Card style={{ padding: '16px', borderLeft: '4px solid var(--accent)' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={15} color="var(--accent)" /> Today's Top Gainer (Pre-Open)
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>{topGainer.symbol}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>IEP Price: <strong>₹{topGainer.iep.toFixed(2)}</strong></span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prev Close: <strong>₹{topGainer.prevClose.toFixed(2)}</strong></span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <ArrowUpRight size={16} /> +{topGainer.changePercent.toFixed(2)}%
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Chg: +₹{topGainer.change.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Top Loser Card */}
        {topLoser && (
          <Card style={{ padding: '16px', borderLeft: '4px solid var(--danger)' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingDown size={15} color="var(--danger)" /> Today's Top Loser (Pre-Open)
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0' }}>{topLoser.symbol}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>IEP Price: <strong>₹{topLoser.iep.toFixed(2)}</strong></span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prev Close: <strong>₹{topLoser.prevClose.toFixed(2)}</strong></span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <ArrowDownRight size={16} /> {topLoser.changePercent.toFixed(2)}%
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Chg: ₹{topLoser.change.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Advance Decline Breadth Card */}
        <Card style={{ padding: '16px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>Pre-Open Session Breadth</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12.5px', fontWeight: 600 }}>
              <span style={{ color: 'var(--accent)' }}>Adv: {advances}</span>
              <span style={{ color: 'var(--danger)' }}>Dec: {declines}</span>
              <span style={{ color: 'var(--text-muted)' }}>Unch: {unchanged}</span>
            </div>
            <div style={{ display: 'flex', width: '100px', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ flex: advances || 1, backgroundColor: 'var(--accent)' }} />
              <div style={{ flex: unchanged || 1, backgroundColor: 'var(--border-color)' }} />
              <div style={{ flex: declines || 1, backgroundColor: 'var(--danger)' }} />
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Scanner Results List */}
        <Card style={{ padding: '24px' }}>
          {/* Filters Control Bar */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '12px', 
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-light)' 
          }}>
            {/* Category Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', height: '38px', backgroundColor: 'var(--bg-white)' }}>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                style={{ 
                  border: 'none', 
                  outline: 'none', 
                  padding: '0 12px', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: 'var(--text-heading)',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  height: '100%'
                }}
              >
                <option value="All">Category: All</option>
                <option value="Nifty 50">Category: Nifty 50</option>
                <option value="Bank Nifty">Category: Bank Nifty</option>
                <option value="F&O">Category: F&O</option>
                <option value="SME">Category: SME</option>
                <option value="Others">Category: Others</option>
              </select>
            </div>

            {/* Symbol Search */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', height: '38px', minWidth: '220px', backgroundColor: 'var(--bg-white)' }}>
              <Search size={16} color="var(--text-secondary)" style={{ marginRight: '8px' }} />
              <input 
                placeholder="Search symbol..." 
                value={symbolQuery}
                onChange={(e) => setSymbolQuery(e.target.value)}
                style={{ 
                  border: 'none', 
                  outline: 'none', 
                  fontSize: '13px', 
                  color: 'var(--text-heading)',
                  backgroundColor: 'transparent',
                  width: '100%',
                  boxShadow: 'none',
                  padding: 0
                }}
              />
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setActiveFilter('all');
                  setSortField('changePercent');
                  setSortAsc(false);
                }}
                style={{ padding: '0 16px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, backgroundColor: activeFilter === 'all' ? 'var(--color-info-bg)' : 'var(--bg-white)', color: activeFilter === 'all' ? 'var(--color-info)' : 'var(--text-body)' }}
              >
                All Pre-Open
              </button>
              <button
                onClick={() => {
                  setActiveFilter('gainers');
                  setSortField('changePercent');
                  setSortAsc(false);
                }}
                style={{ padding: '0 16px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, backgroundColor: activeFilter === 'gainers' ? 'var(--accent-light)' : 'var(--bg-white)', color: activeFilter === 'gainers' ? 'var(--accent-dark)' : 'var(--text-body)' }}
              >
                Top Gainers
              </button>
              <button
                onClick={() => {
                  setActiveFilter('losers');
                  setSortField('changePercent');
                  setSortAsc(true);
                }}
                style={{ padding: '0 16px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, backgroundColor: activeFilter === 'losers' ? 'var(--danger-light)' : 'var(--bg-white)', color: activeFilter === 'losers' ? 'var(--danger)' : 'var(--text-body)' }}
              >
                Top Losers
              </button>
            </div>

            {/* CSV Export Button */}
            <button 
              onClick={downloadCSV}
              className="btn-export"
              style={{
                marginLeft: 'auto',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} /> Export Excel
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-title)', margin: 0 }}>
                Top Breakout Candidates
              </h3>
              {isWsConnected ? (
                <div style={{ display: 'flex', alignItems: 'center' }} title="Live Feed Connected">
                  <span style={{ 
                    display: 'inline-block', 
                    width: '8px', 
                    height: '8px', 
                    backgroundColor: 'var(--accent)', 
                    borderRadius: '50%', 
                    boxShadow: '0 0 8px var(--accent)'
                  }} />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center' }} title="Standby Mode">
                  <span style={{ 
                    display: 'inline-block', 
                    width: '8px', 
                    height: '8px', 
                    backgroundColor: 'var(--border-color)', 
                    borderRadius: '50%'
                  }} />
                </div>
              )}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '11px', fontWeight: 500 }}>
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

          <div className="table-responsive" style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1100px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-light)', backgroundColor: 'var(--surface)' }}>
                  <th onClick={() => handleSort('symbol')} style={{ position: 'sticky', top: 0, left: 0, zIndex: 20, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', borderRight: '1px solid var(--border-light)' }}>SYMBOL{renderSortIndicator('symbol')}</th>
                  <th onClick={() => handleSort('prevClose')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>PREV. CLOSE{renderSortIndicator('prevClose')}</th>
                  <th onClick={() => handleSort('iep')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>IEP{renderSortIndicator('iep')}</th>
                  <th onClick={() => handleSort('chng')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>CHNG{renderSortIndicator('chng')}</th>
                  <th onClick={() => handleSort('changePercent')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>%CHNG{renderSortIndicator('changePercent')}</th>
                  <th onClick={() => handleSort('final')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>FINAL{renderSortIndicator('final')}</th>
                  <th onClick={() => handleSort('finalQuantity')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>FINAL QUANTITY{renderSortIndicator('finalQuantity')}</th>
                  <th onClick={() => handleSort('value')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>VALUE (₹ {label}){renderSortIndicator('value')}</th>
                  <th onClick={() => handleSort('ffmCap')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>FFM CAP (₹ {label}){renderSortIndicator('ffmCap')}</th>
                  <th onClick={() => handleSort('nm52wH')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>NM 52W H{renderSortIndicator('nm52wH')}</th>
                  <th onClick={() => handleSort('nm52wL')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>NM 52W L{renderSortIndicator('nm52wL')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleStocks.map((stock) => {
                  const chng = stock.iep - stock.prevClose;
                  const isPositive = chng >= 0;
                  const valueVal = (stock.value || 0) * factor;
                  const ffmCapVal = (stock.ffmCap || 0) * factor;

                  return (
                    <tr key={stock.symbol} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'var(--bg-white)', fontWeight: 700, padding: '12px 10px', fontSize: '13px', color: 'var(--text-heading)', borderRight: '1px solid var(--border-light)' }}>{stock.symbol}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right' }}>{stock.prevClose.toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          color: chng === 0 ? 'var(--text-heading)' : isPositive ? 'var(--accent-dark)' : 'var(--danger)'
                        }}>{stock.iep.toFixed(2)}</span>
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          color: chng === 0 ? 'var(--text-muted)' : isPositive ? 'var(--accent-dark)' : 'var(--danger)'
                        }}>
                          {isPositive ? '+' : ''}{chng.toFixed(2)}
                          {chng !== 0 && (
                            <span style={{ fontSize: '10px', marginLeft: '4px' }}>
                              {isPositive ? '▲' : '▼'}
                            </span>
                          )}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right' }}>
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
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          color: chng === 0 ? 'var(--text-heading)' : isPositive ? 'var(--accent-dark)' : 'var(--danger)'
                        }}>{stock.final.toFixed(2)}</span>
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right' }}>{(stock.finalQuantity || 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right' }}>{valueVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right' }}>{ffmCapVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right' }}>{(stock.nm52wH || stock.high).toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right' }}>{(stock.nm52wL || stock.low).toFixed(2)}</td>
                    </tr>
                  );
                })}
                {visibleStocks.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No breakout candidates match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {visibleCount < filteredStocks.length && (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>
              Scroll down to load more breakout candidates...
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
