import FlagIcon from '@mui/icons-material/Flag';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Button, Container, Grid, Paper, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Registrer Starttid',
      description: 'Registrer starttid for deltagere på hver etappe',
      icon: <PlayArrowIcon sx={{ fontSize: 40 }} />,
      path: '/starttid',
      color: 'primary' as const,
    },
    {
      title: 'Registrer Sluttid',
      description: 'Registrer sluttid for deltagere på hver etappe',
      icon: <FlagIcon sx={{ fontSize: 40 }} />,
      path: '/sluttid',
      color: 'secondary' as const,
    },
  ];

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Velkommen til Novemberløpet
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {quickActions.map((action) => (
          <Grid item xs={12} sm={6} key={action.title}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <Box mb={1}>{action.icon}</Box>
              <Typography variant="h6" gutterBottom>{action.title}</Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>{action.description}</Typography>
              <Button
                variant="contained"
                color={action.color}
                fullWidth
                onClick={() => navigate(action.path)}
                sx={{ mt: 2 }}
              >
                Gå til
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Home;