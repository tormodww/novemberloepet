import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import React from 'react';

import { FinishTimeStepDeltagerProps } from './FinishTimeStepDeltager';

const FinishTimeStepDeltager: React.FC<FinishTimeStepDeltagerProps> = ({
  etapper,
  etappe,
  valgtDeltager,
  showManual,
  setShowManual,
  manualInput,
  setManualInput,
  handleRegisterNow,
  handleManualSave,
  formatManualFinish,
  existingEtappeFinish,
  resetManual,
  confirmOverrideOpen,
  confirmOverride,
  cancelOverride,
  confirmEtappeChangeOpen,
  setConfirmEtappeChangeOpen,
  setStep,
  clear,
  confirmDeleteOpen,
  setConfirmDeleteOpen,
  deleteFinishTime,
  message,
}) => {
  return (
    <Box as="section" aria-label="Registrer sluttid for deltager" sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Steg 2: Registrer sluttid for deltager
      </Typography>
      {valgtDeltager ? (
        <Box mb={2}>
          <Typography variant="subtitle1">
            Deltager: <strong>{valgtDeltager.navn}</strong> #{valgtDeltager.startnummer}
          </Typography>
          <Typography variant="body2">
            Etappe: <strong>{etapper.find(e => e.id === etappe)?.navn ?? etappe}</strong>
          </Typography>
          {existingEtappeFinish && (
            <Chip label={`Eksisterende sluttid: ${existingEtappeFinish}`} color="info" sx={{ mt: 1 }} />
          )}
        </Box>
      ) : (
        <Typography color="error" mb={2}>Ingen deltager valgt</Typography>
      )}
      <Stack direction="row" spacing={2} mb={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRegisterNow}
          disabled={!valgtDeltager || etappe == null}
          aria-label="Registrer sluttid nå"
        >
          Registrer sluttid nå
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => setShowManual(true)}
          disabled={!valgtDeltager || etappe == null}
          aria-label="Registrer manuell sluttid"
        >
          Manuell sluttid
        </Button>
      </Stack>
      {showManual && (
        <Box mb={2}>
          <TextField
            label="Manuell sluttid (mmss eller hhmmss)"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            aria-label="Manuell sluttid"
            sx={{ mr: 2 }}
          />
          <Button
            variant="contained"
            color="success"
            onClick={handleManualSave}
            disabled={!manualInput || !valgtDeltager}
            aria-label="Lagre manuell sluttid"
          >
            Lagre
          </Button>
          <Button
            variant="text"
            color="inherit"
            onClick={resetManual}
            aria-label="Avbryt manuell registrering"
          >
            Avbryt
          </Button>
          {manualInput && (
            <Typography variant="caption" color={formatManualFinish(manualInput) ? 'textSecondary' : 'error'}>
              {formatManualFinish(manualInput) ? `Formatert: ${formatManualFinish(manualInput)}` : 'Ugyldig format'}
            </Typography>
          )}
        </Box>
      )}
      {message && (
        <Typography color="success.main" mb={2} role="status">{message}</Typography>
      )}
      {/* Dialog for overskriving */}
      <Dialog open={confirmOverrideOpen} onClose={cancelOverride} aria-labelledby="dialog-override-title">
        <DialogTitle id="dialog-override-title">Overskriv sluttid?</DialogTitle>
        <DialogContent>
          <Typography>Det finnes allerede en sluttid for denne deltageren. Vil du overskrive?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelOverride} color="inherit">Avbryt</Button>
          <Button onClick={confirmOverride} color="primary">Overskriv</Button>
        </DialogActions>
      </Dialog>
      {/* Dialog for etappebytte */}
      <Dialog open={confirmEtappeChangeOpen} onClose={() => setConfirmEtappeChangeOpen(false)} aria-labelledby="dialog-etappe-title">
        <DialogTitle id="dialog-etappe-title">Bytt etappe?</DialogTitle>
        <DialogContent>
          <Typography>Er du sikker på at du vil bytte etappe? Ulagrede data kan gå tapt.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmEtappeChangeOpen(false)} color="inherit">Avbryt</Button>
          <Button onClick={() => { setStep(1); clear(); setConfirmEtappeChangeOpen(false); }} color="primary">Bytt etappe</Button>
        </DialogActions>
      </Dialog>
      {/* Dialog for sletting */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} aria-labelledby="dialog-delete-title">
        <DialogTitle id="dialog-delete-title">Slett sluttid?</DialogTitle>
        <DialogContent>
          <Typography>Er du sikker på at du vil slette sluttiden for denne deltageren?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} color="inherit">Avbryt</Button>
          <Button onClick={() => { if (valgtDeltager) deleteFinishTime(valgtDeltager.startnummer, etappe); setConfirmDeleteOpen(false); }} color="error">Slett</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinishTimeStepDeltager;