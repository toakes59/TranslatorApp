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

export class TranslationModelNotDownloadedError extends Error {
  constructor(public lang: LangCode) {
    super(`Translation model for ${LANGUAGE_NAMES[lang]} is not downloaded yet.`);
    this.name = 'TranslationModelNotDownloadedError';
  }
}

export const translationService = {
  async isModelDownloaded(lang: LangCode): Promise<boolean> {
    return FastTranslator.isLanguageDownloaded(LANGUAGE_NAMES[lang]);
  },

  async downloadModel(lang: LangCode): Promise<boolean> {
    return FastTranslator.downloadLanguageModel(LANGUAGE_NAMES[lang]);
  },

  async deleteModel(lang: LangCode): Promise<boolean> {
    return FastTranslator.deleteLanguageModel(LANGUAGE_NAMES[lang]);
  },

  /** Throws TranslationModelNotDownloadedError if either language's model isn't ready. */
  async translate(text: string, source: LangCode, target: LangCode): Promise<string> {
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
