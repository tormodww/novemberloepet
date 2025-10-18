import { useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { participants } from '../data/participants'

export default function TimeRegistration() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const stage = params.get('stage') || ''
  const participant = params.get('participant') || ''
  const type = params.get('type') || 'start'
  const [confirmed, setConfirmed] = useState(false)
  const [manualTime, setManualTime] = useState('')
  const [registeredTime, setRegisteredTime] = useState('')
  // State for tid/status per deltaker for valgt etappe
  const [participantTimes, setParticipantTimes] = useState<{ [id: string]: string }>({});
  const [participantStatus, setParticipantStatus] = useState<{ [id: string]: 'DNS' | 'DNF' | undefined }>({});

  // Oppdater tid/status hver gang etappe eller type endres
  useEffect(() => {
    const timesLS = JSON.parse(localStorage.getItem('participantTimes') || '{}');
    const statusLS = JSON.parse(localStorage.getItem('participantStatus') || '{}');
    const timesObj: { [id: string]: string } = {};
    if (timesLS[stage]) {
      Object.entries(timesLS[stage]).forEach(([id, t]: [string, any]) => {
        if (type === 'start' && t.start) timesObj[id] = t.start;
        if (type === 'end' && t.end) timesObj[id] = t.end;
      });
    }
    setParticipantTimes(timesObj);
    const statusObj: { [id: string]: 'DNS' | 'DNF' | undefined } = {};
    if (statusLS[stage]) {
      Object.entries(statusLS[stage]).forEach(([id, s]: [string, any]) => {
        if (s === 'DNS' || s === 'DNF') statusObj[id] = s;
      });
    }
    setParticipantStatus(statusObj);
  }, [stage, type]);

  // Dialog state
  const [showDialog, setShowDialog] = useState<null | { action: 'TIME' | 'DNS' | 'DNF', newValue?: string }>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const getCurrentStatus = () => {
    if (participantStatus[participant]) return participantStatus[participant];
    if (participantTimes[participant]) return `tid: ${participantTimes[participant]}`;
    return null;
  };

  const handleRegister = () => {
    let timestamp = ''
    if (manualTime) {
      timestamp = manualTime
    } else {
      timestamp = new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })
    }
    setRegisteredTime(timestamp)
    setConfirmed(true)
    setParticipantTimes(prev => {
      const updated = { ...prev, [participant]: timestamp };
      localStorage.setItem('participantTimes', JSON.stringify(updated));
      return updated;
    });
    setParticipantStatus(prev => {
      const updated: { [id: string]: 'DNS' | 'DNF' | undefined } = { ...prev, [participant]: undefined };
      localStorage.setItem('participantStatus', JSON.stringify(updated));
      return updated;
    });
    console.log({ stage, participant, type, timestamp })
  }

  return (
  <div className="w-full max-w-md mx-auto text-center px-2">
      {/* Fjernet ekstra deltaker-nedtrekksliste */}
      <div className="mb-4">
        <div className="mb-2 text-lg sm:text-xl font-bold">Etappe: {stage}</div>
        <label htmlFor="participant-select" className="block mb-1 font-semibold">Velg deltaker:</label>
        <select
          id="participant-select"
          value={participant}
          onChange={e => {
            setManualTime('');
            setConfirmed(false);
            setRegisteredTime('');
            navigate(`/time?stage=${encodeURIComponent(stage)}&type=${type}&participant=${e.target.value}`)
          }}
          className="w-full block border rounded-md px-3 py-4 mb-2 text-lg sm:text-xl"
        >
          <option value="" className="text-lg sm:text-xl">Startnummer eller navn</option>
          {participants.map((p: { id: string; name: string }) => {
            let status = '';
            if (participantStatus[p.id]) {
              status = ` (${participantStatus[p.id]})`;
            } else if (participantTimes[p.id]) {
              status = ` (${type === 'start' ? 'starttid' : 'sluttid'}: ${participantTimes[p.id]})`;
            }
            return (
              <option key={p.id} value={p.id} className="text-lg sm:text-xl">
                {p.name}{status}
              </option>
            );
          })}
        </select>
      </div>
  <h2 className="text-xl sm:text-2xl font-semibold mb-4">
        {type === 'start' ? 'Registrer Starttid' : 'Registrer Sluttid'}
      </h2>
  <p className="mb-4 text-base sm:text-lg">Deltaker #{participant}</p>
      <>
        <div className="mb-4">
          <label htmlFor="manual-time" className="block mb-1">Manuell tid (hh:mm):</label>
          <input
            id="manual-time"
            type="time"
            value={manualTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualTime(e.target.value)}
            className="border px-3 py-3 rounded w-full text-base sm:text-lg"
          />
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center mb-4">
          <button
            onClick={() => {
              const current = getCurrentStatus();
              if (current) {
                setShowDialog({ action: 'TIME', newValue: manualTime });
                setPendingAction(() => () => handleRegister());
              } else {
                handleRegister();
              }
            }}
            className="bg-green-600 text-white px-6 py-4 rounded-md w-full sm:w-auto text-base sm:text-lg"
            disabled={!participant}
          >
            {manualTime ? 'Registrer manuell tid' : 'Registrer tid nå'}
          </button>
          <button
            onClick={() => {
              const current = getCurrentStatus();
              if (current) {
                setShowDialog({ action: 'DNS' });
                setPendingAction(() => () => {
                  setParticipantStatus(prev => {
                    const updated: { [id: string]: 'DNS' | 'DNF' | undefined } = { ...prev, [participant]: 'DNS' };
                    localStorage.setItem('participantStatus', JSON.stringify(updated));
                    return updated;
                  });
                  setConfirmed(true);
                  setRegisteredTime('DNS');
                });
              } else {
                setParticipantStatus(prev => {
                  const updated: { [id: string]: 'DNS' | 'DNF' | undefined } = { ...prev, [participant]: 'DNS' };
                  localStorage.setItem('participantStatus', JSON.stringify(updated));
                  return updated;
                });
                setConfirmed(true);
                setRegisteredTime('DNS');
              }
            }}
            className="bg-yellow-500 text-white px-6 py-4 rounded-md w-full sm:w-auto text-base sm:text-lg"
            type="button"
            disabled={!participant}
          >
            DNS
          </button>
          <button
            onClick={() => {
              const current = getCurrentStatus();
              if (current) {
                setShowDialog({ action: 'DNF' });
                setPendingAction(() => () => {
                  setParticipantStatus(prev => {
                    const updated: { [id: string]: 'DNS' | 'DNF' | undefined } = { ...prev, [participant]: 'DNF' };
                    localStorage.setItem('participantStatus', JSON.stringify(updated));
                    return updated;
                  });
                  setConfirmed(true);
                  setRegisteredTime('DNF');
                });
              } else {
                setParticipantStatus(prev => {
                  const updated: { [id: string]: 'DNS' | 'DNF' | undefined } = { ...prev, [participant]: 'DNF' };
                  localStorage.setItem('participantStatus', JSON.stringify(updated));
                  return updated;
                });
                setConfirmed(true);
                setRegisteredTime('DNF');
              }
            }}
            className="bg-red-600 text-white px-6 py-4 rounded-md w-full sm:w-auto text-base sm:text-lg"
            type="button"
            disabled={!participant}
          >
            DNF
          </button>
      {/* Dialog/modal for overskriving */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Overskriv registrering?</h3>
            <p className="mb-4">
              Det er allerede registrert{' '}
              {participantStatus[participant] === 'DNS' && 'DNS'}
              {participantStatus[participant] === 'DNF' && 'DNF'}
              {participantStatus[participant] === undefined && participantTimes[participant] && `tid: ${participantTimes[participant]}`}
              {' '}for deltaker #{participant}.<br />
              Ønsker du å overskrive denne?
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                className="px-4 py-3 bg-gray-200 rounded w-full sm:w-auto text-base sm:text-lg"
                onClick={() => {
                  setShowDialog(null);
                  setPendingAction(null);
                }}
              >Avbryt</button>
              <button
                className="px-4 py-3 bg-blue-600 text-white rounded w-full sm:w-auto text-base sm:text-lg"
                onClick={() => {
                  if (pendingAction) pendingAction();
                  setShowDialog(null);
                  setPendingAction(null);
                }}
              >Overskriv</button>
            </div>
          </div>
        </div>
      )}
        </div>
        {confirmed && (
          <div className="p-4 bg-green-100 border border-green-400 rounded-md">
            {registeredTime === 'DNS' && <>DNS registrert for #{participant}</>}
            {registeredTime === 'DNF' && <>DNF registrert for #{participant}</>}
            {registeredTime !== 'DNS' && registeredTime !== 'DNF' && <>Tid registrert for #{participant} kl. {registeredTime}</>}
          </div>
        )}
      </>
      <button
        className="block mt-6 text-blue-600 underline w-full sm:w-auto text-base sm:text-lg"
        onClick={() => navigate('/')}
      >
        Tilbake til start
      </button>
    </div>
  )
}
