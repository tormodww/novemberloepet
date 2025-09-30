// Public types used by the API boundary. Keep these small and stable so
// UI code can import from `src/api/types` without pulling in implementation.

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
  parseId?: string | null;
};

export type PendingOpType = 'update' | 'create' | 'delete';

export type PendingOp = {
  id: string;
  type: PendingOpType;
  startnummer?: string;
  payload?: any;
  parseId?: string | null;
  attempts: number;
  lastError?: string | null;
  nextAttemptAt?: number | null;
};

// Etappe config used by the EtappeContext and API
export type Etappe = {
  nummer: number;
  navn: string;
  idealtid: string; // mm:ss
};