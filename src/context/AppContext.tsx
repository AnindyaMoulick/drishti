"use client";

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { AppState, LanguageCode, Eye, EyeResult, ColorTestResult, TestResult, TestMode } from '@/types';
import { saveTestResult, generateId } from '@/lib/storage';
import { getArmLength } from '@/lib/calibration';
import { RTL_LANGUAGES } from '@/lib/i18n';
import { getSpeechLang } from '@/lib/audio';

interface AppContextType {
  state: AppState;
  /** False until state has been restored from sessionStorage (first client render). */
  hydrated: boolean;
  setTestMode: (mode: TestMode) => void;
  setLanguage: (lang: LanguageCode) => void;
  setAge: (age: number) => void;
  setCalibration: (ppi: number) => void;
  setChildName: (name: string) => void;
  setCurrentEye: (eye: Eye) => void;
  /** Saves whichever parts the chosen test produced. */
  saveResults: (parts: { rightEye?: EyeResult; leftEye?: EyeResult; colorVision?: ColorTestResult }) => TestResult;
  resetState: () => void;
}

const initialState: AppState = {
  testMode: null,
  language: null,
  age: null,
  screenPPI: null,
  armLengthCM: null,
  calibrated: false,
  currentEye: 'right',
};

type Action =
  | { type: 'SET_TEST_MODE'; payload: TestMode }
  | { type: 'SET_LANGUAGE'; payload: LanguageCode }
  | { type: 'SET_AGE'; payload: number }
  | { type: 'SET_CALIBRATION'; payload: number }
  | { type: 'SET_CHILD_NAME'; payload: string }
  | { type: 'SET_CURRENT_EYE'; payload: Eye }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; payload: AppState | null };

// Survives a page refresh within the same tab, cleared when the tab closes.
const SESSION_KEY = 'drishti_state';

type ReducerState = AppState & { hydrated: boolean };

function reducer(state: ReducerState, action: Action): ReducerState {
  switch (action.type) {
    case 'SET_TEST_MODE':
      return { ...state, testMode: action.payload };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_AGE':
      return { 
        ...state, 
        age: action.payload,
        armLengthCM: getArmLength(action.payload),
      };
    case 'SET_CALIBRATION':
      return { ...state, screenPPI: action.payload, calibrated: true };
    case 'SET_CHILD_NAME':
      return { ...state, childName: action.payload };
    case 'SET_CURRENT_EYE':
      return { ...state, currentEye: action.payload };
    case 'RESET':
      return { ...initialState, hydrated: true };
    case 'HYDRATE':
      return { ...initialState, ...action.payload, hydrated: true };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [store, dispatch] = useReducer(reducer, { ...initialState, hydrated: false });
  const { hydrated, ...state } = store;

  // Restore after mount (not during render) so server and client HTML match.
  useEffect(() => {
    let saved: AppState | null = null;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch { /* storage blocked or corrupt: start fresh */ }
    dispatch({ type: 'HYDRATE', payload: saved });
  }, []);

  // Match <html lang/dir> to the chosen language (screen readers, fonts, Urdu/Sindhi/Kashmiri RTL).
  useEffect(() => {
    const code = store.language || 'en';
    document.documentElement.lang = getSpeechLang(code);
    document.documentElement.dir = RTL_LANGUAGES.has(code) ? 'rtl' : 'ltr';
  }, [store.language]);

  useEffect(() => {
    if (!store.hydrated) return;
    const toSave: Partial<ReducerState> = { ...store };
    delete toSave.hydrated;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(toSave));
    } catch { /* storage full or blocked: state still works in memory */ }
  }, [store]);

  const setTestMode = (mode: TestMode) => dispatch({ type: 'SET_TEST_MODE', payload: mode });
  const setLanguage = (lang: LanguageCode) => dispatch({ type: 'SET_LANGUAGE', payload: lang });
  const setAge = (age: number) => dispatch({ type: 'SET_AGE', payload: age });
  const setCalibration = (ppi: number) => dispatch({ type: 'SET_CALIBRATION', payload: ppi });
  const setChildName = (name: string) => dispatch({ type: 'SET_CHILD_NAME', payload: name });
  const setCurrentEye = (eye: Eye) => dispatch({ type: 'SET_CURRENT_EYE', payload: eye });
  const resetState = () => dispatch({ type: 'RESET' });

  const saveResults = ({ rightEye, leftEye, colorVision }: {
    rightEye?: EyeResult; leftEye?: EyeResult; colorVision?: ColorTestResult;
  }): TestResult => {
    const parts = [rightEye, leftEye, colorVision].filter(p => p !== undefined);
    const result: TestResult = {
      id: generateId(),
      timestamp: Date.now(),
      age: state.age || 0,
      language: state.language || 'en',
      screenPPI: state.screenPPI || 0,
      armLengthCM: state.armLengthCM || 40,
      testMode: colorVision ? 'color' : 'vision',
      rightEye,
      leftEye,
      colorVision,
      overallPassed: parts.length > 0 && parts.every(p => p.passed),
      childName: state.childName,
    };
    saveTestResult(result);
    return result;
  };

  return (
    <AppContext.Provider value={{
      state,
      hydrated,
      setTestMode,
      setLanguage,
      setAge,
      setCalibration,
      setChildName,
      setCurrentEye,
      saveResults,
      resetState,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
