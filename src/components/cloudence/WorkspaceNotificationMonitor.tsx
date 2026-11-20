import { useEffect, useRef } from "react";
import { useSession } from "../../auth/SessionContext";
import { useCloudenceData } from "../../data/CloudenceDataProvider";
import { useWorkspacePreferences } from "../../hooks/useWorkspacePreferences";
import { useToast } from "./ToastProvider";

export default function WorkspaceNotificationMonitor() {
  const { user } = useSession();
  const { usage, isLoading } = useCloudenceData();
  const { showToast } = useToast();
  const { isLoaded: preferencesLoaded, quotaAlertsEnabled } =
    useWorkspacePreferences();
  const previousUserId = useRef<string | null>(null);
  const previousQuotaPercent = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.id) {
      previousUserId.current = null;
      previousQuotaPercent.current = null;
      return;
    }
    if (previousUserId.current !== user.id) {
      previousUserId.current = user.id;
      previousQuotaPercent.current = null;
    }
    if (isLoading || !preferencesLoaded) return;

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
    isLoading,
    preferencesLoaded,
    quotaAlertsEnabled,
    showToast,
    usage,
    user?.id,
  ]);

  return null;
}
