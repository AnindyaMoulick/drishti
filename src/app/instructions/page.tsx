"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { t } from '@/lib/i18n';
import { speak, getSpeechLang } from '@/lib/audio';

const steps = [
  { icon: '📱', key: 'instructions.step1' },
  { icon: '🤚', key: 'instructions.step2' },
  { icon: '👆', key: 'instructions.step3' },
  { icon: '✅', key: 'instructions.step4' },
];

export default function InstructionsPage() {
  const router = useRouter();
  const { state, hydrated } = useApp();
  const lang = state.language || 'en';

  const handleStart = () => {
    // Don't await speech: some browsers never fire `onend`, which would block navigation.
    // The acuity page speaks its own "cover your eye" instruction on load.
    router.push('/test/acuity');
  };

  // Read the steps aloud when the page opens
  useEffect(() => {
    if (!hydrated) return;
    const text = steps.map((s, i) => `${i + 1}. ${t(s.key, lang)}`).join('. ');
    speak(text, getSpeechLang(lang));
  }, [hydrated, lang]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-50 to-white">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {t('instructions.title', lang)}
        </h1>
      </div>

      <div className="w-full max-w-xs space-y-4 mb-10">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              {step.icon}
            </div>
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {index + 1}
              </span>
              <p className="text-slate-600 text-sm">
                {t(step.key, lang)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Arm's length illustration */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm">
          <span>💡</span>
          <span>{t('instructions.armTip', lang, { cm: state.armLengthCM || 40 })}</span>
        </div>
      </div>

      <button
        onClick={handleStart}
        className="w-full max-w-xs py-5 px-8 bg-emerald-500 text-white rounded-2xl text-xl font-semibold
          shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all"
      >
        {t('instructions.ready', lang)}
      </button>
    </div>
  );
}
