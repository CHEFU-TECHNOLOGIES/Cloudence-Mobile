import { CloudFile } from "../../types/file";
import { apiRequest } from "./client";
import { parseCloudFile } from "./files";

export type FolderSection = "documents" | "images" | "media" | "others";

export type CloudenceFolder = {
  id: string;
  name: string;
  section: FolderSection;
  createdAt: string;
};

export type SectionListing = {
  files: CloudFile[];
  folders: CloudenceFolder[];
  nextOffset?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseFolder(value: unknown): CloudenceFolder {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.createdAt !== "string" ||
    (value.section !== "documents" &&
      value.section !== "images" &&
      value.section !== "media" &&
      value.section !== "others")
  ) {
    throw new Error("The folder response is invalid.");
  }
  return {
    id: value.id,
    name: value.name,
    section: value.section,
    createdAt: value.createdAt,
  };
}

export async function listSectionListing(
  accessToken: string,
  section: FolderSection,
  folderId: string | null = null,
  offset = 0,
  signal?: AbortSignal,
): Promise<SectionListing> {
  const params = new URLSearchParams({ section, limit: "100" });
  if (folderId) params.set("folder", folderId);
  if (folderId && offset > 0) params.set("offset", String(offset));

  const result = await apiRequest<unknown>(
    `/cloudence/files?${params.toString()}`,
    accessToken,
    { signal },
  );
  if (
    !isRecord(result) ||
    !Array.isArray(result.documents) ||
    !Array.isArray(result.folders)
  ) {
    throw new Error("The folder contents response is invalid.");
  }

  const nextOffset = result.nextOffset;
  if (
    nextOffset !== undefined &&
    (typeof nextOffset !== "number" ||
      !Number.isSafeInteger(nextOffset) ||
      nextOffset < 0)
  ) {
    throw new Error("The folder response contains an invalid page offset.");
  }

  return {
    files: result.documents.map(parseCloudFile),
    folders: result.folders.map(parseFolder),
    nextOffset,
  };
}

export async function createFolder(
  accessToken: string,
  section: FolderSection,
  name: string,
) {
  const result = await apiRequest<unknown>(
    "/cloudence/files/folders",
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, name }),
    },
  );
  if (!isRecord(result) || !Array.isArray(result.folders)) {
    throw new Error("The folder creation response is invalid.");
  }
  return result.folders.map(parseFolder);
}

export async function renameFolder(
  accessToken: string,
  folderId: string,
  name: string,
) {
  const result = await apiRequest<unknown>(
    `/cloudence/files/folders/${encodeURIComponent(folderId)}`,
    accessToken,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    },
  );
  if (!isRecord(result) || !Array.isArray(result.folders)) {
    throw new Error("The folder rename response is invalid.");
  }
  return result.folders.map(parseFolder);
}

export async function deleteFolder(accessToken: string, folderId: string) {
  const result = await apiRequest<unknown>(
    `/cloudence/files/folders/${encodeURIComponent(folderId)}`,
    accessToken,
    { method: "DELETE" },
  );
  if (!isRecord(result) || result.status !== "success") {
    throw new Error("The server did not confirm the folder deletion.");
  }
}

export async function moveFilesToFolder(
  accessToken: string,
  fileIds: string[],
  folderId: string | null,
) {
  const result = await apiRequest<unknown>(
    "/cloudence/files/folders/move",
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds, folderId }),
    },
  );
  if (
    !isRecord(result) ||
    result.status !== "success" ||
    result.moved !== fileIds.length
  ) {
    throw new Error("The server did not confirm moving the selected files.");
  }
}
