import React from 'react';
import { Box, Typography } from '@mui/material';

const ParticipantsList: React.FC = () => {
  return (
    <Box maxWidth={800} mx="auto">
      <Typography variant="h6">Siden for "Startbekreftelse / Utskrift" er fjernet.</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>Bruk <strong>Startliste</strong>-siden i menyen for å velge deltagere og vise startbekreftelser.</Typography>
    </Box>
  );
};

export default ParticipantsList;