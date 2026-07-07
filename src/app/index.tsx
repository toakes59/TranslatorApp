import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageToggle } from '@/components/language-toggle';
import { SpeakButton } from '@/components/speak-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  TranslationModelNotDownloadedError,
  TranslationUnavailableError,
  translationService,
  type LangCode,
} from '@/services/translation';

export default function TranslateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [source, setSource] = useState<LangCode>('ja');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [status, setStatus] = useState<'idle' | 'translating' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const target: LangCode = source === 'ja' ? 'en' : 'ja';

  const handleSwap = () => {
    setSource(target);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setStatus('translating');
    setErrorMessage('');
    try {
      const result = await translationService.translate(inputText, source, target);
      setTranslatedText(result);
      setStatus('idle');
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.title}>
          Translate
        </ThemedText>

        <LanguageToggle source={source} target={target} onSwap={handleSwap} />

        <ThemedView type="backgroundElement" style={styles.card}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Type text to translate…"
            placeholderTextColor={theme.textSecondary}
            multiline
            value={inputText}
            onChangeText={setInputText}
          />
          <SpeakButton text={inputText} lang={source} />
        </ThemedView>

        <Pressable
          onPress={handleTranslate}
          disabled={status === 'translating'}
          style={({ pressed }) => [
            styles.translateButton,
            { backgroundColor: theme.text },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" themeColor="background">
            {status === 'translating' ? 'Translating…' : 'Translate'}
          </ThemedText>
        </Pressable>

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
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 80,
  },
  translateButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
