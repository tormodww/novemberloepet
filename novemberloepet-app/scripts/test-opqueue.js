const { computeBackoff, nextAttemptAt, shouldAttempt } = require('../src/lib/opQueue');

console.log('computeBackoff for attempts 1..8:');
for (let i = 1; i <= 8; i++) {
  console.log(`attempts=${i}, backoffMs=${computeBackoff(i)}`);
}

console.log('\nnextAttemptAt examples:');
console.log('now:', new Date().toLocaleTimeString());
console.log('nextAttemptAt for attempts=1:', new Date(nextAttemptAt(1)).toLocaleTimeString());
console.log('nextAttemptAt for attempts=4:', new Date(nextAttemptAt(4)).toLocaleTimeString());

console.log('\nshouldAttempt behavior:');
const op1 = { nextAttemptAt: Date.now() - 1000 };
const op2 = { nextAttemptAt: Date.now() + 60000 };
console.log('op1 (past) ->', shouldAttempt(op1));
console.log('op2 (future) ->', shouldAttempt(op2));
