import React, { createContext, ReactNode,useCallback,useContext, useEffect, useState } from 'react';

import { createEtapper, deleteEtapperById,fetchEtapper, updateEtapperById } from '../api/etapper';
import type { Etappe } from '../api/types'; // Rettet: tidligere '../api' ga IDE-feil om tsconfig-inkludering

function formatIdealTimeInput(input: string): string {
  // Fjerner alt annet enn tall (padStart krever ES2017+, tsconfig target/lib er satt til ES2020)
  const clean = input.replace(/\D/g, '');
  if (!clean) return '';
  let padded = clean.padStart(2, '0');
  if (padded.length < 4) padded = padded.padStart(4, '0');
  return `${padded.slice(0,2)}:${padded.slice(2,4)}`;
}

const STORAGE_KEY = 'novemberloepet.etapper';

const defaultEtapper: Etappe[] = [
  { nummer: 1, navn: '1-SS - Moss Mc/Kåk', idealtid: '04:00' },
  { nummer: 2, navn: '2-SS Hveker', idealtid: '04:00' },
  { nummer: 3, navn: '3-SS Unnerud', idealtid: '02:00' },
  { nummer: 4, navn: '4-SS Brynhildsen', idealtid: '02:00' },
  { nummer: 5, navn: '5-SS Svinndal Cross', idealtid: '02:00' },
  { nummer: 6, navn: '6-SS Hveker', idealtid: '04:00' },
  { nummer: 7, navn: '7-SS/ Moss Mc/Kåk', idealtid: '02:00' },
];

type EtappeContextType = {
  etapper: Etappe[];
  setEtapper: (etapper: Etappe[]) => void;
  updateEtappenavn: (nummer: number, navn: string) => void;
  updateIdealtid: (nummer: number, idealtid: string) => void;
  formatIdealTimeInput: (input: string) => string;
  resetEtapper: () => void;
  loadingEtapper: boolean;
  etapperError: string | null;
  reloadEtapper: () => Promise<boolean>; // endret fra Promise<void>
  saveEtapperToBack4app: () => Promise<boolean>; // New function to save to back4app
  showSaveDefaultPrompt: boolean; // New state to control default prompt visibility
  handleSaveDefaultEtapper: () => Promise<void>; // New handler to save default etapper
};

const EtappeContext = createContext<EtappeContextType | undefined>(undefined);

export const EtappeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [etapper, setEtapper] = useState<Etappe[]>([]);
  const [remoteId, setRemoteId] = useState<string | null>(null);
  const [loadingEtapper, setLoadingEtapper] = useState<boolean>(false);
  const [etapperError, setEtapperError] = useState<string | null>(null);
  const [showSaveDefaultPrompt, setShowSaveDefaultPrompt] = useState(false);

  const loadFromProxy = useCallback(async (attempt = 1): Promise<boolean> => {
    setLoadingEtapper(true);
    setEtapperError(null);
    try {
      const json = await fetchEtapper();
      
      // Log the actual response for debugging
      console.log('API Response from /api/etapper:', json);
      
      // Handle back4app format: {"results": [...]} 
      if (json && typeof json === 'object' && 'results' in json && Array.isArray((json as any).results)) {
        const results = (json as any).results;
        if (results.length > 0) {
          // If we have results, look for etapper data in the first result
          const firstResult = results[0];
          if (firstResult && typeof firstResult === 'object' && 'etapper' in firstResult && Array.isArray(firstResult.etapper)) {
            const list = firstResult.etapper as Etappe[];
            setEtapper(list);
            setRemoteId(firstResult.objectId || firstResult.id || null);
            // Fjernet lagring til localStorage
            setLoadingEtapper(false);
            return true;
          }
        }
        // Empty results array - no data exists yet, fall back to default
        console.log('Empty results from back4app, using default etapper');
        setLoadingEtapper(false);
        return false;
      }
      
      // Check if response is an object with etapper array (old format)
      if (json && typeof json === 'object' && 'etapper' in json && Array.isArray((json as any).etapper)) {
        const list = (json as any).etapper as Etappe[];
        setEtapper(list);
        setRemoteId(((json as any).objectId || (json as any).id) ?? null);
        // Fjernet lagring til localStorage
        setLoadingEtapper(false);
        return true;
      }
      
      // Check if response is directly an array
      if (Array.isArray(json)) {
        setEtapper(json as Etappe[]);
        // Fjernet lagring til localStorage
        setLoadingEtapper(false);
        return true;
      }
      
      // Check if response is an error message or empty
      if (!json || (typeof json === 'object' && Object.keys(json).length === 0)) {
        console.warn('Empty or null response from /api/etapper, using fallback');
        setLoadingEtapper(false);
        return false;
      }
      
      // Log detailed error information
      console.error('Unexpected response format from /api/etapper:', {
        type: typeof json,
        isArray: Array.isArray(json),
        keys: typeof json === 'object' ? Object.keys(json) : 'N/A',
        response: json
      });
      
      throw new Error(`Ukjent responsformat fra /api/etapper. Type: ${typeof json}, Keys: ${typeof json === 'object' ? Object.keys(json).join(', ') : 'N/A'}`);
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error('Error in loadFromProxy:', e);
      
      if (attempt < 3) {
        // Simple exponential backoff
        const backoff = 300 * Math.pow(2, attempt - 1);
        console.log(`Retrying loadFromProxy in ${backoff}ms (attempt ${attempt + 1}/3)`);
        await new Promise(r => setTimeout(r, backoff));
        return loadFromProxy(attempt + 1);
      }
      
      console.warn('Failed to load etapper from proxy after 3 attempts, falling back to local data', e);
      setEtapperError(msg);
      setLoadingEtapper(false);
      return false;
    }
  }, []);

  const reloadEtapper = useCallback(async (): Promise<boolean> => {
    return loadFromProxy(1);
  }, [loadFromProxy]);

  // Always fetch etapper from backend on mount
  useEffect(() => {
    setLoadingEtapper(true);
    (async () => {
      try {
        const ok = await reloadEtapper();
        if (!ok) {
          setEtapper(defaultEtapper);
          setShowSaveDefaultPrompt(true);
          // Fjernet lagring til localStorage
        } else {
          setShowSaveDefaultPrompt(false);
        }
      } catch (e) {
        setEtapper([]);
        setEtapperError('Kunne ikke hente etapper fra backend');
        setShowSaveDefaultPrompt(false);
      } finally {
        setLoadingEtapper(false);
      }
    })();
  }, [reloadEtapper]);

  // Optionally keep localStorage updated for offline cache, but never use as initial source
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(etapper));
    } catch (e) {
      // ignore storage errors
    }
  }, [etapper]);

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
        if (res && (res.objectId || res.id)) setRemoteId(res.objectId ?? res.id ?? null);
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
    setEtapper([]);
    (async () => {
      try {
        if (remoteId) {
          await deleteEtapperById(remoteId);
          setRemoteId(null);
        }
      } catch (e) { console.warn('Failed to remove remote etapper config', e); }
    })();
  };

  const saveEtapperToBack4app = async (): Promise<boolean> => {
    try {
      await saveToProxy(etapper);
      return true;
    } catch (e) {
      console.error('Error saving etapper to back4app:', e);
      return false;
    }
  };

  const handleSaveDefaultEtapper = async () => {
    setLoadingEtapper(true);
    try {
      const res = await createEtapper(defaultEtapper);
      // If backend returned created object with etapper array, use it; otherwise fall back to defaults
      const list = res && (Array.isArray((res as any).etapper) ? (res as any).etapper as Etappe[] : defaultEtapper);
      setEtapper(list);
      setRemoteId((res && ((res as any).objectId || (res as any).id)) ?? null);
      // Fjernet lagring til localStorage
      setShowSaveDefaultPrompt(false);
      setEtapperError(null);
    } catch (e) {
      setEtapperError('Kunne ikke lagre default etapper til backend');
    } finally {
      setLoadingEtapper(false);
    }
  };

  return (
    <EtappeContext.Provider value={{
      etapper: etapper as Etappe[],
      setEtapper,
      updateEtappenavn,
      updateIdealtid,
      formatIdealTimeInput,
      resetEtapper,
      loadingEtapper,
      etapperError: etapperError, // eksplisitt union
      reloadEtapper,
      saveEtapperToBack4app,
      showSaveDefaultPrompt,
      handleSaveDefaultEtapper,
    }}>
      {children}
      {/* Prompt UI for saving default etapper */}
      {showSaveDefaultPrompt && (
        <div role="dialog" aria-modal="true" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'white',padding:'2rem',borderRadius:'8px',maxWidth:'400px',textAlign:'center'}}>
            <h2>Ingen etapper funnet</h2>
            <p>Vil du lagre standard etapper til backend?</p>
            <button onClick={handleSaveDefaultEtapper} style={{marginRight:'1rem'}}>Lagre</button>
            <button onClick={()=>setShowSaveDefaultPrompt(false)}>Avbryt</button>
          </div>
        </div>
      )}
    </EtappeContext.Provider>
  );
};

export const useEtappeContext = (): EtappeContextType => {
  const ctx = useContext(EtappeContext);
  if (!ctx) throw new Error('useEtappeContext must be used within EtappeProvider');
  return ctx;
};