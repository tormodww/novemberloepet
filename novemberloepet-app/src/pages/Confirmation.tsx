import React, { useState } from 'react';
import { useDeltagerContext } from '../context/DeltagerContext';
import { Box, Typography, MenuItem, TextField, Paper } from '@mui/material';

const Confirmation: React.FC = () => {
  const { deltagere } = useDeltagerContext();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const deltager = selectedIdx !== null ? deltagere[selectedIdx] : null;

  return (
    <Box maxWidth={600} mx="auto">
      <Typography variant="h5" gutterBottom>Startbekreftelse og egenerklæring</Typography>
      <TextField
        select
        label="Velg deltager"
        value={selectedIdx ?? ''}
        onChange={e => setSelectedIdx(Number(e.target.value))}
        fullWidth
        margin="normal"
      >
        {deltagere.map((d, idx) => (
          <MenuItem key={idx} value={idx}>{d.navn} ({d.klasse})</MenuItem>
        ))}
      </TextField>
      {deltager && (
        <Paper sx={{ mt: 3, p: 3 }}>
          <Typography variant="subtitle1"><b>Navn:</b> {deltager.navn}</Typography>
          <Typography variant="subtitle1"><b>Fødselsår:</b> {/* Kan utvides */}</Typography>
          <Typography variant="subtitle1"><b>Adresse/Poststed:</b> {deltager.poststed}</Typography>
          <Typography variant="subtitle1"><b>Sykkel:</b> {deltager.sykkel} ({deltager.modell})</Typography>
          <Typography variant="subtitle1"><b>Klasse:</b> {deltager.klasse}</Typography>
          <Typography variant="subtitle1"><b>Starttid:</b> {deltager.starttid}</Typography>
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Jeg deltar i løpet på eget ansvar, og vil ikke kreve erstatningsansvar mot arrangør eller grunneiere ved evt. skade. Jeg har ikke begrensninger på utøvelse av sport fra min lege.
            </Typography>
          </Box>
          <Box mt={3}>
            <Typography variant="body2">Dato: ____________________</Typography>
            <Typography variant="body2">Signatur: ____________________</Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Confirmation;
