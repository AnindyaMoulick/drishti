"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { t } from '@/lib/i18n';

export default function AgePage() {
  const router = useRouter();
  const { state, setAge } = useApp();
  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const lang = state.language || 'en';

  const ages = [6, 7, 8, 9, 10, 11, 12, 13, 14];

  const handleNext = () => {
    if (selectedAge !== null) {
      setAge(selectedAge);
      // The colour test needs no screen calibration or viewing distance.
      router.push(state.testMode === 'color' ? '/test/color' : '/calibrate');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-50 to-white">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">🎂</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {t('age.title', lang)}
        </h1>
        <p className="text-slate-500">
          {t('age.subtitle', lang)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-xs">
        {ages.map((age) => (
          <button
            key={age}
            onClick={() => setSelectedAge(age)}
            className={`
              py-5 rounded-2xl text-2xl font-bold transition-all duration-200 active:scale-95
              ${selectedAge === age
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200 scale-105'
                : 'bg-white text-slate-600 border-2 border-gray-100 hover:border-indigo-300'
              }
            `}
          >
            {age}
          </button>
        ))}
      </div>

      {selectedAge && (
        <p className="text-lg text-slate-500 mb-6">
          {selectedAge} {t('age.years', lang)}
        </p>
      )}

      <button
        onClick={handleNext}
        disabled={selectedAge === null}
        className={`
          w-full max-w-xs py-4 px-8 rounded-2xl text-lg font-semibold transition-all duration-200
          ${selectedAge !== null
            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-600 active:scale-95'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {t('age.next', lang)}
      </button>
    </div>
  );
}
