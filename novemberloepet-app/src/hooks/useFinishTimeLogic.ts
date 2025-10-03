import { useEffect,useRef, useState } from 'react';

import { Deltager, useDeltagerContext } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';
import { formatManualFinish } from '../utils/validation';
import { useEphemeralMessage } from './useEphemeralMessage';
import { usePersistentState } from './usePersistentState';

export function useFinishTimeLogic() {
  const { deltagere, editDeltager, setEtappeStatus, updateFinishTime, deleteFinishTime } = useDeltagerContext();
  const { etapper } = useEtappeContext();

  const [step, setStep] = usePersistentState<number>('finishtime.step', 1);
  const [etappe, setEtappe] = usePersistentState<number | null>('finishtime.etappe', null);
  const [valgtDeltager, setValgtDeltager] = useState<Deltager | null>(null);
  const { message, showMessage, clear } = useEphemeralMessage(3500);
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [confirmOverrideOpen, setConfirmOverrideOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'NOW' | 'MANUAL' | null>(null);
  const [valgtDeltagerStartnummer, setValgtDeltagerStartnummer] = usePersistentState<string | null>('finishtime.selectedStartnummer', null);
  const [confirmEtappeChangeOpen, setConfirmEtappeChangeOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const autoInputRef = useRef<HTMLInputElement | null>(null);
  const manualInputRef = useRef<HTMLInputElement | null>(null);
  const isUpdatingRef = useRef(false);

  const existingEtappeFinish = (() => {
    if (!valgtDeltager || etappe == null) return '';
    // Use canonical sluttTid
    return valgtDeltager.resultater?.[etappe - 1]?.sluttTid || '';
  })();
  const existingEtappeStatus = (() => {
    if (!valgtDeltager || etappe == null) return '';
    return valgtDeltager.resultater?.[etappe - 1]?.status || '';
  })();

  useEffect(() => {
    if (isUpdatingRef.current) return;
    if (!valgtDeltagerStartnummer) { 
      setValgtDeltager(null); 
      return; 
    }
    const found = deltagere.find(d => d.startnummer === valgtDeltagerStartnummer) || null;
    setValgtDeltager(found);
  }, [deltagere, valgtDeltagerStartnummer]);

  useEffect(() => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    const newStartnummer = valgtDeltager ? valgtDeltager.startnummer : null;
    if (valgtDeltagerStartnummer !== newStartnummer) {
      setValgtDeltagerStartnummer(newStartnummer);
    }
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, [valgtDeltager, setValgtDeltagerStartnummer, valgtDeltagerStartnummer]);

  const handleRegisterNow = () => {
    if (!valgtDeltager || etappe == null) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const tid = `${hh}:${mm}:${ss}`;
    if (existingEtappeFinish) {
      setPendingAction('NOW');
      setConfirmOverrideOpen(true);
      return;
    }
    updateFinishTime(valgtDeltager.startnummer, etappe, tid);
    showMessage(`Sluttid ${tid} registrert for #${valgtDeltager.startnummer}`);
    setShowManual(false);
    setManualInput('');
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
    updateFinishTime(valgtDeltager.startnummer, etappe, finalTime);
    showMessage(`Sluttid ${formatted} registrert for #${valgtDeltager.startnummer}`);
    setShowManual(false);
    setManualInput('');
  };

  const resetManual = () => { 
    setShowManual(false); 
    setManualInput(''); 
  };

  const confirmOverride = () => {
    if (!valgtDeltager || !pendingAction || etappe == null) { 
      setConfirmOverrideOpen(false); 
      return; 
    }
    if (pendingAction === 'NOW') {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const tid = `${hh}:${mm}:${ss}`;
      updateFinishTime(valgtDeltager.startnummer, etappe, tid);
      showMessage(`Sluttid oppdatert til ${tid}`);
    } else if (pendingAction === 'MANUAL') {
      const formatted = formatManualFinish(manualInput);
      if (formatted) {
        const finalTime = formatted.length === 5 ? `00:${formatted}` : formatted;
        updateFinishTime(valgtDeltager.startnummer, etappe, finalTime);
        showMessage(`Sluttid oppdatert til ${formatted}`);
        setShowManual(false);
        setManualInput('');
      }
    }
    setPendingAction(null);
    setConfirmOverrideOpen(false);
  };

  const cancelOverride = () => { setPendingAction(null); setConfirmOverrideOpen(false); };

  useEffect(() => {
    if (showManual) {
      setTimeout(() => manualInputRef.current?.focus(), 0);
    }
  }, [showManual]);

  return {
    deltagere,
    editDeltager,
    setEtappeStatus,
    updateFinishTime,
    deleteFinishTime,
    etapper,
    step,
    setStep,
    etappe,
    setEtappe,
    valgtDeltager,
    setValgtDeltager,
    message,
    showMessage,
    clear,
    showManual,
    setShowManual,
    manualInput,
    setManualInput,
    confirmOverrideOpen,
    setConfirmOverrideOpen,
    pendingAction,
    setPendingAction,
    valgtDeltagerStartnummer,
    setValgtDeltagerStartnummer,
    confirmEtappeChangeOpen,
    setConfirmEtappeChangeOpen,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    autoInputRef,
    manualInputRef,
    isUpdatingRef,
    existingEtappeFinish,
    existingEtappeStatus,
    handleRegisterNow,
    handleManualSave,
    resetManual,
    confirmOverride,
    cancelOverride,
  };
}