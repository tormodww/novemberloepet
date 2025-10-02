import './App.css';

import React, { useState } from 'react';

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
  const [page, setPage] = useState('home');

  let content = null;
  switch (page) {
    case 'registration':
      content = <Registration />;
      break;
    case 'confirmation':
      content = <Confirmation />;
      break;
    case 'results':
      content = <Results />;
      break;
    case 'finishtime':
      content = <FinishTimeRegister />;
      break;
    case 'starttime':
      content = <StartTimeRegister />;
      break;
    case 'etapper':
      content = <Etapper />;
      break;
    case 'startliste':
      content = <Startliste />;
      break;
    default:
      content = <Home />;
  }

  return (
    <EtappeProvider>
      <DeltagerProvider onNavigate={setPage}>
        <div className="App">
          <NavBar onNavigate={setPage} currentPage={page} />
          <div style={{ padding: 24 }}>{content}</div>
        </div>
      </DeltagerProvider>
    </EtappeProvider>
  );
}

export default App;