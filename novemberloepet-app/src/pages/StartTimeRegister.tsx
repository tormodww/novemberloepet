import { Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import ReplaceConfirmDialog from '../components/common/ReplaceConfirmDialog';
import { Deltager, useDeltagerContext } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';
import { useEphemeralMessage } from '../hooks/useEphemeralMessage';
import { usePersistentState } from '../hooks/usePersistentState';
import { formatManualFinish } from '../lib/timeFormat';

const StartTimeRegister: React.FC = () => {
  // This component now handles start-tid (start time) semantics
  const { deltagere, editDeltager, setEtappeStatus, updateStartTime, deleteStartTime, reloadDeltagere } = useDeltagerContext();
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
  // Unified replace confirmation for start-tid <-> DNS/DNF
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
    return (res as any)?.starttid || '';
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
    // If participant currently has DNS/DNF for this etappe, confirm before replacing it with a start time
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
    console.log('StartTimeRegister.registerNow -> storing start-time', { startnummer: valgtDeltager.startnummer, etappe: valgtEtappe, tid });
    showMessage('Lagrer start-tid...');
    const ok = await storeStartTime(valgtDeltager, tid);
    console.log('StartTimeRegister.registerNow -> result', { ok });
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
    const formatted = formatManualFinish(manualInput);
    if (!formatted) { showMessage('Ugyldig manuell tid'); return; }
    // If participant currently has DNS/DNF for this etappe, confirm before replacing it with a start time
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
    console.log('StartTimeRegister.saveManual -> storing manual start-time', { startnummer: valgtDeltager.startnummer, etappe: valgtEtappe, formatted });
    showMessage('Lagrer manuell start-tid...');
    const ok = await storeStartTime(valgtDeltager, formatted);
    console.log('StartTimeRegister.saveManual -> result', { ok });
    if (ok) {
      // optimistic update so UI shows the saved start time immediately
      setValgtDeltager(prev => {
        if (!prev) return prev;
        const results = Array.isArray(prev.resultater) ? [...prev.resultater] : [];
        const idx = Math.max(0, valgtEtappe - 1);
        const existing = results[idx] || { etappe: idx + 1, starttid: '', sluttTid: '', idealtid: '', diff: '' } as any;
        results[idx] = { ...existing, starttid: formatted } as any;
        return { ...prev, resultater: results } as Deltager;
      });
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
      // remove status and store start time
      setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'NONE');
      const ok = await storeStartTime(valgtDeltager, pendingReplace.time);
      if (ok) showMessage(`Start-tid ${pendingReplace.time} registrert for #${valgtDeltager.startnummer}`);
      else showMessage('Kunne ikke lagre start-tid til backend');
    } else if (pendingReplace.kind === 'SET_STATUS') {
      // remove existing start-tid and set status
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
      } else if (e.key.toLowerCase() === 'f') {
        if (valgtEtappe != null) {
          // Mark as START (here we reuse FINISH semantics to set a status meaning 'FINISH' in original app, keep same status name)
          setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'FINISH');
          deleteStartTime(valgtDeltager.startnummer, valgtEtappe).then(() => {
            showMessage(`Start registrert for #${valgtDeltager.startnummer}`);
          }).catch(() => {
            showMessage(`Start registrert (lokalt) for #${valgtDeltager.startnummer}`);
          });
        }
      } else if (e.key === 'Escape') {
        if (showManual) { setShowManual(false); setManualInput(''); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, valgtDeltager, showManual, confirmOverrideOpen, valgtEtappe, setEtappeStatus, editDeltager, showMessage, registerNow, saveManual, deleteStartTime]);

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
          options={deltagere}
          getOptionLabel={d => `#${d.startnummer} ${d.navn}`}
          value={valgtDeltager}
          onChange={(_, ny) => { setValgtDeltager(ny); setTimeout(() => autoInputRef.current?.blur(), 0); }}
          onOpen={reloadDeltagere}
          renderOption={(props, option) => {
            const res = valgtEtappe != null ? option.resultater?.[valgtEtappe - 1] : undefined;
            const status = res?.status;
            const faktiskStartTid = res?.starttid;

            let statusChip: React.ReactNode = null;
            if (status === 'DNS') statusChip = <Chip label="DNS" color="error" size="small" sx={{ ml: 1 }} />;
            else if (status === 'DNF') statusChip = <Chip label="DNF" color="warning" size="small" sx={{ ml: 1 }} />;

            // Vis start-tid-chip bare hvis det finnes en start-tid og status ikke er DNS/DNF
            const timeChip = faktiskStartTid && status !== 'DNS' && status !== 'DNF'
              ? <Chip label={faktiskStartTid} color="success" size="small" sx={{ ml: 1 }} />
              : null;

            return (
              <li
                {...props}
                key={option.startnummer}
                style={{ display: 'flex', alignItems: 'center', ...(faktiskStartTid ? { fontWeight: 600 } : {}) }}
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
            {/* Flyttet manuell toggle rett under registrer-knappen. Button opens manual input; cancel removed. */}
            <Button
              variant="outlined"
              size="large"
              sx={{ py: 1.5, fontSize: 18 }}
              onClick={() => { setShowManual(true); }}
            >
              Korriger / sett tid manuelt
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
                  // If there is already a registered start-tid for this etappe, confirm before replacing it with DNS
                  if (existingEtappeStart) {
                    setPendingReplace({ kind: 'SET_STATUS', status: 'DNS' });
                    setConfirmReplaceOpen(true);
                    return;
                  }
                  setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'DNS');
                  // Clear etappe start-tid via deleteStartTime so the resultater entry is updated and persisted.
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
            {/* Slett start-tid knapp - kun vis hvis det finnes en start-tid */}
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
        <Dialog open={confirmOverrideOpen} onClose={() => { setPendingAction(null); setConfirmOverrideOpen(false); }}>
          <DialogTitle>Overskriv eksisterende start-tid?</DialogTitle>
          <DialogContent>
            <Typography>Det finnes allerede en start-tid for denne etappen ({existingEtappeStart}). Vil du overskrive den?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setPendingAction(null); setConfirmOverrideOpen(false); }}>Avbryt</Button>
            <Button variant="contained" onClick={async () => {
              if (!valgtDeltager || !pendingAction || valgtEtappe == null) { setPendingAction(null); setConfirmOverrideOpen(false); return; }
              const now = new Date();
              const hh = String(now.getHours()).padStart(2, '0');
              const mm = String(now.getMinutes()).padStart(2, '0');
              if (pendingAction === 'NOW') {
                const tid = `${hh}:${mm}`;
                const ok = await storeStartTime(valgtDeltager, tid);
                if (ok) { showMessage(`Start-tid oppdatert til ${tid}`); localStorage.clear(); }
                else { showMessage('Kunne ikke lagre start-tid til backend'); }
              } else if (pendingAction === 'MANUAL') {
                const formatted = formatManualFinish(manualInput);
                if (formatted) {
                  const ok = await storeStartTime(valgtDeltager, formatted);
                  if (ok) { showMessage(`Start-tid oppdatert til ${formatted}`); setManualInput(''); setShowManual(false); localStorage.clear(); }
                  else { showMessage('Kunne ikke lagre start-tid til backend'); }
                }
              }
              setPendingAction(null);
              setConfirmOverrideOpen(false);
            }}>Overskriv</Button>
          </DialogActions>
        </Dialog>
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
