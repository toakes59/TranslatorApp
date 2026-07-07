import * as Speech from 'expo-speech';

import type { LangCode } from './translation';

const BCP47_TAG: Record<LangCode, string> = {
  ja: 'ja-JP',
  en: 'en-US',
};

export function speak(text: string, lang: LangCode) {
  Speech.stop();
  Speech.speak(text, { language: BCP47_TAG[lang] });
}

export function stopSpeaking() {
  Speech.stop();
}
