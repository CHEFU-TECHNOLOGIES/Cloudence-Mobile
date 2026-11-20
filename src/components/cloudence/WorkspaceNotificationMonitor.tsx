import { useEffect, useRef } from "react";
import { useSession } from "../../auth/SessionContext";
import { useCloudenceData } from "../../data/CloudenceDataProvider";
import { CloudFile } from "../../types/file";
import { useWorkspacePreferences } from "../../hooks/useWorkspacePreferences";
import { useToast } from "./ToastProvider";

type AccessSnapshot = Map<string, string[]>;

function getOwnedAccessSnapshot(
  files: CloudFile[],
  userId: string,
): AccessSnapshot {
  return new Map(
    files
      .filter((file) => file.owner.id === userId)
      .map((file) => [file.id, [...file.users].sort()]),
  );
}

function getAccessChanges(
  previous: AccessSnapshot,
  current: AccessSnapshot,
  files: CloudFile[],
) {
  const names = new Set<string>();
  for (const [fileId, users] of current) {
    const oldUsers = previous.get(fileId) ?? [];
    if (
      users.length !== oldUsers.length ||
      users.some((user, i) => user !== oldUsers[i])
    ) {
      const fileName = files.find((file) => file.id === fileId)?.name;
      if (fileName) names.add(fileName);
    }
  }
  for (const fileId of previous.keys()) {
    if (!current.has(fileId)) {
      const fileName = files.find((file) => file.id === fileId)?.name;
      if (fileName) names.add(fileName);
    }
  }
  return [...names];
}

export default function WorkspaceNotificationMonitor() {
  const { user } = useSession();
  const { files, usage, isLoading } = useCloudenceData();
  const { showToast } = useToast();
  const {
    isLoaded: preferencesLoaded,
    quotaAlertsEnabled,
    collaboratorActivityEnabled,
  } = useWorkspacePreferences();
  const previousUserId = useRef<string | null>(null);
  const previousAccess = useRef<AccessSnapshot | null>(null);
  const previousQuotaPercent = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.id) {
      previousUserId.current = null;
      previousAccess.current = null;
      previousQuotaPercent.current = null;
      return;
    }
    if (previousUserId.current !== user.id) {
      previousUserId.current = user.id;
      previousAccess.current = null;
      previousQuotaPercent.current = null;
    }
    if (isLoading || !preferencesLoaded) return;

    const currentAccess = getOwnedAccessSnapshot(files, user.id);
    if (previousAccess.current) {
      const changes = getAccessChanges(
        previousAccess.current,
        currentAccess,
        files,
      );
      if (collaboratorActivityEnabled && changes.length > 0) {
        const fileSummary = changes.slice(0, 2).join(", ");
        const remaining = changes.length - 2;
        showToast({
          title: "Collaborator access changed",
          message: `Access updated for ${fileSummary}${remaining > 0 ? ` and ${remaining} more file${remaining === 1 ? "" : "s"}` : ""}.`,
          variant: "info",
        });
      }
    }
    previousAccess.current = currentAccess;

    if (!usage || usage.all <= 0) return;
    const quotaPercent = (usage.used / usage.all) * 100;
    const previousPercent = previousQuotaPercent.current;
    if (
      quotaAlertsEnabled &&
      previousPercent !== null &&
      previousPercent < 80 &&
      quotaPercent >= 80
    ) {
      showToast({
        title: "Storage almost full",
        message: `${Math.round(quotaPercent)}% of your workspace storage is in use.`,
        variant: "info",
      });
    }
    previousQuotaPercent.current = quotaPercent;
  }, [
    collaboratorActivityEnabled,
    files,
    isLoading,
    preferencesLoaded,
    quotaAlertsEnabled,
    showToast,
    usage,
    user?.id,
  ]);

  return null;
}
