import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchEtapper, createEtapper, updateEtapperById, deleteEtapperById } from '../etapper';

const globalAny: any = global;

describe('etapper API wrappers', () => {
  beforeEach(() => {
    globalAny.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchEtapper returns object when proxy responds with object', async () => {
    const mock = { etapper: [{ nummer: 1, navn: 'A', idealtid: '02:00' }], objectId: 'oid' };
    globalAny.fetch.mockResolvedValue({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => mock });
    const res = await fetchEtapper();
    expect(res).toEqual(mock);
  });

  it('createEtapper posts payload and returns created object', async () => {
    const payload = [{ nummer: 1, navn: 'A', idealtid: '02:00' }];
    const created = { etapper: payload, objectId: 'o1' };
    globalAny.fetch.mockResolvedValue({ ok: true, status: 201, headers: { get: () => 'application/json' }, json: async () => created });
    const res = await createEtapper(payload as any);
    expect(res).toEqual(created);
    expect(globalAny.fetch).toHaveBeenCalledWith('/api/etapper', expect.objectContaining({ method: 'POST' }));
  });

  it('updateEtapperById returns ok boolean', async () => {
    globalAny.fetch.mockResolvedValue({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({}) });
    const ok = await updateEtapperById('id1', [{ nummer: 1, navn: 'A', idealtid: '02:00' }]);
    expect(ok).toBe(true);
    expect(globalAny.fetch).toHaveBeenCalledWith('/api/etapper/id1', expect.objectContaining({ method: 'PUT' }));
  });

  it('deleteEtapperById returns ok boolean', async () => {
    globalAny.fetch.mockResolvedValue({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({}) });
    const ok = await deleteEtapperById('id1');
    expect(ok).toBe(true);
    expect(globalAny.fetch).toHaveBeenCalledWith('/api/etapper/id1', expect.objectContaining({ method: 'DELETE' }));
  });
});
