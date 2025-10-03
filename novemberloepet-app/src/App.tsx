import './App.css';

import React from 'react';
import { BrowserRouter, Route,Routes } from 'react-router-dom';

import NavBar from './components/NavBar';
import { DeltagerProvider } from './context/DeltagerContext';
import { EtappeProvider } from './context/EtappeContext';
import Confirmation from './pages/Confirmation';
import Etapper from './pages/Etapper';
import FinishTimeRegister from './pages/FinishTimeRegister';
import Home from './pages/Home';
import Registration from './pages/Registration';
import Results from './pages/Results';
import Startliste from './pages/Startliste';
import StartTimeRegister from './pages/StartTimeRegister';

function App() {
  return (
    <EtappeProvider>
      <DeltagerProvider>
        <BrowserRouter>
          <div className="App">
            <NavBar />
            <div style={{ padding: 24 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/starttid" element={<StartTimeRegister />} />
                <Route path="/sluttid" element={<FinishTimeRegister />} />
                {/* Optional: keep other routes for admin use */}
                <Route path="/registration" element={<Registration />} />
                <Route path="/confirmation" element={<Confirmation />} />
                <Route path="/results" element={<Results />} />
                <Route path="/etapper" element={<Etapper />} />
                <Route path="/startliste" element={<Startliste />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </DeltagerProvider>
    </EtappeProvider>
  );
}

export default App;