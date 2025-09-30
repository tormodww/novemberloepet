import { test, expect } from 'vitest';
import { computeBackoff, nextAttemptAt, shouldAttempt } from '../src/lib/opQueue';

test('opQueue computeBackoff/nextAttemptAt/shouldAttempt behavior', () => {
  // Test computeBackoff values (expected caps at 60000)
  const expected = [2000, 4000, 8000, 16000, 32000, 60000, 60000];
  for (let i = 1; i <= expected.length; i++) {
    const got = computeBackoff(i);
    expect(got).toBe(expected[i - 1]);
  }

  // nextAttemptAt should be in the future
  const na = nextAttemptAt(1);
  expect(na).toBeGreaterThan(Date.now());

  // shouldAttempt
  expect(shouldAttempt({ nextAttemptAt: Date.now() - 1000 })).toBe(true);
  expect(shouldAttempt({ nextAttemptAt: Date.now() + 10000 })).toBe(false);
});