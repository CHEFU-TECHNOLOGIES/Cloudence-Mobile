import type { SectionListing } from "../api/folders";
import { onAccountCacheCleared } from "./cachePolicy";

export const memoryListingCache = new Map<string, SectionListing>();
export const listingCachedAt = new Map<string, number>();

export function rememberListing(key: string, listing: SectionListing, cachedAt = Date.now()) {
  memoryListingCache.delete(key);
  memoryListingCache.set(key, listing);
  listingCachedAt.set(key, cachedAt);
  if (memoryListingCache.size > 20) {
    const oldest = memoryListingCache.keys().next().value;
    if (oldest) { memoryListingCache.delete(oldest); listingCachedAt.delete(oldest); }
  }
}

onAccountCacheCleared((userId) => {
  for (const key of memoryListingCache.keys()) {
    if (key.startsWith(`${userId}:section:`)) {
      memoryListingCache.delete(key);
      listingCachedAt.delete(key);
    }
  }
});
