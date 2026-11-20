import { useState } from "react";
import { router } from "expo-router";
import { RefreshControl, ScrollView, StatusBar, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSession } from "../../auth/SessionContext";
import ProfileIdentityCard from "../../components/cloudence/profile/ProfileIdentityCard";
import ProfileSettingsSection from "../../components/cloudence/profile/ProfileSettingsSection";
import StorageBreakdownCard from "../../components/cloudence/profile/StorageBreakdownCard";
import StorageBreakdownSkeleton from "../../components/cloudence/skeletons/StorageBreakdownSkeleton";
import { profileStyles as styles } from "../../components/cloudence/ProfileScreen.styles";
import WorkspaceStatus from "../../components/cloudence/WorkspaceStatus";
import { theme } from "../../constants/theme";
import { useCloudenceData } from "../../data/CloudenceDataProvider";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import ConfirmDialog from "../../components/cloudence/ConfirmDialog";
import { useToast } from "../../components/cloudence/ToastProvider";

export default function ProfileScreen() {
  const layout = useResponsiveLayout();
  const { user, signOut, signIn, isSigningIn } = useSession();
  const [isSignOutDialogVisible, setIsSignOutDialogVisible] = useState(false);
  const { showToast } = useToast();
  const { usage, isLoading, isRefreshing, isOffline, error, refresh } =
    useCloudenceData();

  const handleSignOut = async () => {
    setIsSignOutDialogVisible(false);
    try {
      await signOut();
    } catch (signOutError) {
      showToast({
        title: "Sign out failed",
        message:
          signOutError instanceof Error
            ? signOutError.message
            : "Your session could not be cleared.",
        variant: "error",
      });
    }
  };

  const handleSwitchAccount = async () => {
    try {
      await signIn();
    } catch (switchError) {
      showToast({
        title: "Could not switch account",
        message:
          switchError instanceof Error
            ? switchError.message
            : "Please try again in a moment.",
        variant: "error",
      });
    }
  };

  const handleRefresh = async () => {
    const succeeded = await refresh();
    if (!succeeded) {
      showToast({
        title: "Refresh failed",
        message: "We couldn't refresh your workspace. Please try again.",
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={theme.colors.brand}
            colors={[theme.colors.brand]}
          />
        }
      >
        <Text style={styles.title}>Account & Workspace</Text>
        <Text style={styles.subtitle}>
          Manage your personal profile, storage quota, and security.
        </Text>

        <WorkspaceStatus
          error={error}
          offline={isOffline}
          onRetry={handleRefresh}
        />

        <ProfileIdentityCard user={user} />
        {usage ? (
          <StorageBreakdownCard usage={usage} />
        ) : isLoading ? (
          <StorageBreakdownSkeleton />
        ) : null}
        <ProfileSettingsSection
          onSharedAccessPress={() => router.push("/shared-access")}
          onNotificationsPress={() => router.push("/notifications-settings")}
          onWorkspacePreferencesPress={() =>
            router.push("/workspace-preferences")
          }
          onSwitchAccount={() => void handleSwitchAccount()}
          isSwitchingAccount={isSigningIn}
          onSignOut={() => setIsSignOutDialogVisible(true)}
        />
      </ScrollView>
      <ConfirmDialog
        visible={isSignOutDialogVisible}
        title="Sign out?"
        message="Are you sure you want to sign out of your Cloudence workspace?"
        confirmLabel="Sign Out"
        destructive
        onCancel={() => setIsSignOutDialogVisible(false)}
        onConfirm={() => void handleSignOut()}
      />
    </SafeAreaView>
  );
}
