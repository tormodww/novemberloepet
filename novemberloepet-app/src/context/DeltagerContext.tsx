import React, { createContext, ReactNode,useCallback,useContext, useEffect, useState } from 'react';

import type { Deltager, DeltagerStatus, EtappeResultat, PendingOp } from '../api/types';
export type { Deltager, DeltagerStatus, EtappeResultat } from '../api/types';
import { createDeltagere, fetchAllDeltagere, findRemoteByStartnummer,updateDeltagereById } from '../api/deltagere';
import { computeBackoff } from '../api/opQueue';

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
  updateStartTime: (startnummer: string, etappe: number, starttid: string) => Promise<boolean>;
  updateFinishTime: (startnummer: string, etappe: number, maltid: string) => Promise<boolean>;
  deleteStartTime: (startnummer: string, etappe: number) => Promise<boolean>;
  deleteFinishTime: (startnummer: string, etappe: number) => Promise<boolean>;
  pendingOps: PendingOp[];
  retryOp: (id: string) => void;
  clearOp: (id: string) => void;
  // accepts a single startnummer string, an array of startnummer strings, or null to clear
  setConfirmSelection: (startnummer: string | string[] | null) => void;
  navigateTo: (page: string) => void;
  // the currently selected startnummer for the Confirmation page (or null)
  confirmSelectedStartnummer: string | null;
};

const DeltagerContext = createContext<DeltagerContextType | undefined>(undefined);

export const useDeltagerContext = () => {
  const ctx = useContext(DeltagerContext);
  if (!ctx) throw new Error('useDeltagerContext must be used within DeltagerProvider');
  return ctx;
};

const STORAGE_KEY = 'novemberloepet.deltagere.v1';
const OPS_KEY = 'novemberloepet.pendingops.v1';

export const DeltagerProvider = ({ children, onNavigate }: { children: ReactNode; onNavigate?: (page: string) => void }) => {
  const [deltagere, setDeltagere] = useState<Deltager[]>([]);

  // Always fetch all deltagere from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const remote = await fetchAllDeltagere();
        setDeltagere(remote);
        // Optionally cache to localStorage for offline support
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
      } catch (e) {
        // If backend fails, show error or keep deltagere empty
        setDeltagere([]);
      }
    })();
  }, []);

  // Optionally keep localStorage updated for offline cache, but never use as initial source
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

  const persistOps = useCallback((ops: PendingOp[]) => {
    try {
      localStorage.setItem(OPS_KEY, JSON.stringify(ops));
    } catch (e) {
      // ignore
    }
  }, []);

  const enqueueOp = useCallback((op: PendingOp) => {
    setPendingOps(prev => {
      const next = [...prev, { ...op, nextAttemptAt: null }];
      persistOps(next);
      return next;
    });
  }, [persistOps]);

  const removeOp = useCallback((id: string) => {
    setPendingOps(prev => {
      const next = prev.filter(p => p.id !== id);
      persistOps(next);
      return next;
    });
  }, [persistOps]);

  // Attempt to process the queue (best-effort). Runs sequentially.
  const processQueue = useCallback(async () => {
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
            const ok = await updateDeltagereById(String(op.parseId), payload as any);
            if (ok) {
              removeOp(op.id);
              continue;
            }
          }

          // otherwise try to find remote by startnummer
          if (sn) {
            const match = await findRemoteByStartnummer(String(sn));
            if (match && (match.objectId || match.id)) {
              const mid = match.objectId || match.id;
              const ok = await updateDeltagereById(String(mid), payload as any);
              if (ok) {
                setDeltagere(prev => prev.map(d => d.startnummer === sn ? { ...d, parseId: mid } : d));
                removeOp(op.id);
                continue;
              }
            } else {
              try {
                const created = await createDeltagere(payload as any);
                const objectId = created.objectId || created.id;
                if (objectId) setDeltagere(prev => prev.map(d => d.startnummer === sn ? { ...d, parseId: objectId } : d));
                removeOp(op.id);
                continue;
              } catch (e) {
                // fallthrough to retry logic
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
  }, [pendingOps, deltagere, removeOp, persistOps]);

  useEffect(() => {
    // try processing every 10s while there are ops (best-effort)
    if (pendingOps.length === 0) return;
    const id = setInterval(() => {
      processQueue();
    }, 10000);
    // also try immediately
    processQueue();
    return () => clearInterval(id);
  }, [pendingOps.length, processQueue]);

  useEffect(() => {
    const onOnline = () => { processQueue(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [processQueue]);

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
    // Persist to backend
    (async () => {
      try {
        const local = deltagere.find(d => d.startnummer === startnummer);
        const payload: Partial<Deltager> = local ? {
          resultater: local.resultater?.map((r, i) => i === etappe - 1 ? { ...r, status } : r)
        } : {};
        await updateDeltager(startnummer, payload);
      } catch (e) {
        // If failed, will be queued by updateDeltager
        console.warn('Failed to persist etappe status to backend', e);
      }
    })();
  };
  const editDeltager = (navn: string, data: Partial<Deltager>) => {
    setDeltagere((prev) => prev.map(d => d.navn === navn ? { ...d, ...data } : d));
    // Persist to backend
    (async () => {
      try {
        const local = deltagere.find(d => d.navn === navn);
        if (local) {
          await updateDeltager(local.startnummer, data);
        }
      } catch (e) {
        // If failed, will be queued by updateDeltager
        console.warn('Failed to persist deltager edit to backend', e);
      }
    })();
  };
  const deleteDeltager = (startnummer: string) => setDeltagere((prev) => prev.filter(d => d.startnummer !== startnummer));

  const setDeltagerStatus = (startnummer: string, status: DeltagerStatus) => {
    setDeltagere(prev => prev.map(d => d.startnummer === startnummer ? { ...d, status } : d));
    // Try to persist to backend (best-effort)
    (async () => {
      try {
        // First try to use local parseId if available
        const local = deltagere.find(d => d.startnummer === startnummer);
        if (local && local.parseId) {
          await updateDeltagereById(String(local.parseId), { status } as any);
          return;
        }

        const match = await findRemoteByStartnummer(String(startnummer));
        if (match && (match.objectId || match.id)) {
          const id = match.objectId || match.id;
          await updateDeltagereById(String(id), { status } as any);
          // store parseId locally
          setDeltagere(prev => prev.map(d => d.startnummer === startnummer ? { ...d, parseId: id } : d));
        } else {
          if (local) {
            const payload = { ...local, status };
            try {
              const created = await createDeltagere(payload as any);
              const objectId = created.objectId || created.id;
              if (objectId) {
                setDeltagere(prev => prev.map(d => d.startnummer === startnummer ? { ...d, parseId: objectId } : d));
              }
            } catch (e) {
              // ignore create errors here
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
        const list = await fetchAllDeltagere();
        const map = new Map<string, any>();
        if (Array.isArray(list)) list.forEach((r: any) => { if (r && r.startnummer) map.set(String(r.startnummer), r); });

        for (const sn of startnummerList) {
          const local = deltagere.find(d => d.startnummer === sn);
          if (local && local.parseId) {
            try {
              await updateDeltagereById(String(local.parseId), { status } as any);
            } catch (e) {
              console.warn(`Failed to update remote participant ${sn}`, e);
            }
            continue;
          }

          const match = map.get(String(sn));
          if (match && (match.objectId || match.id)) {
            const id = match.objectId || match.id;
            try {
              await updateDeltagereById(String(id), { status } as any);
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
                const created = await createDeltagere(payload as any);
                const objectId = created.objectId || created.id;
                if (objectId) {
                  setDeltagere(prev => prev.map(d => d.startnummer === sn ? { ...d, parseId: objectId } : d));
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

  const updateDeltager = useCallback(async (startnummer: string, data: Partial<Deltager>): Promise<boolean> => {
    setDeltagere(prev => prev.map(d => d.startnummer === startnummer ? { ...d, ...data } : d));
    try {
      const local = deltagere.find(d => d.startnummer === startnummer);
      const payload = { ...(local || {}), ...data };
      const id = local?.parseId;
      if (id) {
        const ok = await updateDeltagereById(String(id), payload as any);
        if (ok) return true;
      } else {
        const match = await findRemoteByStartnummer(String(startnummer));
        if (match && (match.objectId || match.id)) {
          const mid = match.objectId || match.id;
          const ok = await updateDeltagereById(String(mid), payload as any);
          if (ok) {
            setDeltagere(prev => prev.map(d => d.startnummer === startnummer ? { ...d, parseId: mid } : d));
            return true;
          }
        }
      }
    } catch (e) {
      console.warn('updateDeltager failed, will enqueue', e);
    }
    // enqueue op for later retry
    enqueueOp({ id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, type: 'update', startnummer, payload: data, parseId: undefined, attempts: 0 });
    return false;
  }, [deltagere, enqueueOp]);

  const updateStartTime = async (startnummer: string, etappe: number, starttid: string): Promise<boolean> => {
    let updatedResults: EtappeResultat[] | undefined;
    setDeltagere(prev => prev.map(d => {
      if (d.startnummer !== startnummer) return d;
      const ETAPPER = Math.max(d.resultater?.length || 0, etappe);
      const results: EtappeResultat[] = Array.from({ length: ETAPPER }, (_, i) => d.resultater?.[i] || { etappe: i + 1, starttid: '', maltid: '', idealtid: '', diff: '' });
      const idx = etappe - 1;
      results[idx] = { ...results[idx], starttid };
      updatedResults = results;
      // Kun oppdater resultater, ikke planlagt starttid (d.starttid)
      return { ...d, resultater: results };
    }));
    const payload: Partial<Deltager> = updatedResults ? { resultater: updatedResults } : {};
    return updateDeltager(startnummer, payload);
  };

  // Update finish time for a deltager's etappe
  const updateFinishTime = useCallback(async (startnummer: string, etappe: number, maltid: string): Promise<boolean> => {
    let updatedResults: EtappeResultat[] | undefined;
    setDeltagere(prev => prev.map(d => {
      if (d.startnummer !== startnummer) return d;
      const ETAPPER = Math.max(d.resultater?.length || 0, etappe);
      const results: EtappeResultat[] = Array.from({ length: ETAPPER }, (_, i) => d.resultater?.[i] || { etappe: i + 1, starttid: '', maltid: '', idealtid: '', diff: '' });
      const idx = etappe - 1;
      results[idx] = { ...results[idx], maltid };
      updatedResults = results;
      return { ...d, resultater: results };
    }));
    // Sync with backend
    try {
      const payload: Partial<Deltager> = updatedResults ? { resultater: updatedResults } : {};
      const ok = await updateDeltager(startnummer, payload);
      if (!ok) throw new Error('Backend update failed');
      return true;
    } catch (e) {
      // Optionally enqueue for retry
      enqueueOp({ id: `${Date.now()}-finish`, type: 'update', startnummer, payload: { etappe, maltid }, attempts: 0 });
      return false;
    }
  }, [enqueueOp, updateDeltager]);

  // Delete finish time for a deltager's etappe
  const deleteFinishTime = useCallback(async (startnummer: string, etappe: number): Promise<boolean> => {
    setDeltagere(prev => prev.map(d =>
      d.startnummer === startnummer
        ? {
            ...d,
            resultater: d.resultater?.map(r =>
              r.etappe === etappe ? { ...r, sluttTid: '' } : r
            ) ?? []
          }
        : d
    ));
    // Sync with backend
    try {
      const ok = await import('../api/deltagere').then(api => api.deleteFinishTime(startnummer, etappe));
      if (!ok) throw new Error('Backend delete failed');
      return true;
    } catch (e) {
      // Optionally enqueue for retry
      enqueueOp({ id: `${Date.now()}-deletefinish`, type: 'update', startnummer, payload: { etappe, sluttTid: '' }, attempts: 0 });
      return false;
    }
  }, [enqueueOp]);

  // Delete start time for a deltager's etappe
  const deleteStartTime = useCallback(async (startnummer: string, etappe: number): Promise<boolean> => {
    let updatedResults: EtappeResultat[] | undefined;
    setDeltagere(prev => prev.map(d => {
      if (d.startnummer !== startnummer) return d;
      const results = Array.isArray(d.resultater) ? [...d.resultater] : [];
      const idx = etappe - 1;
      if (results[idx]) {
        results[idx] = { ...results[idx], starttid: '' };
      }
      updatedResults = results;
      return { ...d, resultater: results };
    }));
    // Sync with backend
    try {
      const payload: Partial<Deltager> = updatedResults ? { resultater: updatedResults } : {};
      const ok = await updateDeltager(startnummer, payload);
      if (!ok) throw new Error('Backend delete failed');
      return true;
    } catch (e) {
      // Optionally enqueue for retry
      enqueueOp({ id: `${Date.now()}-deletestart`, type: 'update', startnummer, payload: { etappe, starttid: '' }, attempts: 0 });
      return false;
    }
  }, [enqueueOp, updateDeltager]);

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
    <DeltagerContext.Provider value={({
      deltagere,
      addDeltager,
      updateResultater,
      setEtappeStatus,
      editDeltager,
      deleteDeltager,
      setDeltagerStatus,
      setMultipleDeltagerStatus,
      updateDeltager,
      updateStartTime,
      updateFinishTime,
      deleteStartTime,
      deleteFinishTime,
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
      setConfirmSelection: (v: string | string[] | null) => {
        if (Array.isArray(v)) {
          setConfirmSelectedStartnummer(v.length ? String(v[0]) : null);
        } else {
          setConfirmSelectedStartnummer(v);
        }
      },
    } as DeltagerContextType)}>
      {children}
    </DeltagerContext.Provider>
  );
};