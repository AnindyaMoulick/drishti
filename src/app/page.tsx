"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { t } from '@/lib/i18n';

export default function HomePage() {
  const router = useRouter();
  const { state, resetState } = useApp();
  const lang = state.language || 'en';

  const handleStartTest = () => {
    resetState();
    router.push('/language');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-50 to-white">
      {/* Logo / Title */}
      <div className="text-center mb-12">
        <div className="w-24 h-24 mx-auto mb-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z" stroke="white" strokeWidth="2" fill="none"/>
            <circle cx="12" cy="12" r="3.5" fill="white"/>
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">
          {t('home.title', lang)}
        </h1>
        <p className="text-xl text-indigo-400 mb-4">दृष्टि</p>
        <p className="text-lg text-slate-500">
          {t('home.subtitle', lang)}
        </p>
      </div>

      {/* Description */}
      <p className="text-center text-slate-500 mb-10 max-w-xs leading-relaxed">
        {t('home.description', lang)}
      </p>

      {/* Buttons */}
      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={handleStartTest}
          className="w-full py-5 px-8 bg-indigo-500 text-white rounded-2xl text-xl font-semibold
            shadow-lg shadow-indigo-200 hover:bg-indigo-600 active:scale-95 transition-all duration-200"
        >
          {t('home.startTest', lang)}
        </button>
        
        <button
          onClick={() => router.push('/history')}
          className="w-full py-4 px-8 bg-white text-indigo-500 rounded-2xl text-lg font-medium
            border-2 border-indigo-200 hover:bg-indigo-50 active:scale-95 transition-all duration-200"
        >
          {t('home.viewHistory', lang)}
        </button>
      </div>

      {/* Footer disclaimer */}
      <p className="mt-12 text-xs text-slate-400 text-center max-w-xs">
        {t('disclaimer.home', lang)}
      </p>
    </div>
  );
}
