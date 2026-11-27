import React from "react";
import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "../auth/SessionContext";
import { CloudenceDataProvider } from "../data/CloudenceDataProvider";
import CenteredPageSkeleton from "../components/cloudence/skeletons/CenteredPageSkeleton";
import { ToastProvider } from "../components/cloudence/ToastProvider";
import WorkspaceNotificationMonitor from "../components/cloudence/WorkspaceNotificationMonitor";
import PushNotificationBootstrap from "../components/cloudence/PushNotificationBootstrap";
import { SubscriptionPromotionProvider } from "../components/cloudence/subscription/SubscriptionPromotionProvider";

if (!__DEV__) {
  Sentry.init({
    dsn: "https://320295e43f92df0ff5b8b183614f091f@o4512011915296768.ingest.de.sentry.io/4512500610105424",
    sendDefaultPii: true,
    enableLogs: true,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
  });
}

function AppNavigator() {
  const { status } = useSession();

  if (status === "loading") {
    return <CenteredPageSkeleton />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="sso-callback" />
      <Stack.Protected guard={status === "authenticated"} redirectTo="/sign-in">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="shared-access" />
        <Stack.Screen name="workspace-preferences" />
        <Stack.Screen name="notifications-settings" />
        <Stack.Screen name="storage-health" />
      </Stack.Protected>
      <Stack.Protected guard={status !== "authenticated"} redirectTo="/">
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <CloudenceDataProvider>
          <ToastProvider>
            <WorkspaceNotificationMonitor />
            <PushNotificationBootstrap />
            <SubscriptionPromotionProvider>
              <AppNavigator />
            </SubscriptionPromotionProvider>
          </ToastProvider>
        </CloudenceDataProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

export default __DEV__ ? RootLayout : Sentry.wrap(RootLayout);
