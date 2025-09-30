import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type EtappeResultat = {
  etappe: number;
  starttid: string;
  maltid: string;
  idealtid: string;
  diff: string;
  status?: DeltagerStatus;
};

export type DeltagerStatus = 'OK' | 'DNS' | 'DNF' | 'NONE';

export type Deltager = {
  startnummer: string;
  navn: string;
  adresse?: string;
  postnr?: string;
  nasjon: string;
  poststed: string;
  telefon?: string;
  email?: string;
  sykkel: string;
  mod?: string;
  modell: string;
  teknisk?: string;
  preKlasse?: string;
  klasse: string;
  starttid: string;
  resultater?: EtappeResultat[];
  status?: DeltagerStatus;
  parseId?: string; // optional backend id (objectId)
};

type DeltagerContextType = {
  deltagere: Deltager[];
  addDeltager: (d: Deltager) => void;
  updateResultater: (navn: string, resultater: EtappeResultat[]) => void;
  setEtappeStatus: (startnummer: string, etappe: number, status: DeltagerStatus) => void;
  editDeltager: (navn: string, data: Partial<Deltager>) => void;
  deleteDeltager: (startnummer: string) => void;
  setDeltagerStatus: (startnummer: string, status: DeltagerStatus) => void;
  setMultipleDeltagerStatus: (startnummerList: string[], status: DeltagerStatus) => void;
  updateDeltager: (startnummer: string, data: Partial<Deltager>) => Promise<boolean>;
  pendingOps: PendingOp[];
  retryOp: (id: string) => void;
  clearOp: (id: string) => void;
  // accepts a single startnummer string, an array of startnummer strings, or null to clear
  setConfirmSelection: (startnummer: string | string[] | null) => void;
  navigateTo: (page: string) => void;
};

const DeltagerContext = createContext<DeltagerContextType | undefined>(undefined);

export const useDeltagerContext = () => {
  const ctx = useContext(DeltagerContext);
  if (!ctx) throw new Error('useDeltagerContext must be used within DeltagerProvider');
  return ctx;
};

const STORAGE_KEY = 'novemberloepet.deltagere.v1';
const OPS_KEY = 'novemberloepet.pendingops.v1';

type PendingOpType = 'update' | 'create' | 'delete';
type PendingOp = {
  id: string;
  type: PendingOpType;
  startnummer?: string;
  payload?: any;
  parseId?: string | null;
  attempts: number;
  lastError?: string | null;
  nextAttemptAt?: number | null;
};

function computeBackoff(attempts: number) {
  const a = Math.max(1, attempts || 1);
  const backoff = 2000 * Math.pow(2, a - 1);
  return Math.min(60000, backoff);
}

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
      adresse: '',
      postnr: '',
      nasjon: '',
      poststed: '',
      telefon: '',
      email: '',
      sykkel: bikes[i % bikes.length],
      mod: String(1950 + (i % 50)),
      modell: String(1950 + (i % 50)),
      teknisk: '',
      preKlasse: '',
      klasse: classes[i % classes.length],
      starttid: `${pad(hh)}:${pad(mm)}`,
      resultater: [],
      status: 'NONE'
    });
  }
  return arr;
})();

export const DeltagerProvider = ({ children, onNavigate }: { children: ReactNode; onNavigate?: (page: string) => void }) => {
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

  // pending ops queue (for offline / retry)
  const [pendingOps, setPendingOps] = useState<PendingOp[]>(() => {
    try {
      const raw = localStorage.getItem(OPS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PendingOp[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return [];
  });

  const persistOps = (ops: PendingOp[]) => {
    try {
      localStorage.setItem(OPS_KEY, JSON.stringify(ops));
    } catch (e) {
      // ignore
    }
  };

  function enqueueOp(op: PendingOp) {
    setPendingOps(prev => {
      const next = [...prev, { ...op, nextAttemptAt: null }];
      persistOps(next);
      return next;
    });
  }

  const removeOp = (id: string) => {
    setPendingOps(prev => {
      const next = prev.filter(p => p.id !== id);
      persistOps(next);
      return next;
    });
  };

  // Attempt to process the queue (best-effort). Runs sequentially.
  const processQueue = async () => {
    if (pendingOps.length === 0) return;
    // iterate over a snapshot
    const ops = [...pendingOps];
    for (const op of ops) {
      try {
        if (op.type === 'update') {
          // try to determine parseId or remote id
          const sn = op.startnummer;
          const local = sn ? deltagere.find(d => d.startnummer === sn) : undefined;
          const payload = { ...(local || {}), ...(op.payload || {}) };
          // if we have parseId, try direct PUT
          if (op.parseId) {
            const res = await fetch(`/api/deltagere/${op.parseId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) {
              removeOp(op.id);
              continue;
            }
          }

          // otherwise try to find remote by startnummer
          if (sn) {
            const listRes = await fetch('/api/deltagere');
            if (listRes.ok) {
              const list = await listRes.json();
              const match = Array.isArray(list) && list.find((r: any) => String(r.startnummer) === String(sn));
              if (match && (match.objectId || match.id)) {
                const mid = match.objectId || match.id;
                const res2 = await fetch(`/api/deltagere/${mid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (res2.ok) {
                  // store parseId locally
                  setDeltagere(prev => prev.map(d => d.startnummer === sn ? { ...d, parseId: mid } : d));
                  removeOp(op.id);
                  continue;
                }
              } else {
                // create remote object
                const createRes = await fetch('/api/deltagere', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (createRes.ok) {
                  const created = await createRes.json();
                  const objectId = created.objectId || created.id;
                  if (objectId) setDeltagere(prev => prev.map(d => d.startnummer === sn ? { ...d, parseId: objectId } : d));
                  removeOp(op.id);
                  continue;
                }
              }
            }
          }
        }

        // if we reach here, update attempt count and keep in queue; schedule next attempt
        setPendingOps(prev => {
          const next = prev.map(p => {
            if (p.id !== op.id) return p;
            const attempts = (p.attempts || 0) + 1;
            const backoff = computeBackoff(attempts);
            const nextAttemptAt = Date.now() + backoff;
            return { ...p, attempts, lastError: 'failed attempt', nextAttemptAt };
          });
          persistOps(next);
          return next;
        });
      } catch (e: any) {
        // increment attempts
        setPendingOps(prev => {
          const next = prev.map(p => {
            if (p.id !== op.id) return p;
            const attempts = (p.attempts || 0) + 1;
            const backoff = computeBackoff(attempts);
            const nextAttemptAt = Date.now() + backoff;
            return { ...p, attempts, lastError: String(e?.message || e), nextAttemptAt };
          });
          persistOps(next);
          return next;
        });
      }
    }
  };

  useEffect(() => {
    // try processing every 10s while there are ops (best-effort)
    if (pendingOps.length === 0) return;
    const id = setInterval(() => {
      processQueue();
    }, 10000);
    // also try immediately
    processQueue();
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOps.length]);

  useEffect(() => {
    const onOnline = () => { processQueue(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addDeltager = (d: Deltager) => setDeltagere((prev) => [...prev, d]);
  const updateResultater = (navn: string, resultater: EtappeResultat[]) => setDeltagere((prev) => prev.map(d => d.navn === navn ? { ...d, resultater } : d));
  const setEtappeStatus = (startnummer: string, etappe: number, status: DeltagerStatus) => {
    setDeltagere(prev => prev.map(d => {
      if (d.startnummer !== startnummer) return d;
      const results = Array.isArray(d.resultater) ? [...d.resultater] : [];
      const idx = Math.max(0, etappe - 1);
      const existing = results[idx] || { etappe, starttid: '', maltid: '', idealtid: '', diff: '' };
      results[idx] = { ...existing, status } as EtappeResultat;
      return { ...d, resultater: results };
    }));
  };
  const editDeltager = (navn: string, data: Partial<Deltager>) => setDeltagere((prev) => prev.map(d => d.navn === navn ? { ...d, ...data } : d));
  const deleteDeltager = (startnummer: string) => setDeltagere((prev) => prev.filter(d => d.startnummer !== startnummer));

  const setDeltagerStatus = (startnummer: string, status: DeltagerStatus) => {
    setDeltagere(prev => prev.map(d => d.startnummer === startnummer ? { ...d, status } : d));
    // Try to persist to backend (best-effort)
    (async () => {
      try {
        // First try to use local parseId if available
        const local = deltagere.find(d => d.startnummer === startnummer);
        if (local && local.parseId) {
          await fetch(`/api/deltagere/${local.parseId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
          return;
        }

        // fetch remote list to map startnummer -> objectId
        const res = await fetch('/api/deltagere');
        if (!res.ok) throw new Error(`Failed to fetch remote deltagere: ${res.status}`);
        const list = await res.json();
        if (!Array.isArray(list)) throw new Error('Remote deltagere response not an array');
        const match = list.find((r: any) => String(r.startnummer) === String(startnummer));
        if (match && (match.objectId || match.id)) {
          const id = match.objectId || match.id;
          await fetch(`/api/deltagere/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
          // store parseId locally
          setDeltagere(prev => prev.map(d => d.startnummer === startnummer ? { ...d, parseId: id } : d));
        } else {
          // create new remote object
          if (local) {
            const payload = { ...local, status };
            const createRes = await fetch('/api/deltagere', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (createRes.ok) {
              const created = await createRes.json();
              const objectId = created.objectId || created.id;
              if (objectId) {
                // update local parseId
                setDeltagere(prev => prev.map(d => d.startnummer === startnummer ? { ...d, parseId: objectId } : d));
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
        // fetch remote list once
        const res = await fetch('/api/deltagere');
        const list = res.ok ? await res.json() : [];
        const map = new Map<string, any>();
        if (Array.isArray(list)) list.forEach((r: any) => { if (r && r.startnummer) map.set(String(r.startnummer), r); });

        for (const sn of startnummerList) {
          const local = deltagere.find(d => d.startnummer === sn);
          if (local && local.parseId) {
            try {
              await fetch(`/api/deltagere/${local.parseId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
            } catch (e) {
              console.warn(`Failed to update remote participant ${sn}`, e);
            }
            continue;
          }

          const match = map.get(String(sn));
          if (match && (match.objectId || match.id)) {
            const id = match.objectId || match.id;
            try {
              await fetch(`/api/deltagere/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
              // store parseId locally
              setDeltagere(prev => prev.map(d => d.startnummer === sn ? { ...d, parseId: id } : d));
            } catch (e) {
              console.warn(`Failed to update remote participant ${sn}`, e);
            }
          } else {
            // create
            if (local) {
              const payload = { ...local, status };
              try {
                const createRes = await fetch('/api/deltagere', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (createRes.ok) {
                  const created = await createRes.json();
                  const objectId = created.objectId || created.id;
                  if (objectId) {
                    setDeltagere(prev => prev.map(d => d.startnummer === sn ? { ...d, parseId: objectId } : d));
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

  const updateDeltager = async (startnummer: string, data: Partial<Deltager>): Promise<boolean> => {
    // update local state immediately
    setDeltagere(prev => prev.map(d => d.startnummer === startnummer ? { ...d, ...data } : d));
    try {
      const local = deltagere.find(d => d.startnummer === startnummer);
      const payload = { ...(local || {}), ...data };
      const id = local?.parseId;
      if (id) {
        const res = await fetch(`/api/deltagere/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) return true;
      } else {
        const listRes = await fetch('/api/deltagere');
        if (listRes.ok) {
          const list = await listRes.json();
          const match = Array.isArray(list) && list.find((r:any) => String(r.startnummer) === String(startnummer));
          if (match && (match.objectId || match.id)) {
            const mid = match.objectId || match.id;
            const res2 = await fetch(`/api/deltagere/${mid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res2.ok) {
              setDeltagere(prev => prev.map(d => d.startnummer === startnummer ? { ...d, parseId: mid } : d));
              return true;
            }
          }
        }
      }
    } catch (e) {
      console.warn('updateDeltager failed, will enqueue', e);
    }
    // enqueue op for later retry
    const op: PendingOp = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, type: 'update', startnummer, payload: data, parseId: undefined, attempts: 0 };
    enqueueOp(op);
    return false;
  };

  // Confirm-selection state: allows other pages (e.g. Startliste) to tell Confirmation which startnummer to select
  const [confirmSelectedStartnummer, setConfirmSelectedStartnummer] = useState<string | null>(null);

  // navigation helper: if onNavigate prop provided, use it; otherwise no-op
  const navigateTo = (page: string) => {
    try {
      if (typeof onNavigate === 'function') onNavigate(page);
    } catch (e) {
      // ignore
    }
  };

  return (
    <DeltagerContext.Provider value={{
      deltagere,
      addDeltager,
      updateResultater,
      setEtappeStatus,
      editDeltager,
      deleteDeltager,
      setDeltagerStatus,
      setMultipleDeltagerStatus,
      updateDeltager,
      // queue API
      pendingOps,
      retryOp: (id: string) => {
        // expose retryOp via provider wrapper
        setPendingOps(prev => {
          const next = prev.map(p => p.id === id ? { ...p, attempts: 0, lastError: null, nextAttemptAt: null } : p);
          persistOps(next);
          return next;
        });
        setTimeout(() => { processQueue(); }, 200);
      },
      clearOp: (id: string) => removeOp(id),
      // confirm selection and navigation helpers
      navigateTo,
      confirmSelectedStartnummer,
      setConfirmSelection: setConfirmSelectedStartnummer,
     }}>
       {children}
     </DeltagerContext.Provider>
   );
 };