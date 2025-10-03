import { Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState, useRef } from 'react';

import { Deltager, useDeltagerContext } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';
import { useEphemeralMessage } from '../hooks/useEphemeralMessage';
import { usePersistentState } from '../hooks/usePersistentState';
import { formatManualStart } from '../lib/timeFormat';

const StartTimeRegister: React.FC = () => {
  const { deltagere, editDeltager, setEtappeStatus, updateStartTime } = useDeltagerContext();
  const { etapper } = useEtappeContext();

  // Veiviser steg og valgt etappe/deltager
  const [step, setStep] = usePersistentState<number>('starttime.step', 1);
  const [valgtEtappe, setValgtEtappe] = usePersistentState<number | null>('starttime.etappe', null);
  const [valgtDeltager, setValgtDeltager] = useState<Deltager | null>(null);
  const { message, showMessage, clear } = useEphemeralMessage(3500);
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [confirmOverrideOpen, setConfirmOverrideOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'NOW' | 'MANUAL' | null>(null);
  const [valgtDeltagerStartnummer, setValgtDeltagerStartnummer] = usePersistentState<string | null>('starttime.selectedStartnummer', null);
  const [confirmEtappeChangeOpen, setConfirmEtappeChangeOpen] = useState(false);
  const autoInputRef = useRef<HTMLInputElement | null>(null);
  const manualInputRef = useRef<HTMLInputElement | null>(null);

  const existingEtappeStart = (() => {
    if (valgtEtappe == null || !valgtDeltager) return '';
    const res = valgtDeltager.resultater?.[valgtEtappe - 1];
    return res?.starttid || '';
  })();

  const existingEtappeStatus = (() => {
    if (valgtEtappe == null || !valgtDeltager) return '';
    const res = valgtDeltager.resultater?.[valgtEtappe - 1];
    return res?.status || '';
  })();

  // Rehydrate valgt deltager når liste eller lagret startnummer endres
  useEffect(() => {
    if (!valgtDeltagerStartnummer) { setValgtDeltager(null); return; }
    const found = deltagere.find(d => d.startnummer === valgtDeltagerStartnummer) || null;
    setValgtDeltager(found);
  }, [deltagere, valgtDeltagerStartnummer]);

  // Oppdater persistent startnummer når valgtDeltager endres
  useEffect(() => {
    setValgtDeltagerStartnummer(valgtDeltager ? valgtDeltager.startnummer : null);
  }, [valgtDeltager, setValgtDeltagerStartnummer]);

  const storeStartTime = useCallback((d: Deltager, time: string) => {
    // Bruk context sin synk-funksjon (optimistisk + backend)
    if (valgtEtappe == null) return;
    updateStartTime(d.startnummer, valgtEtappe, time);
  }, [updateStartTime, valgtEtappe]);

  const registerNow = useCallback(() => {
    if (!valgtDeltager || valgtEtappe == null) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const tid = `${hh}:${mm}`;
    // Sjekk override
    if (existingEtappeStart) {
      setPendingAction('NOW');
      setConfirmOverrideOpen(true);
      return;
    }
    storeStartTime(valgtDeltager, tid);
    showMessage(`Starttid ${tid} registrert for #${valgtDeltager.startnummer}`);
    setShowManual(false); setManualInput('');
  }, [valgtDeltager, valgtEtappe, existingEtappeStart, storeStartTime, showMessage]);

  const saveManual = useCallback(() => {
    if (!valgtDeltager || valgtEtappe == null) return;
    const formatted = formatManualStart(manualInput);
    if (!formatted) return;
    if (existingEtappeStart) {
      setPendingAction('MANUAL');
      setConfirmOverrideOpen(true);
      return;
    }
    storeStartTime(valgtDeltager, formatted);
    showMessage(`Starttid ${formatted} registrert for #${valgtDeltager.startnummer}`);
    setManualInput(''); setShowManual(false);
  }, [valgtDeltager, valgtEtappe, manualInput, existingEtappeStart, storeStartTime, showMessage]);

  const confirmOverride = () => {
    if (!valgtDeltager || !pendingAction || valgtEtappe == null) { setConfirmOverrideOpen(false); return; }
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    if (pendingAction === 'NOW') {
      const tid = `${hh}:${mm}`;
      storeStartTime(valgtDeltager, tid);
      showMessage(`Starttid oppdatert til ${tid}`);
    } else if (pendingAction === 'MANUAL') {
      const formatted = formatManualStart(manualInput);
      if (formatted) {
        storeStartTime(valgtDeltager, formatted);
        showMessage(`Starttid oppdatert til ${formatted}`);
        setManualInput(''); setShowManual(false);
      }
    }
    setPendingAction(null);
    setConfirmOverrideOpen(false);
  };

  const cancelOverride = () => {
    setPendingAction(null);
    setConfirmOverrideOpen(false);
  };

  // Autofokus på manuell felt når aktivert
  useEffect(() => {
    if (showManual) {
      setTimeout(() => manualInputRef.current?.focus(), 0);
    }
  }, [showManual]);

  // Tastatursnarveier – vi holder avhengighetslisten eksplisitt komplett så lint er fornøyd.
  useEffect(() => {
    if (step !== 2 || !valgtDeltager) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !confirmOverrideOpen) {
        if (showManual) {
          saveManual();
        } else {
          registerNow();
        }
      } else if (e.key.toLowerCase() === 'm') {
        setShowManual(s => !s);
      } else if (e.key.toLowerCase() === 'd') {
        if (valgtEtappe != null) {
          setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'DNS');
          editDeltager(valgtDeltager.navn, { starttid: '' });
          showMessage(`DNS registrert for #${valgtDeltager.startnummer}`);
        }
      } else if (e.key === 'Escape') {
        if (showManual) { setShowManual(false); setManualInput(''); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, valgtDeltager, showManual, manualInput, confirmOverrideOpen, existingEtappeStart, valgtEtappe, registerNow, saveManual, setEtappeStatus, editDeltager, showMessage]);

  // Self-heal persisted invalid state: if step=2 but no valgtEtappe, or step is outside expected range
  useEffect(() => {
    if ((step === 2 && valgtEtappe == null) || (step !== 1 && step !== 2)) {
      setStep(1);
      setValgtDeltager(null);
      setShowManual(false);
    }
  }, [step, valgtEtappe, setStep]);

  // Steg 1: Etappevalg
  if (step === 1) {
    return (
      <Box sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
        <Typography variant="h6" gutterBottom>Velg etappe</Typography>
        <Stack spacing={2}>
          {etapper.map(e => (
            <Button
              key={e.nummer}
              variant="contained"
              size="large"
              color={valgtEtappe === e.nummer ? 'primary' : 'inherit'}
              sx={{ py: 2, fontSize: 20 }}
              onClick={() => { setValgtEtappe(e.nummer); setStep(2); setValgtDeltager(null); }}
            >
              {e.navn}
            </Button>
          ))}
        </Stack>
      </Box>
    );
  }

  // Steg 2: Velg deltager og registrer starttid/DNS
  if (step === 2 && valgtEtappe !== null) {
    const isDNS = existingEtappeStatus === 'DNS';
    const isDNF = existingEtappeStatus === 'DNF';
    const valgtEtappeObj = etapper.find(e => e.nummer === valgtEtappe);
    return (
      <Box sx={{ p: 2, maxWidth: 420, mx: 'auto' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Etappe {valgtEtappe}{valgtEtappeObj?.navn ? `: ${valgtEtappeObj.navn}` : ''}
        </Typography>
        <Typography variant="h6" gutterBottom>Velg deltager</Typography>
        <Button variant="outlined" sx={{ mb: 2 }} onClick={() => setConfirmEtappeChangeOpen(true)}>
          Bytt etappe
        </Button>
        <Autocomplete
          options={deltagere.filter(d => !!d.startnummer)}
          getOptionLabel={d => `#${d.startnummer} ${d.navn}`}
          value={valgtDeltager}
          onChange={(_, ny) => { setValgtDeltager(ny); setTimeout(() => autoInputRef.current?.blur(), 0); }}
          renderOption={(props, option) => {
            const status = valgtEtappe != null ? option.resultater?.[valgtEtappe - 1]?.status : undefined;
            const etappeStart = valgtEtappe != null ? option.resultater?.[valgtEtappe - 1]?.starttid : '';
            let statusChip: React.ReactNode = null;
            if (status === 'DNS') statusChip = <Chip label="DNS" color="error" size="small" sx={{ ml: 1 }} />;
            else if (status === 'DNF') statusChip = <Chip label="DNF" color="warning" size="small" sx={{ ml: 1 }} />;
            const timeChip = etappeStart && status !== 'DNS' && status !== 'DNF'
              ? <Chip label={etappeStart} color="success" size="small" sx={{ ml: 1 }} />
              : null;
            return (
              <li
                {...props}
                key={option.startnummer}
                style={{ display: 'flex', alignItems: 'center', ...(etappeStart ? { fontWeight: 600 } : {}) }}
              >
                <span>#{option.startnummer} {option.navn}</span>
                {timeChip}
                {statusChip}
              </li>
            );
          }}
          renderInput={params => (
            <TextField
              {...params}
              label="Startnummer eller navn"
              variant="outlined"
              fullWidth
              inputRef={autoInputRef}
            />
          )}
          sx={{ mb: 3 }}
          isOptionEqualToValue={(opt, val) => opt.startnummer === val?.startnummer}
        />
        {valgtDeltager && (
          <Stack spacing={2}>
            <Typography variant="subtitle1">#{valgtDeltager.startnummer} {valgtDeltager.navn}</Typography>
            <Typography variant="body2" color="text.secondary">
              {existingEtappeStart ? `Eksisterende starttid (etappe): ${existingEtappeStart}` : 'Ingen starttid registrert for etappen'}
            </Typography>
            {existingEtappeStatus && existingEtappeStatus !== 'NONE' && (
              <Typography variant="body2" color="text.secondary">Status: {existingEtappeStatus}</Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ py: 2, fontSize: 20 }}
              onClick={registerNow}
            >
              {existingEtappeStart ? 'Overskriv starttid = nå' : 'Registrer starttid = nå'}
            </Button>
            {/* Flyttet manuell toggle rett under registrer-knappen */}
            <Button
              variant="outlined"
              size="large"
              sx={{ py: 1.5, fontSize: 18 }}
              onClick={() => { setShowManual(s => !s); if (showManual) { setManualInput(''); } }}
            >
              {showManual ? 'Avbryt manuell registrering' : 'Korriger / sett tid manuelt'}
            </Button>
            {showManual && (
              <Stack spacing={1}>
                <TextField
                  label="Manuell starttid (hhmm)"
                  helperText="Skriv f.eks 0932 for 09:32"
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  inputMode="numeric"
                  inputRef={manualInputRef}
                />
                <Button
                  variant="contained"
                  disabled={manualInput.replace(/\D/g,'').length < 3}
                  onClick={saveManual}
                >Lagre manuell tid</Button>
              </Stack>
            )}
            <Button
              variant="contained"
              color={isDNS ? 'warning' : 'error'}
              size="large"
              sx={{ py: 2, fontSize: 20 }}
              onClick={() => {
                if (!valgtDeltager || valgtEtappe == null) return;
                if (isDNS) {
                  setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'NONE');
                  showMessage(`DNS fjernet for #${valgtDeltager.startnummer}`);
                } else {
                  setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'DNS');
                  editDeltager(valgtDeltager.navn, { starttid: '' });
                  showMessage(`DNS registrert for #${valgtDeltager.startnummer}`);
                  setShowManual(false); setManualInput('');
                }
              }}
            >
              {isDNS ? 'Fjern DNS' : 'Sett DNS'}
            </Button>
            <Button
              variant="contained"
              color={isDNF ? 'warning' : 'secondary'}
              size="large"
              sx={{ py: 2, fontSize: 20 }}
              onClick={() => {
                if (!valgtDeltager || valgtEtappe == null) return;
                if (isDNF) {
                  setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'NONE');
                  showMessage(`DNF fjernet for #${valgtDeltager.startnummer}`);
                } else {
                  setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'DNF');
                  editDeltager(valgtDeltager.navn, { starttid: '' });
                  showMessage(`DNF registrert for #${valgtDeltager.startnummer}`);
                  setShowManual(false); setManualInput('');
                }
              }}
            >
              {isDNF ? 'Fjern DNF' : 'Sett DNF'}
            </Button>
            {message && <Typography color="success.main">{message}</Typography>}
            <Button
              variant="text"
              onClick={() => { setValgtDeltager(null); clear(); setShowManual(false); setManualInput(''); }}
              sx={{ mt: 1 }}
            >
              Registrer en annen deltager
            </Button>
          </Stack>
        )}
        <Dialog open={confirmOverrideOpen} onClose={cancelOverride}>
          <DialogTitle>Overskriv eksisterende starttid?</DialogTitle>
          <DialogContent>
            <Typography>Det finnes allerede en starttid for denne etappen ({existingEtappeStart}). Vil du overskrive den?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelOverride}>Avbryt</Button>
            <Button variant="contained" onClick={confirmOverride}>Overskriv</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={confirmEtappeChangeOpen} onClose={() => setConfirmEtappeChangeOpen(false)}>
          <DialogTitle>Bekreft etappebytte</DialogTitle>
          <DialogContent>
            <Typography>Er du sikker på at du vil endre etappe?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmEtappeChangeOpen(false)}>Avbryt</Button>
            <Button variant="contained" onClick={() => {
              setStep(1);
              setValgtDeltager(null);
              clear();
              setShowManual(false);
              setManualInput('');
              setConfirmEtappeChangeOpen(false);
            }}>Bekreft</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Fallback: if state got reset mid-render (should rarely happen) show etappevalg instead of blank
  return (
    <Box sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>Velg etappe</Typography>
      <Stack spacing={2}>
        {etapper.map(e => (
          <Button
            key={e.nummer}
            variant="contained"
            size="large"
            color={valgtEtappe === e.nummer ? 'primary' : 'inherit'}
            sx={{ py: 2, fontSize: 20 }}
            onClick={() => { setValgtEtappe(e.nummer); setStep(2); setValgtDeltager(null); }}
          >
            {e.navn}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

export default StartTimeRegister;
