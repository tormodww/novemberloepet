// Type declarations for the CJS-backed opQueue module
// This file provides names so TypeScript recognizes the module shape.
export function computeBackoff(attempts: number): number;
export function nextAttemptAt(attempts: number): number;
export function shouldAttempt(op: any): boolean;
