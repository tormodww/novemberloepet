import React, { useRef, useEffect, useState } from 'react';
import { useDeltagerContext, Deltager, EtappeResultat } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';
import {
  Box, Typography, TextField, Button, Paper, Autocomplete, Stack, IconButton,
  Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText, DialogActions, Snackbar, Alert, Chip
} from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import { usePersistentState } from '../hooks/usePersistentState';

function formatTimeInput(input: string): string {
  const clean = input.replace(/\D/g, '');
  if (!clean) return '';
  let padded = clean.padStart(2, '0');
  if (padded.length < 4) padded = padded.padStart(4, '0');
  if (padded.length < 6) padded = padded.padStart(6, '0');
  return `${padded.slice(0,2)}:${padded.slice(2,4)}:${padded.slice(4,6)}`;
}

const FinishTimeRegister: React.FC = () => {
  const { deltagere, editDeltager, setEtappeStatus } = useDeltagerContext();
  const { etapper } = useEtappeContext();
  const [startnummer, setStartnummer] = usePersistentState<string>('finishtime.startnummer', '');
  const [selected, setSelected] = usePersistentState<Deltager | null>('finishtime.selected', null);
  const [etappe, setEtappe] = usePersistentState<number>('finishtime.etappe', 1);
  const [inputTid, setInputTid] = usePersistentState<string>('finishtime.inputTid', '');
  const [bekreft, setBekreft] = useState('');

  // Snackbar state
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info');

  const valgtEtappe = etapper.find(e => e.nummer === etappe);

  // autocomplete options
  const options = deltagere.map(d => ({ label: `#${d.startnummer} — ${d.navn}`, value: d.startnummer, data: d }));

  const searchRef = useRef<HTMLInputElement | null>(null);
  const timeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // focus search for quick input on mobile
    setTimeout(() => {
      searchRef.current?.focus();
    }, 200);
  }, []);

  useEffect(() => {
    if (selected) setStartnummer(selected.startnummer);
  }, [selected]);

  const deltager = deltagere.find(d => d.startnummer === startnummer) || selected;

  // Helper to register time for a participant (person) with provided raw input (hhmmss or formatted)
  const registerTime = (person: Deltager, rawInput: string) => {
    if (!person) return;
    const tid = formatTimeInput(rawInput);
    const ETAPPER = etapper.length;
    const nyeResultater: EtappeResultat[] = Array.from({ length: ETAPPER }, (_, i) =>
      person.resultater?.[i] || { etappe: i + 1, starttid: '', maltid: '', idealtid: '', diff: '' }
    );
    nyeResultater[etappe - 1] = {
      ...nyeResultater[etappe - 1],
      maltid: tid
    };
    editDeltager(person.navn, { resultater: nyeResultater });
    setBekreft(`#${person.startnummer} ${person.navn} ${valgtEtappe?.navn}: ${tid}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const person = deltager;
    if (person && inputTid) {
      registerTime(person, inputTid);
      setInputTid('');
      setStartnummer('');
      setSelected(null);
      // focus search again for next participant
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  };

  // helper to allow free typing of startnummer into autocomplete
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
    // focus the time input so user can immediately type time
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
    if (!deltager) { setTimeout(() => searchRef.current?.focus(), 50); setSnackMsg('Velg deltager først'); setSnackSeverity('warning'); setSnackOpen(true); return; }
    // blur focused element before opening dialog so aria-hidden won't hide a focused node
    try { (document.activeElement as HTMLElement | null)?.blur(); } catch (e) {}
    setPendingStatus(status);
    setConfirmStatusOpen(true);
  };

  const handleStatusConfirm = () => {
    if (pendingStatus && deltager) {
      setEtappeStatus(deltager.startnummer, etappe, pendingStatus);
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
    // include participants who do not have maltid OR who are DNS/DNF (so we can visually mark them)
    return deltagere.filter(d => {
      const res = d.resultater?.[etappe - 1];
      const maltid = res?.maltid;
      const status = res?.status;
      return (!maltid || maltid === '') || status === 'DNS' || status === 'DNF';
    });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 600, mx: 'auto' }}>
      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="h6" gutterBottom>Registrer slutt-tid (målgang)</Typography>

        {/* Quick register buttons (mobile friendly) */}
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
          {etapper.map(e => (
            <Button key={e.nummer} size="small" variant={e.nummer===etappe? 'contained' : 'outlined'} onClick={() => quickSetEtappe(e.nummer)} sx={{ minWidth: 80 }}>
              {e.navn}
            </Button>
          ))}
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {/* Make the startnummer field flexible so the whole value is visible */}
            <Box sx={{ width: { xs: '100%', sm: '65%' }, flexGrow: 1 }}>
               <Stack direction="row" spacing={1} alignItems="center">
                 <IconButton size="small" onClick={openMissingDialog} aria-label="Vis deltagere uten målgang"><ListIcon /></IconButton>
                 <Autocomplete
                   freeSolo
                   options={options}
                   getOptionLabel={(opt: any) => (typeof opt === 'string' ? opt : opt.label)}
                   onChange={(event, value) => {
                     if (!value) { setSelected(null); setStartnummer(''); return; }
                     if (typeof value === 'string') {
                       handleFreeInput(value);
                     } else {
                       setSelected(value.data);
                       setStartnummer(value.value);
                     }
                   }}
                   onInputChange={(event, value, reason) => {
                     if (reason === 'input') handleFreeInput(value);
                   }}
                   renderOption={(props, option) => {
                     // avoid spreading a props object that contains a `key` prop (React warns about this)
                     const { key, ...rest } = props as any;
                     return (<li key={key} {...rest}>{option.label}</li>);
                   }}
                   renderInput={(params) => (
                     <TextField
                       {...params}
                       inputRef={searchRef}
                       label="Startnummer eller navn"
                       placeholder="Søk eller skriv startnummer"
                       fullWidth
                       size="small"
                     />
                   )}
                 />
               </Stack>
             </Box>

             {/* Fixed, modest width for the time input so hh:mm:ss can be seen */}
             <Box sx={{ width: { xs: '100%', sm: '180px' }, flexGrow: 0, mt: { xs: 1, sm: 0 } }}>
              <TextField
                inputRef={timeRef}
                label="Slutt-tid (hh:mm:ss)"
                placeholder="hh:mm:ss"
                value={inputTid ? formatTimeInput(inputTid) : ''}
                onChange={e => setInputTid(e.target.value.replace(/\D/g, ''))}
                fullWidth
                size="small"
                inputProps={{ inputMode: 'numeric', pattern: '[0-9:]*', maxLength: 8 }}
              />
            </Box>

             <Box sx={{ width: '100%', mt: 1 }}>
               <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                 <Button type="submit" variant="contained" color="primary" sx={{ width: { xs: '100%', sm: 'auto' } }}>Registrer tid</Button>
                 <Button variant="outlined" color="secondary" onClick={() => handleStatusInitiate('DNS')}>Startet ikke</Button>
                 <Button variant="outlined" color="secondary" onClick={() => handleStatusInitiate('DNF')}>Fullførte ikke</Button>
               </Stack>
             </Box>
           </Stack>
         </form>

        {deltager && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2">#{deltager.startnummer} {deltager.navn}</Typography>
            <Typography variant="body2">Nåværende slutt-tid {valgtEtappe?.navn}: {deltager.resultater?.[etappe-1]?.maltid || 'Ikke satt'}</Typography>
            <Typography variant="body2">Status: {deltager.resultater?.[etappe-1]?.status || 'NONE'}</Typography>
          </Box>
        )}

        {bekreft && <Typography color="success.main" sx={{ mt: 1 }}>{bekreft} lagret!</Typography>}
      </Paper>

      <Dialog open={openDialog} onClose={closeMissingDialog} fullWidth>
        <DialogTitle>Deltagere uten målgang - {valgtEtappe?.navn}</DialogTitle>
        <DialogContent dividers>
          <List>
            {participantsMissingFinish().map(d => (
              <ListItemButton key={d.startnummer} onClick={() => onSelectFromDialog(d)}>
                <ListItemText primary={`#${d.startnummer} ${d.navn}`} secondary={`${d.klasse} • ${d.sykkel}`} />
                {/* visual marker for DNS/DNF if present */}
                {d.resultater?.[etappe-1]?.status === 'DNS' && <Chip label="Startet ikke" color="error" size="small" sx={{ ml: 1 }} />}
                {d.resultater?.[etappe-1]?.status === 'DNF' && <Chip label="Fullførte ikke" color="warning" size="small" sx={{ ml: 1 }} />}
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
