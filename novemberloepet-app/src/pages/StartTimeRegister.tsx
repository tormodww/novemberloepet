import React, { useRef, useEffect, useState } from 'react';
import { useDeltagerContext, Deltager } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';
import { Box, Typography, TextField, Button, Paper, Autocomplete, Stack } from '@mui/material';
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
            {/* Make startnummer field wider so whole number is visible */}
            <Box sx={{ width: { xs: '100%', sm: '65%' } }}>
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

            {/* Fixed width time input that shows hh:mm using react-imask */}
            <Box sx={{ width: { xs: '100%', sm: '140px' }, mt: { xs: 1, sm: 0 } }}>
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