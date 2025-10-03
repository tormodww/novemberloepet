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

        {/* Main Action Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickActions.map((action) => (
            <Grid item xs={12} sm={6} md={4} key={action.path}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  height: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    elevation: 4,
                    transform: 'translateY(-4px)',
                    borderColor: `${action.color}.main`,
                    boxShadow: (theme) => `0 8px 25px -8px ${theme.palette[action.color].main}40`,
                  },
                }}
                onClick={() => navigate(action.path)}
              >
                <Box 
                  sx={{ 
                    color: `${action.color}.main`, 
                    mb: 2,
                    p: 1.5,
                    borderRadius: '50%',
                    backgroundColor: `${action.color}.light`,
                    opacity: 0.1
                  }}
                >
                  <Box sx={{ color: `${action.color}.main`, position: 'relative', zIndex: 1 }}>
                    {action.icon}
                  </Box>
                </Box>
                <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                  {action.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 2, flexGrow: 1, lineHeight: 1.4 }}
                >
                  {action.description}
                </Typography>
                <Button
                  variant="contained"
                  color={action.color}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(action.path);
                  }}
                  sx={{ 
                    mt: 'auto',
                    minWidth: 100,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  Åpne
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Admin Actions Section */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Administrasjon
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                Dataadministrasjon
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Administrer lokale data og synkroniser med back4app
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setSaveDialogOpen(true)}
                  disabled={isSaving}
                  startIcon={isSaving ? <CircularProgress size={16} /> : <CloudDownloadIcon />}
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  {isSaving ? 'Lagrer...' : 'Lagre etapper'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setClearDialogOpen(true)}
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  Tøm data
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Quick Start Guide */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            backgroundColor: 'grey.50',
            border: '1px solid',
            borderColor: 'grey.200'
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Hurtigstart
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            Følg disse trinnene for å komme i gang med Novemberløpet 2025:
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    backgroundColor: 'primary.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    mr: 2,
                    flexShrink: 0
                  }}
                >
                  1
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Registrer deltagere
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Legg til alle deltagere i systemet med startnummer og informasjon
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    backgroundColor: 'warning.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    mr: 2,
                    flexShrink: 0
                  }}
                >
                  2
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Konfigurer etapper
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sett opp etapper med navn og idealtider for løpet
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    backgroundColor: 'primary.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    mr: 2,
                    flexShrink: 0
                  }}
                >
                  3
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Registrer starttider
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Logg starttider for deltagere på hver etappe
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    backgroundColor: 'success.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    mr: 2,
                    flexShrink: 0
                  }}
                >
                  4
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Registrer sluttider
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Logg sluttider og generer automatiske resultater
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Dialogs remain the same */}
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
