import { act,render, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { DeltagerProvider, useDeltagerContext } from '../DeltagerContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; },
  };
})();
global.localStorage = localStorageMock as any;

// Mock backend
vi.mock('../../api/deltagere', () => ({
  updateDeltagereById: vi.fn(() => Promise.resolve(true)),
  findRemoteByStartnummer: vi.fn(() => Promise.resolve({ objectId: 'mockid' })),
  createDeltagere: vi.fn(() => Promise.resolve({ objectId: 'mockid' })),
  fetchAllDeltagere: vi.fn(() => Promise.resolve([
    {
      startnummer: '1',
      navn: 'Deltaker 1',
      adresse: '',
      postnr: '',
      nasjon: '',
      resultater: Array.from({ length: 10 }, (_, i) => ({ etappe: i + 1, starttid: '', maltid: '', idealtid: '', diff: '' }))
    }
  ])),
}));

describe('DeltagerContext', () => {
  beforeEach(() => {
    localStorage.clear();
    // Pre-populate localStorage with a complete deltager object and 10 resultater
    localStorage.setItem('novemberloepet.deltagere.v1', JSON.stringify([
      {
        startnummer: '1',
        navn: 'Deltaker 1',
        adresse: '',
        postnr: '',
        nasjon: '',
        resultater: Array.from({ length: 10 }, (_, i) => ({ etappe: i + 1, starttid: '', maltid: '', idealtid: '', diff: '' }))
      }
    ]));
  });

  it('registrerer og persisterer starttid via updateStartTime', async () => {
    let ctx: any;
    function TestComp() {
      ctx = useDeltagerContext();
      const [_, setTick] = React.useState(0);
      React.useEffect(() => { setTick(t => t + 1); }, [ctx.deltagere]);
      return null;
    }
    render(
      <DeltagerProvider>
        <TestComp />
      </DeltagerProvider>
    );

    // Wait for provider to fetch initial deltagere from mocked API
    await waitFor(() => {
      expect(ctx.deltagere.find((d: any) => d.startnummer === '1')).toBeTruthy();
    });

    const etappe = 1;
    await act(async () => {
      await ctx.updateStartTime('1', etappe, '10:00');
    });
    await act(() => Promise.resolve());
    expect(ctx.deltagere.find((d: any) => d.startnummer === '1')?.resultater[etappe - 1].starttid).toBe('10:00');
    const stored = JSON.parse(localStorage.getItem('novemberloepet.deltagere.v1') || '[]');
    expect(stored.find((d: any) => d.startnummer === '1')?.resultater[etappe - 1].starttid).toBe('10:00');
  });

  it('registrerer og persisterer sluttid via updateFinishTime', async () => {
    let ctx: any;
    function TestComp() {
      ctx = useDeltagerContext();
      const [_, setTick] = React.useState(0);
      React.useEffect(() => { setTick(t => t + 1); }, [ctx.deltagere]);
      return null;
    }
    render(
      <DeltagerProvider>
        <TestComp />
      </DeltagerProvider>
    );

    // Wait for provider to fetch initial deltagere from mocked API
    await waitFor(() => {
      expect(ctx.deltagere.find((d: any) => d.startnummer === '1')).toBeTruthy();
    });

    const etappe = 1;
    await act(async () => {
      await ctx.updateFinishTime('1', etappe, '12:34');
    });
    await act(() => Promise.resolve());
    expect(ctx.deltagere.find((d: any) => d.startnummer === '1')?.resultater[etappe - 1].maltid).toBe('12:34');
    const stored = JSON.parse(localStorage.getItem('novemberloepet.deltagere.v1') || '[]');
    expect(stored.find((d: any) => d.startnummer === '1')?.resultater[etappe - 1].maltid).toBe('12:34');
  });
});