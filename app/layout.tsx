import type { Metadata, Viewport } from 'next';
import { Inter, Sora, JetBrains_Mono, Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const bengali = Noto_Sans_Bengali({
  subsets: ['bengali', 'latin'],
  variable: '--font-bengali',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#1E293B',
};

export const metadata: Metadata = {
  title: 'Hisab — Shop Manager',
  description: 'Manage your shop products, sales, customers and reports in one place.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} ${mono.variable} ${bengali.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-bg text-ink selection:bg-teal selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
