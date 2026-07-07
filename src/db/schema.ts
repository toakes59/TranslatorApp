import * as SQLite from 'expo-sqlite';

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export const JLPT_LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
export const CUSTOM_LEVEL = 'CUSTOM';

const SEED_FILES: Record<JlptLevel, { expression: string; reading: string; meaning: string }[]> = {
  N5: require('./seed/jlpt-n5.json'),
  N4: require('./seed/jlpt-n4.json'),
  N3: require('./seed/jlpt-n3.json'),
  N2: require('./seed/jlpt-n2.json'),
  N1: require('./seed/jlpt-n1.json'),
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = initDb();
  }
  return dbPromise;
}

async function initDb(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('translatorapp.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expression TEXT NOT NULL,
      reading TEXT NOT NULL,
      meaning TEXT NOT NULL,
      level TEXT NOT NULL,
      box INTEGER NOT NULL DEFAULT 1,
      next_review_at INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_words_level ON words(level);
    CREATE INDEX IF NOT EXISTS idx_words_next_review ON words(next_review_at);
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  const seeded = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    ['seeded_jlpt_v1']
  );

  if (!seeded) {
    await seedJlptWords(db);
    await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
      'seeded_jlpt_v1',
      'true',
    ]);
  }

  return db;
}

async function seedJlptWords(db: SQLite.SQLiteDatabase) {
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    const statement = await db.prepareAsync(
      `INSERT INTO words (expression, reading, meaning, level, box, next_review_at, created_at)
       VALUES ($expression, $reading, $meaning, $level, 1, $now, $now)`
    );
    try {
      for (const level of JLPT_LEVELS) {
        for (const word of SEED_FILES[level]) {
          await statement.executeAsync({
            $expression: word.expression,
            $reading: word.reading,
            $meaning: word.meaning,
            $level: level,
            $now: now,
          });
        }
      }
    } finally {
      await statement.finalizeAsync();
    }
  });
}
