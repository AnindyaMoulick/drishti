"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { LEASymbol as LEASymbolIcon } from '@/components/LEASymbols';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { calculateSymbolSizePx } from '@/lib/calibration';
import {
  ACUITY_LEVELS,
  LEA_SYMBOLS,
  SYMBOLS_PER_LEVEL,
  PASS_THRESHOLD,
  ACUITY_PASS_LOGMAR,
} from '@/lib/constants';
import { t } from '@/lib/i18n';
import { speak, getSpeechLang } from '@/lib/audio';
import { LEASymbol, Eye, SymbolResponse, EyeResult } from '@/types';

/** The SVG symbols occupy 80% of their viewBox (10 → 90), so scale up the box. */
const SYMBOL_FILL_RATIO = 0.8;

function pickRandomSymbol(lastSymbol: LEASymbol | null): LEASymbol {
  const available = LEA_SYMBOLS.filter(s => s !== lastSymbol);
  return available[Math.floor(Math.random() * available.length)];
}

/** Shuffle the answer buttons once per eye so position can't be memorised. */
function shuffled<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildEyeResult(eye: Eye, responses: SymbolResponse[], bestLevelIndex: number): EyeResult {
  if (bestLevelIndex < 0) {
    // Could not pass even the largest level
    return { eye, responses, bestLogMAR: 1.1, bestSnellen: '<6/60', passed: false };
  }
  const level = ACUITY_LEVELS[bestLevelIndex];
  return {
    eye,
    responses,
    bestLogMAR: level.logMAR,
    bestSnellen: level.snellen,
    passed: level.logMAR <= ACUITY_PASS_LOGMAR,
  };
}

export default function AcuityTestPage() {
  const router = useRouter();
  const { state, hydrated } = useApp();
  const ready = hydrated && !!state.screenPPI && !!state.armLengthCM;

  // Guard: the test needs age + calibration. State is restored from sessionStorage
  // after a refresh, so only redirect once that restore has happened.
  useEffect(() => {
    if (hydrated && !ready) router.replace('/language');
  }, [hydrated, ready, router]);

  // Never draw symbols with a guessed screen size. Rendering the test only on the
  // client also keeps its random symbols out of the server prerender.
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-slate-400">{t('common.loading', state.language || 'en')}</p>
      </div>
    );
  }
  return <AcuityTest ppi={state.screenPPI!} distance={state.armLengthCM!} />;
}

function AcuityTest({ ppi, distance }: { ppi: number; distance: number }) {
  const router = useRouter();
  const { state, setCurrentEye } = useApp();
  const lang = state.language || 'en';
  const speechLang = getSpeechLang(lang);

  const [eye, setEye] = useState<Eye>('right');
  const [levelIndex, setLevelIndex] = useState(0);
  const [levelResults, setLevelResults] = useState<boolean[]>([]); // results at current level
  // Random initial values are fine: this component only renders on the client.
  const [currentSymbol, setCurrentSymbol] = useState<LEASymbol>(() => pickRandomSymbol(null));
  const [options, setOptions] = useState<LEASymbol[]>(() => shuffled(LEA_SYMBOLS));
  const [selectedSymbol, setSelectedSymbol] = useState<LEASymbol | null>(null);
  const [responses, setResponses] = useState<SymbolResponse[]>([]);
  const [rightEyeResult, setRightEyeResult] = useState<EyeResult | null>(null);
  const [showSwitchEye, setShowSwitchEye] = useState(false);
  const finishing = useRef(false);

  // Audio instruction whenever the tested eye changes
  useEffect(() => {
    speak(t(eye === 'right' ? 'acuity.coverLeft' : 'acuity.coverRight', lang), speechLang);
  }, [eye, lang, speechLang]);

  const currentLevel = ACUITY_LEVELS[levelIndex];

  const symbolBoxPx = useMemo(
    () => calculateSymbolSizePx(currentLevel.logMAR, distance, ppi) / SYMBOL_FILL_RATIO,
    [currentLevel, distance, ppi]
  );

  const finishEye = (eyeResponses: SymbolResponse[], bestLevelIndex: number) => {
    const result = buildEyeResult(eye, eyeResponses, bestLevelIndex);
    if (eye === 'right') {
      setRightEyeResult(result);
      setShowSwitchEye(true);
      speak(t('acuity.switchEye', lang) + ' ' + t('acuity.switchInstruction', lang), speechLang);
    } else {
      finishing.current = true;
      sessionStorage.setItem('drishti_rightEye', JSON.stringify(rightEyeResult));
      sessionStorage.setItem('drishti_leftEye', JSON.stringify(result));
      router.push('/test/color');
    }
  };

  // Step 1 of two-step verification: child taps a symbol
  const handleSymbolSelect = (symbol: LEASymbol) => {
    setSelectedSymbol(symbol);
  };

  // Step 2: child confirms the selection
  const handleConfirm = () => {
    if (!selectedSymbol || finishing.current) return;

    const isCorrect = selectedSymbol === currentSymbol;
    const response: SymbolResponse = {
      level: levelIndex,
      symbol: currentSymbol,
      selected: selectedSymbol,
      correct: isCorrect,
      timestamp: Date.now(),
    };
    const newResponses = [...responses, response];
    const newLevelResults = [...levelResults, isCorrect];
    const correct = newLevelResults.filter(Boolean).length;
    const wrong = newLevelResults.length - correct;

    setResponses(newResponses);
    setSelectedSymbol(null);

    // Failed this level → best acuity is the previous level
    if (wrong > SYMBOLS_PER_LEVEL - PASS_THRESHOLD) {
      finishEye(newResponses, levelIndex - 1);
      return;
    }

    // Passed this level (can pass early once threshold is reached)
    if (correct >= PASS_THRESHOLD) {
      if (levelIndex + 1 >= ACUITY_LEVELS.length) {
        finishEye(newResponses, levelIndex); // passed the smallest level (6/6)
        return;
      }
      setLevelIndex(levelIndex + 1);
      setLevelResults([]);
    } else {
      setLevelResults(newLevelResults);
    }

    setCurrentSymbol(pickRandomSymbol(currentSymbol));
  };

  const handleCancel = () => setSelectedSymbol(null);

  const handleSwitchEye = () => {
    setShowSwitchEye(false);
    setEye('left');
    setCurrentEye('left');
    setLevelIndex(0);
    setLevelResults([]);
    setResponses([]);
    setCurrentSymbol(pickRandomSymbol(null));
    setOptions(shuffled(LEA_SYMBOLS));
  };

  if (showSwitchEye) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-emerald-50 to-white">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('acuity.switchEye', lang)}</h2>
          <p className="text-lg text-slate-500">{t('acuity.switchInstruction', lang)}</p>
        </div>

        <div className="mb-8 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
          <span className="text-6xl">🤚👁️</span>
          <p className="mt-4 text-slate-600 font-medium">{t('acuity.coverRight', lang)}</p>
        </div>

        <button
          onClick={handleSwitchEye}
          className="w-full max-w-xs py-4 px-8 bg-indigo-500 text-white rounded-2xl text-lg font-semibold
            shadow-lg shadow-indigo-200 hover:bg-indigo-600 active:scale-95 transition-all"
        >
          {t('acuity.continue', lang)}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
          <span>👁️</span>
          <span>{t(eye === 'right' ? 'acuity.rightEye' : 'acuity.leftEye', lang)}</span>
        </div>
        <p className="text-sm text-slate-400 mt-2">
          {t('acuity.level', lang)} {levelIndex + 1}/{ACUITY_LEVELS.length}
        </p>
        <p className="text-base font-medium text-amber-700 mt-2">
          🤚 {t(eye === 'right' ? 'acuity.coverLeft' : 'acuity.coverRight', lang)}
        </p>
      </div>

      {/* Progress dots for the current level */}
      <div className="flex justify-center gap-2 mb-4">
        {Array.from({ length: SYMBOLS_PER_LEVEL }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < levelResults.length ? 'bg-indigo-400' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Symbol display — plain white field, exact physical size */}
      <div className="flex-1 flex items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm my-2 min-h-[220px]">
        <LEASymbolIcon symbol={currentSymbol} size={symbolBoxPx} color="#000000" />
      </div>

      <p className="text-center text-slate-500 my-4 text-base">{t('acuity.matchSymbol', lang)}</p>

      {/* Answer options */}
      <div className="grid grid-cols-4 gap-3 pb-6">
        {options.map(symbol => (
          <button
            key={symbol}
            onClick={() => handleSymbolSelect(symbol)}
            className="p-3 bg-white rounded-2xl border-2 border-gray-100 flex items-center justify-center
              hover:border-indigo-300 hover:bg-indigo-50 active:scale-95 transition-all shadow-sm min-h-[80px]"
            aria-label={symbol}
          >
            <LEASymbolIcon symbol={symbol} size={48} />
          </button>
        ))}
      </div>

      {selectedSymbol && (
        <ConfirmationDialog
          isOpen
          symbol={selectedSymbol}
          confirmText={t('acuity.confirm', lang)}
          yesText={t('acuity.yes', lang)}
          noText={t('acuity.no', lang)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
