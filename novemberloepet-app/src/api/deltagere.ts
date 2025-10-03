import { apiGet, apiPost, apiPut } from './apiClient';
import type { Deltager } from './types';

// Remote representation returned by proxy/Parse
export type RemoteDeltagere = Deltager & { objectId?: string; id?: string };

export async function fetchAllDeltagere(): Promise<RemoteDeltagere[]> {
  const res = await apiGet<RemoteDeltagere[]>('/api/deltagere');
  if (!res.ok) throw new Error(`fetchAllDeltagere failed: ${res.status}`);
  return res.data;
}

function sanitizePayload<T extends object>(payload: T): T {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = payload as any;
  return rest as T;
}

export async function updateDeltagereById(id: string, payload: Partial<Deltager>): Promise<boolean> {
  const sanitized = sanitizePayload(payload);
  const res = await apiPut<RemoteDeltagere>(`/api/deltagere/${id}`, sanitized);
  return res.ok;
}

export async function createDeltagere(payload: Partial<Deltager>): Promise<RemoteDeltagere> {
  const sanitized = sanitizePayload(payload);
  const res = await apiPost<RemoteDeltagere>('/api/deltagere', sanitized);
  if (!res.ok) throw new Error(`createDeltagere failed: ${res.status}`);
  return res.data;
}

export async function findRemoteByStartnummer(startnummer: string): Promise<RemoteDeltagere | undefined> {
  try {
    const list = await fetchAllDeltagere();
    return Array.isArray(list) ? list.find(r => String(r.startnummer) === String(startnummer)) : undefined;
  } catch (e) {
    return undefined;
  }
}

export async function updateFinishTime(startnummer: string, etappe: number, sluttTid: string): Promise<boolean> {
  // Find the deltager by startnummer
  let deltager = await findRemoteByStartnummer(startnummer);
  if (!deltager) {
    // Create deltager if not found
    deltager = await createDeltagere({ startnummer });
  }
  // Update the correct etappe result
  const resultater = deltager.resultater?.map(r =>
    r.etappe === etappe ? { ...r, sluttTid } : r
  ) ?? [];
  const id = deltager.objectId || deltager.id || deltager.parseId;
  if (!id) return false;
  const res = await updateDeltagereById(id, { resultater });
  return res;
}

export async function deleteFinishTime(startnummer: string, etappe: number): Promise<boolean> {
  // Find the deltager by startnummer
  let deltager = await findRemoteByStartnummer(startnummer);
  if (!deltager) {
    // Create deltager if not found
    deltager = await createDeltagere({ startnummer });
  }
  // Remove slutt-tid from the correct etappe result
  const resultater = deltager.resultater?.map(r =>
    r.etappe === etappe ? { ...r, sluttTid: '' } : r
  ) ?? [];
  const id = deltager.objectId || deltager.id || deltager.parseId;
  if (!id) return false;
  const res = await updateDeltagereById(id, { resultater });
  return res;
}