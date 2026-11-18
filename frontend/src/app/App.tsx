import React from 'react';
import { SessionProvider } from './session';
import { ToastProvider } from '../components/Toast';
import { Router } from './router';

export default function App() {
  return (
    <ToastProvider>
      <SessionProvider>
        <Router />
      </SessionProvider>
    </ToastProvider>
  );
}
