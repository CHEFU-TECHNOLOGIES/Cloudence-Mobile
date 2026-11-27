import { useEffect } from "react";
import { AppState } from "react-native";
import { WORKSPACE_FRESH_MS } from "../lib/cache/cachePolicy";

// Revalidate while the app is visible and on return from the background.
export function useCacheRevalidation(refresh: () => Promise<unknown>, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const revalidate = () => {
      if (AppState.currentState === "active") void refresh().catch(() => undefined);
    };
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") revalidate();
    });
    const timer = setInterval(revalidate, WORKSPACE_FRESH_MS);
    return () => { clearInterval(timer); subscription.remove(); };
  }, [enabled, refresh]);
}
