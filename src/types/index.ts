// Language codes for all 22 scheduled languages of India
export type LanguageCode = 
  | 'en' | 'hi' | 'bn' | 'te' | 'mr' | 'ta' | 'ur' | 'gu' 
  | 'kn' | 'ml' | 'or' | 'pa' | 'as' | 'mai' | 'sat' | 'ks' 
  | 'ne' | 'sd' | 'doi' | 'kok' | 'mni' | 'bo' | 'sa';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;        // English name
  nativeName: string;  // Name in native script
  script: string;      // Script name
}

export type LEASymbol = 'house' | 'circle' | 'square' | 'apple';

export type Eye = 'right' | 'left';

export interface AcuityLevel {
  logMAR: number;
  snellen: string;     // e.g. "6/60"
}

export interface SymbolResponse {
  level: number;        // Index into acuity levels
  symbol: LEASymbol;    // Which symbol was shown
  selected: LEASymbol;  // What the child selected
  correct: boolean;
  timestamp: number;
}

export interface EyeResult {
  eye: Eye;
  responses: SymbolResponse[];
  bestLogMAR: number;   // Best acuity achieved
  bestSnellen: string;  // e.g. "6/9"
  passed: boolean;      // true if 6/9 or better
}

export interface ColorPlate {
  id: number;
  hiddenNumber: number;        // The number hidden in the plate
  type: 'demo' | 'vanishing' | 'transformation';
  colors: {
    figure: string[];    // Colors for the number dots
    background: string[]; // Colors for background dots
  };
}

export interface ColorResponse {
  plateId: number;
  correctNumber: number;
  selectedNumber: number | null; // null if child said "can't see"
  correct: boolean;
}

/** Likely colour blindness type: protan = red, deutan = green, tritan = blue(-yellow). */
export type ColorDeficiency = 'none' | 'protan' | 'deutan' | 'tritan' | 'red-green' | 'inconclusive';

export interface ColorTestResult {
  responses: ColorResponse[];
  passed: boolean;       // true if correctly identified enough plates
  possibleDeficiency: ColorDeficiency;
}

export interface TestResult {
  id: string;           // UUID
  timestamp: number;
  age: number;
  language: LanguageCode;
  screenPPI: number;
  armLengthCM: number;
  /** Which test was taken. Results saved before the tests were split have no testMode and contain all three parts. */
  testMode?: TestMode;
  rightEye?: EyeResult;       // eyesight test only
  leftEye?: EyeResult;        // eyesight test only
  colorVision?: ColorTestResult; // colour blindness test only
  overallPassed: boolean;
  childName?: string;    // Optional
}

/** The two separate tests offered on the home screen. */
export type TestMode = 'vision' | 'color';

export interface AppState {
  testMode: TestMode | null;
  language: LanguageCode | null;
  age: number | null;
  screenPPI: number | null;
  armLengthCM: number | null;
  calibrated: boolean;
  currentEye: Eye;
  childName?: string;
}
