import React from 'react';

interface PerformanceChartProps {
  data: number[];
  labels: string[];
  height?: number;
  strokeColor?: string;
  fillColorStart?: string;
  fillColorEnd?: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  labels,
  height = 240,
  strokeColor = '#3b82f6',
  fillColorStart = 'rgba(59, 130, 246, 0.2)',
  fillColorEnd = 'rgba(59, 130, 246, 0)',
}) => {
  const minVal = Math.min(...data, 0);
  const maxVal = Math.max(...data, 100);
  const valueRange = maxVal - minVal;

  const pointsCount = data.length;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  // Render responsive SVG grid
  return (
    <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColorStart} />
            <stop offset="100%" stopColor={fillColorEnd} />
          </linearGradient>
        </defs>

        {/* Generate grid lines & plot path in a parent wrapper */}
        <ChartRenderer
          data={data}
          labels={labels}
          minVal={minVal}
          maxVal={maxVal}
          valueRange={valueRange}
          pointsCount={pointsCount}
          paddingLeft={paddingLeft}
          paddingRight={paddingRight}
          paddingTop={paddingTop}
          paddingBottom={paddingBottom}
          strokeColor={strokeColor}
        />
      </svg>
    </div>
  );
};

interface RendererProps {
  data: number[];
  labels: string[];
  minVal: number;
  maxVal: number;
  valueRange: number;
  pointsCount: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  strokeColor: string;
}

const ChartRenderer: React.FC<RendererProps> = ({
  data,
  labels,
  minVal,
  maxVal,
  valueRange,
  pointsCount,
  paddingLeft,
  paddingRight,
  paddingTop,
  paddingBottom,
  strokeColor,
}) => {
  // Use a simple reference size for coordinate scaling inside the SVG
  const width = 600;
  const height = 240;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => {
    return paddingLeft + (index / (pointsCount - 1 || 1)) * chartWidth;
  };

  const getY = (value: number) => {
    const scale = valueRange === 0 ? 1 : valueRange;
    return paddingTop + chartHeight - ((value - minVal) / scale) * chartHeight;
  };

  // Generate SVG path string
  let linePath = '';
  let areaPath = '';

  if (pointsCount > 0) {
    linePath = `M ${getX(0)} ${getY(data[0])}`;
    areaPath = `M ${getX(0)} ${getY(minVal)} L ${getX(0)} ${getY(data[0])}`;

    for (let i = 1; i < pointsCount; i++) {
      linePath += ` L ${getX(i)} ${getY(data[i])}`;
      areaPath += ` L ${getX(i)} ${getY(data[i])}`;
    }

    areaPath += ` L ${getX(pointsCount - 1)} ${getY(minVal)} Z`;
  }

  // Grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <g>
      {/* Horizontal Grid lines */}
      {gridLines.map((ratio, i) => {
        const yVal = minVal + ratio * valueRange;
        const yCoord = getY(yVal);
        return (
          <g key={i}>
            <line
              x1={paddingLeft}
              y1={yCoord}
              x2={width - paddingRight}
              y2={yCoord}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <text
              x={paddingLeft - 10}
              y={yCoord + 4}
              fontSize="10"
              fill="#94a3b8"
              textAnchor="end"
            >
              {Math.round(yVal).toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* SVG Areas */}
      {areaPath && (
        <path d={areaPath} fill="url(#chartGradient)" />
      )}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Data Coordinate Points */}
      {data.map((val, idx) => (
        <circle
          key={idx}
          cx={getX(idx)}
          cy={getY(val)}
          r="4"
          fill="#ffffff"
          stroke={strokeColor}
          strokeWidth="2"
        />
      ))}

      {/* X Axis Labels */}
      {labels.map((label, idx) => (
        <text
          key={idx}
          x={getX(idx)}
          y={height - 5}
          fontSize="10"
          fill="#94a3b8"
          textAnchor="middle"
        >
          {label}
        </text>
      ))}
    </g>
  );
};
