import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import FlagIcon from '@mui/icons-material/Flag';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ListAltIcon from '@mui/icons-material/ListAlt';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface NavBarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const NavBar: React.FC<NavBarProps> = ({ onNavigate, currentPage }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const navItems: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: 'Hjem', icon: <HomeIcon /> },
    { key: 'etapper', label: 'Etapper', icon: <ListAltIcon /> },
    { key: 'registration', label: 'Registrering', icon: <CheckCircleIcon /> },
    { key: 'startliste', label: 'Startliste', icon: <FormatListNumberedIcon /> },
    { key: 'starttime', label: 'Registrer starttid', icon: <PlayArrowIcon /> },
    { key: 'finishtime', label: 'Registrer slutttid', icon: <FlagIcon /> },
    { key: 'results', label: 'Resultater', icon: <AssessmentIcon /> },
    { key: 'confirmation', label: 'Startbekreftelse', icon: <CheckCircleIcon /> }
  ];

  const handleNavigate = (key: string) => {
    onNavigate(key);
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ flexGrow: 1, mb: 2 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Novemberløpet 2025
          </Typography>

          {/* Small screens: show icon buttons (icons only) and a drawer for full labels */}
          {isSmall ? (
            <>
              <Box sx={{ display: 'flex', gap: 0.5, mr: 1 }}>
                {navItems.map(item => (
                  <Tooltip key={item.key} title={item.label} placement="bottom">
                    <span>
                      <IconButton
                        color={currentPage === item.key ? 'secondary' : 'inherit'}
                        onClick={() => handleNavigate(item.key)}
                        size="large"
                        aria-label={item.label}
                      >
                        {item.icon}
                      </IconButton>
                    </span>
                  </Tooltip>
                ))}
              </Box>

              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={() => setDrawerOpen(true)}
                size="large"
              >
                <MenuIcon />
              </IconButton>

              <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
              >
                <Box sx={{ width: 260 }} role="presentation" onClick={() => setDrawerOpen(false)} onKeyDown={() => setDrawerOpen(false)}>
                  <List>
                    {navItems.map(item => (
                      <ListItem key={item.key} disablePadding>
                        <ListItemButton selected={currentPage === item.key} onClick={() => handleNavigate(item.key)}>
                          <ListItemIcon sx={{ color: currentPage === item.key ? 'secondary.main' : 'inherit' }}>{item.icon}</ListItemIcon>
                          <ListItemText primary={item.label} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Drawer>
            </>
          ) : (
            /* Large screens: show full text buttons with active styling */
            <>
              {navItems.map(item => (
                <Button
                  key={item.key}
                  color={currentPage === item.key ? 'secondary' : 'inherit'}
                  variant={currentPage === item.key ? 'contained' : 'text'}
                  onClick={() => handleNavigate(item.key)}
                  sx={{ ml: 1 }}
                >
                  {item.label}
                </Button>
              ))}
            </>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default NavBar;