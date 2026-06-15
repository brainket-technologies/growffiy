import React, { useState, useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';

interface CandlestickChartProps {
  symbol: string;
  name: string;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  ltp: number;
  volume: number;
  onClose?: () => void;
}

interface CandleData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  symbol,
  name,
  open,
  high,
  low,
  prevClose,
  ltp,
  volume,
  onClose,
}) => {
  const [timeframe, setTimeframe] = useState<string>('5m');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Helper to generate mock historical candles dynamically
  const generateCandles = (): { main: CandleData[]; volumeData: { time: number; value: number; color: string }[] } => {
    let seed = 0;
    const compoundKey = symbol + timeframe;
    for (let i = 0; i < compoundKey.length; i++) {
      seed += compoundKey.charCodeAt(i);
    }
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const count = 50; // Generate 50 points for TradingView smooth charting
    const mainData: CandleData[] = [];
    const volData: { time: number; value: number; color: string }[] = [];
    let currentClose = prevClose;

    const now = new Date();
    let durationMinutes = 5;
    if (timeframe === '1m') durationMinutes = 1;
    if (timeframe === '15m') durationMinutes = 15;
    if (timeframe === '30m') durationMinutes = 30;
    if (timeframe === '1h') durationMinutes = 60;
    if (timeframe === '1d') durationMinutes = 1440;

    const startTimestamp = Math.floor(now.getTime() / 1000) - (count * durationMinutes * 60);

    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1;
      let cOpen = currentClose;
      let cClose: number;
      let cHigh: number;
      let cLow: number;

      if (isLast) {
        cOpen = open;
        cClose = ltp;
        cHigh = Math.max(high, cOpen, cClose);
        cLow = Math.min(low, cOpen, cClose);
      } else {
        const progress = i / (count - 1);
        const trend = prevClose + (open - prevClose) * progress;
        const volatility = Math.max((high - low) * 0.15, open * 0.005);

        cClose = trend + (random() - 0.5) * volatility;
        cHigh = Math.max(cOpen, cClose) + random() * volatility * 0.3;
        cLow = Math.min(cOpen, cClose) - random() * volatility * 0.3;

        // Clip bounds
        const absoluteHigh = Math.max(high, prevClose, open, ltp);
        const absoluteLow = Math.min(low, prevClose, open, ltp);

        if (cHigh > absoluteHigh) cHigh = absoluteHigh;
        if (cLow < absoluteLow) cLow = absoluteLow;
        if (cClose > absoluteHigh) cClose = absoluteHigh;
        if (cClose < absoluteLow) cClose = absoluteLow;

        currentClose = cClose;
      }

      const pointTime = startTimestamp + (i * durationMinutes * 60);
      const isUp = cClose >= cOpen;

      mainData.push({
        time: pointTime,
        open: parseFloat(cOpen.toFixed(2)),
        high: parseFloat(cHigh.toFixed(2)),
        low: parseFloat(cLow.toFixed(2)),
        close: parseFloat(cClose.toFixed(2)),
      });

      volData.push({
        time: pointTime,
        value: Math.round((volume / count) * (0.4 + random() * 1.2)),
        color: isUp ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
      });
    }

    return { main: mainData, volumeData: volData };
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create TradingView Chart with safe width check
    const width = chartContainerRef.current.getBoundingClientRect().width || 400;
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#ffffff' },
        textColor: '#64748b',
        fontSize: 10,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: '#f1f5f9' },
        horzLines: { color: '#f1f5f9' },
      },
      timeScale: {
        borderColor: '#cbd5e1',
        timeVisible: timeframe !== '1d',
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#cbd5e1',
      },
      crosshair: {
        mode: 1, // Magnet mode
        vertLine: {
          color: '#94a3b8',
          width: 1,
          style: 3, // Dashed line
        },
        horzLine: {
          color: '#94a3b8',
          width: 1,
          style: 3, // Dashed line
        },
      },
      width: width,
      height: 300,
    });

    // Add Candlestick Series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    // Add Volume Series (as overlay on bottom)
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Overlay style
    });

    // Set prices scale positions
    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.8, // Vol in bottom 20%
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // Load initial data
    const { main, volumeData } = generateCandles();
    candlestickSeries.setData(main);
    volumeSeries.setData(volumeData);

    // Fit content inside view
    chart.timeScale().fitContent();

    // Handle Resize safely
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const w = chartContainerRef.current.getBoundingClientRect().width || 400;
        chart.resize(w, 300);
      }
    };
    window.addEventListener('resize', handleResize);

    // Initial trigger for rendering correctness on first microtask
    const timer = setTimeout(handleResize, 50);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      try {
        chart.remove();
      } catch (e) {
        console.error('Error cleaning up chart:', e);
      }
    };
  }, [timeframe, symbol]);

  // Update dynamic last tick data in real-time
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;
    const { main, volumeData } = generateCandles();
    candlestickSeriesRef.current.setData(main);
    volumeSeriesRef.current.setData(volumeData);
  }, [open, high, low, ltp, volume]);

  const changePercent = ltp - prevClose;
  const changePercentVal = prevClose ? (changePercent / prevClose) * 100 : 0;
  const isUp = ltp >= prevClose;

  return (
    <div style={{ 
      backgroundColor: '#ffffff', 
      borderRadius: '16px', 
      border: '1px solid var(--border)', 
      padding: '20px', 
      fontFamily: 'var(--font-body), system-ui, sans-serif',
      boxShadow: 'var(--shadow-md)',
      position: 'relative'
    }}>
      {onClose && (
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#94a3b8',
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px',
            borderRadius: '50%',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
          }}
          title="Close Chart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px', flexWrap: 'wrap', paddingRight: onClose ? '24px' : '0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '150px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>{symbol}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{name}</span>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                color: '#475569',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '2px 6px',
                cursor: 'pointer',
                outline: 'none',
                marginLeft: '4px'
              }}
            >
              <option value="1m">1 Min</option>
              <option value="5m">5 Min</option>
              <option value="15m">15 Min</option>
              <option value="30m">30 Min</option>
              <option value="1h">1 Hour</option>
              <option value="1d">1 Day</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
              O: <span style={{ color: '#0f172a' }}>{open.toFixed(2)}</span>
            </span>
            <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
              H: <span style={{ color: '#0f172a' }}>{high.toFixed(2)}</span>
            </span>
            <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
              L: <span style={{ color: '#0f172a' }}>{low.toFixed(2)}</span>
            </span>
            <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
              P: <span style={{ color: '#0f172a' }}>{prevClose.toFixed(2)}</span>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.3px', fontFamily: 'var(--font-title)' }}>
              ₹{ltp.toFixed(2)}
            </div>
            <div style={{ 
              display: 'inline-block',
              fontSize: '10.5px', 
              fontWeight: 700, 
              color: isUp ? '#047857' : '#b91c1c',
              backgroundColor: isUp ? '#d1fae5' : '#fee2e2',
              padding: '1px 6px',
              borderRadius: '9999px',
              marginTop: '2px'
            }}>
              {isUp ? '+' : ''}{changePercent.toFixed(2)} ({isUp ? '+' : ''}{changePercentVal.toFixed(2)}%)
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
              Vol: <strong style={{ color: 'var(--text-heading)' }}>{volume.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* TradingView Chart Container */}
      <div ref={chartContainerRef} style={{ width: '100%', height: '300px', overflow: 'hidden' }} />
    </div>
  );
};
