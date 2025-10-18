import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { stages } from '../data/stages';

export default function Admin() {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState(stages[0]);

  return (
    <div className="w-full max-w-md mx-auto text-center px-2 py-8">
      <h1 className="text-2xl font-bold mb-8">Admin</h1>
      <div className="mb-6">
        <label htmlFor="stage-demo-select" className="block mb-2 font-semibold">Velg etappe for demo:</label>
        <select
          id="stage-demo-select"
          value={selectedStage}
          onChange={e => setSelectedStage(e.target.value)}
          className="w-full border rounded-md px-3 py-3 text-lg"
        >
          {stages.map(stage => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-6">
        <button
          className="bg-blue-600 text-white py-4 rounded-md text-lg font-semibold w-full"
          onClick={() => navigate('/admin/participants')}
        >
          Deltagere
        </button>
        <button
          className="bg-green-600 text-white py-4 rounded-md text-lg font-semibold w-full"
          onClick={() => navigate('/admin/results')}
        >
          Resultater
        </button>
        <button
          className="bg-gray-700 text-white py-4 rounded-md text-lg font-semibold w-full"
          onClick={() => {
            // Demo: registrer start/sluttid for 10 deltakere på alle etapper
            const times: { [stage: string]: { [id: string]: { start?: string; end?: string } } } = {};
            const status: { [stage: string]: { [id: string]: 'DNS' | 'DNF' | undefined } } = {};
            // Lag en liste med alle (deltaker, etappe)-kombinasjoner
            const combos: Array<{ stage: string; id: string }> = [];
            stages.forEach((stage: string) => {
              for (let i = 1; i <= 10; i++) {
                combos.push({ stage, id: String(i) });
              }
            });
            // Bland listen
            for (let i = combos.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [combos[i], combos[j]] = [combos[j], combos[i]];
            }
            // Velg 2 DNS og 3 DNF
            const dnsCombos = combos.slice(0, 2);
            const dnfCombos = combos.slice(2, 5);
            stages.forEach((stage: string) => {
              times[stage] = {};
              status[stage] = {};
              for (let i = 1; i <= 10; i++) {
                const id = String(i);
                const isDNS = dnsCombos.some(c => c.stage === stage && c.id === id);
                const isDNF = dnfCombos.some(c => c.stage === stage && c.id === id);
                if (isDNS) {
                  times[stage][id] = { start: '', end: '' };
                  status[stage][id] = 'DNS';
                } else if (isDNF) {
                  times[stage][id] = { start: '', end: '' };
                  status[stage][id] = 'DNF';
                } else {
                  // Starttid: 09:0i
                  const startMin = Math.floor(Math.random() * 10);
                  const startTime = `09:${String(startMin).padStart(2, '0')}`;
                  // Sluttid: starttid + random 1-20 min
                  const diff = Math.floor(Math.random() * 20) + 1;
                  const endMin = startMin + diff;
                  const endTime = `09:${String(endMin).padStart(2, '0')}`;
                  times[stage][id] = { start: startTime, end: endTime };
                  status[stage][id] = undefined;
                }
              }
            });
            localStorage.setItem('participantTimes', JSON.stringify(times));
            localStorage.setItem('participantStatus', JSON.stringify(status));
            alert('Demo-tider registrert for 10 deltakere på alle etapper! 2 DNS og 3 DNF er lagt inn tilfeldig. Gå til Resultater for å se.');
          }}
        >
          Demo: Registrer tider for 10 deltakere på alle etapper
        </button>
      </div>
    </div>
  );
}
