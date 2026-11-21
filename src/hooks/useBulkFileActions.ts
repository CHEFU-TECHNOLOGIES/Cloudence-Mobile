import { useSession } from "../auth/SessionContext";
import { useToast } from "../components/cloudence/ToastProvider";
import { moveFilesToFolder } from "../lib/api/folders";
import { CloudFile } from "../types/file";

type Props = {
  removeFile: (
    fileId: string,
    refreshAfter?: boolean,
    fallbackFile?: CloudFile,
  ) => Promise<void>;
  refreshListing: () => Promise<boolean>;
  optimisticallyMove: (
    files: CloudFile[],
    folderId: string | null,
  ) => (rollbackIds?: string[]) => void;
};

export function useBulkFileActions({
  removeFile,
  refreshListing,
  optimisticallyMove,
}: Props) {
  const { getAccessToken } = useSession();
  const { showToast } = useToast();

  const deleteFiles = async (files: CloudFile[]) => {
    let deleted = 0;
    const failures: string[] = [];
    for (const file of files) {
      try {
        await removeFile(file.id, false, file);
        deleted += 1;
      } catch {
        failures.push(file.name);
      }
    }

    const refreshed = await refreshListing();
    if (failures.length) {
      showToast({
        title: deleted ? "Some files were deleted" : "Files could not be deleted",
        message: `${deleted} deleted; ${failures.length} failed.${refreshed ? "" : " The list could not refresh."}`,
        variant: "error",
      });
      return;
    }
    showToast({
      title: "Files deleted",
      message: refreshed
        ? `${deleted} ${deleted === 1 ? "file was" : "files were"} deleted.`
        : "The files were deleted, but the list could not refresh.",
      variant: refreshed ? "success" : "error",
    });
  };

  const moveFiles = async (files: CloudFile[], folderId: string | null) => {
    let moved = 0;
    const rollback = optimisticallyMove(files, folderId);
    try {
      const token = await getAccessToken();
      for (let start = 0; start < files.length; start += 50) {
        const chunk = files.slice(start, start + 50);
        await moveFilesToFolder(
          token,
          chunk.map((file) => file.id),
          folderId,
        );
        moved += chunk.length;
      }
      const refreshed = await refreshListing();
      showToast({
        title: "Files moved",
        message: refreshed
          ? `${files.length} ${files.length === 1 ? "file was" : "files were"} moved.`
          : "The files were moved, but the list could not refresh.",
        variant: refreshed ? "success" : "error",
      });
    } catch (error) {
      rollback(
        files.slice(moved).map((file) => file.id),
      );
      await refreshListing();
      showToast({
        title: moved ? "Some files were moved" : "Move failed",
        message:
          moved
            ? `${moved} files moved before the error. ${error instanceof Error ? error.message : "The remaining files could not be moved."}`
            : error instanceof Error
              ? error.message
              : "The selected files could not be moved.",
        variant: "error",
      });
    }
  };

  return { deleteFiles, moveFiles };
}
