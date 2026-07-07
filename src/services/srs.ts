/** Simple 5-box Leitner system. Box 1 = just missed/new, Box 5 = well-known. */

export const MAX_BOX = 5;
export const MIN_BOX = 1;

const BOX_INTERVAL_DAYS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 9,
  5: 20,
};

export function nextBox(currentBox: number, correct: boolean): number {
  if (correct) {
    return Math.min(currentBox + 1, MAX_BOX);
  }
  return MIN_BOX;
}

export function nextReviewAt(box: number, now: number = Date.now()): number {
  const days = BOX_INTERVAL_DAYS[box] ?? BOX_INTERVAL_DAYS[MIN_BOX];
  return now + days * 24 * 60 * 60 * 1000;
}

export function reviewWord(currentBox: number, correct: boolean, now: number = Date.now()) {
  const box = nextBox(currentBox, correct);
  return { box, nextReviewAt: nextReviewAt(box, now) };
}
