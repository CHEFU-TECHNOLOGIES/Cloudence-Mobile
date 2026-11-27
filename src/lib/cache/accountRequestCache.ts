import { accountCacheGeneration, isCacheFresh, onAccountCacheCleared } from "./cachePolicy";

export function createAccountRequestCache<T>(maxAge: number) {
  const entries = new Map<string, { value: T; cachedAt: number }>();
  const pending = new Map<string, Promise<T>>();
  onAccountCacheCleared((userId) => { entries.delete(userId); pending.delete(userId); });

  const peek = (userId: string) => {
    const entry = entries.get(userId);
    return entry && isCacheFresh(entry.cachedAt, maxAge) ? entry.value : undefined;
  };
  const load = (userId: string, fetchValue: () => Promise<T>, force = false): Promise<T> => {
    const cached = peek(userId);
    if (!force && cached !== undefined) return Promise.resolve(cached);
    const existing = pending.get(userId);
    if (existing) return existing;
    const generation = accountCacheGeneration(userId);
    const request = Promise.resolve().then(fetchValue).then((value) => {
      if (accountCacheGeneration(userId) !== generation) throw new Error("Your account changed. Please try again.");
      entries.set(userId, { value, cachedAt: Date.now() });
      return value;
    }).finally(() => {
      if (pending.get(userId) === request) pending.delete(userId);
    });
    pending.set(userId, request);
    return request;
  };
  return { peek, load };
}
