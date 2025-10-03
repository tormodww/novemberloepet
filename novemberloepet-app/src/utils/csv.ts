export function parseCsv(text: string): Array<Record<string, string> & { __line?: number }> {
  const rows: string[][] = [];
  const lineNums: number[] = [];
  let current: string[] = [''];
  let i = 0;
  let inQuotes = false;
  let field = '';
  let line = 1; // track current line number (1-based)

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          // escaped quote
          field += '"';
          i += 2;
          continue;
        }
        // end quotes
        inQuotes = false;
        i++;
        continue;
      }
      // inside quotes -> append
      field += ch;
      i++;
      continue;
    }

    // not in quotes
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ',') {
      current.push(field);
      field = '';
      i++;
      continue;
    }

    if (ch === '\r') { i++; continue; }

    if (ch === '\n') {
      current.push(field);
      rows.push(current);
      lineNums.push(line);
      line++;
      current = [''];
      field = '';
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  // push last
  current.push(field);
  // if last row isn't just an empty trailing row
  if (current.length !== 1 || current[0] !== '') {
    rows.push(current);
    lineNums.push(line);
  }

  if (rows.length === 0) return [];

  const header = rows[0].map(h => h.trim());
  const records: Array<Record<string, string> & { __line?: number }> = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    // skip completely empty rows
    if (row.every(cell => (cell || '').trim() === '')) continue;
    const rec: Record<string, string> & { __line?: number } = {};
    for (let c = 0; c < header.length; c++) {
      const key = header[c] ?? `col${c}`;
      rec[key] = (row[c] ?? '').trim();
    }
    // associate original CSV line number for this data row
    rec.__line = lineNums[r] ?? (r + 1);
    records.push(rec);
  }
  return records;
}