import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { speak } from '@/services/speech';
import type { LangCode } from '@/services/translation';

export function SpeakButton({ text, lang }: { text: string; lang: LangCode }) {
  if (!text) return null;
  return (
    <Pressable
      onPress={() => speak(text, lang)}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      hitSlop={8}>
      <ThemedText type="default">🔊</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
  pressed: {
    opacity: 0.5,
  },
});
