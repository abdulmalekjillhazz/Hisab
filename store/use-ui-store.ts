'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Locale = 'en' | 'bn';
type Theme = 'light' | 'dark';

type UIState = {
  locale: Locale;
  theme: Theme;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      locale: 'en',
      theme: 'light',
      setLocale: (locale) => {
        set({ locale });
        if (typeof window !== 'undefined') localStorage.setItem('ae-locale', locale);
      },
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'hisab-ui-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ locale, theme }) => ({ locale, theme }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<UIState> | undefined;
        const oldLocale = typeof window === 'undefined' ? null : localStorage.getItem('ae-locale');
        return {
          ...current,
          ...saved,
          locale: saved?.locale ?? (oldLocale === 'bn' ? 'bn' : current.locale),
          theme: saved?.theme === 'dark' ? 'dark' : 'light',
        };
      },
    },
  ),
);
