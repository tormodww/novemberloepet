import DeleteIcon from '@mui/icons-material/Delete';
import ReplayIcon from '@mui/icons-material/Replay';
import { Box, Chip,IconButton, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import React from 'react';

import { useDeltagerContext } from '../context/DeltagerContext';

function fmtTime(ts?: number | null) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

const PendingOpsPanel: React.FC = () => {
  const ctx = useDeltagerContext();
  const { pendingOps, retryOp, clearOp } = ctx as any;

  if (!pendingOps || pendingOps.length === 0) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ p: 1 }}>
        <Typography variant="subtitle1" gutterBottom>Pending ops ({pendingOps.length})</Typography>
        <List dense>
          {pendingOps.map((op: any) => (
            <ListItem key={op.id} secondaryAction={(
              <Stack direction="row" spacing={1}>
                <IconButton size="small" aria-label="retry" onClick={() => retryOp(op.id)}><ReplayIcon fontSize="small"/></IconButton>
                <IconButton size="small" aria-label="clear" onClick={() => clearOp(op.id)}><DeleteIcon fontSize="small"/></IconButton>
              </Stack>
            )}>
              <ListItemText
                primary={`${op.type.toUpperCase()} #${op.startnummer ?? ''} (tries: ${op.attempts || 0})`}
                secondary={op.lastError ? `${op.lastError} • next: ${fmtTime(op.nextAttemptAt)}` : `next: ${fmtTime(op.nextAttemptAt)}`}
              />
              {op.lastError ? <Chip label="Feil" color="error" size="small" sx={{ ml: 1 }} /> : <Chip label="Vent" size="small" sx={{ ml: 1 }} />}
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default PendingOpsPanel;
