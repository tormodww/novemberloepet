import React, { useState } from 'react';
import './App.css';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Registration from './pages/Registration';
import Confirmation from './pages/Confirmation';
import Results from './pages/Results';
import FinishTimeRegister from './pages/FinishTimeRegister';
import AdminEtapper from './pages/AdminEtapper';
import ParticipantsList from './pages/ParticipantsList';
import { DeltagerProvider } from './context/DeltagerContext';
import { EtappeProvider } from './context/EtappeContext';

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
    case 'adminetapper':
      content = <AdminEtapper />;
      break;
    case 'participants':
      content = <ParticipantsList />;
      break;
    default:
      content = <Home />;
  }

  return (
    <EtappeProvider>
      <DeltagerProvider>
        <div className="App">
          <NavBar onNavigate={setPage} currentPage={page} />
          <div style={{ padding: 24 }}>{content}</div>
        </div>
      </DeltagerProvider>
    </EtappeProvider>
  );
}

export default App;