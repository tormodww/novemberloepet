import React, { useState } from 'react';
import { useDeltagerContext, Deltager, EtappeResultat } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';
import { Box, Typography, TextField, Button, Stack, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from '@mui/material';
import { usePersistentState } from '../hooks/usePersistentState';
import { useEphemeralMessage } from '../hooks/useEphemeralMessage';

// Formatterer manuell målgangstid fra rå tall (mmss eller hhmmss) til mm:ss eller hh:mm:ss
function formatManualFinish(raw: string): string | null {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length < 3) return null; // for kort
  if (digits.length <= 4) { // mmss
    const padded = digits.padStart(4, '0');
    return `${padded.slice(0,2)}:${padded.slice(2,4)}`; // mm:ss
  }
  // 5 eller 6 siffer => hh:mm:ss
  const padded = digits.padStart(6, '0');
  return `${padded.slice(0,2)}:${padded.slice(2,4)}:${padded.slice(4,6)}`;
}

const FinishTimeRegister: React.FC = () => {
  const { deltagere, editDeltager, setEtappeStatus } = useDeltagerContext();
  const { etapper } = useEtappeContext();

  const [step, setStep] = usePersistentState<number>('finishtime.step', 1);
  const [etappe, setEtappe] = usePersistentState<number | null>('finishtime.etappe', null);
  const [valgtDeltager, setValgtDeltager] = useState<Deltager | null>(null);
  const { message, showMessage, clear } = useEphemeralMessage(3500);
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [confirmOverrideOpen, setConfirmOverrideOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'NOW' | 'MANUAL' | null>(null);

  const existingEtappeFinish = (() => {
    if (!valgtDeltager || etappe == null) return '';
    return valgtDeltager.resultater?.[etappe - 1]?.maltid || '';
  })();
  const existingEtappeStatus = (() => {
    if (!valgtDeltager || etappe == null) return '';
    return valgtDeltager.resultater?.[etappe - 1]?.status || '';
  })();

  const handleRegisterNow = () => {
    if (!valgtDeltager || etappe == null) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const tid = `${hh}:${mm}:${ss}`;
    if (existingEtappeFinish) { // krever bekreftelse
      setPendingAction('NOW');
      setConfirmOverrideOpen(true);
      return;
    }
    persistFinishTime(valgtDeltager, tid);
    showMessage(`Sluttid ${tid} registrert for #${valgtDeltager.startnummer}`);
    resetManual();
  };

  const persistFinishTime = (d: Deltager, maltid: string) => {
    if (etappe == null) return;
    const ETAPPER = etapper.length;
    const nyeResultater: EtappeResultat[] = Array.from({ length: ETAPPER }, (_, i) =>
      d.resultater?.[i] || { etappe: i + 1, starttid: '', maltid: '', idealtid: '', diff: '' }
    );
    const idx = etappe - 1;
    nyeResultater[idx] = { ...nyeResultater[idx], maltid };
    editDeltager(d.navn, { resultater: nyeResultater });
  };

  const handleManualSave = () => {
    if (!valgtDeltager || etappe == null) return;
    const formatted = formatManualFinish(manualInput);
    if (!formatted) return;
    const finalTime = formatted.length === 5 ? `00:${formatted}` : formatted;
    if (existingEtappeFinish) {
      setPendingAction('MANUAL');
      setConfirmOverrideOpen(true);
      return;
    }
    persistFinishTime(valgtDeltager, finalTime);
    showMessage(`Sluttid ${formatted} registrert for #${valgtDeltager.startnummer}`);
    resetManual();
  };

  const resetManual = () => { setShowManual(false); setManualInput(''); };

  const registerStatus = (status: 'DNS' | 'DNF') => {
    if (!valgtDeltager || etappe == null) return;
    setEtappeStatus(valgtDeltager.startnummer, etappe, status);
    showMessage(`${status} registrert for #${valgtDeltager.startnummer}`);
    resetManual();
  };

  const confirmOverride = () => {
    if (!valgtDeltager || !pendingAction || etappe == null) { setConfirmOverrideOpen(false); return; }
    if (pendingAction === 'NOW') {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const tid = `${hh}:${mm}:${ss}`;
      persistFinishTime(valgtDeltager, tid);
      showMessage(`Sluttid oppdatert til ${tid}`);
    } else if (pendingAction === 'MANUAL') {
      const formatted = formatManualFinish(manualInput);
      if (formatted) {
        const finalTime = formatted.length === 5 ? `00:${formatted}` : formatted;
        persistFinishTime(valgtDeltager, finalTime);
        showMessage(`Sluttid oppdatert til ${formatted}`);
        resetManual();
      }
    }
    setPendingAction(null);
    setConfirmOverrideOpen(false);
  };
  const cancelOverride = () => { setPendingAction(null); setConfirmOverrideOpen(false); };

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
              color={etappe === e.nummer ? 'primary' : 'inherit'}
              sx={{ py: 2, fontSize: 20 }}
              onClick={() => { setEtappe(e.nummer); setStep(2); setValgtDeltager(null); clear(); resetManual(); }}
            >
              {e.navn}
            </Button>
          ))}
        </Stack>
      </Box>
    );
  }

  // Steg 2: Deltager & handlinger
  if (step === 2 && etappe !== null) {
    const isDNS = existingEtappeStatus === 'DNS';
    const isDNF = existingEtappeStatus === 'DNF';
    const valgtEtappeObj = etapper.find(e => e.nummer === etappe);
    return (
      <Box sx={{ p: 2, maxWidth: 420, mx: 'auto' }}>
        {/* Ny etappe-header */}
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Etappe {etappe}{valgtEtappeObj?.navn ? `: ${valgtEtappeObj.navn}` : ''}
        </Typography>
        <Typography variant="h6" gutterBottom>Velg deltager</Typography>
        <Button variant="outlined" sx={{ mb: 2 }} onClick={() => { setStep(1); clear(); resetManual(); }}>Bytt etappe</Button>
        <Autocomplete
          options={deltagere.filter(d => !!d.startnummer)}
          getOptionLabel={d => `#${d.startnummer} ${d.navn}`}
          value={valgtDeltager}
          onChange={(_, ny) => { setValgtDeltager(ny); clear(); resetManual(); }}
          renderOption={(props, option) => {
            const status = etappe != null ? option.resultater?.[etappe - 1]?.status : undefined;
            let chip: React.ReactNode = null;
            if (status === 'DNS') chip = <Chip label="DNS" color="error" size="small" sx={{ ml: 1 }} />;
            else if (status === 'DNF') chip = <Chip label="DNF" color="warning" size="small" sx={{ ml: 1 }} />;
            return (
              <li {...props} key={option.startnummer} style={{ display: 'flex', alignItems: 'center' }}>
                <span>#{option.startnummer} {option.navn}</span>{chip}
              </li>
            );
          }}
          renderInput={params => (
            <TextField {...params} label="Startnummer eller navn" variant="outlined" fullWidth />
          )}
          sx={{ mb: 3 }}
          isOptionEqualToValue={(opt, val) => opt.startnummer === val?.startnummer}
        />
        {valgtDeltager && (
          <Stack spacing={2}>
            <Typography variant="subtitle1">#{valgtDeltager.startnummer} {valgtDeltager.navn}</Typography>
            <Typography variant="body2" color="text.secondary">
              {existingEtappeFinish ? `Eksisterende sluttid: ${existingEtappeFinish}` : 'Ingen sluttid registrert'}
            </Typography>
            {existingEtappeStatus && existingEtappeStatus !== 'NONE' && (
              <Typography variant="body2" color="text.secondary">Status: {existingEtappeStatus}</Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ py: 2, fontSize: 20 }}
              onClick={handleRegisterNow}
            >
              {existingEtappeFinish ? 'Overskriv sluttid = nå' : 'Registrer sluttid = nå'}
            </Button>
            <Button
              variant="contained"
              color={isDNS ? 'warning' : 'error'}
              size="large"
              sx={{ py: 2, fontSize: 20 }}
              onClick={() => {
                if (!valgtDeltager || etappe == null) return;
                if (isDNS) {
                  setEtappeStatus(valgtDeltager.startnummer, etappe, 'NONE');
                  showMessage(`DNS fjernet for #${valgtDeltager.startnummer}`);
                } else {
                  setEtappeStatus(valgtDeltager.startnummer, etappe, 'DNS');
                  showMessage(`DNS registrert for #${valgtDeltager.startnummer}`);
                }
                resetManual();
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
                if (!valgtDeltager || etappe == null) return;
                if (isDNF) {
                  // Fjern DNF og behold maltid tom
                  setEtappeStatus(valgtDeltager.startnummer, etappe, 'NONE');
                  showMessage(`DNF fjernet for #${valgtDeltager.startnummer}`);
                } else {
                  // Sett DNF og null ut sluttid for konsistens (regelvalg: DNF = ingen sluttid)
                  const ETAPPER = etapper.length;
                  const nye: EtappeResultat[] = Array.from({ length: ETAPPER }, (_, i) => valgtDeltager.resultater?.[i] || { etappe: i + 1, starttid: '', maltid: '', idealtid: '', diff: '' });
                  const idx = etappe - 1;
                  nye[idx] = { ...nye[idx], maltid: '' };
                  editDeltager(valgtDeltager.navn, { resultater: nye });
                  setEtappeStatus(valgtDeltager.startnummer, etappe, 'DNF');
                  showMessage(`DNF registrert for #${valgtDeltager.startnummer}`);
                }
                resetManual();
              }}
            >
              {isDNF ? 'Fjern DNF' : 'Sett DNF'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ py: 1.5, fontSize: 18 }}
              onClick={() => setShowManual(s => !s)}
            >
              {showManual ? 'Avbryt manuell registrering' : 'Korriger / sett tid manuelt'}
            </Button>
            {showManual && (
              <Stack spacing={1}>
                <TextField
                  label="Manuell sluttid (mmss / hhmmss)"
                  helperText="Eksempel: 932 → 09:32, 73015 → 07:30:15"
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  inputMode="numeric"
                />
                <Button
                  variant="contained"
                  disabled={!formatManualFinish(manualInput)}
                  onClick={handleManualSave}
                >Lagre manuell tid</Button>
              </Stack>
            )}
            {message && <Typography color="success.main">{message}</Typography>}
            <Button
              variant="text"
              onClick={() => { setValgtDeltager(null); clear(); resetManual(); }}
              sx={{ mt: 1 }}
            >
              Registrer en annen deltager
            </Button>
          </Stack>
        )}
        <Dialog open={confirmOverrideOpen} onClose={cancelOverride}>
          <DialogTitle>Overskriv eksisterende sluttid?</DialogTitle>
          <DialogContent>
            <Typography>Det finnes allerede en sluttid ({existingEtappeFinish}). Vil du overskrive den?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelOverride}>Avbryt</Button>
            <Button variant="contained" onClick={confirmOverride}>Overskriv</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return null;
};

export default FinishTimeRegister;
