import type { LanguageCode } from '@/types';
import type { Translations } from './translations/types';
import en from './translations/en';
import hi from './translations/hi';
import bn from './translations/bn';
import te from './translations/te';
import mr from './translations/mr';
import ta from './translations/ta';
import ur from './translations/ur';
import gu from './translations/gu';
import kn from './translations/kn';
import ml from './translations/ml';
import or from './translations/or';
import pa from './translations/pa';
import as from './translations/as';
import mai from './translations/mai';
import sat from './translations/sat';
import ks from './translations/ks';
import ne from './translations/ne';
import sd from './translations/sd';
import doi from './translations/doi';
import kok from './translations/kok';
import mni from './translations/mni';
import bo from './translations/bo';
import sa from './translations/sa';

const translations: Record<LanguageCode, Translations> = {
  en, hi, bn, te, mr, ta, ur, gu, kn, ml, or, pa, as, mai, sat, ks, ne, sd, doi, kok, mni, bo, sa,
};

/** Languages written right-to-left (Perso-Arabic script). */
export const RTL_LANGUAGES: ReadonlySet<string> = new Set(['ur', 'sd', 'ks']);

/**
 * Translations drafted by AI that a native speaker has not checked yet.
 * Remove a code from this list once its file has been reviewed.
 */
export const NEEDS_REVIEW: ReadonlySet<string> = new Set([
  'hi', 'bn', 'te', 'mr', 'ta', 'ur', 'gu', 'kn', 'ml', 'or', 'pa', 'as',
  'mai', 'sat', 'ks', 'ne', 'sd', 'doi', 'kok', 'mni', 'bo', 'sa',
]);

// Missing keys fall back to English, then to the key itself.
// `vars` fills {placeholders}, e.g. t('history.age', lang, { age: 10 }).
export function t(key: string, lang: string = 'en', vars?: Record<string, string | number>): string {
  const dict = translations[lang as LanguageCode] as Record<string, string> | undefined;
  let text = dict?.[key] ?? (en as Record<string, string>)[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
