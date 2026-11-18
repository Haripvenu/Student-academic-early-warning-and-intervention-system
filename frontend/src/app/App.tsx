import React from 'react';
import { SessionProvider } from './session';
import { ToastProvider } from '../components/Toast';
import { ThemeProvider } from '../components/ThemeContext';
import { Router } from './router';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SessionProvider>
          <Router />
        </SessionProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
