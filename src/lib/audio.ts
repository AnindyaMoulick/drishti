/**
 * Speak text using the Web Speech API
 * Falls back silently if not supported
 */
export function speak(text: string, lang: string = 'en-IN'): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for children
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve(); // Don't fail if TTS doesn't work

    window.speechSynthesis.speak(utterance);
  });
}

// Map our language codes to BCP 47 language tags for speech synthesis
export const SPEECH_LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  ur: 'ur-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  or: 'or-IN',
  pa: 'pa-IN',
  as: 'as-IN',
  mai: 'mai-IN',
  sat: 'sat-IN',
  ks: 'ks-IN',
  ne: 'ne-IN',
  sd: 'sd-IN',
  doi: 'doi-IN',
  kok: 'kok-IN',
  mni: 'mni-IN',
  bo: 'bo-IN',
  sa: 'sa-IN',
};

export function getSpeechLang(langCode: string): string {
  return SPEECH_LANG_MAP[langCode] || 'en-IN';
}

/**
 * Check if speech synthesis is available for a language
 */
export function isSpeechAvailable(lang: string): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  const voices = window.speechSynthesis.getVoices();
  return voices.some(v => v.lang.startsWith(lang.split('-')[0]));
}
