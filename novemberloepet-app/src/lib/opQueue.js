function computeBackoff(attempts) {
  const a = Math.max(1, attempts || 1);
  const backoff = 2000 * Math.pow(2, a - 1);
  return Math.min(60000, backoff);
}

function nextAttemptAt(attempts) {
  const ms = computeBackoff(attempts);
  return Date.now() + ms;
}

function shouldAttempt(op) {
  if (!op) return false;
  if (typeof op.nextAttemptAt !== 'number') return true;
  return op.nextAttemptAt <= Date.now();
}

module.exports = { computeBackoff, nextAttemptAt, shouldAttempt };
