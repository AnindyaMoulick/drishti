"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { t } from '@/lib/i18n';

export default function NamePage() {
  const router = useRouter();
  const { state, setChildName } = useApp();
  const [name, setName] = useState('');
  const lang = state.language || 'en';

  const handleNext = () => {
    if (name.trim()) {
      setChildName(name.trim());
    }
    router.push('/age');
  };

  const handleSkip = () => {
    router.push('/age');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-50 to-white">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">👋</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {t('name.title', lang)}
        </h1>
        <p className="text-slate-500">
          {t('name.subtitle', lang)}
        </p>
      </div>

      <div className="w-full max-w-xs space-y-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('name.placeholder', lang)}
          className="w-full py-4 px-6 text-xl text-center bg-white rounded-2xl border-2 border-gray-200
            focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100
            placeholder-slate-300 transition-all"
          autoFocus
        />

        <button
          onClick={handleNext}
          className="w-full py-4 px-8 bg-indigo-500 text-white rounded-2xl text-lg font-semibold
            shadow-lg shadow-indigo-200 hover:bg-indigo-600 active:scale-95 transition-all"
        >
          {t('name.next', lang)}
        </button>

        <button
          onClick={handleSkip}
          className="w-full py-3 px-8 text-indigo-400 rounded-2xl text-lg font-medium
            hover:bg-indigo-50 active:scale-95 transition-all"
        >
          {t('name.skip', lang)}
        </button>
      </div>
    </div>
  );
}
