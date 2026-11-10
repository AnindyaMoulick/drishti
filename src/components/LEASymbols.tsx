"use client";

import React from 'react';

export type LEASymbolType = 'house' | 'circle' | 'square' | 'apple';

interface LEASymbolProps {
  symbol: LEASymbolType;
  size: number;
  color?: string;
  className?: string;
}

// House: Simple house shape (pentagon top + rectangle bottom)
// Circle: Perfect circle
// Square: Perfect square
// Apple: Apple with a small leaf

export function LEASymbol({ symbol, size, color = '#000000', className = '' }: LEASymbolProps) {
  const viewBox = '0 0 100 100';

  const renderSymbol = () => {
    switch (symbol) {
      case 'house':
        return (
          <g>
            {/* Roof - triangle */}
            <polygon points="50,10 10,50 90,50" fill={color} />
            {/* Body - rectangle */}
            <rect x="20" y="50" width="60" height="40" fill={color} />
            {/* Door */}
            <rect x="40" y="60" width="20" height="30" fill="white" />
          </g>
        );
      case 'circle':
        return <circle cx="50" cy="50" r="40" fill={color} />;
      case 'square':
        return <rect x="10" y="10" width="80" height="80" fill={color} />;
      case 'apple':
        return (
          <g>
            {/* Apple body */}
            <ellipse cx="42" cy="58" rx="28" ry="32" fill={color} />
            <ellipse cx="58" cy="58" rx="28" ry="32" fill={color} />
            {/* Stem */}
            <rect x="47" y="18" width="6" height="16" rx="2" fill={color} />
            {/* Leaf */}
            <ellipse cx="62" cy="24" rx="12" ry="6" fill={color} transform="rotate(-30, 62, 24)" />
            {/* Indent at top */}
            <circle cx="50" cy="30" r="8" fill="white" />
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
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={symbol}
    >
      {renderSymbol()}
    </svg>
  );
}

export default LEASymbol;
