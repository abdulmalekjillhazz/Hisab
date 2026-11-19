'use client';

type CacheEntry = { value: any; expiresAt: number };

const cache = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<any>>();
const invalidatedAt = new Map<string, number>();
const DEFAULT_TTL_MS = 15_000;

export function getCachedJson(url: string, ttlMs = DEFAULT_TTL_MS): Promise<any> {
  const existing = cache.get(url);
  if (existing && existing.expiresAt > Date.now()) return Promise.resolve(existing.value);
  if (existing) cache.delete(url);

  const inFlight = pending.get(url);
  if (inFlight) return inFlight;

  const startedAt = Date.now();
  let request: Promise<any>;
  request = fetch(url, { cache: 'no-store' })
    .then(async (response) => {
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || `Request failed (${response.status})`);
      const invalidatedDuringRequest = [...invalidatedAt].some(([prefix, time]) => url.startsWith(prefix) && time >= startedAt);
      if (!invalidatedDuringRequest) {
        cache.set(url, { value, expiresAt: Date.now() + ttlMs });
        if (cache.size > 100) cache.delete(cache.keys().next().value as string);
      }
      return value;
    })
    .finally(() => {
      if (pending.get(url) === request) pending.delete(url);
    });

  pending.set(url, request);
  return request;
}

export function prefetchJson(url: string) {
  void getCachedJson(url).catch(() => undefined);
}

export function invalidateApiCache(...prefixes: string[]) {
  const now = Date.now();
  prefixes.forEach((prefix) => invalidatedAt.set(prefix, now));
  for (const key of cache.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) cache.delete(key);
  }
  for (const key of pending.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) pending.delete(key);
  }
}

export function clearApiCache() {
  cache.clear();
  pending.clear();
  invalidatedAt.clear();
}
