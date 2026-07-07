import { Platform } from 'react-native';
import FastTranslator, { type Languages } from 'fast-mlkit-translate-text';

export type LangCode = 'ja' | 'en';

export const LANGUAGE_NAMES: Record<LangCode, Languages> = {
  ja: 'Japanese',
  en: 'English',
};

export const LANGUAGE_LABELS: Record<LangCode, string> = {
  ja: '日本語',
  en: 'English',
};

// Google ML Kit is a native-only capability, so this module doesn't exist on web.
// Guard every entry point rather than letting the underlying native-module proxy throw.
const isNativeAvailable = Platform.OS !== 'web';

export class TranslationModelNotDownloadedError extends Error {
  constructor(public lang: LangCode) {
    super(`Translation model for ${LANGUAGE_NAMES[lang]} is not downloaded yet.`);
    this.name = 'TranslationModelNotDownloadedError';
  }
}

export class TranslationUnavailableError extends Error {
  constructor() {
    super('Offline translation is only available in a native app build, not in the web preview.');
    this.name = 'TranslationUnavailableError';
  }
}

export const translationService = {
  async isModelDownloaded(lang: LangCode): Promise<boolean> {
    if (!isNativeAvailable) return false;
    return FastTranslator.isLanguageDownloaded(LANGUAGE_NAMES[lang]);
  },

  async downloadModel(lang: LangCode): Promise<boolean> {
    if (!isNativeAvailable) return false;
    return FastTranslator.downloadLanguageModel(LANGUAGE_NAMES[lang]);
  },

  async deleteModel(lang: LangCode): Promise<boolean> {
    if (!isNativeAvailable) return false;
    return FastTranslator.deleteLanguageModel(LANGUAGE_NAMES[lang]);
  },

  /** Throws TranslationModelNotDownloadedError if either language's model isn't ready. */
  async translate(text: string, source: LangCode, target: LangCode): Promise<string> {
    if (!isNativeAvailable) throw new TranslationUnavailableError();

    const [sourceReady, targetReady] = await Promise.all([
      this.isModelDownloaded(source),
      this.isModelDownloaded(target),
    ]);
    if (!sourceReady) throw new TranslationModelNotDownloadedError(source);
    if (!targetReady) throw new TranslationModelNotDownloadedError(target);

    await FastTranslator.prepare({
      source: LANGUAGE_NAMES[source],
      target: LANGUAGE_NAMES[target],
      downloadIfNeeded: false,
    });
    return FastTranslator.translate(text);
  },
};
