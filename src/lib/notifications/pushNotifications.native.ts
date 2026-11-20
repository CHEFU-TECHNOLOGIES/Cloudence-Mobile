import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";
import { apiRequest } from "../api/client";
import type { PushPreferences } from "./pushNotifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

export async function requestAndRegisterPushDevice(
  accessToken: string,
  preferences: PushPreferences,
  askForPermission = true,
) {
  if (!Device.isDevice || Platform.OS === "web") return "unsupported" as const;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("cloudence-alerts", {
      name: "Cloudence alerts",
      importance: AndroidImportance.DEFAULT,
    });
  }

  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && askForPermission) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!permission.granted) return "denied" as const;

  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId)
    throw new Error("The Expo project ID is missing from app configuration.");

  const expoPushToken = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;

  await apiRequest<{ registered: boolean }>(
    "/cloudence/notifications/device",
    accessToken,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expoPushToken, platform: Platform.OS }),
    },
  );
  await syncPushPreferences(accessToken, preferences);
  return "registered" as const;
}

export async function syncPushPreferences(
  accessToken: string,
  preferences: PushPreferences,
) {
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
  if (!Device.isDevice || Platform.OS === "web") return;
  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;
  const expoPushToken = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;
  await apiRequest<{ removed: boolean }>(
    "/cloudence/notifications/device",
    accessToken,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expoPushToken }),
    },
  );
}

export async function getPushPermissionGranted() {
  return (await Notifications.getPermissionsAsync()).granted;
}

export function observePushNotifications(
  onUrl: (url: string) => void,
  onReceived: (notification: {
    title: string;
    body: string;
    type?: string;
  }) => void,
) {
  const openNotification = (notification: Notifications.Notification) => {
    const url = notification.request.content.data?.url;
    if (typeof url === "string" && url.startsWith("/")) {
      onUrl(url);
      Notifications.clearLastNotificationResponse();
    }
  };
  const lastResponse = Notifications.getLastNotificationResponse();
  if (lastResponse) openNotification(lastResponse.notification);
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      onReceived({
        title: notification.request.content.title ?? "Cloudence update",
        body: notification.request.content.body ?? "",
        type:
          typeof notification.request.content.data?.type === "string"
            ? notification.request.content.data.type
            : undefined,
      });
    },
  );
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => openNotification(response.notification),
  );
  return () => {
    receivedSubscription.remove();
    subscription.remove();
  };
}
