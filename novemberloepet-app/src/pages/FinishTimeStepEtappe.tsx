import { Box, Button, Stack, Typography } from '@mui/material';
import React from 'react';

export interface FinishTimeStepEtappeProps {
  etapper: { nummer: number; navn: string }[];
  etappe: number | null;
  setEtappe: (n: number) => void;
  setStep: (n: number) => void;
  setValgtDeltager: (d: any) => void;
  clear: () => void;
  resetManual: () => void;
}

const FinishTimeStepEtappe: React.FC<FinishTimeStepEtappeProps> = ({ etapper, etappe, setEtappe, setStep, setValgtDeltager, clear, resetManual }) => (
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

export default FinishTimeStepEtappe;
