import React from 'react';
import { useDeltagerContext } from '../context/DeltagerContext';
import { Box, Typography, Paper, Stack, Divider } from '@mui/material';

const AlleDeltagere: React.FC = () => {
  const { deltagere } = useDeltagerContext();

  // sort numerically by startnummer when possible
  const sorted = [...deltagere].sort((a, b) => {
    const na = parseInt(a.startnummer, 10);
    const nb = parseInt(b.startnummer, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.startnummer.localeCompare(b.startnummer, 'nb');
  });

  return (
    <Box maxWidth={900} mx="auto">
      <Typography variant="h5" gutterBottom>Alle deltagere</Typography>
      <Stack spacing={2}>
        {sorted.map((d) => (
          <Paper key={d.startnummer} sx={{ p: 2 }}>
            <Typography variant="subtitle1">#{d.startnummer} {d.navn}</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2">{d.klasse} | {d.sykkel} | {d.starttid}</Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

export default AlleDeltagere;