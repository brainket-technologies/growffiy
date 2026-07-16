'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../shared/components/views/Card';
import { Loader } from '../../../shared/components/views/Loader';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Search, Download, Loader2 } from 'lucide-react';

type CategoryType = 'Nifty 50' | 'Bank Nifty' | 'F&O' | 'SME' | 'Others' | 'All';

function formatDateToNSE(dateVal: string): string {
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function parseNSEDate(nseDateStr: string): string {
  if (!nseDateStr) return '';
  const d = new Date(nseDateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function StaffScannerPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [preOpenDate, setPreOpenDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(30);
  const [category, setCategory] = useState<CategoryType>('F&O');
  const [symbolQuery, setSymbolQuery] = useState('');
  const [sortField, setSortField] = useState('changePercent');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [historicalData, setHistoricalData] = useState<any[] | null>(null);
  const [loadingHistorical, setLoadingHistorical] = useState(false);

  useEffect(() => {
    fetch('/api/stocks').then(r => r.json()).then(data => {
      if (data.success) {
        setStocks(data.preOpenStocks || []);
        setPreOpenDate(data.preOpenDate || '');
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const fetchHistoricalData = async (dateVal: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateVal === todayStr) { setHistoricalData(null); return; }
    setLoadingHistorical(true);
    try {
      const formattedDate = formatDateToNSE(dateVal);
      const res = await fetch(`/api/stocks?date=${encodeURIComponent(formattedDate)}`);
      const data = await res.json();
      setHistoricalData(data.success ? (data.preOpenStocks || []) : []);
    } catch { setHistoricalData([]); }
    finally { setLoadingHistorical(false); }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120)
        setVisibleCount(prev => Math.min(prev + 30, activeData.length));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [stocks.length, historicalData]);

  if (loading) return <Loader title="Loading Scanner" text="Fetching data..." fullscreen={false} />;

  const activeData = historicalData !== null ? historicalData : stocks;
  const filterByCategory = (stock: any, cat: CategoryType) => {
    if (cat === 'Nifty 50') return !!stock.isNifty50;
    if (cat === 'Bank Nifty') return !!stock.isBankNifty;
    if (cat === 'SME') return !!stock.isSme;
    if (cat === 'F&O') return !!stock.isFo;
    if (cat === 'Others') return !stock.isNifty50 && !stock.isBankNifty && !stock.isSme && !stock.isFo;
    return true;
  };

  const filteredStocks = activeData.filter(stock =>
    filterByCategory(stock, category) && stock.symbol.toLowerCase().includes(symbolQuery.trim().toLowerCase())
  );

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    let valA: any = 0, valB: any = 0;
    if (sortField === 'symbol') return sortAsc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
    if (sortField === 'chng') { valA = a.iep - a.prevClose; valB = b.iep - b.prevClose; }
    else { valA = a[sortField] ?? 0; valB = b[sortField] ?? 0; }
    return valA < valB ? (sortAsc ? -1 : 1) : valA > valB ? (sortAsc ? 1 : -1) : 0;
  });

  const visibleStocks = sortedStocks.slice(0, visibleCount);
  const advances = filteredStocks.filter(s => s.iep - s.prevClose > 0).length;
  const declines = filteredStocks.filter(s => s.iep - s.prevClose < 0).length;
  const topGainer = [...filteredStocks].sort((a, b) => b.changePercent - a.changePercent)[0];
  const topLoser = [...filteredStocks].sort((a, b) => a.changePercent - b.changePercent)[0];

  const handleSort = (field: string) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(['symbol'].includes(field)); }
  };

  const downloadCSV = () => {
    const headers = ['SYMBOL', 'PREV. CLOSE', 'IEP', 'CHNG', '%CHNG'];
    const rows = sortedStocks.map(stock => {
      const chng = stock.iep - stock.prevClose;
      return [
        stock.symbol, stock.prevClose.toFixed(2), stock.iep.toFixed(2),
        `${chng >= 0 ? '+' : ''}${chng.toFixed(2)}`,
        `${chng >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`,
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `scanner_${category.toLowerCase().replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="scanner-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            Scanner
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="date"
                value={selectedDateStr || parseNSEDate(preOpenDate)}
                max={new Date().toISOString().split('T')[0]}
                onChange={async (e) => { const val = e.target.value; if (!val) return; setSelectedDateStr(val); await fetchHistoricalData(val); }}
                style={{
                  fontSize: '14px', fontWeight: 600, color: '#2563eb',
                  backgroundColor: '#eff6ff', padding: '6px 12px',
                  borderRadius: '6px', border: '1px solid #bfdbfe',
                  outline: 'none', cursor: 'pointer', fontFamily: 'inherit'
                }}
              />
              {loadingHistorical && <Loader2 size={16} style={{ animation: 'spin 1.2s linear infinite', color: '#2563eb' }} />}
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Market scanner — pre-open & historical data.</p>
        </div>
      </div>

      <div className="scanner-top-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {topGainer && (
          <Card style={{ padding: '16px', borderLeft: '4px solid var(--accent)' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={15} color="var(--accent)" /> Top Gainer
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-heading)' }}>{topGainer.symbol}</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>IEP: ₹{topGainer.iep.toFixed(2)}</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ArrowUpRight size={16} /> +{topGainer.changePercent.toFixed(2)}%
              </span>
            </div>
          </Card>
        )}
        {topLoser && (
          <Card style={{ padding: '16px', borderLeft: '4px solid var(--danger)' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingDown size={15} color="var(--danger)" /> Top Loser
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-heading)' }}>{topLoser.symbol}</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>IEP: ₹{topLoser.iep.toFixed(2)}</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ArrowDownRight size={16} /> {topLoser.changePercent.toFixed(2)}%
              </span>
            </div>
          </Card>
        )}
        <Card style={{ padding: '16px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>Market Breadth</span>
          <div style={{ display: 'flex', gap: '12px', fontSize: '12.5px', fontWeight: 600, marginTop: '12px' }}>
            <span style={{ color: 'var(--accent)' }}>Adv: {advances}</span>
            <span style={{ color: 'var(--danger)' }}>Dec: {declines}</span>
          </div>
        </Card>
      </div>

      <Card style={{ padding: '24px' }}>
        <div className="scanner-filters" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '12px', 
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-light)' 
        }}>
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
          <button 
            onClick={downloadCSV}
            style={{
              marginLeft: 'auto',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-white)',
              color: 'var(--text-body)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={14} /> Export
          </button>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--border-light)', backgroundColor: 'var(--surface)' }}>
                <th onClick={() => handleSort('symbol')} style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'left' }}>
                  SYMBOL{sortField === 'symbol' ? (sortAsc ? ' ↑' : ' ↓') : ' ↕'}
                </th>
                <th onClick={() => handleSort('iep')} style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                  IEP{sortField === 'iep' ? (sortAsc ? ' ↑' : ' ↓') : ' ↕'}
                </th>
                <th onClick={() => handleSort('chng')} style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                  CHNG{sortField === 'chng' ? (sortAsc ? ' ↑' : ' ↓') : ' ↕'}
                </th>
                <th onClick={() => handleSort('changePercent')} style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                  %CHNG{sortField === 'changePercent' ? (sortAsc ? ' ↑' : ' ↓') : ' ↕'}
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleStocks.map((stock) => {
                const chng = stock.iep - stock.prevClose;
                const isPositive = chng >= 0;
                return (
                  <tr key={stock.symbol} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ fontWeight: 700, padding: '12px 10px', fontSize: '13px', color: 'var(--text-heading)' }}>{stock.symbol}</td>
                    <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right', fontWeight: 700, color: isPositive ? 'var(--accent-dark)' : 'var(--danger)' }}>{stock.iep.toFixed(2)}</td>
                    <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right', fontWeight: 600, color: isPositive ? 'var(--accent-dark)' : 'var(--danger)' }}>{isPositive ? '+' : ''}{chng.toFixed(2)}</td>
                    <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right', fontWeight: 600, color: isPositive ? 'var(--accent-dark)' : 'var(--danger)' }}>{isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%</td>
                  </tr>
                );
              })}
              {visibleStocks.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No data.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) { .scanner-header h1 { font-size: 22px !important; } }
        @media (max-width: 768px) { .scanner-header h1 { font-size: 20px !important; } }
        @media (max-width: 480px) {
          .scanner-header { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .scanner-header h1 { font-size: 18px !important; flex-wrap: wrap !important; }
          .scanner-filters { flex-direction: column !important; align-items: stretch !important; }
          .scanner-filters > div, .scanner-filters > button { width: 100% !important; min-width: 0 !important; }
          .scanner-top-cards { grid-template-columns: 1fr !important; }
          .table-responsive table { font-size: 12px !important; min-width: 0 !important; }
          .table-responsive td, .table-responsive th { padding: 8px 6px !important; }
        }
      `}</style>
    </div>
  );
}
