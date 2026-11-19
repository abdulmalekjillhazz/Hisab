import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1E293B',         // Slate 800 - Crisp, clear, clean readability
        muted: '#64748B',       // Slate 500
        bg: '#F8FAFC',          // Clean minimal background (Slate 50)
        cream: '#F1F5F9',       // Subtle clean neutral (Slate 100)
        card: '#FFFFFF',
        line: '#E2E8F0',        // Subtle, modern clean border (Slate 200)
        brand: {
          blue: '#1E3A8A',      // Deep Blue
          teal: '#0F766E',      // Deep Teal
          charcoal: '#1E293B',
          cream: '#F8FAFC',
          sand: '#F59E0B',      // Warm Amber / Golden Sand
        },
        blue: '#2563EB',        // Crisp primary blue
        teal: '#0F766E',        // Deep Teal
        sand: '#F59E0B',        // Warm Amber
        cyan: '#0891B2',        
        purple: '#4F46E5',      
        green: '#16A34A',       // Success
        orange: '#EA580C',      // Alert
        red: '#DC2626',         // Danger
        sidebar: '#0F172A',     // Slate 900 - Premium dark
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-bengali)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['var(--font-sora)', 'var(--font-bengali)', 'var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        // Flat, subtle and ultra-clean shadows - NO HEAVY BLUR
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        hover: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        flat: 'none',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};

export default config;
