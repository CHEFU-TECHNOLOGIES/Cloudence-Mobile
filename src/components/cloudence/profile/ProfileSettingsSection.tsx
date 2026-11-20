import { ChevronRight, LogOut } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { profileStyles as styles } from "../ProfileScreen.styles";
import { theme } from "../../../constants/theme";

const settingsOptions = [
  {
    title: "Shared Access & Team",
    subtitle: "Manage collaborator access to your files",
  },
  {
    title: "Notifications & Alerts",
    subtitle: "Quota limits and collaborator activity",
  },
  {
    title: "Workspace Preferences",
    subtitle: "Default upload views",
  },
];

type Props = {
  onSharedAccessPress: () => void;
  onNotificationsPress: () => void;
  onWorkspacePreferencesPress: () => void;
  onSwitchAccount: () => void;
  isSwitchingAccount: boolean;
  onSignOut: () => void;
};

export default function ProfileSettingsSection({
  onSharedAccessPress,
  onNotificationsPress,
  onWorkspacePreferencesPress,
  onSwitchAccount,
  isSwitchingAccount,
  onSignOut,
}: Props) {
  return (
    <>
      <View style={styles.optionsCard}>
        {settingsOptions.map(({ title, subtitle }, index) => (
          <Pressable
            key={title}
            style={[
              styles.optionRow,
              index === settingsOptions.length - 1 && styles.noBorder,
            ]}
            onPress={() => {
              if (title === "Shared Access & Team") {
                onSharedAccessPress();
              } else if (title === "Notifications & Alerts") {
                onNotificationsPress();
              } else if (title === "Workspace Preferences") {
                onWorkspacePreferencesPress();
              }
            }}
          >
            <View style={styles.optionTextBox}>
              <Text style={styles.optionTitle}>{title}</Text>
              <Text style={styles.optionSubtitle}>{subtitle}</Text>
            </View>
            <ChevronRight size={18} color={theme.colors.secondaryText} />
          </Pressable>
        ))}
      </View>

      <View style={styles.accountActionsCard}>
        <Pressable
          accessibilityRole="button"
          disabled={isSwitchingAccount}
          style={({ pressed }) => [
            styles.accountActionRow,
            pressed && { opacity: 0.7 },
            isSwitchingAccount && { opacity: 0.6 },
          ]}
          onPress={onSwitchAccount}
        >
          <View style={styles.optionTextBox}>
            <Text style={styles.optionTitle}>
              {isSwitchingAccount ? "Switching account..." : "Switch account"}
            </Text>
            <Text style={styles.optionSubtitle}>
              Choose another Cloudence account
            </Text>
          </View>
          <ChevronRight size={18} color={theme.colors.secondaryText} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && { backgroundColor: theme.colors.errorBg },
          ]}
          onPress={onSignOut}
        >
          <LogOut size={18} color={theme.colors.error} />
          <Text style={styles.logoutText}>Sign Out of Cloudence</Text>
        </Pressable>
      </View>
    </>
  );
}
