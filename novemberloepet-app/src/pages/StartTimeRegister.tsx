import React, { useRef, useEffect, useState } from 'react';
import { useDeltagerContext, Deltager } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';
import {
  Box, Typography, TextField, Button, Paper, Stack, IconButton,
  Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText, DialogActions, Snackbar, Alert, Chip
} from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import ListIcon from '@mui/icons-material/List';
import { IMaskInput } from 'react-imask';
import { usePersistentState } from '../hooks/usePersistentState';

function formatStartTimeInput(input: string): string {
  const clean = input.replace(/\D/g, '');
  if (!clean) return '';
  // Pad to 4 digits to represent hhmm -> hh:mm
  const padded = clean.padStart(4, '0').slice(-4);
  return `${padded.slice(0,2)}:${padded.slice(2,4)}`;
}

// IMask wrapper for hh:mm
const MaskedTimeInput = React.forwardRef(function MaskedTimeInput(props: any, ref: any) {
  const { onChange, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask="00:00"
      inputRef={ref}
      overwrite
      onAccept={(value: any) => {
        if (onChange) onChange({ target: { value } });
      }}
    />
  );
});

const StartTimeRegister: React.FC = () => {
  const { deltagere, editDeltager } = useDeltagerContext();
  const { etapper } = useEtappeContext();
  const [startnummer, setStartnummer] = usePersistentState<string>('starttime.startnummer', '');
  const [selected, setSelected] = usePersistentState<Deltager | null>('starttime.selected', null);
  const [inputTid, setInputTid] = usePersistentState<string>('starttime.inputTid', '');
  const [bekreft, setBekreft] = useState('');

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info');

  const searchRef = useRef<HTMLInputElement | null>(null);
  const timeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 200);
  }, []);

  useEffect(() => {
    if (selected) setStartnummer(selected.startnummer);
  }, [selected]);

  const deltager = deltagere.find(d => d.startnummer === startnummer) || selected;

  const registerTime = (person: Deltager, rawInput: string) => {
    if (!person) return;
    const tid = formatStartTimeInput(rawInput);
    editDeltager(person.navn, { starttid: tid });
    setBekreft(`#${person.startnummer} ${person.navn}: ${tid}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    if (numeric) { setStartnummer(numeric); setSelected(null); }
    else { setStartnummer(''); setSelected(null); }
  };

  const quickSetEtappe = (nummer: number) => {
    // For start register we don't track etappe, but focus time after quick button
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

  const participantsMissingStart = () => {
    return deltagere
      .filter(d => !d.starttid || d.starttid === '')
      .slice()
      .sort((a, b) => (parseInt(a.startnummer as any, 10) || 0) - (parseInt(b.startnummer as any, 10) || 0));
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 600, mx: 'auto' }}>
      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="h6" gutterBottom>Registrer starttid</Typography>

        {/* Quick register buttons (mobile friendly) */}
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
          {etapper.map(e => (
            <Button key={e.nummer} size="small" variant="outlined" onClick={() => quickSetEtappe(e.nummer)} sx={{ minWidth: 80 }}>
              {e.navn}
            </Button>
          ))}
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton size="small" onClick={openMissingDialog} aria-label="Vis deltagere uten starttid"><ListIcon /></IconButton>
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
                    setTimeout(() => timeRef.current?.focus(), 50);
                  }}
                  fullWidth
                  size="small"
                >
                  {participantsMissingStart().length > 0 ? (
                    participantsMissingStart().map(d => (
                      <MenuItem key={d.startnummer} value={d.startnummer}>#{d.startnummer} — {d.navn}</MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>Ingen deltagere uten starttid</MenuItem>
                  )}
                </TextField>
              </Stack>
            </Box>

            {/* Starttid felt med react-imask */}
            <Box sx={{ width: { xs: '100%', sm: '140px' }, flexShrink: 0, mt: { xs: 1, sm: 0 } }}>
              <TextField
                inputRef={timeRef}
                label="Starttid (hh:mm)"
                placeholder="hh:mm"
                value={inputTid}
                onChange={e => setInputTid(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  inputComponent: MaskedTimeInput as any,
                  inputMode: 'numeric'
                }}
              />
            </Box>

            <Box sx={{ width: '100%', mt: 1 }}>
              <Button type="submit" variant="contained" color="primary" fullWidth>Registrer starttid</Button>
            </Box>
          </Stack>
        </form>

        {deltager && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2">#{deltager.startnummer} {deltager.navn}</Typography>
            <Typography variant="body2">Nåværende starttid: {deltager.starttid || 'Ikke satt'}</Typography>
          </Box>
        )}

        {bekreft && <Typography color="success.main" sx={{ mt: 1 }}>{bekreft} lagret!</Typography>}
      </Paper>

      <Dialog open={openDialog} onClose={closeMissingDialog} fullWidth>
        <DialogTitle>Deltagere uten starttid</DialogTitle>
        <DialogContent dividers>
          <List>
            {participantsMissingStart().map(d => (
              <ListItemButton key={d.startnummer} onClick={() => onSelectFromDialog(d)}>
                <ListItemText primary={`#${d.startnummer} ${d.navn}`} secondary={`${d.klasse} • ${d.sykkel}`} />
                {d.resultater?.[0]?.status === 'DNS' && <Chip label="Startet ikke" color="error" size="small" sx={{ ml: 1 }} />}
                {d.resultater?.[0]?.status === 'DNF' && <Chip label="Fullførte ikke" color="warning" size="small" sx={{ ml: 1 }} />}
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMissingDialog}>Lukk</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StartTimeRegister;
