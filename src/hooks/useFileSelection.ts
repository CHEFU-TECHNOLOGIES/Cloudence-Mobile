import { useMemo, useState } from "react";
import { CloudFile } from "../types/file";

export function useFileSelection(files: CloudFile[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedFiles = useMemo(
    () => files.filter((file) => selectedIds.includes(file.id)),
    [files, selectedIds],
  );

  const toggle = (file: CloudFile) => {
    setSelectedIds((current) =>
      current.includes(file.id)
        ? current.filter((id) => id !== file.id)
        : [...current, file.id],
    );
  };

  const selectOnLongPress = (file: CloudFile) => {
    setSelectedIds((current) =>
      current.includes(file.id) ? current : [...current, file.id],
    );
  };

  return {
    selectedIds,
    selectedFiles,
    selectionMode: selectedIds.length > 0,
    toggle,
    selectOnLongPress,
    clear: () => setSelectedIds([]),
  };
}
