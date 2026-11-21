import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react-native";
import {
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { notificationsSettingsStyles as styles } from "../components/cloudence/NotificationsSettingsScreen.styles";
import { theme } from "../constants/theme";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { setCollaboratorActivityEnabled, setQuotaAlertsEnabled, useWorkspacePreferences } from "../hooks/useWorkspacePreferences";
import { useSession } from "../auth/SessionContext";
import { getPushPermissionGranted, requestAndRegisterPushDevice, syncPushPreferences } from "../lib/notifications/pushNotifications";
import { useToast } from "../components/cloudence/ToastProvider";

export default function NotificationsSettingsScreen() {
  const layout = useResponsiveLayout();
  const { getAccessToken } = useSession();
  const { showToast } = useToast();
  const {
    quotaAlertsEnabled,
    collaboratorActivityEnabled,
    isLoaded: preferencesLoaded,
  } = useWorkspacePreferences();
  const [pushPermissionGranted, setPushPermissionGranted] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    let active = true;
    void getPushPermissionGranted()
      .then((granted) => {
        if (active) setPushPermissionGranted(granted);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const enablePushNotifications = async () => {
    if (isRequestingPermission || !preferencesLoaded) return;
    setIsRequestingPermission(true);
    try {
      const result = await requestAndRegisterPushDevice(
        await getAccessToken(),
        { quotaAlertsEnabled, collaboratorActivityEnabled },
      );
      setPushPermissionGranted(result === "registered");
      showToast({
        title:
          result === "registered"
            ? "Push notifications enabled"
            : "Notifications not enabled",
        message:
          result === "registered"
            ? "Cloudence can now alert you while the app is closed."
            : result === "denied"
              ? "Allow notifications in your device settings to receive alerts."
              : "Push notifications require a physical device.",
        variant: result === "registered" ? "success" : "info",
      });
    } catch (error) {
      showToast({
        title: "Could not enable notifications",
        message:
          error instanceof Error
            ? error.message
            : "Please try again after checking your connection.",
        variant: "error",
      });
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const updatePreferences = async (
    next: { quotaAlertsEnabled: boolean; collaboratorActivityEnabled: boolean },
  ) => {
    try {
      await syncPushPreferences(await getAccessToken(), next);
    } catch (error) {
      showToast({
        title: "Could not sync notification settings",
        message:
          error instanceof Error
            ? error.message
            : "Your change is saved on this device and will sync when you reconnect.",
        variant: "error",
      });
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            width: "100%",
            maxWidth: layout.contentMaxWidth,
            alignSelf: "center",
            paddingHorizontal: layout.horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to account settings"
            style={styles.backButton}
          >
            <ChevronLeft size={21} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Notifications &amp; Alerts</Text>
            <Text style={styles.subtitle}>
              Choose which workspace updates you want to receive.
            </Text>
          </View>
        </View>

        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>
            {pushPermissionGranted
              ? "Push notifications are enabled"
              : "Enable push notifications"}
          </Text>
          <Text style={styles.permissionDescription}>
            Receive Cloudence alerts when the app is in the background or
            closed.
          </Text>
          {!pushPermissionGranted && (
            <Pressable
              accessibilityRole="button"
              disabled={isRequestingPermission || !preferencesLoaded}
              onPress={() => void enablePushNotifications()}
              style={({ pressed }) => [
                styles.permissionButton,
                (pressed || isRequestingPermission || !preferencesLoaded) && {
                  opacity: 0.65,
                },
              ]}
            >
              <Text style={styles.permissionButtonText}>
                {isRequestingPermission ? "Enabling..." : "Enable alerts"}
              </Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionTitle}>Workspace alerts</Text>
        <Text style={styles.sectionSubtitle}>
          Manage storage and collaborator activity preferences.
        </Text>
        <View style={styles.card}>
          <AlertToggle
            title="Storage quota"
            description="Alert when workspace storage usage reaches 80%."
            enabled={quotaAlertsEnabled}
            onToggle={() => {
              const enabled = !quotaAlertsEnabled;
              setQuotaAlertsEnabled(enabled);
              void updatePreferences({
                quotaAlertsEnabled: enabled,
                collaboratorActivityEnabled,
              });
            }}
            border
          />
          <AlertToggle
            title="Collaborator activity"
            description="Alert when you are given or removed from a shared file."
            enabled={collaboratorActivityEnabled}
            onToggle={() => {
              const enabled = !collaboratorActivityEnabled;
              setCollaboratorActivityEnabled(enabled);
              void updatePreferences({
                quotaAlertsEnabled,
                collaboratorActivityEnabled: enabled,
              });
            }}
          />
        </View>
        <Text style={styles.note}>
          Changes are saved on this device and synced to your Cloudence account.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function AlertToggle({
  title,
  description,
  enabled,
  onToggle,
  border = false,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  border?: boolean;
}) {
  return (
    <View style={[styles.row, border && styles.rowBorder]}>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}
        accessibilityLabel={title}
        onPress={onToggle}
        style={[
          styles.switchTrack,
          {
            backgroundColor: enabled ? theme.colors.brand : theme.colors.border,
          },
        ]}
      >
        <View style={[styles.switchThumb, enabled && styles.switchOn]} />
      </Pressable>
    </View>
  );
}
