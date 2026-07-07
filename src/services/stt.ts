import { useCallback, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

import type { LangCode } from './translation';

const BCP47_TAG: Record<LangCode, string> = {
  ja: 'ja-JP',
  en: 'en-US',
};

export function useSpeechToText(lang: LangCode) {
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useSpeechRecognitionEvent('start', () => setRecognizing(true));
  useSpeechRecognitionEvent('end', () => setRecognizing(false));
  useSpeechRecognitionEvent('result', (event) => {
    setTranscript(event.results[0]?.transcript ?? '');
  });
  useSpeechRecognitionEvent('error', (event) => {
    setError(event.message ?? event.error);
  });

  const start = useCallback(async () => {
    setError(null);
    setTranscript('');
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError('Microphone/speech permission was not granted.');
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: BCP47_TAG[lang],
      interimResults: true,
      continuous: false,
      requiresOnDeviceRecognition: true,
    });
  }, [lang]);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  return { recognizing, transcript, error, start, stop };
}
