import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageToggle } from '@/components/language-toggle';
import { SpeakButton } from '@/components/speak-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { speak } from '@/services/speech';
import { useSpeechToText } from '@/services/stt';
import {
  TranslationModelNotDownloadedError,
  TranslationUnavailableError,
  translationService,
  type LangCode,
} from '@/services/translation';

export default function SpeakScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [source, setSource] = useState<LangCode>('ja');
  const target: LangCode = source === 'ja' ? 'en' : 'ja';
  const { recognizing, transcript, error: sttError, start, stop } = useSpeechToText(source);
  const [translatedText, setTranslatedText] = useState('');
  const [status, setStatus] = useState<'idle' | 'translating' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const wasRecognizing = useRef(false);

  useEffect(() => {
    if (wasRecognizing.current && !recognizing && transcript.trim()) {
      translateAndSpeak(transcript);
    }
    wasRecognizing.current = recognizing;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognizing]);

  const translateAndSpeak = async (text: string) => {
    setStatus('translating');
    setErrorMessage('');
    setTranslatedText('');
    try {
      const result = await translationService.translate(text, source, target);
      setTranslatedText(result);
      setStatus('idle');
      speak(result, target);
    } catch (err) {
      setStatus('error');
      if (err instanceof TranslationModelNotDownloadedError) {
        setErrorMessage(
          `${err.message} Download it from the Settings tab to translate offline.`
        );
      } else if (err instanceof TranslationUnavailableError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Translation failed. Please try again.');
      }
    }
  };

  const handleSwap = () => {
    setSource(target);
    setTranslatedText('');
    setStatus('idle');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.title}>
          Speak
        </ThemedText>

        <LanguageToggle source={source} target={target} onSwap={handleSwap} />

        <ThemedView style={styles.micArea}>
          <Pressable
            onPress={recognizing ? stop : start}
            style={({ pressed }) => [
              styles.micButton,
              { backgroundColor: recognizing ? '#E0453C' : theme.text },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="title" themeColor="background" style={styles.micIcon}>
              🎤
            </ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary">
            {recognizing ? 'Listening… tap to stop' : 'Tap to speak'}
          </ThemedText>
        </ThemedView>

        {transcript ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="default">{transcript}</ThemedText>
            <SpeakButton text={transcript} lang={source} />
          </ThemedView>
        ) : null}

        {sttError ? (
          <ThemedText type="small" themeColor="textSecondary">
            {sttError}
          </ThemedText>
        ) : null}

        {status === 'translating' ? (
          <ThemedText type="small" themeColor="textSecondary">
            Translating…
          </ThemedText>
        ) : null}

        {status === 'error' ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small" themeColor="textSecondary">
              {errorMessage}
            </ThemedText>
            <Pressable onPress={() => router.push('/settings')}>
              <ThemedText type="linkPrimary">Go to Settings</ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}

        {translatedText && status !== 'error' ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="default">{translatedText}</ThemedText>
            <SpeakButton text={translatedText} lang={target} />
          </ThemedView>
        ) : null}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  micArea: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: {
    fontSize: 36,
  },
  pressed: {
    opacity: 0.8,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});
