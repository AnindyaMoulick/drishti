"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TestResult } from '@/types';
import { useApp } from '@/context/AppContext';
import { t } from '@/lib/i18n';
import { getTestResults, deleteTestResult, clearAllResults, exportResults, exportResultsCSV } from '@/lib/storage';

export default function HistoryPage() {
  const router = useRouter();
  const { state, hydrated } = useApp();
  const lang = state.language || 'en';
  const [version, setVersion] = useState(0); // bumped after delete/clear to re-read storage
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Only read localStorage after hydration so the server render matches.
  const results = useMemo<TestResult[]>(
    () => (hydrated ? getTestResults().sort((a, b) => b.timestamp - a.timestamp) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version forces a re-read
    [hydrated, version]
  );

  const handleDelete = (id: string) => {
    deleteTestResult(id);
    setVersion(v => v + 1);
  };

  const handleClearAll = () => {
    clearAllResults();
    setVersion(v => v + 1);
    setShowClearConfirm(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/')}
          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200
            hover:bg-gray-50 active:scale-95 transition-all"
          aria-label={t('common.back', lang)}
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-slate-800">{t('history.title', lang)}</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {results.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-slate-400 text-lg">{t('history.noResults', lang)}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 py-3 px-6 bg-indigo-500 text-white rounded-xl font-medium
              hover:bg-indigo-600 active:scale-95 transition-all"
          >
            {t('history.takeTest', lang)}
          </button>
        </div>
      ) : (
        <>
          {/* Summary + action buttons */}
          <p className="text-sm text-slate-500 mb-3 text-center">
            {t('history.summary', lang, { saved: results.length, checkup: results.filter(r => !r.overallPassed).length })}
          </p>
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => exportResultsCSV()}
              className="flex-1 py-3 px-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-slate-600
                hover:bg-gray-50 active:scale-95 transition-all"
            >
              📊 {t('history.exportCSV', lang)}
            </button>
            <button
              onClick={() => exportResults()}
              className="flex-1 py-3 px-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-slate-600
                hover:bg-gray-50 active:scale-95 transition-all"
            >
              📥 {t('history.exportJSON', lang)}
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex-1 py-3 px-4 bg-white border border-red-200 rounded-xl text-sm font-medium text-red-500
                hover:bg-red-50 active:scale-95 transition-all"
            >
              🗑️ {t('history.clear', lang)}
            </button>
          </div>

          {/* Results list */}
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    {result.childName && (
                      <p className="font-semibold text-slate-800">{result.childName}</p>
                    )}
                    <p className="text-xs text-slate-400">{formatDate(result.timestamp)}</p>
                    <p className="text-xs text-slate-400">{t('history.age', lang, { age: result.age })}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    result.overallPassed 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {result.overallPassed ? `✅ ${t('results.normal', lang)}` : `⚠️ ${t('results.needsCheck', lang)}`}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className={`p-2 rounded-lg ${result.rightEye.passed ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    <p className="text-slate-400">{t('results.rightEye', lang)}</p>
                    <p className="font-semibold">{result.rightEye.bestSnellen}</p>
                    <p>{result.rightEye.passed ? '✅' : '⚠️'}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${result.leftEye.passed ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    <p className="text-slate-400">{t('results.leftEye', lang)}</p>
                    <p className="font-semibold">{result.leftEye.bestSnellen}</p>
                    <p>{result.leftEye.passed ? '✅' : '⚠️'}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${result.colorVision.passed ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    <p className="text-slate-400">{t('history.color', lang)}</p>
                    <p className="font-semibold">{result.colorVision.passed ? t('results.normal', lang) : t('history.check', lang)}</p>
                    <p>{result.colorVision.passed ? '✅' : '⚠️'}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(result.id)}
                  className="mt-3 w-full py-2 text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  {t('history.deleteOne', lang)}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Clear confirmation modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <p className="text-lg font-semibold text-slate-800 mb-2">{t('history.clearTitle', lang)}</p>
            <p className="text-slate-500 mb-6">{t('history.cannotUndo', lang)}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-slate-600 font-medium
                  hover:bg-gray-50 active:scale-95 transition-all"
              >
                {t('common.cancel', lang)}
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium
                  hover:bg-red-600 active:scale-95 transition-all"
              >
                {t('history.clear', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
