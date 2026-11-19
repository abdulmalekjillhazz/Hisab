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
  const requestedPage = Number(url.searchParams.get('page') || 1);
  const requestedLimit = Number(url.searchParams.get('limit') || 20);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, 1_000_000)
    : 1;
  const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 500)
    : 20;
  const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    q,
    safeQ: escapeRegex(q),
  };
}
