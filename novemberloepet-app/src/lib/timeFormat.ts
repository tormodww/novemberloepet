// Common time formatting utilities
// Start time: expects 3-4 digits (hhmm) and returns hh:mm; returns null if not enough digits
export function formatManualStart(raw: string): string | null {
  const digits = raw.replace(/\D/g, '').slice(0,4);
  if (digits.length < 3) return null; // too short to build hh:mm
  const padded = digits.padStart(4,'0');
  return `${padded.slice(0,2)}:${padded.slice(2,4)}`;
}

// Finish time: accepts 3-6 digits.
// 3-4 => mmss -> mm:ss (pad left to 4)
// 5-6 => hhmmss -> hh:mm:ss (pad left to 6)
export function formatManualFinish(raw: string): string | null {
  const digits = raw.replace(/\D/g, '').slice(0,6);
  if (digits.length < 3) return null;
  if (digits.length <= 4) {
    const padded = digits.padStart(4,'0');
    return `${padded.slice(0,2)}:${padded.slice(2,4)}`; // mm:ss
  }
  const padded = digits.padStart(6,'0');
  return `${padded.slice(0,2)}:${padded.slice(2,4)}:${padded.slice(4,6)}`; // hh:mm:ss
}

export function fmtTime(ts?: number | null): string {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleTimeString();
}