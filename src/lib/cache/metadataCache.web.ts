type CacheEntry = {
  payload: unknown;
  cachedAt: number;
};

export async function readMetadataCache(
  _userId: string,
  _cacheKey: string,
): Promise<CacheEntry | null> {
  return null;
}

export async function writeMetadataCache(
  _userId: string,
  _cacheKey: string,
  _payload: unknown,
  _cachedAt?: number,
) {}

export async function clearUserMetadataCache(_userId: string) {}
