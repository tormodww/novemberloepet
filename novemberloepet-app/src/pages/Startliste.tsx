import React from 'react';
import { useDeltagerContext } from '../context/DeltagerContext';
import { usePersistentState } from '../hooks/usePersistentState';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Checkbox, Button, Stack, Chip, TextField, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, MenuItem, IconButton, CircularProgress, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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
  const { deltagere, setMultipleDeltagerStatus, updateDeltager, deleteDeltager } = useDeltagerContext();
  const [sortField, setSortField] = usePersistentState<SortField>('startliste.sortField', 'startnummer');
  const [sortOrder, setSortOrder] = usePersistentState<SortOrder>('startliste.sortOrder', 'asc');
  const [selected, setSelected] = usePersistentState<string[]>('startliste.selected', []);
  const [query, setQuery] = usePersistentState<string>('startliste.query', '');
  const [klasseFilter, setKlasseFilter] = usePersistentState<string>('startliste.klasseFilter', '');
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<'DNS' | 'DNF' | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editData, setEditData] = React.useState<Partial<any> | null>(null);
  const [editSaving, setEditSaving] = React.useState(false);
  const [editMessage, setEditMessage] = React.useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ startnummer: string; navn: string } | null>(null);

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
      const aNum = parseInt(String(aVal || ''), 10);
      const bNum = parseInt(String(bVal || ''), 10);
      if (isNaN(aNum) || isNaN(bNum)) return 0;
      return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
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
    // blur any currently focused element so opening the dialog won't hide a focused node
    try { (document.activeElement as HTMLElement | null)?.blur(); } catch (e) { /* ignore */ }
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

  const openEdit = (d: any) => {
    setEditData({ ...d });
    setEditMessage(null);
    setEditOpen(true);
  };
  const closeEdit = () => {
    setEditOpen(false);
    setEditData(null);
    setEditSaving(false);
    setEditMessage(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editData) return;
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleEditSave = async () => {
    if (!editData) return;
    const startnummer = editData.startnummer;
    setEditSaving(true);
    setEditMessage(null);
    try {
      const dataToUpdate: Partial<any> = {
        navn: editData.navn,
        adresse: editData.adresse,
        postnr: editData.postnr,
        nasjon: editData.nasjon,
        poststed: editData.poststed,
        telefon: editData.telefon,
        email: editData.email,
        sykkel: editData.sykkel,
        modell: editData.modell,
        teknisk: editData.teknisk,
        preKlasse: editData.preKlasse,
        klasse: editData.klasse,
        starttid: editData.starttid,
      };
      const ok = await updateDeltager(String(startnummer), dataToUpdate);
      if (ok) {
        setEditMessage('Oppdatert på server');
      } else {
        setEditMessage('Endringen er lagret lokalt og ligger i kø for å synkes til server (retry).');
      }
    } catch (e: any) {
      setEditMessage(`Feil ved oppdatering: ${e?.message || e}`);
    } finally {
      setEditSaving(false);
      // keep dialog open so user can see message, close automatically after short delay
      setTimeout(() => closeEdit(), 1400);
    }
  };

  const renderStatusChip = (status?: string) => {
    if (!status || status === 'NONE') return <Chip label="-" size="small" />;
    if (status === 'OK') return <Chip label="OK" color="success" size="small" />;
    if (status === 'DNS') return <Chip label="Startet ikke" color="warning" size="small" />;
    if (status === 'DNF') return <Chip label="Fullførte ikke" color="error" size="small" />;
    return <Chip label={status} size="small" />;
  };

  const openDeleteConfirm = (startnummer: string, navn: string) => {
    // blur focused element before opening dialog to avoid aria-hidden hiding focused node
    try { (document.activeElement as HTMLElement | null)?.blur(); } catch (e) { /* ignore */ }
    setDeleteTarget({ startnummer, navn });
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    // delete by startnummer (context API expects startnummer)
    deleteDeltager(deleteTarget.startnummer);
    setConfirmDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleCancelDelete = () => { setConfirmDeleteOpen(false); setDeleteTarget(null); };

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
        <Button variant="contained" size="small" onClick={() => handleStatusInitiate('DNS')} disabled={selected.length===0} color="warning">Startet ikke</Button>
        <Button variant="contained" size="small" onClick={() => handleStatusInitiate('DNF')} disabled={selected.length===0} color="error">Fullførte ikke</Button>
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
              <TableCell>Handling</TableCell>
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
                <TableCell>
                  <IconButton size="small" onClick={() => openEdit(d)} title="Rediger deltager">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => openDeleteConfirm(d.startnummer, d.navn)} title="Slett deltager">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>Rediger deltager</DialogTitle>
        <DialogContent>
          {editMessage && <Alert severity={editMessage.startsWith('Feil') ? 'error' : 'info'} sx={{ mb: 2 }}>{editMessage}</Alert>}
          <TextField label="Navn" name="navn" value={(editData as any)?.navn || ''} onChange={handleEditChange} fullWidth margin="normal" />
          <TextField label="Adresse" name="adresse" value={(editData as any)?.adresse || ''} onChange={handleEditChange} fullWidth margin="normal" />
          <TextField label="Postnr" name="postnr" value={(editData as any)?.postnr || ''} onChange={handleEditChange} fullWidth margin="normal" />
          <TextField select label="Nasjon" name="nasjon" value={(editData as any)?.nasjon || ''} onChange={handleEditChange} fullWidth margin="normal">
            <MenuItem value="Norge">Norge</MenuItem>
            <MenuItem value="Sverige">Sverige</MenuItem>
            <MenuItem value="Finland">Finland</MenuItem>
            <MenuItem value="Danmark">Danmark</MenuItem>
          </TextField>
          <TextField label="Poststed" name="poststed" value={(editData as any)?.poststed || ''} onChange={handleEditChange} fullWidth margin="normal" />
          <TextField label="Telefon" name="telefon" value={(editData as any)?.telefon || ''} onChange={handleEditChange} fullWidth margin="normal" />
          <TextField label="E-mail" name="email" value={(editData as any)?.email || ''} onChange={handleEditChange} fullWidth margin="normal" />
          <TextField label="Sykkel" name="sykkel" value={(editData as any)?.sykkel || ''} onChange={handleEditChange} fullWidth margin="normal" />
          <TextField label="Modell (år)" name="modell" value={(editData as any)?.modell || ''} onChange={handleEditChange} fullWidth margin="normal" />
          <TextField label="Teknisk" name="teknisk" value={(editData as any)?.teknisk || ''} onChange={handleEditChange} fullWidth margin="normal" />
          <TextField label="Pre/Klasse" name="preKlasse" value={(editData as any)?.preKlasse || ''} onChange={handleEditChange} fullWidth margin="normal" />
          <TextField select label="Klasse" name="klasse" value={(editData as any)?.klasse || ''} onChange={handleEditChange} fullWidth margin="normal">
            {['Oldtimer','Pre 75','Pre 85','Classic','Pre 90','Offroad 2000','Super-EVO'].map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
          <TextField label="Starttid" name="starttid" value={(editData as any)?.starttid || ''} onChange={handleEditChange} fullWidth margin="normal" />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} disabled={editSaving}>Avbryt</Button>
          <Button onClick={handleEditSave} variant="contained" disabled={editSaving} startIcon={editSaving ? <CircularProgress size={16} /> : null}>
            {editSaving ? 'Lagrer...' : 'Lagre endringer'}
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDeleteOpen} onClose={handleCancelDelete}>
        <DialogTitle>Bekreft sletting</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Er du sikker på at du vil slette {deleteTarget ? `#${deleteTarget.startnummer} ${deleteTarget.navn}` : 'den valgte deltakeren'}? Dette kan ikke angres.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Avbryt</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">Slett</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Startliste;
