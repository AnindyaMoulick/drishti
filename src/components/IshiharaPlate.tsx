"use client";

import React, { useRef, useEffect } from 'react';

/**
 * demo: everyone reads it. vanishing: red-green screening plate.
 * classify: two-digit plate that tells protan (red) from deutan (green) colour blindness.
 * tritan: blue-yellow plate (tritan colour blindness).
 */
export type PlateType = 'demo' | 'vanishing' | 'classify' | 'tritan';

interface IshiharaPlateProps {
  hiddenNumber: number;
  plateType: PlateType;
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
 * Pseudo-isochromatic shade pairs in the style of the standard Ishihara plates:
 * orange figure dots on a yellow-green background.
 *
 * Each figure shade is paired with a background shade that looks almost the same
 * to a red-green colour-deficient eye (Machado et al. 2009 protanopia and
 * deuteranopia simulation, severity 1.0: CIELAB ΔE below 9 for every pair).
 * Every dot picks a random pair, so to a colour-deficient eye the figure and the
 * background show the same mix of shades and the number disappears. For normal
 * colour vision every figure shade differs from every background shade by
 * ΔE 53 or more, so the number stands out clearly.
 */
const SHADE_PAIRS: { figure: RGB; background: RGB }[] = [
  { figure: [240, 170, 50], background: [110, 200, 40] },
  { figure: [250, 160, 50], background: [150, 190, 40] },
  { figure: [250, 160, 70], background: [160, 200, 80] },
  { figure: [240, 150, 50], background: [150, 190, 60] },
  { figure: [250, 160, 90], background: [160, 200, 100] },
];

/** Demo plate: orange on blue, like Ishihara plate 1. Everyone can read it, including red-green CVD. */
const DEMO_PAIRS: { figure: RGB; background: RGB }[] = [
  { figure: [240, 130, 60], background: [120, 150, 200] },
  { figure: [230, 115, 55], background: [105, 140, 195] },
  { figure: [245, 145, 75], background: [135, 160, 205] },
];

/**
 * Classification plates (like Ishihara plates 22-25) on neutral grey dots.
 * The LEFT digit uses PROTAN_HIDDEN shades: grey to a protan (red-blind) eye
 * (Machado protanopia ΔE < 5) but coloured to a deutan eye (ΔE 24-26, near the most any colour allows).
 * The RIGHT digit uses DEUTAN_HIDDEN shades: grey to a deutan (green-blind) eye
 * (ΔE < 5) but visible to a protan eye (ΔE 23-27). Normal vision sees both (ΔE 57-64).
 * So on "26" a protan child reads 6 and a deutan child reads 2, as in the real plates.
 */
const CLASSIFY_BACKGROUND: RGB[] = [[120, 120, 120], [135, 135, 135]];
const PROTAN_HIDDEN: RGB[] = [[250, 95, 125], [250, 110, 130]];
const DEUTAN_HIDDEN: RGB[] = [[185, 40, 120], [200, 65, 130]];

/**
 * Blue-yellow plates (not in the Ishihara book, which only tests red-green).
 * Olive digit on grey: hidden from a tritan (blue-blind) eye (Machado tritanopia
 * ΔE < 5), visible to normal (ΔE 33) and to red-green colour blind eyes (ΔE ≥ 29).
 */
const TRITAN_PAIRS: { figure: RGB; background: RGB }[] = [
  { figure: [130, 140, 80], background: [135, 135, 135] },
  { figure: [145, 155, 95], background: [150, 150, 150] },
];

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Small brightness variation, the same for figure and background dots. */
function jitter(c: RGB, rng: () => number): string {
  const k = 0.93 + rng() * 0.12; // 0.93 – 1.05
  const [r, g, b] = c.map(v => Math.max(0, Math.min(255, Math.round(v * k))));
  return `rgb(${r},${g},${b})`;
}

/**
 * Digits drawn the way the printed Ishihara plates draw them: one even-width,
 * round-ended line per digit with open loops (not a heavy font glyph).
 * Each digit is a centre-line path in a 60 x 100 unit box.
 */
type Pen = CanvasRenderingContext2D;
const PI = Math.PI;
const DIGIT_PATHS: Record<string, (c: Pen) => void> = {
  '0': c => { c.ellipse(30, 50, 22, 40, 0, 0, 2 * PI); },
  '1': c => { c.moveTo(17, 20); c.lineTo(33, 6); c.lineTo(33, 94); },
  '2': c => { c.arc(30, 30, 22, 1.1 * PI, 2.15 * PI); c.lineTo(8, 93); c.lineTo(56, 93); },
  '3': c => { c.arc(29, 28, 20, 1.1 * PI, 2.5 * PI); c.moveTo(29, 48); c.arc(29, 71, 23, -0.5 * PI, 0.88 * PI); },
  '4': c => { c.moveTo(42, 94); c.lineTo(42, 6); c.lineTo(5, 64); c.lineTo(57, 64); },
  '5': c => { c.moveTo(52, 7); c.lineTo(16, 7); c.lineTo(13, 44); c.arc(30, 65, 25, 1.25 * PI, 2.8 * PI); },
  '6': c => { c.moveTo(50, 9); c.quadraticCurveTo(10, 16, 8, 66); c.moveTo(52, 70); c.arc(30, 70, 22, 0, 2 * PI); },
  '7': c => { c.moveTo(6, 7); c.lineTo(54, 7); c.lineTo(22, 94); },
  '8': c => { c.moveTo(48, 28); c.arc(30, 28, 18, 0, 2 * PI); c.moveTo(53, 72); c.arc(30, 72, 23, 0, 2 * PI); },
  '9': c => { c.moveTo(52, 30); c.arc(30, 30, 22, 0, 2 * PI); c.moveTo(52, 32); c.quadraticCurveTo(52, 88, 10, 91); },
};

/** Draw the number into an offscreen canvas and return its alpha mask. */
function buildNumberMask(size: number, text: string): Uint8ClampedArray | null {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const digitHeight = size * 0.5;            // digits fill about half the plate height
  const unit = digitHeight / 100;            // canvas px per digit unit
  const digitWidth = 60 * unit;
  const gap = 16 * unit;
  const totalWidth = text.length * digitWidth + (text.length - 1) * gap;
  const left = (size - totalWidth) / 2;
  const top = (size - digitHeight) / 2;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Line about 1/14 of the plate: wide enough for 2-3 dots across, as on the printed plates.
  ctx.lineWidth = size * 0.07;

  [...text].forEach((ch, i) => {
    const draw = DIGIT_PATHS[ch];
    if (!draw) return;
    ctx.save();
    // Red channel marks the first digit, green the second (classification plates colour them differently).
    ctx.strokeStyle = i === 0 ? '#f00' : '#0f0';
    ctx.translate(left + i * (digitWidth + gap), top);
    ctx.scale(unit, unit);
    ctx.lineWidth = (size * 0.07) / unit;
    ctx.beginPath();
    draw(ctx);
    ctx.stroke();
    ctx.restore();
  });
  return ctx.getImageData(0, 0, size, size).data;
}

function generateDots(size: number, hiddenNumber: number, type: PlateType): Dot[] {
  const pairs = type === 'demo' ? DEMO_PAIRS : type === 'tritan' ? TRITAN_PAIRS : SHADE_PAIRS;
  const mask = buildNumberMask(size, hiddenNumber.toString());
  const rng = seededRandom(hiddenNumber * 7919 + size);

  const cx = size / 2;
  const cy = size / 2;
  const plateRadius = size / 2 - 6;
  const minR = size / 170;
  const maxR = size / 50;

  // Spatial grid for fast overlap checks
  const cell = maxR * 2;
  const gridSize = Math.ceil(size / cell);
  const grid: Dot[][] = Array.from({ length: gridSize * gridSize }, () => []);

  const dots: Dot[] = [];
  const attempts = 30000;

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
    let digit = 0;
    if (mask) {
      const px = Math.min(size - 1, Math.max(0, Math.round(x)));
      const py = Math.min(size - 1, Math.max(0, Math.round(y)));
      const o = (py * size + px) * 4;
      isFigure = mask[o + 3] > 128;
      digit = mask[o] >= mask[o + 1] ? 0 : 1;
    }

    const pick = rng();
    let color: RGB;
    if (type === 'classify') {
      const k = Math.floor(pick * CLASSIFY_BACKGROUND.length);
      color = !isFigure ? CLASSIFY_BACKGROUND[k] : digit === 0 ? PROTAN_HIDDEN[k] : DEUTAN_HIDDEN[k];
    } else {
      const pair = pairs[Math.floor(pick * pairs.length)];
      color = isFigure ? pair.figure : pair.background;
    }
    const dot: Dot = { x, y, radius: r, color: jitter(color, rng) };
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
    ctx.fillStyle = '#FBF7EF';
    ctx.fill();

    const dots = generateDots(size, hiddenNumber, plateType);
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

// Plates 1-8 use the numbers and order of the standard 38-plate Ishihara test
// (1 demo plate + 7 red-green screening plates); 26 and 42 are its protan/deutan
// classification plates (22-23). The last two are blue-yellow plates, which the
// Ishihara book doesn't have. All plates are drawn here, not copied: the printed
// Ishihara book is copyrighted.
export const TEST_PLATES: { id: number; hiddenNumber: number; type: PlateType }[] = [
  { id: 1, hiddenNumber: 12, type: 'demo' },      // Everyone should see 12
  { id: 2, hiddenNumber: 8, type: 'vanishing' },  // Red-green colour blind can't see
  { id: 3, hiddenNumber: 29, type: 'vanishing' },
  { id: 4, hiddenNumber: 5, type: 'vanishing' },
  { id: 5, hiddenNumber: 3, type: 'vanishing' },
  { id: 6, hiddenNumber: 15, type: 'vanishing' },
  { id: 7, hiddenNumber: 74, type: 'vanishing' },
  { id: 8, hiddenNumber: 6, type: 'vanishing' },
  { id: 9, hiddenNumber: 26, type: 'classify' },  // protan reads 6, deutan reads 2
  { id: 10, hiddenNumber: 42, type: 'classify' }, // protan reads 2, deutan reads 4
  { id: 11, hiddenNumber: 7, type: 'tritan' },    // blue-yellow colour blind can't see
  { id: 12, hiddenNumber: 45, type: 'tritan' },
];

export default IshiharaPlate;
