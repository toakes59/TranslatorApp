import { CUSTOM_LEVEL, JLPT_LEVELS, getDb } from '@/db/schema';
import { reviewWord } from '@/services/srs';

export interface WordRow {
  id: number;
  expression: string;
  reading: string;
  meaning: string;
  level: string;
  box: number;
  next_review_at: number;
  created_at: number;
}

export interface DeckSummary {
  level: string;
  total: number;
  due: number;
}

export async function getDeckSummaries(): Promise<DeckSummary[]> {
  const db = await getDb();
  const now = Date.now();
  const levels = [...JLPT_LEVELS, CUSTOM_LEVEL];
  const summaries: DeckSummary[] = [];
  for (const level of levels) {
    const totalRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM words WHERE level = ?',
      [level]
    );
    const dueRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM words WHERE level = ? AND next_review_at <= ?',
      [level, now]
    );
    summaries.push({
      level,
      total: totalRow?.count ?? 0,
      due: dueRow?.count ?? 0,
    });
  }
  return summaries;
}

export async function getDueWords(level: string, limit = 20): Promise<WordRow[]> {
  const db = await getDb();
  const now = Date.now();
  return db.getAllAsync<WordRow>(
    'SELECT * FROM words WHERE level = ? AND next_review_at <= ? ORDER BY next_review_at ASC LIMIT ?',
    [level, now, limit]
  );
}

export async function recordReview(id: number, correct: boolean): Promise<void> {
  const db = await getDb();
  const word = await db.getFirstAsync<WordRow>('SELECT * FROM words WHERE id = ?', [id]);
  if (!word) return;
  const { box, nextReviewAt } = reviewWord(word.box, correct);
  await db.runAsync('UPDATE words SET box = ?, next_review_at = ? WHERE id = ?', [
    box,
    nextReviewAt,
    id,
  ]);
}

export async function addCustomWord(
  expression: string,
  reading: string,
  meaning: string
): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO words (expression, reading, meaning, level, box, next_review_at, created_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    [expression, reading, meaning, CUSTOM_LEVEL, now, now]
  );
}

export async function getCustomWords(): Promise<WordRow[]> {
  const db = await getDb();
  return db.getAllAsync<WordRow>('SELECT * FROM words WHERE level = ? ORDER BY created_at DESC', [
    CUSTOM_LEVEL,
  ]);
}

export async function deleteWord(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM words WHERE id = ?', [id]);
}
