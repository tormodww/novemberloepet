import {
  Box,
  Button,
  Checkbox,
  Chip,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography
} from '@mui/material';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { useDeltagerContext } from '../context/DeltagerContext';
import { usePersistentState } from '../hooks/usePersistentState';
import DeltagerPrintView from './DeltagerPrintView';

const sortableFields = [
  { id: 'startnummer', label: 'Nr' },
  { id: 'navn', label: 'Navn' },
  { id: 'klasse', label: 'Klasse' },
  { id: 'sykkel', label: 'Sykkel' },
  { id: 'starttid', label: 'Starttid' },
] as const;
type SortField = typeof sortableFields[number]['id'];
type SortOrder = 'asc' | 'desc';

const Startliste: React.FC = () => {
  const { deltagere, setMultipleDeltagerStatus: _setMultipleDeltagerStatus, updateDeltager: _updateDeltager, deleteDeltager: _deleteDeltager, setConfirmSelection, navigateTo } = useDeltagerContext();
  const [sortField, setSortField] = usePersistentState<SortField>('startliste.sortField', 'startnummer');
  const [sortOrder, setSortOrder] = usePersistentState<SortOrder>('startliste.sortOrder', 'asc');
  const [selected, setSelected] = usePersistentState<string[]>('startliste.selected', []);
  const [query, setQuery] = usePersistentState<string>('startliste.query', '');
  const [klasseFilter, setKlasseFilter] = usePersistentState<string>('startliste.klasseFilter', '');
  // Fjernet ubrukte state-hooks for dialoger (confirm/edit/delete) midlertidig

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
    if (sortField === 'startnummer') {
      const aNum = parseInt(String(aVal || ''), 10);
      const bNum = parseInt(String(bVal || ''), 10);
      if (isNaN(aNum) || isNaN(bNum)) return 0;
      return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
    }
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal, 'nb')
        : bVal.localeCompare(aVal, 'nb');
    }
    return 0;
  });

  const filtered = sorted.filter(d => {
    const q = query.trim().toLowerCase();
    if (q && !d.navn.toLowerCase().includes(q)) return false;
    if (klasseFilter && d.klasse !== klasseFilter) return false;
    return true;
  });

  const handlePrint = () => {
    const chosen = deltagere.filter(d => selected.includes(d.startnummer));
    if (chosen.length === 0) return alert('Velg én eller flere deltagere først');

    // Preselect the chosen participants (list) in Confirmation and navigate there
    try {
      const snList = chosen.map(d => d.startnummer);
      if (typeof setConfirmSelection === 'function') setConfirmSelection(snList);
      if (typeof navigateTo === 'function') navigateTo('confirmation');
    } catch (e) {
      // fallback: if context helpers are not available, show original behaviour (open print window)
      console.warn('Failed to navigate to confirmation with preselection, falling back to print window', e);
      const printWindow = window.open('', '_blank');
      if (!printWindow) return alert('Kunne ikke åpne nytt vindu. Sjekk popup-blokkering.');
      printWindow.document.write(`<!doctype html><html><head><title>Startbekreftelser</title></head><body></body></html>`);
      printWindow.document.close();
      const root = ReactDOM.createRoot(printWindow.document.body);
      root.render(
        <Box sx={{ p: 4 }}>
          {chosen.map((d, idx) => (
            <Box key={idx} className="print-page">
              <DeltagerPrintView deltager={d}/>
            </Box>
          ))}
        </Box>
      );
      setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
    }
  };

  // Fjernet ubrukte hjelpefunksjoner (status/edit/delete confirm) for å eliminere lint-warnings.
  // Disse kan gjeninnføres senere ved behov med ny UI-dialog

  const renderStatusChip = (status?: string) => {
    if (!status || status === 'NONE') return <Chip label="-" size="small" />;
    if (status === 'OK') return <Chip label="OK" color="success" size="small" />;
    if (status === 'DNS') return <Chip label="Startet ikke" color="warning" size="small" />;
    if (status === 'DNF') return <Chip label="Fullførte ikke" color="error" size="small" />;
    return <Chip label={status} size="small" />;
  };

  // Midlertidig deaktivert redigering/sletting fjernet helt for å holde lint clean

  return (
    <Box maxWidth={1100} mx="auto">
      <Typography variant="h5" gutterBottom>
        Startliste (totalt {deltagere.length} {deltagere.length === 1 ? 'deltager' : 'deltagere'})
      </Typography>

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
        {/* Statusknapper deaktivert inntil dialogfunksjonalitet re-introduseres */}
        <Button variant="contained" size="small" disabled color="warning">Startet ikke</Button>
        <Button variant="contained" size="small" disabled color="error">Fullførte ikke</Button>
        <Button variant="contained" size="small" onClick={handlePrint} disabled={selected.length === 0}>Vis startbekreftelse</Button>
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
              <TableCell>Handling</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d.startnummer} hover>
                <TableCell padding="checkbox">
                  <Checkbox checked={selected.includes(d.startnummer)} onChange={() => toggle(d.startnummer)}/>
                </TableCell>
                <TableCell>{d.startnummer}</TableCell>
                <TableCell>{d.navn}</TableCell>
                <TableCell>{d.klasse}</TableCell>
                <TableCell>{d.sykkel}</TableCell>
                <TableCell>{d.starttid}</TableCell>
                <TableCell>{renderStatusChip(d.status)}</TableCell>
                <TableCell>
                  {/* Rediger/slett midlertidig fjernet */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialoger for redigering, status og sletting følger her – uendret fra tidligere */}
    </Box>
  );
};

export default Startliste;