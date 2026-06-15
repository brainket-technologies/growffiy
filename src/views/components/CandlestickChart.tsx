import React, { useState, useEffect } from 'react';

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

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: string;
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
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);

  // Deterministically generate 15 realistic historical candles based on stock attributes and timeframe
  const generateCandles = (): Candle[] => {
    let seed = 0;
    const compoundKey = symbol + timeframe;
    for (let i = 0; i < compoundKey.length; i++) {
      seed += compoundKey.charCodeAt(i);
    }
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const count = 15;
    const candles: Candle[] = [];
    let currentClose = prevClose;

    // Start times ending now based on selected timeframe
    const now = new Date();
    let durationMinutes = 5;
    if (timeframe === '1m') durationMinutes = 1;
    if (timeframe === '15m') durationMinutes = 15;
    if (timeframe === '30m') durationMinutes = 30;
    if (timeframe === '1h') durationMinutes = 60;
    if (timeframe === '1d') durationMinutes = 1440;

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

        // Clip bounds to daily ranges
        const absoluteHigh = Math.max(high, prevClose, open, ltp);
        const absoluteLow = Math.min(low, prevClose, open, ltp);

        if (cHigh > absoluteHigh) cHigh = absoluteHigh;
        if (cLow < absoluteLow) cLow = absoluteLow;
        if (cClose > absoluteHigh) cClose = absoluteHigh;
        if (cClose < absoluteLow) cClose = absoluteLow;

        currentClose = cClose;
      }

      const candleTime = new Date(now.getTime() - (count - 1 - i) * durationMinutes * 60 * 1000);
      const timeStr = timeframe === '1d' 
        ? candleTime.toLocaleDateString([], { month: 'short', day: 'numeric' })
        : candleTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      candles.push({
        open: parseFloat(cOpen.toFixed(2)),
        high: parseFloat(cHigh.toFixed(2)),
        low: parseFloat(cLow.toFixed(2)),
        close: parseFloat(cClose.toFixed(2)),
        volume: Math.round(volume / count * (0.6 + random() * 0.8)),
        time: timeStr,
      });
    }

    return candles;
  };

  const candles = generateCandles();
  const allPrices = candles.flatMap((c) => [c.high, c.low, c.open, c.close]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;
  const pricePadding = priceRange * 0.08;

  const chartMin = minPrice - pricePadding;
  const chartMax = maxPrice + pricePadding;
  const chartRange = chartMax - chartMin;

  const maxVolume = Math.max(...candles.map((c) => c.volume)) || 1;

  // Render sizes
  const width = 600;
  const height = 300;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (idx: number) => {
    return paddingLeft + (idx / (candles.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - chartMin) / chartRange) * chartHeight;
  };

  const getVolumeY = (vol: number) => {
    // Volume bars in lower 20% of chart
    const volHeight = (vol / maxVolume) * (chartHeight * 0.22);
    return paddingTop + chartHeight - volHeight;
  };

  const priceGridLines = [0, 0.25, 0.5, 0.75, 1];
  const changePercent = ltp - prevClose;
  const changePercentVal = prevClose ? (changePercent / prevClose) * 100 : 0;
  const isUp = ltp >= prevClose;

  // Define success/danger colors mapping correctly to theme tokens
  const upColor = '#10b981';
  const downColor = '#ef4444';

  return (
    <div style={{ 
      backgroundColor: '#ffffff', 
      borderRadius: '16px', 
      border: '1px solid var(--border)', 
      padding: '24px', 
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

      {/* Floating Info Overlay (OHLC details on hover) */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: '8px 12px', 
        backgroundColor: '#f8fafc', 
        border: '1px solid #f1f5f9',
        padding: '8px 12px', 
        borderRadius: '8px', 
        marginBottom: '16px', 
        fontSize: '11px', 
        minHeight: '34px', 
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {hoveredCandle ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', width: '100%', justifyContent: 'space-between' }}>
            <span>Time: <strong style={{ color: '#0f172a' }}>{hoveredCandle.time}</strong></span>
            <span>O: <strong style={{ color: '#0f172a' }}>{hoveredCandle.open}</strong></span>
            <span>H: <strong style={{ color: '#0f172a' }}>{hoveredCandle.high}</strong></span>
            <span>L: <strong style={{ color: '#0f172a' }}>{hoveredCandle.low}</strong></span>
            <span>C: <strong style={{ color: hoveredCandle.close >= hoveredCandle.open ? upColor : downColor }}>{hoveredCandle.close}</strong></span>
            <span>V: <strong style={{ color: '#0f172a' }}>{hoveredCandle.volume.toLocaleString()}</strong></span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Hover over a candle to inspect OHLC values</span>
        )}
      </div>

      {/* Chart SVG */}
      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          {/* Horizontal Price Grid Lines */}
          {priceGridLines.map((ratio, i) => {
            const priceVal = chartMin + ratio * chartRange;
            const y = getY(priceVal);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  fontSize="9.5"
                  fontWeight="600"
                  fill="#94a3b8"
                  textAnchor="end"
                >
                  {priceVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Render Volume Bars */}
          {candles.map((candle, idx) => {
            const x = getX(idx);
            const y = getVolumeY(candle.volume);
            const w = (chartWidth / candles.length) * 0.5;
            const candleIsUp = candle.close >= candle.open;

            return (
              <rect
                key={`vol-${idx}`}
                x={x - w / 2}
                y={y}
                width={w}
                height={paddingTop + chartHeight - y}
                fill={candleIsUp ? upColor : downColor}
                opacity="0.1"
              />
            );
          })}

          {/* Render Candlesticks */}
          {candles.map((candle, idx) => {
            const x = getX(idx);
            const yHigh = getY(candle.high);
            const yLow = getY(candle.low);
            const yOpen = getY(candle.open);
            const yClose = getY(candle.close);

            const candleIsUp = candle.close >= candle.open;
            const color = candleIsUp ? upColor : downColor;
            const w = (chartWidth / candles.length) * 0.65;

            const yTop = Math.min(yOpen, yClose);
            const yBottom = Math.max(yOpen, yClose);
            const bodyHeight = Math.max(yBottom - yTop, 2.5);

            return (
              <g 
                key={`candle-${idx}`}
                onMouseEnter={() => setHoveredCandle(candle)}
                onMouseLeave={() => setHoveredCandle(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={color}
                  strokeWidth="1.8"
                />
                {/* Candle Body */}
                <rect
                  x={x - w / 2}
                  y={yTop}
                  width={w}
                  height={bodyHeight}
                  fill={color}
                  stroke={color}
                  strokeWidth="0.5"
                  rx="1.5"
                />
                {/* Invisible hover trigger zone */}
                <rect
                  x={x - chartWidth / (candles.length * 2)}
                  y={paddingTop}
                  width={chartWidth / candles.length}
                  height={chartHeight}
                  fill="transparent"
                />
              </g>
            );
          })}

          {/* Time axis labels */}
          {candles.map((candle, idx) => {
            // Show every 3rd label
            if (idx % 3 !== 0 && idx !== candles.length - 1) return null;
            const x = getX(idx);
            return (
              <g key={`time-${idx}`}>
                <line
                  x1={x}
                  y1={paddingTop + chartHeight}
                  x2={x}
                  y2={paddingTop + chartHeight + 4}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={paddingTop + chartHeight + 16}
                  fontSize="9.5"
                  fontWeight="600"
                  fill="#94a3b8"
                  textAnchor="middle"
                >
                  {candle.time}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
