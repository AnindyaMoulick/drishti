"use client";

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { TestResult } from '@/types';
import { getTestResultById } from '@/lib/storage';
import { t } from '@/lib/i18n';
import { speak, getSpeechLang } from '@/lib/audio';

function ResultCard({ title, passed, detail, lang }: {
  title: string;
  passed: boolean;
  detail?: string;
  lang: string;
}) {
  return (
    <div className={`p-5 rounded-2xl border-2 ${
      passed ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{passed ? '✅' : '⚠️'}</span>
          <div>
            <p className="font-semibold text-slate-700">{title}</p>
            {detail && <p className="text-sm mt-1 text-slate-500">{detail}</p>}
          </div>
        </div>
        <div className={`px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
          passed ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
        }`}>
          {passed ? t('results.normal', lang) : t('results.needsCheck', lang)}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const { state, hydrated, resetState } = useApp();
  const lang = state.language || 'en';
  const speechLang = getSpeechLang(lang);
  // Storage is only read after hydration, so the server render (loading) matches.
  const result = useMemo<TestResult | null | undefined>(() => {
    if (!hydrated) return undefined;
    const id = sessionStorage.getItem('drishti_lastResultId');
    return (id && getTestResultById(id)) || null;
  }, [hydrated]);

  useEffect(() => {
    if (result) speak(t(result.overallPassed ? 'results.passed' : 'results.failed', lang), speechLang);
  }, [result, lang, speechLang]);

  if (result === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-slate-500">{t('history.noResults', lang)}</p>
        <button onClick={() => router.push('/')} className="py-3 px-6 bg-indigo-500 text-white rounded-xl">
          {t('results.home', lang)}
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-slate-400">{t('common.loading', lang)}</p>
      </div>
    );
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-indigo-50 to-white">
      <div className="text-center mb-8">
        <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
          result.overallPassed ? 'bg-emerald-100' : 'bg-amber-100'
        }`}>
          <span className="text-4xl">{result.overallPassed ? '😊' : '👓'}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">{t('results.title', lang)}</h1>
        <p className={`text-lg font-medium ${result.overallPassed ? 'text-emerald-600' : 'text-amber-600'}`}>
          {t(result.overallPassed ? 'results.passed' : 'results.failed', lang)}
        </p>
        {result.childName && (
          <p className="text-slate-500 mt-1">
            {result.childName}, {result.age} {t('age.years', lang)}
          </p>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <ResultCard title={t('results.rightEye', lang)} passed={result.rightEye.passed} lang={lang} />
        <ResultCard title={t('results.leftEye', lang)} passed={result.leftEye.passed} lang={lang} />
        <ResultCard
          title={t('results.colorVision', lang)}
          passed={result.colorVision.passed}
          detail={t(result.colorVision.passed ? 'results.colorPassed' : 'results.colorFailed', lang)}
          lang={lang}
        />
      </div>

      <p className="text-center text-xs text-slate-400 mb-6">
        💾 {t('results.dateSaved', lang)} {formatDate(result.timestamp)}
      </p>

      <div className="space-y-3">
        <button
          onClick={() => {
            resetState();
            router.push('/language');
          }}
          className="w-full py-4 px-8 bg-indigo-500 text-white rounded-2xl text-lg font-semibold
            shadow-lg shadow-indigo-200 hover:bg-indigo-600 active:scale-95 transition-all"
        >
          {t('results.newTest', lang)}
        </button>
        <button
          onClick={() => router.push('/history')}
          className="w-full py-3 px-8 bg-white text-indigo-500 border-2 border-indigo-200 rounded-2xl text-lg font-medium
            hover:bg-indigo-50 active:scale-95 transition-all"
        >
          {t('home.viewHistory', lang)}
        </button>
        <button
          onClick={() => {
            resetState();
            router.push('/');
          }}
          className="w-full py-3 px-8 text-indigo-500 rounded-2xl text-lg font-medium hover:bg-indigo-50 active:scale-95 transition-all"
        >
          {t('results.home', lang)}
        </button>
      </div>

      <p className="mt-8 text-xs text-slate-400 text-center">
        {t('disclaimer.results', lang)}
      </p>
    </div>
  );
}
