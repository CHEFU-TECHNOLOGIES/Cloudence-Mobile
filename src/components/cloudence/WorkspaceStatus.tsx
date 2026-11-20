import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { RefreshCw } from "lucide-react-native";
import { theme } from "../../constants/theme";
import { useToast } from "./ToastProvider";

type Props = {
  error: string | null;
  offline?: boolean;
  onRetry: () => void | Promise<unknown>;
};

export default function WorkspaceStatus({
  error,
  offline = false,
  onRetry,
}: Props) {
  const { showToast } = useToast();
  if (!error && !offline) return null;

  const retry = async () => {
    try {
      const result = await onRetry();
      if (result === false) {
        showToast({
          title: "Refresh failed",
          message: "We couldn't refresh your workspace. Please try again.",
          variant: "error",
        });
      }
    } catch (retryError) {
      showToast({
        title: "Refresh failed",
        message:
          retryError instanceof Error
            ? retryError.message
            : "We couldn't refresh your workspace. Please try again.",
        variant: "error",
      });
    }
  };

  const message = offline
    ? "You're offline. Some features may be unavailable."
    : error;

  return (
    <View
      style={[styles.container, !offline && styles.errorContainer]}
      accessibilityRole={!offline ? "alert" : "summary"}
    >
      <View style={styles.messageContent}>
        <Text style={[styles.message, !offline && styles.errorMessage]}>
          {message}
        </Text>
        {!offline && (
          <Pressable
            onPress={() => void retry()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading workspace"
            style={({ pressed }) => [
              styles.retryButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <RefreshCw size={15} color={theme.colors.brand} />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    marginBottom: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  errorContainer: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  messageContent: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  message: {
    color: theme.colors.secondaryText,
    fontSize: 12,
    lineHeight: 18,
  },
  errorMessage: {
    color: theme.colors.error,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingVertical: 4,
  },
  retryText: {
    color: theme.colors.brand,
    fontSize: 12,
    fontWeight: "700",
  },
});
