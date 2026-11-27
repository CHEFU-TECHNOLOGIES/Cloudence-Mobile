import { invalidateAccountCaches } from "./cachePolicy";
import { clearUserMetadataCache } from "./metadataCache";
import { clearAccountMediaCache } from "./mediaCache";

export async function clearAccountCaches(userId: string) {
  invalidateAccountCaches(userId);
  const results = await Promise.allSettled([
    clearUserMetadataCache(userId), clearAccountMediaCache(userId),
  ]);
  const failure = results.find((result) => result.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
}
