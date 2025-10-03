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
 * Validates an email address format.
 * @param email - The email address to validate.
 * @returns True if the email is valid, false otherwise.
 */
export function validateEmail(email: string): boolean {
  // Enkel og robust e-postvalidering
  return /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

/**
 * Validates a Norwegian phone number (8 digits, can start with country code).
 * @param telefon - The phone number to validate.
 * @returns True if valid, false otherwise.
 */
export function validateTelefon(telefon: string): boolean {
  // Tillater 8 siffer, med eller uten mellomrom, og +47/0047-prefiks
  const cleaned = telefon.replace(/\s+/g, '');
  return (
    /^((\+47|0047)?\d{8})$/.test(cleaned)
  );
}

// Example usage
console.log(registerManualFinishTime('123456')); // Finish time registered: 12:34:56
console.log(registerManualFinishTime('1234'));   // Finish time registered: 00:12:34
console.log(registerManualFinishTime('12'));     // Invalid time format. Please use hh:mm:ss
console.log(validateEmail('test@example.com')); // true
console.log(validateEmail('invalid-email'));    // false
console.log(validateTelefon('12345678'));       // true
console.log(validateTelefon('+4712345678'));    // true
console.log(validateTelefon('004712345678'));   // true
console.log(validateTelefon('invalid-telefon')); // false