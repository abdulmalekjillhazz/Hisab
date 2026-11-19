import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page relative grid min-h-screen place-items-center bg-gradient-to-br from-bg via-white to-indigo-50 p-4">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6"><ThemeToggle /></div>
      {children}
    </main>
  );
}
