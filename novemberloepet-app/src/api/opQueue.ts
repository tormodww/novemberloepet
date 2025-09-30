// Re-export CommonJS implementation to avoid duplication between src/lib and src/api.
// This keeps the single source-of-truth in src/lib/opQueue.js (used by node scripts),
// while still allowing `import { computeBackoff } from '../api/opQueue'` in TS code.

import * as opQueue from '../lib/opQueue';

export const computeBackoff = (opQueue as any).computeBackoff as (attempts: number) => number;
export const nextAttemptAt = (opQueue as any).nextAttemptAt as (attempts: number) => number;
export const shouldAttempt = (opQueue as any).shouldAttempt as (op: any) => boolean;