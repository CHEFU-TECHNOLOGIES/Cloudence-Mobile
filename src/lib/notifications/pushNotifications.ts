import { Platform } from "react-native";

export type PushPreferences = {
  quotaAlertsEnabled: boolean;
  collaboratorActivityEnabled: boolean;
};

export async function getPushPreferences(accessToken: string) {
  const { apiRequest } = await import("../api/client");
  return apiRequest<PushPreferences>(
    "/cloudence/notifications/preferences",
    accessToken,
  );
}

export async function requestAndRegisterPushDevice(
  accessToken: string,
  preferences: PushPreferences,
  askForPermission = true,
) {
  if (Platform.OS === "web") return "unsupported" as const;
  const native = await import("./pushNotifications.native");
  return native.requestAndRegisterPushDevice(
    accessToken,
    preferences,
    askForPermission,
  );
}

export async function syncPushPreferences(
  accessToken: string,
  preferences: PushPreferences,
) {
  const { apiRequest } = await import("../api/client");
  await apiRequest<{ saved: boolean }>(
    "/cloudence/notifications/preferences",
    accessToken,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    },
  );
}

export async function unregisterPushDevice(accessToken: string) {
  if (Platform.OS === "web") return;
  const native = await import("./pushNotifications.native");
  return native.unregisterPushDevice(accessToken);
}

export async function getPushPermissionGranted() {
  if (Platform.OS === "web") return false;
  const native = await import("./pushNotifications.native");
  return native.getPushPermissionGranted();
}

export function observePushNotifications(
  onUrl: (url: string) => void,
  onReceived: (notification: {
    title: string;
    body: string;
    type?: string;
  }) => void,
) {
  if (Platform.OS === "web") return () => {};
  let disposed = false;
  let unsubscribe: () => void = () => {};
  void import("./pushNotifications.native").then((native) => {
    if (disposed) return;
    unsubscribe = native.observePushNotifications(onUrl, onReceived);
  });
  return () => {
    disposed = true;
    unsubscribe();
  };
}
