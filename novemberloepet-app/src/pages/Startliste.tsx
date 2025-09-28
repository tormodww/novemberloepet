import React, { useState } from 'react';
import { useDeltagerContext } from '../context/DeltagerContext';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Checkbox, Button, Stack, Chip, TextField, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, MenuItem } from '@mui/material';

// Felter som kan sorteres på
const sortableFields = [
  { id: 'startnummer', label: 'Nr' },
  { id: 'navn', label: 'Navn' },
  { id: 'klasse', label: 'Klasse' },
  { id: 'sykkel', label: 'Sykkel' },
  { id: 'starttid', label: 'Starttid' },
] as const;
type SortField = typeof sortableFields[number]['id'];

type SortOrder = 'asc' | 'desc';

function buildStartbekreftelseHTML(deltagere: any[]) {
  const rows = deltagere.map(d => {
    return `
      <div style="page-break-inside: avoid; margin:20px; font-family: Arial, sans-serif;">
        <h2>Startbekreftelse - Novemberløpet 2025</h2>
        <p><b>Startnummer:</b> ${d.startnummer}</p>
        <p><b>Navn:</b> ${d.navn}</p>
        <p><b>Adresse/Poststed:</b> ${d.poststed || ''}</p>
        <p><b>Sykkel:</b> ${d.sykkel} (${d.modell})</p>
        <p><b>Klasse:</b> ${d.klasse}</p>
        <p><b>Starttid:</b> ${d.starttid}</p>
        <hr/>
        <p>Jeg deltar i løpet på eget ansvar, og vil ikke kreve erstatningsansvar mot arrangør eller grunneiere ved evt. skade.</p>
        <p>Dato: 2025-09-28</p>
        <p>Signatur: _________________________</p>
      </div>
    `;
  }).join('\n');

  const css = `
    <style>
      @media print { .no-print { display:none } }
      body { font-family: Arial, sans-serif; margin: 20px }
      h2 { margin-bottom: 8px }
    </style>
  `;

  return `<!doctype html><html><head><meta charset="utf-8"/><title>Startbekreftelser</title>${css}</head><body>${rows}</body></html>`;
}

const Startliste: React.FC = () => {
  const { deltagere, setMultipleDeltagerStatus } = useDeltagerContext();
  const [sortField, setSortField] = useState<SortField>('startnummer');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [klasseFilter, setKlasseFilter] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'DNS' | 'DNF' | null>(null);

  // derive available classes for filter
  const uniqueKlasser = Array.from(new Set(deltagere.map(d => d.klasse))).filter(Boolean);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggle = (startnummer: string) => {
    setSelected(prev => prev.includes(startnummer) ? prev.filter(s => s !== startnummer) : [...prev, startnummer]);
  };
  const selectAll = () => setSelected(deltagere.map(d => d.startnummer));
  const clearAll = () => setSelected([]);

  const sorted = [...deltagere].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    // Numerisk sortering for startnummer
    if (sortField === 'startnummer') {
      aVal = parseInt(aVal as string, 10);
      bVal = parseInt(bVal as string, 10);
      if (isNaN(aVal as number) || isNaN(bVal as number)) return 0;
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    }
    // Ellers tekstsortering
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal, 'nb')
        : bVal.localeCompare(aVal, 'nb');
    }
    return 0;
  });

  const filtered = sorted.filter(d => {
    const q = query.trim().toLowerCase();
    if (q) {
      if (!d.navn.toLowerCase().includes(q)) return false;
    }
    if (klasseFilter) {
      if (d.klasse !== klasseFilter) return false;
    }
    return true;
  });

  const handlePrint = () => {
    const chosen = deltagere.filter(d => selected.includes(d.startnummer));
    if (chosen.length === 0) return alert('Velg én eller flere deltagere først');
    const html = buildStartbekreftelseHTML(chosen);
    const w = window.open('', '_blank');
    if (!w) return alert('Kunne ikke åpne nytt vindu. Sjekk popup-blokkering.');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 300);
  };

  const setSelectedStatus = (status: 'DNS' | 'DNF') => {
    if (selected.length === 0) return alert('Velg én eller flere deltagere først');
    setMultipleDeltagerStatus(selected, status);
    // clear selection after setting status
    setSelected([]);
  };

  const handleStatusInitiate = (status: 'DNS' | 'DNF') => {
    if (selected.length === 0) return alert('Velg én eller flere deltagere først');
    setConfirmAction(status);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!confirmAction) return setConfirmOpen(false);
    setMultipleDeltagerStatus(selected, confirmAction);
    setSelected([]);
    setConfirmOpen(false);
    setConfirmAction(null);
  };
  const handleCancelConfirm = () => {
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  const renderStatusChip = (status?: string) => {
    if (!status || status === 'NONE') return <Chip label="-" size="small" />;
    if (status === 'OK') return <Chip label="OK" color="success" size="small" />;
    if (status === 'DNS') return <Chip label="Startet ikke" color="warning" size="small" />;
    if (status === 'DNF') return <Chip label="Fullførte ikke" color="error" size="small" />;
    return <Chip label={status} size="small" />;
  };

  return (
    <Box maxWidth={1100} mx="auto">
      <Typography variant="h5" gutterBottom>Startliste</Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 1 }} alignItems="center">
        <TextField size="small" placeholder="Søk på navn" value={query} onChange={(e) => setQuery(e.target.value)} />
        <TextField select size="small" value={klasseFilter} onChange={(e) => setKlasseFilter(e.target.value)} sx={{ width: 180 }}>
          <MenuItem value="">Alle klasser</MenuItem>
          {uniqueKlasser.map(k => <MenuItem key={k} value={k}>{k}</MenuItem>)}
        </TextField>
        <Button variant="outlined" size="small" onClick={() => { setQuery(''); setKlasseFilter(''); }}>Nullstill filter</Button>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button variant="outlined" size="small" onClick={selectAll}>Velg alle</Button>
        <Button variant="outlined" size="small" onClick={clearAll}>Fjern valg</Button>
        <Button variant="contained" size="small" onClick={() => handleStatusInitiate('DNS')} disabled={selected.length===0} color="warning">Sett: Startet ikke</Button>
        <Button variant="contained" size="small" onClick={() => handleStatusInitiate('DNF')} disabled={selected.length===0} color="error">Sett: Fullførte ikke</Button>
        <Button variant="contained" size="small" onClick={handlePrint} disabled={selected.length===0}>Vis / Skriv ut startbekreftelse</Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              {sortableFields.map(col => (
                <TableCell key={col.id} sortDirection={sortField === col.id ? sortOrder : false}>
                  <TableSortLabel
                    active={sortField === col.id}
                    direction={sortField === col.id ? sortOrder : 'asc'}
                    onClick={() => handleSort(col.id)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d.startnummer} hover>
                <TableCell padding="checkbox"><Checkbox checked={selected.includes(d.startnummer)} onChange={() => toggle(d.startnummer)} /></TableCell>
                <TableCell>{d.startnummer}</TableCell>
                <TableCell>{d.navn}</TableCell>
                <TableCell>{d.klasse}</TableCell>
                <TableCell>{d.sykkel}</TableCell>
                <TableCell>{d.starttid}</TableCell>
                <TableCell>{renderStatusChip(d.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={confirmOpen} onClose={handleCancelConfirm}>
        <DialogTitle>Bekreft endring</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'DNS' ? 'Er du sikker på at du vil sette status "Startet ikke" for de valgte deltakerne?' : 'Er du sikker på at du vil sette status "Fullførte ikke" for de valgte deltakerne?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelConfirm}>Avbryt</Button>
          <Button onClick={handleConfirm} variant="contained" color="primary">Bekreft</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Startliste;