import React from "react";
import { useIsFocused } from "expo-router";
import PersistentStatusToast from "./PersistentStatusToast";
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
  const isFocused = useIsFocused();
  if (!isFocused || (!error && !offline)) return null;

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

  return (
    <PersistentStatusToast
      message={
        offline
          ? "You're offline. Some features may be unavailable."
          : error ?? ""
      }
      isError={!offline}
      onRetry={!offline ? () => void retry() : undefined}
    />
  );
}
