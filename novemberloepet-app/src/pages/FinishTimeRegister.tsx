import React, { useRef, useEffect, useState } from 'react';
import { useDeltagerContext, Deltager, EtappeResultat } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';
import {
  Box, Typography, TextField, Button, Paper, Autocomplete, Stack, IconButton,
  Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText, DialogActions, Snackbar, Alert, Chip
} from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import ListIcon from '@mui/icons-material/List';
import { IMaskInput } from 'react-imask';
import { usePersistentState } from '../hooks/usePersistentState';

function formatTimeInput(input: string): string {
  const clean = input.replace(/\D/g, '');
  if (!clean) return '';
  let padded = clean.padStart(2, '0');
  if (padded.length < 4) padded = padded.padStart(4, '0');
  if (padded.length < 6) padded = padded.padStart(6, '0');
  return `${padded.slice(0,2)}:${padded.slice(2,4)}:${padded.slice(4,6)}`;
}

// IMask wrapper for hh:mm:ss
const MaskedTimeInputFinish = React.forwardRef(function MaskedTimeInputFinish(props: any, ref: any) {
  const { onChange, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask="00:00:00"
      inputRef={ref}
      overwrite
      onAccept={(value: any) => {
        if (onChange) onChange({ target: { value } });
      }}
    />
  );
});

const FinishTimeRegister: React.FC = () => {
  const { deltagere, editDeltager, setEtappeStatus } = useDeltagerContext();
  const { etapper } = useEtappeContext();
  const [startnummer, setStartnummer] = usePersistentState<string>('finishtime.startnummer', '');
  const [selected, setSelected] = usePersistentState<Deltager | null>('finishtime.selected', null);
  const [etappe, setEtappe] = usePersistentState<number | null>('finishtime.etappe', null);
  const [visAlle, setVisAlle] = useState<boolean>(false);
  const canRegister = etappe !== null;
  const [inputTid, setInputTid] = usePersistentState<string>('finishtime.inputTid', '');
  const [bekreft, setBekreft] = useState('');

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info');

  const valgtEtappe = etappe !== null ? etapper.find(e => e.nummer === etappe) : undefined;

  const options = deltagere.map(d => ({ label: `#${d.startnummer} — ${d.navn}`, value: d.startnummer, data: d }));

  const searchRef = useRef<HTMLInputElement | null>(null);
  const timeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTimeout(() => {
      searchRef.current?.focus();
    }, 200);
  }, []);

  useEffect(() => {
    if (selected) setStartnummer(selected.startnummer);
  }, [selected]);

  const deltager = deltagere.find(d => d.startnummer === startnummer) || selected;

  const registerTime = (person: Deltager, rawInput: string) => {
    if (!person) return;
    if (etappe === null) {
      // safety: should not happen because button is disabled, but guard anyway
      setSnackMsg('Velg en etappe først');
      setSnackSeverity('warning');
      setSnackOpen(true);
      return;
    }
    const tid = formatTimeInput(rawInput);
    const ETAPPER = etapper.length;
    const nyeResultater: EtappeResultat[] = Array.from({ length: ETAPPER }, (_, i) =>
      person.resultater?.[i] || { etappe: i + 1, starttid: '', maltid: '', idealtid: '', diff: '' }
    );
    const idx = etappe - 1;
    nyeResultater[idx] = {
      ...nyeResultater[idx],
      maltid: tid
    };
    editDeltager(person.navn, { resultater: nyeResultater });
    setBekreft(`#${person.startnummer} ${person.navn} ${valgtEtappe?.navn}: ${tid}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // require etappe selection
    if (!canRegister) {
      setSnackMsg('Velg en etappe først');
      setSnackSeverity('warning');
      setSnackOpen(true);
      return;
    }
    const person = deltager;
    if (person && inputTid) {
      registerTime(person, inputTid);
      setInputTid('');
      setStartnummer('');
      setSelected(null);
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  };

  const handleFreeInput = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (numeric) {
      setStartnummer(numeric);
      setSelected(null);
    } else {
      setStartnummer('');
      setSelected(null);
    }
  };

  const quickSetEtappe = (nummer: number) => {
    setEtappe(nummer);
    setTimeout(() => timeRef.current?.focus(), 50);
  };

  const [openDialog, setOpenDialog] = useState(false);

  const openMissingDialog = () => {
    try { (document.activeElement as HTMLElement | null)?.blur(); } catch (e) {}
    setOpenDialog(true);
  };

  const closeMissingDialog = () => {
    setOpenDialog(false);
  };

  const onSelectFromDialog = (d: Deltager) => {
    setSelected(d);
    setStartnummer(d.startnummer);
    closeMissingDialog();
    setTimeout(() => timeRef.current?.focus(), 50);
  };

  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'DNS' | 'DNF' | null>(null);

  const handleStatusInitiate = (status: 'DNS' | 'DNF') => {
    if (!deltager) {
      setTimeout(() => searchRef.current?.focus(), 50);
      setSnackMsg('Velg deltager først');
      setSnackSeverity('warning');
      setSnackOpen(true);
      return;
    }
    try { (document.activeElement as HTMLElement | null)?.blur(); } catch (e) {}
    setPendingStatus(status);
    setConfirmStatusOpen(true);
  };

  const handleStatusConfirm = () => {
    if (pendingStatus && deltager) {
      if (!canRegister) return;
      // etappe is non-null here due to canRegister
      setEtappeStatus(deltager.startnummer, etappe, pendingStatus as any);
      setBekreft(`#${deltager.startnummer} ${deltager.navn} ${valgtEtappe?.navn}: ${pendingStatus}`);
      setStartnummer('');
      setSelected(null);
      setTimeout(() => searchRef.current?.focus(), 100);
      setSnackMsg(`Status ${pendingStatus} satt for #${deltager.startnummer}`);
      setSnackSeverity('info');
      setSnackOpen(true);
    }
    setConfirmStatusOpen(false);
  };

  const participantsMissingFinish = () => {
    // Return participants who are missing a finish time or have DNS/DNF, sorted by numeric startnummer
    if (etappe === null) return [];
    return deltagere
      .filter(d => {
        const res = d.resultater?.[etappe - 1];
        const maltid = res?.maltid;
        const status = res?.status;
        return (!maltid || maltid === '') || status === 'DNS' || status === 'DNF';
      })
      .slice()
      .sort((a, b) => (parseInt(a.startnummer as any, 10) || 0) - (parseInt(b.startnummer as any, 10) || 0));
  };

  // Helper to return either all deltagere or only those missing finish for the selected etappe
  const filteredForFinish = () => {
    if (visAlle) return deltagere.slice().sort((a, b) => (parseInt(a.startnummer as any, 10) || 0) - (parseInt(b.startnummer as any, 10) || 0));
    return participantsMissingFinish();
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 600, mx: 'auto' }}>
      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="h6" gutterBottom>Registrer slutt-tid (målgang)</Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
          {etapper.map(e => (
            <Button key={e.nummer} size="small" variant={e.nummer===etappe? 'contained' : 'outlined'} onClick={() => quickSetEtappe(e.nummer)} sx={{ minWidth: 80 }}>
              {e.navn}
            </Button>
          ))}
        </Stack>

        {/* Visningsvalg */}
        <TextField
          select
          label="Vis"
          value={visAlle ? 'alle' : 'uten'}
          onChange={(e) => setVisAlle(e.target.value === 'alle')}
          size="small"
          sx={{ mb: 2 }}
        >
          <MenuItem value="uten">Kun uten slutt-tid</MenuItem>
          <MenuItem value="alle">Alle deltagere</MenuItem>
        </TextField>

        {!canRegister && (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            Velg en etappe før registrering
          </Typography>
        )}

        <form onSubmit={handleSubmit}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ width: '100%' }}>

            {/* Startnummer felt */}
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton size="small" onClick={openMissingDialog} aria-label="Vis deltagere uten målgang"><ListIcon /></IconButton>
                {/* Vanlig nedtrekksliste: kun deltagere som mangler slutt-tid */}
                <TextField
                  select
                  label="Startnummer eller navn"
                  inputRef={searchRef}
                  value={startnummer}
                  onChange={(e) => {
                    const val = e.target.value;
                    const sel = deltagere.find(d => d.startnummer === val) || null;
                    setStartnummer(val);
                    setSelected(sel);
                    // focus time input after selection
                    setTimeout(() => timeRef.current?.focus(), 50);
                  }}
                  fullWidth
                  size="small"
                >
                  {filteredForFinish().length > 0 ? (
                    filteredForFinish().map(d => (
                      <MenuItem key={d.startnummer} value={d.startnummer}>#{d.startnummer} — {d.navn}</MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>Ingen deltagere</MenuItem>
                  )}
                </TextField>
              </Stack>
            </Box>

            {/* Slutt-tid felt med react-imask */}
            <Box sx={{ width: { xs: '100%', sm: '160px' }, flexShrink: 0 }}>
              <TextField
                inputRef={timeRef}
                label="Slutt-tid (hh:mm:ss)"
                placeholder="hh:mm:ss"
                value={inputTid}
                onChange={e => setInputTid(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  inputComponent: MaskedTimeInputFinish as any,
                  inputMode: 'numeric'
                }}
              />
            </Box>

            <Box sx={{ width: '100%', mt: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button type="submit" variant="contained" color="primary" sx={{ width: { xs: '100%', sm: 'auto' } }} disabled={!canRegister}>Registrer tid</Button>
                <Button variant="outlined" color="secondary" onClick={() => handleStatusInitiate('DNS')} disabled={!canRegister}>Startet ikke</Button>
                <Button variant="outlined" color="secondary" onClick={() => handleStatusInitiate('DNF')} disabled={!canRegister}>Fullførte ikke</Button>
              </Stack>
            </Box>
          </Stack>
        </form>

        {deltager && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2">#{deltager.startnummer} {deltager.navn}</Typography>
            <Typography variant="body2">Nåværende slutt-tid {valgtEtappe?.navn ?? ''}: {etappe !== null ? (deltager.resultater?.[(etappe as number)-1]?.maltid || 'Ikke satt') : 'Velg en etappe'}</Typography>
            <Typography variant="body2">Status: {etappe !== null ? (deltager.resultater?.[(etappe as number)-1]?.status || 'NONE') : 'Velg en etappe'}</Typography>
          </Box>
        )}

        {bekreft && <Typography color="success.main" sx={{ mt: 1 }}>{bekreft} lagret!</Typography>}
      </Paper>

      <Dialog open={openDialog} onClose={closeMissingDialog} fullWidth>
        <DialogTitle>Deltagere uten målgang - {valgtEtappe?.navn}</DialogTitle>
        <DialogContent dividers>
          <List>
            {filteredForFinish().map(d => (
              <ListItemButton key={d.startnummer} onClick={() => onSelectFromDialog(d)}>
                <ListItemText primary={`#${d.startnummer} ${d.navn}`} secondary={`${d.klasse} • ${d.sykkel}`} />
                {/* visual marker for DNF if present and etappe selected */}
                {etappe !== null && d.resultater?.[etappe - 1]?.status === 'DNF' && (
                  <Chip label="FULLFØRTE IKKE" color="warning" size="small" sx={{ ml: 1 }} />
                )}
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMissingDialog}>Lukk</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmStatusOpen} onClose={() => setConfirmStatusOpen(false)}>
        <DialogTitle>Bekreft status endring</DialogTitle>
        <DialogContent>
          <Typography>
            {pendingStatus === 'DNS'
              ? `Er du sikker på at du vil sette status "Startet ikke" for #${deltager?.startnummer ?? ''} ${deltager?.navn ?? ''}?`
              : `Er du sikker på at du vil sette status "Fullførte ikke" for #${deltager?.startnummer ?? ''} ${deltager?.navn ?? ''}?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmStatusOpen(false)}>Avbryt</Button>
          <Button onClick={handleStatusConfirm} variant="contained" color="primary">Bekreft</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackOpen} autoHideDuration={3000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: '100%' }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FinishTimeRegister;
