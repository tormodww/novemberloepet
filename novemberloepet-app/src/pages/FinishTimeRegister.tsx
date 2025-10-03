import React from 'react';

import { useFinishTimeLogic } from '../hooks/useFinishTimeLogic';
import { formatManualFinish } from '../utils/validation';
import FinishTimeStepDeltager from './FinishTimeStepDeltager';
import FinishTimeStepEtappe from './FinishTimeStepEtappe';

const FinishTimeRegister: React.FC = () => {
  const logic = useFinishTimeLogic();

  // Steg 1: Etappevalg
  if (logic.step === 1) {
    return (
      <FinishTimeStepEtappe
        etapper={logic.etapper}
        etappe={logic.etappe}
        setEtappe={logic.setEtappe}
        setStep={logic.setStep}
        setValgtDeltager={logic.setValgtDeltager}
        clear={logic.clear}
        resetManual={logic.resetManual}
      />
    );
  }

  // Steg 2: Deltager & handlinger
  if (logic.step === 2 && logic.etappe !== null) {
    return (
      <FinishTimeStepDeltager
        deltagere={logic.deltagere}
        etapper={logic.etapper}
        etappe={logic.etappe}
        valgtDeltager={logic.valgtDeltager}
        setValgtDeltager={logic.setValgtDeltager}
        autoInputRef={logic.autoInputRef}
        manualInputRef={logic.manualInputRef}
        showManual={logic.showManual}
        setShowManual={logic.setShowManual}
        manualInput={logic.manualInput}
        setManualInput={logic.setManualInput}
        handleRegisterNow={logic.handleRegisterNow}
        handleManualSave={logic.handleManualSave}
        formatManualFinish={formatManualFinish}
        existingEtappeFinish={logic.existingEtappeFinish}
        existingEtappeStatus={logic.existingEtappeStatus}
        setEtappeStatus={logic.setEtappeStatus}
        showMessage={logic.showMessage}
        resetManual={logic.resetManual}
        editDeltager={logic.editDeltager}
        confirmOverrideOpen={logic.confirmOverrideOpen}
        setConfirmOverrideOpen={logic.setConfirmOverrideOpen}
        pendingAction={logic.pendingAction}
        setPendingAction={logic.setPendingAction}
        confirmOverride={logic.confirmOverride}
        cancelOverride={logic.cancelOverride}
        confirmEtappeChangeOpen={logic.confirmEtappeChangeOpen}
        setConfirmEtappeChangeOpen={logic.setConfirmEtappeChangeOpen}
        setStep={logic.setStep}
        clear={logic.clear}
        confirmDeleteOpen={logic.confirmDeleteOpen}
        setConfirmDeleteOpen={logic.setConfirmDeleteOpen}
        deleteFinishTime={logic.deleteFinishTime}
        message={logic.message}
      />
    );
  }

  return null;
};

export default FinishTimeRegister;