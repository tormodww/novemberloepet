

import { useState } from 'react';
import { stages } from '../data/stages';
const stageList: string[] = Array.isArray(stages) ? stages : [];

import Toolbar from './Toolbar';
import { setParticipantTimes, setParticipantStatus } from '../api/storageApi';

export default function Admin() {
  const [selectedStage, setSelectedStage] = useState(stageList[0]);
  return (
    <>
      <Toolbar />
      <div className="w-full max-w-md mx-auto text-center px-2 py-8 pt-20">
        <h1 className="text-2xl font-bold mb-8">Admin</h1>
        <div className="mb-6">
          <label htmlFor="stage-demo-select" className="block mb-2 font-semibold">Velg etappe for demo:</label>
          <select
            id="stage-demo-select"
            value={selectedStage}
            onChange={e => setSelectedStage(e.target.value)}
            className="w-full border rounded-md px-3 py-3 text-lg"
          >
            {stageList.map((stage: string) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-6">
          <a
            className="bg-yellow-600 text-white py-4 rounded-md text-lg font-semibold w-full block"
            href="etapper.html"
          >
            Konfigurer etapper
          </a>
          <a
            className="bg-blue-600 text-white py-4 rounded-md text-lg font-semibold w-full block"
            href="deltakere.html"
          >
            Deltagere
          </a>
          <a
            className="bg-green-600 text-white py-4 rounded-md text-lg font-semibold w-full block"
            href="resultater.html"
          >
            Resultater
          </a>
          <button
            className="bg-gray-700 text-white py-4 rounded-md text-lg font-semibold w-full"
            onClick={() => {
              // Demo: registrer start/sluttid for alle deltakere på alle etapper
              const times: { [stage: string]: { [id: string]: { start?: string; end?: string } } } = {};
              const status: { [stage: string]: { [id: string]: 'DNS' | 'DNF' | undefined } } = {};
              const participantCount = 30;
              // Finn 10% DNS og 5% DNF deltakere
              const allIds = Array.from({length: participantCount}, (_, i) => String(i + 1));
              // Bland deltakerlisten
              const shuffled = [...allIds];
              for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
              }
              const dnsIds = shuffled.slice(0, Math.ceil(participantCount * 0.10));
              const dnfIds = shuffled.slice(Math.ceil(participantCount * 0.10), Math.ceil(participantCount * 0.10) + Math.ceil(participantCount * 0.05));
              // Velg én tilfeldig etappe for hver DNS/DNF deltaker
              const dnsStages: { [id: string]: string } = {};
              dnsIds.forEach(id => {
                dnsStages[id] = stageList[Math.floor(Math.random() * stageList.length)];
              });
              const dnfStages: { [id: string]: string } = {};
              dnfIds.forEach(id => {
                dnfStages[id] = stageList[Math.floor(Math.random() * stageList.length)];
              });
              // Registrer tider/status
              stageList.forEach((stage: string) => {
                times[stage] = {};
                status[stage] = {};
                for (let i = 1; i <= participantCount; i++) {
                  const id = String(i);
                  if (dnsIds.includes(id) && dnsStages[id] === stage) {
                    times[stage][id] = { start: '', end: '' };
                    status[stage][id] = 'DNS';
                  } else if (dnfIds.includes(id) && dnfStages[id] === stage) {
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
              setParticipantTimes(times);
              setParticipantStatus(status);
              alert('Demo-tider registrert for alle deltakere på alle etapper! 10% får DNS og 5% får DNF på én tilfeldig etappe. Gå til Resultater for å se.');
            }}
          >
            Demo: Registrer demo tider for alle deltakere på alle etapper
          </button>
          <div className="flex flex-col gap-2">
            <label htmlFor="demo-count" className="block text-sm font-semibold">Antall deltakere for demo</label>
            <input
              id="demo-count"
              type="number"
              min={1}
              max={30}
              defaultValue={10}
              className="border px-3 py-2 rounded w-full text-lg text-center mb-2"
            />
            <button
              className="bg-gray-500 text-white py-4 rounded-md text-lg font-semibold w-full"
              onClick={() => {
                const input = document.getElementById('demo-count') as HTMLInputElement | null;
                const demoCount = input && input.value ? Math.max(1, Math.min(30, parseInt(input.value))) : 10;
                const times: { [stage: string]: { [id: string]: { start?: string; end?: string } } } = {};
                const status: { [stage: string]: { [id: string]: 'DNS' | 'DNF' | undefined } } = {};
                const participantCount = 30;
                const allIds = Array.from({length: participantCount}, (_, i) => String(i + 1));
                // Velg demoCount deltakere
                const shuffled = [...allIds];
                for (let i = shuffled.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                const demoIds = shuffled.slice(0, demoCount);
                const dnsIds = demoIds.slice(0, Math.ceil(demoCount * 0.10));
                const dnfIds = demoIds.slice(Math.ceil(demoCount * 0.10), Math.ceil(demoCount * 0.10) + Math.ceil(demoCount * 0.05));
                // Velg én tilfeldig etappe for hver DNS/DNF deltaker
                const dnsStages: { [id: string]: string } = {};
                dnsIds.forEach(id => {
                  dnsStages[id] = stageList[Math.floor(Math.random() * stageList.length)];
                });
                const dnfStages: { [id: string]: string } = {};
                dnfIds.forEach(id => {
                  dnfStages[id] = stageList[Math.floor(Math.random() * stageList.length)];
                });
                // Registrer tider/status
                stageList.forEach((stage: string) => {
                  times[stage] = {};
                  status[stage] = {};
                  demoIds.forEach(id => {
                    if (dnsIds.includes(id) && dnsStages[id] === stage) {
                      times[stage][id] = { start: '', end: '' };
                      status[stage][id] = 'DNS';
                    } else if (dnfIds.includes(id) && dnfStages[id] === stage) {
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
                  });
                });
                setParticipantTimes(times);
                setParticipantStatus(status);
                alert(`Demo-tider registrert for ${demoCount} deltakere! 10% får DNS og 5% får DNF på én tilfeldig etappe. Gå til Resultater for å se.`);
              }}
            >
              Demo: Registrer demo tider for valgt antall deltakere
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
