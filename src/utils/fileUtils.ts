import { CloudFile, SortType } from "../types/file";

export const convertFileSize = (sizeInBytes: number, digits = 1): string => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} Bytes`;
  } else if (sizeInBytes < 1024 * 1024) {
    const sizeInKB = sizeInBytes / 1024;
    return `${sizeInKB.toFixed(digits)} KB`;
  } else if (sizeInBytes < 1024 * 1024 * 1024) {
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return `${sizeInMB.toFixed(digits)} MB`;
  } else {
    const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
    return `${sizeInGB.toFixed(digits)} GB`;
  }
};

export const formatDateTime = (isoString: string | null | undefined): string => {
  if (!isoString) return "—";

  const date = new Date(isoString);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;

  const time = `${hours}:${minutes.toString().padStart(2, "0")}${period}`;
  const day = date.getDate();
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = monthNames[date.getMonth()];

  return `${time}, ${day} ${month}`;
};

export const sortFiles = (files: CloudFile[], sortType: SortType): CloudFile[] => {
  if (!files || files.length <= 1) return files || [];

  return [...files].sort((a, b) => {
    switch (sortType) {
      case "$createdAt-asc":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "$createdAt-desc":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "name-asc":
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
      case "name-desc":
        return b.name.localeCompare(a.name, undefined, { sensitivity: "base", numeric: true });
      case "size-asc":
        return a.size - b.size;
      case "size-desc":
        return b.size - a.size;
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
};
