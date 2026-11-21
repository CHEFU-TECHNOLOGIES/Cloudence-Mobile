export type FileCategory =
  | "Documents"
  | "Images"
  | "Media"
  | "Others";

export type FileType = "document" | "image" | "video" | "audio" | "other";

export type CloudFile = {
  id: string;
  duplicate?: boolean;
  name: string;
  extension: string;
  type: FileType;
  category: FileCategory;
  size: number;
  sizeFormatted: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
  users: string[];
  shareExpiresAt?: string;
  shareExpiresAtByUser?: Record<string, string | null>;
  url?: string;
  folderId?: string;
  dimensions?: string;
  duration?: string;
  color?: string;
};

export type ViewType = "grid" | "list";

export type SortType =
  | "$createdAt-desc"
  | "$createdAt-asc"
  | "name-asc"
  | "name-desc"
  | "size-desc"
  | "size-asc";

export type ActionModalType = "rename" | "details" | "share" | "download" | "delete" | null;
