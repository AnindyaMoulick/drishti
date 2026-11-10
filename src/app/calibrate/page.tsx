"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { calculatePPI } from '@/lib/calibration';
import { AADHAAR_CARD } from '@/lib/constants';
import { t } from '@/lib/i18n';

export default function CalibratePage() {
  const router = useRouter();
  const { state, setCalibration } = useApp();
  const lang = state.language || 'en';
  
  // Initial card width in pixels (approximate)
  const [cardWidthPx, setCardWidthPx] = useState(280);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  
  // Calculate height based on aspect ratio
  const aspectRatio = AADHAAR_CARD.heightMM / AADHAAR_CARD.widthMM;
  const cardHeightPx = cardWidthPx * aspectRatio;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = cardWidthPx;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [cardWidthPx]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startX.current;
    const newWidth = Math.max(150, Math.min(400, startWidth.current + dx * 2));
    setCardWidthPx(newWidth);
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleDone = () => {
    const ppi = calculatePPI(cardWidthPx, AADHAAR_CARD.widthMM);
    setCalibration(ppi);
    router.push('/instructions');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-50 to-white">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">📏</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {t('calibrate.title', lang)}
        </h1>
        <p className="text-slate-500 text-sm max-w-xs">
          {t('calibrate.instruction', lang)}
        </p>
      </div>

      {/* Card outline */}
      <div 
        ref={containerRef}
        className="relative mb-6 flex items-center justify-center"
      >
        <div
          className="border-3 border-dashed border-indigo-400 rounded-lg bg-indigo-50/30 relative flex items-center justify-center"
          style={{ width: cardWidthPx, height: cardHeightPx }}
        >
          <span className="text-xs text-indigo-300 font-medium">{t('calibrate.cardLabel', lang)}</span>
          
          {/* Resize handle - right edge */}
          <div
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-12 bg-indigo-500 rounded-lg
              flex items-center justify-center cursor-ew-resize shadow-lg touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <path d="M4 3l-3 5 3 5M12 3l3 5-3 5" strokeWidth="2" stroke="white" fill="none"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Fine-tune buttons (dragging precisely is hard on small screens) */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setCardWidthPx(w => Math.max(150, w - 1))}
          className="w-14 h-14 bg-white border-2 border-indigo-200 rounded-2xl text-2xl font-bold text-indigo-600
            active:scale-95 transition-all"
          aria-label={t('calibrate.smaller', lang)}
        >
          −
        </button>
        <span className="text-sm text-slate-400 w-16 text-center">{Math.round(cardWidthPx)} px</span>
        <button
          onClick={() => setCardWidthPx(w => Math.min(400, w + 1))}
          className="w-14 h-14 bg-white border-2 border-indigo-200 rounded-2xl text-2xl font-bold text-indigo-600
            active:scale-95 transition-all"
          aria-label={t('calibrate.bigger', lang)}
        >
          +
        </button>
      </div>

      <p className="text-xs text-slate-400 mb-4 text-center">
        {t('calibrate.tip', lang)}
      </p>
      
      <p className="text-xs text-slate-400 mb-8 text-center">
        {t('calibrate.noCard', lang)}
      </p>

      <button
        onClick={handleDone}
        className="w-full max-w-xs py-4 px-8 bg-indigo-500 text-white rounded-2xl text-lg font-semibold
          shadow-lg shadow-indigo-200 hover:bg-indigo-600 active:scale-95 transition-all"
      >
        {t('calibrate.done', lang)}
      </button>
    </div>
  );
}
