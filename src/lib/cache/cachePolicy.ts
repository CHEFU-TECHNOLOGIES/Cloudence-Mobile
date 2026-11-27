export const WORKSPACE_FRESH_MS = 60_000;
export const BILLING_FRESH_MS = 5 * 60_000;

export function isCacheFresh(cachedAt: number, maxAge: number, now = Date.now()) {
  return cachedAt > 0 && now >= cachedAt && now - cachedAt < maxAge;
}

const generations = new Map<string, number>();
const clearListeners = new Set<(userId: string) => void>();

export function accountCacheGeneration(userId: string) {
  return generations.get(userId) ?? 0;
}

export function onAccountCacheCleared(listener: (userId: string) => void) {
  clearListeners.add(listener);
  return () => { clearListeners.delete(listener); };
}

export function invalidateAccountCaches(userId: string) {
  generations.set(userId, accountCacheGeneration(userId) + 1);
  clearListeners.forEach((listener) => listener(userId));
}
