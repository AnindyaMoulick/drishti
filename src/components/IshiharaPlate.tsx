"use client";

import React, { useRef, useEffect } from 'react';

interface IshiharaPlateProps {
  hiddenNumber: number;
  plateType: 'demo' | 'vanishing' | 'transformation';
  size?: number;
  className?: string;
}

interface Dot {
  x: number;
  y: number;
  radius: number;
  color: string;
}

type RGB = [number, number, number];

/**
 * Pseudo-isochromatic colour pairs.
 *
 * Each pair was chosen by simulating protanopia and deuteranopia
 * (Machado et al. 2009, severity 1.0) and searching for colours that are
 * clearly different for normal trichromats (CIELAB ΔE ≈ 35) but nearly
 * identical for red-green colour-deficient observers (ΔE ≈ 6).
 * See scratch/cvd_palette.js used to derive these values.
 */
const CONFUSION_PAIRS: { figure: RGB; background: RGB }[] = [
  { figure: [0xDE, 0x6E, 0x46], background: [0xAA, 0x87, 0x46] },
  { figure: [0xD6, 0x78, 0x5A], background: [0x9B, 0x8C, 0x55] },
  { figure: [0xE8, 0x8C, 0x50], background: [0xAA, 0xA0, 0x4B] },
  { figure: [0xC8, 0x64, 0x3C], background: [0x96, 0x7D, 0x3C] },
];

/** Demo plate: orange on blue — visible to everyone, including red-green CVD. */
const DEMO_PAIR: { figure: RGB; background: RGB } = {
  figure: [232, 135, 58],
  background: [110, 150, 210],
};

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Apply a luminance jitter so that brightness alone cannot reveal the figure. */
function jitter(c: RGB, rng: () => number): string {
  const k = 0.85 + rng() * 0.27; // 0.85 – 1.12
  const [r, g, b] = c.map(v => Math.max(0, Math.min(255, Math.round(v * k))));
  return `rgb(${r},${g},${b})`;
}

/** Render the number into an offscreen canvas and return its alpha mask. */
function buildNumberMask(size: number, text: string): Uint8ClampedArray | null {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const fontSize = text.length === 1 ? size * 0.58 : size * 0.46;
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.fillText(text, size / 2, size / 2 + fontSize * 0.04);
  return ctx.getImageData(0, 0, size, size).data;
}

function generateDots(size: number, hiddenNumber: number, demo: boolean): Dot[] {
  const pair = demo ? DEMO_PAIR : CONFUSION_PAIRS[hiddenNumber % CONFUSION_PAIRS.length];
  const mask = buildNumberMask(size, hiddenNumber.toString());
  const rng = seededRandom(hiddenNumber * 7919 + size);

  const cx = size / 2;
  const cy = size / 2;
  const plateRadius = size / 2 - 6;
  const minR = size / 110;
  const maxR = size / 38;

  // Spatial grid for fast overlap checks
  const cell = maxR * 2;
  const gridSize = Math.ceil(size / cell);
  const grid: Dot[][] = Array.from({ length: gridSize * gridSize }, () => []);

  const dots: Dot[] = [];
  const attempts = 9000;

  for (let i = 0; i < attempts; i++) {
    // Try larger dots first, then fill gaps with smaller ones
    const progress = i / attempts;
    const r = maxR - (maxR - minR) * Math.min(1, progress * 1.4) * (0.6 + rng() * 0.4);
    const angle = rng() * Math.PI * 2;
    const dist = Math.sqrt(rng()) * plateRadius;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;

    if (Math.hypot(x - cx, y - cy) + r > plateRadius) continue;

    const gx = Math.floor(x / cell);
    const gy = Math.floor(y / cell);
    let overlaps = false;
    for (let dx = -1; dx <= 1 && !overlaps; dx++) {
      for (let dy = -1; dy <= 1 && !overlaps; dy++) {
        const nx = gx + dx;
        const ny = gy + dy;
        if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) continue;
        for (const d of grid[ny * gridSize + nx]) {
          if (Math.hypot(d.x - x, d.y - y) < d.radius + r + 1) {
            overlaps = true;
            break;
          }
        }
      }
    }
    if (overlaps) continue;

    let isFigure = false;
    if (mask) {
      const px = Math.min(size - 1, Math.max(0, Math.round(x)));
      const py = Math.min(size - 1, Math.max(0, Math.round(y)));
      isFigure = mask[(py * size + px) * 4 + 3] > 128;
    }

    const dot: Dot = {
      x,
      y,
      radius: r,
      color: jitter(isFigure ? pair.figure : pair.background, rng),
    };
    dots.push(dot);
    grid[gy * gridSize + gx].push(dot);
  }

  return dots;
}

export function IshiharaPlate({ hiddenNumber, plateType, size = 300, className = '' }: IshiharaPlateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dots are generated on the client only (needs an offscreen canvas).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    // Plate background
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#F5F0E8';
    ctx.fill();

    const dots = generateDots(size, hiddenNumber, plateType === 'demo');
    for (const dot of dots) {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
      ctx.fillStyle = dot.color;
      ctx.fill();
    }
  }, [hiddenNumber, plateType, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`rounded-full ${className}`}
      aria-label="Color vision test plate"
    />
  );
}

// Predefined plates for the test (1 demo + 7 scored red-green plates)
export const TEST_PLATES = [
  { id: 1, hiddenNumber: 12, type: 'demo' as const },      // Everyone should see 12
  { id: 2, hiddenNumber: 8, type: 'vanishing' as const },  // Red-green CVD can't see
  { id: 3, hiddenNumber: 5, type: 'vanishing' as const },
  { id: 4, hiddenNumber: 29, type: 'vanishing' as const },
  { id: 5, hiddenNumber: 74, type: 'vanishing' as const },
  { id: 6, hiddenNumber: 6, type: 'vanishing' as const },
  { id: 7, hiddenNumber: 45, type: 'vanishing' as const },
  { id: 8, hiddenNumber: 3, type: 'vanishing' as const },
];

export default IshiharaPlate;
