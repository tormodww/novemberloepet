import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Etappe = {
  nummer: number;
  navn: string;
  idealtid: string; // mm:ss
};

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
        // basic validation: ensure array with nummer and navn
        if (Array.isArray(parsed) && parsed.every(p => typeof p.nummer === 'number')) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore and fall back to defaults
    }
    return defaultEtapper;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(etapper));
    } catch (e) {
      // ignore storage errors
    }
  }, [etapper]);

  const updateEtappenavn = (nummer: number, navn: string) => {
    setEtapper(prev => prev.map(e => e.nummer === nummer ? { ...e, navn } : e));
  };
  const updateIdealtid = (nummer: number, idealtid: string) => {
    setEtapper(prev => prev.map(e => e.nummer === nummer ? { ...e, idealtid: formatIdealTimeInput(idealtid) } : e));
  };
  const resetEtapper = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
    setEtapper(defaultEtapper);
  };
  return (
    <EtappeContext.Provider value={{ etapper, setEtapper, updateEtappenavn, updateIdealtid, formatIdealTimeInput, resetEtapper }}>
      {children}
    </EtappeContext.Provider>
  );
};

export const useEtappeContext = (): EtappeContextType => {
  const ctx = useContext(EtappeContext);
  if (!ctx) throw new Error('useEtappeContext must be used within EtappeProvider');
  return ctx;
};