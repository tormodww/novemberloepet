import { Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReplaceConfirmDialog from '../components/common/ReplaceConfirmDialog';

import { Deltager, useDeltagerContext } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';
import { useEphemeralMessage } from '../hooks/useEphemeralMessage';
import { usePersistentState } from '../hooks/usePersistentState';
import { formatManualStart } from '../lib/timeFormat';

const StartTimeRegister: React.FC = () => {
  const { deltagere, editDeltager, setEtappeStatus, updateStartTime, deleteStartTime } = useDeltagerContext();
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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  // Unified replace confirmation: either replace existing starttid with a status (DNS/DNF)
  // or replace existing status with a starttid. pendingReplace holds the intent.
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
  const [pendingReplace, setPendingReplace] = useState<
    | { kind: 'SET_STATUS'; status: 'DNS' | 'DNF' }
    | { kind: 'SET_START'; time: string }
    | null
  >(null);
  const autoInputRef = useRef<HTMLInputElement | null>(null);
  const manualInputRef = useRef<HTMLInputElement | null>(null);
  const isUpdatingRef = useRef(false);

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
    if (isUpdatingRef.current) return;
    if (!valgtDeltagerStartnummer) { setValgtDeltager(null); return; }
    const found = deltagere.find(d => d.startnummer === valgtDeltagerStartnummer) || null;
    setValgtDeltager(found);
  }, [deltagere, valgtDeltagerStartnummer]);

  // Oppdater persistent startnummer når valgtDeltager endres (men unngå loops)
  useEffect(() => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    const newStartnummer = valgtDeltager ? valgtDeltager.startnummer : null;
    if (valgtDeltagerStartnummer !== newStartnummer) {
      setValgtDeltagerStartnummer(newStartnummer);
    }
    // Reset flag after a brief delay to allow state update to complete
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, [valgtDeltager, setValgtDeltagerStartnummer, valgtDeltagerStartnummer]);

  const storeStartTime = useCallback(async (d: Deltager, time: string) => {
    if (valgtEtappe == null) return false;
    const ok = await updateStartTime(d.startnummer, valgtEtappe, time);
    return ok;
  }, [valgtEtappe, updateStartTime]);

  const registerNow = useCallback(async () => {
    if (!valgtDeltager || valgtEtappe == null) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const tid = `${hh}:${mm}`;
    // If there's a DNS/DNF status, confirm before replacing it with an actual start time
    if (existingEtappeStatus === 'DNS' || existingEtappeStatus === 'DNF') {
      setPendingReplace({ kind: 'SET_START', time: tid });
      setConfirmReplaceOpen(true);
      return;
    }
    if (existingEtappeStart) {
      setPendingAction('NOW');
      setConfirmOverrideOpen(true);
      return;
    }
    const ok = await storeStartTime(valgtDeltager, tid);
    if (ok) {
      showMessage(`Start-tid ${tid} registrert for #${valgtDeltager.startnummer}`);
      localStorage.clear();
    } else {
      showMessage('Kunne ikke lagre start-tid til backend');
    }
    setShowManual(false); setManualInput('');
  }, [valgtDeltager, valgtEtappe, existingEtappeStart, storeStartTime, showMessage, existingEtappeStatus]);

  const saveManual = useCallback(async () => {
    if (!valgtDeltager || valgtEtappe == null) return;
    const formatted = formatManualStart(manualInput);
    if (!formatted) return;
    // If there's a DNS/DNF status, confirm before replacing it with an actual start time
    if (existingEtappeStatus === 'DNS' || existingEtappeStatus === 'DNF') {
      setPendingReplace({ kind: 'SET_START', time: formatted });
      setConfirmReplaceOpen(true);
      return;
    }
    if (existingEtappeStart) {
      setPendingAction('MANUAL');
      setConfirmOverrideOpen(true);
      return;
    }
    const ok = await storeStartTime(valgtDeltager, formatted);
    if (ok) {
      showMessage(`Start-tid ${formatted} registrert for #${valgtDeltager.startnummer}`);
      localStorage.clear();
    } else {
      showMessage('Kunne ikke lagre start-tid til backend');
    }
    setManualInput(''); setShowManual(false);
  }, [valgtDeltager, valgtEtappe, manualInput, existingEtappeStart, storeStartTime, showMessage, existingEtappeStatus]);

  // Confirm or cancel the pending replace action
  const confirmReplace = async () => {
    if (!valgtDeltager || valgtEtappe == null || !pendingReplace) {
      setConfirmReplaceOpen(false);
      setPendingReplace(null);
      return;
    }
    if (pendingReplace.kind === 'SET_START') {
      // remove status and store the start time
      setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'NONE');
      const ok = await storeStartTime(valgtDeltager, pendingReplace.time);
      if (ok) showMessage(`Start-tid ${pendingReplace.time} registrert for #${valgtDeltager.startnummer}`);
      else showMessage('Kunne ikke lagre start-tid til backend');
    } else if (pendingReplace.kind === 'SET_STATUS') {
      // remove existing starttid and set status
      await deleteStartTime(valgtDeltager.startnummer, valgtEtappe);
      setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, pendingReplace.status);
      showMessage(`${pendingReplace.status} registrert for #${valgtDeltager.startnummer}`);
      setShowManual(false); setManualInput('');
    }
    setPendingReplace(null);
    setConfirmReplaceOpen(false);
  };

  const cancelReplace = () => {
    setPendingReplace(null);
    setConfirmReplaceOpen(false);
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
          // Mirror button behavior: if there's an existing start time, ask for confirmation
          if (existingEtappeStart) {
            setPendingReplace({ kind: 'SET_STATUS', status: 'DNS' });
            setConfirmReplaceOpen(true);
            return;
          }
          setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'DNS');
          deleteStartTime(valgtDeltager.startnummer, valgtEtappe).then(() => {
            showMessage(`DNS registrert for #${valgtDeltager.startnummer}`);
          }).catch(() => {
            showMessage(`DNS registrert (lokalt) for #${valgtDeltager.startnummer}`);
          });
        }
      } else if (e.key === 'Escape') {
        if (showManual) { setShowManual(false); setManualInput(''); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, valgtDeltager, showManual, confirmOverrideOpen, valgtEtappe, setEtappeStatus, editDeltager, showMessage, registerNow, saveManual, deleteStartTime, existingEtappeStart]);

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
    const valgtEtappeObj = Array.isArray(etapper) ? etapper.find(e => e.nummer === valgtEtappe) : undefined;
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
            const faktiskStarttid = valgtEtappe != null ? option.resultater?.[valgtEtappe - 1]?.starttid : '';
            
            let statusChip: React.ReactNode = null;
            if (status === 'DNS') statusChip = <Chip label="DNS" color="error" size="small" sx={{ ml: 1 }} />;
            else if (status === 'DNF') statusChip = <Chip label="DNF" color="warning" size="small" sx={{ ml: 1 }} />;
            
            // Vis kun faktisk starttid (fra etappe-resultater), ikke planlagt starttid
            const timeChip = faktiskStarttid && status !== 'DNS' && status !== 'DNF'
              ? <Chip label={faktiskStarttid} color="success" size="small" sx={{ ml: 1 }} />
              : null;
            
            return (
              <li
                {...props}
                key={option.startnummer}
                style={{ display: 'flex', alignItems: 'center', ...(faktiskStarttid ? { fontWeight: 600 } : {}) }}
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
              InputProps={{
                ...params.InputProps,
                readOnly: true,
                sx: {
                  cursor: 'pointer',
                  '& input': {
                    cursor: 'pointer !important',
                    caretColor: 'transparent'
                  }
                }
              }}
            />
          )}
          sx={{ mb: 3 }}
          isOptionEqualToValue={(opt, val) => opt.startnummer === val?.startnummer}
        />
        {valgtDeltager && (
          <Stack spacing={2}>
            <Typography variant="subtitle1">#{valgtDeltager.startnummer} {valgtDeltager.navn}</Typography>
            <Typography variant="body2" color="text.secondary">
              {existingEtappeStart && existingEtappeStatus !== 'DNS' && existingEtappeStatus !== 'DNF'
                ? `Eksisterende start-tid (etappe): ${existingEtappeStart}`
                : 'Ingen start-tid registrert for etappen'}
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
              {existingEtappeStart ? 'Overskriv start-tid = nå' : 'Registrer start-tid = nå'}
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
                  label="Manuell start-tid (hhmm)"
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
                  // If there is already a registered starttid for this etappe, confirm before replacing it with DNS
                  if (existingEtappeStart) {
                    setPendingReplace({ kind: 'SET_STATUS', status: 'DNS' });
                    setConfirmReplaceOpen(true);
                    return;
                  }
                  // No existing starttid -> set DNS and ensure resultater cleared
                  setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'DNS');
                  deleteStartTime(valgtDeltager.startnummer, valgtEtappe);
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
                  if (existingEtappeStart) {
                    setPendingReplace({ kind: 'SET_STATUS', status: 'DNF' });
                    setConfirmReplaceOpen(true);
                    return;
                  }
                  setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'DNF');
                  deleteStartTime(valgtDeltager.startnummer, valgtEtappe);
                  showMessage(`DNF registrert for #${valgtDeltager.startnummer}`);
                  setShowManual(false); setManualInput('');
                }
              }}
            >
              {isDNF ? 'Fjern DNF' : 'Sett DNF'}
            </Button>
            {/* Slett starttid knapp - kun vis hvis det finnes en starttid */}
            {existingEtappeStart && (
              <Button
                variant="outlined"
                color="error"
                size="large"
                sx={{ py: 1.5, fontSize: 18 }}
                onClick={() => {
                  if (!valgtDeltager || valgtEtappe == null) return;
                  setConfirmDeleteOpen(true);
                }}
              >
                🗑️ Slett start-tid
              </Button>
            )}
            {message && <Typography color="success.main">{message}</Typography>}
          </Stack>
        )}
        <ReplaceConfirmDialog
          open={confirmReplaceOpen}
          pendingReplace={pendingReplace as any}
          existingTime={existingEtappeStart}
          existingStatus={existingEtappeStatus}
          onConfirm={confirmReplace}
          onCancel={cancelReplace}
        />
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
        <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
          <DialogTitle>Bekreft sletting av start-tid</DialogTitle>
          <DialogContent>
            <Typography>Er du sikker på at du vil slette start-tiden for denne etappen?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteOpen(false)}>Avbryt</Button>
            <Button variant="contained" onClick={() => {
              if (!valgtDeltager || valgtEtappe == null) return;
              deleteStartTime(valgtDeltager.startnummer, valgtEtappe);
              showMessage(`Start-tid slettet for #${valgtDeltager.startnummer}`);
              setShowManual(false);
              setManualInput('');
              setConfirmDeleteOpen(false);
            }}>Bekreft sletting</Button>
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
