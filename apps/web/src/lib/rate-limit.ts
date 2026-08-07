const buckets = new Map<string, number[]>();

const MAX_BUCKETS = 10_000;

export function rateLimited(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  if (buckets.size >= MAX_BUCKETS) {
    const now = Date.now();
    for (const [k, hits] of buckets) {
      if (hits[hits.length - 1] < now - windowMs) buckets.delete(k);
    }
  }

  const now = Date.now();
  const windowStart = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    return true;
  }

  hits.push(now);
  buckets.set(key, hits);
  return false;
}
