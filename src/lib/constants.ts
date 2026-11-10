import { LanguageInfo, AcuityLevel } from '@/types';

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'Nastaliq' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', script: 'Bengali' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', script: 'Devanagari' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', script: 'Ol Chiki' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'कॉशुर', script: 'Devanagari' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', script: 'Devanagari' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', script: 'Arabic' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', script: 'Devanagari' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', script: 'Devanagari' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', script: 'Bengali' },
  { code: 'bo', name: 'Bodo', nativeName: 'बड़ो', script: 'Devanagari' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', script: 'Devanagari' },
];

// Arm's length estimates by age (in cm) based on ICMR anthropometric data
export const ARM_LENGTH_BY_AGE: Record<number, number> = {
  6: 35,
  7: 37,
  8: 39,
  9: 41,
  10: 43,
  11: 46,
  12: 48,
  13: 51,
  14: 54,
};

// LogMAR acuity levels (WHO standard)
// Symbol sizes are computed for the actual viewing distance in calibration.ts
export const ACUITY_LEVELS: AcuityLevel[] = [
  { logMAR: 1.0, snellen: '6/60' },
  { logMAR: 0.9, snellen: '6/48' },
  { logMAR: 0.8, snellen: '6/38' },
  { logMAR: 0.7, snellen: '6/30' },
  { logMAR: 0.6, snellen: '6/24' },
  { logMAR: 0.5, snellen: '6/19' },
  { logMAR: 0.4, snellen: '6/15' },
  { logMAR: 0.3, snellen: '6/12' },
  { logMAR: 0.2, snellen: '6/9.5' },
  { logMAR: 0.1, snellen: '6/7.5' },
  { logMAR: 0.0, snellen: '6/6' },
];

// Aadhaar card dimensions (ISO 7810 ID-1 standard)
export const AADHAAR_CARD = {
  widthMM: 85.6,
  heightMM: 53.98,
};

// Number of symbols per acuity level
export const SYMBOLS_PER_LEVEL = 3;

// Pass threshold: must get at least this many correct per level
export const PASS_THRESHOLD = 2;

// Visual acuity pass threshold (LogMAR <= this is considered pass)
export const ACUITY_PASS_LOGMAR = 0.2; // 6/9.5

// Color vision test: minimum plates correct to pass
export const COLOR_PASS_THRESHOLD = 5; // out of 7 non-demo plates

// All LEA symbols
export const LEA_SYMBOLS = ['house', 'circle', 'square', 'apple'] as const;

// App colors
export const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  secondary: '#10B981',
  secondaryLight: '#34D399',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textLight: '#64748B',
  textMuted: '#94A3B8',
};
