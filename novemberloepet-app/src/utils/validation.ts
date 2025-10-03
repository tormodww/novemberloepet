/**
 * Validates and formats a manual finish time.
 * @param raw - The raw input string for the finish time.
 * @returns The formatted finish time as a string in the format "hh:mm:ss", or null if the input is invalid.
 */
export function formatManualFinish(raw: string): string | null {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length < 3) return null; // input too short
  if (digits.length <= 4) { // mmss
    const padded = digits.padStart(4, '0');
    return `${padded.slice(0,2)}:${padded.slice(2,4)}`; // mm:ss
  }
  // 5 or 6 digits => hh:mm:ss
  const padded = digits.padStart(6, '0');
  return `${padded.slice(0,2)}:${padded.slice(2,4)}:${padded.slice(4,6)}`;
}

/**
 * Registers the finish time for a manual entry.
 * @param rawTime - The raw input string for the finish time.
 * @returns The registered finish time as a string in the format "hh:mm:ss", or an error message if the input is invalid.
 */
export function registerManualFinishTime(rawTime: string): string {
  const formattedTime = formatManualFinish(rawTime);
  if (!formattedTime) {
    return 'Invalid time format. Please use hh:mm:ss';
  }
  // Assuming there's a function to save the time
  // saveTime(formattedTime);
  return `Finish time registered: ${formattedTime}`;
}

/**
 * Validates an email address format without using RegExp.
 * Basic validation: must contain exactly one '@', non-empty local part,
 * domain contains at least one '.', and top-level domain has length >= 2.
 */
export function validateEmail(email: string): boolean {
  const trimmed = (email || '').trim();
  if (!trimmed) return false;
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) return false; // no @ or empty local part
  // ensure there's only one '@'
  if (trimmed.indexOf('@', atIndex + 1) !== -1) return false;
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  if (!local || !domain) return false;
  const dotIndex = domain.indexOf('.');
  if (dotIndex <= 0) return false; // no dot or dot is first char
  const lastDot = domain.lastIndexOf('.');
  const tld = domain.slice(lastDot + 1);
  if (!tld || tld.length < 2) return false;
  return true;
}

/**
 * Validates a Norwegian phone number without using RegExp.
 * Acceptable forms:
 *  - 8 digits: e.g. "22334455"
 *  - with country prefix +47 or 0047: "+4722334455" or "004722334455"
 * Spaces, dashes and parentheses are ignored.
 */
export function validateTelefon(telefon: string): boolean {
  if (!telefon) return false;
  // remove common separators (space, dash, parentheses) without regex
  let s = telefon.split(' ').join('');
  s = s.split('-').join('');
  s = s.split('(').join('').split(')').join('');

  // handle international prefix
  let normalized = s;
  if (normalized.startsWith('+')) {
    normalized = normalized.slice(1);
  } else if (normalized.startsWith('00')) {
    normalized = normalized.slice(2);
  }

  // All remaining characters must be digits
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charAt(i);
    if (ch < '0' || ch > '9') return false;
  }

  // If starts with country code '47', strip it for local-length check
  let digits = normalized;
  if (digits.startsWith('47')) digits = digits.slice(2);

  // Valid Norwegian local numbers are 8 digits
  return digits.length === 8;
}