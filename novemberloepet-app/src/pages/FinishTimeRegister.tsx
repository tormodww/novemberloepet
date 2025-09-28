import React, { useState, useRef, useEffect } from 'react';
import { useDeltagerContext, Deltager, EtappeResultat } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';
import {
  Box, Typography, TextField, Button, Paper, MenuItem, Autocomplete, Grid, Stack, InputAdornment, IconButton,
  Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText, DialogActions, Snackbar, Alert, Chip
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ListIcon from '@mui/icons-material/List';

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
  const [startnummer, setStartnummer] = useState('');
  const [selected, setSelected] = useState<Deltager | null>(null);
  const [etappe, setEtappe] = useState(1);
  const [inputTid, setInputTid] = useState('');
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

  // New behavior: set now and immediately register (one-touch)
  const setNowAndRegister = () => {
    const person = deltager;
    if (!person) {
      setTimeout(() => searchRef.current?.focus(), 50);
      setSnackMsg('Velg deltager først');
      setSnackSeverity('warning');
      setSnackOpen(true);
      return;
    }
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const ss = now.getSeconds().toString().padStart(2, '0');
    const raw = `${hh}${mm}${ss}`; // HHMMSS
    registerTime(person, raw);
    // clear inputs and refocus search for next
    setInputTid('');
    setStartnummer('');
    setSelected(null);
    setTimeout(() => searchRef.current?.focus(), 100);
    setSnackMsg('Tid registrert');
    setSnackSeverity('success');
    setSnackOpen(true);
  };

  const [openDialog, setOpenDialog] = useState(false);

  const openMissingDialog = () => {
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

  const markStatus = (status: 'DNS' | 'DNF') => {
    if (!deltager) { setTimeout(() => searchRef.current?.focus(), 50); setSnackMsg('Velg deltager først'); setSnackSeverity('warning'); setSnackOpen(true); return; }
    setEtappeStatus(deltager.startnummer, etappe, status);
    setBekreft(`#${deltager.startnummer} ${deltager.navn} ${valgtEtappe?.navn}: ${status}`);
    setStartnummer('');
    setSelected(null);
    setTimeout(() => searchRef.current?.focus(), 100);
    setSnackMsg(`Status ${status} satt for #${deltager.startnummer}`);
    setSnackSeverity('info');
    setSnackOpen(true);
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
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} sm={7}>
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
                    // show no status here (option is string/object). We'll show status in dialog
                    return (<li {...props}>{option.label}</li>);
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
            </Grid>

            <Grid item xs={12} sm={2}>
              <TextField
                select
                label="Etappe"
                value={etappe}
                onChange={e => setEtappe(Number(e.target.value))}
                fullWidth
                size="small"
              >
                {etapper.map((e) => (
                  <MenuItem key={e.nummer} value={e.nummer}>{e.navn}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                inputRef={timeRef}
                label="Slutt-tid (hhmmss)"
                value={inputTid}
                onChange={e => setInputTid(e.target.value)}
                fullWidth
                size="small"
                inputProps={{ inputMode: 'numeric', pattern: '[0-9:]*' }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={setNowAndRegister} edge="end" aria-label="Sett nåværende tid og registrer">
                        <AccessTimeIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button type="submit" variant="contained" color="primary" fullWidth>Registrer tid</Button>
                <Button variant="outlined" color="secondary" onClick={() => markStatus('DNS')}>Startet ikke</Button>
                <Button variant="outlined" color="secondary" onClick={() => markStatus('DNF')}>Fullførte ikke</Button>
              </Stack>
            </Grid>
          </Grid>
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

      <Snackbar open={snackOpen} autoHideDuration={3000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: '100%' }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FinishTimeRegister;
