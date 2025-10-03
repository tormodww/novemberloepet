import { Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import ReplaceConfirmDialog from '../components/common/ReplaceConfirmDialog';
import { Deltager, useDeltagerContext } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';
import { useEphemeralMessage } from '../hooks/useEphemeralMessage';
import { usePersistentState } from '../hooks/usePersistentState';
import { formatManualStart } from '../lib/timeFormat';

const FinishTimeRegister: React.FC = () => {
  const { deltagere, editDeltager, setEtappeStatus, updateFinishTime, deleteFinishTime } = useDeltagerContext();
  const { etapper } = useEtappeContext();

  // Veiviser steg og valgt etappe/deltager
  const [step, setStep] = usePersistentState<number>('finishtime.step', 1);
  const [valgtEtappe, setValgtEtappe] = usePersistentState<number | null>('finishtime.etappe', null);
  const [valgtDeltager, setValgtDeltager] = useState<Deltager | null>(null);
  const { message, showMessage, clear } = useEphemeralMessage(3500);
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [confirmOverrideOpen, setConfirmOverrideOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'NOW' | 'MANUAL' | null>(null);
  const [valgtDeltagerStartnummer, setValgtDeltagerStartnummer] = usePersistentState<string | null>('finishtime.selectedStartnummer', null);
  const [confirmEtappeChangeOpen, setConfirmEtappeChangeOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  // Unified replace confirmation for slutt-tid <-> DNS/DNF
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
  const [pendingReplace, setPendingReplace] = useState<
    | { kind: 'SET_STATUS'; status: 'DNS' | 'DNF' }
    | { kind: 'SET_FINISH'; time: string }
    | null
  >(null);
  const autoInputRef = useRef<HTMLInputElement | null>(null);
  const manualInputRef = useRef<HTMLInputElement | null>(null);
  const isUpdatingRef = useRef(false);

  const existingEtappeFinish = (() => {
    if (valgtEtappe == null || !valgtDeltager) return '';
    const res = valgtDeltager.resultater?.[valgtEtappe - 1];
    return res?.sluttTid || '';
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

  const storeFinishTime = useCallback(async (d: Deltager, time: string) => {
    if (valgtEtappe == null) return false;
    const ok = await updateFinishTime(d.startnummer, valgtEtappe, time);
    return ok;
  }, [valgtEtappe, updateFinishTime]);

  const registerNow = useCallback(async () => {
    if (!valgtDeltager || valgtEtappe == null) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const tid = `${hh}:${mm}`;
    // If participant currently has DNS/DNF for this etappe, confirm before replacing it with a finish time
    if (existingEtappeStatus === 'DNS' || existingEtappeStatus === 'DNF') {
      setPendingReplace({ kind: 'SET_FINISH', time: tid });
      setConfirmReplaceOpen(true);
      return;
    }
    if (existingEtappeFinish) {
      setPendingAction('NOW');
      setConfirmOverrideOpen(true);
      return;
    }
    const ok = await storeFinishTime(valgtDeltager, tid);
    if (ok) {
      showMessage(`Slutt-tid ${tid} registrert for #${valgtDeltager.startnummer}`);
      localStorage.clear();
    } else {
      showMessage('Kunne ikke lagre slutt-tid til backend');
    }
    setShowManual(false); setManualInput('');
  }, [valgtDeltager, valgtEtappe, existingEtappeFinish, storeFinishTime, showMessage, existingEtappeStatus]);

  const saveManual = useCallback(async () => {
    if (!valgtDeltager || valgtEtappe == null) return;
    const formatted = formatManualStart(manualInput);
    if (!formatted) return;
    // If participant currently has DNS/DNF for this etappe, confirm before replacing it with a finish time
    if (existingEtappeStatus === 'DNS' || existingEtappeStatus === 'DNF') {
      setPendingReplace({ kind: 'SET_FINISH', time: formatted });
      setConfirmReplaceOpen(true);
      return;
    }
    if (existingEtappeFinish) {
      setPendingAction('MANUAL');
      setConfirmOverrideOpen(true);
      return;
    }
    const ok = await storeFinishTime(valgtDeltager, formatted);
    if (ok) {
      showMessage(`Slutt-tid ${formatted} registrert for #${valgtDeltager.startnummer}`);
      localStorage.clear();
    } else {
      showMessage('Kunne ikke lagre slutt-tid til backend');
    }
    setManualInput(''); setShowManual(false);
  }, [valgtDeltager, valgtEtappe, manualInput, existingEtappeFinish, storeFinishTime, showMessage, existingEtappeStatus]);

  // Confirm or cancel the pending replace action
  const confirmReplace = async () => {
    if (!valgtDeltager || valgtEtappe == null || !pendingReplace) {
      setConfirmReplaceOpen(false);
      setPendingReplace(null);
      return;
    }
    if (pendingReplace.kind === 'SET_FINISH') {
      // remove status and store finish time
      setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'NONE');
      const ok = await storeFinishTime(valgtDeltager, pendingReplace.time);
      if (ok) showMessage(`Slutt-tid ${pendingReplace.time} registrert for #${valgtDeltager.startnummer}`);
      else showMessage('Kunne ikke lagre slutt-tid til backend');
    } else if (pendingReplace.kind === 'SET_STATUS') {
      // remove existing slutt-tid and set status
      await deleteFinishTime(valgtDeltager.startnummer, valgtEtappe);
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
          // Mark as FINISH and clear any per-etappe sluttTid so UI/backend remain consistent
          setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'FINISH');
          deleteFinishTime(valgtDeltager.startnummer, valgtEtappe).then(() => {
            showMessage(`Finish registrert for #${valgtDeltager.startnummer}`);
          }).catch(() => {
            showMessage(`Finish registrert (lokalt) for #${valgtDeltager.startnummer}`);
          });
         }
       } else if (e.key === 'Escape') {
        if (showManual) { setShowManual(false); setManualInput(''); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, valgtDeltager, showManual, confirmOverrideOpen, valgtEtappe, setEtappeStatus, editDeltager, showMessage, registerNow, saveManual, deleteFinishTime]);

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

  // Steg 2: Velg deltager og registrer slutt-tid/FINISH
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
            const res = valgtEtappe != null ? option.resultater?.[valgtEtappe - 1] : undefined;
            const status = res?.status;
            const faktiskFinishTid = res?.sluttTid;

            let statusChip: React.ReactNode = null;
            if (status === 'DNS') statusChip = <Chip label="DNS" color="error" size="small" sx={{ ml: 1 }} />;
            else if (status === 'DNF') statusChip = <Chip label="DNF" color="warning" size="small" sx={{ ml: 1 }} />;

            // Vis slutt-tid-chip bare hvis det finnes en slutt-tid og status ikke er DNS/DNF
            const timeChip = faktiskFinishTid && status !== 'DNS' && status !== 'DNF'
              ? <Chip label={faktiskFinishTid} color="success" size="small" sx={{ ml: 1 }} />
              : null;

            return (
              <li
                {...props}
                key={option.startnummer}
                style={{ display: 'flex', alignItems: 'center', ...(faktiskFinishTid ? { fontWeight: 600 } : {}) }}
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
              {existingEtappeFinish && existingEtappeStatus !== 'DNS' && existingEtappeStatus !== 'DNF'
                ? `Eksisterende slutt-tid (etappe): ${existingEtappeFinish}`
                : 'Ingen slutt-tid registrert for etappen'}
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
              {existingEtappeFinish ? 'Overskriv slutt-tid = nå' : 'Registrer slutt-tid = nå'}
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
                  label="Manuell slutt-tid (hhmm)"
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
                  // If there is already a registered slutt-tid for this etappe, confirm before replacing it with DNS
                  if (existingEtappeFinish) {
                    setPendingReplace({ kind: 'SET_STATUS', status: 'DNS' });
                    setConfirmReplaceOpen(true);
                    return;
                  }
                  setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'DNS');
                  // Clear etappe slutt-tid via deleteFinishTime so the resultater entry is updated and persisted.
                  deleteFinishTime(valgtDeltager.startnummer, valgtEtappe);
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
                  if (existingEtappeFinish) {
                    setPendingReplace({ kind: 'SET_STATUS', status: 'DNF' });
                    setConfirmReplaceOpen(true);
                    return;
                  }
                  setEtappeStatus(valgtDeltager.startnummer, valgtEtappe, 'DNF');
                  deleteFinishTime(valgtDeltager.startnummer, valgtEtappe);
                  showMessage(`DNF registrert for #${valgtDeltager.startnummer}`);
                  setShowManual(false); setManualInput('');
                }
              }}
            >
              {isDNF ? 'Fjern DNF' : 'Sett DNF'}
            </Button>
            {/* Slett slutt-tid knapp - kun vis hvis det finnes en slutt-tid */}
            {existingEtappeFinish && (
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
                🗑️ Slett slutt-tid
              </Button>
            )}
            {message && <Typography color="success.main">{message}</Typography>}
          </Stack>
        )}
        <Dialog open={confirmOverrideOpen} onClose={() => { setPendingAction(null); setConfirmOverrideOpen(false); }}>
          <DialogTitle>Overskriv eksisterende slutt-tid?</DialogTitle>
          <DialogContent>
            <Typography>Det finnes allerede en slutt-tid for denne etappen ({existingEtappeFinish}). Vil du overskrive den?</Typography>
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
                const ok = await storeFinishTime(valgtDeltager, tid);
                if (ok) { showMessage(`Slutt-tid oppdatert til ${tid}`); localStorage.clear(); }
                else { showMessage('Kunne ikke lagre slutt-tid til backend'); }
              } else if (pendingAction === 'MANUAL') {
                const formatted = formatManualStart(manualInput);
                if (formatted) {
                  const ok = await storeFinishTime(valgtDeltager, formatted);
                  if (ok) { showMessage(`Slutt-tid oppdatert til ${formatted}`); setManualInput(''); setShowManual(false); localStorage.clear(); }
                  else { showMessage('Kunne ikke lagre slutt-tid til backend'); }
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
          existingTime={existingEtappeFinish}
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
          <DialogTitle>Bekreft sletting av slutt-tid</DialogTitle>
          <DialogContent>
            <Typography>Er du sikker på at du vil slette slutt-tiden for denne etappen?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteOpen(false)}>Avbryt</Button>
            <Button variant="contained" onClick={() => {
              if (!valgtDeltager || valgtEtappe == null) return;
              deleteFinishTime(valgtDeltager.startnummer, valgtEtappe);
              showMessage(`Slutt-tid slettet for #${valgtDeltager.startnummer}`);
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

export default FinishTimeRegister;
