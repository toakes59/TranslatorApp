import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  LANGUAGE_LABELS,
  LANGUAGE_NAMES,
  translationService,
  type LangCode,
} from '@/services/translation';

const LANGUAGES: LangCode[] = ['ja', 'en'];

export default function SettingsScreen() {
  const [downloaded, setDownloaded] = useState<Record<LangCode, boolean>>({
    ja: false,
    en: false,
  });
  const [busy, setBusy] = useState<LangCode | null>(null);

  const refresh = useCallback(async () => {
    const entries = await Promise.all(
      LANGUAGES.map(async (lang) => [lang, await translationService.isModelDownloaded(lang)] as const)
    );
    setDownloaded(Object.fromEntries(entries) as Record<LangCode, boolean>);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleDownload = async (lang: LangCode) => {
    setBusy(lang);
    try {
      await translationService.downloadModel(lang);
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (lang: LangCode) => {
    setBusy(lang);
    try {
      await translationService.deleteModel(lang);
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.title}>
          Settings
        </ThemedText>

        <ThemedText type="small" themeColor="textSecondary">
          Translation runs entirely on your device. Download each language's model once (needs
          internet) so translation keeps working offline, e.g. while traveling in Japan.
        </ThemedText>

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold">Offline translation models</ThemedText>

          {LANGUAGES.map((lang) => (
            <ThemedView key={lang} type="backgroundElement" style={styles.row}>
              <ThemedView style={styles.rowText}>
                <ThemedText type="default">{LANGUAGE_LABELS[lang]}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {LANGUAGE_NAMES[lang]} · {downloaded[lang] ? 'Downloaded' : 'Not downloaded'}
                </ThemedText>
              </ThemedView>

              <Pressable
                disabled={busy === lang}
                onPress={() => (downloaded[lang] ? handleDelete(lang) : handleDownload(lang))}
                style={({ pressed }) => [
                  styles.actionButton,
                  downloaded[lang] ? styles.deleteButton : styles.downloadButton,
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" themeColor="background">
                  {busy === lang ? '…' : downloaded[lang] ? 'Delete' : 'Download'}
                </ThemedText>
              </Pressable>
            </ThemedView>
          ))}
        </ThemedView>
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
  section: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowText: {
    gap: 2,
  },
  actionButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  downloadButton: {
    backgroundColor: '#3c87f7',
  },
  deleteButton: {
    backgroundColor: '#E0453C',
  },
  pressed: {
    opacity: 0.7,
  },
});
