// Provide a deterministic mock for the Etappe context so tests don't depend on fetch timing
vi.mock('../../context/EtappeContext', () => {
  const React = require('react');
  const value: any = {
    etapper: [
      { nummer: 1, navn: '1-SS - Moss Mc/Kåk', idealtid: '04:00' },
      { nummer: 2, navn: '2-SS Hveker', idealtid: '04:00' },
      { nummer: 3, navn: '3-SS Unnerud', idealtid: '02:00' },
    ],
    loadingEtapper: false,
    etapperError: null,
  };

  return {
    EtappeProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useEtappeContext: () => value,
  };
});

// Keep deltagere API mock small and predictable
vi.mock('../../api/deltagere', () => ({
  updateDeltagereById: vi.fn(() => Promise.resolve(true)),
  findRemoteByStartnummer: vi.fn(() => Promise.resolve(null)),
  createDeltagere: vi.fn(() => Promise.resolve({ objectId: 'mockid' })),
  fetchAllDeltagere: vi.fn(() => Promise.resolve([
    {
      startnummer: '1',
      navn: 'Deltager 1',
      adresse: '',
      postnr: '',
      nasjon: '',
      resultater: Array.from({ length: 10 }, (_, i) => ({ etappe: i + 1, starttid: '', sluttTid: '', idealtid: '', diff: '' }))
    }
  ])),
}));

// Now import testing utilities and the component under test
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DeltagerProvider } from '../../context/DeltagerContext';
import { EtappeProvider } from '../../context/EtappeContext';
import FinishTimeRegister from '../FinishTimeRegister';

const STORAGE_KEY = 'novemberloepet.deltagere.v1';
const mockDeltagere = [{
  startnummer: '1',
  navn: 'Deltager 1',
  adresse: '',
  postnr: '',
  nasjon: '',
  resultater: Array.from({ length: 10 }, (_, i) => ({
    etappe: i + 1,
    starttid: '',
    sluttTid: '',
    idealtid: '',
    diff: ''
  }))
}];

describe('FinishTimeRegister', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockDeltagere));
    const keysToRemove = [
      'finishtime.step',
      'finishtime.etappe',
      'finishtime.selectedStartnummer',
      'etappe.current',
      'novemberloepet.pendingops.v1'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
  });

  it('registrerer slutt-tid via "nå"-knapp og henter ut igjen', async () => {
    const { unmount } = render(
      <EtappeProvider>
        <DeltagerProvider>
          <FinishTimeRegister />
        </DeltagerProvider>
      </EtappeProvider>
    );

    try {
      await act(async () => {
        const etappeButton = await screen.findByRole('button', { name: /1-SS.*Moss Mc/i });
        fireEvent.click(etappeButton);
      });

      await screen.findByText(/Velg deltager/i);

      await act(async () => {
        const autocompleteInput = screen.getByRole('combobox', { name: /Startnummer eller navn/i });
        // MUI Autocomplete input is readOnly; open options popup instead
        fireEvent.mouseDown(autocompleteInput);
        const participantOptions = await screen.findAllByText((content) => content.includes('Deltager 1'));
        const participantOption = participantOptions.find(opt => opt.textContent?.includes('# 1 Deltager 1')) || participantOptions[0];
        fireEvent.click(participantOption);
        const registerButton = await screen.findByText((content) => content.replace(/\s+/g, ' ').includes('Registrer slutt-tid = nå'));
        fireEvent.click(registerButton);
      });

      await screen.findByText((content) => content.includes('registrert for #1'));
      expect(screen.getByText((content) => content.includes('registrert for #1'))).toBeTruthy();
      expect(localStorage.getItem(STORAGE_KEY)).toMatch(/sluttTid/);
    } finally {
      unmount();
    }
  });

  it('registrerer slutt-tid manuelt og henter ut igjen', async () => {
    const { unmount } = render(
      <EtappeProvider>
        <DeltagerProvider>
          <FinishTimeRegister />
        </DeltagerProvider>
      </EtappeProvider>
    );

    try {
      await act(async () => {
        const etappeButton = await screen.findByRole('button', { name: /1-SS.*Moss Mc/i });
        fireEvent.click(etappeButton);
      });

      await screen.findByText(/Velg deltager/i);

      await act(async () => {
        const autocompleteInput = screen.getByRole('combobox', { name: /Startnummer eller navn/i });
        fireEvent.mouseDown(autocompleteInput);
        const participantOptions = await screen.findAllByText((content) => content.includes('Deltager 1'));
        const participantOption = participantOptions.find(opt => opt.textContent?.includes('# 1 Deltager 1')) || participantOptions[0];
        fireEvent.click(participantOption);
        const manualButton = await screen.findByText((content) => content.replace(/\s+/g, ' ').includes('Korriger / sett tid manuelt'));
        fireEvent.click(manualButton);
      });

      const manualInput = await screen.findByLabelText(/Manuell slutt-tid/i);
      fireEvent.change(manualInput, { target: { value: '1234' } });
      const saveButton = await screen.findByText((content) => content.includes('Lagre manuell tid'));

      await act(async () => {
        fireEvent.click(saveButton);
      });

      await screen.findByText((content) => content.includes('registrert for #1'));
      expect(screen.getByText((content) => content.includes('registrert for #1'))).toBeTruthy();
      // sluttTid should not be empty: look for "sluttTid":"<one or more non-quote chars>"
      expect(localStorage.getItem(STORAGE_KEY)).toMatch(/"sluttTid":"[^"]+"/);
    } finally {
      unmount();
    }
  });
});