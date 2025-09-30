import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import type { Etappe } from '../api/types';
import { fetchEtapper, createEtapper, updateEtapperById, deleteEtapperById } from '../api/etapper';

function formatIdealTimeInput(input: string): string {
  // Fjerner alt annet enn tall
  const clean = input.replace(/\D/g, '');
  if (!clean) return '';
  let padded = clean.padStart(2, '0');
  if (padded.length < 4) padded = padded.padStart(4, '0');
  return `${padded.slice(0,2)}:${padded.slice(2,4)}`;
}

const defaultEtapper: Etappe[] = [
  { nummer: 1, navn: '1-SS - Moss Mc/Kåk', idealtid: '04:00' },
  { nummer: 2, navn: '2-SS Hveker', idealtid: '04:00' },
  { nummer: 3, navn: '3-SS Unnerud', idealtid: '02:00' },
  { nummer: 4, navn: '4-SS Brynhildsen', idealtid: '02:00' },
  { nummer: 5, navn: '5-SS Svinndal Cross', idealtid: '02:00' },
  { nummer: 6, navn: '6-SS Hveker', idealtid: '04:00' },
  { nummer: 7, navn: '7-SS/ Moss Mc/Kåk', idealtid: '02:00' },
];

const STORAGE_KEY = 'novemberloepet.etapper';

type EtappeContextType = {
  etapper: Etappe[];
  setEtapper: (etapper: Etappe[]) => void;
  updateEtappenavn: (nummer: number, navn: string) => void;
  updateIdealtid: (nummer: number, idealtid: string) => void;
  formatIdealTimeInput: (input: string) => string;
  resetEtapper: () => void;
};

const EtappeContext = createContext<EtappeContextType | undefined>(undefined);

export const EtappeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [etapper, setEtapper] = useState<Etappe[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Etappe[];
        if (Array.isArray(parsed) && parsed.every(p => typeof p.nummer === 'number')) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    return defaultEtapper;
  });
  const [remoteId, setRemoteId] = useState<string | null>(null);

  // Load from proxy on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const json = await fetchEtapper();
        // if proxy returned object with etapper array
        if (json && typeof json === 'object' && 'etapper' in json && Array.isArray(json.etapper) && mounted) {
          setEtapper(json.etapper as Etappe[]);
          setRemoteId((json.objectId || json.id) ?? null);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.etapper));
          return;
        }
        // if proxy returned array directly
        if (Array.isArray(json) && json.length && mounted) {
          setEtapper(json as Etappe[]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
          return;
        }
      } catch (e) {
        console.warn('Failed to load etapper from proxy, falling back to local', e);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // sync to localStorage whenever etapper changes
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(etapper)); } catch (e) {}
  }, [etapper]);

  const saveToProxy = async (payload: Etappe[]) => {
    try {
      if (remoteId) {
        await updateEtapperById(remoteId, payload);
      } else {
        const res = await createEtapper(payload);
        if (res && (res.objectId || res.id)) setRemoteId(res.objectId || res.id);
      }
    } catch (e) {
      console.warn('Failed to save etapper to proxy', e);
    }
  };

  const updateEtappenavn = (nummer: number, navn: string) => {
    const next = etapper.map(e => e.nummer === nummer ? { ...e, navn } : e);
    setEtapper(next);
    saveToProxy(next);
  };
  const updateIdealtid = (nummer: number, idealtid: string) => {
    const formatted = formatIdealTimeInput(idealtid);
    const next = etapper.map(e => e.nummer === nummer ? { ...e, idealtid: formatted } : e);
    setEtapper(next);
    saveToProxy(next);
  };
  const resetEtapper = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    setEtapper(defaultEtapper);
    (async () => {
      try {
        if (remoteId) {
          await deleteEtapperById(remoteId);
          setRemoteId(null);
        }
      } catch (e) { console.warn('Failed to remove remote etapper config', e); }
    })();
  };

  return (
    <EtappeContext.Provider value={{ etapper: etapper as Etappe[], setEtapper, updateEtappenavn, updateIdealtid, formatIdealTimeInput, resetEtapper }}>
      {children}
    </EtappeContext.Provider>
  );
};

export const useEtappeContext = (): EtappeContextType => {
  const ctx = useContext(EtappeContext);
  if (!ctx) throw new Error('useEtappeContext must be used within EtappeProvider');
  return ctx;
};