'use client';

import { prefetchJson } from '@/lib/client-api-cache';

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function prefetchPageData(path: string) {
  const now = new Date();
  const today = localDate(now);
  const urls: string[] = [];

  switch (path) {
    case '/dashboard': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      urls.push(`/api/reports?from=${localDate(start)}&to=${today}`);
      break;
    }
    case '/products':
      urls.push('/api/products?page=1&limit=20&q=');
      break;
    case '/sales':
      urls.push(
        '/api/products?limit=500',
        '/api/customers?limit=200',
        '/api/sales?page=1&limit=20&q='
      );
      break;
    case '/customers':
      urls.push('/api/customers?page=1&limit=20&q=');
      break;
    case '/reports':
      urls.push(`/api/reports?from=${localDate(new Date(now.getFullYear(), now.getMonth(), 1))}&to=${today}`);
      break;
    case '/profile':
      urls.push('/api/profile');
      break;
  }

  urls.forEach(prefetchJson);
}
