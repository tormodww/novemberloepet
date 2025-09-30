import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAllDeltagere, createDeltagere, updateDeltagereById } from '../deltagere';
import type { RemoteDeltagere } from '../deltagere';

const globalAny: any = global;

describe('deltagere API wrappers', () => {
  beforeEach(() => {
    globalAny.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchAllDeltagere returns array on success', async () => {
    const mockData: RemoteDeltagere[] = [{ startnummer: '1', navn: 'A', nasjon: '', poststed: '', sykkel: '', modell: '', klasse: '', starttid: '' } as any];
    globalAny.fetch.mockResolvedValue({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => mockData });

    const res = await fetchAllDeltagere();
    expect(res).toEqual(mockData);
    expect(globalAny.fetch).toHaveBeenCalledWith('/api/deltagere', expect.any(Object));
  });

  it('createDeltagere posts payload and returns created object', async () => {
    const payload = { startnummer: '2', navn: 'B' } as any;
    const created = { ...payload, objectId: 'abc123' } as RemoteDeltagere;
    globalAny.fetch.mockResolvedValue({ ok: true, status: 201, headers: { get: () => 'application/json' }, json: async () => created });

    const res = await createDeltagere(payload);
    expect(res).toEqual(created);
    // assert fetch called with correct args
    expect(globalAny.fetch).toHaveBeenCalledWith('/api/deltagere', expect.objectContaining({ method: 'POST' }));
  });

  it('updateDeltagereById returns ok boolean', async () => {
    globalAny.fetch.mockResolvedValue({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({}) });
    const ok = await updateDeltagereById('id1', { navn: 'C' });
    expect(ok).toBe(true);
    expect(globalAny.fetch).toHaveBeenCalledWith('/api/deltagere/id1', expect.objectContaining({ method: 'PUT' }));
  });
});
