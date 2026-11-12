"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { IshiharaPlate, TEST_PLATES } from '@/components/IshiharaPlate';
import { t } from '@/lib/i18n';
import { speak, getSpeechLang } from '@/lib/audio';
import { ColorResponse } from '@/types';
import { scoreColorTest } from '@/lib/colorScoring';
import { canListen, startNumberListener } from '@/lib/speech';

// How long the heard number stays on screen before the next plate.
const SHOW_ANSWER_MS = 600;

/** What the screen shows after a voice answer: a number, or "can't see" (null). */
type ShownAnswer = { value: number | null };

export default function ColorTestPage() {
  const router = useRouter();
  const { state, hydrated, saveResults } = useApp();
  const lang = state.language || 'en';
  const speechLang = getSpeechLang(lang);

  const [plateIndex, setPlateIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  // Refs so voice callbacks always see the current plate and answers.
  const plateRef = useRef(0);
  const responsesRef = useRef<ColorResponse[]>([]);
  const savingRef = useRef(false);

  // Voice answers: the mic stays on for the whole test; each number heard is
  // shown briefly and the next plate follows at once.
  const [voiceOn, setVoiceOn] = useState(false);
  const [shown, setShown] = useState<ShownAnswer | null>(null);
  const [voiceMessage, setVoiceMessage] = useState('');
  const stopListening = useRef<(() => void) | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false); // showing an answer: ignore speech until the next plate
  // Checked after hydration only (needs window); without it the keypad is used.
  const micAvailable = useMemo(() => hydrated && canListen(), [hydrated]);

  // Stop the microphone and timers if the child leaves the page.
  useEffect(() => () => {
    stopListening.current?.();
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const plate = TEST_PLATES[plateIndex];
  const totalPlates = TEST_PLATES.length;

  // Guard: the test needs the details entered on the earlier screens (restored after a refresh).
  useEffect(() => {
    if (hydrated && (!state.language || !state.age)) router.replace('/');
  }, [hydrated, state.language, state.age, router]);

  useEffect(() => {
    if (hydrated && plateIndex === 0) speak(t('color.instruction', lang), speechLang);
  }, [hydrated, plateIndex, lang, speechLang]);

  const finishTest = (allResponses: ColorResponse[]) => {
    savingRef.current = true;
    setSaving(true);
    stopListening.current?.();
    stopListening.current = null;
    const colorResult = scoreColorTest(allResponses);

    // Persist the result to localStorage
    const result = saveResults({ colorVision: colorResult });
    sessionStorage.setItem('drishti_lastResultId', result.id);

    router.push('/results');
  };

  /** Record the answer for the current plate. */
  const submit = (selectedNumber: number | null) => {
    if (savingRef.current) return;
    const idx = plateRef.current;
    const current = TEST_PLATES[idx];
    const response: ColorResponse = {
      plateId: current.id,
      correctNumber: current.hiddenNumber,
      selectedNumber,
      correct: selectedNumber === current.hiddenNumber,
    };
    const all = [...responsesRef.current, response];
    responsesRef.current = all;
    setInputValue('');
    setVoiceMessage(''); // hint belongs to this plate only

    if (idx + 1 >= totalPlates) {
      finishTest(all);
      return;
    }
    plateRef.current = idx + 1;
    setPlateIndex(idx + 1);
  };

  /** A voice answer arrived: show it, then go to the next plate (the mic keeps listening). */
  const onVoiceAnswer = (value: number | null) => {
    if (busyRef.current || savingRef.current) return;
    busyRef.current = true;
    setShown({ value });
    setVoiceMessage('');
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      setShown(null);
      busyRef.current = false;
      submit(value);
    }, SHOW_ANSWER_MS);
  };

  const startVoice = () => {
    if (stopListening.current || savingRef.current) return;
    setVoiceOn(true);
    setVoiceMessage('');
    const { stop } = startNumberListener(speechLang, {
      onAnswer: value => onVoiceAnswer(value),
      onNoNumber: () => { if (!busyRef.current) setVoiceMessage(t('color.notHeard', lang)); },
      onFatal: () => {
        // Voice can't work here (mic blocked, offline …): fall back to the keypad.
        stopListening.current = null;
        setVoiceOn(false);
        setVoiceMessage(t('color.notHeard', lang));
      },
    });
    stopListening.current = stop;
  };

  const switchToKeypad = () => {
    stopListening.current?.();
    stopListening.current = null;
    setVoiceOn(false);
    setVoiceMessage('');
  };

  const handleDigit = (digit: number) => {
    if (inputValue.length >= 2) return;
    setInputValue(inputValue + digit.toString());
  };

  const voiceMode = micAvailable && voiceOn;

  return (
    <div className="min-h-screen flex flex-col p-6 bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold text-slate-800">{t('color.title', lang)}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {t('color.progress', lang, { current: plateIndex + 1, total: totalPlates })}
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
          <IshiharaPlate key={plate.id} hiddenNumber={plate.hiddenNumber} plateType={plate.type} size={280} />
        </div>

        <p className="text-lg text-slate-600 mb-3 text-center">{t('color.instruction', lang)}</p>

        {voiceMode ? (
          /* Voice answers: the child just says the number */
          <div className="w-full max-w-xs flex flex-col items-center">
            <div
              className={`w-full h-28 mb-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-colors
                ${shown ? 'border-emerald-300 bg-emerald-50' : 'border-rose-200 bg-white'}`}
              aria-live="polite"
            >
              {shown ? (
                <>
                  <span className="text-5xl font-bold text-emerald-600">{shown.value ?? '–'}</span>
                  <span className="text-sm text-emerald-700 mt-1">
                    {shown.value === null ? t('color.cantSee', lang) : t('color.heard', lang, { number: shown.value })}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-4xl animate-pulse" aria-hidden="true">🎤</span>
                  <span className="text-base text-rose-600 font-medium mt-1">{t('color.listening', lang)}</span>
                </>
              )}
            </div>
            {voiceMessage && <p className="mb-3 text-sm text-amber-700 text-center">{voiceMessage}</p>}
            <button
              onClick={switchToKeypad}
              disabled={!!shown}
              className="text-sm text-purple-600 underline underline-offset-4 py-2 disabled:opacity-40"
            >
              ⌨️ {t('color.typeInstead', lang)}
            </button>
          </div>
        ) : (
          <>
            {micAvailable && (
              <div className="w-full max-w-xs mb-3">
                <button
                  onClick={startVoice}
                  disabled={saving}
                  className="w-full py-4 rounded-2xl text-lg font-semibold flex items-center justify-center gap-2 transition-all active:scale-95
                    bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-200"
                >
                  <span aria-hidden="true">🎤</span>
                  <span>{t('color.speak', lang)}</span>
                </button>
                {voiceMessage && <p className="mt-2 text-sm text-amber-700 text-center">{voiceMessage}</p>}
              </div>
            )}

            {/* Entered number */}
            <div className="mb-3 h-14 min-w-[120px] px-6 flex items-center justify-center bg-white rounded-xl border-2 border-purple-200 text-3xl font-bold text-purple-600">
              {inputValue || <span className="text-slate-300">–</span>}
            </div>

            {/* Number pad */}
            <div dir="ltr" className="grid grid-cols-5 gap-2 mb-3 w-full max-w-xs">
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
          </>
        )}

        <button
          onClick={() => submit(null)}
          disabled={saving || !!shown}
          className="w-full max-w-xs mt-3 py-3 bg-amber-50 text-amber-700 rounded-xl font-medium border border-amber-200
            hover:bg-amber-100 active:scale-95 transition-all disabled:opacity-40"
        >
          {t('color.cantSee', lang)}
        </button>
      </div>
    </div>
  );
}
