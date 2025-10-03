import { Box, Button, Stack, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 2, maxWidth: 400, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Velkommen til Novemberløpet</Typography>
      <Stack spacing={3}>
        <Button
          variant="contained"
          size="large"
          sx={{ py: 3, fontSize: 22 }}
          onClick={() => navigate('/starttid')}
        >
          Starttid
        </Button>
        <Button
          variant="contained"
          size="large"
          color="secondary"
          sx={{ py: 3, fontSize: 22 }}
          onClick={() => navigate('/sluttid')}
        >
          Sluttid
        </Button>
      </Stack>
    </Box>
  );
};

export default Home;