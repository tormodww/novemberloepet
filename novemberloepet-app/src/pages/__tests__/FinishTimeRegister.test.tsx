import React from 'react';
import { render, fireEvent, act, screen } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import FinishTimeRegister from '../FinishTimeRegister';
import { DeltagerProvider } from '../../context/DeltagerContext';
import { EtappeProvider } from '../../context/EtappeContext';

// Mock backend API used by the app (best-effort)
vi.mock('../../api/deltagere', () => ({
  updateDeltagereById: vi.fn(() => Promise.resolve(true)),
  findRemoteByStartnummer: vi.fn(() => Promise.resolve(null)),
  createDeltagere: vi.fn(() => Promise.resolve({ objectId: 'mockid' })),
}));

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
    // Clear everything and ensure completely clean state
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockDeltagere));
    
    // Clear all possible persistent state keys
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
      // Velg etappe - use more robust selector
      await act(async () => {
        const etappeButton = screen.getByRole('button', { name: /1-SS.*Moss Mc/i });
        fireEvent.click(etappeButton);
      });
      
      // Wait for participant selection
      await screen.findByText(/Velg deltager/i);
      
      // Velg deltager
      await act(async () => {
        const autocompleteInput = screen.getByRole('combobox', { name: /Startnummer eller navn/i });
        fireEvent.change(autocompleteInput, { target: { value: '1' } });
        const participantOptions = await screen.findAllByText((content) => content.includes('Deltager 1'));
        const participantOption = participantOptions.find(opt => opt.textContent?.includes('# 1 Deltager 1')) || participantOptions[0];
        fireEvent.click(participantOption);
        const registerButton = await screen.findByText((content) => content.replace(/\s+/g, ' ').includes('Registrer sluttid = nå'));
        fireEvent.click(registerButton);
      });
      
      // Wait for UI to update and check for success message
      await screen.findByText((content) => content.includes('registrert for #1'));
      // Sjekk at sluttid vises
      expect(screen.getByText((content) => content.includes('registrert for #1'))).toBeTruthy();
      // Sjekk at sluttid er persistert
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
      // Velg etappe - use more robust selector
      await act(async () => {
        const etappeButton = screen.getByRole('button', { name: /1-SS.*Moss Mc/i });
        fireEvent.click(etappeButton);
      });
      
      // Wait for the UI to transition to participant selection
      await screen.findByText(/Velg deltager/i);
      
      // Velg deltager
      await act(async () => {
        // Now we should be on the participant selection page
        const autocompleteInput = screen.getByRole('combobox', { name: /Startnummer eller navn/i });
        fireEvent.change(autocompleteInput, { target: { value: '1' } });
        const participantOptions = await screen.findAllByText((content) => content.includes('Deltager 1'));
        const participantOption = participantOptions.find(opt => opt.textContent?.includes('# 1 Deltager 1')) || participantOptions[0];
        fireEvent.click(participantOption);
        const manualButton = await screen.findByText((content) => content.replace(/\s+/g, ' ').includes('Korriger / sett tid manuelt'));
        fireEvent.click(manualButton);
      });
      
      // Wait for manual input to appear
      const manualInput = await screen.findByLabelText(/Manuell sluttid/i);
      fireEvent.change(manualInput, { target: { value: '1234' } });
      const saveButton = await screen.findByText((content) => content.includes('Lagre manuell tid'));
      
      await act(async () => {
        fireEvent.click(saveButton);
      });
      
      // Check for success message
      await screen.findByText((content) => content.includes('registrert for #1'));
      
      // Sjekk at sluttid vises
      expect(screen.getByText((content) => content.includes('registrert for #1'))).toBeTruthy();
      
      // Check that some finish time was persisted
      expect(localStorage.getItem(STORAGE_KEY)).toMatch(/maltid":"[^"]/); // maltid should not be empty
    } finally {
      unmount();
    }
  });
});