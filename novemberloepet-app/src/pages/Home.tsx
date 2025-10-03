import React, { useState } from 'react';
import { Box, Button, Container, Grid, Paper, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FlagIcon from '@mui/icons-material/Flag';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { useDeltagerContext } from '../context/DeltagerContext';
import { useEtappeContext } from '../context/EtappeContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { reloadEtapper, saveEtapperToBack4app } = useEtappeContext();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [clearResult, setClearResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

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
      color: 'error' as const,
    },
  ];

  const clearAllLocalStorage = async () => {
    setIsClearing(true);
    try {
      // Clear all novemberloepet related localStorage keys
      const keysToRemove = [
        'novemberloepet.deltagere.v1',
        'novemberloepet.pendingops.v1', 
        'novemberloepet.etapper',
        'starttime.step',
        'starttime.etappe',
        'starttime.selectedStartnummer',
        'finishtime.step',
        'finishtime.etappe',
        'finishtime.selectedStartnummer',
        'startliste.sortField',
        'startliste.sortOrder',
        'startliste.selected',
        'startliste.query',
        'startliste.klasseFilter',
        'etapper.localIdeal',
        'registration.form'
      ];

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove localStorage key: ${key}`, e);
        }
      });

      // Reload data from back4app
      const etapperReloaded = await reloadEtapper();
      
      if (etapperReloaded) {
        setClearResult({ success: true, message: 'Alle lokale data er tømt og lastet inn på nytt fra back4app!' });
        // Reload the page to refresh all contexts with clean data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setClearResult({ success: false, message: 'Feil ved lasting av data fra back4app. Prøv igjen.' });
      }
    } catch (error) {
      console.error('Error clearing localStorage and reloading data:', error);
      setClearResult({ success: false, message: 'Feil ved tømming av data. Prøv igjen.' });
    } finally {
      setIsClearing(false);
    }
  };

  const saveEtapperToBackend = async () => {
    setIsSaving(true);
    setSaveResult(null);
    try {
      const success = await saveEtapperToBack4app();
      if (success) {
        setSaveResult({ success: true, message: 'Etapper ble lagret til back4app!' });
      } else {
        setSaveResult({ success: false, message: 'Feil ved lagring til back4app. Prøv igjen.' });
      }
    } catch (error) {
      console.error('Error saving etapper to back4app:', error);
      setSaveResult({ success: false, message: 'Feil ved lagring til back4app. Prøv igjen.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 2 }}>
          Velkommen til Novemberløpet
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Administrasjonssystem for tidtaking og deltageradministrasjon
        </Typography>

        <Grid container spacing={3}>
          {quickActions.map((action) => (
            <Grid item xs={12} sm={6} md={4} key={action.path}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    elevation: 6,
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => navigate(action.path)}
              >
                <Box sx={{ color: `${action.color}.main`, mb: 2 }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                  {action.description}
                </Typography>
                <Button
                  variant="contained"
                  color={action.color}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(action.path);
                  }}
                  sx={{ mt: 'auto' }}
                >
                  Åpne
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 6, p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            Hurtigstart
          </Typography>
          <Typography variant="body1" paragraph>
            For å komme i gang med Novemberløpet 2025:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" component="div">
                <strong>1. Registrer deltagere</strong> - Legg til alle deltagere i systemet
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" component="div">
                <strong>2. Konfigurer etapper</strong> - Sett opp etapper og idealtider
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" component="div">
                <strong>3. Registrer starttider</strong> - Logg starttider for hver etappe
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" component="div">
                <strong>4. Registrer sluttider</strong> - Logg sluttider og generer resultater
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setClearDialogOpen(true)}
          >
            Tøm lokale data
          </Button>
        </Box>

        <Dialog
          open={clearDialogOpen}
          onClose={() => setClearDialogOpen(false)}
          aria-labelledby="clear-data-dialog-title"
          aria-describedby="clear-data-dialog-description"
        >
          <DialogTitle id="clear-data-dialog-title">Tøm lokale data</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Er du sikker på at du vil tømme alle lokale data? Dette vil fjerne alle lagrede deltagere, etapper, og innstillinger.
            </Typography>
            {clearResult && (
              <Alert severity={clearResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
                {clearResult.message}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClearDialogOpen(false)} color="primary">
              Avbryt
            </Button>
            <Button
              onClick={clearAllLocalStorage}
              color="error"
              disabled={isClearing}
              startIcon={isClearing ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
            >
              {isClearing ? 'Tømmer...' : 'Tøm nå'}
            </Button>
          </DialogActions>
        </Dialog>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setSaveDialogOpen(true)}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
          >
            {isSaving ? 'Lagrer...' : 'Lagre etapper til back4app'}
          </Button>
        </Box>

        <Dialog
          open={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
          aria-labelledby="save-etapper-dialog-title"
          aria-describedby="save-etapper-dialog-description"
        >
          <DialogTitle id="save-etapper-dialog-title">Lagre etapper</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Vil du lagre de nåværende etappene til back4app? Dette vil oppdatere eksisterende etapper eller legge til nye.
            </Typography>
            {saveResult && (
              <Alert severity={saveResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
                {saveResult.message}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)} color="primary">
              Avbryt
            </Button>
            <Button
              onClick={saveEtapperToBackend}
              color="primary"
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
            >
              {isSaving ? 'Lagrer...' : 'Lagre nå'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Home;