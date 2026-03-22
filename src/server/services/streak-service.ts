/**
 * Streak engine — pure functions for streak calculation.
 * Rule: ≥1 meal entry logged on a day = streak day.
 * No mocks needed for testing — all pure functions.
 */

/**
 * Build a Set from an array of ISO date strings (deduplicates).
 */
export function buildDateSet(dates: string[]): Set<string> {
  return new Set(dates);
}

/**
 * Get today's date as ISO string (YYYY-MM-DD).
 */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get yesterday's date as ISO string.
 */
function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Add/subtract days from an ISO date string.
 */
function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Calculate the current streak from an array of logged dates.
 * "Current" = consecutive days ending today or yesterday (today not logged yet is fine).
 * Streak breaks if no meal logged on a day.
 *
 * @param dates - Array of ISO date strings (YYYY-MM-DD), may have duplicates
 * @returns Current streak count (0 if no active streak)
 */
export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const dateSet = buildDateSet(dates);
  const today = todayStr();
  const yesterday = yesterdayStr();

  // Start anchor: today if logged today, yesterday otherwise
  let anchor: string;
  if (dateSet.has(today)) {
    anchor = today;
  } else if (dateSet.has(yesterday)) {
    anchor = yesterday;
  } else {
    return 0; // No active streak
  }

  let streak = 1;
  let current = anchor;

  while (true) {
    const prev = offsetDate(current, -1);
    if (dateSet.has(prev)) {
      streak++;
      current = prev;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get the current streak for a user from an array of logged dates.
 * Same as calculateStreak — exported as named alias for clarity.
 */
export function getCurrentStreak(dates: string[]): number {
  return calculateStreak(dates);
}

/**
 * Find the longest streak ever in an array of logged dates.
 *
 * @param dates - Array of ISO date strings, may have duplicates
 * @returns Longest consecutive streak found
 */
export function getLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const dateSet = buildDateSet(dates);
  const sortedDates = Array.from(dateSet).sort();

  let longest = 0;
  let current = 0;
  let prev: string | null = null;

  for (const dateStr of sortedDates) {
    if (prev === null) {
      current = 1;
    } else {
      const expectedNext = offsetDate(prev, 1);
      if (dateStr === expectedNext) {
        current++;
      } else {
        longest = Math.max(longest, current);
        current = 1;
      }
    }
    prev = dateStr;
  }

  return Math.max(longest, current);
}
