import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import * as DocumentPicker from "expo-document-picker";
import type { UploadQueueItem } from "./UploadQueueList";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

type FileUploadQueueContextValue = {
  queue: UploadQueueItem[];
  setQueue: React.Dispatch<React.SetStateAction<UploadQueueItem[]>>;
  addAssetsToQueue: (assets: DocumentPicker.DocumentPickerAsset[]) => void;
  filesUploadRequested: boolean;
  requestFilesUpload: () => void;
  clearFilesUploadRequest: () => void;
};

const FileUploadQueueContext =
  createContext<FileUploadQueueContextValue | null>(null);

export function FileUploadQueueProvider({
  children,
}: React.PropsWithChildren) {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [filesUploadRequested, setFilesUploadRequested] = useState(false);

  const addAssetsToQueue = useCallback(
    (assets: DocumentPicker.DocumentPickerAsset[]) => {
      setQueue((current) => {
        const knownUris = new Set(current.map((item) => item.asset.uri));
        const newItems: UploadQueueItem[] = [];
        for (const asset of assets) {
          if (knownUris.has(asset.uri)) continue;
          knownUris.add(asset.uri);
          newItems.push({
            id: `${asset.uri}:${Date.now()}:${Math.random()}`,
            asset,
            uploadName: "",
            status:
              asset.size !== undefined && asset.size > MAX_UPLOAD_BYTES
                ? "invalid"
                : "queued",
          });
        }
        return [...current, ...newItems];
      });
    },
    [],
  );

  const requestFilesUpload = useCallback(
    () => setFilesUploadRequested(true),
    [],
  );
  const clearFilesUploadRequest = useCallback(
    () => setFilesUploadRequested(false),
    [],
  );

  return (
    <FileUploadQueueContext.Provider
      value={{
        queue,
        setQueue,
        addAssetsToQueue,
        filesUploadRequested,
        requestFilesUpload,
        clearFilesUploadRequest,
      }}
    >
      {children}
    </FileUploadQueueContext.Provider>
  );
}

export function useFileUploadQueue() {
  const context = useContext(FileUploadQueueContext);
  if (!context) {
    throw new Error(
      "useFileUploadQueue must be used within FileUploadQueueProvider.",
    );
  }
  return context;
}
