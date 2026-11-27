import { Directory, File, Paths } from "expo-file-system";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import { accountCacheGeneration } from "./cachePolicy";

const MAX_BYTES = 256 * 1024 * 1024;
const MAX_AGE_MS = 7 * 24 * 60 * 60_000;
const hash = (value: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
const accountDirectory = async (userId: string) => new Directory(Paths.cache, `cloudence-downloads-${await hash(userId)}`);

function prune(directory: Directory, keep?: string) {
  const files = directory.list().filter((entry): entry is File => entry instanceof File);
  files.sort((a, b) => (b.modificationTime ?? 0) - (a.modificationTime ?? 0));
  let bytes = files.find((file) => file.uri === keep)?.size ?? 0;
  for (const file of files) {
    if (file.uri === keep) continue;
    if (Date.now() - (file.modificationTime ?? 0) > MAX_AGE_MS || bytes + file.size > MAX_BYTES) file.delete();
    else bytes += file.size;
  }
}

// The caller obtains this metadata from the authenticated download endpoint on EVERY open.
export async function reuseOrDownloadFile(
  userId: string,
  info: { id: string; name: string; sha256?: string; size?: number },
  url: string,
  options: Parameters<typeof File.downloadFileAsync>[2],
) {
  const generation = accountCacheGeneration(userId);
  const directory = await accountDirectory(userId);
  if (generation !== accountCacheGeneration(userId)) throw new Error("Your account changed.");
  directory.create({ intermediates: true, idempotent: true });
  prune(directory);
  const reusable = !!info.sha256 && /^[a-f0-9]{64}$/i.test(info.sha256);
  const version = await hash(JSON.stringify([info.id, info.sha256, info.size]));
  const destination = new File(directory, `${version}-${info.name}`);
  const assertCurrent = () => {
    if (options?.signal?.aborted || generation !== accountCacheGeneration(userId)) {
      throw new Error("The download was canceled.");
    }
  };
  assertCurrent();
  if (reusable && destination.exists && destination.size === info.size &&
      await destination.digest("SHA-256") === info.sha256?.toLowerCase()) {
    assertCurrent();
    return destination;
  }
  if (destination.exists) destination.delete();
  const partial = new File(directory, `${version}.part`);
  try {
    await File.downloadFileAsync(url, partial, { ...options, idempotent: true });
    assertCurrent();
    if (info.size !== undefined && partial.size !== info.size) throw new Error("The download was incomplete. Please try again.");
    if (reusable && await partial.digest("SHA-256") !== info.sha256?.toLowerCase()) {
      throw new Error("The downloaded file could not be verified. Please try again.");
    }
    assertCurrent();
    await partial.move(destination);
    assertCurrent();
    prune(directory, destination.uri);
    return destination;
  } catch (error) {
    if (partial.exists) partial.delete();
    if (destination.exists) destination.delete();
    throw error;
  }
}

export async function clearAccountMediaCache(userId: string) {
  const directory = await accountDirectory(userId);
  if (directory.exists) directory.delete();
  // Expo Image owns its disk files; its public API clears the shared image cache.
  await Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()]);
}
