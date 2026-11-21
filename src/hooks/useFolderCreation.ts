import { useState } from "react";
import { useSession } from "../auth/SessionContext";
import { useToast } from "../components/cloudence/ToastProvider";
import {
  CloudenceFolder,
  createFolder as createFolderRequest,
  FolderSection,
} from "../lib/api/folders";

export function useFolderCreation(
  section: FolderSection | null,
  refreshListing: () => Promise<boolean>,
) {
  const { getAccessToken } = useSession();
  const { showToast } = useToast();
  const [visible, setVisible] = useState(false);
  const [pendingFolder, setPendingFolder] = useState<CloudenceFolder | null>(null);

  const create = (name: string): Promise<void> => {
    if (!section) return Promise.resolve();
    const targetSection = section;
    const pendingId = `pending-folder-${Date.now()}`;
    const folder: CloudenceFolder = {
      id: pendingId,
      name,
      section: targetSection,
      createdAt: new Date().toISOString(),
    };
    setPendingFolder(folder);
    setVisible(false);

    void (async () => {
      try {
        const accessToken = await getAccessToken();
        await createFolderRequest(accessToken, targetSection, name);
        if (await refreshListing()) {
          setPendingFolder((current) =>
            current?.id === pendingId ? null : current,
          );
        }
        showToast({
          title: "Folder created",
          message: `“${name}” is ready to use.`,
          variant: "success",
        });
      } catch (error) {
        setPendingFolder((current) =>
          current?.id === pendingId ? null : current,
        );
        showToast({
          title: "Folder creation failed",
          message:
            error instanceof Error
              ? error.message
              : "The folder could not be created.",
          variant: "error",
        });
      }
    })();
    return Promise.resolve();
  };

  return {
    visible,
    pendingFolder,
    open: () => setVisible(true),
    close: () => setVisible(false),
    create,
  };
}
