import { apiRequest } from './client';
import { parseCloudFile } from './files';
import type { CloudFile } from '../../types/file';

export const HEALTH_CATEGORIES = ['duplicates', 'versions', 'largeMedia', 'olderFiles'] as const;
export type HealthCategory = typeof HEALTH_CATEGORIES[number];
export type HealthItem = { file: CloudFile; reason: string; keepId?: string; keepName?: string; keepFile?: CloudFile };
export type HealthBucket = { count: number; bytes: number; items: HealthItem[] };
export type StorageHealthReport = {
  scannedAt: string; scannedFiles: number; truncated: boolean;
  reviewedBytes: number; duplicateBytes: number; unhashedFiles: number;
  categories: Record<HealthCategory, HealthBucket>;
};
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
function number(value: unknown) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid storage scan totals.');
  return value;
}

export function parseStorageHealth(value: unknown): StorageHealthReport {
  if (!record(value) || !record(value.categories) || typeof value.scannedAt !== 'string' ||
      !Number.isFinite(Date.parse(value.scannedAt)) || typeof value.truncated !== 'boolean') {
    throw new Error('Invalid storage health report.');
  }
  const categories = {} as Record<HealthCategory, HealthBucket>;
  for (const key of HEALTH_CATEGORIES) {
    const category = value.categories[key];
    if (!record(category) || !Array.isArray(category.items)) throw new Error('Invalid storage scan category.');
    categories[key] = {
      count: number(category.count), bytes: number(category.bytes),
      items: category.items.map((item: unknown) => {
        if (!record(item) || typeof item.reason !== 'string') throw new Error('Invalid storage scan file.');
        return { file: parseCloudFile(item.file), reason: item.reason,
          ...(typeof item.keepId === 'string' ? { keepId: item.keepId } : {}),
          ...(typeof item.keepName === 'string' ? { keepName: item.keepName } : {}),
          ...(item.keepFile ? { keepFile: parseCloudFile(item.keepFile) } : {}),
        };
      }),
    };
  }
  return { scannedAt: value.scannedAt, scannedFiles: number(value.scannedFiles), truncated: value.truncated,
    reviewedBytes: number(value.reviewedBytes), duplicateBytes: number(value.duplicateBytes),
    unhashedFiles: number(value.unhashedFiles), categories };
}

export async function getStorageHealth(token: string, signal?: AbortSignal) {
  return parseStorageHealth(await apiRequest<unknown>('/cloudence/storage-health', token, { signal }));
}
