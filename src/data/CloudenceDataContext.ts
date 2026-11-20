import * as DocumentPicker from "expo-document-picker";
import { CloudenceUsage } from "../lib/api/files";
import { CloudFile } from "../types/file";

export type CloudenceDataContextValue = {
  files: CloudFile[];
  recentFiles: CloudFile[];
  usage: CloudenceUsage | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isOffline: boolean;
  error: string | null;
  uploadProgress: number | null;
  isUploading: boolean;
  cancelUpload: () => void;
  downloadProgress: number | null;
  isDownloading: boolean;
  cancelDownload: () => void;
  refresh: () => Promise<boolean>;
  rename: (fileId: string, name: string) => Promise<void>;
  remove: (fileId: string) => Promise<void>;
  share: (fileId: string, users: string[]) => Promise<void>;
  upload: (
    asset: DocumentPicker.DocumentPickerAsset,
    name?: string,
    folderId?: string | null,
  ) => Promise<void>;
  download: (
    file: CloudFile,
    onProgress?: (progress: number | null) => void,
  ) => Promise<void>;
};
