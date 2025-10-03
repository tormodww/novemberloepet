/**
 * @vitest-environment happy-dom
 */
import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import React from 'react';

import App from './App';

test('renders welcome text', () => {
  render(<App />);
  // The app renders a welcome message in Norwegian
  const welcome = screen.getByText(/Velkommen til Novemberløpet/i);
  expect(welcome).toBeTruthy();
});