import { TEST_PLATES } from '@/components/IshiharaPlate';
import { COLOR_PASS_THRESHOLD } from '@/lib/constants';
import type { ColorDeficiency, ColorResponse, ColorTestResult } from '@/types';
import type { TranslationKey } from '@/lib/translations/en';

/**
 * Score the colour test and work out the likely type of colour blindness.
 *
 * - Red-green screening: the 7 "vanishing" plates; COLOR_PASS_THRESHOLD or more correct passes.
 * - Protan (red) vs deutan (green): the two classification plates (26, 42). Their left
 *   digit is hidden from protan eyes and the right digit from deutan eyes, so a protan
 *   child reads only the right digit (6, 2) and a deutan child only the left (2, 4).
 * - Tritan (blue): the two blue-yellow plates; missing both suggests tritan.
 *
 * This is screening, not diagnosis: the type is a likely type for the eye doctor to confirm.
 */
export function scoreColorTest(responses: ColorResponse[]): ColorTestResult {
  const typeOf = (r: ColorResponse) => TEST_PLATES.find(p => p.id === r.plateId)?.type;
  const of = (type: string) => responses.filter(r => typeOf(r) === type);

  const demoCorrect = of('demo')[0]?.correct ?? false;
  const redGreenPassed = of('vanishing').filter(r => r.correct).length >= COLOR_PASS_THRESHOLD;

  let protanVotes = 0;
  let deutanVotes = 0;
  for (const r of of('classify')) {
    const digits = String(r.correctNumber);
    const left = Number(digits[0]);
    const right = Number(digits.slice(1));
    if (r.selectedNumber === right) protanVotes++;      // left digit was invisible
    else if (r.selectedNumber === left) deutanVotes++;  // right digit was invisible
  }

  const tritanPlates = of('tritan');
  const tritanSuspected = tritanPlates.length > 0 && tritanPlates.every(r => !r.correct);

  let possibleDeficiency: ColorDeficiency;
  if (!demoCorrect) possibleDeficiency = 'inconclusive';
  else if (!redGreenPassed || protanVotes === 2 || deutanVotes === 2) {
    // Red-green colour blind: the classification plates tell red from green.
    possibleDeficiency = protanVotes > deutanVotes ? 'protan' : deutanVotes > protanVotes ? 'deutan' : 'red-green';
  } else if (tritanSuspected) possibleDeficiency = 'tritan';
  else possibleDeficiency = 'none';

  return { responses, passed: possibleDeficiency === 'none', possibleDeficiency };
}

/** Result-screen text for each likely type (none when vision is normal). */
export const DEFICIENCY_TEXT: Record<ColorDeficiency, TranslationKey | null> = {
  none: null,
  protan: 'results.cvdProtan',
  deutan: 'results.cvdDeutan',
  tritan: 'results.cvdTritan',
  'red-green': 'results.cvdRedGreen',
  inconclusive: 'results.cvdUnclear',
};

/** Plain English name, for the CSV export. */
export const DEFICIENCY_NAME: Record<ColorDeficiency, string> = {
  none: 'Normal',
  protan: 'Protan (red)',
  deutan: 'Deutan (green)',
  tritan: 'Tritan (blue)',
  'red-green': 'Red-green (type unclear)',
  inconclusive: 'Inconclusive',
};
