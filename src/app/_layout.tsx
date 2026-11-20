import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "../auth/SessionContext";
import { CloudenceDataProvider } from "../data/CloudenceDataProvider";
import CenteredPageSkeleton from "../components/cloudence/skeletons/CenteredPageSkeleton";
import { ToastProvider } from "../components/cloudence/ToastProvider";
import WorkspaceNotificationMonitor from "../components/cloudence/WorkspaceNotificationMonitor";
import PushNotificationBootstrap from "../components/cloudence/PushNotificationBootstrap";

function AppNavigator() {
  const { status } = useSession();

  if (status === "loading") {
    return <CenteredPageSkeleton />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sso-callback" />
      <Stack.Protected guard={status === "authenticated"} redirectTo="/sign-in">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="shared-access" />
        <Stack.Screen name="workspace-preferences" />
        <Stack.Screen name="notifications-settings" />
      </Stack.Protected>
      <Stack.Protected guard={status !== "authenticated"} redirectTo="/">
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <CloudenceDataProvider>
          <ToastProvider>
            <WorkspaceNotificationMonitor />
            <PushNotificationBootstrap />
            <AppNavigator />
          </ToastProvider>
        </CloudenceDataProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
