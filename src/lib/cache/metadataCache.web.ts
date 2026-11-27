import { isCacheFresh } from "./cachePolicy";

type CacheEntry = { payload: unknown; cachedAt: number };
const MAX_AGE = 30 * 24 * 60 * 60_000;
const memory = new Map<string, CacheEntry>();
const prefix = (userId: string) => `cloudence.metadata.v1:${encodeURIComponent(userId)}:`;
const keyFor = (userId: string, key: string) => `${prefix(userId)}${encodeURIComponent(key)}`;

// Tab-scoped storage avoids leaving workspace metadata behind in a shared browser.
function storage() {
  try { return typeof window !== "undefined" ? window.sessionStorage : null; }
  catch { return null; }
}

export async function readMetadataCache(userId: string, cacheKey: string): Promise<CacheEntry | null> {
  const key = keyFor(userId, cacheKey);
  try {
    const serialized = storage()?.getItem(key);
    const entry = memory.get(key) ?? (serialized ? JSON.parse(serialized) as CacheEntry : null);
    if (entry && typeof entry.cachedAt === "number" && isCacheFresh(entry.cachedAt, MAX_AGE)) return entry;
  } catch { /* Fall back to a network refresh if storage is malformed or unavailable. */ }
  memory.delete(key);
  try { storage()?.removeItem(key); } catch { /* Browser storage can be disabled. */ }
  return null;
}

export async function writeMetadataCache(userId: string, cacheKey: string, payload: unknown, cachedAt = Date.now()) {
  const key = keyFor(userId, cacheKey);
  const entry = { payload, cachedAt };
  memory.delete(key);
  memory.set(key, entry);
  while (memory.size > 100) memory.delete(memory.keys().next().value!);
  try {
    const store = storage();
    store?.setItem(key, JSON.stringify(entry));
    const keys = Array.from({ length: store?.length ?? 0 }, (_, index) => store!.key(index))
      .filter((item): item is string => !!item?.startsWith(prefix(userId)));
    const ordered = keys.sort((a, b) => {
      const age = (item: string) => { try { return (JSON.parse(store!.getItem(item)!) as CacheEntry).cachedAt; } catch { return 0; } };
      return age(b) - age(a);
    });
    ordered.slice(100).forEach((item) => store?.removeItem(item));
  } catch { /* Keep the in-memory cache when the browser's storage quota is reached. */ }
}

export async function clearUserMetadataCache(userId: string) {
  for (const key of memory.keys()) if (key.startsWith(prefix(userId))) memory.delete(key);
  try {
    const store = storage();
    const keys = Array.from({ length: store?.length ?? 0 }, (_, index) => store!.key(index));
    keys.forEach((key) => { if (key?.startsWith(prefix(userId))) store?.removeItem(key); });
  } catch { /* No persistent storage is available. */ }
}
