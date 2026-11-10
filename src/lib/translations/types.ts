import type { TranslationKey } from './en';

/** Every language must translate every key (TypeScript checks this). */
export type Translations = Record<TranslationKey, string>;
