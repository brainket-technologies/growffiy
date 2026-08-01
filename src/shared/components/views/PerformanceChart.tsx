import React from 'react';

interface PerformanceChartProps {
  data: number[];
  labels: string[];
  height?: number;
  strokeColor?: string;
  fillColorStart?: string;
  fillColorEnd?: string;
  type?: 'line' | 'bar';
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  labels,
  height = 280,
  strokeColor = '#0066cc',
  fillColorStart = 'rgba(0, 102, 204, 0.2)',
  fillColorEnd = 'rgba(0, 102, 204, 0)',
  type = 'bar',
}) => {
  if (!data || data.length === 0) return null;

  const rawMin = Math.min(...data);
  const rawMax = Math.max(...data);
  
  // Dynamic min and max bound around 0
  const minVal = Math.min(rawMin < 0 ? rawMin * 1.25 : -10, -10);
  const maxVal = Math.max(rawMax > 0 ? rawMax * 1.25 : 10, 10);
  const valueRange = maxVal - minVal || 1;

  const pointsCount = data.length;
  const paddingLeft = 35;
  const paddingRight = 25;
  const paddingTop = 35;
  const paddingBottom = 45;

  const width = 700;
  const svgHeight = 280;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getY = (value: number) => {
    return paddingTop + chartHeight - ((value - minVal) / valueRange) * chartHeight;
  };

  const yZero = getY(0);

  // Horizontal Grid Lines
  const gridLineCount = 5;
  const gridRatios = Array.from({ length: gridLineCount }, (_, i) => i / (gridLineCount - 1));

  return (
    <div style={{ width: '100%', height: `${height}px`, position: 'relative', overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${svgHeight}`} preserveAspectRatio="none">
        <defs>
          {/* Green gradient for positive profit bars */}
          <linearGradient id="barGradientGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Red gradient for negative loss bars */}
          <linearGradient id="barGradientRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>

          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColorStart} />
            <stop offset="100%" stopColor={fillColorEnd} />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines */}
        {gridRatios.map((ratio, i) => {
          const yVal = minVal + ratio * valueRange;
          const yCoord = getY(yVal);
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={yCoord}
                x2={width - paddingRight}
                y2={yCoord}
                stroke="var(--border-color, #e5e7eb)"
                strokeWidth="1"
                opacity="0.6"
              />
            </g>
          );
        })}

        {/* Zero Baseline Axis Line */}
        <line
          x1={paddingLeft}
          y1={yZero}
          x2={width - paddingRight}
          y2={yZero}
          stroke="var(--text-muted, #94a3b8)"
          strokeWidth="1.5"
          opacity="0.8"
        />

        {type === 'bar' ? (
          <g>
            {(() => {
              const slotWidth = chartWidth / pointsCount;
              const barWidth = Math.min(Math.max(slotWidth * 0.55, 6), 28);

              // Calculate dynamic label step so at most ~7 date labels are rendered across the X-axis
              const maxLabelsToDisplay = 7;
              const labelStep = Math.max(1, Math.ceil(pointsCount / maxLabelsToDisplay));

              return data.map((val, idx) => {
                const xCenter = paddingLeft + idx * slotWidth + slotWidth / 2;
                const xPos = xCenter - barWidth / 2;
                const isNegative = val < 0;
                const isZero = val === 0;
                
                let yPos: number;
                let barH: number;

                if (isZero) {
                  yPos = yZero - 1.5;
                  barH = 3;
                } else if (isNegative) {
                  yPos = yZero;
                  barH = Math.max(getY(val) - yZero, 6);
                } else {
                  const yVal = getY(val);
                  yPos = yVal;
                  barH = Math.max(yZero - yVal, 6);
                }

                const barFill = isZero ? 'var(--border-color, #94a3b8)' : isNegative ? 'url(#barGradientRed)' : 'url(#barGradientGreen)';
                const labelColor = isNegative ? '#ef4444' : '#10b981';
                const labelY = isNegative ? yZero + barH + 12 : yPos - 6;

                // Show date label only at step intervals or on the very last item
                const shouldShowDateLabel = idx % labelStep === 0 || idx === pointsCount - 1;

                return (
                  <g key={idx}>
                    {/* Bar rectangle */}
                    <rect
                      x={xPos}
                      y={yPos}
                      width={barWidth}
                      height={barH}
                      fill={barFill}
                      rx={isZero ? 1 : 3}
                      ry={isZero ? 1 : 3}
                      opacity={isZero ? 0.35 : 1}
                    />

                    {/* Value label — ONLY render for NON-ZERO values */}
                    {!isZero && (
                      <text
                        x={xCenter}
                        y={labelY}
                        fontSize={slotWidth < 25 ? '10' : '11'}
                        fontWeight="700"
                        fill={labelColor}
                        textAnchor="middle"
                      >
                        {val > 0 ? `+${val.toFixed(0)}` : val.toFixed(0)}
                      </text>
                    )}

                    {/* Date label below chart axis — spaced evenly */}
                    {shouldShowDateLabel && (
                      <text
                        x={xCenter}
                        y={svgHeight - 8}
                        fontSize="11"
                        fontWeight="600"
                        fill="var(--text-secondary, #64748b)"
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
            {/* Line Chart mode fallback */}
            {(() => {
              const getX = (index: number) => paddingLeft + (index / (pointsCount - 1 || 1)) * chartWidth;
              let linePath = `M ${getX(0)} ${getY(data[0])}`;
              let areaPath = `M ${getX(0)} ${yZero} L ${getX(0)} ${getY(data[0])}`;

              const maxLabelsToDisplay = 7;
              const labelStep = Math.max(1, Math.ceil(pointsCount / maxLabelsToDisplay));

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
                    const shouldShowDateLabel = idx % labelStep === 0 || idx === pointsCount - 1;
                    return (
                      <g key={idx}>
                        <circle cx={getX(idx)} cy={getY(val)} r="3.5" fill="#ffffff" stroke={strokeColor} strokeWidth="2" />
                        {!isZero && (
                          <text x={getX(idx)} y={getY(val) - 8} fontSize="10" fontWeight="700" fill={val >= 0 ? '#10b981' : '#ef4444'} textAnchor="middle">
                            {val > 0 ? `+${val.toFixed(0)}` : val.toFixed(0)}
                          </text>
                        )}
                        {shouldShowDateLabel && (
                          <text x={getX(idx)} y={svgHeight - 8} fontSize="11" fontWeight="500" fill="var(--text-secondary, #64748b)" textAnchor="middle">
                            {labels[idx] || ''}
                          </text>
                        )}
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
