import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeltagerProvider, useDeltagerContext } from '../DeltagerContext';
import type { Deltager } from '../../api/types';

const TestConsumer: React.FC = () => {
  const { addDeltager, updateFinishTime, deltagere } = useDeltagerContext();

  React.useEffect(() => {
    const d: Partial<Deltager> = {
      startnummer: '1',
      navn: 'Tester',
      klasse: 'Testklasse',
      sykkel: '',
      modell: '',
      resultater: [],
    };
    addDeltager(d as Deltager);
  }, [addDeltager]);

  return (
    <div>
      <button onClick={() => updateFinishTime('1', 1, '09:30')}>Set finish</button>
      <pre data-testid="json">{JSON.stringify(deltagere)}</pre>
    </div>
  );
};

describe('DeltagerContext finish time flow', () => {
  it('stores sluttTid on updateFinishTime and updates context', async () => {
    render(
      <DeltagerProvider>
        <TestConsumer />
      </DeltagerProvider>
    );

    // click to set finish
    fireEvent.click(screen.getByText('Set finish'));

    await waitFor(() => {
      const pre = screen.getByTestId('json');
      expect(pre.textContent).toContain('sluttTid');
      expect(pre.textContent).toContain('09:30');
    });
  });
});
