import React, { createContext, useContext, useState, ReactNode } from 'react';

export type EtappeResultat = {
  etappe: number;
  starttid: string;
  maltid: string;
  idealtid: string;
  diff: string;
};

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
};

type DeltagerContextType = {
  deltagere: Deltager[];
  addDeltager: (d: Deltager) => void;
  updateResultater: (navn: string, resultater: EtappeResultat[]) => void;
  editDeltager: (navn: string, data: Partial<Deltager>) => void;
  deleteDeltager: (navn: string) => void;
};

const DeltagerContext = createContext<DeltagerContextType | undefined>(undefined);

export const useDeltagerContext = () => {
  const ctx = useContext(DeltagerContext);
  if (!ctx) throw new Error('useDeltagerContext must be used within DeltagerProvider');
  return ctx;
};

const initialTestDeltagere: Deltager[] = [
  { startnummer: '1', navn: 'Anders Ramsøe', nasjon: 'Norge', poststed: '1560 Larkollen', sykkel: 'Cz 360', modell: '1969', klasse: 'Oldtimer', starttid: '10:30', resultater: [] },
  { startnummer: '2', navn: 'Geir Jacobsen', nasjon: 'Norge', poststed: '3243 Kodal', sykkel: 'Bsa B50 Victor', modell: '1971', klasse: 'Oldtimer', starttid: '10:31', resultater: [] },
  { startnummer: '3', navn: 'Jan Roar Olafsen', nasjon: 'Norge', poststed: '3244 Sandefjord', sykkel: 'Honda XL250', modell: '1973', klasse: 'Oldtimer', starttid: '10:32', resultater: [] },
  { startnummer: '4', navn: 'Thor Bjørn Andenæs', nasjon: 'Norge', poststed: '1356', sykkel: 'Husqvarna', modell: '1974', klasse: 'Oldtimer', starttid: '10:33', resultater: [] },
  { startnummer: '5', navn: 'Dan Lindkjølen', nasjon: 'Norge', poststed: '3612 Kongsberg', sykkel: 'Yamaha DT 250', modell: '1974', klasse: 'Oldtimer', starttid: '10:35', resultater: [] },
  { startnummer: '6', navn: 'Simen Ramsøe', nasjon: 'Norge', poststed: '0559', sykkel: 'NV 38 250', modell: '1955', klasse: 'Pre 75', starttid: '10:36', resultater: [] },
  { startnummer: '7', navn: 'Dag H Engelsrud', nasjon: 'Norge', poststed: '1185 Oslo', sykkel: 'Yamaha DT 360', modell: '1974', klasse: 'Pre 75', starttid: '10:37', resultater: [] },
  { startnummer: '8', navn: 'Eirik Nesse', nasjon: 'Norge', poststed: '8310 Kabelvåg', sykkel: 'Honda ST70', modell: '1974', klasse: 'Pre 75', starttid: '10:38', resultater: [] },
  { startnummer: '9', navn: 'Jon Einar Bergersen', nasjon: 'Norge', poststed: '', sykkel: 'Husqvarna 250', modell: '1980', klasse: 'Pre 85', starttid: '10:39', resultater: [] },
  { startnummer: '10', navn: 'Mikkel Andenæs', nasjon: 'Norge', poststed: '1397 Nesøya', sykkel: 'Husqvarna 250', modell: '1978', klasse: 'Pre 85', starttid: '10:40', resultater: [] },
];

export const DeltagerProvider = ({ children }: { children: ReactNode }) => {
  const [deltagere, setDeltagere] = useState<Deltager[]>(initialTestDeltagere);
  const addDeltager = (d: Deltager) => setDeltagere((prev) => [...prev, d]);
  const updateResultater = (navn: string, resultater: EtappeResultat[]) => setDeltagere((prev) => prev.map(d => d.navn === navn ? { ...d, resultater } : d));
  const editDeltager = (navn: string, data: Partial<Deltager>) => setDeltagere((prev) => prev.map(d => d.navn === navn ? { ...d, ...data } : d));
  const deleteDeltager = (navn: string) => setDeltagere((prev) => prev.filter(d => d.navn !== navn));
  return (
    <DeltagerContext.Provider value={{ deltagere, addDeltager, updateResultater, editDeltager, deleteDeltager }}>
      {children}
    </DeltagerContext.Provider>
  );
};