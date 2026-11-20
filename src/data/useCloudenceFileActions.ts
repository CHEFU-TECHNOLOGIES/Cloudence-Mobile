import { useCallback, useEffect, useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import {
  deleteFile as deleteFileRequest,
  downloadFile as downloadFileRequest,
  renameFile as renameFileRequest,
  TransferProgress,
  updateFileSharing,
  uploadFile as uploadFileRequest,
} from "../lib/api/files";
import { CloudFile } from "../types/file";

type CloudenceFileActionsOptions = {
  userId: string | null;
  getAccessToken: () => Promise<string>;
  getFiles: () => CloudFile[];
  setFiles: (files: CloudFile[]) => void;
  getRecentFiles: () => CloudFile[];
  setRecentFiles: (files: CloudFile[]) => void;
  persistFiles: (userId: string, files: CloudFile[]) => Promise<string | null>;
  refreshData: (force: boolean) => Promise<boolean>;
  invalidateUsage: () => void;
  setError: (error: string | null) => void;
};

function insertAt<T>(items: T[], item: T, index: number) {
  const next = [...items];
  next.splice(Math.min(index, next.length), 0, item);
  return next;
}

export function useCloudenceFileActions({
  userId,
  getAccessToken,
  getFiles,
  setFiles,
  getRecentFiles,
  setRecentFiles,
  persistFiles,
  refreshData,
  invalidateUsage,
  setError,
}: CloudenceFileActionsOptions) {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(
    null,
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const uploadControllerRef = useRef<AbortController | null>(null);
  const downloadControllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      uploadControllerRef.current?.abort();
      downloadControllerRef.current?.abort();
    },
    [userId],
  );

  const rename = useCallback(
    async (fileId: string, name: string) => {
      if (!userId) throw new Error("Sign in to rename Cloudence files.");
      const currentFiles = getFiles();
      const currentRecent = getRecentFiles();
      const previousFile = currentFiles.find((file) => file.id === fileId);
      const previousRecent = currentRecent.find((file) => file.id === fileId);
      if (!previousFile)
        throw new Error("This file is no longer available.");

      const optimisticFile = { ...previousFile, name };
      setFiles(
        currentFiles.map((file) =>
          file.id === fileId ? optimisticFile : file,
        ),
      );
      setRecentFiles(
        currentRecent.map((file) =>
          file.id === fileId ? optimisticFile : file,
        ),
      );

      try {
        const accessToken = await getAccessToken();
        const updated = await renameFileRequest(accessToken, fileId, name);
        const reconciled = { ...updated, folderId: previousFile.folderId };
        setFiles(
          getFiles().map((file) =>
            file.id === fileId ? reconciled : file,
          ),
        );
        setRecentFiles(
          getRecentFiles().map((file) =>
            file.id === fileId ? reconciled : file,
          ),
        );
        const cacheError = await persistFiles(userId, getFiles());
        if (cacheError) {
          setError(
            `Your change was saved, but cache could not update: ${cacheError}`,
          );
        }
      } catch (mutationError) {
        setFiles(
          getFiles().map((file) =>
            file.id === fileId ? previousFile : file,
          ),
        );
        setRecentFiles(
          getRecentFiles().map((file) =>
            file.id === fileId
              ? (previousRecent ?? previousFile)
              : file,
          ),
        );
        throw mutationError;
      }
    },
    [
      getAccessToken,
      getFiles,
      getRecentFiles,
      persistFiles,
      setError,
      setFiles,
      setRecentFiles,
      userId,
    ],
  );

  const remove = useCallback(
    async (fileId: string) => {
      if (!userId) throw new Error("Sign in to delete Cloudence files.");
      const currentFiles = getFiles();
      const currentRecent = getRecentFiles();
      const originalIndex = currentFiles.findIndex(
        (file) => file.id === fileId,
      );
      const previousFile = currentFiles[originalIndex];
      const recentIndex = currentRecent.findIndex(
        (file) => file.id === fileId,
      );
      const previousRecent = currentRecent[recentIndex];
      if (!previousFile)
        throw new Error("This file is no longer available.");

      setFiles(currentFiles.filter((file) => file.id !== fileId));
      setRecentFiles(currentRecent.filter((file) => file.id !== fileId));

      try {
        const accessToken = await getAccessToken();
        await deleteFileRequest(accessToken, fileId);
        const cacheError = await persistFiles(userId, getFiles());
        if (cacheError) {
          setError(
            `Your change was saved, but cache could not update: ${cacheError}`,
          );
        }
        invalidateUsage();
        void refreshData(false);
      } catch (mutationError) {
        const currentAfterFailure = getFiles();
        if (!currentAfterFailure.some((file) => file.id === fileId)) {
          setFiles(insertAt(currentAfterFailure, previousFile, originalIndex));
        }
        const recentAfterFailure = getRecentFiles();
        if (
          previousRecent &&
          !recentAfterFailure.some((file) => file.id === fileId)
        ) {
          setRecentFiles(
            insertAt(recentAfterFailure, previousRecent, recentIndex),
          );
        }
        throw mutationError;
      }
    },
    [
      getAccessToken,
      getFiles,
      getRecentFiles,
      invalidateUsage,
      persistFiles,
      refreshData,
      setError,
      setFiles,
      setRecentFiles,
      userId,
    ],
  );

  const share = useCallback(
    async (fileId: string, users: string[]) => {
      if (!userId) throw new Error("Sign in to share Cloudence files.");
      const accessToken = await getAccessToken();
      const updated = await updateFileSharing(accessToken, fileId, users);
      setFiles(
        getFiles().map((file) =>
          file.id === fileId
            ? { ...updated, folderId: file.folderId }
            : file,
        ),
      );
      setRecentFiles(
        getRecentFiles().map((file) =>
          file.id === fileId
            ? { ...updated, folderId: file.folderId }
            : file,
        ),
      );
      const cacheError = await persistFiles(userId, getFiles());
      if (cacheError) {
        setError(
          `Your change was saved, but cache could not update: ${cacheError}`,
        );
      }
    },
    [
      getAccessToken,
      getFiles,
      getRecentFiles,
      persistFiles,
      setError,
      setFiles,
      setRecentFiles,
      userId,
    ],
  );

  const upload = useCallback(
    async (
      asset: DocumentPicker.DocumentPickerAsset,
      name?: string,
      folderId?: string | null,
    ) => {
      if (!userId) throw new Error("Sign in to upload to Cloudence.");
      if (uploadControllerRef.current) {
        throw new Error("An upload is already in progress.");
      }

      const controller = new AbortController();
      uploadControllerRef.current = controller;
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const accessToken = await getAccessToken();
        const uploaded = await uploadFileRequest(
          accessToken,
          asset,
          name,
          ({ transferredBytes, totalBytes }) => {
            setUploadProgress(
              totalBytes > 0
                ? Math.min(
                    100,
                    Math.round((transferredBytes / totalBytes) * 100),
                  )
                : null,
            );
          },
          controller.signal,
          folderId,
        );
        const nextFiles = [
          uploaded,
          ...getFiles().filter((file) => file.id !== uploaded.id),
        ];
        const nextRecent = [
          uploaded,
          ...getRecentFiles().filter((file) => file.id !== uploaded.id),
        ].slice(0, 10);
        setFiles(nextFiles);
        setRecentFiles(nextRecent);
        const cacheError = await persistFiles(userId, nextFiles);
        if (cacheError) {
          setError(
            `Your upload completed, but cache could not update: ${cacheError}`,
          );
        }
        invalidateUsage();
        void refreshData(false);
      } finally {
        if (uploadControllerRef.current === controller) {
          uploadControllerRef.current = null;
        }
        setIsUploading(false);
        setUploadProgress(null);
      }
    },
    [
      getAccessToken,
      getFiles,
      getRecentFiles,
      invalidateUsage,
      persistFiles,
      refreshData,
      setError,
      setFiles,
      setRecentFiles,
      userId,
    ],
  );

  const cancelUpload = useCallback(() => {
    uploadControllerRef.current?.abort();
  }, []);

  const download = useCallback(
    async (
      file: CloudFile,
      onProgress?: (progress: number | null) => void,
    ) => {
      if (downloadControllerRef.current) {
        throw new Error("A download is already in progress.");
      }
      const controller = new AbortController();
      downloadControllerRef.current = controller;
      setIsDownloading(true);
      setDownloadProgress(null);
      onProgress?.(null);
      try {
        const accessToken = await getAccessToken();
        await downloadFileRequest(
          accessToken,
          file,
          ({ transferredBytes, totalBytes }: TransferProgress) => {
            const progress =
              totalBytes > 0
                ? Math.min(
                    100,
                    Math.round((transferredBytes / totalBytes) * 100),
                  )
                : null;
            setDownloadProgress(progress);
            onProgress?.(progress);
          },
          controller.signal,
        );
      } finally {
        if (downloadControllerRef.current === controller) {
          downloadControllerRef.current = null;
        }
        setIsDownloading(false);
        setDownloadProgress(null);
      }
    },
    [getAccessToken],
  );

  const cancelDownload = useCallback(() => {
    downloadControllerRef.current?.abort();
  }, []);

  return {
    uploadProgress,
    isUploading,
    cancelUpload,
    downloadProgress,
    isDownloading,
    cancelDownload,
    rename,
    remove,
    share,
    upload,
    download,
  };
}
