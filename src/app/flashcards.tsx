import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { SpeakButton } from '@/components/speak-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { CUSTOM_LEVEL } from '@/db/schema';
import {
  addCustomWord,
  getDeckSummaries,
  getDueWords,
  recordReview,
  type DeckSummary,
  type WordRow,
} from '@/db/words';
import { useTheme } from '@/hooks/use-theme';

type Mode = { kind: 'list' } | { kind: 'review'; level: string } | { kind: 'add' };

export default function FlashcardsScreen() {
  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const [decks, setDecks] = useState<DeckSummary[]>([]);

  const loadDecks = useCallback(() => {
    getDeckSummaries().then(setDecks);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDecks();
    }, [loadDecks])
  );

  if (mode.kind === 'review') {
    return (
      <ReviewSession level={mode.level} onDone={() => setMode({ kind: 'list' })} />
    );
  }

  if (mode.kind === 'add') {
    return (
      <AddWordForm
        onDone={() => {
          setMode({ kind: 'list' });
          loadDecks();
        }}
      />
    );
  }

  return (
    <DeckList
      decks={decks}
      onSelectDeck={(level) => setMode({ kind: 'review', level })}
      onAddWord={() => setMode({ kind: 'add' })}
    />
  );
}

function DeckList({
  decks,
  onSelectDeck,
  onAddWord,
}: {
  decks: DeckSummary[];
  onSelectDeck: (level: string) => void;
  onAddWord: () => void;
}) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.title}>
          Flashcards
        </ThemedText>

        <FlatList
          data={decks}
          keyExtractor={(item) => item.level}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelectDeck(item.level)}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.deckRow}>
                <ThemedText type="default">
                  {item.level === CUSTOM_LEVEL ? 'My Words' : item.level}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.due} due / {item.total} total
                </ThemedText>
              </ThemedView>
            </Pressable>
          )}
        />

        <Pressable
          onPress={onAddWord}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold" themeColor="background">
            + Add word
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

function ReviewSession({ level, onDone }: { level: string; onDone: () => void }) {
  const [queue, setQueue] = useState<WordRow[] | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getDueWords(level).then(setQueue);
    }, [level])
  );

  const current = queue?.[0];

  const handleAnswer = async (correct: boolean) => {
    if (!current) return;
    await recordReview(current.id, correct);
    setShowAnswer(false);
    setQueue((prev) => (prev ? prev.slice(1) : prev));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={onDone}>
          <ThemedText type="link">‹ Decks</ThemedText>
        </Pressable>

        {queue === null ? (
          <ThemedText type="small" themeColor="textSecondary">
            Loading…
          </ThemedText>
        ) : !current ? (
          <ThemedView style={styles.centered}>
            <ThemedText type="default">All caught up on this deck 🎉</ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.centered}>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="title" style={styles.expression}>
                {current.expression}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {current.reading}
              </ThemedText>
              <SpeakButton text={current.expression} lang="ja" />

              {showAnswer ? (
                <ThemedText type="default" style={styles.meaning}>
                  {current.meaning}
                </ThemedText>
              ) : null}
            </ThemedView>

            {!showAnswer ? (
              <Pressable
                onPress={() => setShowAnswer(true)}
                style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                <ThemedText type="smallBold" themeColor="background">
                  Show answer
                </ThemedText>
              </Pressable>
            ) : (
              <ThemedView style={styles.answerRow}>
                <Pressable
                  onPress={() => handleAnswer(false)}
                  style={({ pressed }) => [
                    styles.answerButton,
                    styles.missedButton,
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" themeColor="background">
                    Missed it
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => handleAnswer(true)}
                  style={({ pressed }) => [
                    styles.answerButton,
                    styles.gotItButton,
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" themeColor="background">
                    Got it
                  </ThemedText>
                </Pressable>
              </ThemedView>
            )}
          </ThemedView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function AddWordForm({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const [expression, setExpression] = useState('');
  const [reading, setReading] = useState('');
  const [meaning, setMeaning] = useState('');

  const handleSave = async () => {
    if (!expression.trim() || !meaning.trim()) return;
    await addCustomWord(expression.trim(), reading.trim(), meaning.trim());
    onDone();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={onDone}>
          <ThemedText type="link">‹ Decks</ThemedText>
        </Pressable>

        <ThemedText type="subtitle" style={styles.title}>
          Add word
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.formCard}>
          <TextInput
            style={[styles.formInput, { color: theme.text }]}
            placeholder="Japanese (e.g. 電車)"
            placeholderTextColor={theme.textSecondary}
            value={expression}
            onChangeText={setExpression}
          />
          <TextInput
            style={[styles.formInput, { color: theme.text }]}
            placeholder="Reading (e.g. でんしゃ)"
            placeholderTextColor={theme.textSecondary}
            value={reading}
            onChangeText={setReading}
          />
          <TextInput
            style={[styles.formInput, { color: theme.text }]}
            placeholder="Meaning (e.g. train)"
            placeholderTextColor={theme.textSecondary}
            value={meaning}
            onChangeText={setMeaning}
          />
        </ThemedView>

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold" themeColor="background">
            Save
          </ThemedText>
        </Pressable>
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
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  listContent: {
    gap: Spacing.two,
  },
  deckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  addButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    backgroundColor: '#3c87f7',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
    minWidth: 240,
  },
  expression: {
    textAlign: 'center',
  },
  meaning: {
    marginTop: Spacing.three,
    textAlign: 'center',
  },
  answerRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  answerButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  missedButton: {
    backgroundColor: '#E0453C',
  },
  gotItButton: {
    backgroundColor: '#3FA34D',
  },
  formCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  formInput: {
    fontSize: 16,
    lineHeight: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#88888855',
    paddingVertical: Spacing.two,
  },
});
