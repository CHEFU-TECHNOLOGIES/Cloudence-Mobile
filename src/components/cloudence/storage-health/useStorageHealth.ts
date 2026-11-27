import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSession } from '../../../auth/SessionContext';
import { useCloudenceData } from '../../../data/CloudenceDataProvider';
import { getStorageHealth, HEALTH_CATEGORIES, type HealthItem, type StorageHealthReport } from '../../../lib/api/storageHealth';
import { ApiError } from '../../../lib/api/client';

export function useStorageHealth() {
  const { user, getAccessToken } = useSession();
  const { remove, refresh, isOffline, download, cancelDownload } = useCloudenceData();
  const [state, setState] = useState<{ userId: string; report: StorageHealthReport | null; error: string | null; loading: boolean } | null>(null);
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const userId = user?.id;

  const scan = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    if (!userId) return;
    setState(previous => ({ userId, report: previous?.userId === userId ? previous.report : null, error: null, loading: true }));
    try {
      const token = await getAccessToken();
      if (controller.signal.aborted) return;
      const report = await getStorageHealth(token, controller.signal);
      if (!controller.signal.aborted) setState({ userId, report, error: null, loading: false });
    } catch (error) {
      if (!controller.signal.aborted) setState({ userId, report: null, loading: false,
        error: error instanceof ApiError && error.status === 404
          ? 'Storage Health Center is not available yet. Please try again later.'
          : error instanceof Error ? error.message : 'The storage scan could not complete.',
      });
    }
  }, [getAccessToken, userId]);

  useFocusEffect(useCallback(() => {
    generation.current++;
    void scan();
    return () => { generation.current++; request.current?.abort(); };
  }, [scan]));

  const deleteReviewedFile = async (item: HealthItem) => {
    if (!userId || item.file.owner.id !== userId) throw new Error('Only your own files can be removed.');
    if (isOffline) throw new Error('Connect to the internet before deleting files.');
    const current = generation.current;
    // Recheck suggestions before a destructive action; another device may have changed the files.
    const latest = await getStorageHealth(await getAccessToken());
    if (current !== generation.current) return;
    const candidate = HEALTH_CATEGORIES.flatMap(key => latest.categories[key].items)
      .find(candidate => candidate.file.id === item.file.id);
    if (!candidate || candidate.keepId !== item.keepId || candidate.file.owner.id !== userId ||
        candidate.file.updatedAt !== item.file.updatedAt ||
        JSON.stringify([...candidate.file.users].sort()) !== JSON.stringify([...item.file.users].sort())) {
      await scan();
      throw new Error('This suggestion has changed. Please review the refreshed scan before deleting.');
    }
    await remove(item.file.id, false, item.file);
    if (current !== generation.current) return;
    await Promise.all([scan(), refresh()]);
  };

  const ownState = state?.userId === userId ? state : null;
  return { report: ownState?.report ?? null, error: ownState?.error ?? null,
    loading: ownState?.loading ?? true, scan, deleteReviewedFile, isOffline, download, cancelDownload };
}
