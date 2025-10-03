// Provide a deterministic mock for the Etappe context so tests don't depend on fetch timing
const mockEtapperList = [
  { nummer: 1, navn: '1-SS - Moss Mc/Kåk', idealtid: '04:00' },
  { nummer: 2, navn: '2-SS Hveker', idealtid: '04:00' },
  { nummer: 3, navn: '3-SS Unnerud', idealtid: '02:00' },
];

vi.mock('../../context/EtappeContext', () => {
  const React = require('react');
  const value = {
    etapper: mockEtapperList,
    setEtapper: () => {},
    updateEtappenavn: () => {},
    updateIdealtid: () => {},
    formatIdealTimeInput: (s: string) => s,
    resetEtapper: () => {},
    loadingEtapper: false,
    etapperError: null,
    reloadEtapper: async () => true,
    saveEtapperToBack4app: async () => true,
    showSaveDefaultPrompt: false,
    handleSaveDefaultEtapper: async () => {},
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
    maltid: '',
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

  it('registrerer sluttid via "nå"-knapp og henter ut igjen', async () => {
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
        fireEvent.change(autocompleteInput, { target: { value: '1' } });
        const participantOptions = await screen.findAllByText((content) => content.includes('Deltager 1'));
        const participantOption = participantOptions.find(opt => opt.textContent?.includes('# 1 Deltager 1')) || participantOptions[0];
        fireEvent.click(participantOption);
        const registerButton = await screen.findByText((content) => content.replace(/\s+/g, ' ').includes('Registrer sluttid = nå'));
        fireEvent.click(registerButton);
      });

      await screen.findByText((content) => content.includes('registrert for #1'));
      expect(screen.getByText((content) => content.includes('registrert for #1'))).toBeTruthy();
      expect(localStorage.getItem(STORAGE_KEY)).toMatch(/maltid/);
    } finally {
      unmount();
    }
  });

  it('registrerer sluttid manuelt og henter ut igjen', async () => {
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
        fireEvent.change(autocompleteInput, { target: { value: '1' } });
        const participantOptions = await screen.findAllByText((content) => content.includes('Deltager 1'));
        const participantOption = participantOptions.find(opt => opt.textContent?.includes('# 1 Deltager 1')) || participantOptions[0];
        fireEvent.click(participantOption);
        const manualButton = await screen.findByText((content) => content.replace(/\s+/g, ' ').includes('Korriger / sett tid manuelt'));
        fireEvent.click(manualButton);
      });

      const manualInput = await screen.findByLabelText(/Manuell sluttid/i);
      fireEvent.change(manualInput, { target: { value: '1234' } });
      const saveButton = await screen.findByText((content) => content.includes('Lagre manuell tid'));

      await act(async () => {
        fireEvent.click(saveButton);
      });

      await screen.findByText((content) => content.includes('registrert for #1'));
      expect(screen.getByText((content) => content.includes('registrert for #1'))).toBeTruthy();
      expect(localStorage.getItem(STORAGE_KEY)).toMatch(/maltid":"[^\"]"); // maltid should not be empty
    } finally {
      unmount();
    }
  });
});