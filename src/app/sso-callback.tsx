import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";
import { theme } from "../constants/theme";
import { useSession } from "../auth/SessionContext";

export default function SsoCallbackScreen() {
  const { isSigningIn, status } = useSession();

  if (isSigningIn || status === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.brand} size="large" />
      </View>
    );
  }

  return (
    <Redirect href={status === "authenticated" ? "/" : "/sign-in"} />
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
