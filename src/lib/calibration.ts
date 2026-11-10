import { ARM_LENGTH_BY_AGE } from './constants';

/**
 * Calculate screen PPI from Aadhaar card calibration
 * @param cardWidthPx - Width of the Aadhaar card outline in pixels
 * @param cardWidthMM - Physical width of the card (85.6mm)
 * @returns Screen PPI (pixels per inch)
 */
export function calculatePPI(cardWidthPx: number, cardWidthMM: number = 85.6): number {
  const ppmm = cardWidthPx / cardWidthMM;  // pixels per mm
  return ppmm * 25.4;  // convert to pixels per inch
}

/**
 * Get arm's length estimate for a given age
 * @param age - Child's age (6-14)
 * @returns Estimated arm's length in cm
 */
export function getArmLength(age: number): number {
  const clampedAge = Math.max(6, Math.min(14, Math.round(age)));
  return ARM_LENGTH_BY_AGE[clampedAge] || 40;
}

/**
 * Calculate the symbol size in pixels for a given LogMAR level
 * 
 * The standard optotype size formula:
 * Size (in minutes of arc) = 5 × 10^(logMAR)
 * 
 * Converting to physical size:
 * Size (mm) = 2 × distance (mm) × tan(size_in_minutes × π / (180 × 60) / 2) × 5
 * 
 * Simplified: each optotype subtends 5 arc minutes at its threshold
 * So at logMAR 0.0, it subtends 5 arcmin. At logMAR 1.0, it subtends 50 arcmin.
 * 
 * Physical size = distance × tan(angular_size)
 * angular_size = 5 × 10^logMAR arcminutes
 * 
 * @param logMAR - LogMAR acuity level
 * @param distanceCM - Viewing distance in centimeters
 * @param ppi - Screen pixels per inch
 * @returns Symbol size in pixels
 */
export function calculateSymbolSizePx(
  logMAR: number,
  distanceCM: number,
  ppi: number
): number {
  // Angular size of optotype in arcminutes (each stroke = 1 arcmin at logMAR 0)
  // Total optotype = 5 strokes, so 5 arcmin at logMAR 0
  const arcMinutes = 5 * Math.pow(10, logMAR);
  
  // Convert to radians
  const radians = (arcMinutes / 60) * (Math.PI / 180);
  
  // Physical size in mm
  const distanceMM = distanceCM * 10;
  const sizeMM = 2 * distanceMM * Math.tan(radians / 2);
  
  // Convert mm to pixels
  const ppmm = ppi / 25.4;  // pixels per mm
  // Not rounded: at small sizes (e.g. 6/6 ≈ 4 CSS px) rounding would break the
  // 0.1 logMAR (~26%) step ratio. SVG renders fractional CSS pixels fine on
  // high-DPI phone screens.
  return sizeMM * ppmm;
}

