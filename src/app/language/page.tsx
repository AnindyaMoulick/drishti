"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { LANGUAGES } from '@/lib/constants';
import { LanguageCode } from '@/types';
import { t } from '@/lib/i18n';

export default function LanguagePage() {
  const router = useRouter();
  const { setLanguage } = useApp();

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    router.push('/name');
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-indigo-50 to-white">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">{t('language.title', 'en')}</h1>
        <p className="text-lg text-slate-500">{t('language.title', 'hi')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className="p-4 bg-white rounded-2xl border-2 border-gray-100 text-center
              hover:border-indigo-300 hover:bg-indigo-50 active:scale-95 
              transition-all duration-200 shadow-sm"
          >
            <p className="text-lg font-semibold text-slate-800">{lang.nativeName}</p>
            <p className="text-sm text-slate-400 mt-1">{lang.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
