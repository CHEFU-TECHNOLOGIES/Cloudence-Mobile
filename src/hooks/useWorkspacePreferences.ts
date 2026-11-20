import { useEffect, useSyncExternalStore } from "react";
import Store from "expo-sqlite/kv-store";
import { ViewType } from "../types/file";

const VIEW_KEY = "cloudence.preference.default-file-view";
const QUOTA_ALERTS_KEY = "cloudence.preference.quota-alerts";
const COLLABORATOR_ALERTS_KEY = "cloudence.preference.collaborator-alerts";

type Preferences = {
  defaultFileView: ViewType;
  quotaAlertsEnabled: boolean;
  collaboratorActivityEnabled: boolean;
  isLoaded: boolean;
};

const DEFAULT_PREFERENCES: Preferences = {
  defaultFileView: "grid",
  quotaAlertsEnabled: true,
  collaboratorActivityEnabled: true,
  isLoaded: false,
};

let preferences = DEFAULT_PREFERENCES;
let initialized = false;
let initialization: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function initializePreferences() {
  if (initialization) return initialization;
  initialization = Promise.all([
    Store.getItem(VIEW_KEY),
    Store.getItem(QUOTA_ALERTS_KEY),
    Store.getItem(COLLABORATOR_ALERTS_KEY),
  ])
    .then(([view, quotaAlerts, collaboratorAlerts]) => {
      preferences = {
        defaultFileView:
          view === "grid" || view === "list"
            ? view
            : DEFAULT_PREFERENCES.defaultFileView,
        quotaAlertsEnabled: quotaAlerts !== "false",
        collaboratorActivityEnabled: collaboratorAlerts !== "false",
        isLoaded: true,
      };
      initialized = true;
      emitChange();
    })
    .catch(() => {
      initialized = true;
      preferences = { ...preferences, isLoaded: true };
      emitChange();
    });
  return initialization;
}

export function setDefaultFileView(view: ViewType) {
  preferences = { ...preferences, defaultFileView: view };
  emitChange();
  void Store.setItem(VIEW_KEY, view).catch(() => undefined);
}

export function setQuotaAlertsEnabled(enabled: boolean) {
  preferences = { ...preferences, quotaAlertsEnabled: enabled };
  emitChange();
  void Store.setItem(QUOTA_ALERTS_KEY, String(enabled)).catch(() => undefined);
}

export function setCollaboratorActivityEnabled(enabled: boolean) {
  preferences = { ...preferences, collaboratorActivityEnabled: enabled };
  emitChange();
  void Store.setItem(COLLABORATOR_ALERTS_KEY, String(enabled)).catch(
    () => undefined,
  );
}

export function useWorkspacePreferences() {
  const value = useSyncExternalStore(
    subscribe,
    () => preferences,
    () => DEFAULT_PREFERENCES,
  );

  useEffect(() => {
    if (!initialized) void initializePreferences();
  }, []);

  return value;
}
