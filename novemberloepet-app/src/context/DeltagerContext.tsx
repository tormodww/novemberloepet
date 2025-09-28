import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type EtappeResultat = {
  etappe: number;
  starttid: string;
  maltid: string;
  idealtid: string;
  diff: string;
};

export type DeltagerStatus = 'OK' | 'DNS' | 'DNF' | 'NONE';

export type Deltager = {
  startnummer: string;
  navn: string;
  nasjon: string;
  poststed: string;
  sykkel: string;
  modell: string;
  klasse: string;
  starttid: string;
  resultater?: EtappeResultat[];
  status?: DeltagerStatus;
};

type DeltagerContextType = {
  deltagere: Deltager[];
  addDeltager: (d: Deltager) => void;
  updateResultater: (navn: string, resultater: EtappeResultat[]) => void;
  editDeltager: (navn: string, data: Partial<Deltager>) => void;
  deleteDeltager: (navn: string) => void;
  setDeltagerStatus: (startnummer: string, status: DeltagerStatus) => void;
  setMultipleDeltagerStatus: (startnummerList: string[], status: DeltagerStatus) => void;
};

const DeltagerContext = createContext<DeltagerContextType | undefined>(undefined);

export const useDeltagerContext = () => {
  const ctx = useContext(DeltagerContext);
  if (!ctx) throw new Error('useDeltagerContext must be used within DeltagerProvider');
  return ctx;
};

const STORAGE_KEY = 'novemberloepet.deltagere.v1';

const generatedTestDeltagere = (() => {
  const bikes = [
    'Cz 360', 'Bsa B50 Victor', 'Honda XL250', 'Husqvarna', 'Yamaha DT 250', 'NV 38 250',
    'Yamaha DT 360', 'Honda ST70', 'Husqvarna 250', 'Suzuki RM', 'Kawasaki KE',
    'Triumph TR', 'Norton Commando', 'Royal Enfield', 'BMW R75', 'Harley WL', 'Montesa', 'Beta', 'Aprilia'
  ];
  const classes = ['Oldtimer', 'Pre 75', 'Pre 85', 'Classic'];
  const arr: Deltager[] = [];
  const baseMinutes = 10 * 60 + 30; // 10:30
  const pad = (n: number) => n.toString().padStart(2, '0');
  for (let i = 0; i < 44; i++) {
    const num = i + 1;
    const minutes = baseMinutes + i; // one minute apart
    const hh = Math.floor(minutes / 60);
    const mm = minutes % 60;
    arr.push({
      startnummer: String(num),
      navn: `Deltaker ${num}`,
      nasjon: '',
      poststed: '',
      sykkel: bikes[i % bikes.length],
      modell: String(1950 + (i % 50)),
      klasse: classes[i % classes.length],
      starttid: `${pad(hh)}:${pad(mm)}`,
      resultater: [],
      status: 'NONE'
    });
  }
  return arr;
})();

export const DeltagerProvider = ({ children }: { children: ReactNode }) => {
  const [deltagere, setDeltagere] = useState<Deltager[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Deltager[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      // ignore parse errors and fallback to generated
    }
    return generatedTestDeltagere;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deltagere));
    } catch (e) {
      // ignore storage errors
    }
  }, [deltagere]);

  const addDeltager = (d: Deltager) => setDeltagere((prev) => [...prev, d]);
  const updateResultater = (navn: string, resultater: EtappeResultat[]) => setDeltagere((prev) => prev.map(d => d.navn === navn ? { ...d, resultater } : d));
  const editDeltager = (navn: string, data: Partial<Deltager>) => setDeltagere((prev) => prev.map(d => d.navn === navn ? { ...d, ...data } : d));
  const deleteDeltager = (navn: string) => setDeltagere((prev) => prev.filter(d => d.navn !== navn));

  const setDeltagerStatus = (startnummer: string, status: DeltagerStatus) => {
    setDeltagere(prev => prev.map(d => d.startnummer === startnummer ? { ...d, status } : d));
    // Try to persist to backend (best-effort)
    (async () => {
      try {
        // fetch remote list to map startnummer -> objectId
        const res = await fetch('/api/deltagere');
        if (!res.ok) throw new Error(`Failed to fetch remote deltagere: ${res.status}`);
        const list = await res.json();
        if (!Array.isArray(list)) throw new Error('Remote deltagere response not an array');
        const match = list.find((r: any) => String(r.startnummer) === String(startnummer));
        if (match && (match.objectId || match.objectId)) {
          const id = match.objectId || match.objectId;
          await fetch(`/api/deltagere/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
        } else {
          // create new remote object
          const local = deltagere.find(d => d.startnummer === startnummer);
          if (local) {
            const payload = { ...local, status };
            const createRes = await fetch('/api/deltagere', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (createRes.ok) {
              const created = await createRes.json();
              const objectId = created.objectId || created.id;
              if (objectId) {
                // update local parseId if needed
                setDeltagere(prev => prev.map(d => d.startnummer === startnummer ? { ...d, /* parseId: objectId */ } : d));
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to persist participant status to proxy', e);
      }
    })();
  };

  const setMultipleDeltagerStatus = (startnummerList: string[], status: DeltagerStatus) => {
    setDeltagere(prev => prev.map(d => startnummerList.includes(d.startnummer) ? { ...d, status } : d));
    // persist to backend for each
    (async () => {
      try {
        const res = await fetch('/api/deltagere');
        if (!res.ok) throw new Error(`Failed to fetch remote deltagere: ${res.status}`);
        const list = await res.json();
        if (!Array.isArray(list)) throw new Error('Remote deltagere response not an array');
        // Map by startnummer
        const map = new Map<string, any>();
        list.forEach((r: any) => { if (r && r.startnummer) map.set(String(r.startnummer), r); });

        for (const sn of startnummerList) {
          const match = map.get(String(sn));
          if (match && (match.objectId || match.objectId)) {
            const id = match.objectId || match.objectId;
            try {
              await fetch(`/api/deltagere/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
            } catch (e) {
              console.warn(`Failed to update remote participant ${sn}`, e);
            }
          } else {
            // create
            const local = deltagere.find(d => d.startnummer === sn);
            if (local) {
              const payload = { ...local, status };
              try {
                const createRes = await fetch('/api/deltagere', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (createRes.ok) {
                  const created = await createRes.json();
                  const objectId = created.objectId || created.id;
                  if (objectId) {
                    // optionally update local with parseId
                    setDeltagere(prev => prev.map(d => d.startnummer === sn ? { ...d/*, parseId: objectId */ } : d));
                  }
                }
              } catch (e) {
                console.warn(`Failed to create remote participant for ${sn}`, e);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to persist multiple participant statuses to proxy', e);
      }
    })();
  };

  return (
    <DeltagerContext.Provider value={{ deltagere, addDeltager, updateResultater, editDeltager, deleteDeltager, setDeltagerStatus, setMultipleDeltagerStatus }}>
      {children}
    </DeltagerContext.Provider>
  );
};