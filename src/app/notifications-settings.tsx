import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { notificationsSettingsStyles as styles } from "../components/cloudence/NotificationsSettingsScreen.styles";
import { theme } from "../constants/theme";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import {
  setCollaboratorActivityEnabled,
  setQuotaAlertsEnabled,
  useWorkspacePreferences,
} from "../hooks/useWorkspacePreferences";

export default function NotificationsSettingsScreen() {
  const layout = useResponsiveLayout();
  const { quotaAlertsEnabled, collaboratorActivityEnabled } =
    useWorkspacePreferences();

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

        <Text style={styles.sectionTitle}>Workspace alerts</Text>
        <Text style={styles.sectionSubtitle}>
          Manage storage and collaborator activity preferences.
        </Text>
        <View style={styles.card}>
          <AlertToggle
            title="Storage quota"
            description="Show an in-app alert when storage usage reaches 80%."
            enabled={quotaAlertsEnabled}
            onToggle={() => setQuotaAlertsEnabled(!quotaAlertsEnabled)}
            border
          />
          <AlertToggle
            title="Collaborator activity"
            description="Show an in-app alert when access to one of your files changes."
            enabled={collaboratorActivityEnabled}
            onToggle={() =>
              setCollaboratorActivityEnabled(!collaboratorActivityEnabled)
            }
          />
        </View>
        <Text style={styles.note}>Changes are saved on this device.</Text>
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
