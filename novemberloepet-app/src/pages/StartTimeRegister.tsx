import React, { useState, useRef, useEffect } from 'react';
import { useDeltagerContext, Deltager } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';
import { Box, Typography, TextField, Button, Paper, Autocomplete, Stack } from '@mui/material';

function formatStartTimeInput(input: string): string {
  const clean = input.replace(/\D/g, '');
  if (!clean) return '';
  if (clean.length <= 2) return clean.padStart(2, '0') + ':00';
  if (clean.length === 3) return '0' + clean[0] + ':' + clean.slice(1);
  if (clean.length === 4) return clean.slice(0, 2) + ':' + clean.slice(2);
  return clean.slice(0, 2) + ':' + clean.slice(2, 4);
}

const StartTimeRegister: React.FC = () => {
  const { deltagere, editDeltager } = useDeltagerContext();
  const { etapper } = useEtappeContext();
  const [startnummer, setStartnummer] = useState('');
  const [selected, setSelected] = useState<Deltager | null>(null);
  const [inputTid, setInputTid] = useState('');
  const [bekreft, setBekreft] = useState('');

  const searchRef = useRef<HTMLInputElement | null>(null);
  const timeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 200);
  }, []);

  // prepare options for autocomplete
  const options = deltagere.map(d => ({ label: `#${d.startnummer} — ${d.navn}`, value: d.startnummer, data: d }));

  useEffect(() => {
    if (selected) setStartnummer(selected.startnummer);
  }, [selected]);

  const deltager = deltagere.find(d => d.startnummer === startnummer) || selected;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deltager && inputTid) {
      const tid = formatStartTimeInput(inputTid);
      editDeltager(deltager.navn, { starttid: tid });
      setBekreft(`#${deltager.startnummer} ${deltager.navn}: ${tid}`);
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
    // We'll mirror FinishTimeRegister behavior by focusing the time input after setting etappe
    // For StartTimeRegister we don't store etappe in state currently, so we focus time field directly
    setTimeout(() => timeRef.current?.focus(), 50);
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
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <Autocomplete
                freeSolo
                options={options}
                getOptionLabel={(opt: any) => (typeof opt === 'string' ? opt : opt.label)}
                onChange={(event, value) => {
                  if (!value) { setSelected(null); setStartnummer(''); return; }
                  if (typeof value === 'string') handleFreeInput(value);
                  else { setSelected(value.data); setStartnummer(value.value); }
                }}
                onInputChange={(event, value, reason) => { if (reason === 'input') handleFreeInput(value); }}
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
            </Box>

            <Box sx={{ width: { xs: '100%', sm: '50%' }, mt: { xs: 1, sm: 0 } }}>
              <TextField
                inputRef={timeRef}
                label="Starttid (hhmm)"
                value={inputTid}
                onChange={e => setInputTid(e.target.value)}
                fullWidth
                size="small"
                inputProps={{ inputMode: 'numeric', pattern: '[0-9:]*' }}
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
            {etapper[0]?.idealtid && (
              <Typography variant="body2" color="text.secondary">Idealtid første etappe: <b>{etapper[0].idealtid}</b></Typography>
            )}
          </Box>
        )}

        {bekreft && <Typography color="success.main" sx={{ mt: 1 }}>{bekreft} lagret!</Typography>}
      </Paper>
    </Box>
  );
};

export default StartTimeRegister;