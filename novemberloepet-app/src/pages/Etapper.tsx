import SaveIcon from '@mui/icons-material/Save';
import { Box, Button, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { useEtappeContext } from '../context/EtappeContext';

const Etapper: React.FC = () => {
  const { etapper, updateEtappenavn, updateIdealtid, handleSaveDefaultEtapper, reloadEtapper, loadingEtapper } = useEtappeContext();
  // local edit buffer for idealtid per etappenummer
  const [localIdeal, setLocalIdeal] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [savingDefaults, setSavingDefaults] = useState(false);

  // When etapper change externally, sync local buffer for those not being edited
  useEffect(() => {
    const next: Record<number, string> = {};
    (Array.isArray(etapper) ? etapper : []).forEach(e => {
      next[e.nummer] = e.idealtid || '';
    });
    setLocalIdeal(prev => ({ ...next, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapper]);

  const handleIdealChange = (nummer: number, value: string) => {
    // Auto-format disabled: keep raw user input in the local buffer.
    setLocalIdeal(prev => ({ ...prev, [nummer]: value }));
  };

  // parse local input into minutes and seconds; return {valid, minutes, seconds, formatted}
  const parseIdeal = (input: string) => {
    const raw = (input || '').replace(/\s/g, '');
    if (!raw) return { valid: false, minutes: 0, seconds: 0, formatted: '' };
    // If contains colon, split
    if (raw.includes(':')) {
      const parts = raw.split(':');
      if (parts.length !== 2) return { valid: false, minutes: 0, seconds: 0, formatted: '' };
      const min = parseInt(parts[0] || '0', 10);
      const sec = parseInt(parts[1] || '0', 10);
      const valid = !isNaN(min) && !isNaN(sec) && sec >= 0 && sec < 60 && min >= 0;
      const m = (isNaN(min) ? 0 : min).toString().padStart(2, '0');
      const s = (isNaN(sec) ? 0 : sec).toString().padStart(2, '0');
      return { valid, minutes: min, seconds: sec, formatted: `${m}:${s}` };
    }
    // Only digits: interpret last two as seconds
    const clean = raw.replace(/\D/g, '');
    if (!clean) return { valid: false, minutes: 0, seconds: 0, formatted: '' };
    const len = clean.length;
    const sec = parseInt(clean.slice(Math.max(0, len - 2)), 10);
    const minPart = len > 2 ? clean.slice(0, len - 2) : '0';
    const min = parseInt(minPart, 10);
    const valid = !isNaN(min) && !isNaN(sec) && sec >= 0 && sec < 60 && min >= 0;
    const m = (isNaN(min) ? 0 : min).toString().padStart(2, '0');
    const s = (isNaN(sec) ? 0 : sec).toString().padStart(2, '0');
    return { valid, minutes: min, seconds: sec, formatted: `${m}:${s}` };
  };

  const commitIdeal = (nummer: number) => {
    const raw = localIdeal[nummer] ?? '';
    const parsed = parseIdeal(raw);
    if (!parsed.valid) {
      // do not commit invalid value; keep focus and show red save icon
      return;
    }
    updateIdealtid(nummer, parsed.formatted);
    setLocalIdeal(prev => ({ ...prev, [nummer]: parsed.formatted }));
    // mark as saved briefly
    setSaved(prev => ({ ...prev, [nummer]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [nummer]: false })), 1500);
  };

  const handleKey = (e: React.KeyboardEvent, _nummer: number) => {
    if (e.key === 'Enter') {
      (e.target as HTMLElement).blur(); // trigger onBlur -> commit
    }
  };

  const isDirty = (nummer: number) => {
    // When auto-format is off we consider the row dirty if the raw local input differs from stored value.
    const local = localIdeal[nummer] ?? '';
    const stored = Array.isArray(etapper) ? etapper.find(x => x.nummer === nummer)?.idealtid : '';
    return local !== (stored || '');
  };

  const isInvalid = (nummer: number) => {
    const local = localIdeal[nummer] ?? '';
    const parsed = parseIdeal(local);
    // invalid if not valid but non-empty
    return local !== '' && !parsed.valid;
  };

  const defaultSyncLocalValues = () => {
    const next: Record<number, string> = {};
    (Array.isArray(etapper) ? etapper : []).forEach(e => {
      next[e.nummer] = e.idealtid || '';
    });
    setLocalIdeal(next);
  };

  useEffect(() => {
    defaultSyncLocalValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveDefaultsClick = async () => {
    try {
      setSavingDefaults(true);
      // Ask context to save default etapper to backend
      await handleSaveDefaultEtapper();
      // Reload etapper from backend to pick up saved defaults (if any)
      await reloadEtapper();
      // Sync local values with newly loaded etapper list
      defaultSyncLocalValues();
    } catch (e) {
      // ignore here; context already logs errors
      console.warn('Failed to save default etapper from UI', e);
    } finally {
      setSavingDefaults(false);
    }
  };

  return (
    <Box maxWidth={900} mx="auto">
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <Typography variant="h6">Etapper</Typography>
        {/* If there are no etapper, provide a button to persist default etapper to backend */}
        {(!Array.isArray(etapper) || etapper.length === 0) && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveDefaultsClick}
            disabled={savingDefaults || loadingEtapper}
            sx={{ ml: 1 }}
          >
            Lagre standard etapper til backend
          </Button>
        )}
      </Stack>
      <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 60 }}>Nr</TableCell>
              <TableCell>Navn</TableCell>
              <TableCell sx={{ width: 200 }}>Idealtid (mm:ss)</TableCell>
              <TableCell sx={{ width: 80 }}>Handling</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(Array.isArray(etapper) ? etapper : []).map((e) => {
              const dirty = isDirty(e.nummer);
              const invalid = isInvalid(e.nummer);
              return (
                <TableRow key={e.nummer} hover>
                  <TableCell>{e.nummer}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={e.navn}
                      onChange={(evt) => updateEtappenavn(e.nummer, evt.target.value)}
                      fullWidth
                      margin="none"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={localIdeal[e.nummer] ?? ''}
                      onChange={(evt) => handleIdealChange(e.nummer, evt.target.value)}
                      onBlur={() => commitIdeal(e.nummer)}
                      onKeyDown={(evt) => handleKey(evt, e.nummer)}
                      fullWidth
                      margin="none"
                      placeholder="mmss or mm:ss"
                      error={invalid}
                      helperText={invalid ? 'Ugyldig tid (sekunder må være < 60)' : ''}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      title={invalid ? 'Ugyldig idealtid' : 'Lagre'}
                      onClick={() => commitIdeal(e.nummer)}
                      disabled={!dirty || invalid}
                      color={invalid ? 'error' : (saved[e.nummer] ? 'success' : 'default')}
                    >
                      <SaveIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Etapper;