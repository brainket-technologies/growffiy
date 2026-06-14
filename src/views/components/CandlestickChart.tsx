import React, { useState } from 'react';

interface CandlestickChartProps {
  symbol: string;
  name: string;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  ltp: number;
  volume: number;
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
}) => {
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);

  // Deterministically generate 15 realistic historical candles based on stock attributes
  const generateCandles = (): Candle[] => {
    let seed = 0;
    for (let i = 0; i < symbol.length; i++) {
      seed += symbol.charCodeAt(i);
    }
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const count = 15;
    const candles: Candle[] = [];
    let currentClose = prevClose;

    // Start times in 15 minute intervals ending now
    const now = new Date();

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

      const candleTime = new Date(now.getTime() - (count - 1 - i) * 15 * 60 * 1000);
      const timeStr = candleTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{symbol}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{name}</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Open: <strong style={{ color: 'var(--text-primary)' }}>₹{open.toFixed(2)}</strong></span>
            <span>High: <strong style={{ color: 'var(--text-primary)' }}>₹{high.toFixed(2)}</strong></span>
            <span>Low: <strong style={{ color: 'var(--text-primary)' }}>₹{low.toFixed(2)}</strong></span>
            <span>Prev Close: <strong style={{ color: 'var(--text-primary)' }}>₹{prevClose.toFixed(2)}</strong></span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            ₹{ltp.toFixed(2)}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: isUp ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {isUp ? '+' : ''}{changePercent.toFixed(2)} ({isUp ? '+' : ''}{changePercentVal.toFixed(2)}%)
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Vol: {volume.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Floating Info Overlay (OHLC details on hover) */}
      <div style={{ display: 'flex', gap: '12px', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '11px', minHeight: '28px', alignItems: 'center' }}>
        {hoveredCandle ? (
          <>
            <span style={{ color: 'var(--text-secondary)' }}>Time: <strong style={{ color: 'var(--text-primary)' }}>{hoveredCandle.time}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>O: <strong style={{ color: 'var(--text-primary)' }}>{hoveredCandle.open}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>H: <strong style={{ color: 'var(--text-primary)' }}>{hoveredCandle.high}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>L: <strong style={{ color: 'var(--text-primary)' }}>{hoveredCandle.low}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>C: <strong style={{ color: hoveredCandle.close >= hoveredCandle.open ? 'var(--color-success)' : 'var(--color-danger)' }}>{hoveredCandle.close}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>V: <strong style={{ color: 'var(--text-primary)' }}>{hoveredCandle.volume.toLocaleString()}</strong></span>
          </>
        ) : (
          <span style={{ color: 'var(--text-secondary)' }}>Hover over a candle to inspect OHLC values</span>
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
                  stroke="#e2e8f0"
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  fontSize="10"
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
            const w = (chartWidth / candles.length) * 0.6;
            const candleIsUp = candle.close >= candle.open;

            return (
              <rect
                key={`vol-${idx}`}
                x={x - w / 2}
                y={y}
                width={w}
                height={paddingTop + chartHeight - y}
                fill={candleIsUp ? 'var(--color-success)' : 'var(--color-danger)'}
                opacity="0.15"
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
            const color = candleIsUp ? 'var(--color-success)' : 'var(--color-danger)';
            const w = (chartWidth / candles.length) * 0.7;

            const yTop = Math.min(yOpen, yClose);
            const yBottom = Math.max(yOpen, yClose);
            const bodyHeight = Math.max(yBottom - yTop, 1.5);

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
                  strokeWidth="1.6"
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
                  rx="1"
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
                  fontSize="10"
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
