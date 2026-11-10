"use client";

import React from 'react';
import { LEASymbol } from './LEASymbols';

type LEASymbolType = 'house' | 'circle' | 'square' | 'apple';

interface ConfirmationDialogProps {
  isOpen: boolean;
  symbol: LEASymbolType;
  symbolSize?: number;
  confirmText: string;
  yesText: string;
  noText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  symbol,
  symbolSize = 80,
  confirmText,
  yesText,
  noText,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700 mb-6">
            {confirmText}
          </p>

          <div className="flex justify-center mb-8">
            <div className="p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-200">
              <LEASymbol symbol={symbol} size={symbolSize} color="#4F46E5" />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 py-4 px-6 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-lg
                hover:bg-gray-50 active:scale-95 transition-all"
            >
              {noText}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-4 px-6 rounded-2xl bg-emerald-500 text-white font-semibold text-lg
                hover:bg-emerald-600 active:scale-95 transition-all shadow-lg"
            >
              {yesText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;
