'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../../../shared/components/views/Card';
import { NSE_INDEX_CATEGORIES, DEFAULT_NSE_INDEX, type NseIndexItem } from '../../../shared/constants/nseIndices';
import {
  Download, RefreshCw, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Search, Loader2
} from 'lucide-react';

interface StockRow {
  priority: number;
  symbol: string;
  companyName: string | null;
  open: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  lastPrice: number;
  change: number;
  pChange: number;
  totalTradedVolume: number;
  totalTradedValue: number;
  yearHigh: number;
  yearLow: number;
  perChange30d: number;
  perChange365d: number;
  series: string | null;
}

type SortField = keyof StockRow | 'value';
type ActiveFilter = 'all' | 'gainers' | 'losers';

function fmt(n: number, d = 2) { return (!n && n !== 0) ? '-' : n.toFixed(d); }
function fmtVol(n: number) { return n ? n.toLocaleString('en-IN') : '-'; }
function fmtVal(n: number, factor: number) { return n ? ((n / 1e7) * factor).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'; }

export default function MarketWatchPage() {
  const [selectedIndex, setSelectedIndex] = useState<NseIndexItem>(DEFAULT_NSE_INDEX);
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [noDataMsg, setNoDataMsg] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [symbolQuery, setSymbolQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('pChange');
  const [sortAsc, setSortAsc] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [denom, setDenom] = useState<'lakhs' | 'crores' | 'billions'>('crores');
  const [visibleCount, setVisibleCount] = useState(50);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPricesRef = useRef<Record<string, number>>({});
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'dn'>>({});

  // History states
  const [isHistory, setIsHistory] = useState(false);
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyTime, setHistoryTime] = useState('09:20');
  const [availableHistory, setAvailableHistory] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isHistory) {
      fetch('/api/market-watch/history/available')
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) setAvailableHistory(d.data);
        })
        .catch(() => {});
    }
  }, [isHistory]);

  const getDenomConfig = () => {
    switch (denom) {
      case 'lakhs': return { factor: 100, label: 'Lakhs' };
      case 'billions': return { factor: 0.01, label: 'Billions' };
      default: return { factor: 1, label: 'Crores' };
    }
  };
  const { factor, label } = getDenomConfig();

  const isFirstFetch = useRef(true);

  const fetchData = useCallback(async (idx: NseIndexItem, silent = false) => {
    if (!silent) { setLoading(true); setError(''); setStocks([]); setNoDataMsg(''); isFirstFetch.current = true; }
    try {
      let fetchUrl = `/api/market-watch/nse?symbol=${encodeURIComponent(idx.symbol)}`;
      if (isHistory && historyDate && historyTime) {
        fetchUrl = `/api/market-watch/history?symbol=${encodeURIComponent(idx.symbol)}&date=${historyDate}&timeSlot=${historyTime}`;
      }
      const res = await fetch(fetchUrl);
      const json = await res.json();
      if (res.status === 404) {
        setNoDataMsg('No snapshot found for this time');
        setLastUpdated('');
        return;
      }
      if (!json.success) throw new Error(json.error || 'Failed to fetch');
      const newRows: StockRow[] = (json.data?.data || []).map((r: any) => ({
        priority: r.priority ?? 0, symbol: r.symbol ?? '',
        companyName: r.companyName ?? null, open: r.open ?? 0,
        dayHigh: r.dayHigh ?? 0, dayLow: r.dayLow ?? 0,
        previousClose: r.previousClose ?? 0, lastPrice: r.lastPrice ?? 0,
        change: r.change ?? 0, pChange: r.pChange ?? 0,
        totalTradedVolume: r.totalTradedVolume ?? 0, totalTradedValue: r.totalTradedValue ?? 0,
        yearHigh: r.yearHigh ?? 0, yearLow: r.yearLow ?? 0,
        perChange30d: r.perChange30d ?? 0, perChange365d: r.perChange365d ?? 0,
        series: r.series ?? null,
      }));

      if (silent && !isFirstFetch.current) {
        // Merge: only update changed values, track flashes
        const flashes: Record<string, 'up' | 'dn'> = {};
        setStocks(prev => {
          const map = new Map(prev.map(s => [s.symbol, s]));
          newRows.forEach(nr => {
            const old = map.get(nr.symbol);
            const prevPrice = prevPricesRef.current[nr.symbol];
            if (old && prevPrice !== undefined && nr.lastPrice !== prevPrice) {
              flashes[nr.symbol] = nr.lastPrice > prevPrice ? 'up' : 'dn';
            }
            map.set(nr.symbol, nr);
          });
          return Array.from(map.values());
        });
        // Update prev prices
        newRows.forEach(nr => { prevPricesRef.current[nr.symbol] = nr.lastPrice; });
        // Apply flash, then clear after 600ms
        if (Object.keys(flashes).length > 0) {
          setFlashMap(flashes);
          setTimeout(() => setFlashMap({}), 600);
        }
      } else {
        setStocks(newRows);
        prevPricesRef.current = {};
        newRows.forEach(nr => { prevPricesRef.current[nr.symbol] = nr.lastPrice; });
        isFirstFetch.current = false;
      }

      setLastUpdated(isHistory ? `${historyDate} ${historyTime}` : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e: any) { if (!silent) setError(e.message || 'Error fetching data'); }
    finally { if (!silent) setLoading(false); }
  }, [isHistory, historyDate, historyTime]);

  useEffect(() => { fetchData(selectedIndex); }, [selectedIndex, fetchData]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (autoRefresh && !isHistory) intervalRef.current = setInterval(() => fetchData(selectedIndex, true), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, isHistory, selectedIndex, fetchData]);

  // Infinite scroll
  useEffect(() => {
    const h = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120)
        setVisibleCount(p => p + 30);
    };
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(a => !a);
    else { setSortField(field); setSortAsc(field === 'symbol'); }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return ' ↕';
    return sortAsc ? ' ↑' : ' ↓';
  };

  const filtered = stocks.filter(s => {
    const q = symbolQuery.trim().toLowerCase();
    const matchQ = !q || s.symbol.toLowerCase().includes(q) || (s.companyName ?? '').toLowerCase().includes(q);
    const matchTab = activeFilter === 'all' ? true : activeFilter === 'gainers' ? s.change > 0 : s.change < 0;
    return matchQ && matchTab;
  });

  const sorted = [...filtered].sort((a, b) => {
    const va = sortField === 'value' ? a.totalTradedValue : (a as any)[sortField] ?? 0;
    const vb = sortField === 'value' ? b.totalTradedValue : (b as any)[sortField] ?? 0;
    if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortAsc ? va - vb : vb - va;
  });

  const visibleStocks = sorted.slice(0, visibleCount);

  const advances = filtered.filter(s => s.change > 0).length;
  const declines = filtered.filter(s => s.change < 0).length;
  const unchanged = filtered.filter(s => s.change === 0).length;

  const topGainer = filtered.length > 0 ? [...filtered].sort((a, b) => b.pChange - a.pChange)[0] : null;
  const topLoser = filtered.length > 0 ? [...filtered].sort((a, b) => a.pChange - b.pChange)[0] : null;

  const downloadCSV = () => {
    const headers = ['SYMBOL', 'COMPANY', 'OPEN', 'HIGH', 'LOW', 'PREV.CLOSE', 'LTP', 'CHANGE', '%CHANGE', 'VOLUME', `VALUE (₹ ${label})`, '52W H', '52W L', '30D %', '365D %'];
    const rows = sorted.map(s => [
      s.symbol, `"${s.companyName ?? ''}"`, s.open, s.dayHigh, s.dayLow,
      s.previousClose, s.lastPrice, s.change, s.pChange,
      s.totalTradedVolume, fmtVal(s.totalTradedValue, factor),
      s.yearHigh, s.yearLow, s.perChange30d, s.perChange365d
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `market-watch-${selectedIndex.label.replace(/ /g, '_')}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Page Title ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            Nifty Market Watch
            {stocks.length > 0 && (
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--primary-light)' }}>
                {stocks.length} Stocks
              </span>
            )}
            {lastUpdated && (
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', background: 'var(--surface)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                {lastUpdated}
              </span>
            )}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Live NSE market data — indices, sectoral, thematic &amp; strategy.
            {loading && <span style={{ color: 'var(--primary)', marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Loader2 size={13} style={{ animation: 'mw-spin 1s linear infinite' }} /> Refreshing...
            </span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!isHistory && (
            <button
              onClick={() => setAutoRefresh(r => !r)}
              className="btn-export"
              style={autoRefresh ? { borderColor: 'var(--accent)', color: 'var(--accent-dark)', background: 'var(--accent-light)' } : {}}
            >
              <RefreshCw size={14} style={{ animation: autoRefresh ? 'mw-spin 1s linear infinite' : 'none' }} />
              {autoRefresh ? 'Live · 1s' : 'Auto Refresh'}
            </button>
          )}
          <button className="btn-export" onClick={() => fetchData(selectedIndex)} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'mw-spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Error & No Data ── */}
      {error && (
        <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}
      {!error && noDataMsg && (
        <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, border: '1px solid var(--border-light)' }}>
          ℹ️ {noDataMsg}
        </div>
      )}

      {/* ── Top Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>

        {/* Top Gainer */}
        {topGainer && (
          <Card style={{ padding: '16px', borderLeft: '4px solid var(--accent)' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={15} color="var(--accent)" /> Top Gainer
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>{topGainer.symbol}</h3>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  LTP: <strong>₹{fmt(topGainer.lastPrice)}</strong>&ensp;|&ensp;Prev: <strong>₹{fmt(topGainer.previousClose)}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-dark)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <ArrowUpRight size={16} /> +{fmt(topGainer.pChange)}%
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Chg: +₹{fmt(topGainer.change)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Top Loser */}
        {topLoser && topLoser.pChange < 0 && (
          <Card style={{ padding: '16px', borderLeft: '4px solid var(--danger)' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingDown size={15} color="var(--danger)" /> Top Loser
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>{topLoser.symbol}</h3>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  LTP: <strong>₹{fmt(topLoser.lastPrice)}</strong>&ensp;|&ensp;Prev: <strong>₹{fmt(topLoser.previousClose)}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <ArrowDownRight size={16} /> {fmt(topLoser.pChange)}%
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Chg: ₹{fmt(topLoser.change)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Breadth Card */}
        <Card style={{ padding: '16px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>Market Breadth</span>
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
          <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-subtle)' }}>
            {filtered.length} stocks · {selectedIndex.label}
          </div>
        </Card>
      </div>

      {/* ── Main Table Card ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Card style={{ padding: '24px' }}>

          {/* ── Filter Bar (same as Pre-Open) ── */}
          <div style={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap',
            gap: '12px', marginBottom: '20px', paddingBottom: '16px',
            borderBottom: '1px solid var(--border-light)'
          }}>
            {/* Index Category dropdown using native select with optgroup */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', height: '38px', backgroundColor: 'var(--bg-white)', maxWidth: '200px' }}>
              <select
                value={selectedIndex.label}
                onChange={e => {
                  for (const cat of NSE_INDEX_CATEGORIES) {
                    const found = cat.indices.find(i => i.label === e.target.value);
                    if (found) { setSelectedIndex(found); break; }
                  }
                }}
                style={{
                  border: 'none', outline: 'none', padding: '0 12px',
                  fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)',
                  backgroundColor: 'transparent', cursor: 'pointer', height: '100%', minWidth: '160px', maxWidth: '200px'
                }}
              >
                {NSE_INDEX_CATEGORIES.map(cat => (
                  <optgroup key={cat.group} label={cat.group}>
                    {cat.indices.map(idx => (
                      <option key={idx.label} value={idx.label}>{idx.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Symbol Search */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', height: '38px', minWidth: '160px', backgroundColor: 'var(--bg-white)' }}>
              <Search size={16} color="var(--text-secondary)" style={{ marginRight: '8px' }} />
              <input
                placeholder="Search symbol..."
                value={symbolQuery}
                onChange={e => setSymbolQuery(e.target.value)}
                style={{
                  border: 'none', outline: 'none', fontSize: '13px',
                  color: 'var(--text-heading)', backgroundColor: 'transparent',
                  width: '100%', boxShadow: 'none', padding: 0
                }}
              />
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setActiveFilter('all'); setSortField('pChange'); setSortAsc(false); }}
                style={{ padding: '0 16px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, backgroundColor: activeFilter === 'all' ? 'var(--primary-light)' : 'var(--bg-white)', color: activeFilter === 'all' ? 'var(--primary)' : 'var(--text-body)' }}
              >All Watch</button>
              <button
                onClick={() => { setActiveFilter('gainers'); setSortField('pChange'); setSortAsc(false); }}
                style={{ padding: '0 16px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, backgroundColor: activeFilter === 'gainers' ? 'var(--accent-light)' : 'var(--bg-white)', color: activeFilter === 'gainers' ? 'var(--accent-dark)' : 'var(--text-body)' }}
              >Top Gainers</button>
              <button
                onClick={() => { setActiveFilter('losers'); setSortField('pChange'); setSortAsc(true); }}
                style={{ padding: '0 16px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, backgroundColor: activeFilter === 'losers' ? 'var(--danger-light)' : 'var(--bg-white)', color: activeFilter === 'losers' ? 'var(--danger)' : 'var(--text-body)' }}
              >Top Losers</button>
            </div>
            
            {/* History Toggle & Selectors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={isHistory} onChange={e => setIsHistory(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                History View
              </label>
              
              {isHistory && (
                <>
                  <select
                    value={historyDate}
                    onChange={e => {
                      setHistoryDate(e.target.value);
                      const times = availableHistory[e.target.value] || [];
                      if (times.length > 0 && !times.includes(historyTime)) setHistoryTime(times[0]);
                    }}
                    style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 8px', height: '34px', fontSize: '13px', outline: 'none', backgroundColor: 'var(--bg-white)' }}
                  >
                    {Object.keys(availableHistory).length === 0 ? (
                      <option value={historyDate}>{historyDate}</option>
                    ) : (
                      Object.keys(availableHistory).sort((a, b) => b.localeCompare(a)).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))
                    )}
                  </select>
                  <select 
                    value={historyTime}
                    onChange={e => setHistoryTime(e.target.value)}
                    style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 8px', height: '34px', fontSize: '13px', outline: 'none', backgroundColor: 'var(--bg-white)' }}
                  >
                    {['09:20', '09:30', '09:45', '12:00'].map(t => {
                      const isDisabled = Object.keys(availableHistory).length > 0 && !(availableHistory[historyDate] || []).includes(t);
                      return (
                        <option key={t} value={t} disabled={isDisabled}>
                          {t === '09:20' ? '9:20 AM' : t === '09:30' ? '9:30 AM' : t === '09:45' ? '9:45 AM' : '12:00 PM'}
                        </option>
                      );
                    })}
                  </select>
                </>
              )}
            </div>

            {/* Export */}
            <button onClick={downloadCSV} className="btn-export" style={{ marginLeft: 'auto', height: '38px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} /> Export Excel
            </button>
          </div>

          {/* Sub-header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-title)', margin: 0 }}>
                {selectedIndex.label} — Watchlist Stocks
                {stocks.length > 0 && (
                  <span style={{ marginLeft: 10, fontSize: '12px', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 10px', borderRadius: '20px' }}>
                    {sorted.length} / {stocks.length}
                  </span>
                )}
              </h3>
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '11px', fontWeight: 500 }}>
                  <Loader2 size={13} style={{ animation: 'mw-spin 1.2s linear infinite' }} /> Syncing...
                </div>
              )}
            </div>
            {/* Denomination */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              <span>Value denomination</span>
              {(['lakhs', 'crores', 'billions'] as const).map(d => (
                <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', textTransform: 'capitalize' }}>
                  <input type="radio" name="mw-denom" value={d} checked={denom === d} onChange={() => setDenom(d)} style={{ cursor: 'pointer' }} />
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive" style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1200px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-light)', backgroundColor: 'var(--surface)' }}>
                  <th onClick={() => handleSort('symbol')} style={{ position: 'sticky', top: 0, left: 0, zIndex: 20, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', borderRight: '1px solid var(--border-light)' }}>
                    SYMBOL{renderSortIndicator('symbol')}
                  </th>
                  {([
                    ['open', 'OPEN'], ['dayHigh', 'HIGH'], ['dayLow', 'LOW'],
                    ['previousClose', 'PREV. CLOSE'], ['lastPrice', 'LTP'],
                    ['change', 'CHANGE'], ['pChange', '%CHANGE'],
                    ['totalTradedVolume', 'VOLUME'], ['value', `VALUE (₹ ${label})`],
                    ['yearHigh', '52W H'], ['yearLow', '52W L'],
                    ['perChange30d', '30D %'], ['perChange365d', '365D %'],
                  ] as [SortField, string][]).map(([field, label_]) => (
                    <th key={field} onClick={() => handleSort(field)} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                      {label_}{renderSortIndicator(field)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleStocks.map((s) => {
                  const up = s.change > 0, dn = s.change < 0;
                  const cc = up ? 'var(--accent-dark)' : dn ? 'var(--danger)' : 'var(--text-muted)';
                  const flash = flashMap[s.symbol];
                  return (
                    <tr key={s.symbol} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.3s' }} className={flash ? `mw-flash-${flash}` : ''}>
                      <td style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'var(--bg-white)', fontWeight: 700, padding: '12px 10px', fontSize: '13px', color: 'var(--text-heading)', borderRight: '1px solid var(--border-light)' }}>
                        {s.symbol}
                        {s.companyName && <div style={{ fontSize: '10px', color: 'var(--text-subtle)', fontWeight: 400, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.companyName}</div>}
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right', transition: 'color 0.3s' }}>{fmt(s.open)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right', color: 'var(--accent-dark)', fontWeight: 600, transition: 'color 0.3s' }}>{fmt(s.dayHigh)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right', color: 'var(--danger)', fontWeight: 600, transition: 'color 0.3s' }}>{fmt(s.dayLow)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right', transition: 'color 0.3s' }}>{fmt(s.previousClose)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right', transition: 'color 0.3s' }}>
                        <span style={{ fontWeight: 700, color: cc }}>{fmt(s.lastPrice)}</span>
                        {s.change !== 0 && <span style={{ fontSize: '10px', marginLeft: '4px', color: cc }}>{up ? '▲' : '▼'}</span>}
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right', transition: 'color 0.3s' }}>
                        <span style={{ fontWeight: 700, color: cc }}>
                          {up ? '+' : ''}{fmt(s.change)}
                          {s.change !== 0 && <span style={{ fontSize: '10px', marginLeft: '4px' }}>{up ? '▲' : '▼'}</span>}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right', transition: 'color 0.3s' }}>
                        <span style={{ fontWeight: 700, color: cc }}>
                          {up ? '+' : ''}{fmt(s.pChange)}%
                          {s.pChange !== 0 && <span style={{ fontSize: '10px', marginLeft: '4px' }}>{up ? '▲' : '▼'}</span>}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right', transition: 'color 0.3s' }}>{fmtVol(s.totalTradedVolume)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right', transition: 'color 0.3s' }}>{fmtVal(s.totalTradedValue, factor)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right' }}>{fmt(s.yearHigh)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right' }}>{fmt(s.yearLow)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 600, color: s.perChange30d >= 0 ? 'var(--accent-dark)' : 'var(--danger)' }}>
                          {s.perChange30d >= 0 ? '+' : ''}{fmt(s.perChange30d)}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 600, color: s.perChange365d >= 0 ? 'var(--accent-dark)' : 'var(--danger)' }}>
                          {s.perChange365d >= 0 ? '+' : ''}{fmt(s.perChange365d)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {visibleStocks.length === 0 && (
                  <tr>
                    <td colSpan={14} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      {loading ? 'Loading market data...' : 'No stocks match the selected filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {visibleCount < sorted.length && (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>
              Scroll down to load more stocks...
            </div>
          )}
        </Card>
      </div>

      <style>{`
        @keyframes mw-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes mw-flash-up { 0% { background: transparent; } 30% { background: rgba(34,197,94,0.18); } 100% { background: transparent; } }
        @keyframes mw-flash-dn { 0% { background: transparent; } 30% { background: rgba(239,68,68,0.15); } 100% { background: transparent; } }
        .mw-flash-up { animation: mw-flash-up 0.6s ease-out; }
        .mw-flash-dn { animation: mw-flash-dn 0.6s ease-out; }
      `}</style>
    </div>
  );
}
