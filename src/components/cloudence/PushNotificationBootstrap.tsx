import { useEffect, useRef } from "react";
import { router, type Href } from "expo-router";
import { useSession } from "../../auth/SessionContext";
import {
  setCollaboratorActivityEnabled,
  setQuotaAlertsEnabled,
  useWorkspacePreferences,
} from "../../hooks/useWorkspacePreferences";
import { useToast } from "./ToastProvider";
import {
  requestAndRegisterPushDevice,
  getPushPreferences,
  observePushNotifications,
  syncPushPreferences,
} from "../../lib/notifications/pushNotifications";

export default function PushNotificationBootstrap() {
  const { user, status, getAccessToken } = useSession();
  const { showToast } = useToast();
  const { isLoaded, quotaAlertsEnabled, collaboratorActivityEnabled } =
    useWorkspacePreferences();
  const preferencesSyncedUser = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !user?.id || !isLoaded) return;
    let active = true;
    preferencesSyncedUser.current = null;

    void getAccessToken()
      .then(async (accessToken) => {
        const preferences = await getPushPreferences(accessToken);
        if (!active) return;
        setQuotaAlertsEnabled(preferences.quotaAlertsEnabled);
        setCollaboratorActivityEnabled(preferences.collaboratorActivityEnabled);
        const result = await requestAndRegisterPushDevice(
          accessToken,
          preferences,
          false,
        );
        if (result !== "registered") {
          await syncPushPreferences(accessToken, preferences);
        }
        if (active) preferencesSyncedUser.current = user.id;
      })
      .catch(() => {
        // Push registration is best-effort; the rest of the workspace remains available.
      });

    return () => {
      active = false;
    };
  }, [
    getAccessToken,
    isLoaded,
    status,
    user?.id,
  ]);

  useEffect(() => {
    if (
      status !== "authenticated" ||
      !user?.id ||
      !isLoaded ||
      preferencesSyncedUser.current !== user.id
    ) {
      return;
    }
    const preferences = { quotaAlertsEnabled, collaboratorActivityEnabled };
    void getAccessToken()
      .then((accessToken) => syncPushPreferences(accessToken, preferences))
      .catch(() => undefined);
  }, [
    collaboratorActivityEnabled,
    getAccessToken,
    isLoaded,
    quotaAlertsEnabled,
    status,
    user?.id,
  ]);

  useEffect(
    () =>
      observePushNotifications(
        (url) => router.push(url as Href),
        ({ title, body, type }) => {
          if (type === "collaborator") {
            showToast({ title, message: body, variant: "info" });
          }
        },
      ),
    [showToast],
  );

  return null;
}
