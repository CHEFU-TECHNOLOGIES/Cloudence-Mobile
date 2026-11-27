import { useCallback, useEffect, useRef, useState } from "react";
import * as Network from "expo-network";
import { useSession } from "../auth/SessionContext";
import { readMetadataCache, writeMetadataCache } from "../lib/cache/metadataCache";
import { CloudenceUsage, listFiles, getUsage } from "../lib/api/files";
import { CloudFile } from "../types/file";
import {
  FILES_CACHE_KEY,
  isCachedFile,
  isCachedUsage,
  messageFromError,
  stripSignedUrls,
  USAGE_CACHE_KEY,
} from "./workspaceMetadata";
import { useCloudenceFileActions } from "./useCloudenceFileActions";
import { accountCacheGeneration, isCacheFresh, WORKSPACE_FRESH_MS } from "../lib/cache/cachePolicy";
import { clearAccountCaches } from "../lib/cache/clearAccountCaches";
import { useCacheRevalidation } from "../hooks/useCacheRevalidation";

export function useCloudenceWorkspace() {
  const { status, user, getAccessToken } = useSession();
  const userId = status === "authenticated" ? (user?.id ?? null) : null;
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [recentFiles, setRecentFiles] = useState<CloudFile[]>([]);
  const [usage, setUsage] = useState<CloudenceUsage | null>(null);
  const [dataUserId, setDataUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filesRef = useRef<CloudFile[]>([]);
  const recentFilesRef = useRef<CloudFile[]>([]);
  const filesCachedAtRef = useRef(0);
  const usageCachedAtRef = useRef(0);
  const isOfflineRef = useRef(false);
  const activeRequestRef = useRef<AbortController | null>(null);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const forcedRefreshRef = useRef<Promise<boolean> | null>(null);
  const previousUserIdRef = useRef<string | null>(null);
  const cacheReadyForUserRef = useRef<string | null>(null);

  const getFiles = useCallback(() => filesRef.current, []);
  const getRecentFiles = useCallback(() => recentFilesRef.current, []);
  const updateFiles = useCallback((nextFiles: CloudFile[]) => {
    filesRef.current = nextFiles;
    setFiles(nextFiles);
  }, []);
  const updateRecentFiles = useCallback((nextFiles: CloudFile[]) => {
    recentFilesRef.current = nextFiles;
    setRecentFiles(nextFiles);
  }, []);

  const persistFiles = useCallback(
    async (activeUserId: string, nextFiles: CloudFile[]) => {
      try {
        await writeMetadataCache(
          activeUserId,
          FILES_CACHE_KEY,
          stripSignedUrls(nextFiles),
        );
        if (previousUserIdRef.current === activeUserId) filesCachedAtRef.current = Date.now();
        return null;
      } catch (cacheError) {
        return messageFromError(cacheError);
      }
    },
    [],
  );

  const persistUsage = useCallback(
    async (activeUserId: string, nextUsage: CloudenceUsage) => {
      try {
        await writeMetadataCache(activeUserId, USAGE_CACHE_KEY, nextUsage);
        if (previousUserIdRef.current === activeUserId) usageCachedAtRef.current = Date.now();
        return null;
      } catch (cacheError) {
        return messageFromError(cacheError);
      }
    },
    [],
  );

  const refreshData = useCallback(
    function refreshWorkspace(force: boolean, signal?: AbortSignal): Promise<boolean> {
      if (!userId || isOfflineRef.current || signal?.aborted) return Promise.resolve(false);
      if (cacheReadyForUserRef.current !== userId) return Promise.resolve(false);
      if (refreshPromiseRef.current) {
        if (!force) return refreshPromiseRef.current;
        if (forcedRefreshRef.current) return forcedRefreshRef.current;
        // A purchase or mutation must refresh AFTER an already-running read.
        const queued = refreshPromiseRef.current.then(() => {
          if (forcedRefreshRef.current === queued) forcedRefreshRef.current = null;
          return refreshWorkspace(true, signal);
        }).finally(() => {
          if (forcedRefreshRef.current === queued) forcedRefreshRef.current = null;
        });
        forcedRefreshRef.current = queued;
        return queued;
      }

      const shouldFetchFiles = force || !isCacheFresh(filesCachedAtRef.current, WORKSPACE_FRESH_MS);
      const shouldFetchUsage = force || !isCacheFresh(usageCachedAtRef.current, WORKSPACE_FRESH_MS);
      if (!shouldFetchFiles && !shouldFetchUsage)
        return Promise.resolve(true);

      const requestController = new AbortController();
      const generation = accountCacheGeneration(userId);
      activeRequestRef.current = requestController;
      const requestSignal = signal ?? requestController.signal;
      if (filesCachedAtRef.current === 0) setIsLoading(true);
      setIsRefreshing(true);

      const request = (async () => {
        const failures: string[] = [];
        try {
          const accessToken = await getAccessToken();
          const [filesResult, usageResult] = await Promise.allSettled([
            shouldFetchFiles
              ? listFiles(accessToken, requestSignal)
              : Promise.resolve(null),
            shouldFetchUsage
              ? getUsage(accessToken, requestSignal)
              : Promise.resolve(null),
          ]);

          if (requestSignal.aborted || generation !== accountCacheGeneration(userId)) return false;
          if (filesResult.status === "fulfilled" && filesResult.value) {
            const nextFiles = filesResult.value;
            filesRef.current = nextFiles;
            recentFilesRef.current = nextFiles.slice(0, 10);
            setFiles(nextFiles);
            setRecentFiles(recentFilesRef.current);
            setDataUserId(userId);
            const cacheError = await persistFiles(userId, nextFiles);
            if (cacheError) failures.push(`Files cache: ${cacheError}`);
          } else if (filesResult.status === "rejected") {
            failures.push(`Files: ${messageFromError(filesResult.reason)}`);
          }

          if (requestSignal.aborted || generation !== accountCacheGeneration(userId)) return false;
          if (usageResult.status === "fulfilled" && usageResult.value) {
            setUsage(usageResult.value);
            setDataUserId(userId);
            const cacheError = await persistUsage(userId, usageResult.value);
            if (cacheError) failures.push(`Storage cache: ${cacheError}`);
          } else if (usageResult.status === "rejected") {
            failures.push(`Storage: ${messageFromError(usageResult.reason)}`);
          }

          if (requestSignal.aborted || generation !== accountCacheGeneration(userId)) return false;
          setError(failures.length ? failures.join(" ") : null);
          return failures.length === 0;
        } catch (refreshError) {
          if (!requestSignal.aborted) setError(messageFromError(refreshError));
          return false;
        } finally {
          if (activeRequestRef.current === requestController) {
            activeRequestRef.current = null;
            setIsLoading(false);
            setIsRefreshing(false);
          }
        }
      })();

      refreshPromiseRef.current = request;
      return request.finally(() => {
        if (refreshPromiseRef.current === request) {
          refreshPromiseRef.current = null;
        }
      });
    },
    [getAccessToken, persistFiles, persistUsage, userId],
  );

  const refresh = useCallback(
    () => refreshData(true, activeRequestRef.current?.signal),
    [refreshData],
  );

  useEffect(() => {
    if (!userId) {
      activeRequestRef.current?.abort();
      refreshPromiseRef.current = null;
      forcedRefreshRef.current = null;
      const previousUserId = previousUserIdRef.current;
      previousUserIdRef.current = null;
      cacheReadyForUserRef.current = null;
      filesRef.current = [];
      recentFilesRef.current = [];
      filesCachedAtRef.current = 0;
      usageCachedAtRef.current = 0;
      setFiles([]);
      setRecentFiles([]);
      setUsage(null);
      setDataUserId(null);
      setError(null);
      setIsLoading(false);
      if (previousUserId) {
        void clearAccountCaches(previousUserId).catch(
          (cacheError: unknown) => {
            console.error(
              "Could not clear the signed-out Cloudence cache.",
              cacheError,
            );
          },
        );
      }
      return;
    }

    const previousUserId = previousUserIdRef.current;
    if (previousUserId && previousUserId !== userId) {
      void clearAccountCaches(previousUserId).catch(
        (cacheError: unknown) => {
          console.error(
            "Could not clear the previous account cache.",
            cacheError,
          );
        },
      );
    }
    previousUserIdRef.current = userId;
    cacheReadyForUserRef.current = null;

    let cancelled = false;
    const controller = new AbortController();
    activeRequestRef.current?.abort();
    refreshPromiseRef.current = null;
    forcedRefreshRef.current = null;
    activeRequestRef.current = controller;
    filesRef.current = [];
    recentFilesRef.current = [];
    filesCachedAtRef.current = 0;
    usageCachedAtRef.current = 0;
    setFiles([]);
    setRecentFiles([]);
    setUsage(null);
    setDataUserId(null);
    setError(null);
    setIsLoading(true);

    void (async () => {
      try {
        const [fileEntry, usageEntry] = await Promise.all([
          readMetadataCache(userId, FILES_CACHE_KEY),
          readMetadataCache(userId, USAGE_CACHE_KEY),
        ]);
        if (cancelled) return;

        const cachedFiles =
          fileEntry &&
          Array.isArray(fileEntry.payload) &&
          fileEntry.payload.every(isCachedFile)
            ? fileEntry.payload
            : null;
        const cachedUsage =
          usageEntry && isCachedUsage(usageEntry.payload)
            ? usageEntry.payload
            : null;

        if (cachedFiles) {
          filesRef.current = cachedFiles;
          recentFilesRef.current = cachedFiles.slice(0, 10);
          filesCachedAtRef.current = fileEntry?.cachedAt ?? Date.now();
          setFiles(cachedFiles);
          setRecentFiles(recentFilesRef.current);
        }
        if (cachedUsage) {
          usageCachedAtRef.current = usageEntry?.cachedAt ?? Date.now();
          setUsage(cachedUsage);
        }
        setDataUserId(userId);
        setIsLoading(!cachedFiles);
        cacheReadyForUserRef.current = userId;
        await refreshData(false, controller.signal);
        if (!cancelled) setIsLoading(false);
      } catch (cacheError) {
        if (!cancelled) {
          setDataUserId(userId);
          cacheReadyForUserRef.current = userId;
          setError(
            `Cached workspace data could not be opened: ${messageFromError(cacheError)}`,
          );
          await refreshData(false, controller.signal);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }
    };
  }, [refreshData, userId]);

  useEffect(() => {
    const updateNetworkState = (state: Network.NetworkState) => {
      const offline =
        state.isConnected === false || state.isInternetReachable === false;
      isOfflineRef.current = offline;
      setIsOffline(offline);
      if (!offline) void refreshData(false);
    };

    const networkSubscription =
      Network.addNetworkStateListener(updateNetworkState);
    void Network.getNetworkStateAsync()
      .then(updateNetworkState)
      .catch((networkError: unknown) => {
        console.warn("Could not read the current network state.", networkError);
      });

    return () => {
      networkSubscription.remove();
    };
  }, [refreshData]);

  const revalidate = useCallback(() => refreshData(false), [refreshData]);
  useCacheRevalidation(revalidate, userId !== null);

  const invalidateUsage = useCallback(() => {
    usageCachedAtRef.current = 0;
  }, []);
  const fileActions = useCloudenceFileActions({
    userId,
    getAccessToken,
    getFiles,
    setFiles: updateFiles,
    getRecentFiles,
    setRecentFiles: updateRecentFiles,
    persistFiles,
    refreshData,
    invalidateUsage,
    setError,
  });

  const visibleForUser = userId !== null && dataUserId === userId;
  return {
    files: visibleForUser ? files : [],
    recentFiles: visibleForUser ? recentFiles : [],
    usage: visibleForUser ? usage : null,
    isLoading,
    isRefreshing,
    isOffline,
    error,
    refresh,
    ...fileActions,
  };
}
