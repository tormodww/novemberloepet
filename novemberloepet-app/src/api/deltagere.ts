import type { Deltager } from './types';
import { apiGet, apiPost, apiPut } from './apiClient';

// Remote representation returned by proxy/Parse
export type RemoteDeltagere = Deltager & { objectId?: string; id?: string };

export async function fetchAllDeltagere(): Promise<RemoteDeltagere[]> {
  const res = await apiGet<RemoteDeltagere[]>('/api/deltagere');
  if (!res.ok) throw new Error(`fetchAllDeltagere failed: ${res.status}`);
  return res.data;
}

export async function updateDeltagereById(id: string, payload: Partial<Deltager>): Promise<boolean> {
  const res = await apiPut<RemoteDeltagere>(`/api/deltagere/${id}`, payload);
  return res.ok;
}

export async function createDeltagere(payload: Partial<Deltager>): Promise<RemoteDeltagere> {
  const res = await apiPost<RemoteDeltagere>('/api/deltagere', payload);
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