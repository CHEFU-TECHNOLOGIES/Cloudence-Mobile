import { fetch as expoFetch } from "expo/fetch";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths, UploadType } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { CloudFile, FileCategory, FileType } from "../../types/file";
import { convertFileSize } from "../../utils/fileUtils";
import { API_BASE_URL } from "./config";
import {
  apiRequest,
  ApiError,
  getApiUrl,
  getAuthHeaders,
  getApiErrorMessage,
} from "./client";

type UsageCategory = {
  size: number;
  latestDate: string | null;
};

export type CloudenceUsage = {
  image: UsageCategory;
  document: UsageCategory;
  video: UsageCategory;
  audio: UsageCategory;
  other: UsageCategory;
  used: number;
  all: number;
  plan?: "free" | "50gb";
  expiresAt?: string | null;
  productId?: string | null;
};

export type TransferProgress = {
  transferredBytes: number;
  totalBytes: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requiredString(
  value: unknown,
  fieldName: string,
): string {
  if (typeof value !== "string" || !value) {
    throw new Error(`The file response is missing ${fieldName}.`);
  }
  return value;
}

function requiredNumber(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`The file response contains an invalid ${fieldName}.`);
  }
  return value;
}

function getFileCategory(type: FileType): FileCategory {
  switch (type) {
    case "document":
      return "Documents";
    case "image":
      return "Images";
    case "video":
    case "audio":
      return "Media";
    case "other":
      return "Others";
  }
}

function parseFileType(value: unknown): FileType {
  if (
    value === "document" ||
    value === "image" ||
    value === "video" ||
    value === "audio" ||
    value === "other"
  ) {
    return value;
  }
  throw new Error("The file response contains an unsupported file type.");
}

export function parseCloudFile(value: unknown): CloudFile {
  if (!isRecord(value) || !isRecord(value.owner)) {
    throw new Error("The file response is invalid.");
  }

  const type = parseFileType(value.type);
  const users = value.users;
  if (
    !Array.isArray(users) ||
    users.some((recipient) => typeof recipient !== "string")
  ) {
    throw new Error("The file response contains an invalid sharing list.");
  }
  const userExpirations = isRecord(value.shareExpiresAtByUser)
    ? value.shareExpiresAtByUser
    : undefined;
  if (
    userExpirations &&
    Object.values(userExpirations).some(
      (expiresAt) => expiresAt !== null && typeof expiresAt !== "string",
    )
  ) {
    throw new Error("The file response contains invalid collaborator expirations.");
  }

  const file: CloudFile = {
    id: requiredString(value.id, "an id"),
    ...(value.duplicate === true ? { duplicate: true } : {}),
    name: requiredString(value.name, "a name"),
    extension: requiredString(value.extension, "an extension"),
    type,
    category: getFileCategory(type),
    size: requiredNumber(value.size, "size"),
    sizeFormatted: convertFileSize(requiredNumber(value.size, "size")),
    createdAt: requiredString(value.createdAt, "a creation date"),
    updatedAt: requiredString(value.updatedAt, "an update date"),
    owner: {
      id: requiredString(value.owner.id, "an owner id"),
      fullName: requiredString(value.owner.fullName, "an owner name"),
      email: requiredString(value.owner.email, "an owner email"),
    },
    users,
    shareExpiresAt:
      typeof value.shareExpiresAt === "string" ? value.shareExpiresAt : undefined,
    shareExpiresAtByUser:
      userExpirations
        ? (userExpirations as Record<string, string | null>)
        : undefined,
    url: typeof value.url === "string" ? value.url : undefined,
    folderId: typeof value.folderId === "string" ? value.folderId : undefined,
  };

  if (typeof value.dimensions === "string") file.dimensions = value.dimensions;
  if (typeof value.duration === "string") file.duration = value.duration;
  return file;
}

function parseUsageCategory(value: unknown, name: string): UsageCategory {
  if (!isRecord(value)) {
    throw new Error(`The usage response is missing ${name} usage.`);
  }
  const latestDate = value.latestDate;
  if (latestDate !== null && typeof latestDate !== "string") {
    throw new Error(`The usage response contains an invalid ${name} date.`);
  }
  return {
    size: requiredNumber(value.size, `${name} usage`),
    latestDate,
  };
}

function parseUsage(value: unknown): CloudenceUsage {
  if (!isRecord(value)) {
    throw new Error("The storage usage response is invalid.");
  }
  const plan = value.plan;
  const expiresAt = value.expiresAt;
  const productId = value.productId;
  if (
    (plan !== undefined && plan !== "free" && plan !== "50gb") ||
    (expiresAt !== undefined &&
      expiresAt !== null &&
      typeof expiresAt !== "string") ||
    (productId !== undefined &&
      productId !== null &&
      typeof productId !== "string")
  ) {
    throw new Error("The storage usage response contains invalid subscription data.");
  }
  return {
    image: parseUsageCategory(value.image, "image"),
    document: parseUsageCategory(value.document, "document"),
    video: parseUsageCategory(value.video, "video"),
    audio: parseUsageCategory(value.audio, "audio"),
    other: parseUsageCategory(value.other, "other"),
    used: requiredNumber(value.used, "total used storage"),
    all: requiredNumber(value.all, "storage quota"),
    plan: plan === "50gb" ? "50gb" : "free",
    expiresAt: typeof expiresAt === "string" ? expiresAt : null,
    productId: typeof productId === "string" ? productId : null,
  };
}

export async function listFiles(accessToken: string, signal?: AbortSignal) {
  const result = await apiRequest<unknown>(
    "/cloudence/files?limit=100",
    accessToken,
    { signal },
  );
  if (!isRecord(result) || !Array.isArray(result.documents)) {
    throw new Error("The files response is invalid.");
  }
  return result.documents.map(parseCloudFile);
}

export async function getUsage(accessToken: string, signal?: AbortSignal) {
  return parseUsage(
    await apiRequest<unknown>("/cloudence/files/usage", accessToken, { signal }),
  );
}

export async function renameFile(
  accessToken: string,
  fileId: string,
  name: string,
) {
  const updated = await apiRequest<unknown>(
    `/cloudence/files/${encodeURIComponent(fileId)}`,
    accessToken,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    },
  );
  return parseCloudFile(updated);
}

export async function updateFileSharing(
  accessToken: string,
  fileId: string,
  users: string[],
  userExpiration?: { email: string; expiresAt: string | null },
) {
  const updated = await apiRequest<unknown>(
    `/cloudence/files/${encodeURIComponent(fileId)}`,
    accessToken,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(userExpiration === undefined ? { users } : {}),
        ...(userExpiration !== undefined ? { userExpiration } : {}),
      }),
    },
  );
  return parseCloudFile(updated);
}

export async function deleteFile(accessToken: string, fileId: string) {
  const result = await apiRequest<unknown>(
    `/cloudence/files/${encodeURIComponent(fileId)}`,
    accessToken,
    { method: "DELETE" },
  );
  if (!isRecord(result) || result.status !== "success") {
    throw new Error("The server did not confirm the file deletion.");
  }
}

function uploadWebFile(
  body: FormData,
  accessToken: string,
  onProgress?: (progress: TransferProgress) => void,
  signal?: AbortSignal,
) {
  return new Promise<string>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const removeAbortListener = () =>
      signal?.removeEventListener("abort", abort);
    const abort = () => request.abort();
    request.open("POST", getApiUrl("/cloudence/files"));
    for (const [key, value] of Object.entries(getAuthHeaders(accessToken))) {
      request.setRequestHeader(key, value);
    }

    request.upload.onprogress = (event) => {
      onProgress?.({
        transferredBytes: event.loaded,
        totalBytes: event.lengthComputable ? event.total : 0,
      });
    };
    request.onload = () => {
      removeAbortListener();
      if (request.status < 200 || request.status >= 300) {
        reject(
          new ApiError(
            getApiErrorMessage(request.responseText, request.status),
            request.status,
          ),
        );
        return;
      }
      resolve(request.responseText);
    };
    request.onerror = () => {
      removeAbortListener();
      reject(new Error("The upload failed because the network request could not complete."));
    };
    request.onabort = () => {
      removeAbortListener();
      const error = new Error("The upload was cancelled.");
      error.name = "AbortError";
      reject(error);
    };

    if (signal?.aborted) {
      reject(Object.assign(new Error("The upload was cancelled."), { name: "AbortError" }));
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    request.send(body);
  });
}

export async function uploadFile(
  accessToken: string,
  asset: DocumentPicker.DocumentPickerAsset,
  name?: string,
  onProgress?: (progress: TransferProgress) => void,
  signal?: AbortSignal,
  folderId?: string | null,
) {
  const file = new File(asset.uri);
  if (Platform.OS !== "web") {
    const task = file.createUploadTask(getApiUrl("/cloudence/files"), {
      uploadType: UploadType.MULTIPART,
      fieldName: "file",
      mimeType: asset.mimeType ?? "application/octet-stream",
      headers: getAuthHeaders(accessToken),
      parameters: {
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(folderId ? { folderId } : {}),
      },
      signal,
      onProgress: ({ bytesSent, totalBytes }) =>
        onProgress?.({ transferredBytes: bytesSent, totalBytes }),
    });

    try {
      const response = await task.uploadAsync();
      if (response.status < 200 || response.status >= 300) {
        throw new ApiError(
          getApiErrorMessage(response.body, response.status),
          response.status,
        );
      }
      return parseCloudFile(JSON.parse(response.body) as unknown);
    } finally {
      task.release();
    }
  }

  const body = new FormData();
  body.append("file", file, asset.name);
  if (name?.trim()) body.append("name", name.trim());
  if (folderId) body.append("folderId", folderId);

  const response = await uploadWebFile(body, accessToken, onProgress, signal);
  return parseCloudFile(JSON.parse(response) as unknown);
}

export async function downloadFile(
  accessToken: string,
  file: CloudFile,
  onProgress?: (progress: TransferProgress) => void,
  signal?: AbortSignal,
) {
  const downloadInfo = await apiRequest<unknown>(
    `/cloudence/files/${encodeURIComponent(file.id)}/download?json=true`,
    accessToken,
    { signal },
  );
  if (!isRecord(downloadInfo) || typeof downloadInfo.downloadUrl !== "string") {
    throw new Error("The download response is invalid.");
  }

  const downloadUrl = new URL(downloadInfo.downloadUrl, API_BASE_URL).toString();
  const safeId = file.id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${safeId}-${file.name}.${file.extension}`.replace(/[\\/:*?"<>|]/g, "_");

  if (Platform.OS === "web") {
    const response = await expoFetch(downloadUrl, {
      headers: getAuthHeaders(accessToken),
      signal,
    });
    if (!response.ok) {
      throw new Error(
        getApiErrorMessage(await response.text(), response.status),
      );
    }

    const objectUrl = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    return;
  }

  const localFile = await File.downloadFileAsync(
    downloadUrl,
    new File(Paths.cache, fileName),
    {
      headers: getAuthHeaders(accessToken),
      idempotent: true,
      signal,
      onProgress: ({ bytesWritten, totalBytes }) =>
        onProgress?.({ transferredBytes: bytesWritten, totalBytes }),
    },
  );

  if (await localFile.canPreview()) {
    await localFile.preview({ title: file.name });
    return;
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("No app is available to open or share this file.");
  }

  await Sharing.shareAsync(localFile.uri, {
    dialogTitle: file.name,
    mimeType: localFile.type || undefined,
  });
}
