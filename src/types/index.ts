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
  passed: boolean;      // true if logMAR <= 0.2 (6/9.5 or better)
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

export interface ColorTestResult {
  responses: ColorResponse[];
  passed: boolean;       // true if correctly identified enough plates
  possibleDeficiency: 'none' | 'red-green' | 'inconclusive';
}

export interface TestResult {
  id: string;           // UUID
  timestamp: number;
  age: number;
  language: LanguageCode;
  screenPPI: number;
  armLengthCM: number;
  rightEye: EyeResult;
  leftEye: EyeResult;
  colorVision: ColorTestResult;
  overallPassed: boolean;
  childName?: string;    // Optional
}

export interface AppState {
  language: LanguageCode | null;
  age: number | null;
  screenPPI: number | null;
  armLengthCM: number | null;
  calibrated: boolean;
  currentEye: Eye;
  childName?: string;
}
