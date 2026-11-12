"use client";

import React from 'react';

export type LEASymbolType = 'house' | 'circle' | 'square' | 'apple';

interface LEASymbolProps {
  symbol: LEASymbolType;
  size: number;
  color?: string;
  className?: string;
}

/**
 * LEA-style outline symbols, built like a standard optotype (and like the
 * tumbling E used by WHOeyes): the symbol spans 5 units and its line is 1 unit
 * thick. In the 100-unit viewBox the symbol spans 10→90 (80 units), so the line
 * is 16 units. At the 6/6 size the whole symbol subtends 5 arc minutes and the
 * line 1 arc minute, the detail a normal eye resolves.
 *
 * Solid silhouettes (used before) are NOT equivalent: at small sizes a filled
 * circle, square and apple blur into the same blob, so 6/9 and 6/6 became
 * impossible even for normal vision.
 */
const STROKE = 16;

export function LEASymbol({ symbol, size, color = '#000000', className = '' }: LEASymbolProps) {
  const line = {
    fill: 'none',
    stroke: color,
    strokeWidth: STROKE,
    strokeLinejoin: 'miter' as const,
    strokeLinecap: 'round' as const,
  };

  const renderSymbol = () => {
    switch (symbol) {
      case 'circle':
        // outer diameter 80
        return <circle cx="50" cy="50" r="32" {...line} />;
      case 'square':
        // slightly smaller than the circle, as in the LEA chart, so neither stands out by size
        return <rect x="20" y="20" width="60" height="60" {...line} />;
      case 'house':
        // pentagon outline: roof + walls
        return <path d="M50 19 L80 45 L80 82 L20 82 L20 45 Z" {...line} strokeLinejoin="round" />;
      case 'apple':
        // apple outline with the notch at the top and a short stem
        return (
          <g>
            <path
              d="M50 34 C42 24 18 24 18 50 C18 70 34 84 50 81 C66 84 82 70 82 50 C82 24 58 24 50 34 Z"
              {...line}
              strokeLinejoin="round"
            />
            <path d="M50 30 L55 14" {...line} strokeWidth={STROKE * 0.75} />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={symbol}
      shapeRendering="geometricPrecision"
    >
      {renderSymbol()}
    </svg>
  );
}

export default LEASymbol;
