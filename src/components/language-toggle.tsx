import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { LANGUAGE_LABELS, type LangCode } from '@/services/translation';

export function LanguageToggle({
  source,
  target,
  onSwap,
}: {
  source: LangCode;
  target: LangCode;
  onSwap: () => void;
}) {
  return (
    <Pressable onPress={onSwap} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <ThemedText type="smallBold">{LANGUAGE_LABELS[source]}</ThemedText>
        <ThemedText type="small">⇄</ThemedText>
        <ThemedText type="smallBold">{LANGUAGE_LABELS[target]}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    alignSelf: 'center',
  },
});
