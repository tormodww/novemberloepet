/**
 * @vitest-environment happy-dom
 */
import { render, screen } from '@testing-library/react';
import React from 'react';
import { expect,test } from 'vitest';

import App from './App';

test('renders welcome text', () => {
  render(<App />);
  // The app renders a welcome message in Norwegian
  const welcome = screen.getByText(/Velkommen til Novemberløpet/i);
  expect(welcome).toBeTruthy();
});