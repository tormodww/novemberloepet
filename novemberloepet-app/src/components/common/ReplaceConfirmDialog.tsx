import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import React from 'react';

type PendingReplace =
  | { kind: 'SET_STATUS'; status: 'DNS' | 'DNF' }
  | { kind: 'SET_START'; time: string }
  | { kind: 'SET_FINISH'; time: string };

interface ReplaceConfirmDialogProps {
  open: boolean;
  pendingReplace: PendingReplace | null;
  existingTime?: string; // e.g. existing start- or finish-time shown in message
  existingStatus?: string; // e.g. current DNS/DNF status
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
}

const ReplaceConfirmDialog: React.FC<ReplaceConfirmDialogProps> = ({
  open,
  pendingReplace,
  existingTime,
  existingStatus,
  onConfirm,
  onCancel,
  title = 'Bekreft erstatning',
}) => {
  const renderMessage = () => {
    if (!pendingReplace) return '';
    if (pendingReplace.kind === 'SET_STATUS') {
      return (
        `Det finnes allerede en registrert tid (${existingTime || 'ukjent'}). Vil du erstatte den med status ${pendingReplace.status}?`
      );
    }
    if (pendingReplace.kind === 'SET_START') {
      return (
        `Deltager har status ${existingStatus || 'ukjent'}. Vil du erstatte statusen og registrere start-tid ${pendingReplace.time}?`
      );
    }
    // SET_FINISH
    return (
      `Deltager har status ${existingStatus || 'ukjent'}. Vil du erstatte statusen og registrere slutt-tid ${pendingReplace.time}?`
    );
  };

  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="replace-confirm-dialog-title">
      <DialogTitle id="replace-confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <Typography>{renderMessage()}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Avbryt</Button>
        <Button variant="contained" onClick={onConfirm}>Bekreft</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReplaceConfirmDialog;
