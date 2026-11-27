import React from "react";
import * as Sentry from "@sentry/react-native";
import { router, Stack, useSegments } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "../auth/SessionContext";
import { CloudenceDataProvider } from "../data/CloudenceDataProvider";
import CenteredPageSkeleton from "../components/cloudence/skeletons/CenteredPageSkeleton";
import { ToastProvider, useToast } from "../components/cloudence/ToastProvider";
import DocumentScanner from "../components/DocumentScanner";
import {
  FileUploadQueueProvider,
  useFileUploadQueue,
} from "../components/cloudence/FileUploadQueueContext";
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
    <FileUploadQueueProvider key={status}>
      <AuthenticatedNavigator />
    </FileUploadQueueProvider>
  );
}

function AuthenticatedNavigator() {
  const { status } = useSession();
  const segments = useSegments();
  const { addAssetsToQueue, requestFilesUpload } = useFileUploadQueue();
  const { showToast } = useToast();

  return (
    <View style={{ flex: 1 }}>
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
      <DocumentScanner
        visible={status === "authenticated" && segments[0] === "(tabs)"}
        onScanned={(asset) => {
          addAssetsToQueue([asset]);
          requestFilesUpload();
          router.navigate("/files");
          showToast({
            title: "Scan ready",
            message: "PDF added to the Files upload queue.",
            variant: "success",
          });
        }}
        onError={(error) =>
          showToast({
            title: "Could not scan document",
            message: error.message,
            variant: "error",
          })
        }
      />
    </View>
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
