import { Box, Typography } from '@mui/material';
import React from 'react';

type Props = object;

const AlleDeltagere: React.FC<Props> = () => {
  return (
    <Box maxWidth={800} mx="auto">
      {/* Unescaped quotes fjernet for å unngå react/no-unescaped-entities */}
      <Typography variant="h6">Siden «Alle deltagere» er fjernet.</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>Bruk <strong>Startliste</strong>-siden i menyen for å se og velge deltagere.</Typography>
    </Box>
  );
};

export default AlleDeltagere;