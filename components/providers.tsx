'use client';

import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { useUIStore } from '@/store/use-ui-store';

function ThemeSync() {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((state) => state.theme);

  return (
    <SessionProvider>
      <ThemeSync />
      {children}
      <Toaster richColors position="top-right" theme={theme} />
    </SessionProvider>
  );
}
