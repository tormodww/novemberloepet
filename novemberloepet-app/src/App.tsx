import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { DeltagerProvider } from './context/DeltagerContext';
import { EtappeProvider } from './context/EtappeContext';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Etapper from './pages/Etapper';
import Registration from './pages/Registration';
import Startliste from './pages/Startliste';
import StartTimeRegister from './pages/StartTimeRegister';
import FinishTimeRegister from './pages/FinishTimeRegister';
import Results from './pages/Results';
import Confirmation from './pages/Confirmation';
import AlleDeltagere from './pages/AlleDeltagere';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <EtappeProvider>
        <DeltagerProvider>
          <Router>
            <NavBar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/etapper" element={<Etapper />} />
              <Route path="/registration" element={<Registration />} />
              <Route path="/startliste" element={<Startliste />} />
              <Route path="/starttid" element={<StartTimeRegister />} />
              <Route path="/sluttid" element={<FinishTimeRegister />} />
              <Route path="/results" element={<Results />} />
              <Route path="/confirmation" element={<Confirmation />} />
              <Route path="/alle-deltagere" element={<AlleDeltagere />} />
            </Routes>
          </Router>
        </DeltagerProvider>
      </EtappeProvider>
    </ThemeProvider>
  );
}

export default App;