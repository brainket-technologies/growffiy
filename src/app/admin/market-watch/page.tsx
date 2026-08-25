'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';
import { Card } from '../../../shared/components/views/Card';
import { CandlestickChart } from '../../../shared/components/views/CandlestickChart';
import { 
  LineChart, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Loader2,
  Search,
  Calendar,
  Clock,
  RefreshCw,
  Zap
} from 'lucide-react';

type CategoryType = string;

// Static fallback NSE holidays (used until dynamic data loads)
const FALLBACK_HOLIDAYS: { date: string; name: string }[] = [
  { date: '2025-01-26', name: 'Republic Day' }, { date: '2025-02-19', name: 'Chhatrapati Shivaji Maharaj Jayanti' },
  { date: '2025-03-14', name: 'Holi' }, { date: '2025-03-31', name: 'Id-Ul-Fitr (Ramzan Id)' },
  { date: '2025-04-10', name: 'Ram Navami' }, { date: '2025-04-14', name: 'Dr. Ambedkar Jayanti' },
  { date: '2025-04-18', name: 'Good Friday' }, { date: '2025-05-01', name: 'Maharashtra Day' },
  { date: '2025-08-15', name: 'Independence Day' }, { date: '2025-10-02', name: 'Gandhi Jayanti' },
  { date: '2025-10-21', name: 'Diwali (Laxmi Pujan)' }, { date: '2025-10-22', name: 'Diwali (Balipratipada)' },
  { date: '2025-11-05', name: 'Prakash Gurpurb Sri Guru Nanak Dev Ji' }, { date: '2025-12-25', name: 'Christmas' },
  { date: '2026-01-26', name: 'Republic Day' }, { date: '2026-03-02', name: 'Mahashivratri' },
  { date: '2026-03-30', name: 'Holi' }, { date: '2026-04-02', name: 'Ram Navami' },
  { date: '2026-04-06', name: 'Mahavir Jayanti' }, { date: '2026-04-14', name: 'Dr. Ambedkar Jayanti' },
  { date: '2026-05-01', name: 'Maharashtra Day' }, { date: '2026-08-15', name: 'Independence Day' },
  { date: '2026-09-28', name: 'Id-Ul-Zuha' }, { date: '2026-10-15', name: 'Diwali (Laxmi Pujan)' },
  { date: '2026-12-25', name: 'Christmas' },
];

function buildHolidaySet(list: { date: string; name: string }[]): Set<string> {
  return new Set(list.map(h => h.date));
}

function buildHolidayNameMap(list: { date: string; name: string }[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const h of list) m[h.date] = h.name;
  return m;
}

function isTradingDayFn(dateStr: string, holidaySet: Set<string>, tradingDayNames: string[]): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  const dayIdx = d.getDay();
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayName = dayNames[dayIdx];
  if (!tradingDayNames.includes(dayName)) return false;
  if (holidaySet.has(dateStr)) return false;
  return true;
}

function getPrevTradingDayFn(dateStr: string, holidaySet: Set<string>, tradingDayNames: string[]): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  let attempts = 0;
  while (attempts < 14) {
    const s = d.toISOString().split('T')[0];
    if (isTradingDayFn(s, holidaySet, tradingDayNames)) return s;
    d.setDate(d.getDate() - 1);
    attempts++;
  }
  return dateStr;
}
function getLatestTradingDayFn(holidaySet: Set<string>, tradingDayNames: string[]): string {
  const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const todayStr = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, '0')}-${String(nowIST.getDate()).padStart(2, '0')}`;
  const nowHHMM = `${String(nowIST.getHours()).padStart(2,'0')}:${String(nowIST.getMinutes()).padStart(2,'0')}`;
  
  let d = new Date(nowIST);
  let attempts = 0;
  while (attempts < 14) {
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (isTradingDayFn(s, holidaySet, tradingDayNames) && s <= todayStr) {
      if (s === todayStr && nowHHMM < '09:20') {
        // Skip today if it is before 09:20 AM
      } else {
        return s;
      }
    }
    d.setDate(d.getDate() - 1);
    attempts++;
  }
  return todayStr;
}
function CategorySelectorMw({ current, onChange, categories }: { current: string; onChange: (val: string) => void; categories: Record<string, string[]> }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (window as any)._toggleCategoryMw = () => setOpen(prev => !prev);
    const clickOutside = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => {
      delete (window as any)._toggleCategoryMw;
      document.removeEventListener('mousedown', clickOutside);
    };
  }, []);

  if (!open) return null;

  return (
    <div 
      ref={dropRef}
      style={{ 
        position: 'absolute', 
        top: '42px', 
        left: 0, 
        zIndex: 1000, 
        backgroundColor: 'var(--bg-white)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '8px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
        width: '320px', 
        padding: '12px' 
      }}
    >
      <input 
        type="text" 
        placeholder="Search category/index..." 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
        style={{ 
          width: '100%', 
          height: '34px', 
          border: '1px solid var(--border-color)', 
          borderRadius: '6px', 
          padding: '0 10px', 
          fontSize: '13px', 
          outline: 'none', 
          marginBottom: '10px' 
        }}
      />
      <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {Object.entries(categories).map(([group, list]) => {
          const filtered = list.filter(item => item.toLowerCase().includes(search.toLowerCase()));
          if (filtered.length === 0) return null;
          return (
            <div key={group} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border-light)', marginBottom: '4px' }}>
                {group}
              </div>
              {filtered.map(item => (
                <div 
                  key={item}
                  onClick={() => { onChange(item); setOpen(false); }}
                  style={{ 
                    padding: '6px 8px', 
                    paddingLeft: '16px',
                    borderRadius: '4px', 
                    cursor: 'pointer', 
                    fontSize: '13px',
                    backgroundColor: current === item ? 'var(--bg-light)' : 'transparent',
                    fontWeight: current === item ? 'bold' : 'normal',
                    color: 'var(--text-heading)'
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}


export default function MarketWatchPage() {
  const { stocks, loading, isSyncing, isWsConnected, clients, dashboardStats, isTradingActive } = useAppViewModel();

  const [category, setCategory] = useState<CategoryType>('NIFTY 500');
  const [symbolQuery, setSymbolQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'gainers' | 'losers' | 'equal_any' | 'equal_open_high' | 'equal_open_low' | 'equal_open_close' | 'equal_high_low' | 'equal_high_close' | 'equal_low_close'>('all');
  const [sortField, setSortField] = useState<string>('changePercent');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [denom, setDenom] = useState<'lakhs' | 'crores' | 'billions'>('crores');
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string | null>(null);
  const [liveIndexStocks, setLiveIndexStocks] = useState<any[]>([]);
  const [loadingIndex, setLoadingIndex] = useState<boolean>(false);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [indexCategories, setIndexCategories] = useState<Record<string, string[]>>({});
  const [indexSymbols, setIndexSymbols] = useState<string[]>([]); // symbol list for current category

  // New Historical View states
  const [viewMode, setViewMode] = useState<'live' | 'historical'>('live');
  const [historicalDate, setHistoricalDate] = useState<string>(() => {
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const todayStr = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, '0')}-${String(nowIST.getDate()).padStart(2, '0')}`;
    const nowHHMM = `${String(nowIST.getHours()).padStart(2,'0')}:${String(nowIST.getMinutes()).padStart(2,'0')}`;
    const hSet = new Set(FALLBACK_HOLIDAYS.map(h => h.date));
    let d = new Date(nowIST);
    let attempts = 0;
    while (attempts < 14) {
      const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = hSet.has(s);
      if (!isWeekend && !isHoliday && s <= todayStr) {
        if (s === todayStr && nowHHMM < '09:20') {
          // Skip today if before 09:20 AM
        } else {
          return s;
        }
      }
      d.setDate(d.getDate() - 1);
      attempts++;
    }
    return todayStr;
  });
  const [dateWarning, setDateWarning] = useState<string>('');
  const [historicalTime, setHistoricalTime] = useState<string>('09:20');
  const [historicalStocks, setHistoricalStocks] = useState<any[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState<boolean>(false);
  const [isFetchingFromKite, setIsFetchingFromKite] = useState<boolean>(false);
  const [fetchProgress, setFetchProgress] = useState<number>(0);
  const [fetchedSymbols, setFetchedSymbols] = useState<number>(0);
  const [totalSymbols, setTotalSymbols] = useState<number>(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  // Dynamic market calendar from settings
  const [dynamicHolidays, setDynamicHolidays] = useState<{ date: string; name: string }[]>(FALLBACK_HOLIDAYS);
  const [dynamicTradingDays, setDynamicTradingDays] = useState<string[]>(['Mon','Tue','Wed','Thu','Fri']);

  const holidaySet = React.useMemo(() => buildHolidaySet(dynamicHolidays), [dynamicHolidays]);
  const holidayNameMap = React.useMemo(() => buildHolidayNameMap(dynamicHolidays), [dynamicHolidays]);

  const isTradingDay = (d: string) => isTradingDayFn(d, holidaySet, dynamicTradingDays);
  const getPrevTradingDay = (d: string) => getPrevTradingDayFn(d, holidaySet, dynamicTradingDays);

  // Load market calendar from settings API safely
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(async r => {
        // If redirect happens or returns HTML (like login page), abort parsing JSON
        const contentType = r.headers.get('content-type') || '';
        if (!r.ok || contentType.includes('text/html')) {
          throw new Error('Not authenticated or invalid API response format');
        }
        return r.json();
      })
      .then(data => {
        let loadedHolidays = FALLBACK_HOLIDAYS;
        let loadedTradingDays = ['Mon','Tue','Wed','Thu','Fri'];

        if (data && data.settings) {
          try {
            const h = JSON.parse(data.settings.market_holidays || '[]');
            if (Array.isArray(h) && h.length > 0) {
              loadedHolidays = h;
              setDynamicHolidays(h);
            }
          } catch {}
          try {
            const td = JSON.parse(data.settings.trading_days || '[]');
            if (Array.isArray(td) && td.length > 0) {
              loadedTradingDays = td;
              setDynamicTradingDays(td);
            }
          } catch {}
        }

        // Correct default state to latest valid trading day
        const hSet = buildHolidaySet(loadedHolidays);
        const latest = getLatestTradingDayFn(hSet, loadedTradingDays);
        setHistoricalDate(latest);
      })
      .catch((err) => {
        console.warn('Using fallback local market configuration:', err.message);
        // Safe fallback initialization
        const hSet = buildHolidaySet(FALLBACK_HOLIDAYS);
        const latest = getLatestTradingDayFn(hSet, ['Mon','Tue','Wed','Thu','Fri']);
        setHistoricalDate(latest);
      });
  }, []);

  // Fetch NSE indices categories dynamically from server
  useEffect(() => {
    fetch('/api/market-watch/indices')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.categories) {
          setIndexCategories(data.categories);
        }
      })
      .catch(err => console.warn('Failed to load index categories:', err.message));
  }, []);

  // Close calendar on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch live index stocks from Kite via master client when category changes
  const CATEGORY_INDEX_MAP: Record<string, string> = {
    'All': 'NIFTY 500',
    'F&O': 'NIFTY 50',
    'SME': 'NIFTY SMALLCAP 100',
  };
  useEffect(() => {
    const indexName = CATEGORY_INDEX_MAP[category] || category;
    
    // First load
    setLoadingIndex(true);
    setIndexError(null);
    setLiveIndexStocks([]);
    setIndexSymbols([]);

    let active = true;

    // Fetch initial symbols list (CSV)
    fetch(`/api/market-watch/symbols?category=${encodeURIComponent(category)}`)
      .then(r => r.json())
      .then(symData => {
        if (active && symData.symbols && symData.symbols.length > 0) {
          setIndexSymbols(symData.symbols);
        }
      })
      .catch(() => {});

    // Initial Kite live quotes fetch
    const fetchQuotes = () => {
      fetch(`/api/market-watch?index=${encodeURIComponent(indexName)}`)
        .then(r => r.json())
        .then(liveData => {
          if (!active) return;
          if (liveData.success) {
            setLiveIndexStocks(liveData.stocks || []);
            setIndexError(null);
          } else {
            setIndexError(liveData.error || 'Failed to fetch live stocks');
          }
        })
        .catch(err => {
          if (active) setIndexError(err.message);
        })
        .finally(() => {
          if (active) setLoadingIndex(false);
        });
    };

    fetchQuotes();

    // Start 3-second auto update interval
    const intervalId = setInterval(() => {
      if (viewMode === 'live') {
        fetch(`/api/market-watch?index=${encodeURIComponent(indexName)}`)
          .then(r => r.json())
          .then(liveData => {
            if (active && liveData.success) {
              setLiveIndexStocks(liveData.stocks || []);
            }
          })
          .catch(() => {});
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [category, viewMode]);


  // Keep liveIndexStocks synced with real-time websocket updates from global context
  useEffect(() => {
    if (viewMode === 'live' && liveIndexStocks.length > 0 && stocks.length > 0) {
      setLiveIndexStocks(prev => {
        let changed = false;
        const updated = prev.map(p => {
          const match = stocks.find(s => s.symbol === p.symbol);
          if (match && (match.ltp !== p.ltp || match.volume !== p.volume || match.high !== p.high || match.low !== p.low)) {
            changed = true;
            const change = match.ltp - p.prevClose;
            const changePercent = p.prevClose > 0 ? (change / p.prevClose) * 100 : 0;
            return {
              ...p,
              ltp: match.ltp,
              open: match.open || p.open,
              high: match.high || p.high,
              low: match.low || p.low,
              volume: match.volume || p.volume,
              finalQuantity: match.volume || p.volume,
              change: parseFloat(change.toFixed(2)),
              changePercent: parseFloat(changePercent.toFixed(2)),
              value: parseFloat(((match.volume || p.volume) * match.ltp / 10000000).toFixed(2))
            };
          }
          return p;
        });
        return changed ? updated : prev;
      });
    }
  }, [stocks, viewMode]);


  // Fetch OHLC quotes API helper
  const fetchHistoricalOhlc = async (dateVal: string, timeVal: string, triggerKiteFetch = false, forceRefresh = false) => {
    if (triggerKiteFetch) {
      setIsFetchingFromKite(true);
      setFetchProgress(0);
      setFetchedSymbols(0);
      setTotalSymbols(0);

      try {
        // 1. Trigger background fetch (returns immediately)
        const triggerRes = await fetch(`/api/stocks/ohlc?date=${dateVal}&time=${timeVal}&fetch=true${forceRefresh ? '&force=true' : ''}`);
        const triggerData = await triggerRes.json();

        // If data already exists in DB (status=done with stocks) and we are not forcing refresh, load directly
        if (!forceRefresh && triggerData.status === 'done' && Array.isArray(triggerData.stocks)) {
          setHistoricalStocks(triggerData.stocks);
          setFetchProgress(100);
          setTimeout(() => { setIsFetchingFromKite(false); setFetchProgress(0); }, 600);
          return;
        }

        // 2. Poll every 2s for real progress from server
        await new Promise<void>((resolve) => {
          const pollInterval = setInterval(async () => {
            try {
              const pollRes = await fetch(`/api/stocks/ohlc?date=${dateVal}&time=${timeVal}&poll=true`);
              const pollData = await pollRes.json();

              if (pollData.status === 'running') {
                const processed = pollData.processed || 0;
                const total = pollData.total || 1;
                const pct = Math.min(Math.round((processed / total) * 95), 95);
                setFetchProgress(pct);
                setFetchedSymbols(processed);
                setTotalSymbols(total);
              } else if (pollData.status === 'done' || pollData.status === 'idle') {
                clearInterval(pollInterval);
                setFetchProgress(100);
                if (Array.isArray(pollData.stocks)) {
                  setHistoricalStocks(pollData.stocks);
                } else {
                  setHistoricalStocks([]);
                }
                resolve();
              }
            } catch (e) {
              console.error('Poll error:', e);
            }
          }, 2000);
        });

      } catch (err) {
        console.error('Failed to trigger historical OHLC fetch:', err);
        setHistoricalStocks([]);
      } finally {
        setTimeout(() => { setIsFetchingFromKite(false); setFetchProgress(0); }, 600);
      }
    } else {
      setLoadingHistorical(true);
      try {
        const res = await fetch(`/api/stocks/ohlc?date=${dateVal}&time=${timeVal}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.stocks)) {
          setHistoricalStocks(data.stocks);
        } else {
          setHistoricalStocks([]);
        }
      } catch (err) {
        console.error('Failed to fetch historical OHLC:', err);
        setHistoricalStocks([]);
      } finally {
        setLoadingHistorical(false);
      }
    }
  };

  useEffect(() => {

    if (viewMode === 'historical') {
      fetchHistoricalOhlc(historicalDate, historicalTime);
    } else {
      if (activeFilter.startsWith('equal_')) setActiveFilter('all');
    }
  }, [viewMode, historicalDate, historicalTime, category]);

  const activeStocksSource = (() => {
    if (viewMode === 'historical') {
      // Filter historical stocks by selected index symbols if available
      if (indexSymbols.length > 0) {
        return historicalStocks.filter((s: any) => indexSymbols.includes(s.symbol));
      }
      return historicalStocks;
    }
    return liveIndexStocks; // always dynamic — empty until index is selected
  })();

  // Derive active stock details for candlestick panel
  const selectedStock = selectedStockSymbol ? activeStocksSource.find(s => s.symbol === selectedStockSymbol) : null;

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

  // Build symbol → category map from live stocks (used to filter historical stocks)
  const symbolCategoryMap = React.useMemo(() => {
    const map: Record<string, { isNifty50: boolean; isNifty500: boolean; isBankNifty: boolean; isFo: boolean; isSme: boolean }> = {};
    for (const s of stocks) {
      map[s.symbol] = {
        isNifty50: !!s.isNifty50,
        isNifty500: !!s.isNifty500,
        isBankNifty: !!s.isBankNifty,
        isFo: !!s.isFo,
        isSme: !!s.isSme,
      };
    }
    return map;
  }, [stocks]);

  // Category filtering — works for both live and historical mode
  const filterByCategory = (stock: any, cat: CategoryType) => {
    if (cat === 'All') return true;
    // In historical mode: use stock's own flags if available, else fall back to live symbolCategoryMap
    const flags = viewMode === 'historical'
      ? (stock.isFo !== undefined
          ? stock  // historical stock already has flags (from fixed OHLC API)
          : (symbolCategoryMap[stock.symbol] ?? { isNifty50: false, isNifty500: false, isBankNifty: false, isFo: false, isSme: false }))
      : stock;
    if (cat === 'Nifty 50') return !!flags.isNifty50;
    if (cat === 'Nifty 500') return !!flags.isNifty500;
    if (cat === 'Bank Nifty') return !!flags.isBankNifty;
    if (cat === 'SME') return !!flags.isSme;
    if (cat === 'F&O') return !!flags.isFo;
    if (cat === 'Others') return !flags.isNifty50 && !flags.isNifty500 && !flags.isBankNifty && !flags.isSme && !flags.isFo;
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

  const [sortedStocks, setSortedStocks] = useState<any[]>([]);

  useEffect(() => {
    const filtered = activeStocksSource.filter(stock => {
      const matchesCat = filterByCategory(stock, category);
      const matchesSymbol = stock.symbol.toLowerCase().includes(symbolQuery.trim().toLowerCase());
      
      const chng = stock.ltp - stock.prevClose;
      if (activeFilter === 'gainers') return matchesCat && matchesSymbol && chng > 0;
      if (activeFilter === 'losers') return matchesCat && matchesSymbol && chng < 0;
      if (activeFilter.startsWith('equal_')) {
        const eq = (a: number, b: number) => Math.abs(a - b) < 0.01;
        const pair = activeFilter.replace('equal_', '') as 'any' | 'open_high' | 'open_low' | 'open_close' | 'high_low' | 'high_close' | 'low_close';
        switch (pair) {
          case 'open_high': return matchesCat && matchesSymbol && eq(stock.open, stock.high);
          case 'open_low': return matchesCat && matchesSymbol && eq(stock.open, stock.low);
          case 'open_close': return matchesCat && matchesSymbol && eq(stock.open, stock.ltp);
          case 'high_low': return matchesCat && matchesSymbol && eq(stock.high, stock.low);
          case 'high_close': return matchesCat && matchesSymbol && eq(stock.high, stock.ltp);
          case 'low_close': return matchesCat && matchesSymbol && eq(stock.low, stock.ltp);
          default: return matchesCat && matchesSymbol && (
            eq(stock.open, stock.high) || eq(stock.open, stock.low) || eq(stock.open, stock.ltp) ||
            eq(stock.high, stock.low) || eq(stock.high, stock.ltp) || eq(stock.low, stock.ltp)
          );
        }
      }
      return matchesCat && matchesSymbol;
    });

    const sorted = [...filtered].sort((a, b) => {
      let valA = sortField === 'symbol' ? a.symbol : (a[sortField] ?? 0);
      let valB = sortField === 'symbol' ? b.symbol : (b[sortField] ?? 0);
      if (sortField === 'symbol') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    setSortedStocks(sorted);
  }, [activeStocksSource, category, symbolQuery, activeFilter, sortField, sortAsc]);

  // Market Breadth Counters
  const advances = activeStocksSource.filter(s => (s.ltp - s.prevClose) > 0).length;
  const declines = activeStocksSource.filter(s => (s.ltp - s.prevClose) < 0).length;
  const unchanged = activeStocksSource.length - advances - declines;

  const downloadCSV = () => {
    let headersArr = [];
    if (viewMode === 'historical') {
      headersArr = ['SYMBOL', 'OPEN', 'HIGH', 'LOW', 'CLOSE', 'CHANGE', 'CHANGE PERCENT'];
    } else {
      headersArr = ['SYMBOL', 'PREV CLOSE', 'OPEN', 'HIGH', 'LOW', 'LTP', 'CHANGE', 'CHANGE PERCENT', 'PRE-OPEN', 'VOLUME'];
    }

    const csvRows = [headersArr.join(',')];
    for (const stock of sortedStocks) {
      const chng = stock.ltp - stock.prevClose;
      let values = [];
      if (viewMode === 'historical') {
        values = [
          stock.symbol,
          stock.open.toFixed(2),
          stock.high.toFixed(2),
          stock.low.toFixed(2),
          stock.ltp.toFixed(2),
          chng.toFixed(2),
          stock.changePercent.toFixed(2)
        ];
      } else {
        values = [
          stock.symbol,
          stock.prevClose.toFixed(2),
          stock.open.toFixed(2),
          stock.high.toFixed(2),
          stock.low.toFixed(2),
          stock.ltp.toFixed(2),
          chng.toFixed(2),
          stock.changePercent.toFixed(2),
          stock.iep.toFixed(2),
          stock.volume
        ];
      }
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `market_watch_${viewMode}_${category.toLowerCase().replace(/ /g, '_')}.csv`);
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
      {/* Title & Mode Switch Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Nifty Market Watch 
            <span style={{ fontSize: '13px', fontWeight: 600, color: viewMode === 'live' ? '#10b981' : '#f59e0b', backgroundColor: viewMode === 'live' ? '#ecfdf5' : '#fffbeb', padding: '4px 8px', borderRadius: '6px', border: `1.5px solid ${viewMode === 'live' ? '#a7f3d0' : '#fde68a'}` }}>
              {viewMode === 'live' ? 'Live Streaming' : 'Historical OHLC'}
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {viewMode === 'live' 
              ? 'Real-time streaming feeds from Zerodha Kite WebSocket.' 
              : `Historical snapshots retrieved for date ${historicalDate} at ${historicalTime} AM.`}
          </p>
        </div>

        {/* View Mode Toggle Controls */}
        <div style={{ display: 'flex', gap: '8px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', backgroundColor: 'var(--surface)' }}>
          <button
            onClick={() => setViewMode('live')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: viewMode === 'live' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'live' ? 'var(--bg-white)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <Zap size={14} /> Live
          </button>
          <button
            onClick={() => setViewMode('historical')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: viewMode === 'historical' ? '#2563eb' : 'transparent',
              color: viewMode === 'historical' ? 'var(--bg-white)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <Calendar size={14} /> Historical View
          </button>
        </div>
      </div>

      {/* Top Cards (Only display Engine/Perf if in Live mode to prevent layout noise) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Algo Engine Status Card */}
        <Card style={{ padding: '16px', borderLeft: `4px solid ${isTradingActive ? 'var(--accent)' : 'var(--text-muted)'}` }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={15} color={isTradingActive ? "var(--accent)" : "var(--text-muted)"} /> Algo Engine Status
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: isTradingActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                {isTradingActive ? 'Engine Active' : 'Engine Paused'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Active Clients: <strong>{clients?.filter((c: any) => c.tradingStatus === 'active').length || 0} / {clients?.length || 0}</strong>
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ 
                display: 'inline-block', 
                width: '10px', 
                height: '10px', 
                backgroundColor: isTradingActive ? 'var(--accent)' : 'var(--text-muted)', 
                borderRadius: '50%',
                boxShadow: isTradingActive ? '0 0 10px var(--accent)' : 'none'
              }} />
            </div>
          </div>
        </Card>

        {/* Today's Performance Card */}
        <Card style={{ padding: '16px', borderLeft: `4px solid ${Number(dashboardStats?.totalPnl) >= 0 ? 'var(--accent)' : 'var(--danger)'}` }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {Number(dashboardStats?.totalPnl) >= 0 ? <ArrowUpRight size={15} color="var(--accent)" /> : <ArrowDownRight size={15} color="var(--danger)" />}
            Today's Performance
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: Number(dashboardStats?.totalPnl) >= 0 ? 'var(--accent-dark)' : 'var(--danger)' }}>
                {Number(dashboardStats?.totalPnl) >= 0 ? '+' : ''}₹{dashboardStats?.totalPnl?.toFixed(2) || '0.00'}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Total Trades placed: <strong>{dashboardStats?.todayTrades || 0}</strong>
              </span>
            </div>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: Number(dashboardStats?.totalPnl) >= 0 ? 'var(--accent-dark)' : 'var(--danger)', textTransform: 'uppercase' }}>
              {Number(dashboardStats?.totalPnl) >= 0 ? 'PROFIT' : 'LOSS'}
            </span>
          </div>
        </Card>

        {/* Watchlist Breadth Card */}
        <Card style={{ padding: '16px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {viewMode === 'live' ? 'Live Session Breadth' : 'Historical Session Breadth'}
          </span>
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

      {/* Main List Grid */}
      <div className="market-watch-main" style={{ 
        display: 'grid', 
        gridTemplateColumns: selectedStock ? '1.3fr 1fr' : '1fr', 
        gap: '24px', 
        alignItems: 'start' 
      }}>
        <Card style={{ padding: '24px', minWidth: 0 }}>
          {/* Controls Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '16px', 
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-light)' 
          }}>
            {/* Category Custom Searchable Dropdown */}
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => (window as any)._toggleCategoryMw?.()}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  padding: '0 12px', 
                  height: '38px', 
                  minWidth: '220px', 
                  backgroundColor: 'var(--bg-white)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-heading)'
                }}
              >
                <span>Category: {category}</span>
                <span style={{ fontSize: '10px', marginLeft: '8px', color: 'var(--text-secondary)' }}>▼</span>
              </div>

              {/* Toggle Logic & Dropdown Overlay */}
              <CategorySelectorMw 
                current={category} 
                onChange={(val) => setCategory(val)} 
                categories={indexCategories}
              />
            </div>
            <div style={{ display: 'none' }}>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                style={{ display: 'none' }}
              >

                <optgroup label="Indices Eligible in Derivatives">
                  <option value="NIFTY 50">NIFTY 50</option>
                  <option value="NIFTY BANK">NIFTY BANK</option>
                  <option value="NIFTY FINANCIAL SERVICES">NIFTY FINANCIAL SERVICES</option>
                  <option value="NIFTY INDIA FPI 150">NIFTY INDIA FPI 150</option>
                  <option value="NIFTY MIDCAP SELECT">NIFTY MIDCAP SELECT</option>
                  <option value="NIFTY NEXT 50">NIFTY NEXT 50</option>
                </optgroup>
                <optgroup label="Broad Market Indices">
                  <option value="NIFTY 100">NIFTY 100</option>
                  <option value="NIFTY 200">NIFTY 200</option>
                  <option value="NIFTY 500">NIFTY 500</option>
                  <option value="NIFTY LARGEMIDCAP 250">NIFTY LARGEMIDCAP 250</option>
                  <option value="NIFTY MICROCAP 250">NIFTY MICROCAP 250</option>
                  <option value="NIFTY MIDCAP 100">NIFTY MIDCAP 100</option>
                  <option value="NIFTY MIDCAP 150">NIFTY MIDCAP 150</option>
                  <option value="NIFTY MIDCAP 50">NIFTY MIDCAP 50</option>
                  <option value="NIFTY MIDSMALLCAP400 50:50">NIFTY MIDSMALLCAP400 50:50</option>
                  <option value="NIFTY MIDSMALLCAP 400">NIFTY MIDSMALLCAP 400</option>
                  <option value="NIFTY SMALLCAP 500">NIFTY SMALLCAP 500</option>
                  <option value="NIFTY SMALLCAP 100">NIFTY SMALLCAP 100</option>
                  <option value="NIFTY SMALLCAP 250">NIFTY SMALLCAP 250</option>
                  <option value="NIFTY SMALLCAP 50">NIFTY SMALLCAP 50</option>
                  <option value="NIFTY TOTAL MARKET">NIFTY TOTAL MARKET</option>
                  <option value="NIFTY500 LARGEMIDSMALL EQUAL-CAP WEIGHTED">NIFTY500 LARGEMIDSMALL EQUAL-CAP WEIGHTED</option>
                  <option value="NIFTY500 MULTICAP 50:25:25">NIFTY500 MULTICAP 50:25:25</option>
                </optgroup>
                <optgroup label="Sectoral Market Indices">
                  <option value="NIFTY AUTO">NIFTY AUTO</option>
                  <option value="NIFTY CEMENT">NIFTY CEMENT</option>
                  <option value="NIFTY CHEMICALS">NIFTY CHEMICALS</option>
                  <option value="NIFTY CONSUMER DURABLES">NIFTY CONSUMER DURABLES</option>
                  <option value="NIFTY FINANCIAL SERVICES EX-BANK">NIFTY FINANCIAL SERVICES EX-BANK</option>
                  <option value="NIFTY FINANCIAL SERVICES 25/50">NIFTY FINANCIAL SERVICES 25/50</option>
                  <option value="NIFTY FMCG">NIFTY FMCG</option>
                  <option value="NIFTY HEALTHCARE INDEX">NIFTY HEALTHCARE INDEX</option>
                  <option value="NIFTY IT">NIFTY IT</option>
                  <option value="NIFTY MEDIA">NIFTY MEDIA</option>
                  <option value="NIFTY METAL">NIFTY METAL</option>
                  <option value="NIFTY MIDSMALL HEALTHCARE">NIFTY MIDSMALL HEALTHCARE</option>
                  <option value="NIFTY MIDSMALL FINANCIAL SERVICES">NIFTY MIDSMALL FINANCIAL SERVICES</option>
                  <option value="NIFTY MIDSMALL IT &amp; TELECOM">NIFTY MIDSMALL IT &amp; TELECOM</option>
                  <option value="NIFTY OIL & GAS">NIFTY OIL &amp; GAS</option>
                  <option value="NIFTY PHARMA">NIFTY PHARMA</option>
                  <option value="NIFTY PSU BANK">NIFTY PSU BANK</option>
                  <option value="NIFTY PRIVATE BANK">NIFTY PRIVATE BANK</option>
                  <option value="NIFTY REALTY">NIFTY REALTY</option>
                  <option value="NIFTY REITS & REALTY">NIFTY REITS &amp; REALTY</option>
                  <option value="NIFTY500 HEALTHCARE">NIFTY500 HEALTHCARE</option>
                </optgroup>
                <optgroup label="Thematic Market Indices">
                  <option value="NIFTY CAPITAL MARKETS">NIFTY CAPITAL MARKETS</option>
                  <option value="NIFTY COMMODITIES">NIFTY COMMODITIES</option>
                  <option value="NIFTY INDIA CONSUMPTION">NIFTY INDIA CONSUMPTION</option>
                  <option value="NIFTY CORE HOUSING">NIFTY CORE HOUSING</option>
                  <option value="NIFTY INDIA SELECT 5 CORPORATE GROUPS (MAATR)">NIFTY INDIA SELECT 5 CORPORATE GROUPS (MAATR)</option>
                  <option value="NIFTY CPSE">NIFTY CPSE</option>
                  <option value="NIFTY ENERGY">NIFTY ENERGY</option>
                  <option value="NIFTY EV & NEW AGE AUTOMOTIVE">NIFTY EV &amp; NEW AGE AUTOMOTIVE</option>
                  <option value="NIFTY HOUSING">NIFTY HOUSING</option>
                  <option value="NIFTY INDIA DEFENCE">NIFTY INDIA DEFENCE</option>
                  <option value="NIFTY INDIA DIGITAL">NIFTY INDIA DIGITAL</option>
                  <option value="NIFTY INDIA TOURISM">NIFTY INDIA TOURISM</option>
                  <option value="NIFTY INDIA MANUFACTURING">NIFTY INDIA MANUFACTURING</option>
                  <option value="NIFTY INFRASTRUCTURE">NIFTY INFRASTRUCTURE</option>
                  <option value="NIFTY INDIA INFRASTRUCTURE & LOGISTICS">NIFTY INDIA INFRASTRUCTURE &amp; LOGISTICS</option>
                  <option value="NIFTY INDIA INTERNET">NIFTY INDIA INTERNET</option>
                  <option value="NIFTY IPO">NIFTY IPO</option>
                  <option value="NIFTY MIDCAP LIQUID 15">NIFTY MIDCAP LIQUID 15</option>
                  <option value="NIFTY MNC">NIFTY MNC</option>
                  <option value="NIFTY MOBILITY">NIFTY MOBILITY</option>
                  <option value="NIFTY MIDSMALL INDIA CONSUMPTION">NIFTY MIDSMALL INDIA CONSUMPTION</option>
                  <option value="NIFTY500 MULTICAP INFRASTRUCTURE 50:30:20">NIFTY500 MULTICAP INFRASTRUCTURE 50:30:20</option>
                  <option value="NIFTY500 MULTICAP INDIA MANUFACTURING 50:30:20">NIFTY500 MULTICAP INDIA MANUFACTURING 50:30:20</option>
                  <option value="NIFTY INDIA NEW AGE CONSUMPTION">NIFTY INDIA NEW AGE CONSUMPTION</option>
                  <option value="NIFTY NON-CYCLICAL CONSUMER">NIFTY NON-CYCLICAL CONSUMER</option>
                  <option value="NIFTY PSE">NIFTY PSE</option>
                  <option value="NIFTY INDIA RAILWAYS PSU">NIFTY INDIA RAILWAYS PSU</option>
                  <option value="NIFTY RURAL">NIFTY RURAL</option>
                  <option value="NIFTY SERVICES SECTOR">NIFTY SERVICES SECTOR</option>
                  <option value="NIFTY SHARIAH 25">NIFTY SHARIAH 25</option>
                  <option value="NIFTY SME EMERGE">NIFTY SME EMERGE</option>
                  <option value="NIFTY INDIA CORPORATE GROUP INDEX - TATA GROUP 25% CAP">NIFTY INDIA CORPORATE GROUP INDEX - TATA GROUP 25% CAP</option>
                  <option value="NIFTY TRANSPORTATION & LOGISTICS">NIFTY TRANSPORTATION &amp; LOGISTICS</option>
                  <option value="NIFTY WAVES">NIFTY WAVES</option>
                  <option value="NIFTY100 ENHANCED ESG">NIFTY100 ENHANCED ESG</option>
                  <option value="NIFTY100 ESG">NIFTY100 ESG</option>
                  <option value="NIFTY100 LIQUID 15">NIFTY100 LIQUID 15</option>
                  <option value="NIFTY50 SHARIAH">NIFTY50 SHARIAH</option>
                  <option value="NIFTY500 SHARIAH">NIFTY500 SHARIAH</option>
                  <option value="NIFTY CONGLOMERATE 50">NIFTY CONGLOMERATE 50</option>
                </optgroup>
                <optgroup label="Strategy Market Indices">
                  <option value="NIFTY ALPHA 50">NIFTY ALPHA 50</option>
                  <option value="NIFTY ALPHA LOW-VOLATILITY 30">NIFTY ALPHA LOW-VOLATILITY 30</option>
                  <option value="NIFTY ALPHA QUALITY LOW-VOLATILITY 30">NIFTY ALPHA QUALITY LOW-VOLATILITY 30</option>
                  <option value="NIFTY ALPHA QUALITY VALUE LOW-VOLATILITY 30">NIFTY ALPHA QUALITY VALUE LOW-VOLATILITY 30</option>
                  <option value="NIFTY DIVIDEND OPPORTUNITIES 50">NIFTY DIVIDEND OPPORTUNITIES 50</option>
                  <option value="NIFTY GROWTH SECTORS 15">NIFTY GROWTH SECTORS 15</option>
                  <option value="NIFTY HIGH BETA 50">NIFTY HIGH BETA 50</option>
                  <option value="NIFTY LOW VOLATILITY 50">NIFTY LOW VOLATILITY 50</option>
                  <option value="NIFTY MIDCAP150 QUALITY 50">NIFTY MIDCAP150 QUALITY 50</option>
                  <option value="NIFTY500 MULTICAP MOMENTUM QUALITY 50">NIFTY500 MULTICAP MOMENTUM QUALITY 50</option>
                  <option value="NIFTY QUALITY LOW-VOLATILITY 30">NIFTY QUALITY LOW-VOLATILITY 30</option>
                  <option value="NIFTY SMALLCAP250 QUALITY 50">NIFTY SMALLCAP250 QUALITY 50</option>
                  <option value="NIFTY TOTAL MARKET MOMENTUM QUALITY 50">NIFTY TOTAL MARKET MOMENTUM QUALITY 50</option>
                  <option value="NIFTY TOP 10 EQUAL WEIGHT">NIFTY TOP 10 EQUAL WEIGHT</option>
                  <option value="NIFTY TOP 15 EQUAL WEIGHT">NIFTY TOP 15 EQUAL WEIGHT</option>
                  <option value="NIFTY TOP 20 EQUAL WEIGHT">NIFTY TOP 20 EQUAL WEIGHT</option>
                  <option value="NIFTY100 ALPHA 30">NIFTY100 ALPHA 30</option>
                  <option value="NIFTY100 EQUAL WEIGHT">NIFTY100 EQUAL WEIGHT</option>
                  <option value="NIFTY100 LOW VOLATILITY 30">NIFTY100 LOW VOLATILITY 30</option>
                  <option value="NIFTY100 QUALITY 30">NIFTY100 QUALITY 30</option>
                  <option value="NIFTY200 ALPHA 30">NIFTY200 ALPHA 30</option>
                  <option value="NIFTY200 QUALITY 30">NIFTY200 QUALITY 30</option>
                  <option value="NIFTY200 VALUE 30">NIFTY200 VALUE 30</option>
                  <option value="NIFTY200 MOMENTUM 30">NIFTY200 MOMENTUM 30</option>
                  <option value="NIFTY50 EQUAL WEIGHT">NIFTY50 EQUAL WEIGHT</option>
                  <option value="NIFTY50 VALUE 20">NIFTY50 VALUE 20</option>
                  <option value="NIFTY500 EQUAL WEIGHT">NIFTY500 EQUAL WEIGHT</option>
                  <option value="NIFTY500 FLEXICAP QUALITY 30">NIFTY500 FLEXICAP QUALITY 30</option>
                  <option value="NIFTY500 LOW VOLATILITY 50">NIFTY500 LOW VOLATILITY 50</option>
                  <option value="NIFTY500 MULTIFACTOR MQVLV 50">NIFTY500 MULTIFACTOR MQVLV 50</option>
                  <option value="NIFTY500 QUALITY 50">NIFTY500 QUALITY 50</option>
                  <option value="NIFTY500 VALUE 50">NIFTY500 VALUE 50</option>
                  <option value="NIFTY500 MOMENTUM 50">NIFTY500 MOMENTUM 50</option>
                  <option value="NIFTY MIDCAP150 MOMENTUM 50">NIFTY MIDCAP150 MOMENTUM 50</option>
                  <option value="NIFTY MIDSMALLCAP400 MOMENTUM QUALITY 100">NIFTY MIDSMALLCAP400 MOMENTUM QUALITY 100</option>
                  <option value="NIFTY SMALLCAP250 MOMENTUM QUALITY 100">NIFTY SMALLCAP250 MOMENTUM QUALITY 100</option>
                </optgroup>
                <optgroup label="Others">
                  <option value="PERMITTED TO TRADE">PERMITTED TO TRADE</option>
                  <option value="SECURITIES IN F&amp;O">SECURITIES IN F&amp;O</option>
                </optgroup>
              </select>
            </div>

            {/* Symbol Search */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', height: '38px', minWidth: '180px', backgroundColor: 'var(--bg-white)' }}>
              <Search size={16} color="var(--text-secondary)" style={{ marginRight: '8px' }} />
              <input 
                placeholder="Search symbol..." 
                value={symbolQuery}
                onChange={(e) => setSymbolQuery(e.target.value)}
                style={{ 
                  border: 'none', 
                  outline: 'none', 
                  fontSize: '13px', 
                  width: '100%', 
                  backgroundColor: 'transparent',
                  color: 'var(--text-body)'
                }}
              />
            </div>

            {/* Historical Filters (Only visible in Historical mode) */}
            {viewMode === 'historical' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Custom Calendar Date Picker */}
                <div ref={calendarRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {/* Trigger Button */}
                  <button
                    onClick={() => {
                      setCalendarOpen(o => !o);
                      setCalendarViewDate(historicalDate ? new Date(historicalDate + 'T00:00:00') : new Date());
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      border: `1px solid ${dateWarning ? '#f59e0b' : 'var(--border-color)'}`,
                      borderRadius: '8px', padding: '0 12px', height: '38px',
                      backgroundColor: 'var(--bg-white)', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', fontFamily: 'inherit'
                    }}
                  >
                    <Calendar size={15} color={dateWarning ? '#f59e0b' : 'var(--text-secondary)'} />
                    {historicalDate
                      ? new Date(historicalDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Select Date'}
                  </button>

                  {dateWarning && (
                    <span style={{ fontSize: '10.5px', color: '#f59e0b', fontWeight: 600, paddingLeft: '4px', whiteSpace: 'nowrap' }}>
                      ⚠ {dateWarning}
                    </span>
                  )}

                  {/* Calendar Popup */}
                  {calendarOpen && (() => {
                    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                    const todayStr = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, '0')}-${String(nowIST.getDate()).padStart(2, '0')}`;
                    const nowHHMM = `${String(nowIST.getHours()).padStart(2,'0')}:${String(nowIST.getMinutes()).padStart(2,'0')}`;
                    const viewYear = calendarViewDate.getFullYear();
                    const viewMonth = calendarViewDate.getMonth();
                    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
                    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
                    const monthName = calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

                    const cells: (number | null)[] = [
                      ...Array(firstDay).fill(null),
                      ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
                    ];

                    return (
                      <div style={{
                        position: 'absolute', top: '44px', left: 0, zIndex: 100,
                        backgroundColor: 'var(--bg-white)', border: '1px solid var(--border-color)',
                        borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
                        padding: '16px', width: '280px'
                      }}>
                        {/* Month Nav */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <button onClick={() => { const d = new Date(calendarViewDate); d.setMonth(d.getMonth() - 1); setCalendarViewDate(d); }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-heading)', fontSize: '16px', padding: '2px 8px', borderRadius: '6px' }}>‹</button>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-heading)' }}>{monthName}</span>
                          <button onClick={() => { const d = new Date(calendarViewDate); d.setMonth(d.getMonth() + 1); const nStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; if (nStr <= todayStr) setCalendarViewDate(d); }}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-heading)', fontSize: '16px', padding: '2px 8px', borderRadius: '6px' }}>›</button>
                        </div>

                        {/* Day Headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '4px' }}>
                          {['S','M','T','W','T','F','S'].map((d, i) => (
                            <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700,
                              color: i === 0 || i === 6 ? '#ef4444' : 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
                          ))}
                        </div>

                        {/* Date Cells */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
                          {cells.map((day, idx) => {
                            if (day === null) return <div key={idx} />;

                            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                            const isFuture = dateStr > todayStr;
                            const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                            const isHoliday = holidaySet.has(dateStr);
                            const isTodayBeforeTrading = dateStr === todayStr && nowHHMM < '09:20';
                            const isDisabled = isFuture || isWeekend || isHoliday || isTodayBeforeTrading;
                            const isSelected = dateStr === historicalDate;
                            const isToday = dateStr === todayStr;

                            let bg = 'transparent';
                            let color = 'var(--text-heading)';
                            let opacity = 1;
                            let cursor = 'pointer';
                            let title = '';

                            if (isSelected) { bg = '#2563eb'; color = '#fff'; }
                            else if (isWeekend) { color = '#ef4444'; opacity = 0.4; cursor = 'not-allowed'; title = 'Market Closed (Weekend)'; }
                            else if (isHoliday) { color = '#f59e0b'; opacity = 0.45; cursor = 'not-allowed'; title = 'NSE Holiday'; }
                            else if (isFuture) { opacity = 0.25; cursor = 'not-allowed'; title = 'Future date'; }
                            else if (isTodayBeforeTrading) { opacity = 0.4; cursor = 'not-allowed'; title = 'Trading data not available yet (Before 9:20 AM)'; }

                            return (
                              <button
                                key={idx}
                                title={title}
                                disabled={isDisabled}
                                onClick={() => { if (!isDisabled) { setHistoricalDate(dateStr); setCalendarOpen(false); setDateWarning(''); } }}
                                style={{
                                  border: isToday && !isSelected ? '1.5px solid #2563eb' : 'none',
                                  borderRadius: '6px', padding: '5px 0', textAlign: 'center',
                                  fontSize: '12px', fontWeight: isSelected ? 700 : 500,
                                  backgroundColor: bg, color, opacity, cursor,
                                  transition: 'background 0.15s'
                                }}
                              >{day}</button>
                            );
                          })}
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-light)', fontSize: '10px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                          <span style={{ color: '#ef4444' }}>■ Weekend</span>
                          <span style={{ color: '#f59e0b' }}>■ NSE Holiday</span>
                          <span style={{ color: '#2563eb' }}>■ Selected</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Time Selection Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 8px', height: '38px', backgroundColor: 'var(--bg-white)' }}>
                  <Clock size={15} color="var(--text-secondary)" style={{ marginRight: '6px' }} />
                  <select
                    value={historicalTime}
                    onChange={(e) => setHistoricalTime(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-heading)',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      height: '100%'
                    }}
                  >
                    {(() => {
                      const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                      const todayStr = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, '0')}-${String(nowIST.getDate()).padStart(2, '0')}`;
                      const isToday = historicalDate === todayStr;
                      const nowHHMM = `${String(nowIST.getHours()).padStart(2,'0')}:${String(nowIST.getMinutes()).padStart(2,'0')}`;

                      const slots = [
                        { value: '09:20', label: '09:20 AM' },
                        { value: '09:30', label: '09:30 AM' },
                        { value: '09:45', label: '09:45 AM' },
                        { value: '12:00', label: '12:00 PM' },
                      ];

                      return slots.map(slot => {
                        const isDisabled = isToday && slot.value > nowHHMM;
                        return (
                          <option
                            key={slot.value}
                            value={slot.value}
                            disabled={isDisabled}
                            style={{ color: isDisabled ? 'var(--text-muted)' : 'var(--text-heading)' }}
                          >
                            {slot.label}{isDisabled ? ' (future)' : ''}
                          </option>
                        );
                      });
                    })()}
                  </select>
                </div>

                {/* Force Refresh Button */}
                <button
                  onClick={() => fetchHistoricalOhlc(historicalDate, historicalTime, true, true)}
                  disabled={isFetchingFromKite || loadingHistorical}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0 12px',
                    height: '38px',
                    backgroundColor: 'var(--bg-white)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-heading)',
                    opacity: isFetchingFromKite || loadingHistorical ? 0.7 : 1
                  }}
                  title="Refetch all watchlist stocks from Zerodha API"
                >
                  <RefreshCw size={14} className={(isFetchingFromKite || loadingHistorical) ? 'animate-spin' : ''} />
                  <span>Refresh Ticks</span>
                </button>
              </div>
            )}

            {/* Filter Buttons */}
            <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', height: '38px' }}>
              <button 
                onClick={() => setActiveFilter('all')} 
                style={{ padding: '0 16px', height: '38px', border: 'none', borderRight: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, backgroundColor: activeFilter === 'all' ? 'var(--primary-light)' : 'var(--bg-white)', color: activeFilter === 'all' ? 'var(--primary)' : 'var(--text-body)' }}
              >
                All Watch
              </button>
              <button 
                onClick={() => setActiveFilter('gainers')} 
                style={{ padding: '0 16px', height: '38px', border: 'none', borderRight: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, backgroundColor: activeFilter === 'gainers' ? 'var(--accent-light)' : 'var(--bg-white)', color: activeFilter === 'gainers' ? 'var(--accent-dark)' : 'var(--text-body)' }}
              >
                Top Gainers
              </button>
              <button 
                onClick={() => setActiveFilter('losers')} 
                style={{ padding: '0 16px', height: '38px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, backgroundColor: activeFilter === 'losers' ? 'var(--danger-light)' : 'var(--bg-white)', color: activeFilter === 'losers' ? 'var(--danger)' : 'var(--text-body)' }}
              >
                Top Losers
              </button>
              {viewMode === 'historical' && (
                <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--border-color)', paddingLeft: '0' }}>
                  <select
                    value={activeFilter.startsWith('equal_') ? activeFilter : 'equal_any'}
                    onChange={(e) => setActiveFilter(e.target.value as any)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      padding: '0 12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: activeFilter.startsWith('equal_') ? '#d97706' : 'var(--text-body)',
                      backgroundColor: activeFilter.startsWith('equal_') ? '#fef3c7' : 'var(--bg-white)',
                      cursor: 'pointer',
                      height: '38px',
                      borderRadius: '0',
                      fontFamily: 'inherit'
                    }}
                  >
                    <option value="equal_any">Equal (any)</option>
                    <option value="equal_open_high">O == H</option>
                    <option value="equal_open_low">O == L</option>
                    <option value="equal_open_close">O == C</option>
                    <option value="equal_high_low">H == L</option>
                    <option value="equal_high_close">H == C</option>
                    <option value="equal_low_close">L == C</option>
                  </select>
                </div>
              )}
            </div>

            {/* Export & Spinners */}
            <button 
              onClick={downloadCSV}
              style={{
                marginLeft: 'auto',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0 14px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-body)',
                cursor: 'pointer'
              }}
            >
              <Download size={14} /> Export Excel
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-title)', margin: 0 }}>
                {viewMode === 'live' 
                  ? `${category} Stocks (${sortedStocks.length})` 
                  : `OHLC Ticks at ${historicalTime} (${sortedStocks.length})`}
              </h3>
              {loadingIndex && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontSize: '12px', fontWeight: 500 }}>
                  <Loader2 size={14} style={{ animation: 'spin 1.2s linear infinite' }} />
                  <span>Fetching {category} stocks from Kite...</span>
                </div>
              )}
              {indexError && !loadingIndex && (
                <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>⚠ {indexError}</div>
              )}
              {viewMode === 'live' ? (
                isWsConnected ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center' }} title="Live Feed Connected">
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' }} />
                  </div>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center' }} title="Standby Mode">
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '50%' }} />
                  </div>
                )
              ) : loadingHistorical ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb', fontSize: '11px', fontWeight: 500 }}>
                  <Loader2 size={13} style={{ animation: 'spin 1.2s linear infinite' }} />
                  <span>Loading DB data...</span>
                </div>
              ) : isFetchingFromKite ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '11px', fontWeight: 500 }}>
                  <Loader2 size={13} style={{ animation: 'spin 1.2s linear infinite' }} />
                  <span>Fetching Zerodha API (rate limit delay)...</span>
                </div>
              ) : null}
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

          {/* Table Container */}
          <div style={{ position: 'relative' }}>
            {/* Full Loading Overlay while fetching from Zerodha */}
            {isFetchingFromKite && (
              <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 50,
                backgroundColor: 'rgba(10, 14, 26, 0.82)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                gap: '20px',
                minHeight: '200px',
              }}>
                {/* Animated Ring Spinner */}
                <div style={{
                  position: 'relative',
                  width: '64px',
                  height: '64px',
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    border: '5px solid rgba(37, 99, 235, 0.15)',
                    borderTopColor: '#2563eb',
                    borderRadius: '50%',
                    animation: 'spin 0.85s linear infinite',
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#fff',
                  }}>
                    {fetchProgress}%
                  </div>
                </div>

                <div style={{ textAlign: 'center', maxWidth: '320px' }}>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                    Fetching from Zerodha API...
                  </p>
                  <p style={{ margin: '4px 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    {fetchedSymbols <= totalSymbols
                      ? `Symbol ${fetchedSymbols} of ~${totalSymbols}`
                      : `${fetchedSymbols} symbols processed · Almost done...`}
                    &nbsp;·&nbsp; Rate-limit delay applied
                  </p>

                  {/* Progress Bar */}
                  <div style={{
                    width: '280px',
                    height: '6px',
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${fetchProgress}%`,
                      backgroundColor: fetchProgress === 100 ? '#10b981' : '#2563eb',
                      borderRadius: '999px',
                      transition: 'width 0.3s ease, background-color 0.3s ease',
                    }} />
                  </div>
                </div>
              </div>
            )}
          <div className="table-responsive" style={{ overflowX: 'auto', maxHeight: '550px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-light)', backgroundColor: 'var(--surface)' }}>
                  <th onClick={() => handleSort('symbol')} style={{ position: 'sticky', top: 0, left: 0, zIndex: 20, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', borderRight: '1px solid var(--border-light)' }}>SYMBOL{renderSortIndicator('symbol')}</th>
                  {viewMode === 'live' && (
                    <th onClick={() => handleSort('prevClose')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>PREV. CLOSE{renderSortIndicator('prevClose')}</th>
                  )}
                  <th onClick={() => handleSort('open')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>OPEN{renderSortIndicator('open')}</th>
                  <th onClick={() => handleSort('high')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>HIGH{renderSortIndicator('high')}</th>
                  <th onClick={() => handleSort('low')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>LOW{renderSortIndicator('low')}</th>
                  <th onClick={() => handleSort('ltp')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                    {viewMode === 'live' ? 'LTP' : 'CLOSE (LTP)'}{renderSortIndicator('ltp')}
                  </th>
                  <th onClick={() => handleSort('change')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>CHNG{renderSortIndicator('change')}</th>
                  <th onClick={() => handleSort('changePercent')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>%CHNG{renderSortIndicator('changePercent')}</th>
                  {viewMode === 'live' && (
                    <>
                      <th onClick={() => handleSort('iep')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>PRE-OPEN{renderSortIndicator('iep')}</th>
                      <th onClick={() => handleSort('volume')} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>VOLUME{renderSortIndicator('volume')}</th>
                    </>
                  )}
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--surface)', padding: '12px 10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map((stock) => {
                  const chng = stock.ltp - stock.prevClose;
                  const isPositive = chng >= 0;
                  const isSelected = selectedStockSymbol === stock.symbol;
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
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-white)', fontWeight: 700, padding: '12px 10px', fontSize: '13px', color: 'var(--text-heading)', borderRight: '1px solid var(--border-light)' }}>{stock.symbol}</td>
                      {viewMode === 'live' && (
                        <td style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-body)', textAlign: 'right' }}>{stock.prevClose.toFixed(2)}</td>
                      )}
                      <td style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-body)', textAlign: 'right' }}>{stock.open.toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--accent)', textAlign: 'right', fontWeight: 500 }}>{stock.high.toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--danger)', textAlign: 'right', fontWeight: 500 }}>{stock.low.toFixed(2)}</td>
                      <td style={{ padding: '12px 10px', fontSize: '13.5px', textAlign: 'right' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          color: chng === 0 ? 'var(--text-heading)' : isPositive ? 'var(--accent-dark)' : 'var(--danger)'
                        }}>{stock.ltp.toFixed(2)}</span>
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
                      {viewMode === 'live' && (
                        <>
                          <td style={{ padding: '12px 10px', fontSize: '13px', color: 'var(--text-body)', textAlign: 'right' }}>{stock.iep.toFixed(2)}</td>
                          <td style={{ padding: '12px 10px', fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'right' }}>{stock.volume.toLocaleString()}</td>
                        </>
                      )}
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStockSymbol(stock.symbol);
                          }}
                          style={{ 
                            background: 'var(--primary-light)', 
                            border: 'none', 
                            color: 'var(--primary)', 
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

                {/* Empty State / Fallback button for Historical view */}
                {sortedStocks.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      {viewMode === 'historical' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <p style={{ fontWeight: 600, fontSize: '14.5px', margin: 0, color: 'var(--text-heading)' }}>
                            No historical OHLC quotes found in local database for {historicalDate} at {historicalTime} AM.
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, maxWidth: '480px' }}>
                            You can dynamically fetch the 1-minute historical candles from Zerodha Kite for all watchlist symbols right now.
                          </p>
                          <button
                            onClick={() => fetchHistoricalOhlc(historicalDate, historicalTime, true)}
                            disabled={isFetchingFromKite}
                            style={{
                              backgroundColor: '#2563eb',
                              border: 'none',
                              color: 'var(--bg-white)',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontWeight: 600,
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '4px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              opacity: isFetchingFromKite ? 0.7 : 1
                            }}
                          >
                            {isFetchingFromKite ? (
                              <>
                                <Loader2 size={14} className="animate-spin" /> Fetching from Kite...
                              </>
                            ) : (
                              <>
                                <RefreshCw size={14} /> Fetching from Zerodha API
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        "No breakout candidates match the selected filters."
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>{/* end position:relative wrapper */}
        </Card>

        {/* Selected Stock Live Candlestick Chart Panel */}
        {selectedStock ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
            <CandlestickChart
              symbol={selectedStock.symbol}
              name={selectedStock.name}
              open={selectedStock.open}
              high={selectedStock.high}
              low={selectedStock.low}
              prevClose={selectedStock.prevClose}
              ltp={selectedStock.ltp}
              volume={selectedStock.volume}
              onClose={() => setSelectedStockSymbol(null)}
            />
          </div>
        ) : null}
      </div>
      <style>{`
        @media (max-width: 1024px) {
          .market-watch-main { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
