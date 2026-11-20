import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { theme } from "../constants/theme";
import { SessionProvider, useSession } from "../auth/SessionContext";
import { CloudenceDataProvider } from "../data/CloudenceDataProvider";

function AppNavigator() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.brand} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sso-callback" />
      <Stack.Protected
        guard={status === "authenticated"}
        redirectTo="/sign-in"
      >
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected
        guard={status !== "authenticated"}
        redirectTo="/"
      >
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
          <AppNavigator />
        </CloudenceDataProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
});
