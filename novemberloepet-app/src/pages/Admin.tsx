import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import FlagIcon from '@mui/icons-material/Flag';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { Box, Button, Container, Grid, Paper, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const adminActions = [
  {
    title: 'Startliste',
    description: 'Se komplett startliste og deltagerinformasjon',
    icon: <FormatListNumberedIcon sx={{ fontSize: 40 }} />,
    path: '/startliste',
    color: 'info' as const,
  },
  {
    title: 'Resultater',
    description: 'Se resultater og rangeringer',
    icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
    path: '/results',
    color: 'success' as const,
  },
  {
    title: 'Etapper',
    description: 'Administrer etapper og idealtider',
    icon: <ListAltIcon sx={{ fontSize: 40 }} />,
    path: '/etapper',
    color: 'warning' as const,
  },
  {
    title: 'Registrering',
    description: 'Registrer nye deltagere',
    icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
    path: '/registration',
    color: 'primary' as const,
  },
  {
    title: 'Startbekreftelse',
    description: 'Se og administrer startbekreftelser',
    icon: <FlagIcon sx={{ fontSize: 40 }} />,
    path: '/confirmation',
    color: 'secondary' as const,
  },
  {
    title: 'Last ned data',
    description: 'Last ned deltager- og resultatdata',
    icon: <CloudDownloadIcon sx={{ fontSize: 40 }} />,
    path: '/download',
    color: 'secondary' as const,
  },
];

const Admin: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Adminside
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {adminActions.map((action) => (
          <Grid key={action.title}>
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
      <Box mt={4} textAlign="center">
        <Button variant="outlined" color="secondary" onClick={() => navigate('/')}>Tilbake til forsiden</Button>
      </Box>
      <Box mt={2} textAlign="center">
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          aria-label="Fjern all local storage"
        >
          Fjern all local storage
        </Button>
      </Box>
    </Container>
  );
};

export default Admin;