import React from 'react';
import { Box, Typography } from '@mui/material';

const AlleDeltagere: React.FC = () => {
  return (
    <Box maxWidth={800} mx="auto">
      <Typography variant="h6">Siden "Alle deltagere" er fjernet.</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>Bruk <strong>Startliste</strong>-siden i menyen for å se og velge deltagere.</Typography>
    </Box>
  );
};

export default AlleDeltagere;