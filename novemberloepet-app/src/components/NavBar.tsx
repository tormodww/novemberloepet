import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlagIcon from '@mui/icons-material/Flag';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';
import MenuIcon from '@mui/icons-material/Menu';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useTheme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavBar: React.FC = () => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: { key: string; label: string; icon: React.ReactNode; path: string }[] = [
    { key: 'home', label: 'Hjem', icon: <HomeIcon />, path: '/' },
    { key: 'etapper', label: 'Etapper', icon: <ListAltIcon />, path: '/etapper' },
    { key: 'registration', label: 'Registrering', icon: <CheckCircleIcon />, path: '/registration' },
    { key: 'startliste', label: 'Startliste', icon: <FormatListNumberedIcon />, path: '/startliste' },
    { key: 'starttime', label: 'Starttid', icon: <PlayArrowIcon />, path: '/starttid' },
    { key: 'finishtime', label: 'Slutttid', icon: <FlagIcon />, path: '/sluttid' },
    { key: 'results', label: 'Resultater', icon: <AssessmentIcon />, path: '/results' },
    { key: 'confirmation', label: 'Startbekreftelse', icon: <CheckCircleIcon />, path: '/confirmation' }
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <Box className="no-print" sx={{ flexGrow: 1, mb: 2 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Novemberløpet 2025
          </Typography>
          {isSmall ? (
            <>
              <Box sx={{ display: 'flex', gap: 0.5, mr: 1 }}>
                {navItems.map(item => (
                  <Tooltip key={item.key} title={item.label} placement="bottom">
                    <span>
                      <IconButton
                        color={location.pathname === item.path ? 'secondary' : 'inherit'}
                        onClick={() => handleNavigate(item.path)}
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
                        <ListItemButton selected={location.pathname === item.path} onClick={() => handleNavigate(item.path)}>
                          <ListItemIcon sx={{ color: location.pathname === item.path ? 'secondary.main' : 'inherit' }}>{item.icon}</ListItemIcon>
                          <ListItemText primary={item.label} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Drawer>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {navItems.map(item => (
                <Button
                  key={item.key}
                  color={location.pathname === item.path ? 'secondary' : 'inherit'}
                  startIcon={item.icon}
                  onClick={() => handleNavigate(item.path)}
                  sx={{ fontWeight: location.pathname === item.path ? 700 : 400 }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default NavBar;