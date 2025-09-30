import React, { useEffect, useRef, useState } from 'react';
import { Deltager, useDeltagerContext } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import { IMaskInput } from 'react-imask';
import { usePersistentState } from '../hooks/usePersistentState';

function formatStartTimeInput(input: string): string {
  const clean = input.replace(/\D/g, '');
  if (!clean) return '';
  const padded = clean.padStart(4, '0').slice(-4);
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
}

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
  const [visAlle, setVisAlle] = useState<boolean>(false);
  const [valgtEtappe, setValgtEtappe] = useState<number | null>(null);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const timeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 200);
  }, []);

  // Helper: prevent registration unless an etappe is selected
  const canRegister = valgtEtappe !== null;

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
    if (!canRegister) {
      // focus etappe selection for the user
      return;
    }
    if (deltager && inputTid) {
      registerTime(deltager, inputTid);
      setInputTid('');
      setStartnummer('');
      setSelected(null);
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  };

  const filteredParticipants = () => {
    return deltagere
      .filter(d => {
        if (!visAlle && d.starttid) return false;
        // Note: `valgtEtappe` is used for UI highlighting only in this component.
        // Do not filter participants by an `etappe` property because `Deltager` has no such field.
        return true;
      })
      .sort((a, b) => (parseInt(a.startnummer as any, 10) || 0) - (parseInt(b.startnummer as any, 10) || 0));
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

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 600, mx: 'auto' }}>
      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="h6" gutterBottom>Registrer starttid</Typography>

        {/* Etappevalg med markering */}
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {etapper.map(e => (
            <Button
              key={e.nummer}
              size="small"
              variant={valgtEtappe === e.nummer ? 'contained' : 'outlined'}
              color={valgtEtappe === e.nummer ? 'primary' : 'inherit'}
              onClick={() => setValgtEtappe(e.nummer)}
              sx={{ minWidth: 80 }}
            >
              {e.navn}
            </Button>
          ))}
        </Stack>
        {!canRegister && (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            Velg en etappe før registrering
          </Typography>
        )}

        {/* Visningsvalg */}
        <TextField
          select
          label="Vis"
          value={visAlle ? 'alle' : 'uten'}
          onChange={(e) => setVisAlle(e.target.value === 'alle')}
          size="small"
          sx={{ mb: 2 }}
        >
          <MenuItem value="uten">Kun uten starttid</MenuItem>
          <MenuItem value="alle">Alle deltagere</MenuItem>
        </TextField>

        <form onSubmit={handleSubmit}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="stretch"
            sx={{ mb: 2 }}
          >
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton size="small" onClick={openMissingDialog} aria-label="Vis deltagere">
                  <ListIcon/>
                </IconButton>
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
                  {filteredParticipants().length > 0 ? (
                    filteredParticipants().map(d => (
                      <MenuItem key={d.startnummer} value={d.startnummer}>
                        #{d.startnummer} — {d.navn}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>Ingen deltagere</MenuItem>
                  )}
                </TextField>
              </Stack>
            </Box>

            <Box sx={{ width: { xs: '100%', sm: '140px' } }}>
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

            <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Button type="submit" variant="contained" color="primary" fullWidth sx={{ height: '100%' }} disabled={!canRegister}>
                Registrer
              </Button>
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
        <DialogTitle>Deltagere</DialogTitle>
        <DialogContent dividers>
          <List>
            {filteredParticipants().map(d => (
              <ListItemButton key={d.startnummer} onClick={() => onSelectFromDialog(d)} sx={{ py: 1.5 }}>
                <ListItemText
                  primary={`#${d.startnummer} ${d.navn}`}
                  secondary={`${d.klasse} • ${d.sykkel}`}
                />
                {/* Show only the 'STARTET IKKE' marker in the StartTimeRegister as requested */}
                {d.resultater?.[0]?.status === 'DNS' && (
                  <Chip label="STARTET IKKE" color="error" size="small" sx={{ ml: 1 }} />
                )}
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
