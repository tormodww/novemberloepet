import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders welcome text', () => {
  render(<App />);
  // The app renders a welcome message in Norwegian
  const welcome = screen.getByText(/Velkommen til Novemberløpet administrasjon/i);
  expect(welcome).toBeInTheDocument();
});