import { useState } from "react";
import { useSession } from "../auth/SessionContext";
import { useToast } from "../components/cloudence/ToastProvider";
import {
  CloudenceFolder,
  deleteFolder,
  renameFolder,
} from "../lib/api/folders";

export function useFolderActions(
  refreshListing: () => Promise<boolean>,
  updateFolderOptimistically: (
    folderId: string,
    name: string | null,
  ) => () => void,
) {
  const { getAccessToken } = useSession();
  const { showToast } = useToast();
  const [selectedFolder, setSelectedFolder] = useState<CloudenceFolder | null>(
    null,
  );
  const [visible, setVisible] = useState(false);

  const open = (folder: CloudenceFolder) => {
    setSelectedFolder(folder);
    setVisible(true);
  };

  const close = () => setVisible(false);

  const rename = (folder: CloudenceFolder, name: string) => {
    const rollback = updateFolderOptimistically(folder.id, name);
    void (async () => {
      try {
        const token = await getAccessToken();
        await renameFolder(token, folder.id, name);
        const refreshed = await refreshListing();
        showToast({
          title: "Folder renamed",
          message: refreshed
            ? `“${name}” is the folder's new name.`
            : "The folder was renamed, but the list could not refresh.",
          variant: refreshed ? "success" : "error",
        });
      } catch (error) {
        rollback();
        showToast({
          title: "Folder rename failed",
          message:
            error instanceof Error ? error.message : "The folder could not be renamed.",
          variant: "error",
        });
      }
    })();
  };

  const remove = (folder: CloudenceFolder) => {
    const rollback = updateFolderOptimistically(folder.id, null);
    void (async () => {
      try {
        const token = await getAccessToken();
        await deleteFolder(token, folder.id);
        const refreshed = await refreshListing();
        showToast({
          title: "Folder deleted",
          message: refreshed
            ? `“${folder.name}” was deleted.`
            : "The folder was deleted, but the list could not refresh.",
          variant: refreshed ? "success" : "error",
        });
      } catch (error) {
        rollback();
        showToast({
          title: "Folder deletion failed",
          message:
            error instanceof Error ? error.message : "The folder could not be deleted.",
          variant: "error",
        });
      }
    })();
  };

  return { selectedFolder, visible, open, close, rename, remove };
}
