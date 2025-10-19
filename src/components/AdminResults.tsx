
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
// @ts-ignore
import { participants } from '../data/participants';
const participantList: {id: string; name: string}[] = Array.isArray(participants) ? participants : [];
// @ts-ignore
import { stages } from '../data/stages';
const stageList: string[] = Array.isArray(stages) ? stages : [];

// Hent resultater fra localStorage (samme nøkkel som TimeRegistration bruker for state)
function getResults() {
  try {
    const times = JSON.parse(localStorage.getItem('participantTimes') || '{}');
    const status = JSON.parse(localStorage.getItem('participantStatus') || '{}');
    return { times, status };
  } catch {
    return { times: {}, status: {} };
  }
}

export default function AdminResults() {
  // const navigate = useNavigate();
  const [results, setResults] = useState(getResults());
  const [selectedStage, setSelectedStage] = useState<string | 'ALL'>('ALL');

  function refreshResults() {
    setResults(getResults());
  }

  // Hent resultater for valgt etappe
  const timesForStage = selectedStage === 'ALL' ? null : results.times[selectedStage] || {};
  const statusForStage = selectedStage === 'ALL' ? null : results.status[selectedStage] || {};

  return (
    <div className="w-full max-w-md mx-auto text-center px-2 py-8">
      <h1 className="text-2xl font-bold mb-8">Resultater</h1>
      <div className="mb-6">
        <label htmlFor="stage-result-select" className="block mb-2 font-semibold">Velg etappe:</label>
        <select
          id="stage-result-select"
          value={selectedStage}
          onChange={e => setSelectedStage(e.target.value as string | 'ALL')}
          className="w-full border rounded-md px-3 py-3 text-lg"
        >
          <option value="ALL">Samlet resultat</option>
          {stages.map((stage: string) => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
      </div>
      <button
        className="mb-6 px-4 py-2 bg-blue-100 rounded text-blue-700"
        onClick={refreshResults}
      >Oppdater</button>
      <ul className="mb-8">
        {selectedStage === 'ALL'
          ? (() => {
              function parseTime(t: string | undefined) {
                if (!t) return null;
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
              }
              const resultList = participants.map((p: { id: string; name: string }) => {
                let total = 0;
                let validEtapper = 0;
                let hasDNSorDNF = false;
                const dnsDnfStages: string[] = [];
                stages.forEach((stage: string) => {
                  const timeObj = results.times[stage]?.[p.id];
                  const status = results.status[stage]?.[p.id];
                  if (status === 'DNS' || status === 'DNF') {
                    hasDNSorDNF = true;
                    dnsDnfStages.push(`${stage} (${status})`);
                  } else if (timeObj?.start && timeObj?.end) {
                    const start = parseTime(timeObj.start);
                    const end = parseTime(timeObj.end);
                    if (start !== null && end !== null && end > start) {
                      total += end - start;
                      validEtapper++;
                    }
                  }
                });
                return {
                  id: p.id,
                  name: p.name,
                  total,
                  validEtapper,
                  hasDNSorDNF,
                  dnsDnfStages
                };
              });
              // Først de med registrert tid, så DNS/DNF, så de uten registrering
              const withTime = resultList.filter((r: any) => r.validEtapper > 0 && !r.hasDNSorDNF);
              const dnsDnf = resultList.filter((r: any) => r.hasDNSorDNF);
              const noReg = resultList.filter((r: any) => r.validEtapper === 0 && !r.hasDNSorDNF);
              withTime.sort((a: any, b: any) => a.total - b.total);
              // DNS/DNF og Ingen registrering beholdes i opprinnelig rekkefølge
              const finalList = [...withTime, ...dnsDnf, ...noReg];
              return finalList.map((r: any, idx: number) => (
                <li key={r.id} className="py-2 border-b last:border-b-0 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <span className={r.hasDNSorDNF ? "text-red-600" : ""}>{idx + 1}. {r.name}</span>
                  <span className={r.hasDNSorDNF ? "text-red-600 text-sm" : "text-gray-600 text-sm"}>
                    {r.hasDNSorDNF
                      ? <span className="block text-xs text-red-700">{r.dnsDnfStages.join(', ')}</span>
                      : r.validEtapper > 0
                        ? `${r.total} min (${r.validEtapper} etapper)`
                        : 'Ingen registrering'}
                  </span>
                </li>
              ));
            })()
          : participants.map((p: { id: string; name: string }) => {
              const status = statusForStage?.[p.id];
              const timeObj = timesForStage?.[p.id];
              const isDNS = status === 'DNS';
              const isDNF = status === 'DNF';
              return (
                <li key={p.id} className="py-2 border-b last:border-b-0 flex items-center justify-between">
                  <span className={(isDNS || isDNF) ? "text-red-600" : ""}>{p.name}</span>
                  <span className={(isDNS || isDNF) ? "text-red-600 text-sm" : "text-gray-600 text-sm"}>
                    {isDNS ? 'DNS' : isDNF ? 'DNF' : timeObj ? `Start: ${timeObj.start || '-'} / Slutt: ${timeObj.end || '-'}` : 'Ingen registrering'}
                  </span>
                </li>
              );
            })}
      </ul>
      <a
        className="block mt-6 text-blue-600 underline w-full sm:w-auto text-base sm:text-lg"
        href="admin.html"
      >
        Tilbake til admin
      </a>
    </div>
  );
}
