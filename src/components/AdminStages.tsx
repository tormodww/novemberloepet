import { useState } from 'react';
import { getAdminStages, setAdminStages, getCustomStages, setCustomStages } from '../api/storageApi';
// @ts-ignore
import { stages as initialStages } from '../data/stages';
const stageList: string[] = Array.isArray(initialStages) ? initialStages : [];

export default function AdminStages() {
  // Last fra storage API hvis finnes, ellers fra customStages, ellers fra data/stages
  const storedStages = getAdminStages();
  const customStages = getCustomStages();
  const [stages, setStages] = useState<Array<{ name: string; ideal: string }>>(
    storedStages
      || (customStages
        ? customStages.map((name: string, idx: number) => ({ name, ideal: idx < 3 ? '02:00' : '02:30' }))
        : initialStages.map((name: string, idx: number) => ({ name, ideal: idx < 3 ? '02:00' : '02:30' }))
      )
  );

  // Håndter endring av navn/idealtid
  const handleChange = (idx: number, field: 'name' | 'ideal', value: string) => {
    const updated = stages.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    );
    setStages(updated);
    setAdminStages(updated);
  };

  // Legg til ny etappe
  const addStage = () => {
    setStages([...stages, { name: '', ideal: '' }]);
  };

  // Slett etappe
  const removeStage = (idx: number) => {
    const updated = stages.filter((_, i) => i !== idx);
    setStages(updated);
    setAdminStages(updated);
  };

  return (
    <div className="w-full max-w-md mx-auto text-center px-2 py-8">
      <h1 className="text-2xl font-bold mb-8">Konfigurer etapper</h1>
      <ul className="mb-8">
        {stages.map((stage, idx) => (
          <li key={idx} className="mb-4 p-4 border rounded-md flex flex-col gap-2">
            <input
              type="text"
              value={stage.name}
              onChange={e => handleChange(idx, 'name', e.target.value)}
              placeholder="Etappenavn"
              className="border px-3 py-2 rounded w-full"
            />
            <label className="block text-sm font-semibold text-left mb-1">Idealtid (mm:ss)</label>
            <input
              type="text"
              value={stage.ideal}
              onChange={e => {
                let v = e.target.value.replace(/[^0-9:]/g, '');
                // Automatisk kolon etter to sifre hvis ikke allerede finnes
                if (/^\d{2}$/.test(v) && !v.includes(':')) v = v + ':';
                // Begrens til mm:ss
                if (v.length > 5) v = v.slice(0, 5);
                handleChange(idx, 'ideal', v);
              }}
              placeholder="--:--"
              className="border px-3 py-2 rounded w-full font-mono tracking-widest text-center"
              maxLength={5}
              pattern="\d{2}:\d{2}"
              inputMode="numeric"
            />
            <button
              className="text-red-600 underline text-sm mt-2"
              onClick={() => removeStage(idx)}
            >Slett etappe</button>
          </li>
        ))}
      </ul>
      <button
        className="bg-blue-600 text-white py-3 rounded-md text-lg font-semibold w-full mb-4"
        onClick={addStage}
      >Legg til etappe</button>
      <button
        className="bg-red-600 text-white py-3 rounded-md text-lg font-semibold w-full mb-4"
          onClick={() => {
          const defaultStages = [
            '1-SS MOSS MC/KÅK',
            '2-SS HVEKER',
            '3-SS UNNERUD',
            '4-SS BRYNHILDSEN',
            '5-SS SVINNDAL CROSS',
            '6-SS HVEKER',
            '7-SS MOSS MC/KÅK'
          ];
          const defaultStagesWithIdeal = defaultStages.map((name, idx) => ({
            name,
            ideal: (idx < 3 || idx === 6) ? '02:00' : '02:30'
          }));
          setAdminStages(defaultStagesWithIdeal);
          setCustomStages(defaultStages);
          // Update state to reflect defaults
          setStages(defaultStagesWithIdeal);
        }}
      >Tilbakestill til standard etapper</button>
  <a href="admin.html" className="block mt-4 text-blue-600 underline">Tilbake til admin</a>
    </div>
  );
}
