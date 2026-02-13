'use client';

import { AppProvider } from '@/context/AppContext';
import AppShell from '@/components/AppShell';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function Home() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ErrorBoundary>
  );
}
