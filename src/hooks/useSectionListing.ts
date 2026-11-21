import { useCallback, useEffect, useRef, useState } from "react";
import {
  CloudenceFolder,
  FolderSection,
  SectionListing,
  listSectionListing,
} from "../lib/api/folders";
import { CloudFile } from "../types/file";
import {
  readMetadataCache,
  writeMetadataCache,
} from "../lib/cache/metadataCache";
import { useSession } from "../auth/SessionContext";
import { useCloudenceData } from "../data/CloudenceDataProvider";
import { useToast } from "../components/cloudence/ToastProvider";

const EMPTY_LISTING: SectionListing = {
  files: [],
  folders: [],
};
const memoryListingCache = new Map<string, SectionListing>();
const MAX_MEMORY_LISTINGS = 20;

function rememberListing(key: string, listing: SectionListing) {
  memoryListingCache.delete(key);
  memoryListingCache.set(key, listing);
  if (memoryListingCache.size > MAX_MEMORY_LISTINGS) {
    const oldestKey = memoryListingCache.keys().next().value;
    if (oldestKey) memoryListingCache.delete(oldestKey);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCachedFile(value: unknown): value is CloudFile {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.extension === "string" &&
    typeof value.size === "number" &&
    typeof value.createdAt === "string" &&
    Array.isArray(value.users) &&
    isRecord(value.owner)
  );
}

function isCachedFolder(value: unknown): value is CloudenceFolder {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.section === "documents" ||
      value.section === "images" ||
      value.section === "media" ||
      value.section === "others") &&
    typeof value.createdAt === "string"
  );
}

function isCachedListing(value: unknown): value is SectionListing {
  return (
    isRecord(value) &&
    Array.isArray(value.files) &&
    value.files.every(isCachedFile) &&
    Array.isArray(value.folders) &&
    value.folders.every(isCachedFolder) &&
    (value.nextOffset === undefined ||
      (typeof value.nextOffset === "number" &&
        Number.isSafeInteger(value.nextOffset)))
  );
}

function withoutSignedUrls(listing: SectionListing): SectionListing {
  return {
    ...listing,
    files: listing.files.map((file) => ({ ...file, url: undefined })),
  };
}

export function useSectionListing(
  section: FolderSection | null,
  folderId: string | null,
) {
  const { user, getAccessToken } = useSession();
  const { isOffline } = useCloudenceData();
  const { showToast } = useToast();
  const userId = user?.id ?? null;
  const cacheKey = section ? `section:${section}:${folderId ?? "root"}` : "";
  const stateKey = userId && cacheKey ? `${userId}:${cacheKey}` : "";
  const initialListing = stateKey ? memoryListingCache.get(stateKey) : undefined;
  const [storedKey, setStoredKey] = useState(initialListing ? stateKey : "");
  const [listing, setListing] = useState<SectionListing>(
    initialListing ?? EMPTY_LISTING,
  );
  const [isLoading, setIsLoading] = useState(Boolean(section && !initialListing));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const requestRef = useRef<Promise<boolean> | null>(null);
  const storedKeyRef = useRef("");
  const hasListingRef = useRef(false);
  const loadingMoreRef = useRef(false);

  const load = useCallback(
    async (force = false, signal?: AbortSignal) => {
      if (!section || !userId || !cacheKey) return false;
      if (requestRef.current) return requestRef.current;

      const request = (async (): Promise<boolean> => {
        try {
          if (!force) {
            const memoryCached = memoryListingCache.get(stateKey);
            if (memoryCached) {
              storedKeyRef.current = stateKey;
              hasListingRef.current = true;
              setStoredKey(stateKey);
              setListing(memoryCached);
              setError(null);
              return true;
            }

            const cached = await readMetadataCache(userId, cacheKey);
            if (signal?.aborted) return true;
            if (cached && isCachedListing(cached.payload)) {
              rememberListing(stateKey, cached.payload);
              storedKeyRef.current = stateKey;
              hasListingRef.current = true;
              setStoredKey(stateKey);
              setListing(cached.payload);
              setError(null);
              return true;
            }
          }

          if (isOffline) {
            setError(null);
            return false;
          }

          if (storedKeyRef.current !== stateKey || !hasListingRef.current) {
            setIsLoading(true);
          }
          setIsRefreshing(true);
          const accessToken = await getAccessToken();
          const nextListing = await listSectionListing(
            accessToken,
            section,
            folderId,
            0,
            signal,
          );
          if (signal?.aborted) return true;

          rememberListing(stateKey, nextListing);
          storedKeyRef.current = stateKey;
          hasListingRef.current = true;
          setStoredKey(stateKey);
          setListing(nextListing);
          setError(null);
          await writeMetadataCache(
            userId,
            cacheKey,
            withoutSignedUrls(nextListing),
          );
          return true;
        } catch (loadError) {
          if (!signal?.aborted) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "Unable to load this folder.",
            );
          }
          return false;
        } finally {
          if (!signal?.aborted) {
            setIsLoading(false);
            setIsRefreshing(false);
          }
        }
      })();

      requestRef.current = request;
      try {
        return await request;
      } finally {
        if (requestRef.current === request) requestRef.current = null;
      }
    },
    [cacheKey, folderId, getAccessToken, isOffline, section, stateKey, userId],
  );

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    void load(false, controller.signal);
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
      requestRef.current = null;
    };
  }, [load]);

  const loadMore = useCallback(async () => {
    if (isOffline && section && folderId && listing.nextOffset !== undefined) {
      showToast({
        title: "You're offline",
        message: "Reconnect to load more files.",
        variant: "error",
      });
      return;
    }
    if (
      !section ||
      !folderId ||
      !userId ||
      isOffline ||
      listing.nextOffset === undefined ||
      loadingMoreRef.current
    ) {
      return;
    }

    loadingMoreRef.current = true;
    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;
    setIsLoadingMore(true);
    try {
      const accessToken = await getAccessToken();
      const nextPage = await listSectionListing(
        accessToken,
        section,
        folderId,
        listing.nextOffset,
        controller.signal,
      );
      if (controller.signal.aborted) return;

      const combined: SectionListing = {
        files: [
          ...new Map(
            [...listing.files, ...nextPage.files].map((file) => [file.id, file]),
          ).values(),
        ],
        folders: nextPage.folders,
        nextOffset: nextPage.nextOffset,
      };
      rememberListing(stateKey, combined);
      setListing(combined);
      setError(null);
      await writeMetadataCache(userId, cacheKey, withoutSignedUrls(combined));
    } catch (loadError) {
      if (!controller.signal.aborted) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Unable to load more files.";
        setError(message);
        showToast({
          title: "Could not load more files",
          message,
          variant: "error",
        });
      }
    } finally {
      loadingMoreRef.current = false;
      if (!controller.signal.aborted) setIsLoadingMore(false);
    }
  }, [
    cacheKey,
    folderId,
    getAccessToken,
    isOffline,
    listing,
    section,
    showToast,
    stateKey,
    userId,
  ]);

  const moveFilesOptimistically = useCallback(
    (files: CloudFile[], destinationFolderId: string | null) => {
      if (!section || !userId || !files.length) return (_ids?: string[]) => {};

      const listingPrefix = `${userId}:section:${section}:`;
      const applyMove = (
        movingFiles: CloudFile[],
        destination: string | null,
      ) => {
        const movingById = new Map(movingFiles.map((file) => [file.id, file]));
        const cachedEntries = [...memoryListingCache.entries()];

        for (const [key, cachedListing] of cachedEntries) {
          if (!key.startsWith(listingPrefix)) continue;
          const listingFolderId = key.slice(listingPrefix.length);
          let nextFiles: CloudFile[];

          if (listingFolderId === "root") {
            nextFiles = cachedListing.files.map((file) => {
              if (!movingById.has(file.id)) return file;
              return { ...file, folderId: destination ?? undefined };
            });
          } else {
            nextFiles = cachedListing.files.filter(
              (file) => !movingById.has(file.id) || destination === listingFolderId,
            );
            if (destination === listingFolderId) {
              const existingIds = new Set(nextFiles.map((file) => file.id));
              nextFiles = [
                ...nextFiles,
                ...movingFiles
                  .filter((file) => !existingIds.has(file.id))
                  .map((file) => ({ ...file, folderId: destination })),
              ];
            }
          }

          const nextListing = { ...cachedListing, files: nextFiles };
          rememberListing(key, nextListing);
          if (key === stateKey) setListing(nextListing);
          void writeMetadataCache(
            userId,
            key.slice(userId.length + 1),
            withoutSignedUrls(nextListing),
          ).catch((cacheError: unknown) => {
            console.warn("Could not update the folder listing cache.", cacheError);
          });
        }
      };

      applyMove(files, destinationFolderId);
      const previousFolderById = new Map(
        files.map((file) => [file.id, file.folderId ?? null]),
      );

      return (rollbackIds?: string[]) => {
        const idsToRestore = rollbackIds
          ? new Set(rollbackIds)
          : new Set(previousFolderById.keys());
        const filesToRestore = files
          .filter((file) => idsToRestore.has(file.id))
          .map((file) => ({
            ...file,
            folderId: previousFolderById.get(file.id) ?? undefined,
          }));
        applyMove(
          filesToRestore,
          filesToRestore[0]?.folderId ?? null,
        );
      };
    },
    [section, stateKey, userId],
  );

  const updateFolderOptimistically = useCallback(
    (folderId: string, name: string | null) => {
      if (!section || !userId) return () => {};
      const listingPrefix = `${userId}:section:${section}:`;
      const previousListings = new Map<string, SectionListing>();

      const apply = (nextName: string | null) => {
        for (const [key, cachedListing] of [...memoryListingCache.entries()]) {
          if (!key.startsWith(listingPrefix)) continue;
          const cachedFolderId = key.slice(listingPrefix.length);
          const folder = cachedListing.folders.find((item) => item.id === folderId);
          const files =
            nextName === null && cachedFolderId === folderId
              ? []
              : cachedListing.files.map((file) =>
                  nextName === null && file.folderId === folderId
                    ? { ...file, folderId: undefined }
                    : file,
                );
          const folders =
            nextName === null
              ? cachedListing.folders.filter((item) => item.id !== folderId)
              : cachedListing.folders.map((item) =>
                  item.id === folderId ? { ...item, name: nextName } : item,
                );
          if (!folder && files === cachedListing.files && folders === cachedListing.folders) {
            continue;
          }
          if (!previousListings.has(key)) previousListings.set(key, cachedListing);
          const nextListing = { ...cachedListing, files, folders };
          rememberListing(key, nextListing);
          if (key === stateKey) setListing(nextListing);
          void writeMetadataCache(
            userId,
            key.slice(userId.length + 1),
            withoutSignedUrls(nextListing),
          ).catch((cacheError: unknown) => {
            console.warn("Could not update the folder listing cache.", cacheError);
          });
        }
      };

      apply(name);
      return () => {
        for (const [key, previousListing] of previousListings) {
          rememberListing(key, previousListing);
          if (key === stateKey) setListing(previousListing);
          void writeMetadataCache(
            userId,
            key.slice(userId.length + 1),
            withoutSignedUrls(previousListing),
          ).catch((cacheError: unknown) => {
            console.warn("Could not restore the folder listing cache.", cacheError);
          });
        }
      };
    },
    [section, stateKey, userId],
  );

  const updateFilesOptimistically = useCallback(
    (fileId: string, update: (file: CloudFile) => CloudFile) => {
      if (!section || !userId) return () => {};
      const listingPrefix = `${userId}:section:${section}:`;
      const previousListings = new Map<string, SectionListing>();
      for (const [key, cachedListing] of [...memoryListingCache.entries()]) {
        if (!key.startsWith(listingPrefix)) continue;
        let changed = false;
        const files = cachedListing.files.map((file) => {
          if (file.id !== fileId) return file;
          changed = true;
          return update(file);
        });
        if (!changed) continue;
        previousListings.set(key, cachedListing);
        const nextListing = { ...cachedListing, files };
        rememberListing(key, nextListing);
        if (key === stateKey) setListing(nextListing);
        void writeMetadataCache(
          userId,
          key.slice(userId.length + 1),
          withoutSignedUrls(nextListing),
        ).catch((cacheError: unknown) => {
          console.warn("Could not update the folder listing cache.", cacheError);
        });
      }
      return () => {
        for (const [key, previousListing] of previousListings) {
          rememberListing(key, previousListing);
          if (key === stateKey) setListing(previousListing);
          void writeMetadataCache(
            userId,
            key.slice(userId.length + 1),
            withoutSignedUrls(previousListing),
          ).catch((cacheError: unknown) => {
            console.warn("Could not restore the folder listing cache.", cacheError);
          });
        }
      };
    },
    [section, stateKey, userId],
  );

  const refresh = useCallback(() => load(true), [load]);
  const isCurrentListing = stateKey !== "" && storedKey === stateKey;
  const currentMemoryListing = stateKey
    ? memoryListingCache.get(stateKey)
    : undefined;

  return {
    listing: isCurrentListing
      ? listing
      : (currentMemoryListing ?? EMPTY_LISTING),
    isLoading: isCurrentListing
      ? isLoading
      : Boolean(section && !currentMemoryListing),
    isRefreshing: isCurrentListing && isRefreshing,
    isLoadingMore: isCurrentListing && isLoadingMore,
    error: isCurrentListing ? error : null,
    refresh,
    loadMore,
    moveFilesOptimistically,
    updateFolderOptimistically,
    updateFilesOptimistically,
  };
}
