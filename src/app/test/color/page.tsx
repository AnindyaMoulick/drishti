"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { IshiharaPlate, TEST_PLATES } from '@/components/IshiharaPlate';
import { t } from '@/lib/i18n';
import { speak, getSpeechLang } from '@/lib/audio';
import { ColorResponse, ColorTestResult, EyeResult } from '@/types';
import { COLOR_PASS_THRESHOLD } from '@/lib/constants';

const FALLBACK_EYE = (eye: 'right' | 'left'): EyeResult => ({
  eye,
  responses: [],
  bestLogMAR: 1.1,
  bestSnellen: '<6/60',
  passed: false,
});

export default function ColorTestPage() {
  const router = useRouter();
  const { state, hydrated, saveResults } = useApp();
  const lang = state.language || 'en';
  const speechLang = getSpeechLang(lang);

  const [plateIndex, setPlateIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [responses, setResponses] = useState<ColorResponse[]>([]);
  const [saving, setSaving] = useState(false);

  const plate = TEST_PLATES[plateIndex];
  const totalPlates = TEST_PLATES.length;

  // Guard: no eye-test data means the flow was interrupted (e.g. page refresh)
  useEffect(() => {
    if (!sessionStorage.getItem('drishti_leftEye')) {
      router.replace('/');
    }
  }, [router]);

  useEffect(() => {
    if (hydrated && plateIndex === 0) speak(t('color.instruction', lang), speechLang);
  }, [hydrated, plateIndex, lang, speechLang]);

  const finishTest = (allResponses: ColorResponse[]) => {
    setSaving(true);
    const scored = allResponses.filter((_, i) => TEST_PLATES[i].type !== 'demo');
    const correctCount = scored.filter(r => r.correct).length;
    const demoCorrect = allResponses[0]?.correct ?? false;
    const passed = correctCount >= COLOR_PASS_THRESHOLD;

    const colorResult: ColorTestResult = {
      responses: allResponses,
      passed,
      // If the child can't even read the demo plate, the result is unreliable
      possibleDeficiency: passed ? 'none' : demoCorrect ? 'red-green' : 'inconclusive',
    };

    const rightRaw = sessionStorage.getItem('drishti_rightEye');
    const leftRaw = sessionStorage.getItem('drishti_leftEye');
    const rightEye: EyeResult = rightRaw ? JSON.parse(rightRaw) : FALLBACK_EYE('right');
    const leftEye: EyeResult = leftRaw ? JSON.parse(leftRaw) : FALLBACK_EYE('left');

    // Persist the complete result to localStorage
    const result = saveResults(rightEye, leftEye, colorResult);
    sessionStorage.setItem('drishti_lastResultId', result.id);
    sessionStorage.removeItem('drishti_rightEye');
    sessionStorage.removeItem('drishti_leftEye');

    router.push('/results');
  };

  const submit = (selectedNumber: number | null) => {
    if (saving) return;
    const response: ColorResponse = {
      plateId: plate.id,
      correctNumber: plate.hiddenNumber,
      selectedNumber,
      correct: selectedNumber === plate.hiddenNumber,
    };
    const newResponses = [...responses, response];
    setResponses(newResponses);
    setInputValue('');

    if (plateIndex + 1 >= totalPlates) {
      finishTest(newResponses);
    } else {
      setPlateIndex(plateIndex + 1);
    }
  };

  const handleDigit = (digit: number) => {
    if (inputValue.length >= 2) return;
    setInputValue(inputValue + digit.toString());
  };

  return (
    <div className="min-h-screen flex flex-col p-6 bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold text-slate-800">{t('color.title', lang)}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {plateIndex + 1} {t('color.plateOf', lang)} {totalPlates}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full mb-4">
        <div
          className="h-full bg-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${(plateIndex / totalPlates) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center">
        <div className="mb-4">
          <IshiharaPlate key={plate.id} hiddenNumber={plate.hiddenNumber} plateType={plate.type} size={250} />
        </div>

        <p className="text-lg text-slate-600 mb-3 text-center">{t('color.instruction', lang)}</p>

        {/* Entered number */}
        <div className="mb-3 h-14 min-w-[120px] px-6 flex items-center justify-center bg-white rounded-xl border-2 border-purple-200 text-3xl font-bold text-purple-600">
          {inputValue || <span className="text-slate-300">–</span>}
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-5 gap-2 mb-3 w-full max-w-xs">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="py-3 bg-white rounded-xl border-2 border-gray-100 text-xl font-bold text-slate-700
                hover:border-purple-300 hover:bg-purple-50 active:scale-95 transition-all"
            >
              {num}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full max-w-xs mb-3">
          <button
            onClick={() => setInputValue('')}
            disabled={!inputValue}
            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium
              hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-40"
          >
            {t('color.clear', lang)}
          </button>
          <button
            onClick={() => submit(parseInt(inputValue, 10))}
            disabled={!inputValue || saving}
            className="flex-[2] py-3 bg-purple-500 text-white rounded-xl font-semibold
              hover:bg-purple-600 active:scale-95 transition-all disabled:opacity-40"
          >
            {t('common.ok', lang)} ✓
          </button>
        </div>

        <button
          onClick={() => submit(null)}
          disabled={saving}
          className="w-full max-w-xs py-3 bg-amber-50 text-amber-700 rounded-xl font-medium border border-amber-200
            hover:bg-amber-100 active:scale-95 transition-all"
        >
          {t('color.cantSee', lang)}
        </button>
      </div>
    </div>
  );
}
