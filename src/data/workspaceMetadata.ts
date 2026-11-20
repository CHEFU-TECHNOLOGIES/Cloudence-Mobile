import { CloudenceUsage } from "../lib/api/files";
import { CloudFile } from "../types/file";

export const FILES_CACHE_KEY = "files";
export const USAGE_CACHE_KEY = "usage";
export const FILES_STALE_TIME = 2 * 60 * 1000;
export const USAGE_STALE_TIME = 3 * 60 * 1000;

export function messageFromError(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to load the Cloudence workspace.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isCachedFile(value: unknown): value is CloudFile {
  if (!isRecord(value) || !isRecord(value.owner)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.extension === "string" &&
    typeof value.type === "string" &&
    typeof value.category === "string" &&
    typeof value.size === "number" &&
    typeof value.sizeFormatted === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    Array.isArray(value.users) &&
    value.users.every((email) => typeof email === "string") &&
    typeof value.owner.id === "string" &&
    typeof value.owner.fullName === "string" &&
    typeof value.owner.email === "string"
  );
}

export function isCachedUsage(value: unknown): value is CloudenceUsage {
  if (!isRecord(value)) return false;
  const categories = [
    value.image,
    value.document,
    value.video,
    value.audio,
    value.other,
  ];
  return (
    typeof value.used === "number" &&
    typeof value.all === "number" &&
    categories.every(
      (category) =>
        isRecord(category) &&
        typeof category.size === "number" &&
        (category.latestDate === null ||
          typeof category.latestDate === "string"),
    )
  );
}

export function stripSignedUrls(files: CloudFile[]) {
  return files.map((file) => ({ ...file, url: undefined }));
}
