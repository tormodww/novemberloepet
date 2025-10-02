import { apiDelete,apiGet, apiPost, apiPut } from './apiClient';
import type { Etappe } from './types';

export type RemoteEtappeConfig = { etapper: Etappe[]; objectId?: string; id?: string };

export async function fetchEtapper(): Promise<RemoteEtappeConfig | Etappe[]> {
  const res = await apiGet<RemoteEtappeConfig | Etappe[]>('/api/etapper');
  if (!res.ok) throw new Error(`fetchEtapper failed: ${res.status}`);
  return res.data;
}

export async function createEtapper(payload: Etappe[]): Promise<RemoteEtappeConfig> {
  const res = await apiPost<RemoteEtappeConfig>('/api/etapper', { etapper: payload });
  if (!res.ok) throw new Error(`createEtapper failed: ${res.status}`);
  return res.data;
}

export async function updateEtapperById(id: string, payload: Etappe[]): Promise<boolean> {
  const res = await apiPut<RemoteEtappeConfig>(`/api/etapper/${id}`, { etapper: payload });
  return res.ok;
}

export async function deleteEtapperById(id: string): Promise<boolean> {
  const res = await apiDelete(`/api/etapper/${id}`);
  return res.ok;
}