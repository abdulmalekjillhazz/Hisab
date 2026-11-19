import { NextResponse } from 'next/server';

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function pageParams(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit') || 20)));
  const q = (url.searchParams.get('q') || '').trim();
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    q,
    safeQ: escapeRegex(q),
  };
}
