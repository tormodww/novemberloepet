import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useEphemeralMessage
 * Enkel hook for å vise en midlertidig bekreftelses-/statusmelding som automatisk forsvinner.
 * @param ttlMs Hvor lenge meldingen skal vises (default 4000ms)
 */
export function useEphemeralMessage(ttlMs: number = 4000) {
  const [message, setMessage] = useState('');
  const timerRef = useRef<number | null>(null);

  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setMessage('');
      timerRef.current = null;
    }, ttlMs);
  }, [ttlMs]);

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  return { message, showMessage, clear: () => setMessage('') } as const;
}
