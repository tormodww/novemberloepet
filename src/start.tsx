
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import './index.css';
import { stages } from './data/stages';
import { participants } from './data/participants';

import Toolbar from './components/Toolbar';

function StartApp() {
  // Statisk flyt for startregistrering
  // 1. Velg etappe
  // 2. Velg deltaker
  // 3. Registrer starttid
  const [stage, setStage] = React.useState('');
  const [participant, setParticipant] = React.useState('');
  const [showTimeReg, setShowTimeReg] = React.useState(false);

  return (
    <>
      <Toolbar />
      <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-20">
        <h1 className="text-2xl font-bold mb-6">Registrer Starttid</h1>
        {!stage ? (
          <div className="w-full max-w-md mx-auto">
            <StageSelectorStatic onSelect={setStage} />
          </div>
        ) : !participant ? (
          <div className="w-full max-w-md mx-auto">
            <ParticipantSelectorStatic stage={stage} onSelect={setParticipant} />
          </div>
        ) : (
          <div className="w-full max-w-md mx-auto">
            <TimeRegistrationStatic stage={stage} participant={participant} type="start" />
          </div>
        )}
      </div>
    </>
  );

// Statisk versjon av StageSelector
function StageSelectorStatic({ onSelect }: { onSelect: (stage: string) => void }) {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Velg etappe</h2>
      <div className="flex flex-col gap-3">
        {stages.map((stage: string) => (
          <button
            key={stage}
            onClick={() => onSelect(stage)}
            className="bg-gray-200 hover:bg-blue-600 hover:text-white py-3 rounded-md font-medium"
          >
            {stage}
          </button>
        ))}
      </div>
    </>
  );
}

// Statisk versjon av ParticipantSelector
function ParticipantSelectorStatic({ stage, onSelect }: { stage: string; onSelect: (id: string) => void }) {
  // Hent registrert starttid/status fra localStorage for valgt etappe hver gang listen rendres
  const [dropdownData, setDropdownData] = React.useState<{[id: string]: string}>({});
  React.useEffect(() => {
    const timesLS = JSON.parse(localStorage.getItem('participantTimes') || '{}');
    const statusLS = JSON.parse(localStorage.getItem('participantStatus') || '{}');
    const timesForStage = timesLS[stage] || {};
    const statusForStage = statusLS[stage] || {};
    const data: {[id: string]: string} = {};
    participants.forEach((p: any) => {
      if (statusForStage[p.id] === 'DNS') data[p.id] = 'DNS';
      else if (statusForStage[p.id] === 'DNF') data[p.id] = 'DNF';
      else if (timesForStage[p.id]?.start) data[p.id] = timesForStage[p.id].start;
      else data[p.id] = '';
    });
    setDropdownData(data);
  }, [stage]);
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Etappe: {stage}</h2>
      <p className="mb-2">Velg deltaker</p>
      <select
        onChange={e => onSelect(e.target.value)}
        className="w-full border rounded-md px-2 py-2"
      >
        <option value="">Startnummer eller navn</option>
        {participants.map((p: any) => {
          let suffix = '';
          let style = {};
          if (dropdownData[p.id] === 'DNS') {
            suffix = ' (DNS)';
            style = { color: 'red', fontWeight: 'bold' };
          } else if (dropdownData[p.id] === 'DNF') {
            suffix = ' (DNF)';
            style = { color: 'red', fontWeight: 'bold' };
          } else if (dropdownData[p.id]) {
            suffix = ` ${dropdownData[p.id]}`;
          }
          return (
            <option key={p.id} value={p.id} style={style}>
              #{p.id} - {p.name}{suffix}
            </option>
          );
        })}
      </select>
    </>
  );
}

// Statisk versjon av TimeRegistration
function TimeRegistrationStatic({ stage, participant, type }: { stage: string; participant: string; type: 'start' | 'end' }) {
  // Kopiert og utvidet fra TimeRegistration
  const [manualTime, setManualTime] = React.useState('');
  const [confirmed, setConfirmed] = React.useState(false);
  const [registeredTime, setRegisteredTime] = React.useState('');
  const [status, setStatus] = React.useState<'DNS' | 'DNF' | undefined>(undefined);
  const [selectedParticipant, setSelectedParticipant] = React.useState(participant);
  const [dropdownData, setDropdownData] = React.useState<{[id: string]: string}>({});
  // Oppdater dropdown-data for deltakerlisten
  const updateDropdownData = React.useCallback(() => {
    const timesLS = JSON.parse(localStorage.getItem('participantTimes') || '{}');
    const statusLS = JSON.parse(localStorage.getItem('participantStatus') || '{}');
    const timesForStage = timesLS[stage] || {};
    const statusForStage = statusLS[stage] || {};
    const data: {[id: string]: string} = {};
    participants.forEach((p: any) => {
      if (statusForStage[p.id] === 'DNS') data[p.id] = 'DNS';
      else if (statusForStage[p.id] === 'DNF') data[p.id] = 'DNF';
      else if (timesForStage[p.id]?.start) data[p.id] = timesForStage[p.id].start;
      else data[p.id] = '';
    });
    setDropdownData(data);
  }, [stage]);

  // Nullstill status og registrert tid når deltaker eller etappe endres
  React.useEffect(() => {
    const timesLS = JSON.parse(localStorage.getItem('participantTimes') || '{}');
    const statusLS = JSON.parse(localStorage.getItem('participantStatus') || '{}');
    const timesForStage = timesLS[stage] || {};
    const statusForStage = statusLS[stage] || {};
    setRegisteredTime(timesForStage[selectedParticipant]?.start || '');
    setStatus(statusForStage[selectedParticipant] || undefined);
    setConfirmed(false);
    setManualTime('');
    updateDropdownData();
  }, [selectedParticipant, stage, updateDropdownData]);

  const handleRegister = () => {
    let timestamp = '';
    if (manualTime) {
      timestamp = manualTime;
    } else {
      timestamp = new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
    }
    setRegisteredTime(timestamp);
    setConfirmed(true);
    setStatus(undefined);
    // Lagre til localStorage
    const timesLS = JSON.parse(localStorage.getItem('participantTimes') || '{}');
    if (!timesLS[stage]) timesLS[stage] = {};
    if (!timesLS[stage][selectedParticipant]) timesLS[stage][selectedParticipant] = {};
    timesLS[stage][selectedParticipant].start = timestamp;
    localStorage.setItem('participantTimes', JSON.stringify(timesLS));
    // Fjern DNS/DNF status helt hvis den finnes
    const statusLS = JSON.parse(localStorage.getItem('participantStatus') || '{}');
    if (statusLS[stage] && statusLS[stage][selectedParticipant]) {
      delete statusLS[stage][selectedParticipant];
      if (Object.keys(statusLS[stage]).length === 0) {
        delete statusLS[stage];
      }
      localStorage.setItem('participantStatus', JSON.stringify(statusLS));
    }
    updateDropdownData();
  };

  const handleDNS = () => {
    setStatus('DNS');
    setRegisteredTime('DNS');
    setConfirmed(true);
    // Lagre DNS til localStorage
    const statusLS = JSON.parse(localStorage.getItem('participantStatus') || '{}');
    if (!statusLS[stage]) statusLS[stage] = {};
    statusLS[stage][selectedParticipant] = 'DNS';
    localStorage.setItem('participantStatus', JSON.stringify(statusLS));
    // Fjern tid helt fra localStorage
    const timesLS = JSON.parse(localStorage.getItem('participantTimes') || '{}');
    if (timesLS[stage] && timesLS[stage][selectedParticipant]) {
      delete timesLS[stage][selectedParticipant].start;
      // Slett hele deltaker-objektet hvis tomt
      if (Object.keys(timesLS[stage][selectedParticipant]).length === 0) {
        delete timesLS[stage][selectedParticipant];
      }
      localStorage.setItem('participantTimes', JSON.stringify(timesLS));
    }
    updateDropdownData();
  };

  const handleDNF = () => {
    setStatus('DNF');
    setRegisteredTime('DNF');
    setConfirmed(true);
    // Lagre DNF til localStorage
    const statusLS = JSON.parse(localStorage.getItem('participantStatus') || '{}');
    if (!statusLS[stage]) statusLS[stage] = {};
    statusLS[stage][selectedParticipant] = 'DNF';
    localStorage.setItem('participantStatus', JSON.stringify(statusLS));
    // Fjern tid helt fra localStorage
    const timesLS = JSON.parse(localStorage.getItem('participantTimes') || '{}');
    if (timesLS[stage] && timesLS[stage][selectedParticipant]) {
      delete timesLS[stage][selectedParticipant].start;
      if (Object.keys(timesLS[stage][selectedParticipant]).length === 0) {
        delete timesLS[stage][selectedParticipant];
      }
      localStorage.setItem('participantTimes', JSON.stringify(timesLS));
    }
    updateDropdownData();
  };

  return (
    <div className="text-center">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4">Registrer Starttid</h2>
      <div className="mb-4">
        <label htmlFor="participant-select" className="block mb-1 font-semibold">Velg deltaker:</label>
        <select
          id="participant-select"
          value={selectedParticipant}
          onChange={e => setSelectedParticipant(e.target.value)}
          className="w-full block border rounded-md px-3 py-4 mb-2 text-lg sm:text-xl"
        >
          <option value="" className="text-lg sm:text-xl">Startnummer eller navn</option>
          {participants.map((p: any) => {
            let suffix = '';
            let style = {};
            if (dropdownData[p.id] === 'DNS') {
              suffix = ' (DNS)';
              style = { color: 'red', fontWeight: 'bold' };
            } else if (dropdownData[p.id] === 'DNF') {
              suffix = ' (DNF)';
              style = { color: 'red', fontWeight: 'bold' };
            } else if (dropdownData[p.id]) {
              suffix = ` ${dropdownData[p.id]}`;
            }
            return (
              <option key={p.id} value={p.id} style={style} className="text-lg sm:text-xl">
                #{p.id} - {p.name}{suffix}
              </option>
            );
          })}
        </select>
      </div>
      <p className="mb-4 text-base sm:text-lg">Deltaker #{selectedParticipant} på etappe {stage}</p>
      <div className="mb-4">
        <label htmlFor="manual-time" className="block mb-1">Manuell tid (hh:mm):</label>
        <input
          id="manual-time"
          type="time"
          value={manualTime}
          onChange={e => setManualTime(e.target.value)}
          className="border px-3 py-3 rounded w-full text-base sm:text-lg"
        />
      </div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center mb-4">
        <button
          onClick={handleRegister}
          className="bg-green-600 text-white px-6 py-4 rounded-md w-full sm:w-auto text-base sm:text-lg"
          disabled={!selectedParticipant}
        >
          {manualTime ? 'Registrer manuell tid' : 'Registrer tid nå'}
        </button>
        <button
          onClick={handleDNS}
          className="bg-yellow-500 text-white px-6 py-4 rounded-md w-full sm:w-auto text-base sm:text-lg"
          type="button"
          disabled={!selectedParticipant}
        >
          DNS
        </button>
        <button
          onClick={handleDNF}
          className="bg-red-600 text-white px-6 py-4 rounded-md w-full sm:w-auto text-base sm:text-lg"
          type="button"
          disabled={!selectedParticipant}
        >
          DNF
        </button>
      </div>
      {confirmed && (
        <div className="p-4 bg-green-100 border border-green-400 rounded-md mt-4">
          {registeredTime === 'DNS' && <>DNS registrert for #{selectedParticipant}</>}
          {registeredTime === 'DNF' && <>DNF registrert for #{selectedParticipant}</>}
          {registeredTime !== 'DNS' && registeredTime !== 'DNF' && <>Tid registrert for #{selectedParticipant} kl. {registeredTime}</>}
        </div>
      )}
      {status && (
        <div className="mt-2 text-red-600 font-bold">Status: {status}</div>
      )}
    </div>
  );
}


} // End StartApp and all inner functions

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StartApp />
  </React.StrictMode>
);
