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

const STALE_TIME = 2 * 60 * 1000;

const EMPTY_LISTING: SectionListing = {
  files: [],
  folders: [],
};

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
  const userId = user?.id ?? null;
  const cacheKey = section
    ? `section:${section}:${folderId ?? "root"}`
    : "";
  const stateKey = userId && cacheKey ? `${userId}:${cacheKey}` : "";
  const [storedKey, setStoredKey] = useState("");
  const [listing, setListing] = useState<SectionListing>(EMPTY_LISTING);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const requestRef = useRef<Promise<void> | null>(null);
  const storedKeyRef = useRef("");
  const hasListingRef = useRef(false);
  const loadingMoreRef = useRef(false);

  const load = useCallback(
    async (force = false, signal?: AbortSignal) => {
      if (!section || !userId || !cacheKey) return;
      if (requestRef.current) return requestRef.current;

      const request = (async () => {
        try {
          if (!force) {
            const cached = await readMetadataCache(userId, cacheKey);
            if (signal?.aborted) return;
            if (cached && isCachedListing(cached.payload)) {
              storedKeyRef.current = stateKey;
              hasListingRef.current = true;
              setStoredKey(stateKey);
              setListing(cached.payload);
              setError(null);
              if (Date.now() - cached.cachedAt < STALE_TIME) return;
            }
          }

          if (isOffline) {
            setError(null);
            return;
          }

          if (storedKeyRef.current !== stateKey || !hasListingRef.current) {
            setIsLoading(true);
          }
          const accessToken = await getAccessToken();
          const nextListing = await listSectionListing(
            accessToken,
            section,
            folderId,
            0,
            signal,
          );
          if (signal?.aborted) return;

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
        } catch (loadError) {
          if (!signal?.aborted) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "Unable to load this folder.",
            );
          }
        } finally {
          if (!signal?.aborted) setIsLoading(false);
        }
      })();

      requestRef.current = request;
      try {
        await request;
      } finally {
        if (requestRef.current === request) requestRef.current = null;
      }
    },
    [
      cacheKey,
      folderId,
      getAccessToken,
      isOffline,
      section,
      stateKey,
      userId,
    ],
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
        files: [...listing.files, ...nextPage.files],
        folders: nextPage.folders,
        nextOffset: nextPage.nextOffset,
      };
      setListing(combined);
      setError(null);
      await writeMetadataCache(
        userId,
        cacheKey,
        withoutSignedUrls(combined),
      );
    } catch (loadError) {
      if (!controller.signal.aborted) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load more files.",
        );
      }
    } finally {
      loadingMoreRef.current = false;
      if (!controller.signal.aborted) setIsLoadingMore(false);
    }
  }, [
    cacheKey,
    folderId,
    getAccessToken,
    isLoadingMore,
    isOffline,
    listing,
    section,
    userId,
  ]);

  const refresh = useCallback(() => load(true), [load]);
  const isCurrentListing = stateKey !== "" && storedKey === stateKey;

  return {
    listing: isCurrentListing ? listing : EMPTY_LISTING,
    isLoading: isCurrentListing ? isLoading : Boolean(section),
    isLoadingMore: isCurrentListing && isLoadingMore,
    error: isCurrentListing ? error : null,
    refresh,
    loadMore,
  };
}
