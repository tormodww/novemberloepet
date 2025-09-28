const assert = require('assert');
const { computeBackoff, nextAttemptAt, shouldAttempt } = require('../src/lib/opQueue');

// Test computeBackoff values (expected caps at 60000)
const expected = [2000, 4000, 8000, 16000, 32000, 60000, 60000];
for (let i = 1; i <= expected.length; i++) {
  const got = computeBackoff(i);
  assert.strictEqual(got, expected[i-1], `Backoff attempt ${i} expected ${expected[i-1]} got ${got}`);
}

// nextAttemptAt should be in the future
const na = nextAttemptAt(1);
assert.ok(na > Date.now(), 'nextAttemptAt should schedule in the future');

// shouldAttempt
assert.strictEqual(shouldAttempt({ nextAttemptAt: Date.now() - 1000 }), true, 'past nextAttemptAt should be attemptable');
assert.strictEqual(shouldAttempt({ nextAttemptAt: Date.now() + 10000 }), false, 'future nextAttemptAt should not be attemptable');

console.log('All opQueue tests passed');
