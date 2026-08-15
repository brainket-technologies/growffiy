import React from 'react';

interface PerformanceChartProps {
  data: number[];
  labels: string[];
  height?: number;
  strokeColor?: string;
  fillColorStart?: string;
  fillColorEnd?: string;
  type?: 'line' | 'bar';
  onBarClick?: (index: number, label: string) => void;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  labels,
  height = 280,
  strokeColor = '#0066cc',
  fillColorStart = 'rgba(0, 102, 204, 0.2)',
  fillColorEnd = 'rgba(0, 102, 204, 0)',
  type = 'bar',
  onBarClick,
}) => {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const rawMin = Math.min(...data);
  const rawMax = Math.max(...data);
  
  // Clean round Y-axis bounds (e.g. 500, 1000, 1500)
  const getNiceMax = (val: number) => {
    const v = val * 1.15;
    if (v <= 100) return 200;
    if (v <= 500) return 500;
    if (v <= 1000) return 1000;
    if (v <= 1500) return 1500;
    if (v <= 2500) return 2500;
    if (v <= 5000) return 5000;
    return Math.ceil(v / 1000) * 1000;
  };

  const getNiceMin = (val: number) => {
    if (val >= 0) return 0;
    const v = val * 1.15;
    if (v >= -200) return -200;
    if (v >= -500) return -500;
    if (v >= -1000) return -1000;
    if (v >= -2000) return -2000;
    return Math.floor(v / 500) * 500;
  };

  const maxVal = getNiceMax(rawMax);
  const minVal = getNiceMin(rawMin);
  const valueRange = maxVal - minVal || 1;

  const pointsCount = data.length;
  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 35;
  const paddingBottom = 40;

  const width = 700;
  const svgHeight = height;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getY = (value: number) => {
    return paddingTop + chartHeight - ((value - minVal) / valueRange) * chartHeight;
  };

  const yZero = getY(0);

  // Clean 5-step grid scale values
  const gridRatios = [0, 0.25, 0.5, 0.75, 1];

  const formatYValue = (val: number) => {
    const abs = Math.abs(val);
    const prefix = val > 0 ? '+' : val < 0 ? '-' : '';
    if (abs >= 1000) {
      return `${prefix}₹${(abs / 1000).toFixed(1)}k`;
    }
    return `${prefix}₹${Math.round(abs)}`;
  };

  return (
    <div style={{ width: '100%', height: `${height}px`, position: 'relative', overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${svgHeight}`} preserveAspectRatio="none">
        <defs>
          {/* Vibrant Teal/Cyan gradient for profit bars */}
          <linearGradient id="barGradientGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>

          {/* Soft Rose/Coral gradient for loss bars */}
          <linearGradient id="barGradientRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>

          {/* Drop shadow filter for floating tooltip badge */}
          <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0f172a" floodOpacity="0.15" />
          </filter>

          {/* Glow filter for hovered bar */}
          <filter id="barGlowGreen" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0d9488" floodOpacity="0.45" />
          </filter>
          <filter id="barGlowRed" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#e11d48" floodOpacity="0.45" />
          </filter>

          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColorStart} />
            <stop offset="100%" stopColor={fillColorEnd} />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines & Y-Axis Scale Values */}
        {gridRatios.map((ratio, i) => {
          const yVal = minVal + ratio * valueRange;
          const yCoord = getY(yVal);
          const isTooCloseToZero = Math.abs(yCoord - yZero) < 18 || Math.abs(yVal) < 10;
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={yCoord}
                x2={width - paddingRight}
                y2={yCoord}
                stroke="var(--border-color, #e2e8f0)"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              {!isTooCloseToZero && (
                <text
                  x={paddingLeft - 8}
                  y={yCoord + 3.5}
                  fontSize="10"
                  fontWeight="600"
                  fill="var(--text-muted, #94a3b8)"
                  textAnchor="end"
                >
                  {formatYValue(yVal)}
                </text>
              )}
            </g>
          );
        })}

        {/* Left Vertical Axis Line */}
        <line
          x1={paddingLeft}
          y1={paddingTop - 10}
          x2={paddingLeft}
          y2={svgHeight - paddingBottom + 5}
          stroke="var(--border-color, #cbd5e1)"
          strokeWidth="1"
          opacity="0.6"
        />

        {/* Zero Baseline Axis Line & Explicit ₹0 Label */}
        <line
          x1={paddingLeft}
          y1={yZero}
          x2={width - paddingRight}
          y2={yZero}
          stroke="var(--text-muted, #64748b)"
          strokeWidth="1.5"
          opacity="0.8"
        />
        <text
          x={paddingLeft - 8}
          y={yZero + 3.5}
          fontSize="10"
          fontWeight="700"
          fill="var(--text-muted, #64748b)"
          textAnchor="end"
        >
          ₹0
        </text>

        {/* Hover Guide Line */}
        {hoveredIdx !== null && (() => {
          const slotWidth = chartWidth / pointsCount;
          const xCenter = paddingLeft + hoveredIdx * slotWidth + slotWidth / 2;
          return (
            <line
              x1={xCenter}
              y1={paddingTop - 10}
              x2={xCenter}
              y2={svgHeight - paddingBottom + 5}
              stroke="var(--primary, #0066cc)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.6"
            />
          );
        })()}

        {type === 'bar' ? (
          <g>
            {(() => {
              const slotWidth = chartWidth / pointsCount;
              const barWidth = Math.min(Math.max(slotWidth * 0.52, 10), 34);

              // Smart label step to prevent label overlap when displaying 30+ days
              const labelStep = pointsCount <= 12 ? 1 : Math.ceil(pointsCount / 8);

              return data.map((val, idx) => {
                const xCenter = paddingLeft + idx * slotWidth + slotWidth / 2;
                const xPos = xCenter - barWidth / 2;
                const isNegative = val < 0;
                const isZero = val === 0;
                const isHovered = hoveredIdx === idx;
                
                let yPos: number;
                let barH: number;

                if (isZero) {
                  yPos = yZero - 1;
                  barH = 2;
                } else if (isNegative) {
                  yPos = yZero;
                  barH = Math.max(getY(val) - yZero, 6);
                } else {
                  const yVal = getY(val);
                  yPos = yVal;
                  barH = Math.max(yZero - yVal, 6);
                }

                const barFill = isZero ? 'var(--border-color, #cbd5e1)' : isNegative ? 'url(#barGradientRed)' : 'url(#barGradientGreen)';
                const labelColor = isNegative ? '#e11d48' : '#0d9488';
                
                const valText = val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
                const badgeWidth = Math.max(valText.length * 7.5 + 14, 48);
                const badgeHeight = 22;
                const badgeX = xCenter - badgeWidth / 2;
                const badgeY = isNegative ? yZero + barH + 7 : yPos - 28;
                const textY = isNegative ? yZero + barH + 22 : yPos - 13;

                const shouldShowDateLabel = idx % labelStep === 0 || idx === pointsCount - 1 || isHovered;

                let barOpacity = 1;
                if (isZero) barOpacity = 0.3;
                else if (hoveredIdx !== null && !isHovered) barOpacity = 0.55;

                // Radius R: max 6px
                const R = Math.min(6, Math.max(barH / 2, 2));

                // SVG Path for asymmetric rounding (Flat at 0 baseline):
                // Positive bar: top rounded, bottom flat at yZero
                // Negative bar: top flat at yZero, bottom rounded
                let barPath: string;
                if (isZero) {
                  barPath = `M ${xPos} ${yZero - 1} L ${xPos + barWidth} ${yZero - 1} L ${xPos + barWidth} ${yZero + 1} L ${xPos} ${yZero + 1} Z`;
                } else if (isNegative) {
                  barPath = `
                    M ${xPos} ${yZero}
                    L ${xPos} ${yPos + barH - R}
                    Q ${xPos} ${yPos + barH} ${xPos + R} ${yPos + barH}
                    L ${xPos + barWidth - R} ${yPos + barH}
                    Q ${xPos + barWidth} ${yPos + barH} ${xPos + barWidth} ${yPos + barH - R}
                    L ${xPos + barWidth} ${yZero}
                    Z
                  `;
                } else {
                  barPath = `
                    M ${xPos} ${yZero}
                    L ${xPos} ${yPos + R}
                    Q ${xPos} ${yPos} ${xPos + R} ${yPos}
                    L ${xPos + barWidth - R} ${yPos}
                    Q ${xPos + barWidth} ${yPos} ${xPos + barWidth} ${yPos + R}
                    L ${xPos + barWidth} ${yZero}
                    Z
                  `;
                }

                return (
                  <g
                    key={idx}
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => onBarClick && onBarClick(idx, labels[idx] || '')}
                  >
                    {/* Bar path with flat 0 baseline and rounded cap (Top for green, Bottom for red) */}
                    <path
                      d={barPath}
                      fill={barFill}
                      opacity={barOpacity}
                      filter={isHovered ? (isNegative ? 'url(#barGlowRed)' : 'url(#barGlowGreen)') : undefined}
                    />

                    {/* Reference Floating Tooltip / Callout Pill Badge — rendered for NON-ZERO values */}
                    {!isZero && (
                      <g style={{ transition: 'transform 0.2s ease' }}>
                        {/* White Pill Background */}
                        <rect
                          x={badgeX}
                          y={badgeY}
                          width={badgeWidth}
                          height={badgeHeight}
                          rx="6"
                          fill={isHovered ? (isNegative ? '#fff1f2' : '#f0fdfa') : '#ffffff'}
                          stroke={isHovered ? (isNegative ? '#e11d48' : '#0d9488') : isNegative ? 'rgba(225, 29, 72, 0.25)' : 'rgba(13, 148, 136, 0.25)'}
                          strokeWidth={isHovered ? '1.5' : '1'}
                          filter="url(#badgeShadow)"
                        />
                        {/* Callout Arrow pointer */}
                        <polygon
                          points={
                            isNegative
                              ? `${xCenter - 4},${badgeY} ${xCenter + 4},${badgeY} ${xCenter},${badgeY - 4}`
                              : `${xCenter - 4},${badgeY + badgeHeight} ${xCenter + 4},${badgeY + badgeHeight} ${xCenter},${badgeY + badgeHeight + 4}`
                          }
                          fill={isHovered ? (isNegative ? '#fff1f2' : '#f0fdfa') : '#ffffff'}
                        />
                        {/* Value Text */}
                        <text
                          x={xCenter}
                          y={textY}
                          fontSize={isHovered ? '11' : '10'}
                          fontWeight="700"
                          fill={labelColor}
                          textAnchor="middle"
                        >
                          {valText}
                        </text>
                      </g>
                    )}

                    {/* Date/Day label below X-axis — 1-to-1 centered with exact bar */}
                    {shouldShowDateLabel && (
                      <text
                        x={xCenter}
                        y={svgHeight - 10}
                        fontSize={pointsCount > 15 ? '10' : '11'}
                        fontWeight={isHovered ? '800' : '600'}
                        fill={isHovered ? 'var(--primary, #0066cc)' : 'var(--text-secondary, #64748b)'}
                        textAnchor="middle"
                      >
                        {labels[idx] || ''}
                      </text>
                    )}
                  </g>
                );
              });
            })()}
          </g>
        ) : (
          <g>
            {/* Line Chart Mode */}
            {(() => {
              const getX = (index: number) => paddingLeft + (index / (pointsCount - 1 || 1)) * chartWidth;
              let linePath = `M ${getX(0)} ${getY(data[0])}`;
              let areaPath = `M ${getX(0)} ${yZero} L ${getX(0)} ${getY(data[0])}`;

              for (let i = 1; i < pointsCount; i++) {
                linePath += ` L ${getX(i)} ${getY(data[i])}`;
                areaPath += ` L ${getX(i)} ${getY(data[i])}`;
              }
              areaPath += ` L ${getX(pointsCount - 1)} ${yZero} Z`;

              return (
                <>
                  <path d={areaPath} fill="url(#lineGradient)" />
                  <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {data.map((val, idx) => {
                    const isZero = val === 0;
                    return (
                      <g key={idx}>
                        <circle cx={getX(idx)} cy={getY(val)} r="3.5" fill="#ffffff" stroke={strokeColor} strokeWidth="2" />
                        {!isZero && (
                          <text x={getX(idx)} y={getY(val) - 8} fontSize="10" fontWeight="700" fill={val >= 0 ? '#10b981' : '#ef4444'} textAnchor="middle">
                            {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                          </text>
                        )}
                        <text x={getX(idx)} y={svgHeight - 10} fontSize="11" fontWeight="500" fill="var(--text-secondary, #64748b)" textAnchor="middle">
                          {labels[idx] || ''}
                        </text>
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </g>
        )}
      </svg>
    </div>
  );
};
