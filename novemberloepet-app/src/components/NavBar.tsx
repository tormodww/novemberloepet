import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

interface NavBarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const NavBar: React.FC<NavBarProps> = ({ onNavigate, currentPage }) => {
  return (
    <Box sx={{ flexGrow: 1, mb: 2 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Novemberløpet 2025
          </Typography>
          <Button color="inherit" onClick={() => onNavigate('home')} disabled={currentPage==='home'}>Hjem</Button>
          <Button color="inherit" onClick={() => onNavigate('etapper')} disabled={currentPage==='etapper'}>Etapper</Button>
          <Button color="inherit" onClick={() => onNavigate('registration')} disabled={currentPage==='registration'}>Registrering</Button>
          <Button color="inherit" onClick={() => onNavigate('startliste')} disabled={currentPage==='startliste'}>Startliste</Button>
          <Button color="inherit" onClick={() => onNavigate('starttime')} disabled={currentPage==='starttime'}>Starttidsregistrering</Button>
          <Button color="inherit" onClick={() => onNavigate('finishtime')} disabled={currentPage==='finishtime'}>Sluttidsregistrering</Button>
          <Button color="inherit" onClick={() => onNavigate('results')} disabled={currentPage==='results'}>Resultater</Button>
          <Button color="inherit" onClick={() => onNavigate('confirmation')} disabled={currentPage==='confirmation'}>Startbekreftelse</Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default NavBar;