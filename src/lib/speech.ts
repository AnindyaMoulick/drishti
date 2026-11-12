/**
 * Voice answers for the colour test: the child says the number they see.
 *
 * Uses the browser's Web Speech API (SpeechRecognition). It works in Chrome and
 * Edge on Android and desktop, and Safari on iOS 14.5+. Browsers only allow the
 * microphone on secure pages: HTTPS (the Vercel site) or http://localhost, so it
 * is not available when the app is opened over the LAN as http://192.168.x.x.
 * Chrome sends the audio to Google's speech service, so it needs internet.
 */

interface RecognitionAlternative { transcript: string }
interface RecognitionResult extends ArrayLike<RecognitionAlternative> { isFinal: boolean }
interface RecognitionResultEvent { results: ArrayLike<RecognitionResult> }
interface RecognitionErrorEvent { error: string }
interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** True when this browser can take voice answers on this page. */
export function canListen(): boolean {
  return !!getRecognitionCtor() && (typeof window === 'undefined' || window.isSecureContext);
}

// Zero digit of each Indian script's own digits (plus Arabic-Indic for Urdu/Sindhi/Kashmiri).
const DIGIT_ZEROS = [
  0x0660, 0x06f0, 0x0966, 0x09e6, 0x0a66, 0x0ae6, 0x0b66, 0x0be6, 0x0c66, 0x0ce6, 0x0d66, 0x1c50, 0xabf0,
];

/** Turn native-script digits (२९, ২৯, ௨௯ …) into 0-9. */
function toAsciiDigits(text: string): string {
  return [...text].map(ch => {
    const cp = ch.codePointAt(0)!;
    for (const zero of DIGIT_ZEROS) if (cp >= zero && cp <= zero + 9) return String(cp - zero);
    return ch;
  }).join('');
}

const EN_ONES: Record<string, number> = {
  zero: 0, oh: 0, one: 1, two: 2, to: 2, too: 2, three: 3, four: 4, for: 4, five: 5, six: 6, seven: 7,
  eight: 8, ate: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const EN_TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

/** Find a number 0-99 in what the recogniser heard ("29", "२९", "twenty nine", "it's 8"). */
export function parseSpokenNumber(transcript: string): number | null {
  const text = toAsciiDigits(transcript.toLowerCase());
  const digits = text.match(/\d+/g);
  if (digits) {
    const n = parseInt(digits.join(''), 10); // "2 9" → 29
    return n <= 99 ? n : null;
  }
  const words = text.replace(/[-,.!?]/g, ' ').split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    if (words[i] in EN_TENS) {
      const next = words[i + 1];
      const ones = next !== undefined && EN_ONES[next] !== undefined && EN_ONES[next] < 10 ? EN_ONES[next] : 0;
      return EN_TENS[words[i]] + ones;
    }
    if (words[i] in EN_ONES && !['to', 'too', 'for', 'oh'].includes(words[i])) return EN_ONES[words[i]];
  }
  return null;
}

// "Nothing", "I can't see", "कुछ नहीं" … the child says they see no number.
const NO_NUMBER = [
  'nothing', 'none', 'no number', 'cant', "can't", 'cannot', 'can not', 'not see', 'blank', 'empty',
  'कुछ नहीं', 'नहीं दिख', 'kuch nahi', 'kuchh nahi', 'nahi dikh', 'कुछ भी नहीं', 'کچھ نہیں', 'نہیں دکھ',
];

/** True when the child says they can't see any number. */
export function isNoNumberAnswer(transcript: string): boolean {
  const text = transcript.toLowerCase().replace(/[’‘]/g, "'");
  return NO_NUMBER.some(p => text.includes(p));
}

/** What the listener heard: a number, "no number" (null), or speech without a number. */
export interface NumberListenerHandlers {
  onAnswer: (value: number | null, heard: string) => void;
  onNoNumber: (heard: string) => void;
  onFatal: (error: string) => void;
}

// Errors after which listening can't continue (mic blocked, offline …).
const FATAL_ERRORS = ['not-allowed', 'service-not-allowed', 'network', 'audio-capture'];
// An unfinished ("interim") number is taken if it doesn't change for this long,
// so "twenty" isn't accepted while the child is still saying "twenty nine".
const INTERIM_SETTLE_MS = 400;

/**
 * Keep the microphone open and report every number the child says, as soon as it
 * is heard. One continuous session is used for the whole test (restarted when the
 * browser ends it), because stopping and restarting the recogniser after each
 * answer, and speaking feedback in between, made Android Chrome keep the mic on
 * but stop hearing anything.
 *
 * Languages the speech service doesn't support fall back to Indian English,
 * since children usually know number names in English too.
 */
export function startNumberListener(lang: string, handlers: NumberListenerHandlers): { stop: () => void } {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    handlers.onFatal('not-supported');
    return { stop: () => {} };
  }

  let active = true;
  let tag = lang;
  let rec: Recognition | null = null;
  let pending: ReturnType<typeof setTimeout> | null = null;
  let skipUntilFinal = false;            // this utterance was already answered from an interim result
  let last = { heard: '', at: 0 };       // Android repeats final results; ignore repeats

  const clearPending = () => { if (pending) { clearTimeout(pending); pending = null; } };

  const read = (alts: RecognitionAlternative[]): { value: number | null; heard: string } | null => {
    for (const alt of alts) {
      const n = parseSpokenNumber(alt.transcript);
      if (n !== null) return { value: n, heard: alt.transcript };
    }
    const none = alts.find(alt => isNoNumberAnswer(alt.transcript));
    return none ? { value: null, heard: none.transcript } : null;
  };

  const accept = (answer: { value: number | null; heard: string }) => {
    clearPending();
    const now = Date.now();
    if (answer.heard.trim() === last.heard && now - last.at < 2000) return;
    last = { heard: answer.heard.trim(), at: now };
    handlers.onAnswer(answer.value, answer.heard);
  };

  const start = () => {
    if (!active) return;
    const r = new Ctor();
    rec = r;
    r.lang = tag;
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 3;
    skipUntilFinal = false;

    r.onresult = e => {
      const result = e.results[e.results.length - 1];
      if (!result) return;
      const alts = Array.from(result);
      const answer = read(alts);
      if (result.isFinal) {
        clearPending();
        if (skipUntilFinal) {
          // Already answered from the interim text; remember the final wording so a repeat is ignored.
          skipUntilFinal = false;
          last = { heard: alts[0]?.transcript.trim() ?? '', at: Date.now() };
          return;
        }
        if (answer) accept(answer);
        else if (alts[0]?.transcript.trim()) handlers.onNoNumber(alts[0].transcript);
        return;
      }
      if (skipUntilFinal) return;
      clearPending();
      if (answer) {
        pending = setTimeout(() => { pending = null; skipUntilFinal = true; accept(answer); }, INTERIM_SETTLE_MS);
      }
    };
    r.onerror = e => {
      if ((e.error === 'language-not-supported' || e.error === 'bad-grammar') && tag !== 'en-IN') {
        tag = 'en-IN'; // restarted in English by onend
        return;
      }
      if (FATAL_ERRORS.includes(e.error)) {
        active = false;
        clearPending();
        handlers.onFatal(e.error);
      }
      // 'no-speech' / 'aborted': onend restarts listening
    };
    r.onend = () => {
      if (rec === r) rec = null;
      if (active) setTimeout(start, 50);
    };
    try { r.start(); } catch { setTimeout(() => active && rec === r && start(), 300); }
  };

  // Don't let a spoken instruction be picked up by the microphone.
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  start();

  return {
    stop: () => {
      active = false;
      clearPending();
      rec?.abort();
      rec = null;
    },
  };
}
